import { PolicyPage } from "@modules/policies/templates"
import { Metadata } from "next"
export const metadata: Metadata = { title: "Contact us" }
export default async function Page({ searchParams }: {
  searchParams: Promise<{ topic?: string | string[]; order?: string | string[] }>
}) {
  const params = await searchParams
  // The reference only prefills a support email; it never grants access to an order.
  const orderNumber = typeof params.order === "string" && /^\d{1,20}$/.test(params.order) ? params.order : ""
  const missing = params.topic === "missing-delivery"
  const faulty = params.topic === "faulty-item" || params.topic === "return"
  const topic = missing ? "Item hasn't arrived" : faulty ? "Received a faulty item" : "Order enquiry"
  const subject = `${topic}${orderNumber ? ` - Order #${orderNumber}` : ""}`
  const body = `Hello Mukky's 3D Shop,\n\nOrder number: ${orderNumber}\n\n${missing
    ? "My item hasn't arrived.\nItem(s) missing: \nExpected delivery date (if known): \nTracking status (if available): "
    : faulty ? "I've received a faulty or incorrect item.\nItem(s) affected: \nDescription of the problem: "
    : "How can we help? "}\n\nThank you.`
  const mailto = `mailto:mukkys3dshop@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  return <PolicyPage title={missing ? "Item hasn’t arrived?" : faulty ? "Received a faulty item?" : "A helping hand."}>
    {(missing || faulty) && <>
      {orderNumber && <p>Help with order #{orderNumber}</p>}
      <p>{missing
        ? "Check your order’s delivery updates and any tracking link first. If your delivery is overdue, or tracking says delivered but you haven’t received it, email us and we’ll investigate."
        : "Tell us which item is faulty, damaged or incorrect and what happened. Please wait for our instructions before sending anything back."}</p>
      <p><a className="underline font-semibold" href={mailto}>{missing ? "Email us about a missing delivery" : "Email us about a faulty item"} ↗</a></p>
      <p>This opens your email app with the order reference filled in. Add the details and send the email to submit your enquiry. It doesn’t automatically cancel or refund your order.</p>
    </>}
    <p>Need help with your fidgets, delivery, payment or a refund request? Email Mukky&apos;s 3D Shop and we&apos;ll help.</p>
    <p><a className="underline break-all" href={mailto}>mukkys3dshop@gmail.com</a></p>
    <p>Include your order number and a short description of the problem. Never send card details or passwords.</p>
    <p>If your item arrived damaged or faulty, you can attach a clear photo of the item and packaging. Please avoid including faces, identity documents or unrelated personal information.</p>
    <p>You can email us even if you checked out as a guest. For account orders, you can also submit a refund request from your order details. Sending a request does not automatically cancel or refund an order; we will review it and reply.</p>
    <p>For questions about your personal information, use the same email address with the subject &ldquo;Privacy enquiry&rdquo;.</p>
  </PolicyPage>
}
