import { listProducts } from "@lib/data/products"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function ShopShowcase({ countryCode }: { countryCode: string }) {
  const region = await getRegion(countryCode)
  if (!region) return null
  const { collections } = await listCollections({ fields: "id,handle,title" })
  const popular = collections.find(c => c.handle === "popular-products")
  const { response: { products } } = await listProducts({ regionId: region.id, queryParams: { limit: 24, fields: "*variants.calculated_price", ...(popular ? { collection_id: popular.id } : {}) } })
  const visible = products.filter(p => !/^medusa\s/i.test(p.title)).slice(0, 8)
  return <section className="content-container ink-products" id="latest">
    <div className="ink-section-head"><div><p className="ink-kicker">SMALL OBJECTS. SERIOUS CHARACTER.</p><h2>{popular ? "Popular products" : "Fresh from the workshop"}<span aria-hidden="true"> ✳</span></h2></div><LocalizedClientLink href="/store" className="ink-underlined">Shop all prints ↗</LocalizedClientLink></div>
    {visible.length ? <div className="joy-product-grid">{visible.map(product => <ProductPreview key={product.id} product={product} region={region} />)}</div> : <div className="ink-coming"><span aria-hidden="true">✳</span><h3>The first little joys are on their way.</h3><p>We’re getting our first collection ready. Check back soon for the good stuff.</p><LocalizedClientLink href="/contact" className="ink-underlined">Say hello to the makers ↗</LocalizedClientLink></div>}
  </section>
}
