import { getProductPrice } from "@lib/util/get-product-price"
import { ArrowRightMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/** A large colour tile for the home page: product name, price and photo. */
export default function ProductTile({ product }: { product: HttpTypes.StoreProduct }) {
  const { cheapestPrice } = getProductPrice({ product })
  const hasPriceRange =
    !!cheapestPrice &&
    product.variants?.some(
      (variant) =>
        (variant.calculated_price?.calculated_amount ?? 0) >
        cheapestPrice.calculated_price_number
    )
  const photo = product.thumbnail ?? product.images?.[0]?.url

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="mk-tile"
      data-testid="product-wrapper"
    >
      <div className="mk-tile-copy">
        <h3 data-testid="product-title">{product.title}</h3>
        {cheapestPrice && (
          <p data-testid="price">
            {hasPriceRange ? "From " : ""}
            {cheapestPrice.calculated_price}
          </p>
        )}
        {/* Decoration only: the whole tile is the link. */}
        <span className="mk-tile-go" aria-hidden="true">
          <ArrowRightMini />
        </span>
      </div>
      <div className="mk-tile-photo">
        {photo && (
          <Image src={photo} alt="" fill sizes="(max-width: 750px) 90vw, 640px" />
        )}
      </div>
    </LocalizedClientLink>
  )
}
