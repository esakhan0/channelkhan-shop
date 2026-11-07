import { AbstractFulfillmentProviderService, MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import type {
  CalculateShippingOptionPriceDTO,
  CalculatedShippingOptionPrice,
  CreateFulfillmentResult,
} from "@medusajs/framework/types"

const serviceSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/),
  name: z.string().trim().min(1),
  country_codes: z.array(z.string().regex(/^[a-z]{2}$/)).min(1),
  packaging_weight_g: z.number().int().nonnegative(),
  tax_inclusive: z.boolean(),
  bands: z.array(z.object({
    max_weight_g: z.number().int().positive(),
    price_pence: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  }).strict()).min(1),
}).strict().refine(service => service.bands.every((band, i, bands) =>
  i === 0 || band.max_weight_g > bands[i - 1].max_weight_g
), "Weight bands must be in strictly increasing order")

const servicesSchema = z.array(serviceSchema).refine(services =>
  new Set(services.map(service => service.id)).size === services.length,
  "Shipping service IDs must be unique"
)

type Options = { services_json?: string }
type Service = z.infer<typeof serviceSchema>

/** GBP weight bands for one outbound parcel. Labels are purchased manually. */
export default class WeightShippingProvider extends AbstractFulfillmentProviderService {
  static identifier = "weight-shipping"
  private services: Service[]

  constructor(container: Record<string, unknown>, options: Options = {}) {
    super()
    try {
      this.services = servicesSchema.parse(JSON.parse(options.services_json || "[]"))
    } catch {
      throw new MedusaError(MedusaError.Types.INVALID_DATA,
        "Invalid WEIGHT_SHIPPING_SERVICES configuration. Check the weight-shipping setup guide.")
    }
  }

  async getFulfillmentOptions() {
    return this.services.map(({ id, name }) => ({ id, name }))
  }

  async validateOption(data: Record<string, unknown>) {
    return this.services.some(service => service.id === data.id)
  }

  async canCalculate() {
    return true
  }

  private getService(optionData: Record<string, unknown>) {
    const service = this.services.find(service => service.id === optionData.id)
    if (!service) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "This shipping service is unavailable.")
    }
    return service
  }

  async validateFulfillmentData(optionData: Record<string, unknown>) {
    const service = this.getService(optionData)
    // Persist only the configured service ID, never customer-supplied rates or weights.
    return { id: service.id }
  }

  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    _data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    const service = this.getService(optionData)
    if (context.return_id || context.exchange_id || context.claim_id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Use a separate shipping option for returns and exchanges.")
    }
    if (context.currency_code !== "gbp") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "This shipping service requires a GBP cart.")
    }
    const country = context.shipping_address?.country_code?.toLowerCase()
    if (!country || !service.country_codes.includes(country)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "This shipping service is unavailable for the delivery country.")
    }
    const items = context.items?.filter(item => item.requires_shipping !== false)
    if (!items?.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No physical items to ship.")
    }
    let grams = service.packaging_weight_g
    for (const item of items) {
      // Medusa supplies persisted variants and quantities in this context.
      const weight = Number(item.variant?.weight)
      const quantity = Number(item.quantity)
      if (!Number.isFinite(weight) || weight <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA,
          "A cart item has missing or invalid shipping weight. Please contact the shop.")
      }
      grams += weight * quantity
    }
    // Round upwards so fractional grams never qualify for a lighter band.
    const band = service.bands.find(band => Math.ceil(grams) <= band.max_weight_g)
    if (!band || !Number.isFinite(grams)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA,
        "This parcel exceeds the shipping service's weight limit. Please contact the shop.")
    }
    return {
      calculated_amount: band.price_pence / 100,
      is_calculated_price_tax_inclusive: service.tax_inclusive,
    }
  }

  async createFulfillment(data: Record<string, unknown>): Promise<CreateFulfillmentResult> {
    return { data: { id: this.getService(data).id }, labels: [] }
  }

  async cancelFulfillment() {
    return {}
  }

  async createReturnFulfillment(): Promise<CreateFulfillmentResult> {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Use a separate return shipping option.")
  }
}
