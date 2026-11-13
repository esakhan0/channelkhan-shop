import { Suspense } from "react"
import { User } from "@medusajs/icons"
import BrandLogo from "@modules/common/components/brand-logo"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import Search from "@modules/layout/components/search"
import NavCartLabel from "@modules/layout/components/nav-cart-label"

const links = [
  ["Shop", "/store"],
  ["Shipping", "/shipping"],
  ["Returns", "/returns"],
  ["Contact", "/contact"],
]

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      {/* Wide screens: logo, page links, then search, account and cart.
          Small screens: menu, centred logo, then search and cart. */}
      <header className="mk-header">
        <nav className="content-container mk-header-row" aria-label="Main">
          <div className="mk-header-menu">
            <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
          </div>

          <LocalizedClientLink
            href="/"
            className="mukky-brand-link mk-header-logo"
            data-testid="nav-store-link"
          >
            <BrandLogo />
          </LocalizedClientLink>

          <ul className="mk-header-links">
            {links.map(([label, href]) => (
              <li key={href}>
                <LocalizedClientLink href={href}>{label}</LocalizedClientLink>
              </li>
            ))}
          </ul>

          <div className="mk-header-actions">
            <Search />
            <LocalizedClientLink
              className="mk-icon-button mk-header-account"
              href="/account"
              data-testid="nav-account-link"
              aria-label="Your account"
            >
              <User aria-hidden="true" />
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  href="/cart"
                  data-testid="nav-cart-link"
                  aria-label="Cart, 0 items"
                >
                  <NavCartLabel count={0} />
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
