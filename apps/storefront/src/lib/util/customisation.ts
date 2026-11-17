/**
 * Customer text on a product ("customisation"), as the shop pages read it.
 *
 * The shop owner can let buyers type a short piece of text for a product, such
 * as the number plate for a keychain, and set how long it may be. The setting
 * lives in the product's metadata; the buyer's text travels in the cart line's
 * metadata, which Medusa copies onto the order.
 *
 * The server enforces the rules, in apps/backend/src/lib/customisation.ts.
 * This file only reads the same values to show the text box and the text.
 * Keep the key names and limits here in step with that file.
 */

const PRODUCT_KEYS = {
  enabled: "customisation_enabled",
  label: "customisation_label",
  maxLength: "customisation_max_length",
} as const

const LINE_KEYS = {
  text: "customisation",
  label: "customisation_label",
} as const

const DEFAULT_LABEL = "Your text"
const DEFAULT_MAX_LENGTH = 20
const MAX_ALLOWED_LENGTH = 200
const MAX_LABEL_LENGTH = 40

/** The server starts every message about customer text with this. */
export const CUSTOMISATION_MESSAGE_PREFIX = "Customisation: "

export type CustomisationSettings = {
  /** What the buyer is asked for, such as "Number plate". */
  label: string
  /** The most characters the buyer may type. */
  maxLength: number
}

type Metadata = Record<string, unknown> | null | undefined

/** Counts what a person would call characters, so an emoji is one and not two. */
export const countCharacters = (text: string) => Array.from(text).length

/** A product's setting, or null when the product takes no customer text. */
export function getCustomisationSettings(
  product: { metadata?: Metadata } | null | undefined
): CustomisationSettings | null {
  const metadata = product?.metadata
  const enabled = metadata?.[PRODUCT_KEYS.enabled]
  if (enabled !== true && enabled !== "true") return null

  const rawLabel = metadata?.[PRODUCT_KEYS.label]
  const label = typeof rawLabel === "string" ? rawLabel.trim().slice(0, MAX_LABEL_LENGTH) : ""

  const rawLimit = metadata?.[PRODUCT_KEYS.maxLength]
  const limit = typeof rawLimit === "number" || typeof rawLimit === "string" ? Number(rawLimit) : NaN
  const validLimit = Number.isInteger(limit) && limit >= 1 && limit <= MAX_ALLOWED_LENGTH

  return {
    label: label || DEFAULT_LABEL,
    maxLength: validLimit ? limit : DEFAULT_MAX_LENGTH,
  }
}

/** The metadata to send with a cart line for a buyer's text. */
export const customisationMetadata = (settings: CustomisationSettings, text: string) => ({
  [LINE_KEYS.text]: text.trim(),
  [LINE_KEYS.label]: settings.label,
})

/** The buyer's text on a cart or order line, or null when there is none. */
export function getLineCustomisation(metadata: Metadata): { label: string; text: string } | null {
  const text = metadata?.[LINE_KEYS.text]
  if (typeof text !== "string" || !text.trim()) return null

  const label = metadata?.[LINE_KEYS.label]
  return {
    label: typeof label === "string" && label.trim() ? label.trim() : DEFAULT_LABEL,
    text,
  }
}
