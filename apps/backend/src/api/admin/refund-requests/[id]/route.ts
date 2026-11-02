import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { reviewRefundSchema } from "../../../../modules/refund-request/validation"
import { reviewRefundRequestWorkflow } from "../../../../workflows/review-refund-request"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = reviewRefundSchema.safeParse(req.body)
  if (!parsed.success) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Provide a status and customer response")
  const { result } = await reviewRefundRequestWorkflow(req.scope).run({ input: {
    ...parsed.data, id: req.params.id, reviewed_by: req.auth_context.actor_id,
  } })
  res.setHeader("Cache-Control", "no-store")
  res.json({ request: result })
}
