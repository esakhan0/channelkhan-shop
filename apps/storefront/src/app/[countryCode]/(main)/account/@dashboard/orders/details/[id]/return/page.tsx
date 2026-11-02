import { getReturnDetails } from "@lib/data/returns"
import ReturnForm from "@modules/account/components/return-form"
import ReturnHistory from "@modules/account/components/return-history"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { notFound } from "next/navigation"

export const metadata = { title: "Request a return" }

export default async function RequestReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const details = await getReturnDetails(id).catch((error) => {
    if (error.status === 404 || error.status === 401) notFound()
    throw error
  })
  return <div className="joy-returns-page">
    <LocalizedClientLink href={`/account/orders/details/${id}`}>← Back to order</LocalizedClientLink>
    <h1>Request a return</h1>
    <p>Order #{details.order.display_id} · Choose specific items and quantities.</p>
    <ReturnForm details={details} />
    {!!details.returns.length && <section><h2>Previous requests for this order</h2><ReturnHistory returns={details.returns} /></section>}
  </div>
}
