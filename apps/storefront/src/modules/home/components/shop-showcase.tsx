import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import {
  ArrowRightMini,
  ArrowUturnLeft,
  CubeSolid,
  ShieldCheck,
  TruckFast,
} from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { getRegion } from "@lib/data/regions"
import Hero from "@modules/home/components/hero"
import { type DeckCard } from "@modules/home/components/hero-deck"
import Marquee from "@modules/home/components/marquee"
import PrinterScene from "@modules/home/components/printer-scene"
import ProductTile from "@modules/home/components/product-tile"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Reveal from "@modules/common/components/reveal"

// Each line restates something the shop's own shipping and returns pages say.
const values = [
  {
    icon: CubeSolid,
    title: "Printed by us",
    text: "Every fidget comes off our own 3D printer, in PLA or PETG.",
  },
  {
    icon: TruckFast,
    title: "Royal Mail delivery",
    text: "Delivery options and prices are shown before you pay.",
  },
  {
    icon: ArrowUturnLeft,
    title: "14 days to change your mind",
    text: "Cancel a standard order within 14 days of it arriving.",
  },
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    text: "Card and wallet payments are handled by Stripe.",
  },
]

const steps = [
  {
    title: "Pick your fidget",
    text: "Choose a toy and the colour you like best.",
  },
  {
    title: "We print it",
    text: "Our own 3D printer builds it up, one thin layer at a time, in PLA or PETG.",
  },
  {
    title: "Into your hands",
    text: "We pack it up and send it to you with Royal Mail.",
  },
]

/** How many cards the stack in the hero holds at most. */
const DECK_SIZE = 6

/**
 * How wide each tile is, so no row is left with a hole: three to a row, a
 * leftover pair shares a row, and one left over turns the last four into pairs.
 */
const tileWidths = (count: number): ("third" | "half" | "full")[] => {
  if (count === 1) {
    return ["full"]
  }

  const widths: ("third" | "half" | "full")[] = Array(count).fill("third")
  const leftover = count % 3

  if (leftover === 2) {
    widths[count - 1] = widths[count - 2] = "half"
  }

  if (leftover === 1) {
    for (let index = count - 4; index < count; index++) {
      widths[index] = "half"
    }
  }

  return widths
}

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

  const priced = visible.map((product) => {
    const price = getProductPrice({ product }).cheapestPrice
    const hasRange =
      !!price &&
      !!product.variants?.some(
        (variant) =>
          (variant.calculated_price?.calculated_amount ?? 0) > price.calculated_price_number
      )
    return { product, price, hasRange }
  })
  const byPrice = priced
    .filter((entry) => !!entry.price)
    .sort((a, b) => a.price!.calculated_price_number - b.price!.calculated_price_number)

  // The stack in the hero leads with the priciest print, then the newest ones.
  const lead = byPrice[byPrice.length - 1]?.product ?? visible[0]
  const deck: DeckCard[] = [...priced]
    .sort((a, b) => Number(b.product.id === lead?.id) - Number(a.product.id === lead?.id))
    .flatMap(({ product, price, hasRange }) => {
      const image = product.thumbnail ?? product.images?.[0]?.url
      if (!image || !product.handle) return []
      return [{
        id: product.id,
        title: product.title,
        href: `/products/${product.handle}`,
        image,
        price: price ? `${hasRange ? "From " : ""}${price.calculated_price}` : undefined,
      }]
    })
    .slice(0, DECK_SIZE)

  const widths = tileWidths(visible.length)

  return <>
    <Hero cards={deck} fromPrice={byPrice[0]?.price?.calculated_price} />

    <Marquee />

    <section className="content-container ink-products" id="latest">
      <Reveal className="ink-section-head"><div><p className="ink-kicker">Latest products</p><h2>Fresh from the workshop</h2><p>Discover our latest fidgets, with the newest arrivals first.</p></div><LocalizedClientLink href="/store?sortBy=created_at" className="ink-underlined mk-arrow-link">Explore the shop <ArrowRightMini aria-hidden="true" /></LocalizedClientLink></Reveal>
      {visible.length ? <div className="mk-tiles">{visible.map((product, index) => <Reveal key={product.id} effect="pop" className={`mk-tile-slot mk-tile-slot-${widths[index]}`} delay={(index % 3) * 90}><ProductTile product={product} /></Reveal>)}</div> : <Reveal className="ink-coming"><span aria-hidden="true">✳</span><h3>The next fidgets are on their way.</h3><p>We’re getting our first collection ready. Check back soon for the good stuff.</p><LocalizedClientLink href="/contact" className="ink-underlined">Say hello to the makers ↗</LocalizedClientLink></Reveal>}
    </section>

    <section className="content-container mk-made" id="made">
      <Reveal effect="left" className="mk-made-scene">
        <PrinterScene />
      </Reveal>
      <div className="mk-made-copy">
        <Reveal>
          <p className="ink-kicker">How they’re made</p>
          <h2>From a reel of filament to a toy in your hands.</h2>
        </Reveal>
        <ol className="mk-steps">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Reveal effect="right" delay={index * 110} className="mk-step">
                <span className="mk-step-number" aria-hidden="true">{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>

    <section className="content-container mk-values" aria-label="Good to know">
      {values.map(({ icon: Icon, title, text }, index) => (
        <Reveal key={title} className="mk-value" delay={index * 80}>
          <span className="mk-value-icon" aria-hidden="true"><Icon /></span>
          <h3>{title}</h3>
          <p>{text}</p>
        </Reveal>
      ))}
    </section>

    <section className="content-container mk-help-wrap">
      <Reveal effect="pop" className="mk-help">
        <div>
          <h2>A helping hand.</h2>
          <p>Question about an order, delivery or a refund? Email us with your order number and we’ll help.</p>
        </div>
        <LocalizedClientLink href="/contact" className="ink-button">
          Contact us <ArrowRightMini aria-hidden="true" />
        </LocalizedClientLink>
      </Reveal>
    </section>
  </>
}
