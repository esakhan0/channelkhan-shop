import type { CSSProperties } from "react"
import { listCollections } from "@lib/data/collections"
import BrandLogo from "@modules/common/components/brand-logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const helpLinks = [
  ["Shipping", "/shipping"], ["Returns", "/returns"],
  ["Contact us", "/contact"], ["Your account", "/account"],
]

// The shop's name, written huge across the foot of the page, one letter at a
// time so each can take its own colour and bounce.
const bigName = "Mukky’s".split("")

export default async function Footer() {
  const { collections } = await listCollections({ fields: "id,handle,title" })
  return (
    <footer className="mukky-footer mk-footer">
      <div className="content-container">
        <div className="mk-footer-top">
          <div className="mk-footer-brand">
            <LocalizedClientLink href="/" className="mk-footer-logo" aria-label="Mukky’s 3D Shop, home">
              <BrandLogo />
            </LocalizedClientLink>
            <p>A little print shop with big ideas. 3D printed fidget toys and more.</p>
            <span className="mukky-footer-est">Est. 2026</span>
          </div>
          <nav aria-label="Shop" className="mk-footer-column">
            <h2>Shop</h2>
            <LocalizedClientLink href="/store">Shop everything</LocalizedClientLink>
            {collections?.slice(0, 4).map(c => (
              <LocalizedClientLink key={c.id} href={`/collections/${c.handle}`}>{c.title}</LocalizedClientLink>
            ))}
          </nav>
          <nav aria-label="Help" className="mk-footer-column">
            <h2>A helping hand</h2>
            {helpLinks.map(([label, href]) => (
              <LocalizedClientLink key={href} href={href}>{label}</LocalizedClientLink>
            ))}
          </nav>
        </div>
        <p className="mk-footer-word" aria-hidden="true">
          {bigName.map((letter, index) => (
            <span key={index} style={{ "--i": index } as CSSProperties}>{letter}</span>
          ))}
        </p>
        <div className="mukky-footer-bottom">
          <p>© {new Date().getFullYear()} Mukky&apos;s 3D Shop.</p>
          <div><LocalizedClientLink href="/privacy">Privacy</LocalizedClientLink><LocalizedClientLink href="/terms">Terms</LocalizedClientLink><LocalizedClientLink href="/cookies">Cookies</LocalizedClientLink></div>
          <span>Playful prints. Plenty of personality.</span>
        </div>
      </div>
    </footer>
  )
}
