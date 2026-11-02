import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { REFUND_REQUEST_MODULE } from "../modules/refund-request"
import RefundRequestModuleService from "../modules/refund-request/service"
import { CustomerRefundInput } from "../modules/refund-request/validation"
import { ownedRefundOrder, requestableQuantity } from "../modules/refund-request/order"
import { emitEventStep } from "@medusajs/medusa/core-flows"

const saveRefundRequestStep = createStep("save-refund-request", async (
  input: CustomerRefundInput & { customer_id: string }, { container }
) => {
  const locking = container.resolve(Modules.LOCKING)
  const service = container.resolve<RefundRequestModuleService>(REFUND_REQUEST_MODULE)
  const request = await locking.execute(`customer-return:${input.order_id}`, async () => {
    const order = await ownedRefundOrder(container, input.customer_id, input.order_id)
    if (order.status === "canceled") throw new MedusaError(MedusaError.Types.INVALID_DATA, "This order is already canceled")
    const open = await service.listRefundRequests({ order_id: order.id, status: ["pending", "reviewing"] })
    if (open.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "An open request already exists for this order")
    const seen = new Set<string>()
    const items = input.items.map((selected) => {
      const item = order.items?.find((candidate) => candidate?.id === selected.id)
      if (!item || seen.has(selected.id) || selected.quantity > requestableQuantity(item, input.kind)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Check the selected items and quantities")
      }
      seen.add(selected.id)
      return { id: item.id, title: item.title, quantity: selected.quantity }
    })
    return service.createRefundRequests({
      customer_id: input.customer_id, order_id: order.id, order_display_id: Number(order.display_id),
      kind: input.kind, items: { lines: items }, customer_note: input.customer_note,
    })
  }, { timeout: 10 })
  return new StepResponse(request)
})

// Intake only. Native Medusa admin workflows still own all refunds, cancellations and inventory changes.
export const requestRefundWorkflow = createWorkflow("request-refund", (
  input: CustomerRefundInput & { customer_id: string }
) => {
  const request = saveRefundRequestStep(input)
  emitEventStep({ eventName: "shop.refund-requested", data: { id: request.id } })
  return new WorkflowResponse(request)
})
