import { HttpTypes } from "@medusajs/types"

export const isVariantInStock = (
  variant: HttpTypes.StoreProductVariant | undefined
) =>
  !!variant &&
  (!variant.manage_inventory ||
    !!variant.allow_backorder ||
    (variant.inventory_quantity ?? 0) > 0)

export const getVariantStockLabel = (variant: HttpTypes.StoreProductVariant) => {
  if (!variant.manage_inventory) return "Available"
  const quantity = variant.inventory_quantity
  if (typeof quantity === "number" && Number.isFinite(quantity) && quantity > 0) {
    return `${quantity} in stock`
  }
  return variant.allow_backorder ? "Available to order" : "Out of stock"
}
