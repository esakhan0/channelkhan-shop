"use client"

import { useActionState, useState } from "react"
import { requestCustomerRefund } from "@lib/data/refunds"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { RefundDetails } from "types/customer-refunds"

export default function RefundForm({ details }: { details: RefundDetails }) {
  const [state, action, pending] = useActionState(requestCustomerRefund, { success: false, error: null })
  const [selection, setSelection] = useState<Record<string, number>>({})
  const [kind, setKind] = useState<"refund" | "cancellation">("refund")
  const [note, setNote] = useState("")
  const available = (item: RefundDetails["order"]["items"][number]) => kind === "refund" ? item.faulty_quantity : item.requestable_quantity
  const eligible = details.order.items.filter((item) => available(item) > 0)
  const selected = Object.entries(selection).filter(([, quantity]) => quantity > 0)

  if (state.success) return <div className="joy-return-message" role="status">
    <h2>Request received</h2>
    <p>We’ll review your request and post a reply in My Refunds. Your order hasn’t been canceled or refunded yet. If items need to come back, please wait for our instructions.</p>
    <LocalizedClientLink href="/account/refunds">View My Refunds ↗</LocalizedClientLink>
  </div>
  if (details.has_open_request) return <div className="joy-return-message">
    <p>You already have an open request for this order. You can follow its progress and read our reply below.</p>
  </div>
  if (!details.order.items.some((item) => item.requestable_quantity > 0)) return <div className="joy-return-message">
    <p>{details.order.status === "canceled" ? "This order has already been canceled." : "These items are already in a return or have been returned."} Contact us if you need help with the refund.</p>
    <LocalizedClientLink href="/contact">Get help with this order ↗</LocalizedClientLink>
  </div>

  return <form action={action} className="joy-return-form">
    <input type="hidden" name="order_id" value={details.order.id} />
    <input type="hidden" name="items" value={JSON.stringify(selected.map(([id, quantity]) => ({ id, quantity })))} />
    <fieldset disabled={pending}>
      <legend>Choose the items for your request</legend>
      <label className="joy-return-shipping">What would you like us to do?
        <select name="kind" value={kind} required onChange={(event) => {
          setKind(event.target.value as "refund" | "cancellation")
          setSelection({})
        }}>
          <option value="refund">Request a refund for a faulty or incorrect item</option>
          <option value="cancellation">Request cancellation / exercise my cancellation rights</option>
        </select>
      </label>
      {kind === "refund" && details.order.items.some((item) => item.awaiting_delivery > 0) && <div className="joy-return-message">
        <p>Some items are awaiting delivery. Please wait until delivery is recorded before reporting a fault with those items. You can still send a cancellation request for review.</p>
      </div>}
      {kind === "cancellation" && details.order.items.some((item) => item.fulfillment_started) && <div className="joy-return-message">
        <p>Fulfilment has started, so we may not be able to stop dispatch. You can notify us of cancellation now; if the parcel is on its way, wait for delivery and our return instructions.</p>
      </div>}
      {eligible.map((item) => {
        const quantity = selection[item.id] || 0
        const update = (value: number) => setSelection((previous) => ({ ...previous, [item.id]: value }))
        return <div className="joy-return-item" key={item.id}>
          <label className="joy-return-check"><input type="checkbox" checked={quantity > 0}
            onChange={(event) => update(event.target.checked ? 1 : 0)} /><strong>{item.title}</strong></label>
          {quantity > 0 && <div className="joy-return-item-fields"><label>Quantity
            <input type="number" aria-label={`Quantity for ${item.title}`} min={1} max={available(item)} step={1}
              required value={quantity} onChange={(event) => update(Math.max(1, Number(event.target.value)))} />
          </label></div>}
        </div>
      })}
      <label className="joy-return-note">{kind === "refund" ? "Describe the fault or what is incorrect" : "Additional details (optional)"}
        <textarea name="customer_note" minLength={kind === "refund" ? 3 : undefined} maxLength={2000} rows={4} required={kind === "refund"}
          value={note} onChange={(event) => setNote(event.target.value)}
          placeholder={kind === "refund" ? "Tell us what is broken, damaged or not as described." : "You don’t need to give a reason to notify us of cancellation."} />
      </label>
      <p className="joy-return-explainer">We review requests before taking action. This doesn’t automatically cancel the order, stop dispatch or issue a refund. Please wait for instructions before returning anything. Your statutory rights are unaffected.</p>
      {state.error && <p role="alert" className="joy-return-error">{state.error}</p>}
      <button className="joy-return-submit" type="submit" disabled={pending || !selected.length}>
        {pending ? "Submitting…" : "Send request"}
      </button>
    </fieldset>
  </form>
}
