import type { BigNumberInput } from "@medusajs/framework/types"
import { MathBN, MedusaError } from "@medusajs/framework/utils"

export const STOREFRONT_PAYMENT_PROVIDER = "pp_stripe_stripe"

export function assertStorefrontPaymentProvider(providerId: unknown) {
  if (providerId !== STOREFRONT_PAYMENT_PROVIDER) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Please select card or wallet payment at checkout.")
  }
}

type Amount = { amount?: BigNumberInput | null; currency_code?: string }
type CheckoutCart = {
  total?: BigNumberInput | null
  currency_code: string
  payment_collection?: (Amount & {
    payment_sessions?: (Amount & { provider_id: string; status: string })[] | null
  }) | null
}

// Runs on the server's persisted cart snapshot, inside Medusa's completion lock.
// Medusa still authorizes the session with Stripe; this does not mark anything paid.
export function validateCheckoutPayment(cart: CheckoutCart) {
  const total = cart.total == null ? null : MathBN.convert(cart.total)
  if (!total?.isFinite() || total.isNegative()) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Unable to verify the checkout total.")
  }
  // A genuinely free cart does not require collecting money.
  if (total.isZero()) return

  const currency = cart.currency_code.toLowerCase()
  const precision = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2
  const matches = (payment: Amount | null | undefined) =>
    payment?.amount != null && payment.currency_code?.toLowerCase() === currency &&
    MathBN.convert(payment.amount).isFinite() &&
    MathBN.convert(payment.amount).decimalPlaces(precision).eq(total.decimalPlaces(precision))

  if (!matches(cart.payment_collection)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Your cart total has changed. Please select payment again.")
  }
  const sessions = cart.payment_collection?.payment_sessions?.filter(({ status }) =>
    ["pending", "requires_more", "authorized", "captured", "pending_authorization"].includes(status)
  ) || []
  if (!sessions.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Please select payment again.")
  }
  for (const session of sessions) {
    assertStorefrontPaymentProvider(session.provider_id)
    if (!matches(session)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Your payment does not match the cart total. Please select payment again.")
    }
  }
}
