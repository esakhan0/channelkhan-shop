"use server"

import { sdk } from "@lib/config"
import { getCartStockLimits, type CartStockLimits } from "@lib/util/cart-stock"
import type { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { unstable_rethrow } from "next/navigation"
import { getAuthHeaders, getCacheTag, getCartId } from "./cookies"

export async function retrieveCartStock(cart: HttpTypes.StoreCart): Promise<CartStockLimits> {
  const ids = Array.from(new Set((cart.items ?? []).flatMap((item) => item.product_id ? [item.product_id] : [])))
  if (!ids.length) return {}
  try {
    const headers = await getAuthHeaders()
    const products: HttpTypes.StoreProduct[] = []
    for (let start = 0; start < ids.length; start += 50) {
      const result = await sdk.client.fetch<HttpTypes.StoreProductListResponse>("/store/products", {
        query: { id: ids.slice(start, start + 50), limit: 50,
          ...(cart.sales_channel_id ? { sales_channel_id: cart.sales_channel_id } : {}),
          fields: "id,variants.id,variants.manage_inventory,variants.allow_backorder,+variants.inventory_quantity" },
        headers, cache: "no-store",
      })
      products.push(...result.products)
    }
    return getCartStockLimits(cart.items ?? [], products)
  } catch (error) {
    unstable_rethrow(error)
    return {}
  }
}

export async function updateCartQuantity(input: { lineId: string; quantity: number }): Promise<
  { success: true } | { success: false; error: string }
> {
  if (!input?.lineId || !Number.isSafeInteger(input.quantity) || input.quantity < 1) {
    return { success: false, error: "Choose a whole-number quantity of at least 1." }
  }
  try {
    const cartId = await getCartId()
    if (!cartId) return { success: false, error: "Your bag has expired. Refresh the page and add the item again." }
    // Medusa checks stock on the server, including reservations and sales-channel locations.
    // UI limits are only guidance; concurrent purchases still go through this check.
    await sdk.store.cart.updateLineItem(cartId, input.lineId, { quantity: input.quantity }, {}, await getAuthHeaders())
    revalidateTag(await getCacheTag("carts"), { expire: 0 })
    revalidateTag(await getCacheTag("fulfillment"), { expire: 0 })
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    const message = error instanceof Error ? error.message : ""
    if (/inventory|stock|insufficient.*quantity/i.test(message)) {
      return { success: false, error: "That quantity is no longer available. Choose a smaller quantity or remove the item." }
    }
    // Return expected failures as data: thrown server-action messages are hidden in production.
    return { success: false, error: "We couldn’t update your quantity. Please try again." }
  }
}
