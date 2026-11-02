import { redirect } from "next/navigation"

export default async function LegacyReturnPage({ params }: {
  params: Promise<{ countryCode: string; id: string }>
}) {
  const { countryCode, id } = await params
  redirect(`/${encodeURIComponent(countryCode)}/account/orders/details/${encodeURIComponent(id)}/refund`)
}
