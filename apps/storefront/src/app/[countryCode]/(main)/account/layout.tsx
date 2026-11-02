import { retrieveCustomer } from "@lib/data/customer"
import { STORE_NAME } from "@lib/util/site"
import { Metadata } from "next"
// TODO: Re-add Toaster component when needed
import AccountLayout from "@modules/account/templates/account-layout"

export const metadata: Metadata = {
  title: { default: "Your account", template: `%s | ${STORE_NAME}` },
  description: "Sign in or manage your orders, returns and account details at Mukky's 3D Shop.",
}

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <AccountLayout customer={customer}>
      {customer ? dashboard : login}
      {/* TODO: Re-add Toaster component when needed */}
    </AccountLayout>
  )
}
