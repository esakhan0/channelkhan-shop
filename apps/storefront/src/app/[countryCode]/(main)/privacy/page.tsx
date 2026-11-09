import { Metadata } from "next"
import { STORE_NAME } from "@lib/util/site"
import { PolicyPage } from "@modules/policies/templates"

export const metadata: Metadata = { title: "Privacy policy", description: "How Mukky's 3D Shop handles orders, payments and personal information." }

const sections = [
  ["Information we collect", "When you shop or create an account, we collect details such as your name, email, delivery and billing addresses, telephone number if provided, and basket and order information. We also keep payment references and statuses, tracking and refund or return records. Support messages and any photos you choose to send help us investigate your enquiry. Technical logs may include your IP address, browser details, requests and errors."],
  ["Why we use your information", "We use account and order details to fulfil our contract with you: processing purchases, taking payment, delivering items, providing order updates and dealing with returns. We process records needed to meet legal obligations, including accounting and consumer rights. Our legitimate interests include answering enquiries, preventing fraud, protecting accounts and diagnosing faults; we consider your rights when doing this. If we offer optional marketing, we will ask for consent where required and provide a way to withdraw it. Required checkout information is needed to process and deliver your order."],
  ["Who receives your information", "We share the information needed to operate the shop with hosting and technical service providers, Stripe for payments, Brevo for shop emails, Google/Gmail for customer correspondence, and the delivery provider selected for your order, such as Royal Mail. We may share relevant records with professional advisers or authorities when legally required, and with payment providers when responding to disputes. We do not sell your personal information."],
  ["International processing", "Some providers process information outside the UK. Where required, transfers must use appropriate safeguards, such as UK adequacy regulations or approved contractual protections. Contact us for details of the safeguards relevant to your information."],
  ["Cookies", "The shop uses cookies to remember your basket, keep you signed in, retain your language preference and allow secure access to checkout and order confirmations. Payment and security services may also use technology needed to process payments and prevent abuse. Blocking essential cookies may prevent checkout or sign-in from working."],
  ["How long we keep information", "We retain information only for as long as needed for its purpose. Order and payment records may need to be retained for applicable tax, accounting, consumer-rights and dispute periods. Account details are used while your account remains active; support correspondence is kept while needed to resolve and record an enquiry. Security logs are retained according to operational and investigation needs. Deleting an account does not necessarily delete records we must keep for legal reasons. Contact us for the retention period applicable to a particular record."],
  ["Your rights", "Depending on the circumstances, you can ask for access to your information, correction, deletion, restricted processing or a portable copy. You can object to processing based on legitimate interests and withdraw consent where we rely on it. Email us to make a request. We may need proportionate information to verify your identity before disclosing or changing records; please do not send identity documents unless we explain why they are necessary."],
  ["Young shoppers", "If you are a child, ask a parent or guardian to help with purchases and questions about your information. Please do not send us information about other children or include them in support photos. A parent or guardian can contact us about a child's information."],
]

export default function PrivacyPage() {
  return <PolicyPage title="Privacy policy">
    <p>Last updated: 9 November 2026.</p>
    <p>{STORE_NAME} is responsible for the personal information used to run this shop. For support or privacy enquiries, email <a className="underline break-all" href="mailto:mukkys3dshop@gmail.com">mukkys3dshop@gmail.com</a>.</p>
    <section>
      <h2 className="text-xl font-semibold mb-3">Payments through Stripe</h2>
      <p>Stripe processes card and supported wallet payments. Your card number and security code are entered through Stripe&apos;s payment fields; our shop does not store full card numbers or security codes. We receive payment references, payment status and limited payment-method details needed for orders, refunds and disputes. Stripe may process transaction, device and identity information to provide payments, prevent fraud and meet its own legal obligations.</p>
      <p className="mt-3">See <a className="underline" href="https://stripe.com/gb/privacy">Stripe&apos;s privacy policy</a> for its practices and your rights. Wallets such as Apple Pay and Google Pay are available when supported by your device, browser and checkout configuration.</p>
    </section>
    {sections.map(([title, text]) => <section key={title}><h2 className="text-xl font-semibold mb-3">{title}</h2><p>{text}</p></section>)}
    <p>You can also complain to the UK Information Commissioner&apos;s Office at <a className="underline" href="https://ico.org.uk/make-a-complaint/">ico.org.uk/make-a-complaint</a>.</p>
    <p>We will update this page when our practices change and revise the date above. Where required, we will notify you of significant changes.</p>
  </PolicyPage>
}
