export const SHIPPING_QUOTE_ERROR = "We couldn't calculate delivery. Please retry or contact us."

// Only known provider messages are safe to display; never expose arbitrary upstream errors.
const messages: Record<string, string> = {
  "A cart item has missing or invalid shipping weight. Please contact the shop.":
    "A product in your bag has no valid shipping weight. Please contact us so we can fix it.",
  "This parcel exceeds the shipping service's weight limit. Please contact the shop.":
    "Your bag exceeds this delivery service's weight limit. Please contact us for delivery options.",
  "This shipping service is unavailable for the delivery country.":
    "This delivery service isn't available for your delivery country.",
  "This shipping service requires a GBP cart.":
    "This delivery service is available for GBP orders only.",
  "This shipping service is unavailable.":
    "This delivery service isn't configured yet. Please contact us.",
  "Invalid shipping weight-band configuration. Please contact the shop.":
    "This delivery service needs its rates checked. Please contact us.",
}

export function shippingErrorMessage(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? error.message : undefined
  return typeof message === "string" ? messages[message] || SHIPPING_QUOTE_ERROR : SHIPPING_QUOTE_ERROR
}
