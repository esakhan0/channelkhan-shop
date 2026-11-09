import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import { PolicyPage } from "@modules/policies/templates"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Terms of service",
  description: `Terms that apply to purchases from ${STORE_NAME}.`,
}

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of service">
      <h2>Shopping with us</h2>
      <p>
        By placing an order with {STORE_NAME} you agree to these terms. Prices,
        product availability and shipping options are shown on the product
        pages and at checkout. Changes to future listings do not alter an order
        you have already placed. Contact us at <a href="mailto:mukkys3dshop@gmail.com">mukkys3dshop@gmail.com</a> for help.
      </p>
      <h2>Orders and payment</h2>
      <p>
        Your order confirmation is shown after checkout. Stripe payment receipts
        are separate from order and delivery updates. You can check your order
        status on the order page.
      </p>
      <p>Payments are processed by Stripe. Available cards and wallets are displayed at checkout and depend on your device and payment eligibility.</p>
      <p>
        Please check your delivery address and product choices before paying.
        Published prices and delivery charges apply to the order you place;
        later price changes do not change an existing order.
      </p>
      <h2>Our 3D-printed products</h2>
      <p>Small layer lines are part of the 3D-printing process. Gradient filament colours and their placement vary between prints; product photos illustrate the palette. These normal variations do not limit your rights if an item is faulty, unsafe or does not match its description. Follow the care and safety information supplied with each product.</p>
      <h2>Delivery, cancellation and returns</h2>
      <p>
        See our <LocalizedClientLink href="/shipping">delivery information</LocalizedClientLink>
        {" "}and <LocalizedClientLink href="/returns">returns policy</LocalizedClientLink>.
        Nothing in these terms restricts your statutory consumer rights.
      </p>
    </PolicyPage>
  )
}
