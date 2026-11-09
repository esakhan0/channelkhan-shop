import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework/subscribers"
import { Modules } from "@medusajs/framework/utils"
import { createHash } from "node:crypto"

type ResetEvent = { entity_id: string; actor_type: string; token: string }

export default async function passwordResetHandler({ event, container }: SubscriberArgs<ResetEvent>) {
  if (process.env.SHOP_EMAIL_ENABLED !== "true" || event.data.actor_type !== "customer") return
  // Only Medusa's native event supplies the recipient/token. Never use request
  // metadata for a recipient or redirect URL, and never log reset credentials.
  const url = new URL("/gb/reset-password", process.env.STOREFRONT_URL || "https://mukkys3d.com")
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Password reset requires an HTTPS storefront URL")
  // Fragments aren't sent to web servers or included in HTTP access logs.
  url.hash = new URLSearchParams({ token: event.data.token }).toString()
  const key = `password-reset:${createHash("sha256").update(event.data.token).digest("hex")}`
  await container.resolve(Modules.LOCKING).execute(key, async () => {
    const notification = {
      id: `noti_${createHash("sha256").update(key).digest("hex").slice(0, 32)}`,
      to: event.data.entity_id,
      channel: "email",
      template: "password-reset",
      data: { action_url: url.href },
      idempotency_key: key,
      trigger_type: "auth.password_reset",
    }
    await container.resolve(Modules.NOTIFICATION).createNotifications(notification)
  }, { timeout: 60 })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
  context: { subscriberId: "mukkys-customer-password-reset" },
}
