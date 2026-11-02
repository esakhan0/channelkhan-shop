import { createStep, createWorkflow, StepResponse, WorkflowResponse, transform } from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { REFUND_REQUEST_MODULE } from "../modules/refund-request"
import RefundRequestModuleService from "../modules/refund-request/service"

type ReviewInput = { id: string; status: "reviewing" | "closed" | "declined"; response: string; reviewed_by: string }

const reviewRefundRequestStep = createStep("review-refund-request", async (input: ReviewInput, { container }) => {
  const service = container.resolve<RefundRequestModuleService>(REFUND_REQUEST_MODULE)
  await service.retrieveRefundRequest(input.id)
  const request = await service.updateRefundRequests(input)
  return new StepResponse(request)
})

export const reviewRefundRequestWorkflow = createWorkflow("review-refund-request", (input: ReviewInput) => {
  const request = reviewRefundRequestStep(input)
  const event = transform(request, (value) => ({ id: value.id, version: new Date(value.updated_at).toISOString() }))
  emitEventStep({ eventName: "shop.refund-updated", data: event })
  return new WorkflowResponse(request)
})
