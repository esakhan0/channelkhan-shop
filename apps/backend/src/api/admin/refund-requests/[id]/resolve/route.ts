import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { REFUND_REQUEST_MODULE } from "../../../../../modules/refund-request"
import RefundRequestModuleService from "../../../../../modules/refund-request/service"
import { resolutionContext, resolutionOrder } from "../../../../../modules/refund-request/resolution"
import { resolveRefundSchema } from "../../../../../modules/refund-request/validation"
import { resolveRefundRequestWorkflow } from "../../../../../workflows/resolve-refund-request"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const request = await req.scope.resolve<RefundRequestModuleService>(REFUND_REQUEST_MODULE).retrieveRefundRequest(req.params.id)
  const order = await resolutionOrder(req.scope, request.order_id)
  res.setHeader("Cache-Control", "no-store")
  res.json(resolutionContext(order, request))
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = resolveRefundSchema.safeParse(req.body)
  if (!parsed.success) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Check the action, reply and refund amount")
  const { result } = await resolveRefundRequestWorkflow(req.scope).run({ input: {
    ...parsed.data, id: req.params.id, reviewed_by: req.auth_context.actor_id,
  } })
  res.setHeader("Cache-Control", "no-store")
  res.json({ request: result })
}
