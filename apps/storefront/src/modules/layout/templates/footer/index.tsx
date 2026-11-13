import { listCollections } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

const helpLinks = [
  ["Shipping", "/shipping"], ["Returns", "/returns"],
  ["Contact us", "/contact"], ["Your account", "/account"],
]

export default async function Footer() {
  const { collections } = await listCollections({ fields: "id,handle,title" })
  return (
    <footer className="mukky-footer mk-footer">
      <div className="content-container">
        <div className="mk-footer-top">
          <div className="mk-footer-brand">
            <LocalizedClientLink href="/" className="joy-footer-logo"><Image src="/brand/mukkys-logo.png" alt="Mukky’s 3D Shop — home" width={1792} height={896} sizes="200px" /></LocalizedClientLink>
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
        <div className="mukky-footer-bottom">
          <p>© {new Date().getFullYear()} Mukky&apos;s 3D Shop.</p>
          <div><LocalizedClientLink href="/privacy">Privacy</LocalizedClientLink><LocalizedClientLink href="/terms">Terms</LocalizedClientLink></div>
          <span>Playful prints. Plenty of personality.</span>
        </div>
      </div>
    </footer>
  )
}
