import { listCustomerRefunds } from "@lib/data/refunds"
import RefundHistory from "@modules/account/components/refund-history"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata = { title: "My Refunds", description: "Track your refund and cancellation requests." }

export default async function RefundsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = Math.max(1, Math.min(5000, Math.floor(Number(params.page)) || 1))
  const result = await listCustomerRefunds((page - 1) * 20)
  return <div className="joy-returns-page">
    <h1>My Refunds</h1>
    <p>Read updates and replies here. To request a refund or cancellation, choose an order. A closed request does not itself mean a payment has been refunded; check the order’s payment status.</p>
    <LocalizedClientLink href="/account/orders" className="joy-returns-orders">Choose an order ↗</LocalizedClientLink>
    {result.requests.length ? <RefundHistory requests={result.requests} /> : <div className="joy-return-message">No refund requests yet.</div>}
    <nav aria-label="Refund request pages" className="joy-return-pagination">
      {page > 1 && <LocalizedClientLink href={`/account/refunds?page=${page - 1}`}>Previous</LocalizedClientLink>}
      {result.offset + result.limit < result.count && <LocalizedClientLink href={`/account/refunds?page=${page + 1}`}>Next</LocalizedClientLink>}
    </nav>
    <LocalizedClientLink href="/account/returns">View previous physical returns ↗</LocalizedClientLink>
  </div>
}
