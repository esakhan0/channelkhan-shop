export type CustomerRefund = {
  id: string
  order_id: string
  order_display_id: number
  kind: "refund" | "cancellation"
  status: "pending" | "reviewing" | "closed" | "declined"
  items: { id: string; title: string; quantity: number }[]
  customer_note: string
  response: string
  created_at: string
  updated_at: string
}

export type RefundDetails = {
  order: { id: string; display_id: number; status: string
    items: { id: string; title: string; requestable_quantity: number; faulty_quantity: number; awaiting_delivery: number; fulfillment_started: boolean }[] }
  has_open_request: boolean
  requests: CustomerRefund[]
}
