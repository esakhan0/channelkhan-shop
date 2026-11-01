import LocalizedClientLink from "@modules/common/components/localized-client-link"
const EmptyCartMessage = () => <div className="ink-empty-bag" data-testid="empty-cart-message">
  <svg width="120" height="130" viewBox="0 0 120 130" fill="none" aria-hidden="true"><path d="m20 42 80-3 8 77-94 3Z" fill="#f5d449" stroke="#282323" strokeWidth="3"/><path d="M38 47V29C38 3 81 3 81 29v17" stroke="#282323" strokeWidth="3"/><circle cx="45" cy="77" r="4" fill="#282323"/><circle cx="75" cy="77" r="4" fill="#282323"/><path d="M47 93q14 14 26-1" stroke="#282323" strokeWidth="3" strokeLinecap="round"/></svg>
  <h2>A little empty. A lot of potential.</h2><p>Your next favourite thing is waiting to meet you.</p>
  <LocalizedClientLink href="/store" className="ink-button">Let’s find it ↗</LocalizedClientLink>
</div>
export default EmptyCartMessage
