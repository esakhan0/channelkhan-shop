import { HttpTypes } from "@medusajs/types"
import CartTotals from "@modules/common/components/cart-totals"

export default function OrderSummary({ order }: { order: HttpTypes.StoreOrder }) {
  return (
    <section>
      <h2>Order summary</h2>
      <CartTotals totals={order} />
    </section>
  )
}
