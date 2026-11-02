import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REFUND_REQUEST_MODULE } from "../../../../../modules/refund-request"
import RefundRequestModuleService from "../../../../../modules/refund-request/service"
import { ownedRefundOrder, requestableQuantity, customerRequestView } from "../../../../../modules/refund-request/order"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const order = await ownedRefundOrder(req.scope, req.auth_context.actor_id, req.params.id)
  const service = req.scope.resolve<RefundRequestModuleService>(REFUND_REQUEST_MODULE)
  const requests = await service.listRefundRequests({ order_id: order.id, customer_id: req.auth_context.actor_id }, {
    order: { created_at: "DESC" }, take: 100,
  })
  const open = requests.some((request) => ["pending", "reviewing"].includes(request.status))
  res.setHeader("Cache-Control", "no-store")
  res.json({
    order: { id: order.id, display_id: order.display_id, status: order.status,
      items: order.items?.filter(Boolean).map((item) => ({ id: item!.id, title: item!.title,
        requestable_quantity: order.status === "canceled" || open ? 0 : requestableQuantity(item!, "cancellation"),
        faulty_quantity: order.status === "canceled" || open ? 0 : requestableQuantity(item!, "refund"),
        awaiting_delivery: Math.max(0, Number(item!.quantity) - Number(item!.detail?.delivered_quantity ?? 0)),
        fulfillment_started: Number(item!.detail?.fulfilled_quantity ?? 0) > 0 || Number(item!.detail?.shipped_quantity ?? 0) > 0,
      })) },
    has_open_request: open,
    requests: requests.map(customerRequestView),
  })
}
