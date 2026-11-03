import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

// Read native commerce records. A request status is never proof that money was refunded.
export async function resolutionOrder(container: MedusaContainer, orderId: string) {
  const { data } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({
    entity: "order", filters: { id: orderId }, fields: [
      "id", "status", "currency_code", "items.id", "items.quantity",
      "fulfillments.id", "fulfillments.canceled_at",
      "payment_collections.payments.id", "payment_collections.payments.provider_id",
      "payment_collections.payments.captures.amount", "payment_collections.payments.refunds.amount",
    ],
  })
  if (!data[0]) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  return data[0]
}

export function resolutionContext(order: Awaited<ReturnType<typeof resolutionOrder>>, request: { kind: string; items: unknown }) {
  const selected = (request.items as { lines: { id: string; quantity: number }[] }).lines
  const wholeOrder = order.items?.length === selected.length && order.items.every((item) =>
    selected.some((line) => line.id === item!.id && line.quantity === Number(item!.quantity)))
  const payments = (order.payment_collections?.flatMap((collection) => collection?.payments || []) || []).filter((payment) => !!payment)
  return {
    order_status: order.status, currency_code: order.currency_code,
    can_cancel: request.kind === "cancellation" && wholeOrder && !["canceled", "completed"].includes(order.status) &&
      !order.fulfillments?.some((fulfillment) => fulfillment && !fulfillment.canceled_at),
    payments: payments.map((payment) => ({
      id: payment.id, provider_id: payment.provider_id,
      refundable: Math.max(0, (payment.captures || []).reduce((sum, capture) => sum + Number(capture?.amount || 0), 0) -
        (payment.refunds || []).reduce((sum, refund) => sum + Number(refund?.amount || 0), 0)),
    })),
  }
}
