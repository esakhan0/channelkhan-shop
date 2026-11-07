import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { weightServiceSchema } from "../../modules/weight-shipping/config"

// Extend validation on native shipping-option routes; their auth and permissions remain native.
export function validateWeightShippingConfig(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  const data = (req.body as { data?: Record<string, unknown> } | undefined)?.data
  if (data && Object.prototype.hasOwnProperty.call(data, "weight_config")) {
    const result = weightServiceSchema.safeParse(data.weight_config)
    if (!result.success || result.data.id !== data.id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA,
        "Invalid weight bands. Use increasing whole-gram limits, non-negative prices in pence, packaging weight and country codes.")
    }
  }
  next()
}
