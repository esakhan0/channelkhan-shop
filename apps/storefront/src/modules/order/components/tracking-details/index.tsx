import { HttpTypes } from "@medusajs/types"

export function safeTrackingUrl(value?: string | null) {
  try {
    const url = new URL(value || "")
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null
  } catch { return null }
}
export default function TrackingDetails({ order }: { order: HttpTypes.StoreOrder }) {
  type TrackedFulfillment = NonNullable<HttpTypes.StoreOrder["fulfillments"]>[number] & {
    labels?: { tracking_number?: string; tracking_url?: string }[]
  }
  const fulfillments = (order.fulfillments as TrackedFulfillment[] | undefined)?.filter((f) => !f.canceled_at) || []
  return <section className="joy-tracking" aria-label="Parcel tracking">
    <h3>Follow your little joy</h3>
    {!fulfillments.length && <p>Your order is waiting to be prepared. Tracking will appear here if your delivery service includes it.</p>}
    {fulfillments.map((fulfillment, i) => <div key={fulfillment.id} className="joy-tracking-parcel">
      <strong>Parcel {i + 1} · {fulfillment.delivered_at ? "Delivered" : fulfillment.shipped_at ? "Dispatched" : "Prepared for dispatch"}</strong>
      {fulfillment.shipped_at && <p>Dispatched {new Date(fulfillment.shipped_at).toLocaleDateString("en-GB")}</p>}
      {fulfillment.labels?.length ? fulfillment.labels.map((label, index) => {
        const url = safeTrackingUrl(label.tracking_url)
        return <p key={index}>{url ? <a href={url} target="_blank" rel="noopener noreferrer">Track parcel: {label.tracking_number || "Open tracking"} ↗</a> : <span>Tracking: {label.tracking_number || "Not yet available"}</span>}</p>
      }) : <p>No tracking number has been added for this parcel. Some services are untracked.</p>}
    </div>)}
  </section>
}
