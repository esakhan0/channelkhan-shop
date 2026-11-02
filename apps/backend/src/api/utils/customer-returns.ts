import { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { listShippingOptionsForCartWorkflow } from "@medusajs/medusa/core-flows"

export const returnFields = [
  "id", "display_id", "order_id", "status", "created_at", "received_at",
  "canceled_at", "items.item_id", "items.quantity", "items.received_quantity",
  "items.reason.label", "items.item.title", "order.display_id",
]

export async function ownedReturnOrder(req: AuthenticatedMedusaRequest, id: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "status", "display_id", "currency_code", "cart.id",
      "items.id", "items.title", "items.thumbnail", "items.detail.delivered_quantity",
      "items.detail.return_requested_quantity", "items.detail.return_received_quantity",
      "items.detail.return_dismissed_quantity"],
    filters: { id, customer_id: req.auth_context.actor_id, is_draft_order: false },
  })
  if (!data[0]) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  }
  return data[0]
}

export function deliveredReturnQuantity(detail: Record<string, unknown> | null | undefined) {
  const number = (key: string) => Number(detail?.[key] ?? 0)
  return Math.max(0, Math.floor(number("delivered_quantity") -
    number("return_requested_quantity") - number("return_received_quantity") -
    number("return_dismissed_quantity")))
}

export async function returnShippingOptions(req: AuthenticatedMedusaRequest, cartId?: string) {
  if (!cartId) return []
  const { result } = await listShippingOptionsForCartWorkflow(req.scope).run({
    input: { cart_id: cartId, is_return: true },
  })
  // The native return workflow currently calculates only flat return rates.
  return result.filter((option) => option.price_type === "flat" &&
    option.calculated_price?.calculated_amount != null).map((option) => ({
    id: option.id, name: option.name,
    amount: Number(option.calculated_price!.calculated_amount),
  }))
}
