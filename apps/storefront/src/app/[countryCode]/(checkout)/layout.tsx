import BrandLogo from "@modules/common/components/brand-logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="joy-checkout w-full relative small:min-h-screen">
      <div className="joy-checkout-header">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-ui-fg-base flex items-center gap-x-2 uppercase flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base ">
              Back to your bag
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
              Back
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="mk-checkout-logo"
            data-testid="store-link"
            aria-label="Mukky’s 3D Shop, home"
          >
            <BrandLogo />
          </LocalizedClientLink>
          <div className="joy-checkout-note flex-1 basis-0">Checkout</div>
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
      <div className="py-4 w-full flex items-center justify-center">
        <p className="joy-checkout-footer">A little shop. A lot of care. <LocalizedClientLink href="/contact">Need a hand?</LocalizedClientLink></p>
      </div>
    </div>
  )
}
