import { Container, Heading, Text } from "@modules/common/components/ui"

import { getPaymentInfo, isStripeLike } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { orderRefunds, refundedTotal } from "@lib/util/order-refunds"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0]?.payments?.[0]
  const refunds = orderRefunds(order)

  return (
    <section className="joy-order-payment" aria-label="Payment details">
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        Payment
      </Heading>
      <div>
        {!payment && <Text>Payment status: {order.payment_status.replaceAll("_", " ")}</Text>}
        {payment && (
          <div className="flex items-start gap-x-1 w-full">
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method"
              >
                {getPaymentInfo(payment.provider_id)?.title || payment.provider_id}
              </Text>
            </div>
            <div className="flex flex-col w-2/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment details
              </Text>
              <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center">
                <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                  {getPaymentInfo(payment.provider_id)?.icon}
                </Container>
                <Text data-testid="payment-amount">
                  {isStripeLike(payment.provider_id) && payment.data?.card_last4
                    ? `**** **** **** ${payment.data.card_last4}`
                    : `${convertToLocale({
                        amount: payment.amount,
                        currency_code: order.currency_code,
                      })} · ${new Date(
                        payment.created_at ?? ""
                      ).toLocaleString()}`}
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>
      {refunds.length > 0 && <div className="mt-4 rounded border border-ui-border-base p-3" data-testid="order-refunds">
        <Text className="font-semibold">Refunded: {convertToLocale({ amount: refundedTotal(order), currency_code: order.currency_code })}</Text>
        <ul className="mt-2 space-y-2">{refunds.map((refund) => <li key={refund.id}>
          <Text>{convertToLocale({ amount: refund.amount, currency_code: order.currency_code })}
            {refund.created_at ? ` · ${new Date(refund.created_at).toLocaleDateString("en-GB")}` : ""}</Text>
        </li>)}</ul>
        <Text className="mt-2">Refunded to the original payment method. Your bank may take time to show it.</Text>
      </div>}
      <Divider className="mt-8" />
    </section>
  )
}

export default PaymentDetails
