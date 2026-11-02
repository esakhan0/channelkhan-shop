import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CustomerReturn } from "types/customer-returns"

const statuses: Record<string, string> = {
  requested: "Requested", received: "Received", canceled: "Canceled",
  partially_received: "Partly received", pending: "Being prepared",
}

export default function ReturnHistory({ returns }: { returns: CustomerReturn[] }) {
  return <div className="joy-return-history">
    {returns.map((request) => <article className="joy-order-card" key={request.id}>
      <div className="joy-return-history-heading">
        <strong>Return #{request.display_id}</strong>
        <span className="joy-status-pill">{statuses[request.status] || "In progress"}</span>
      </div>
      <p>Order #{request.order.display_id} · {new Date(request.created_at).toLocaleDateString("en-GB")}</p>
      <ul>{request.items.map((item) => <li key={item.item_id}>
        {item.item?.title || "Order item"} × {item.quantity}
        {item.reason?.label && <span> — {item.reason.label}</span>}
      </li>)}</ul>
      <LocalizedClientLink href={`/account/orders/details/${request.order_id}`}>View order ↗</LocalizedClientLink>
    </article>)}
  </div>
}
