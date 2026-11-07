import { Text } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  // const pricedProduct = await listProducts({
  //   regionId: region.id,
  //   queryParams: { id: [product.id!] },
  // }).then(({ response }) => response.products[0])

  // if (!pricedProduct) {
  //   return null
  // }

  const { cheapestPrice } = getProductPrice({
    product,
  })
  const hasPriceRange = !!cheapestPrice && product.variants?.some(variant =>
    (variant.calculated_price?.calculated_amount ?? 0) > cheapestPrice.calculated_price_number)

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group mukky-product-card">
      <div className="mukky-card-content" data-testid="product-wrapper">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          alt={product.title}
          size="square"
          className="mukky-card-photo"
        />
        <div className="mukky-card-details">
          <Text className="text-ui-fg-subtle" data-testid="product-title">
            {product.title}
          </Text>
          <div className="mukky-card-price">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} from={hasPriceRange} />}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
