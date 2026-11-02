import { listCustomerReturns } from "@lib/data/returns"
import ReturnHistory from "@modules/account/components/return-history"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata = { title: "My Returns", description: "View your return requests." }

export default async function ReturnsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = Math.max(1, Math.min(5000, Math.floor(Number(params.page)) || 1))
  const result = await listCustomerReturns((page - 1) * 20)
  return <div className="joy-returns-page">
    <h1>My Returns</h1>
    <p>Track your return requests here. To start one, open an order and choose “Request a return”.</p>
    <LocalizedClientLink href="/account/orders" className="joy-returns-orders">Choose an order ↗</LocalizedClientLink>
    {result.returns.length ? <ReturnHistory returns={result.returns} /> : <div className="joy-return-message">No return requests yet.</div>}
    <nav aria-label="Returns pages" className="joy-return-pagination">
      {page > 1 && <LocalizedClientLink href={`/account/returns?page=${page - 1}`}>Previous</LocalizedClientLink>}
      {result.offset + result.limit < result.count && <LocalizedClientLink href={`/account/returns?page=${page + 1}`}>Next</LocalizedClientLink>}
    </nav>
  </div>
}
