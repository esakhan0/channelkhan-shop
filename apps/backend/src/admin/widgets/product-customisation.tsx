import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"
import {
  DEFAULT_LABEL,
  DEFAULT_MAX_LENGTH,
  MAX_ALLOWED_LENGTH,
  MAX_LABEL_LENGTH,
  PRODUCT_KEYS,
  readCustomisationSettings,
} from "../../lib/customisation"
import { adminApi } from "../lib/admin-api"

type ProductMetadata = { product: { metadata: Record<string, unknown> | null } }

/**
 * A card on the product page where the shop owner switches customer text on
 * for that product, says what to ask for and sets the character limit.
 * The setting is saved in the product's metadata; the shop page reads it to
 * show the text box, and the server reads it to enforce the limit.
 */
const ProductCustomisation = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const saved = readCustomisationSettings(data.metadata)
  const [enabled, setEnabled] = useState(!!saved)
  const [label, setLabel] = useState(saved?.label ?? DEFAULT_LABEL)
  const [maxLength, setMaxLength] = useState(String(saved?.maxLength ?? DEFAULT_MAX_LENGTH))
  const [busy, setBusy] = useState(false)
  const queryClient = useQueryClient()

  const save = async (event: FormEvent) => {
    event.preventDefault()

    const limit = Number(maxLength)
    const limitIsValid = Number.isInteger(limit) && limit >= 1 && limit <= MAX_ALLOWED_LENGTH
    if (enabled && !label.trim()) {
      toast.error("Say what the customer should type, for example Number plate.")
      return
    }
    if (enabled && !limitIsValid) {
      toast.error(`Set the character limit to a whole number from 1 to ${MAX_ALLOWED_LENGTH}.`)
      return
    }

    setBusy(true)
    try {
      // Start from the metadata as it is now, so nothing saved elsewhere is lost.
      const current = await adminApi<ProductMetadata>(`/products/${data.id}?fields=id,metadata`)
      await adminApi(`/products/${data.id}`, {
        metadata: {
          ...(current.product.metadata ?? {}),
          [PRODUCT_KEYS.enabled]: enabled,
          [PRODUCT_KEYS.label]: label.trim() || DEFAULT_LABEL,
          [PRODUCT_KEYS.maxLength]: limitIsValid ? limit : DEFAULT_MAX_LENGTH,
        },
      })
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success(
        enabled
          ? "Saved. Customers will be asked for their text on this product."
          : "Saved. Customers will not be asked for text on this product."
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The setting could not be saved.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="p-0">
      <form onSubmit={save} className="flex flex-col gap-y-4 px-6 py-4">
        <div>
          <Heading level="h2">Customer text</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Let buyers type their own text for this product, such as a number plate or a name.
            You will see it on the order.
          </Text>
        </div>

        <div className="flex items-center gap-x-3">
          <Switch id="customisation-enabled" checked={enabled} onCheckedChange={setEnabled} disabled={busy} />
          <Label htmlFor="customisation-enabled">Ask the customer for text</Label>
        </div>

        {enabled && (
          <>
            <div className="flex flex-col gap-y-1">
              <Label htmlFor="customisation-label" size="small" weight="plus">
                What to ask for
              </Label>
              <Input
                id="customisation-label"
                value={label}
                maxLength={MAX_LABEL_LENGTH}
                placeholder="Number plate"
                onChange={(event) => setLabel(event.target.value)}
                disabled={busy}
              />
            </div>

            <div className="flex flex-col gap-y-1">
              <Label htmlFor="customisation-limit" size="small" weight="plus">
                Character limit
              </Label>
              <Input
                id="customisation-limit"
                type="number"
                min={1}
                max={MAX_ALLOWED_LENGTH}
                step={1}
                value={maxLength}
                onChange={(event) => setMaxLength(event.target.value)}
                disabled={busy}
              />
              <Text size="xsmall" className="text-ui-fg-subtle">
                Spaces count as characters.
              </Text>
            </div>
          </>
        )}

        <div>
          <Button type="submit" size="small" variant="secondary" isLoading={busy}>
            Save
          </Button>
        </div>
      </form>
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "product.details.side" })
export default ProductCustomisation
