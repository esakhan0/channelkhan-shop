import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Reveal from "@modules/common/components/reveal"

export default async function ShopShowcase({ countryCode }: { countryCode: string }) {
  const region = await getRegion(countryCode)
  if (!region) return null
  // The Store API exposes published products in the storefront's sales channel.
  // Fetch every page so collections and an eight-item cap cannot hide new arrivals.
  const products: HttpTypes.StoreProduct[] = []
  let page: number | null = 1
  while (page !== null) {
    const result = await listProducts({
      regionId: region.id,
      pageParam: page,
      queryParams: {
        limit: 100,
        order: "-created_at",
        fields: "*variants.calculated_price",
      },
    })
    products.push(...result.response.products)
    page = result.response.products.length ? result.nextPage : null
  }
  const visible = Array.from(new Map(products.map((p) => [p.id, p])).values())
  return <section className="content-container ink-products" id="latest">
    <div className="ink-section-head"><div><p className="ink-kicker">LATEST PRODUCTS</p><h2>Fresh from the workshop</h2><p>Discover our latest fidgets, with the newest arrivals first.</p></div><LocalizedClientLink href="/store?sortBy=created_at" className="ink-underlined">Explore the shop</LocalizedClientLink></div>
    {visible.length ? <div className="joy-product-grid">{visible.map((product, index) => <Reveal key={product.id} className="ink-product-reveal" delay={(index % 4) * 65}><ProductPreview product={product} region={region} /></Reveal>)}</div> : <Reveal className="ink-coming"><span aria-hidden="true">✳</span><h3>The next fidgets are on their way.</h3><p>We’re getting our first collection ready. Check back soon for the good stuff.</p><LocalizedClientLink href="/contact" className="ink-underlined">Say hello to the makers ↗</LocalizedClientLink></Reveal>}
  </section>
}
