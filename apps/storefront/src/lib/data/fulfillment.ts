"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders } from "./cookies"
import { unstable_rethrow } from "next/navigation"
import { SHIPPING_QUOTE_ERROR, shippingErrorMessage } from "@lib/util/shipping-error"

export const listCartShippingMethods = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: {
          cart_id: cartId,
        },
        headers,
        cache: "no-store",
      }
    )
    .then(({ shipping_options }) => shipping_options)
    .catch(() => {
      return null
    })
}

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const body = { cart_id: cartId, data }

  if (data) {
    body.data = data
  }

  return sdk.client
    .fetch<{ shipping_option: HttpTypes.StoreCartShippingOption }>(
      `/store/shipping-options/${optionId}/calculate`,
      {
        method: "POST",
        body,
        headers,
        cache: "no-store",
      }
    )
    .then(({ shipping_option }) => {
      if (typeof shipping_option?.amount !== "number" || !Number.isFinite(shipping_option.amount) || shipping_option.amount < 0) {
        return { shipping_option: null, error: SHIPPING_QUOTE_ERROR }
      }
      return { shipping_option, error: null }
    })
    .catch((error: unknown) => {
      unstable_rethrow(error)
      return { shipping_option: null, error: shippingErrorMessage(error) }
    })
}
