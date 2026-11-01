import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Hero({ countryCode }: { countryCode: string }) {
  const region = await getRegion(countryCode)
  const products = region ? (await listProducts({ regionId: region.id, queryParams: { limit: 1, fields: "*variants.calculated_price" } })).response.products : []
  const featured = products[0]
  return <section className="joy-hero content-container">
    <div className="joy-hero-copy"><p className="mukky-eyebrow">INDEPENDENT SPIRIT. PRINTED IN 3D. / EST. 2026</p>
      <h1>Everyday things.<br /><em>Extraordinary</em><br />personality.</h1>
      <p>Small objects with a big sense of fun. Welcome to Mukky&apos;s — making joy, one layer at a time.</p>
      <LocalizedClientLink href="/store" className="joy-shop-button">Discover the shop <span>↗</span></LocalizedClientLink>
      <div className="joy-hero-meta"><span>Two brothers. One big idea.</span><span>Making joy since 2026</span></div>
    </div>
    <div className="joy-feature">
      <div className="joy-feature-top"><span>{featured ? "IN THE SHOP" : "MEET MUKKY’S"}</span><span>✳</span></div>
      <LocalizedClientLink href={featured ? `/products/${featured.handle}` : "/store"} className="joy-feature-image">
        <Image src={featured?.thumbnail || "/brand/mukkys-logo.png"} alt={featured?.title || "Mukky’s 3D Shop"} fill sizes="(max-width: 900px) 90vw, 45vw" priority className="object-contain" />
      </LocalizedClientLink>
      <div className="joy-feature-bottom"><span>{featured?.title || "A little imagination. A lot of layers."}</span><LocalizedClientLink href={featured ? `/products/${featured.handle}` : "/store"} aria-label="Explore featured item">↗</LocalizedClientLink></div>
    </div>
  </section>
}
