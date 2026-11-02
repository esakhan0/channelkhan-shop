import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { REFUND_REQUEST_MODULE } from "../modules/refund-request"
import RefundRequestModuleService from "../modules/refund-request/service"

type ReviewInput = { id: string; status: "reviewing" | "closed" | "declined"; response: string; reviewed_by: string }

const reviewRefundRequestStep = createStep("review-refund-request", async (input: ReviewInput, { container }) => {
  const service = container.resolve<RefundRequestModuleService>(REFUND_REQUEST_MODULE)
  await service.retrieveRefundRequest(input.id)
  const request = await service.updateRefundRequests(input)
  return new StepResponse(request)
})

export const reviewRefundRequestWorkflow = createWorkflow("review-refund-request", (input: ReviewInput) =>
  new WorkflowResponse(reviewRefundRequestStep(input)))
