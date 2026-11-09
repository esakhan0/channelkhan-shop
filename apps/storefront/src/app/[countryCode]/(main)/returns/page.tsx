import { PolicyPage } from "@modules/policies/templates"
import { Metadata } from "next"
export const metadata: Metadata = { title: "Returns" }
import LocalizedClientLink from "@modules/common/components/localized-client-link"
export default function Page() {
  return <PolicyPage title="Returns & refunds">
    <p>We do not offer an extra voluntary change-of-mind returns period. The legal cancellation rights for standard online purchases and your rights when goods are faulty, damaged or not as described still apply, as explained below.</p>
    <p>Email <a href="mailto:mukkys3dshop@gmail.com">mukkys3dshop@gmail.com</a> with your order number and the items concerned. You can contact us whether you checked out as a guest or have an account. An account refund request is optional.</p>
    <h2>Changing your mind — UK online orders</h2>
    <p>You can cancel eligible standard items before delivery or tell us within 14 days after receiving them, then send them back within a further 14 days. You do not need a reason. Inspection as in a shop is allowed; handling beyond that which reduces the item&apos;s value may reduce your refund.</p>
    <p>On a full cancellation, we refund standard outbound delivery, but not upgrades above the standard service.</p>
    <p>You pay the direct cost of returning a change-of-mind purchase, unless we agree otherwise. This does not apply to necessary return costs for faulty or incorrectly supplied goods.</p>
    <h2>Personalised items</h2>
    <p>Items made to your specifications or clearly personalised may be excluded from change-of-mind cancellation. Printing a standard product after ordering does not automatically make it personalised. Faulty-item rights still apply.</p>
    <h2>Faulty, damaged or incorrect items</h2>
    <p>Tell us what went wrong and, if possible, include a photo to help us investigate. We will arrange the remedy required by your consumer rights and cover necessary return costs. The change-of-mind time limit does not remove your rights for faulty goods.</p>
    <h2>Refunds and next steps</h2>
    <p>Cancellation refunds are made within 14 days of receiving the return or evidence it was sent back, as applicable. We use the original payment method. A request alone does not trigger a refund.</p>
    <p>Our reply will provide the return address and postage arrangements. You can notify us of cancellation now; you do not have to wait for approval to exercise your rights.</p>
    <LocalizedClientLink className="joy-button" href="/contact">Contact details ↗</LocalizedClientLink>
  </PolicyPage>
}
