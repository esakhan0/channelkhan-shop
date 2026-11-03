import { createStep, createWorkflow, StepResponse, WorkflowResponse, transform, when } from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { cancelOrderWorkflow, refundPaymentWorkflow, emitEventStep } from "@medusajs/medusa/core-flows"
import { REFUND_REQUEST_MODULE } from "../modules/refund-request"
import RefundRequestModuleService from "../modules/refund-request/service"
import { ResolveRefundInput } from "../modules/refund-request/validation"
import { resolutionContext, resolutionOrder } from "../modules/refund-request/resolution"

type Input = ResolveRefundInput & { id: string; reviewed_by: string }

const prepareRefundRequestResolution = createStep("prepare-refund-request-resolution", async (input: Input, { container }) => {
  const service = container.resolve<RefundRequestModuleService>(REFUND_REQUEST_MODULE)
  const plan = await container.resolve(Modules.LOCKING).execute(`resolve-request:${input.id}`, async () => {
    const request = await service.retrieveRefundRequest(input.id)
    if (request.resolution) {
      if (request.resolution.state === "completed") {
        if (request.resolution.action !== input.action || (input.action === "refund_payment" &&
          (request.resolution.payment_id !== input.payment_id || request.resolution.amount !== input.amount))) {
          throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This request was already processed with a different action or amount")
        }
        return { order_id: request.order_id, skip: true }
      }
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED,
        "This action has already started. Check the order and payment records before resolving it manually; it will not be sent again.")
    }
    if (!["pending", "reviewing"].includes(request.status)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Only an open request can be accepted")
    }
    const context = resolutionContext(await resolutionOrder(container, request.order_id), request)
    if (input.action === "cancel_order" && !context.can_cancel) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED,
        "Automatic cancellation requires the entire order and no active fulfilments. Use the order controls for partial or fulfilled orders.")
    }
    if (input.action === "refund_payment") {
      const payment = context.payments.find((payment) => payment.id === input.payment_id)
      const decimals = new Intl.NumberFormat("en", { style: "currency", currency: context.currency_code }).resolvedOptions().maximumFractionDigits ?? 2
      if (request.kind !== "refund" || !payment || input.amount > payment.refundable + 1e-8 ||
        Math.abs(input.amount * 10 ** decimals - Math.round(input.amount * 10 ** decimals)) > 1e-7) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Select this order’s captured payment and a valid refundable amount")
      }
    }
    // Persist before calling the payment provider. Deliberately not compensated:
    // an interrupted/failed financial action needs reconciliation, never a blind retry.
    await service.updateRefundRequests({ id: input.id, status: "reviewing", reviewed_by: input.reviewed_by,
      resolution: { action: input.action, state: "started", started_at: new Date().toISOString(),
        ...(input.action === "refund_payment" ? { payment_id: input.payment_id, amount: input.amount } : {}) } })
    return { order_id: request.order_id, skip: false }
  }, { timeout: 10 })
  return new StepResponse(plan, plan.skip ? undefined : input.id)
}, async (id, { container }) => {
  if (!id) return
  const service = container.resolve<RefundRequestModuleService>(REFUND_REQUEST_MODULE)
  const request = await service.retrieveRefundRequest(id)
  if (request.resolution?.state === "started") {
    await service.updateRefundRequests({ id, resolution: { ...request.resolution, state: "needs_review" } })
  }
})

const finishRefundRequestResolution = createStep("finish-refund-request-resolution", async ({ input }: { input: Input; cancellation: unknown; refund: unknown }, { container }) => {
  const service = container.resolve<RefundRequestModuleService>(REFUND_REQUEST_MODULE)
  const request = await service.retrieveRefundRequest(input.id)
  if (request.resolution?.state === "completed") return new StepResponse(request)
  return new StepResponse(await service.updateRefundRequests({
    id: input.id, status: "closed", response: input.response, reviewed_by: input.reviewed_by,
    resolution: { ...request.resolution, state: "completed", completed_at: new Date().toISOString() },
  }))
})

export const resolveRefundRequestWorkflow = createWorkflow("resolve-refund-request", (input: Input) => {
  const plan = prepareRefundRequestResolution(input)
  const cancellation = when("cancel-requested-order", { input, plan }, ({ input, plan }) => !plan.skip && input.action === "cancel_order").then(() => {
    return cancelOrderWorkflow.runAsStep({ input: { order_id: plan.order_id, canceled_by: input.reviewed_by } })
  })
  const refund = when("refund-requested-payment", { input, plan }, ({ input, plan }) => !plan.skip && input.action === "refund_payment").then(() => {
    const refund = transform(input, (data) => {
      const value = data as Extract<Input, { action: "refund_payment" }>
      return { payment_id: value.payment_id, amount: value.amount, created_by: value.reviewed_by,
        note: `Customer request ${value.id}`, idempotency_key: `customer-request:${value.id}` }
    })
    return refundPaymentWorkflow.runAsStep({ input: refund })
  })
  const request = finishRefundRequestResolution({ input, cancellation, refund })
  const event = transform(request, (value) => ({ id: value.id, version: new Date(value.updated_at).toISOString() }))
  emitEventStep({ eventName: "shop.refund-updated", data: event })
  return new WorkflowResponse(request)
})
