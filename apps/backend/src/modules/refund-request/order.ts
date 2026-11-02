import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export async function ownedRefundOrder(container: MedusaContainer, customerId: string, orderId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "status", "items.id", "items.title", "items.quantity",
      "items.detail.fulfilled_quantity", "items.detail.shipped_quantity", "items.detail.delivered_quantity",
      "items.detail.return_requested_quantity", "items.detail.return_received_quantity"],
    filters: { id: orderId, customer_id: customerId, is_draft_order: false },
  })
  if (!data[0]) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  return data[0]
}

export function requestableQuantity(item: { quantity: unknown; detail?: Record<string, unknown> | null }, kind: "refund" | "cancellation") {
  const available = kind === "refund" ? Number(item.detail?.delivered_quantity ?? 0) : Number(item.quantity)
  return Math.max(0, Math.floor(available -
    Number(item.detail?.return_requested_quantity ?? 0) - Number(item.detail?.return_received_quantity ?? 0)))
}

// Explicit allowlist: internal customer/reviewer identities never leave the customer API.
export const customerRequestFields = ["id", "order_id", "order_display_id", "kind", "status", "items",
  "customer_note", "response", "created_at", "updated_at"] as const

export function customerRequestView(request: Record<string, unknown>) {
  return { ...Object.fromEntries(customerRequestFields.map((field) => [field, request[field]])),
    items: (request.items as { lines: unknown[] }).lines }
}
