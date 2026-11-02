"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"
import { CustomerReturn } from "types/customer-returns"

export async function listCustomerReturns(offset = 0) {
  return sdk.client.fetch<{ returns: CustomerReturn[]; count: number; offset: number; limit: number }>(
    "/store/account/returns", { headers: await getAuthHeaders(), query: { offset }, cache: "no-store" }
  )
}
