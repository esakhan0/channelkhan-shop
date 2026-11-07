import { z } from "@medusajs/framework/zod"

export const WEIGHT_OPTION_ID = "weight-bands"
export const WEIGHT_PROVIDER_ID = "weight-shipping_weight-shipping"

export const weightServiceSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/),
  name: z.string().trim().min(1),
  country_codes: z.array(z.string().regex(/^[a-z]{2}$/)).min(1),
  packaging_weight_g: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  tax_inclusive: z.boolean(),
  bands: z.array(z.object({
    max_weight_g: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    price_pence: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  }).strict()).min(1),
}).strict().refine(service => service.bands.every((band, i, bands) =>
  i === 0 || band.max_weight_g > bands[i - 1].max_weight_g
), "Weight bands must be in strictly increasing order")

export type WeightService = z.infer<typeof weightServiceSchema>
