"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { completePasswordReset, requestPasswordReset } from "@lib/data/password-reset"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { SubmitButton } from "@modules/checkout/components/submit-button"

export default function PasswordReset({ reset = false }: { reset?: boolean }) {
  const [token, setToken] = useState<string | null>(null)
  const captured = useRef(false)
  const [state, action] = useActionState(reset ? completePasswordReset : requestPasswordReset, null)
  useEffect(() => {
    if (!reset || captured.current) return
    captured.current = true
    setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") || "")
    // Keep it only in this form's memory, not in browser history/local storage.
    window.history.replaceState(window.history.state, "", window.location.pathname)
  }, [reset])

  return (
    <section className="w-full max-w-md rounded-2xl border border-[#292421] bg-white p-6 small:p-8 shadow-[4px_4px_0_#292421]">
      <h1 className="text-3xl mb-4">{reset ? "Choose a new password" : "Forgot your password?"}</h1>
      <p className="text-base mb-6">{reset ? "Use a long, unique password or passphrase you don't use elsewhere." : "Enter your account email and we'll send you a link to reset it."}</p>
      {state && <p role={state.success ? "status" : "alert"} className="mb-6 text-sm leading-6">{state.message}</p>}
      {!state?.success && (!reset || !!token) && (
        <form action={action} className="flex flex-col gap-4">
          {reset ? <>
            <input type="hidden" name="token" value={token || ""} />
            <Input id="password" label="New password" name="password" type="password" autoComplete="new-password" minLength={15} maxLength={128} required />
            <Input id="confirm_password" label="Confirm new password" name="confirm_password" type="password" autoComplete="new-password" minLength={15} maxLength={128} required />
            <p className="text-sm">15–128 characters. Spaces and password managers are welcome.</p>
          </> : <Input id="email" label="Email" name="email" type="email" autoComplete="email" maxLength={254} required />}
          <SubmitButton className="w-full">{reset ? "Save new password" : "Send reset link"}</SubmitButton>
        </form>
      )}
      {reset && token === "" && <p role="alert" className="mb-4">This reset link is missing its token. Please request a new one.</p>}
      {reset && !state?.success && <LocalizedClientLink href="/forgot-password" className="block underline mt-6">Request a new link</LocalizedClientLink>}
      <LocalizedClientLink href="/account" className="block underline mt-6">Back to sign in</LocalizedClientLink>
    </section>
  )
}
