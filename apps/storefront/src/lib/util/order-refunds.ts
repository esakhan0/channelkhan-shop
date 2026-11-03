import { HttpTypes } from "@medusajs/types"

export function orderRefunds(order: HttpTypes.StoreOrder) {
  const seen = new Set<string>()
  return (order.payment_collections || []).flatMap((collection) =>
    (collection.payments || []).flatMap((payment) => (payment.refunds || []).map((refund) => ({
      id: refund.id, amount: Number(refund.amount), created_at: refund.created_at,
    }))))
    .filter((refund) => {
      if (seen.has(refund.id) || !Number.isFinite(refund.amount) || refund.amount <= 0) return false
      seen.add(refund.id)
      return true
    })
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
}

export function refundedTotal(order: HttpTypes.StoreOrder) {
  return orderRefunds(order).reduce((sum, refund) => sum + refund.amount, 0)
}
