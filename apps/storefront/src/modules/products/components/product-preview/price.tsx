import { Text } from "@modules/common/components/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price, from }: { price: VariantPrice; from?: boolean }) {
  if (!price) {
    return null
  }

  return (
    <>
      {price.price_type === "sale" && (
        <Text
          className="line-through text-ui-fg-muted"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
      <Text
        className="mukky-card-amount"
        data-testid="price"
      >
        {from ? "From " : ""}{price.calculated_price}
      </Text>
    </>
  )
}
