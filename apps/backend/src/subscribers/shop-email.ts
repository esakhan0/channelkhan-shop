import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework/subscribers"
import { sendShopEmailWorkflow } from "../workflows/send-shop-email"
import type { ShopEmailEvent } from "../lib/shop-email"

export default async function shopEmailHandler({ event, container }: SubscriberArgs<Omit<ShopEmailEvent, "name">>) {
  if (process.env.SHOP_EMAIL_ENABLED !== "true" || event.data.no_notification ||
      (event.name === "order.transfer_requested" && process.env.ORDER_TRANSFER_EMAIL_ENABLED !== "true")) return
  await sendShopEmailWorkflow(container).run({ input: { ...event.data, name: event.name } })
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.canceled", "shipment.created", "delivery.created", "order.transfer_requested", "shop.refund-requested", "shop.refund-updated"],
  context: { subscriberId: "mukkys-shop-email" },
}
