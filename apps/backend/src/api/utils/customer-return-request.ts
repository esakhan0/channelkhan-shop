import { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { deliveredReturnQuantity, ownedReturnOrder, returnShippingOptions } from "./customer-returns"

const requestSchema = z.object({
  order_id: z.string().min(1).max(100),
  items: z.array(z.object({
    id: z.string().min(1).max(100),
    quantity: z.number().int().min(1).max(1000000),
    reason_id: z.string().min(1).max(100).nullish(),
    note: z.string().max(2000).nullish(),
  }).strict()).min(1).max(100),
  note: z.string().max(2000).nullish(),
  return_shipping: z.object({ option_id: z.string().min(1).max(100) }).strict(),
  receive_now: z.literal(false).optional(),
}).strict()

export function parseCustomerReturn(body: unknown) {
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Choose valid items and quantities. Receiving items and setting refund or shipping amounts are staff actions.")
  }
  return parsed.data
}

// Run under the order lock so simultaneous requests see updated quantities.
export async function validateCustomerReturn(
  req: AuthenticatedMedusaRequest, body: z.infer<typeof requestSchema>
) {
  const order = await ownedReturnOrder(req, body.order_id)
  if (order.status === "canceled") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "This order is canceled.")
  }
  const ids = new Set<string>()
  for (const requested of body.items) {
    const item = order.items?.find((item) => item?.id === requested.id)
    if (ids.has(requested.id) || !item || requested.quantity > deliveredReturnQuantity(item.detail)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Only delivered items that have not already been returned or requested can be selected.")
    }
    ids.add(requested.id)
  }
  const options = await returnShippingOptions(req, order.cart?.id)
  if (!options.some((option) => option.id === body.return_shipping.option_id)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Choose an available return shipping method.")
  }
}
