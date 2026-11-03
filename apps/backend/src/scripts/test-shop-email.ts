import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"

// Sends only to the configured sender mailbox. Never creates an order or charges a payment.
export default async function testShopEmail({ container }: ExecArgs) {
  const to = process.env.SMTP_FROM || process.env.SMTP_USER
  if (process.env.SHOP_EMAIL_ENABLED !== "true" || !to) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Enable SHOP_EMAIL_ENABLED and configure SMTP first")
  }
  await container.resolve(Modules.NOTIFICATION).createNotifications({
    to, channel: "email", template: "smtp-test",
    data: { action_url: process.env.STOREFRONT_URL || "https://mukkys3d.com" },
  })
  container.resolve(ContainerRegistrationKeys.LOGGER).info("SMTP accepted the test message. Check the shop mailbox and spam folder to confirm receipt.")
}
