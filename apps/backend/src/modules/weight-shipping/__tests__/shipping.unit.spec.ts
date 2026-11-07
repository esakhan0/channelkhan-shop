import type { CalculateShippingOptionPriceDTO } from "@medusajs/framework/types"
import WeightShippingProvider from "../service"

// Test prices only, not Royal Mail tariffs.
const service = {
  id: "standard", name: "Standard", country_codes: ["gb"],
  packaging_weight_g: 50, tax_inclusive: false,
  bands: [
    { max_weight_g: 250, price_pence: 200 },
    { max_weight_g: 1000, price_pence: 400 },
  ],
}
const provider = () => new WeightShippingProvider({}, { services_json: JSON.stringify([service]) })
const context = (weight: unknown = 100, quantity = 1) => ({
  currency_code: "gbp", shipping_address: { country_code: "gb" },
  items: [{ requires_shipping: true, quantity, variant: { weight } }],
} as unknown as CalculateShippingOptionPriceDTO["context"])

describe("weight shipping provider", () => {
  it.each([[100, 1, 2], [100, 2, 2], [100, 3, 4], [950, 1, 4], [200.01, 1, 4]])(
    "quotes weight %s × %s with packaging and inclusive band boundaries",
    async (weight, quantity, expected) => {
      await expect(provider().calculatePrice({ id: "standard" }, {}, context(weight, quantity)))
        .resolves.toEqual({ calculated_amount: expected, is_calculated_price_tax_inclusive: false })
    }
  )

  it("adds mixed products and ignores browser-supplied weight and price", async () => {
    const cart = context(100, 1)
    cart.items.push(context(80, 2).items[0])
    await expect(provider().calculatePrice({ id: "standard", price_pence: 1 }, {
      weight: 0, quantity: 0, calculated_amount: 0, id: "other", items: [],
    }, cart)).resolves.toMatchObject({ calculated_amount: 4 })
    await expect(provider().validateFulfillmentData({ id: "standard" }))
      .resolves.toEqual({ id: "standard" })
  })

  it.each([null, undefined, 0, -10, NaN, Infinity, "invalid"])("rejects invalid weight %s", async weight => {
    const cart = context()
    cart.items[0].variant.weight = weight as number
    await expect(provider().calculatePrice({ id: "standard" }, {}, cart)).rejects.toThrow(/weight/)
  })

  it.each([0, -1, 1.5, Infinity])("rejects invalid quantity %s", async quantity => {
    await expect(provider().calculatePrice({ id: "standard" }, {}, context(100, quantity)))
      .rejects.toThrow(/weight/)
  })

  it("rejects overweight carts instead of charging the highest band", async () => {
    await expect(provider().calculatePrice({ id: "standard" }, {}, context(951)))
      .rejects.toThrow(/exceeds/)
  })

  it("rejects unsupported destinations, currencies and services", async () => {
    await expect(provider().calculatePrice({ id: "standard" }, {}, {
      ...context(), shipping_address: { country_code: "us" },
    } as CalculateShippingOptionPriceDTO["context"])).rejects.toThrow(/country/)
    await expect(provider().calculatePrice({ id: "standard" }, {}, {
      ...context(), currency_code: "usd",
    })).rejects.toThrow(/GBP/)
    await expect(provider().calculatePrice({ id: "unknown" }, {}, context())).rejects.toThrow(/unavailable/)
  })

  it("skips digital items and refuses empty physical shipments", async () => {
    const cart = context()
    const digital = context(9000).items[0]
    digital.requires_shipping = false
    cart.items.push(digital)
    await expect(provider().calculatePrice({ id: "standard" }, {}, cart)).resolves.toMatchObject({ calculated_amount: 2 })
    cart.items = [digital]
    await expect(provider().calculatePrice({ id: "standard" }, {}, cart)).rejects.toThrow(/No physical/)
  })

  it("requires explicit valid configuration and offers nothing by default", async () => {
    await expect(new WeightShippingProvider({}).getFulfillmentOptions()).resolves.toEqual([])
    for (const services of ["invalid-json", [service, service], [{ ...service, bands: [...service.bands].reverse() }],
      [{ ...service, bands: [{ max_weight_g: 250, price_pence: -1 }] }]]) {
      expect(() => new WeightShippingProvider({}, {
        services_json: typeof services === "string" ? services : JSON.stringify(services),
      })).toThrow(/configuration/)
    }
  })

  it("propagates the configured tax treatment and supports manual fulfillment", async () => {
    const p = new WeightShippingProvider({}, { services_json: JSON.stringify([{ ...service, tax_inclusive: true }]) })
    await expect(p.calculatePrice({ id: "standard" }, {}, context())).resolves.toMatchObject({ is_calculated_price_tax_inclusive: true })
    await expect(p.createFulfillment({ id: "standard" })).resolves.toEqual({ data: { id: "standard" }, labels: [] })
    await expect(p.createReturnFulfillment()).rejects.toThrow(/return/)
    await expect(p.calculatePrice({ id: "standard" }, {}, { ...context(), return_id: "ret_test", return_items: [] }))
      .rejects.toThrow(/returns/)
  })

  it("allows an explicitly configured free band", async () => {
    const p = new WeightShippingProvider({}, { services_json: JSON.stringify([{
      ...service, bands: [{ max_weight_g: 250, price_pence: 0 }],
    }]) })
    await expect(p.calculatePrice({ id: "standard" }, {}, context())).resolves.toMatchObject({ calculated_amount: 0 })
  })
})
