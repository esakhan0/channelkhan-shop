"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { unstable_rethrow } from "next/navigation"
import { getAuthHeaders, getCacheTag, getCartId } from "./cookies"

export async function changePromotion(action: "add" | "remove", entered: string) {
  const trimmed = typeof entered === "string" ? entered.trim() : ""
  if (!trimmed || trimmed.length > 255 || !["add", "remove"].includes(action)) {
    return { ok: false, message: "Enter a valid promotion code." }
  }
  const code = action === "add" && /^mukky$/i.test(trimmed) ? "MUKKY" : trimmed
  const id = await getCartId()
  if (!id) return { ok: false, message: "Add an item to your cart first." }
  try {
    const { cart } = await sdk.client.fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}/promotions`, {
      method: action === "add" ? "POST" : "DELETE",
      body: { promo_codes: [code] }, headers: await getAuthHeaders(),
      query: { fields: "+promotions.code" }, cache: "no-store",
    })
    for (const name of ["carts", "fulfillment"]) {
      const tag = await getCacheTag(name)
      if (tag) revalidateTag(tag, { expire: 0 })
    }
    const present = cart.promotions?.some(p => p.code === code) ?? false
    if (action === "add" && !present) return { ok: false, message: "That code doesn’t apply to this cart. Check the code and offer conditions." }
    if (action === "remove" && present) return { ok: false, message: "That promotion is still applied to your cart." }
    return { ok: true, message: action === "add" ? `${code} applied.` : `${code} removed.` }
  } catch (error) {
    unstable_rethrow(error)
    const status = (error as { status?: number } | null)?.status
    return { ok: false, message: action === "add" && [400, 422].includes(status ?? 0)
      ? "That code couldn’t be applied. Check the spelling and offer conditions."
      : "We couldn’t update your promotion. Refresh your cart and try again." }
  }
}
