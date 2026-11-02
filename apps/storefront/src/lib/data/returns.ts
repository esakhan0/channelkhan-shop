"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"
import { CustomerReturn, ReturnDetails } from "types/customer-returns"

export async function listCustomerReturns(offset = 0) {
  return sdk.client.fetch<{ returns: CustomerReturn[]; count: number; offset: number; limit: number }>(
    "/store/account/returns", { headers: await getAuthHeaders(), query: { offset }, cache: "no-store" }
  )
}

export async function getReturnDetails(orderId: string) {
  return sdk.client.fetch<ReturnDetails>(`/store/account/returns/${encodeURIComponent(orderId)}`, {
    headers: await getAuthHeaders(), cache: "no-store",
  })
}

export async function requestCustomerReturn(
  _state: { success: boolean; error: string | null }, form: FormData
): Promise<{ success: boolean; error: string | null }> {
  try {
    const headers = await getAuthHeaders()
    if (!headers.authorization) return { success: false, error: "Please sign in to request a return." }
    const raw = form.get("items")
    if (typeof raw !== "string" || raw.length > 20000) throw new Error("Invalid items")
    const items = JSON.parse(raw)
    await sdk.client.fetch("/store/returns", {
      method: "POST", headers,
      body: { order_id: form.get("order_id"), items,
        return_shipping: { option_id: form.get("shipping_option_id") } },
    })
    return { success: true, error: null }
  } catch (error) {
    const status = (error as { status?: number }).status
    return { success: false, error: status === 401 ? "Please sign in again." :
      status === 400 ? "We couldn’t submit this return. Refresh the page and check the selected items, quantities and shipping method." :
        "We couldn’t submit your request. Check My Returns before trying again." }
  }
}
