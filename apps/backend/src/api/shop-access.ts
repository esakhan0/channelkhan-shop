import type { AuthenticatedMedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { issueShopAccess, verifyShopAccess } from "../lib/shop-access"

function denied(): never {
  throw new MedusaError(MedusaError.Types.NOT_FOUND, "Resource not found")
}

export async function requireCartAccess(req: AuthenticatedMedusaRequest, cartId: unknown) {
  if (typeof cartId !== "string" || !cartId) denied()
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({ entity: "cart", fields: ["id", "customer_id"], filters: { id: cartId } })
  const cart = carts[0]
  if (!cart) denied()
  const actor = req.auth_context?.actor_id
  if (actor && cart.customer_id === actor) return
  if (!verifyShopAccess(req.headers["x-cart-access-token"], "cart", cart.id)) denied()
}

export async function protectCart(req: AuthenticatedMedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  await requireCartAccess(req, req.params.id)
  res.setHeader("Cache-Control", "private, no-store")
  next()
}

export async function protectOrder(req: AuthenticatedMedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "order", fields: ["id", "customer_id"], filters: { id: req.params.id, is_draft_order: false } })
  const order = data[0]
  if (!order) denied()
  const actor = req.auth_context?.actor_id
  // A signed-in customer can only access their own order. Guests need a receipt capability.
  if (actor ? order.customer_id !== actor : !verifyShopAccess(req.headers["x-order-access-token"], "order", order.id)) denied()
  res.setHeader("Cache-Control", "private, no-store")
  next()
}

export async function protectPaymentCollection(req: AuthenticatedMedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "cart_payment_collection", fields: ["cart_id"], filters: { payment_collection_id: req.params.id } })
  await requireCartAccess(req, data[0]?.cart_id)
  res.setHeader("Cache-Control", "private, no-store")
  next()
}

export async function protectCartBody(req: AuthenticatedMedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  await requireCartAccess(req, (req.body as { cart_id?: unknown })?.cart_id)
  next()
}

export async function protectShippingList(req: AuthenticatedMedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  await requireCartAccess(req, req.query.cart_id)
  next()
}

// Attach a capability only to a successful creation/completion response. Completion
// is already protected by protectCart and Medusa's payment/inventory workflow.
export function attachAccessToken(purpose: "cart" | "order") {
  return (_req: AuthenticatedMedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    const json = res.json.bind(res)
    res.json = (body) => {
      const payload = body as { type?: string; cart?: { id: string }; order?: { id: string } } | null
      const resource = payload?.[purpose]
      if (res.statusCode < 300 && resource?.id && (purpose === "cart" || payload?.type === "order")) {
        body = { ...payload, [`${purpose}_access_token`]: issueShopAccess(purpose, resource.id) }
      }
      res.setHeader("Cache-Control", "private, no-store")
      return json(body)
    }
    next()
  }
}
