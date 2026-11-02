export type CustomerReturn = {
  id: string
  display_id: number
  order_id: string
  status: string
  created_at: string
  items: { item_id: string; quantity: number; received_quantity: number; item?: { title: string }; reason?: { label: string } | null }[]
  order: { display_id: number }
}

export type ReturnDetails = {
  order: { id: string; display_id: number; currency_code: string; items: {
    id: string; title: string; thumbnail?: string | null; returnable_quantity: number
  }[] }
  shipping_options: { id: string; name: string; amount: number }[]
  reasons: { id: string; label: string }[]
  returns: CustomerReturn[]
}
