import { listCollections } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const serviceLinks = [
  ["Shipping", "/shipping"], ["Returns", "/returns"],
  ["Contact us", "/contact"], ["Your account", "/account"],
]

export default async function Footer() {
  const { collections } = await listCollections({ fields: "id,handle,title" })
  return (
    <footer className="mukky-footer">
      <div className="content-container">
        <div className="mukky-footer-top">
          <div>
            <p className="mukky-eyebrow">A little print shop with big ideas</p>
            <LocalizedClientLink href="/" className="mukky-footer-wordmark">Mukky&apos;s.</LocalizedClientLink>
            <p>Making joy, one layer at a time.</p>
            <span className="mukky-footer-est">Est. 2026</span>
          </div>
          <div>
            <h2>Find your joy</h2>
            <LocalizedClientLink href="/store">Shop everything</LocalizedClientLink>
            {collections?.slice(0, 4).map(c => (
              <LocalizedClientLink key={c.id} href={`/collections/${c.handle}`}>{c.title}</LocalizedClientLink>
            ))}
          </div>
          <div>
            <h2>A helping hand</h2>
            {serviceLinks.map(([label, href]) => (
              <LocalizedClientLink key={href} href={href}>{label}</LocalizedClientLink>
            ))}
          </div>
        </div>
        <div className="mukky-footer-bottom">
          <p>© {new Date().getFullYear()} Mukky&apos;s 3D Shop.</p>
          <div><LocalizedClientLink href="/privacy">Privacy</LocalizedClientLink><LocalizedClientLink href="/terms">Terms</LocalizedClientLink></div>
          <span>Two brothers. One printer. Plenty of personality.</span>
        </div>
      </div>
    </footer>
  )
}
