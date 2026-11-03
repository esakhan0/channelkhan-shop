import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework/subscribers"
import { Modules } from "@medusajs/framework/utils"
import { REFUND_REQUEST_MODULE } from "../modules/refund-request"
import RefundRequestModuleService from "../modules/refund-request/service"

export default async function refundRequestFeed({ event, container }: SubscriberArgs<{ id: string }>) {
  const request = await container.resolve<RefundRequestModuleService>(REFUND_REQUEST_MODULE)
    .retrieveRefundRequest(event.data.id)
  const key = `refund-request-feed:${request.id}`
  await container.resolve(Modules.LOCKING).execute(key, async () => {
    await container.resolve(Modules.NOTIFICATION).createNotifications({
      to: "admin", channel: "feed", template: "refund-request-received",
      resource_type: "refund_request", resource_id: request.id,
      trigger_type: event.name, idempotency_key: key,
      data: {
        title: `New ${request.kind === "cancellation" ? "cancellation" : "refund"} request · Order #${request.order_display_id}`,
        description: "Open Refund requests under Orders to review the requested items and reply.",
      },
    })
  }, { timeout: 10 })
}

export const config: SubscriberConfig = {
  event: "shop.refund-requested", context: { subscriberId: "mukkys-refund-request-feed" },
}
