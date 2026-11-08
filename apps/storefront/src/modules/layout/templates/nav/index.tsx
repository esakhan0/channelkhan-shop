import { Suspense } from "react"
import BrandLogo from "@modules/common/components/brand-logo"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import Search from "@modules/layout/components/search"
import User from "@modules/common/icons/user"
import NavCartLabel from "@modules/layout/components/nav-cart-label"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="mukky-nav relative h-24 mx-auto border-b duration-200 border-ui-border-base">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center gap-2 medium:gap-5 min-w-0">
            <div className="h-full flex items-center">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
            <Search />
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="mukky-brand-link"
              data-testid="nav-store-link"
            >
              <BrandLogo />
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="ink-account-link"
                href="/account"
                data-testid="nav-account-link"
                aria-label="Your account"
              >
                <span className="mukky-nav-text">Account</span>
                <span className="mukky-nav-icon" aria-hidden="true"><User size="22" focusable="false" /></span>
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
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
