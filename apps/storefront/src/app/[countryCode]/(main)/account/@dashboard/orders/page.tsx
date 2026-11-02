import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import TransferRequestForm from "@modules/account/components/transfer-request-form"

export const metadata: Metadata = {
  title: "Orders",
  description: "Overview of your previous orders.",
}

export default async function Orders() {
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return (
    <div className="joy-orders-page w-full" data-testid="orders-page-wrapper">
      <div className="mb-4 flex flex-col gap-y-1">
        <h1 className="text-2xl-semi">Orders</h1>
        <p className="text-base-regular">
          Your orders, delivery progress and tracking in one place.
        </p>
      </div>
      <div>
        <OrderOverview orders={orders} />
        <details className="joy-order-transfer">
          <summary>Missing an order?</summary>
          <TransferRequestForm />
        </details>
      </div>
    </div>
  )
}
