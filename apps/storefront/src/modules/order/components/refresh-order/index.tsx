"use client"

import { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { orderRefunds } from "@lib/util/order-refunds"

type TrackedParcel = NonNullable<HttpTypes.StoreOrder["fulfillments"]>[number] & {
  labels?: { tracking_number?: string; tracking_url?: string }[]
}

// Reads refreshed server data; does not create notifications or expose a new API.
export default function RefreshOrder({ orders }: { orders: HttpTypes.StoreOrder[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const previous = useRef(new Map<string, string>())
  const lastRefresh = useRef(0)
  const [notice, setNotice] = useState<{ id: string; number?: number } | null>(null)

  useEffect(() => {
    const next = new Map<string, string>()
    for (const order of orders) {
      const snapshot = JSON.stringify({
        status: order.status,
        payment: order.payment_status,
        refunds: orderRefunds(order),
        delivery: order.fulfillment_status,
        parcels: (order.fulfillments as TrackedParcel[] | undefined)?.map((parcel) => ({
          id: parcel.id,
          shipped: parcel.shipped_at,
          delivered: parcel.delivered_at,
          canceled: parcel.canceled_at,
          labels: parcel.labels?.map((label) => `${label.tracking_number}:${label.tracking_url}`).sort(),
        })).sort((a, b) => a.id.localeCompare(b.id)),
      })
      const before = previous.current.get(order.id)
      if (before && before !== snapshot) setNotice({ id: order.id, number: order.display_id })
      next.set(order.id, snapshot)
    }
    previous.current = next
  }, [orders])

  useEffect(() => {
    const refresh = () => {
      if (pending || document.visibilityState !== "visible" || !navigator.onLine) return
      if (Date.now() - lastRefresh.current < 15_000) return
      lastRefresh.current = Date.now()
      start(() => router.refresh())
    }
    const timer = window.setInterval(refresh, 60_000)
    window.addEventListener("focus", refresh)
    window.addEventListener("online", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", refresh)
      window.removeEventListener("online", refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [router, pending])

  return <div className="joy-order-updates">
    <div className="joy-order-update-controls">
      <span>Checks for updates every minute while this page is open.</span>
      <button className="joy-order-refresh" disabled={pending} onClick={() => {
        lastRefresh.current = Date.now()
        start(() => router.refresh())
      }}>
        {pending ? "Checking…" : "Check for updates"}
      </button>
    </div>
    <div role="status" aria-live="polite" aria-atomic="true">
      {notice && <div className="joy-order-notice">
        <LocalizedClientLink href={`/account/orders/details/${notice.id}`}>
          {notice.number ? `Order #${notice.number}` : "Your order"} has an update. View the latest payment, delivery and tracking details.
        </LocalizedClientLink>
        <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss order update">×</button>
      </div>}
    </div>
  </div>
}
