import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { createAndCompleteReturnOrderWorkflow } from "@medusajs/medusa/core-flows"
import { parseCustomerReturn, validateCustomerReturn } from "../../utils/customer-return-request"

// Keep Medusa's native return workflow, with customer permissions and a shared lock.
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const input = parseCustomerReturn(req.body)
  const locking = req.scope.resolve(Modules.LOCKING)
  const result = await locking.execute(`customer-return:${input.order_id}`, async () => {
    await validateCustomerReturn(req, input)
    const { result } = await createAndCompleteReturnOrderWorkflow(req.scope).run({ input })
    return result
  }, { timeout: 10 })
  res.status(200).json({ return: result })
}
