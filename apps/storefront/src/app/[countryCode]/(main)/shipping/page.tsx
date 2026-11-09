import { PolicyPage } from "@modules/policies/templates"
import { Metadata } from "next"
export const metadata: Metadata = { title: "Shipping" }
import LocalizedClientLink from "@modules/common/components/localized-client-link"
export default function Page() {
  return <PolicyPage title="Shipping & delivery">
    <h2>Royal Mail delivery</h2>
    <p>We normally send orders with Royal Mail. If we offer a cheaper alternative carrier, its name, service and price will be shown before you pay. We will not switch a service you selected to a different carrier without agreeing it with you.</p>
    <p>Available delivery services and the final shipping charge are shown at checkout before you pay.</p>
    <p>Where weight-based delivery applies, we add the weights of the items in your bag, including quantities, and the packaging allowance to calculate the delivery charge.</p>
    <h2>Making and dispatch</h2>
    <p>Production time is separate from a carrier&apos;s delivery estimate. Check your product details for any making time. If you need something for a particular date, <LocalizedClientLink href="/contact?topic=shipping">ask us before ordering</LocalizedClientLink> so we can confirm what is possible.</p>
    <p>Unless we agree another delivery period with you, we will deliver within 30 days of your order. We will contact you if we become aware of a delay.</p>
    <h2>Follow your order</h2>
    <p>Your order page shows its current fulfillment status. When a tracking number is available and has been added to your order, it appears there too. Some postal services do not include tracking.</p>
    <h2>Address changes or delivery problems</h2>
    <p><LocalizedClientLink href="/contact?topic=shipping">Send a delivery request</LocalizedClientLink> with your order number. Contact us promptly about an incorrect address; we may be unable to change it after dispatch.</p>
    <p>If an order arrives damaged or does not arrive, let us know so we can investigate and help. Your consumer rights are unaffected.</p>
  </PolicyPage>
}
