import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let headers: Record<string, string>, other: Record<string, string>, publicHeaders: Record<string, string>
    let orderId: string, itemId: string, undeliveredId: string, optionId: string

    beforeAll(async () => {
      const container = getContainer()
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const link = container.resolve(ContainerRegistrationKeys.LINK)
      const { data: keys } = await query.graph({ entity: "api_key", fields: ["token"], filters: { type: "publishable" } })
      const { data: channels } = await query.graph({ entity: "sales_channel", fields: ["id"] })
      const { data: regions } = await query.graph({ entity: "region", fields: ["id", "currency_code"] })
      const region = regions[0] || await container.resolve(Modules.REGION).createRegions({ name: "Test region", currency_code: "gbp", countries: ["gb"] })
      const fulfillment = container.resolve(Modules.FULFILLMENT)
      const profile = await fulfillment.createShippingProfiles({ name: "Test returns profile", type: "default" })
      const location = await container.resolve(Modules.STOCK_LOCATION).createStockLocations({ name: "Test returns warehouse", address: { country_code: "gb", city: "London", address_1: "Test street" } })
      const set = await fulfillment.createFulfillmentSets({ name: "Test delivery", type: "shipping", service_zones: [{ name: "UK", geo_zones: [{ type: "country", country_code: "gb" }] }] })
      await link.create([
        { [Modules.STOCK_LOCATION]: { stock_location_id: location.id }, [Modules.FULFILLMENT]: { fulfillment_set_id: set.id } },
        { [Modules.STOCK_LOCATION]: { stock_location_id: location.id }, [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" } },
        { [Modules.SALES_CHANNEL]: { sales_channel_id: channels[0].id }, [Modules.STOCK_LOCATION]: { stock_location_id: location.id } },
      ])
      publicHeaders = { "x-publishable-api-key": keys[0].token }
      const customer = async (email: string) => {
        const registration = await api.post("/auth/customer/emailpass/register", { email, password: "local-test-password" })
        const created = await api.post("/store/customers", { email, first_name: "Test" }, {
          headers: { ...publicHeaders, authorization: `Bearer ${registration.data.token}` },
        })
        const login = await api.post("/auth/customer/emailpass", { email, password: "local-test-password" })
        return { id: created.data.customer.id, headers: { ...publicHeaders, authorization: `Bearer ${login.data.token}` } }
      }
      const owner = await customer("return-owner@example.com")
      const stranger = await customer("return-other@example.com")
      headers = owner.headers
      other = stranger.headers
      const { result } = await createShippingOptionsWorkflow(container).run({ input: [{
        name: "Test return postage", price_type: "flat", provider_id: "manual_manual",
        service_zone_id: set.service_zones[0].id, shipping_profile_id: profile.id,
        type: { label: "Return", code: "test-return", description: "Return for inspection" },
        prices: [{ currency_code: region.currency_code, amount: 0 }],
        rules: [{ attribute: "is_return", operator: "eq", value: "true" },
          { attribute: "enabled_in_store", operator: "eq", value: "true" }],
      }] })
      optionId = result[0].id
      // Fixtures only: create native records in the disposable database.
      const orders = container.resolve(Modules.ORDER)
      const cartService = container.resolve(Modules.CART)
      const address = { country_code: "gb", city: "London", address_1: "Test street", postal_code: "TEST" }
      const order = await orders.createOrders({ customer_id: owner.id, email: "return-owner@example.com",
        currency_code: region.currency_code, region_id: region.id, sales_channel_id: channels[0].id,
        shipping_address: address, items: [{ title: "Delivered print", quantity: 2, unit_price: 4 },
          { title: "Not delivered yet", quantity: 1, unit_price: 3 }],
      })
      orderId = order.id
      itemId = order.items![0]!.id
      undeliveredId = order.items![1]!.id
      await orders.registerFulfillment({ order_id: orderId, items: [{ id: itemId, quantity: 2 }] })
      await orders.registerShipment({ order_id: orderId, items: [{ id: itemId, quantity: 2 }] })
      await orders.registerDelivery({ order_id: orderId, items: [{ id: itemId, quantity: 2 }] })
      const cart = await cartService.createCarts({ currency_code: region.currency_code,
        region_id: region.id, sales_channel_id: channels[0].id, customer_id: owner.id, shipping_address: address })
      await link.create({ [Modules.ORDER]: { order_id: orderId }, [Modules.CART]: { cart_id: cart.id } })
    })

    const body = () => ({ order_id: orderId, items: [{ id: itemId, quantity: 1, note: "Damaged on arrival" }], return_shipping: { option_id: optionId } })
    const send = (data: unknown, auth = headers) => api.post("/store/returns", data, { headers: auth, validateStatus: () => true })

    it("requires authentication and checks ownership for reads and writes", async () => {
      expect((await api.get("/store/account/returns", { headers: publicHeaders, validateStatus: () => true })).status).toBe(401)
      expect((await send(body(), publicHeaders)).status).toBe(401)
      expect((await api.get(`/store/account/returns/${orderId}`, { headers: other, validateStatus: () => true })).status).toBe(404)
      expect((await send(body(), other)).status).toBe(404)
    })

    it("rejects undelivered, excessive, fractional and duplicate quantities and privileged fields", async () => {
      for (const payload of [
        { ...body(), items: [{ id: undeliveredId, quantity: 1 }] },
        { ...body(), items: [{ id: itemId, quantity: 3 }] },
        { ...body(), items: [{ id: itemId, quantity: 1.5 }] },
        { ...body(), items: [{ id: itemId, quantity: 1 }, { id: itemId, quantity: 1 }] },
        { ...body(), receive_now: true },
        { ...body(), refund_amount: 100 },
        { ...body(), location_id: "another-location" },
        { ...body(), return_shipping: { option_id: optionId, price: 0 } },
        { ...body(), return_shipping: { option_id: "so_invalid" } },
      ]) expect((await send(payload)).status).toBe(400)
    })

    it("creates a native request without receiving items or refunding, shows only owned history and prevents repeat returns", async () => {
      const before = await api.get(`/store/account/returns/${orderId}`, { headers })
      expect(before.data.order.items.find((item) => item.id === itemId).returnable_quantity).toBe(2)
      expect(before.data.shipping_options.some((option) => option.id === optionId)).toBe(true)
      const response = await send({ ...body(), items: [{ id: itemId, quantity: 2, note: "Damaged" }] })
      expect(response.status).toBe(200)
      expect(response.data.return.status).toBe("requested")
      const mine = await api.get("/store/account/returns", { headers })
      expect(mine.data.returns).toHaveLength(1)
      expect(mine.data.returns[0].order_id).toBe(orderId)
      expect(mine.data.returns[0].items[0].received_quantity).toBe(0)
      expect(mine.data.returns[0].items[0].item.title).toBe("Delivered print")
      expect(mine.data.returns[0].metadata).toBeUndefined()
      expect((await api.get("/store/account/returns", { headers: other })).data.returns).toHaveLength(0)
      expect((await send(body())).status).toBe(400)
      const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
      const { data: refunds } = await query.graph({ entity: "refund", fields: ["id"] })
      expect(refunds).toHaveLength(0)
    })

    it("does not create duplicate requests when the same items are submitted together", async () => {
      const payload = { ...body(), items: [{ id: itemId, quantity: 2 }] }
      const responses = await Promise.all([send(payload), send(payload)])
      expect(responses.filter((response) => response.status === 200)).toHaveLength(1)
      const mine = await api.get("/store/account/returns", { headers })
      expect(mine.data.returns).toHaveLength(1)
    })
  },
})
