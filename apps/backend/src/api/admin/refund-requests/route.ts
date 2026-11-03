import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { REFUND_REQUEST_MODULE } from "../../../modules/refund-request"
import RefundRequestModuleService from "../../../modules/refund-request/service"
import { customerRequestView } from "../../../modules/refund-request/order"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const offset = Number(req.query.offset ?? 0)
  if (!Number.isInteger(offset) || offset < 0 || offset > 100000) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid offset")
  }
  const service = req.scope.resolve<RefundRequestModuleService>(REFUND_REQUEST_MODULE)
  const status = req.query.status
  if (status !== undefined && (typeof status !== "string" || !["pending", "reviewing", "closed", "declined"].includes(status))) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid request status")
  }
  const [requests, count] = await service.listAndCountRefundRequests(status ? { status: String(status) } : {}, {
    skip: offset, take: 20, order: { created_at: "DESC" },
  })
  res.setHeader("Cache-Control", "no-store")
  res.json({ requests: requests.map((request) => ({ ...customerRequestView(request), resolution: request.resolution })), count, offset, limit: 20 })
}
