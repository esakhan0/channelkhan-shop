import { z } from "@medusajs/framework/zod"

export const customerRefundSchema = z.object({
  order_id: z.string().min(1).max(100),
  kind: z.enum(["refund", "cancellation"]),
  items: z.array(z.object({
    id: z.string().min(1).max(100),
    quantity: z.number().int().min(1).max(1000000),
  }).strict()).min(1).max(100),
  customer_note: z.string().trim().max(2000),
}).strict().refine((input) => input.kind === "cancellation" || input.customer_note.length >= 3, {
  message: "Describe the fault or what is incorrect",
})

export type CustomerRefundInput = z.infer<typeof customerRefundSchema>

export const reviewRefundSchema = z.object({
  status: z.enum(["reviewing", "closed", "declined"]),
  response: z.string().trim().min(3).max(2000),
}).strict()

export const resolveRefundSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel_order"), response: z.string().trim().min(3).max(2000) }).strict(),
  z.object({ action: z.literal("refund_payment"), response: z.string().trim().min(3).max(2000),
    payment_id: z.string().min(1).max(100), amount: z.number().finite().positive().max(1000000) }).strict(),
])
export type ResolveRefundInput = z.infer<typeof resolveRefundSchema>
