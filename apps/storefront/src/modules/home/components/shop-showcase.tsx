import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function ShopShowcase({ countryCode }: { countryCode: string }) {
  const region = await getRegion(countryCode)
  if (!region) return null
  const { response: { products } } = await listProducts({ regionId: region.id, queryParams: { limit: 8, fields: "*variants.calculated_price" } })
  return <section className="content-container joy-products" id="latest">
    <div className="joy-section-heading"><div><p className="mukky-eyebrow">THE SHOP / 01</p><h2>Find your little happy.</h2></div><LocalizedClientLink href="/store">Shop everything ↗</LocalizedClientLink></div>
    {products.length ? <div className="joy-product-grid">{products.map(product => <ProductPreview key={product.id} product={product} region={region} />)}</div> : <div className="joy-empty"><h3>Something good is taking shape.</h3><p>Our first collection is on its way. Come back soon to meet the prints.</p></div>}
  </section>
}
