import { ShoppingBag } from "@medusajs/icons"

/** The cart icon with its item-count badge. The badge is hidden while the cart is empty. */
export default function NavCartLabel({ count }: { count: number }) {
  return (
    <span className="mk-cart-label">
      <ShoppingBag aria-hidden="true" />
      {count > 0 && (
        <span className="mk-cart-count" aria-hidden="true">
          {count > 99 ? "99+" : count}
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {count} {count === 1 ? "item" : "items"} in your cart
      </span>
    </span>
  )
}
