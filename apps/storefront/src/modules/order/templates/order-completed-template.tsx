import { Heading } from "@modules/common/components/ui"
import { cookies as nextCookies } from "next/headers"

import OrderSummary from "@modules/order/components/order-summary"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container joy-order-page max-w-5xl w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="joy-order-panel joy-order-compact"
          data-testid="order-complete-container"
        >
          <Heading
            level="h1"
            className="joy-order-thanks"
          >
            Thank you for your order!
          </Heading>
          <div className="joy-order-header"><OrderDetails order={order} /></div>
          <div className="joy-order-columns">
            <div className="joy-order-main">
              <section aria-label="Ordered items"><h2>In your order</h2><Items order={order} /></section>
              <ShippingDetails order={order} />
            </div>
            <aside className="joy-order-aside" aria-label="Order summary">
              <OrderSummary order={order} />
              <PaymentDetails order={order} />
              <Help orderNumber={order.display_id} />
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
