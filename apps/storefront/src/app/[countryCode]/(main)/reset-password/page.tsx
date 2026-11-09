import type { Metadata } from "next"
import PasswordReset from "@modules/account/components/password-reset"

export const metadata: Metadata = { title: "Reset password", referrer: "no-referrer", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default function ResetPasswordPage() {
  return <div className="flex justify-center px-4 py-12"><PasswordReset reset /></div>
}
