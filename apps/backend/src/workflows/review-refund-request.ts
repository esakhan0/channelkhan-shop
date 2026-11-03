import { createStep, createWorkflow, StepResponse, WorkflowResponse, transform } from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { REFUND_REQUEST_MODULE } from "../modules/refund-request"
import RefundRequestModuleService from "../modules/refund-request/service"
import { MedusaError, Modules } from "@medusajs/framework/utils"

type ReviewInput = { id: string; status: "reviewing" | "closed" | "declined"; response: string; reviewed_by: string }

const reviewRefundRequestStep = createStep("review-refund-request", async (input: ReviewInput, { container }) => {
  const service = container.resolve<RefundRequestModuleService>(REFUND_REQUEST_MODULE)
  const request = await container.resolve(Modules.LOCKING).execute(`resolve-request:${input.id}`, async () => {
    const current = await service.retrieveRefundRequest(input.id)
    if (current.resolution?.state === "needs_review" && input.status !== "closed") throw new MedusaError(MedusaError.Types.NOT_ALLOWED,
      "Reconcile the payment and close the request with the outcome")
    if (current.resolution?.state === "started") throw new MedusaError(MedusaError.Types.NOT_ALLOWED,
      "A financial action has started. Check its outcome in the order before making further changes.")
    if (["completed", "reconciled"].includes(String(current.resolution?.state)) && input.status !== "closed") throw new MedusaError(MedusaError.Types.NOT_ALLOWED,
      "This request has already been processed and cannot be reopened")
    return service.updateRefundRequests(current.resolution?.state === "needs_review"
      ? { ...input, resolution: { ...current.resolution, state: "reconciled", reconciled_at: new Date().toISOString() } }
      : input)
  }, { timeout: 10 })
  return new StepResponse(request)
})

export const reviewRefundRequestWorkflow = createWorkflow("review-refund-request", (input: ReviewInput) => {
  const request = reviewRefundRequestStep(input)
  const event = transform(request, (value) => ({ id: value.id, version: new Date(value.updated_at).toISOString() }))
  emitEventStep({ eventName: "shop.refund-updated", data: event })
  return new WorkflowResponse(request)
})
