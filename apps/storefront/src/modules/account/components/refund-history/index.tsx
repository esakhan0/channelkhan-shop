import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CustomerRefund } from "types/customer-refunds"

const labels = { pending: "Awaiting review", reviewing: "Under review", closed: "Request closed", declined: "Request declined" }

export default function RefundHistory({ requests }: { requests: CustomerRefund[] }) {
  return <div className="joy-return-history">{requests.map((request) => <article className="joy-order-card" key={request.id}>
    <header className="joy-return-history-heading"><strong>{request.kind === "cancellation" ? "Cancellation request" : "Faulty-item refund request"} · Order #{request.order_display_id}</strong>
      <span className="joy-status-pill">{labels[request.status]}</span></header>
    <p>{new Date(request.created_at).toLocaleDateString("en-GB")}</p>
    <ul>{request.items.map((item) => <li key={item.id}>{item.quantity} × {item.title}</li>)}</ul>
    <p className="whitespace-pre-wrap">{request.customer_note}</p>
    {request.response && <div><strong>Our reply</strong><p className="whitespace-pre-wrap">{request.response}</p></div>}
    <LocalizedClientLink href={`/account/orders/details/${request.order_id}`}>View order and payment status ↗</LocalizedClientLink>
  </article>)}</div>
}
