import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deliveredReturnQuantity, ownedReturnOrder, returnFields, returnShippingOptions } from "../../../../utils/customer-returns"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const order = await ownedReturnOrder(req, req.params.id)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const [options, { data: returns }, { data: reasons }] = await Promise.all([
    returnShippingOptions(req, order.cart?.id),
    query.graph({ entity: "return", fields: returnFields, filters: { order_id: order.id } }),
    query.graph({ entity: "return_reason", fields: ["id", "label"], filters: {} }),
  ])
  res.setHeader("Cache-Control", "private, no-store")
  res.json({
    order: { id: order.id, display_id: order.display_id, currency_code: order.currency_code,
      items: order.items?.filter((item) => item !== null).map((item) => ({ id: item.id, title: item.title, thumbnail: item.thumbnail,
        returnable_quantity: order.status === "canceled" ? 0 : deliveredReturnQuantity(item.detail) })) },
    shipping_options: options, returns, reasons,
  })
}
