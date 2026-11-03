import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus = true }: OrderDetailsProps) => {
  const formatStatus = (str: string) => {
    const formatted = (str || "pending").split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div className="joy-order-meta">
      <Text>
        Order contact:{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
      </Text>
      <Text className="mt-2">
        Order date:{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toDateString()}
        </span>
      </Text>
      <Text className="mt-2 text-ui-fg-interactive">
        Order number: <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="joy-order-statuses flex flex-wrap items-center text-compact-small gap-2 mt-3">
        {showStatus && (
          <>
            <Text className="joy-status-pill">Order: <span data-testid="order-status">{order.status === "canceled" ? "Cancelled" : formatStatus(order.status)}</span></Text>
            <Text className="joy-status-pill">
              Fulfillment:{" "}
              <span className="text-ui-fg-subtle " data-testid="order-fulfillment-status">
                {formatStatus(order.fulfillment_status)}
              </span>
            </Text>
            <Text className="joy-status-pill">
              Payment status:{" "}
              <span
                className="text-ui-fg-subtle "
                data-testid="order-payment-status"
              >
                {formatStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
      {order.status === "canceled" && <Text className="mt-3">This order has been cancelled. See the payment section below for any refunds.</Text>}
    </div>
  )
}

export default OrderDetails
