import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Copy, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { readLineCustomisation } from "../../lib/customisation"
import { adminApi } from "../lib/admin-api"

type OrderLine = {
  id: string
  title?: string | null
  product_title?: string | null
  variant_title?: string | null
  quantity?: number | null
  metadata?: Record<string, unknown> | null
}

/**
 * A card on the order page listing the text each buyer typed, next to the item
 * it belongs to, with a button to copy it. It only appears on orders that
 * contain at least one item with customer text.
 */
const OrderCustomisation = ({ data }: DetailWidgetProps<AdminOrder>) => {
  // The order page does not always load line metadata, so ask for it by name.
  const { data: loaded } = useQuery({
    queryKey: ["order-customisation", data.id],
    queryFn: () =>
      adminApi<{ order: { items?: OrderLine[] | null } }>(
        `/orders/${data.id}?${new URLSearchParams({ fields: "*items,+items.metadata" })}`
      ),
  })

  const items: OrderLine[] = loaded?.order.items ?? (data.items as OrderLine[] | undefined) ?? []
  const lines = items.flatMap((item) => {
    const custom = readLineCustomisation(item.metadata)
    return custom ? [{ item, ...custom }] : []
  })

  if (!lines.length) return null

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Customer text</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          What the buyer typed for each personalised item.
        </Text>
      </div>
      {lines.map(({ item, label, text }) => (
        <div key={item.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 px-6 py-4">
          <div>
            <Text size="small" weight="plus">
              {item.product_title || item.title}
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {[item.variant_title, `Quantity ${item.quantity ?? 1}`].filter(Boolean).join(" · ")}
            </Text>
          </div>
          <div>
            <Text size="xsmall" className="text-ui-fg-subtle">
              {label}
            </Text>
            <div className="flex items-center gap-x-2">
              <Text size="large" weight="plus" className="break-all font-mono">
                {text}
              </Text>
              <Copy content={text} />
            </div>
          </div>
        </div>
      ))}
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "order.details" })
export default OrderCustomisation
