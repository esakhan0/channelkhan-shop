import { Heading } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

const Help = ({ orderNumber, orderId }: { orderNumber?: number; orderId?: string }) => {
  const contactQuery = new URLSearchParams({ order: String(orderNumber ?? "") })
  return (
    <div id="order-help" className="joy-order-help mt-6 scroll-mt-24">
      <Heading className="text-base-semi">Help with this order</Heading>
      <div className="text-base-regular my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            <LocalizedClientLink href={orderId
              ? `/account/orders/details/${orderId}/refund`
              : `/contact?${contactQuery}&topic=faulty-item`}>
              Received a faulty item
            </LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href={`/contact?${contactQuery}&topic=missing-delivery`}>
              Item hasn’t arrived
            </LocalizedClientLink>
          </li>
          <li><LocalizedClientLink href={`/contact?${contactQuery}`}>Something else? Contact us</LocalizedClientLink></li>
        </ul>
      </div>
    </div>
  )
}

export default Help
