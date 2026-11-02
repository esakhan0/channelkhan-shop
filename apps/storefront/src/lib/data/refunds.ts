"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"
import { revalidatePath } from "next/cache"
import { CustomerRefund, RefundDetails } from "types/customer-refunds"

export async function listCustomerRefunds(offset = 0) {
  return sdk.client.fetch<{ requests: CustomerRefund[]; count: number; offset: number; limit: number }>(
    "/store/account/refund-requests", { headers: await getAuthHeaders(), query: { offset }, cache: "no-store" }
  )
}

export async function getRefundDetails(orderId: string) {
  return sdk.client.fetch<RefundDetails>(`/store/account/refund-requests/${encodeURIComponent(orderId)}`, {
    headers: await getAuthHeaders(), cache: "no-store",
  })
}

export async function requestCustomerRefund(
  _state: { success: boolean; error: string | null }, form: FormData
): Promise<{ success: boolean; error: string | null }> {
  try {
    const headers = await getAuthHeaders()
    if (!headers.authorization) return { success: false, error: "Please sign in to request a refund." }
    const raw = form.get("items")
    if (typeof raw !== "string" || raw.length > 20000) throw new Error("Invalid items")
    await sdk.client.fetch("/store/account/refund-requests", {
      method: "POST", headers,
      body: { order_id: form.get("order_id"), kind: form.get("kind"),
        customer_note: form.get("customer_note"), items: JSON.parse(raw) },
    })
  } catch (error) {
    const status = (error as { status?: number }).status
    return { success: false, error: status === 401 ? "Please sign in again." :
      status === 400 ? "Check My Refunds for an existing request, then refresh this page and check the items and quantities." :
        "We couldn’t confirm your request. Check My Refunds before trying again." }
  }
  revalidatePath("/[countryCode]/account", "layout")
  return { success: true, error: null }
}
