"use client"

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react"
import { useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import useToggleState from "@lib/hooks/use-toggle-state"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"

const links = [["Home", "/"], ["Shop all prints", "/store"], ["Your account", "/account"], ["Your bag", "/cart"], ["Contact the makers", "/contact"]]

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

export default function SideMenu({ regions, locales, currentLocale }: SideMenuProps) {
  const [open, setOpen] = useState(false)
  const countryToggle = useToggleState()
  const languageToggle = useToggleState()
  const pathname = usePathname().replace(/^\/[^/]+/, "") || "/"

  return <>
    <button type="button" className="joy-menu-trigger" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-haspopup="dialog" data-testid="nav-menu-button">
      <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden="true"><path d="M2 4h16M2 9h12M2 14h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg><span>Menu</span>
    </button>
    <Dialog open={open} onClose={setOpen} className="joy-menu-dialog">
      <div className="joy-menu-backdrop" aria-hidden="true" data-testid="side-menu-backdrop" />
      <div className="joy-menu-position">
        <DialogPanel className="joy-menu-panel" data-testid="nav-menu-popup">
          <div className="joy-menu-top">
            <DialogTitle className="sr-only">Explore Mukky’s shop</DialogTitle>
            <Image src="/brand/mukkys-logo.png" alt="Mukky’s 3D Shop" width={1792} height={896} className="joy-menu-logo" sizes="190px" />
            <button type="button" className="joy-menu-close" onClick={() => setOpen(false)} aria-label="Close menu" data-testid="close-menu-button">×</button>
          </div>
          <p className="ink-kicker">EXPLORE THE FIDGET SHOP</p>
          <nav aria-label="Main menu"><ul className="joy-menu-links">
            {links.map(([label, href], i) => <li key={href}><LocalizedClientLink href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? "page" : undefined}><span className="joy-menu-number">0{i + 1}</span>{label}<span className="joy-menu-arrow" aria-hidden="true">↗</span></LocalizedClientLink></li>)}
          </ul></nav>
          <div className="joy-menu-help"><LocalizedClientLink href="/shipping" onClick={() => setOpen(false)}>Shipping</LocalizedClientLink><LocalizedClientLink href="/returns" onClick={() => setOpen(false)}>Returns</LocalizedClientLink></div>
          <div className="joy-menu-bottom">
            {!!locales?.length && <div onMouseEnter={languageToggle.open} onMouseLeave={languageToggle.close}><LanguageSelect toggleState={languageToggle} locales={locales} currentLocale={currentLocale} /></div>}
            {regions && <CountrySelect toggleState={countryToggle} regions={regions} />}
            <p>Mukky’s 3D workshop. <span>Est. 2026</span></p>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </>
}
