"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { changePromotion } from "@lib/data/cart-promotions"
import { convertToLocale } from "@lib/util/money"
import { Badge, Button, Input } from "@modules/common/components/ui"

export default function DiscountCode({ cart }: { cart: HttpTypes.StoreCart }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, start] = useTransition()
  const router = useRouter()

  function update(action: "add" | "remove", value: string) {
    setNotice(null)
    start(async () => {
      try {
        const result = await changePromotion(action, value)
        setNotice(result)
        if (result.ok && action === "add") setCode("")
        router.refresh()
      } catch {
        setNotice({ ok: false, message: "We couldn’t reach the shop. Refresh your cart and try again." })
      }
    })
  }

  return <section className="w-full py-2" aria-label="Promotion codes">
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
      className="txt-medium text-ui-fg-interactive" data-testid="add-discount-button">Add a promotion code</button>
    {open && <form className="my-2 flex gap-2" onSubmit={event => { event.preventDefault(); update("add", code) }}>
      <Input aria-label="Promotion code" autoComplete="off" spellCheck={false} value={code}
        onChange={event => { setCode(event.target.value); setNotice(null) }}
        disabled={pending} placeholder="Promotion code" data-testid="discount-input" />
      <Button type="submit" variant="secondary" disabled={pending || !code.trim()} data-testid="discount-apply-button">Apply</Button>
    </form>}
    {notice && <p role={notice.ok ? "status" : "alert"} data-testid={notice.ok ? "discount-success" : "discount-error-message"}>{notice.message}</p>}
    {(cart.promotions || []).map(promotion => {
      const method = promotion.application_method
      const value = method?.value == null ? "" : method.type === "percentage" ? `${method.value}%`
        : convertToLocale({ amount: Number(method.value), currency_code: method.currency_code || cart.currency_code })
      return <div key={promotion.id} className="mt-2 flex items-center justify-between gap-2" data-testid="discount-row">
        <span data-testid="discount-code"><Badge color={promotion.is_automatic ? "green" : "grey"}>{promotion.code}</Badge> {value}</span>
        {!promotion.is_automatic && promotion.code && <button type="button" disabled={pending}
          aria-label={`Remove ${promotion.code}`} onClick={() => update("remove", promotion.code!)} data-testid="remove-discount-button">Remove</button>}
      </div>
    })}
  </section>
}
