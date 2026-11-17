/**
 * Customer text on a product ("customisation").
 *
 * The shop owner can let buyers type a short piece of text for a product, such
 * as the number plate for a keychain, and set how long it may be.
 *
 * - The setting lives in the product's metadata (see PRODUCT_KEYS).
 * - The buyer's text travels in the cart line's metadata (see LINE_KEYS).
 *   Medusa copies that onto the order, so it shows on the order page and in
 *   the order emails. Lines with different text never merge into one.
 *
 * This file is the one description of both. It imports nothing from Medusa, so
 * the admin widgets can use it as well as the server. The storefront has its
 * own copy of the reading side in
 * apps/storefront/src/lib/util/customisation.ts: keep the key names in step.
 */

export const PRODUCT_KEYS = {
  enabled: "customisation_enabled",
  label: "customisation_label",
  maxLength: "customisation_max_length",
} as const

export const LINE_KEYS = {
  text: "customisation",
  label: "customisation_label",
} as const

export const DEFAULT_LABEL = "Your text"
export const DEFAULT_MAX_LENGTH = 20
/** The longest limit a shop owner can set. */
export const MAX_ALLOWED_LENGTH = 200
export const MAX_LABEL_LENGTH = 40

/** Every message this file gives a buyer starts with this, so the storefront can recognise them. */
export const MESSAGE_PREFIX = "Customisation: "

export type CustomisationSettings = {
  /** What the buyer is asked for, such as "Number plate". */
  label: string
  /** The most characters the buyer may type. */
  maxLength: number
}

type Metadata = Record<string, unknown> | null | undefined

/** Counts what a person would call characters, so an emoji is one and not two. */
export const countCharacters = (text: string) => Array.from(text).length

/**
 * Reads a product's setting. Returns null when the product takes no customer
 * text. Values may arrive as strings, because Medusa's own metadata editor
 * saves everything as text.
 */
export function readCustomisationSettings(metadata: Metadata): CustomisationSettings | null {
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

/** Reads the buyer's text from a cart or order line. Returns null when there is none. */
export function readLineCustomisation(metadata: Metadata): { label: string; text: string } | null {
  const text = metadata?.[LINE_KEYS.text]
  if (typeof text !== "string" || !text.trim()) return null

  const label = metadata?.[LINE_KEYS.label]
  return {
    label: typeof label === "string" && label.trim() ? label.trim() : DEFAULT_LABEL,
    text,
  }
}

/**
 * Checks what a buyer sent for one cart line against the product's setting.
 * Returns a sentence to show the buyer when something is wrong, and null when
 * the line is fine. The server runs this on every way of putting an item in a
 * cart, so the limit holds even if someone skips the shop's own page.
 */
export function checkCustomisation(
  productMetadata: Metadata,
  lineMetadata: Metadata,
  productTitle = "This item"
): string | null {
  const settings = readCustomisationSettings(productMetadata)
  const text = lineMetadata?.[LINE_KEYS.text]
  const hasText = text !== undefined && text !== null && text !== ""

  if (!settings) {
    return hasText ? `${MESSAGE_PREFIX}${productTitle} cannot be personalised.` : null
  }

  if (typeof text !== "string" || !text.trim()) {
    return `${MESSAGE_PREFIX}Please fill in "${settings.label}" for ${productTitle}.`
  }

  // Tabs, line breaks and other control characters have no place on a print.
  if (/[\u0000-\u001f\u007f]/.test(text)) {
    return `${MESSAGE_PREFIX}"${settings.label}" must be one line of plain text.`
  }

  if (countCharacters(text) > settings.maxLength) {
    return `${MESSAGE_PREFIX}"${settings.label}" can be ${settings.maxLength} characters at most.`
  }

  // The label is stored with the text so the order shows what the buyer was
  // asked. It has to be the product's own label, not something made up.
  const label = lineMetadata?.[LINE_KEYS.label]
  if (label !== undefined && label !== null && label !== settings.label) {
    return `${MESSAGE_PREFIX}This item's options have changed. Please reload the page and try again.`
  }

  return null
}
