import { getLineCustomisation } from "@lib/util/customisation"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

type LineItemOptionsProps = {
  variant: HttpTypes.StoreProductVariant | undefined
  /** The line's metadata. When it holds text the buyer typed, that is shown too. */
  metadata?: Record<string, unknown> | null
  "data-testid"?: string
  "data-value"?: HttpTypes.StoreProductVariant
}

/** The details under a cart or order line: its variant, and the buyer's own text if it has any. */
const LineItemOptions = ({
  variant,
  metadata,
  "data-testid": dataTestid,
  "data-value": dataValue,
}: LineItemOptionsProps) => {
  const custom = getLineCustomisation(metadata)

  return (
    <>
      <Text
        data-testid={dataTestid}
        data-value={dataValue}
        className="inline-block txt-medium text-ui-fg-subtle w-full overflow-hidden text-ellipsis"
      >
        Variant: {variant?.title}
      </Text>
      {custom && (
        <Text
          data-testid="product-customisation"
          className="inline-block txt-medium text-ui-fg-subtle w-full break-words"
        >
          {custom.label}: <span className="mk-custom-value">{custom.text}</span>
        </Text>
      )}
    </>
  )
}

export default LineItemOptions
