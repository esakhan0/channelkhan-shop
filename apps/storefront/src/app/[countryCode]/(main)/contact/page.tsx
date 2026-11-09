import { PolicyPage } from "@modules/policies/templates"
import { Metadata } from "next"
export const metadata: Metadata = { title: "Contact us" }
export default function Page() {
  return <PolicyPage title="A helping hand.">
    <p>Need help with your fidgets, delivery, payment or a refund request? Email Mukky&apos;s 3D Shop and we&apos;ll help.</p>
    <p><a className="underline break-all" href="mailto:mukkys3dshop@gmail.com">mukkys3dshop@gmail.com</a></p>
    <p>Include your order number and a short description of the problem. Never send card details or passwords.</p>
    <p>If your item arrived damaged or faulty, you can attach a clear photo of the item and packaging. Please avoid including faces, identity documents or unrelated personal information.</p>
    <p>You can email us even if you checked out as a guest. For account orders, you can also submit a refund request from your order details. Sending a request does not automatically cancel or refund an order; we will review it and reply.</p>
    <p>For questions about your personal information, use the same email address with the subject &ldquo;Privacy enquiry&rdquo;.</p>
  </PolicyPage>
}
