"use client"

import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import ShippingDetails from "@modules/order/components/shipping-details"
import React from "react"
import RefreshOrder from "../components/refresh-order"
import PaymentDetails from "../components/payment-details"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  return (
    <div className="joy-order-page flex flex-col gap-y-4">
      <div className="flex gap-2 justify-between items-center">
        <h1 className="text-2xl-semi">Order details</h1>
        <LocalizedClientLink
          href="/account/orders"
          className="flex gap-2 items-center text-ui-fg-subtle hover:text-ui-fg-base"
          data-testid="back-to-overview-button"
        >
          <XMark /> All orders
        </LocalizedClientLink>
      </div>
      <div
        className="joy-order-panel joy-order-compact"
        data-testid="order-details-container"
      >
        <div className="joy-order-header"><OrderDetails order={order} showStatus /></div>
        <RefreshOrder orders={[order]} />
        <div className="joy-order-columns">
          <div className="joy-order-main">
            <section aria-label="Ordered items"><h2>In your order</h2><Items order={order} /></section>
            <ShippingDetails order={order} />
          </div>
          <aside className="joy-order-aside" aria-label="Order summary">
            <OrderSummary order={order} />
            <PaymentDetails order={order} />
            {order.status !== "canceled" && order.payment_status !== "refunded" && <LocalizedClientLink className="joy-return-order-link" href={`/account/orders/details/${order.id}/refund`}>Request a refund ↗</LocalizedClientLink>}
            <Help orderNumber={order.display_id} orderId={order.status !== "canceled" && order.payment_status !== "refunded" ? order.id : undefined} />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
