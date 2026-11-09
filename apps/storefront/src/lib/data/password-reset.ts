"use server"

import Medusa from "@medusajs/js-sdk"
import { removeAuthToken } from "./cookies"

// Passwords and reset tokens must never enter SDK debug logs, even locally.
const auth = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
  debug: false,
  auth: { type: "jwt", jwtTokenStorageMethod: "nostore" },
}).auth

export type PasswordResetState = { success: boolean; message: string } | null

export async function requestPasswordReset(_state: PasswordResetState, form: FormData): Promise<PasswordResetState> {
  const email = String(form.get("email") || "").trim()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Enter a valid email address." }
  }
  try {
    await auth.resetPassword("customer", "emailpass", { identifier: email })
    return { success: true, message: "If an account uses that email, you'll receive a reset link. Check your inbox and spam folder. Use the newest link within 15 minutes." }
  } catch {
    return { success: false, message: "We couldn't request a reset right now. Please try again later or contact us." }
  }
}

export async function completePasswordReset(_state: PasswordResetState, form: FormData): Promise<PasswordResetState> {
  const token = String(form.get("token") || "")
  const password = String(form.get("password") || "")
  if (!token || token.length > 4096) return { success: false, message: "This link is invalid. Request a new reset link." }
  if (password.length < 15 || password.length > 128) return { success: false, message: "Use a password between 15 and 128 characters." }
  if (password !== form.get("confirm_password")) return { success: false, message: "The passwords don't match." }
  try {
    // Medusa binds the change to the verified token's identity, not an email/ID
    // provided by the browser, and atomically consumes the single-use token.
    await auth.updateProvider("customer", "emailpass", { password }, token)
  } catch {
    return { success: false, message: "We couldn't reset your password. The link may have expired or already been used. Request a new link and try again." }
  }
  await removeAuthToken()
  return { success: true, message: "Your password has been changed. Sign in with your new password." }
}
