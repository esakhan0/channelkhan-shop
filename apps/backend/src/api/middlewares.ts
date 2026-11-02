import { allowFields, authenticate, configureStoreSearch, defineMiddlewares } from '@medusajs/framework/http'

// The product index declares filterable `status` and `sales_channel_ids`, so
// the route narrows it to published products in the key's sales channels.
export default defineMiddlewares({
  routes: [
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
