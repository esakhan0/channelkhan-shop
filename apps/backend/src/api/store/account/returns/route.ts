import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { returnFields } from "../../../utils/customer-returns"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const offset = Number(req.query.offset ?? 0)
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid page")
  }
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data, metadata } = await query.graph({
    entity: "return", fields: returnFields,
    filters: { order: { customer_id: req.auth_context.actor_id } },
    pagination: { skip: offset, take: 20, order: { created_at: "DESC" } },
  })
  res.setHeader("Cache-Control", "private, no-store")
  res.json({ returns: data, count: metadata?.count ?? data.length, offset, limit: 20 })
}
