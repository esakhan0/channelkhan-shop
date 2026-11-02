import type { HttpTypes } from "@medusajs/types"

// null means no stock ceiling (backorders or inventory tracking disabled).
// A missing entry means stock could not be checked, never unlimited stock.
export type CartStockLimits = Record<string, number | null>

export function getCartStockLimits(
  items: HttpTypes.StoreCartLineItem[],
  products: HttpTypes.StoreProduct[]
): CartStockLimits {
  const variants = new Map(products.flatMap((product) => (product.variants ?? []).map((variant) => [variant.id, variant] as const)))
  const limits: CartStockLimits = {}
  for (const item of items) {
    const variant = item.variant_id ? variants.get(item.variant_id) : undefined
    if (!variant) continue
    if (!variant.manage_inventory || variant.allow_backorder) {
      limits[item.id] = null
    } else if (typeof variant.inventory_quantity === "number" && Number.isFinite(variant.inventory_quantity)) {
      // Separate lines can share a variant (for example, different personalisations).
      const otherQuantity = items.filter((other) => other.id !== item.id && other.variant_id === item.variant_id)
        .reduce((sum, other) => sum + other.quantity, 0)
      limits[item.id] = Math.max(0, Math.floor(variant.inventory_quantity - otherQuantity))
    }
  }
  return limits
}
