export default function NavCartLabel({ count }: { count: number }) {
  return (
    <>
      <span className="mukky-nav-text">Cart ({count})</span>
      <span className="mukky-nav-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
          <path d="M3 3h2l2.4 12h11.8l2-8H6" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
        </svg>
        {count > 0 && <span className="mukky-cart-count">{count > 99 ? "99+" : count}</span>}
      </span>
    </>
  )
}
