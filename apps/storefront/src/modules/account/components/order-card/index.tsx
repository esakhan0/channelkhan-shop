import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

export default function OrderCard({ order }: { order: HttpTypes.StoreOrder }) {
  const items = order.items || []
  const quantity = items.reduce((total, item) => total + item.quantity, 0)

  return (
    <article className="joy-order-card joy-order-list-card" data-testid="order-card">
      <div className="joy-order-list-heading">
        <div className="joy-order-list-reference">
          <strong>Order #<span data-testid="order-display-id">{order.display_id}</span></strong>
          <span data-testid="order-created-at">{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
        <strong className="joy-order-list-total" data-testid="order-amount">
          {convertToLocale({ amount: order.total, currency_code: order.currency_code })}
        </strong>
        <LocalizedClientLink href={`/account/orders/details/${order.id}`} className="joy-order-list-link" data-testid="order-details-link" aria-label={`View order ${order.display_id}`}>
          View order <span aria-hidden="true">↗</span>
        </LocalizedClientLink>
      </div>
      <div className="joy-order-list-content">
        <div className="joy-order-list-items">
          {items.slice(0, 2).map((item) => (
            <div key={item.id} className="joy-order-list-item" data-testid="order-item">
              <div className="joy-order-list-thumbnail"><Thumbnail thumbnail={item.thumbnail} size="square" /></div>
              <div>
                <span className="joy-order-list-item-title" data-testid="item-title">{item.product_title || item.title}</span>
                <span className="joy-order-list-item-quantity">Qty <span data-testid="item-quantity">{item.quantity}</span></span>
              </div>
            </div>
          ))}
          {items.length > 2 && <span className="joy-order-list-more">+{items.length - 2} more products</span>}
          {!items.length && <span>View order for item details.</span>}
        </div>
        <div className="joy-order-list-status">
          <LocalizedClientLink href={`/account/orders/details/${order.id}/refund`}>Request a refund ↗</LocalizedClientLink>
          <span>{quantity} {quantity === 1 ? "item" : "items"}</span>
          <span className="joy-status-pill">Payment: {(order.payment_status || "pending").replaceAll("_", " ")}</span>
          <span className="joy-status-pill">Delivery: {(order.fulfillment_status || "not_fulfilled").replaceAll("_", " ")}</span>
        </div>
      </div>
    </article>
  )
}
