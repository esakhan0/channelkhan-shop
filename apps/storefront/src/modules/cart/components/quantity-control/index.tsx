"use client"

import { useRef, useState } from "react"

type Props = {
  quantity: number
  limit: number | null | undefined
  title: string
  onUpdate: (quantity: number) => Promise<{ success: true } | { success: false; error: string }>
  onRefresh: () => void
}

export default function QuantityControl({ quantity, limit, title, onUpdate, onRefresh }: Props) {
  const [value, setValue] = useState(String(quantity))
  const [savedQuantity, setSavedQuantity] = useState(quantity)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const busy = useRef(false)
  const max = limit === undefined ? savedQuantity : limit
  const exceedsStock = typeof limit === "number" && savedQuantity > limit

  const commit = async (next: number) => {
    if (busy.current) return
    setError(null)
    if (!Number.isSafeInteger(next) || next < 1 || (max !== null && next > max)) {
      setValue(String(savedQuantity))
      setError(limit === undefined ? "Stock couldn’t be checked. Refresh before increasing the quantity."
        : max === 0 ? "This item is now out of stock. Please remove it from your bag."
        : `Choose a quantity between 1 and ${max ?? "the available stock"}.`)
      return
    }
    if (next === savedQuantity) { setValue(String(savedQuantity)); return }
    busy.current = true
    setPending(true)
    try {
      const result = await onUpdate(next)
      if (!result.success) { setValue(String(savedQuantity)); setError(result.error) }
      else { setValue(String(next)); setSavedQuantity(next) }
      onRefresh()
    } catch {
      setValue(String(savedQuantity))
      setError("We couldn’t reach the shop. Please try again.")
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return <div className="max-w-full">
    <div className="inline-flex items-center rounded-lg border border-current" aria-busy={pending}>
      <button type="button" className="h-11 w-9 disabled:opacity-40" aria-label={`Decrease quantity for ${title}`}
        disabled={pending || savedQuantity <= 1 || max === 0} onClick={() => commit(Math.min(savedQuantity - 1, max ?? savedQuantity - 1))}>−</button>
      <input type="number" inputMode="numeric" min={1} max={max ?? undefined} step={1}
        className="h-11 w-14 min-w-0 bg-transparent text-center" aria-label={`Quantity for ${title}`}
        data-testid="product-quantity-input" value={value} disabled={pending || max === 0}
        onChange={(event) => setValue(event.target.value)} onBlur={() => commit(Number(value))}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur() } }} />
      <button type="button" className="h-11 w-9 disabled:opacity-40" aria-label={`Increase quantity for ${title}`}
        disabled={pending || (max !== null && savedQuantity >= max)} onClick={() => commit(savedQuantity + 1)}>+</button>
    </div>
    <div aria-live="polite" className="mt-2 text-small-regular">
      {pending && <p>Updating…</p>}
      {error ? <p role="alert" className="text-rose-600" data-testid="product-error-message">{error}</p>
        : exceedsStock ? <p role="alert" className="text-rose-600">{limit === 0 ? "Out of stock. Please remove this item." : `Only ${limit} available for this line. Please reduce your quantity.`}</p>
        : limit === undefined ? <p>Stock couldn’t be checked. You can reduce or remove this item.</p> : null}
    </div>
  </div>
}
