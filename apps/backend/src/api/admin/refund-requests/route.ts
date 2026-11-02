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
  const [requests, count] = await service.listAndCountRefundRequests({}, {
    skip: offset, take: 20, order: { created_at: "DESC" },
  })
  res.setHeader("Cache-Control", "no-store")
  res.json({ requests: requests.map(customerRequestView), count, offset, limit: 20 })
}
