import { assertStorefrontPaymentProvider, validateCheckoutPayment } from "../checkout-payment"

const cart = () => ({
  total: 6, currency_code: "gbp",
  payment_collection: {
    amount: 6, currency_code: "gbp",
    payment_sessions: [{ provider_id: "pp_stripe_stripe", amount: 6, currency_code: "gbp", status: "pending" }],
  },
})

describe("Server checkout payment policy", () => {
  it.each([undefined, "pp_system_default", "pp_stripe_fake", "manual"])("rejects direct session requests for %s", (provider) => {
    expect(() => assertStorefrontPaymentProvider(provider)).toThrow("card or wallet")
  })
  it("allows Stripe to proceed to native payment authorization", () => {
    expect(() => validateCheckoutPayment(cart())).not.toThrow()
  })
  it("rejects a previously created manual session at completion", () => {
    const input = cart()
    input.payment_collection.payment_sessions[0].provider_id = "pp_system_default"
    expect(() => validateCheckoutPayment(input)).toThrow("card or wallet")
  })
  it("does not accept a manual session alongside Stripe", () => {
    const input = cart()
    input.payment_collection.payment_sessions.push({ ...input.payment_collection.payment_sessions[0], provider_id: "pp_system_default" })
    expect(() => validateCheckoutPayment(input)).toThrow("card or wallet")
  })
  it("rejects a stale payment collection after the cart changes", () => {
    const input = cart()
    input.total = 12
    expect(() => validateCheckoutPayment(input)).toThrow("cart total has changed")
  })
  it.each([0, 3, 12, NaN])("rejects a mismatched session amount %s", (amount) => {
    const input = cart()
    input.payment_collection.payment_sessions[0].amount = amount
    expect(() => validateCheckoutPayment(input)).toThrow("payment does not match")
  })
  it("rejects a different session currency", () => {
    const input = cart()
    input.payment_collection.payment_sessions[0].currency_code = "usd"
    expect(() => validateCheckoutPayment(input)).toThrow("payment does not match")
  })
  it("rejects a canceled session", () => {
    const input = cart()
    input.payment_collection.payment_sessions[0].status = "canceled"
    expect(() => validateCheckoutPayment(input)).toThrow("select payment again")
  })
  it("allows server-calculated free carts but rejects missing or invalid totals", () => {
    expect(() => validateCheckoutPayment({ total: 0, currency_code: "gbp" })).not.toThrow()
    for (const total of [undefined, null, NaN, -1, Infinity]) {
      expect(() => validateCheckoutPayment({ total, currency_code: "gbp" })).toThrow("checkout total")
    }
  })
})
