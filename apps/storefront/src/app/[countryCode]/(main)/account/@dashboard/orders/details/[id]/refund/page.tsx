import { getRefundDetails } from "@lib/data/refunds"
import RefundForm from "@modules/account/components/refund-form"
import RefundHistory from "@modules/account/components/refund-history"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { notFound } from "next/navigation"

export const metadata = { title: "Request a refund" }

export default async function RequestRefundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const details = await getRefundDetails(id).catch((error) => {
    if (error.status === 404 || error.status === 401) notFound()
    throw error
  })
  return <div className="joy-returns-page">
    <LocalizedClientLink href={`/account/orders/details/${id}`}>← Back to order</LocalizedClientLink>
    <h1>Request a refund</h1>
    <p>Order #{details.order.display_id} · Choose specific items and quantities.</p>
    <RefundForm details={details} />
    {!!details.requests.length && <section><h2>Requests for this order</h2><RefundHistory requests={details.requests} /></section>}
  </div>
}
