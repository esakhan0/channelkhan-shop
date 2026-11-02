import type { MedusaContainer, OrderDTO } from "@medusajs/framework/types"
import { ChangeActionType, ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { REFUND_REQUEST_MODULE } from "../modules/refund-request"
import type RefundRequestModuleService from "../modules/refund-request/service"
import type { ShopEmailData } from "../modules/email/templates"

export type ShopEmailEvent = { name: string; id: string; order_change_id?: string; version?: string; no_notification?: boolean }
export type PreparedEmail = { to: string; template: string; data: ShopEmailData; key: string; order_id: string }

const templates: Record<string, string> = {
  "order.placed": "order-placed", "order.canceled": "order-canceled",
  "shipment.created": "order-shipped", "delivery.created": "order-delivered",
  "shop.refund-requested": "refund-requested", "shop.refund-updated": "refund-updated",
  "order.transfer_requested": "order-transfer",
}

export async function prepareShopEmail(container: MedusaContainer, event: ShopEmailEvent): Promise<PreparedEmail | undefined> {
  if (event.no_notification || !templates[event.name]) return
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  let orderId = event.id
  let to: string | undefined
  let extra: ShopEmailData = {}
  let key = `${event.name}:${event.id}:${event.version || "v1"}`
  let shipmentItems: { line_item_id: string; quantity: number }[] | undefined

  if (event.name === "shipment.created" || event.name === "delivery.created") {
    const { data: fulfillments } = await query.graph({ entity: "fulfillment", filters: { id: event.id },
      fields: ["id", "canceled_at", "order.id", "labels.tracking_number", "labels.tracking_url", "items.line_item_id", "items.quantity"] })
    const fulfillment = fulfillments[0]
    if (!fulfillment || fulfillment.canceled_at || !fulfillment.order?.id) return
    orderId = fulfillment.order.id
    shipmentItems = fulfillment.items.map((item) => ({ line_item_id: item.line_item_id!, quantity: Number(item.quantity) }))
    extra.tracking = fulfillment.labels.map((label) => ({ number: label.tracking_number, url: label.tracking_url }))
  }

  if (event.name.startsWith("shop.refund-")) {
    const service = container.resolve<RefundRequestModuleService>(REFUND_REQUEST_MODULE)
    const request = await service.retrieveRefundRequest(event.id)
    orderId = request.order_id
    // A refund request belongs to its authenticated customer, not a subsequently changed order email.
    const customer = await container.resolve(Modules.CUSTOMER).retrieveCustomer(request.customer_id)
    to = customer.email
    extra = { status: request.status, response: request.response }
  }

  const { data: orders } = await query.graph({ entity: "order", filters: { id: orderId },
    fields: ["id", "display_id", "email", "total", "currency_code", "shipping_address.first_name", "shipping_address.country_code", "items.id", "items.title", "items.quantity", "items.total",
      ...(event.name === "order.placed" ? ["item_subtotal", "shipping_subtotal", "discount_subtotal", "tax_total", "credit_line_total",
        "shipping_address.last_name", "shipping_address.company", "shipping_address.address_1", "shipping_address.address_2", "shipping_address.city", "shipping_address.province", "shipping_address.postal_code",
        "shipping_methods.name", "items.variant_title", "payment_collections.payments.provider_id"] : [])] })
  // These computed totals are in OrderDTO but absent from the generated graph type.
  const order = orders[0] as typeof orders[number] & Pick<OrderDTO, "discount_subtotal" | "credit_line_total">
  if (!order?.email) return
  const country = /^[a-z]{2}$/.test(order.shipping_address?.country_code ?? "") ? order.shipping_address!.country_code : "gb"
  const base = (process.env.STOREFRONT_URL || "https://shop.channelkhan.com").replace(/\/$/, "")
  let actionUrl = `${base}/${country}/account/${event.name.startsWith("shop.refund-") ? "refunds" : "orders"}`

  if (event.name === "order.transfer_requested") {
    if (process.env.ORDER_TRANSFER_EMAIL_ENABLED !== "true" || !event.order_change_id) return
    const { data: changes } = await query.graph({ entity: "order_change",
      filters: { id: event.order_change_id, order_id: order.id, status: "requested" },
      fields: ["id", "change_type", "actions.action", "actions.details", "actions.reference_id"] })
    const change = changes[0]
    const action = change?.actions?.find((a) => a && String(a.action) === ChangeActionType.TRANSFER_CUSTOMER)
    if (change?.change_type !== "transfer" || !action) return
    const originalEmail = action.details?.original_email
    const token = action.details?.token
    if (typeof originalEmail !== "string" || typeof token !== "string" || !token) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Order linking email is missing its original recipient or approval token")
    }
    // Never send the approval token to the requesting account or a supplied address.
    to = originalEmail
    const customer = await container.resolve(Modules.CUSTOMER).retrieveCustomer(action.reference_id!)
    extra.requested_by = customer.email
    actionUrl = `${base}/${country}/order/${encodeURIComponent(order.id)}/transfer/${encodeURIComponent(token)}`
    key = `${event.name}:${change.id}`
  }

  // Medusa v2 amounts are already in major currency units (GBP 4, not 400).
  const money = (amount: unknown) => new Intl.NumberFormat("en-GB", { style: "currency", currency: order.currency_code.toUpperCase() }).format(Number(amount))
  const items = (order.items ?? []).flatMap((item) => {
    if (!item) return []
    if (shipmentItems) {
      const quantity = shipmentItems.filter((entry) => entry.line_item_id === item.id).reduce((sum, entry) => sum + entry.quantity, 0)
      return quantity ? [{ title: item.title, quantity }] : []
    }
    return [{ title: item.title, variant: item.variant_title || undefined, quantity: Number(item.quantity), total: money(item.total) }]
  })
  const address = order.shipping_address
  const addressLines = address ? [
    [address.first_name, address.last_name].filter(Boolean).join(" "), address.company,
    address.address_1, address.address_2, [address.city, address.postal_code].filter(Boolean).join(", "),
    address.province, address.country_code?.toUpperCase(),
  ].filter((line): line is string => Boolean(line)) : []
  const paymentMethods = [...new Set((order.payment_collections ?? []).flatMap((collection) =>
    (collection?.payments ?? []).flatMap((payment) => !payment ? [] : [payment.provider_id.startsWith("pp_stripe_")
      ? "Debit / credit card or wallet" : payment.provider_id === "pp_system_default" ? "Manual payment" : "Online payment"])))]
  return { to: to || order.email, template: templates[event.name], key, order_id: order.id,
    data: { order_number: order.display_id ?? undefined, first_name: order.shipping_address?.first_name ?? undefined,
      ...(event.name === "order.placed" ? { items, total: money(order.total), subtotal: money(order.item_subtotal), shipping: money(order.shipping_subtotal),
        tax: money(order.tax_total), discount: Number(order.discount_subtotal) > 0 ? money(order.discount_subtotal) : undefined,
        credit: Number(order.credit_line_total) > 0 ? money(order.credit_line_total) : undefined,
        address: addressLines, contact_email: order.email,
        shipping_method: (order.shipping_methods ?? []).flatMap((method) => method ? [method.name] : []).join(", "),
        payment_method: paymentMethods.join(", ") || undefined } : {}),
      ...(shipmentItems ? { items } : {}), ...extra, action_url: actionUrl } }
}
