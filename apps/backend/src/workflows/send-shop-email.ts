import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { createHash } from "node:crypto"
import { prepareShopEmail, ShopEmailEvent } from "../lib/shop-email"

const sendShopEmailStep = createStep("send-shop-email", async (input: ShopEmailEvent, { container }) => {
  if (process.env.SHOP_EMAIL_ENABLED !== "true") return new StepResponse(null)
  const email = await prepareShopEmail(container, input)
  if (!email) return new StepResponse(null)
  // The notification module records failures and skips already successful idempotency keys.
  // A lock also prevents simultaneous event deliveries from sending the same message twice.
  const result = await container.resolve(Modules.LOCKING).execute(`email:${email.key}`, async () => {
    // Medusa 2.22.2 otherwise generates a new record ID when retrying a failed
    // idempotency key. Keep the ID stable so its status update finds the original.
    const payload = {
      id: `noti_${createHash("sha256").update(email.key).digest("hex").slice(0, 32)}`,
      to: email.to, channel: "email", template: email.template, data: email.data,
      idempotency_key: email.key, trigger_type: input.name, resource_id: email.order_id, resource_type: "order",
    }
    const notification = await container.resolve(Modules.NOTIFICATION).createNotifications(payload)
    return notification?.id ?? null
  }, { timeout: 60 })
  return new StepResponse(result)
})

export const sendShopEmailWorkflow = createWorkflow("send-shop-email", (input: ShopEmailEvent) =>
  new WorkflowResponse(sendShopEmailStep(input)))
