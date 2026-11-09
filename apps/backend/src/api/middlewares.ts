import { allowFields, authenticate, configureStoreSearch, defineMiddlewares } from '@medusajs/framework/http'
import { MedusaError, PolicyOperation } from "@medusajs/framework/utils"
import { validateWeightShippingConfig } from "./admin/weight-shipping-validation"
import { assertStorefrontPaymentProvider } from "../lib/checkout-payment"
import { validateResetPassword } from "./password-reset-validation"
import { attachAccessToken, protectCart, protectCartBody, protectOrder, protectPaymentCollection, protectShippingList } from "./shop-access"

const optionalCustomer = () => authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true, requireMfa: true })

// The product index declares filterable `status` and `sales_channel_ids`, so
// the route narrows it to published products in the key's sales channels.
export default defineMiddlewares({
  routes: [
    { matcher: "/auth/customer/emailpass/update", method: ["POST"], middlewares: [validateResetPassword] },
    { matcher: "/store/carts", method: ["POST"], middlewares: [attachAccessToken("cart")] },
    ...["/store/carts/:id", "/store/carts/:id/*"].map((matcher) => ({ matcher, middlewares: [optionalCustomer(), protectCart] })),
    { matcher: "/store/carts/:id/complete", method: ["POST"], middlewares: [attachAccessToken("order")] },
    { matcher: "/store/orders/:id", method: ["GET"], middlewares: [optionalCustomer(), protectOrder] },
    { matcher: "/store/payment-collections", method: ["POST"], middlewares: [optionalCustomer(), protectCartBody] },
    ...["/store/payment-collections/:id", "/store/payment-collections/:id/*"].map((matcher) => ({ matcher, middlewares: [optionalCustomer(), protectPaymentCollection] })),
    { matcher: "/store/shipping-options", method: ["GET"], middlewares: [optionalCustomer(), protectShippingList] },
    { matcher: "/store/shipping-options/:id/calculate", method: ["POST"], middlewares: [optionalCustomer(), protectCartBody] },
    {
      matcher: "/store/payment-collections/:id/payment-sessions", method: ["POST"],
      middlewares: [(req, _res, next) => {
        assertStorefrontPaymentProvider((req.body as { provider_id?: unknown })?.provider_id)
        // Stripe Elements confirms the intent client-side. Do not let customers
        // override capture mode, confirmation, or Stripe account parameters.
        const body = req.body as { data?: Record<string, unknown> }
        if (body.data && Object.keys(body.data).length) {
          throw new MedusaError(MedusaError.Types.INVALID_DATA, "Custom payment parameters are not supported")
        }
        next()
      }],
    },
    { matcher: "/admin/shipping-options", method: ["POST"], middlewares: [validateWeightShippingConfig] },
    { matcher: "/admin/shipping-options/:id", method: ["POST"], middlewares: [validateWeightShippingConfig] },
    {
      matcher: "/admin/refund-requests*", method: ["GET"],
      policies: [{ resource: "order", operation: PolicyOperation.read }],
    },
    {
      matcher: "/admin/refund-requests/:id", method: ["POST"],
      policies: [{ resource: "order", operation: PolicyOperation.update }],
    },
    {
      matcher: "/admin/refund-requests/:id/resolve", method: ["POST"],
      policies: [{ resource: "order", operation: PolicyOperation.update }, { resource: "refund", operation: PolicyOperation.create }],
    },
    {
      matcher: "/store/orders*",
      middlewares: [allowFields(
        "payment_collections.payments.id", "payment_collections.payments.refunds.id",
        "payment_collections.payments.refunds.amount", "payment_collections.payments.refunds.created_at"
      )],
    },
    {
      matcher: "/store/orders/:id/transfer/request", method: ["POST"],
      middlewares: [authenticate("customer", ["session", "bearer"]), (_req, res, next) => {
        // Enable only after the native transfer-requested email subscriber/provider is configured and tested.
        if (process.env.ORDER_TRANSFER_EMAIL_ENABLED !== "true") {
          res.status(503).json({ message: "Guest order linking is not available yet. Please contact the shop for help." })
          return
        }
        next()
      }],
    },
    {
      matcher: "/store/account/refund-requests*", method: ["GET", "POST"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/returns", method: ["POST"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/account/returns*", method: ["GET"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/orders/:id",
      middlewares: [allowFields(
        "fulfillments.id", "fulfillments.created_at", "fulfillments.shipped_at",
        "fulfillments.delivered_at", "fulfillments.canceled_at",
        "fulfillments.labels.tracking_number", "fulfillments.labels.tracking_url"
      )],
    },
    {
      method: ['POST'],
      matcher: '/store/search',
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
  ],
})
