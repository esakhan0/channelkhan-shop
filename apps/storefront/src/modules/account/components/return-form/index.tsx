"use client"

import { useActionState, useState } from "react"
import { requestCustomerReturn } from "@lib/data/returns"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { ReturnDetails } from "types/customer-returns"

export default function ReturnForm({ details }: { details: ReturnDetails }) {
  const [state, action, pending] = useActionState(requestCustomerReturn, { success: false, error: null })
  const [selection, setSelection] = useState<Record<string, { quantity: number; reason_id: string; note: string }>>({})
  const [shippingOption, setShippingOption] = useState("")
  const eligible = details.order.items.filter((item) => item.returnable_quantity > 0)
  const selected = Object.entries(selection).filter(([, item]) => item.quantity > 0)

  if (state.success) return <div className="joy-return-message" role="status">
    <h2>Return requested</h2>
    <p>Your request is saved. We’ll review the items before any refund is issued. Please wait for return instructions before sending your parcel.</p>
    <LocalizedClientLink href="/account/returns">View My Returns ↗</LocalizedClientLink>
  </div>
  if (!eligible.length) return <div className="joy-return-message">
    <p>There are no items available to request here yet. Items become available when delivery is recorded; items already requested or returned are excluded.</p>
    <LocalizedClientLink href="/contact">Get help with this order ↗</LocalizedClientLink>
  </div>
  if (!details.shipping_options.length) return <div className="joy-return-message">
    <p>Online return shipping isn’t available for this order yet. Please contact us to arrange your return.</p>
    <LocalizedClientLink href="/contact">Get help with your return ↗</LocalizedClientLink>
  </div>

  return <form action={action} className="joy-return-form">
    <input type="hidden" name="order_id" value={details.order.id} />
    <input type="hidden" name="items" value={JSON.stringify(selected.map(([id, item]) => ({
      id, quantity: item.quantity, note: item.note, ...(item.reason_id ? { reason_id: item.reason_id } : {}),
    })))} />
    <fieldset disabled={pending}>
      <legend>Choose the items you want to return</legend>
      {eligible.map((item) => {
        const value = selection[item.id] || { quantity: 0, reason_id: "", note: "" }
        const update = (change: Partial<typeof value>) => setSelection((previous) => ({ ...previous, [item.id]: { ...value, ...change } }))
        return <div className="joy-return-item" key={item.id}>
          <label className="joy-return-check"><input type="checkbox" checked={value.quantity > 0}
            onChange={(event) => update({ quantity: event.target.checked ? 1 : 0 })} />
            <strong>{item.title}</strong>
          </label>
          {value.quantity > 0 && <div className="joy-return-item-fields">
            <label>Quantity <input type="number" aria-label={`Quantity for ${item.title}`} min={1} max={item.returnable_quantity}
              required value={value.quantity} onChange={(event) => update({ quantity: Math.max(1, Number(event.target.value)) })} /></label>
            <label>Reason <select aria-label={`Reason for ${item.title}`} value={value.reason_id} onChange={(event) => update({ reason_id: event.target.value })}>
              <option value="">Other — explain below</option>
              {details.reasons.map((reason) => <option key={reason.id} value={reason.id}>{reason.label}</option>)}
            </select></label>
            <label className="joy-return-note">Tell us what happened <textarea aria-label={`Details for ${item.title}`} maxLength={2000}
              required={!value.reason_id} rows={3} value={value.note} onChange={(event) => update({ note: event.target.value })} /></label>
          </div>}
        </div>
      })}
      <label className="joy-return-shipping">Return shipping
        <select aria-label="Return shipping" name="shipping_option_id" required value={shippingOption} onChange={(event) => setShippingOption(event.target.value)}>
          <option value="" disabled>Choose a return method</option>
          {details.shipping_options.map((option) => <option key={option.id} value={option.id}>
            {option.name} — {convertToLocale({ amount: option.amount, currency_code: details.order.currency_code })}
          </option>)}
        </select>
      </label>
      <p className="joy-return-explainer">Submitting a request does not issue a refund. Please wait for return instructions before posting your items.</p>
      {state.error && <p role="alert" className="joy-return-error">{state.error}</p>}
      <button className="joy-return-submit" type="submit" disabled={pending || !selected.length}>
        {pending ? "Submitting…" : "Request return"}
      </button>
    </fieldset>
  </form>
}
