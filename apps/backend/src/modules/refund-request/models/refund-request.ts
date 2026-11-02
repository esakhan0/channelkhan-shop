import { model } from "@medusajs/framework/utils"

const RefundRequest = model.define("refund_request", {
  id: model.id({ prefix: "rreq" }).primaryKey(),
  customer_id: model.text().index(),
  order_id: model.text().index(),
  order_display_id: model.number(),
  kind: model.enum(["refund", "cancellation"]),
  status: model.enum(["pending", "reviewing", "closed", "declined"]).default("pending"),
  items: model.json(),
  customer_note: model.text(),
  response: model.text().default(""),
  reviewed_by: model.text().nullable(),
})

export default RefundRequest
