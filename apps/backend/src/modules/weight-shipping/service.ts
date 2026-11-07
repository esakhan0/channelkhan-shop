import { AbstractFulfillmentProviderService, MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { WEIGHT_OPTION_ID, weightServiceSchema, type WeightService } from "./config"
import type {
  CalculateShippingOptionPriceDTO,
  CalculatedShippingOptionPrice,
  CreateFulfillmentResult,
} from "@medusajs/framework/types"

const servicesSchema = z.array(weightServiceSchema).refine(services =>
  new Set(services.map(service => service.id)).size === services.length,
  "Shipping service IDs must be unique"
)

type Options = { services_json?: string }

/** GBP weight bands for one outbound parcel. Labels are purchased manually. */
export default class WeightShippingProvider extends AbstractFulfillmentProviderService {
  static identifier = "weight-shipping"
  private services: WeightService[]

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
    return [
      { id: WEIGHT_OPTION_ID, name: "Weight bands (manage in Settings)" },
      ...this.services.filter(service => service.id !== WEIGHT_OPTION_ID).map(({ id, name }) => ({ id, name })),
    ]
  }

  async validateOption(data: Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(data, "weight_config")) {
      const result = weightServiceSchema.safeParse(data.weight_config)
      return result.success && result.data.id === data.id
    }
    return data.id === WEIGHT_OPTION_ID || this.services.some(service => service.id === data.id)
  }

  async canCalculate() {
    return true
  }

  private getService(optionData: Record<string, unknown>) {
    // This is persisted ShippingOption.data, NOT customer-supplied shipping method data.
    if (Object.prototype.hasOwnProperty.call(optionData, "weight_config")) {
      const result = weightServiceSchema.safeParse(optionData.weight_config)
      if (!result.success || result.data.id !== optionData.id) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid shipping weight-band configuration. Please contact the shop.")
      }
      return result.data
    }
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
    if (data.id !== WEIGHT_OPTION_ID && !this.services.some(service => service.id === data.id)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "This shipping service is unavailable.")
    }
    return { data: { id: data.id }, labels: [] }
  }

  async cancelFulfillment() {
    return {}
  }

  async createReturnFulfillment(): Promise<CreateFulfillmentResult> {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Use a separate return shipping option.")
  }
}
