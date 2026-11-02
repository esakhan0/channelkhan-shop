import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { requestOrderTransferWorkflow } from "@medusajs/medusa/core-flows"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let headers: Record<string, string>, other: Record<string, string>, publicHeaders: Record<string, string>
    let admin: Record<string, string>
    let orderId: string, itemId: string, deliveredId: string, canceledId: string, guestOrderId: string, ownerId: string, guestId: string

    beforeAll(async () => {
      const container = getContainer()
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data: keys } = await query.graph({ entity: "api_key", fields: ["token"], filters: { type: "publishable" } })
      publicHeaders = { "x-publishable-api-key": keys[0].token }
      const customer = async (email: string) => {
        const registration = await api.post("/auth/customer/emailpass/register", { email, password: "local-test-password" })
        const created = await api.post("/store/customers", { email }, {
          headers: { ...publicHeaders, authorization: `Bearer ${registration.data.token}` },
        })
        const login = await api.post("/auth/customer/emailpass", { email, password: "local-test-password" })
        return { id: created.data.customer.id, headers: { ...publicHeaders, authorization: `Bearer ${login.data.token}` } }
      }
      const guest = await container.resolve(Modules.CUSTOMER).createCustomers({ email: "refund-owner@example.com", has_account: false })
      guestId = guest.id
      const owner = await customer("refund-owner@example.com")
      ownerId = owner.id
      headers = owner.headers
      other = (await customer("refund-other@example.com")).headers
      const orders = container.resolve(Modules.ORDER)
      guestOrderId = (await orders.createOrders({ customer_id: guest.id, email: guest.email!, currency_code: "gbp",
        items: [{ title: "Guest print", quantity: 1, unit_price: 4 }] })).id
      const order = await orders.createOrders({ customer_id: owner.id, email: "refund-owner@example.com",
        currency_code: "gbp", items: [{ title: "Unfulfilled print", quantity: 2, unit_price: 4 },
          { title: "Delivered print", quantity: 1, unit_price: 3 }],
      })
      orderId = order.id
      itemId = order.items!.find((item) => item?.title === "Unfulfilled print")!.id
      deliveredId = order.items!.find((item) => item?.title === "Delivered print")!.id
      await orders.registerFulfillment({ order_id: orderId, items: [{ id: deliveredId, quantity: 1 }] })
      await orders.registerShipment({ order_id: orderId, items: [{ id: deliveredId, quantity: 1 }] })
      await orders.registerDelivery({ order_id: orderId, items: [{ id: deliveredId, quantity: 1 }] })
      const canceled = await orders.createOrders({ customer_id: owner.id, currency_code: "gbp", status: "canceled",
        items: [{ title: "Canceled print", quantity: 1, unit_price: 4 }] })
      canceledId = canceled.id
      // Admin identity fixture, using the native auth module and role bootstrap.
      const user = await container.resolve(Modules.USER).createUsers({ email: "refund-admin@example.com" })
      const auth = container.resolve(Modules.AUTH)
      const registered = await auth.register("emailpass", { body: { email: user.email, password: "local-test-password" } })
      await auth.updateAuthIdentities({ id: registered.authIdentity!.id, app_metadata: { user_id: user.id } })
      const login = await api.post("/auth/user/emailpass", { email: user.email, password: "local-test-password" })
      admin = { authorization: `Bearer ${login.data.token}` }
    })

    const body = () => ({ order_id: orderId, kind: "cancellation", items: [{ id: itemId, quantity: 1 }], customer_note: "Please cancel this item" })
    const send = (data: unknown, auth = headers) => api.post("/store/account/refund-requests", data, { headers: auth, validateStatus: () => true })

    it("protects customer and admin routes and rejects other customers' orders", async () => {
      expect((await send(body(), publicHeaders)).status).toBe(401)
      expect((await api.get("/store/account/refund-requests", { headers: publicHeaders, validateStatus: () => true })).status).toBe(401)
      expect((await send(body(), other)).status).toBe(404)
      expect((await api.get(`/store/account/refund-requests/${orderId}`, { headers: other, validateStatus: () => true })).status).toBe(404)
      expect((await api.get("/admin/refund-requests", { headers, validateStatus: () => true })).status).toBe(401)
      expect((await api.post("/admin/refund-requests/rreq_fake", { status: "closed", response: "Fake" }, { headers, validateStatus: () => true })).status).toBe(401)
      expect((await api.post("/store/returns", { order_id: orderId, items: [{ id: deliveredId, quantity: 1 }], return_shipping: { option_id: "unused" } }, { headers, validateStatus: () => true })).status).toBe(410)
      expect((await api.get("/store/account/returns", { headers })).data.returns).toEqual([])
      expect((await api.post(`/store/orders/${orderId}/transfer/request`, {}, { headers: other, validateStatus: () => true })).status).toBe(503)
    })

    it("rejects manipulated quantities, items, identities, status and financial fields", async () => {
      for (const payload of [
        { ...body(), items: [{ id: itemId, quantity: 3 }] },
        { ...body(), items: [{ id: itemId, quantity: 1.5 }] },
        { ...body(), items: [{ id: itemId, quantity: 0 }] },
        { ...body(), items: [{ id: itemId, quantity: 1 }, { id: itemId, quantity: 1 }] },
        { ...body(), items: [{ id: "item_other", quantity: 1 }] },
        { ...body(), items: [{ id: itemId, quantity: 1, title: "Spoofed" }] },
        { ...body(), customer_id: "cus_other" }, { ...body(), status: "closed" },
        { ...body(), receive_now: true }, { ...body(), refund_amount: 100 },
        { ...body(), kind: "refund", customer_note: " " }, { ...body(), kind: "automatic_refund" },
        { ...body(), kind: "refund" },
        { ...body(), order_id: canceledId },
      ]) expect((await send(payload)).status).toBe(400)
    })

    it("accepts before-delivery cancellation, preserves commerce records and prevents simultaneous duplicates", async () => {
      const responses = await Promise.all([send(body()), send(body())])
      expect(responses.map((response) => response.status).sort()).toEqual([201, 400])
      const mine = (await api.get("/store/account/refund-requests", { headers })).data
      expect(mine.requests).toHaveLength(1)
      expect(mine.requests[0]).toMatchObject({ status: "pending", kind: "cancellation", items: [{ id: itemId, quantity: 1, title: "Unfulfilled print" }] })
      expect(mine.requests[0].customer_id).toBeUndefined()
      expect(mine.requests[0].reviewed_by).toBeUndefined()
      expect((await api.get("/store/account/refund-requests", { headers: other })).data.requests).toHaveLength(0)
      expect((await api.get(`/store/account/refund-requests/${orderId}`, { headers })).data.has_open_request).toBe(true)
      const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
      for (const entity of ["refund", "return"]) {
        expect((await query.graph({ entity, fields: ["id"] })).data).toHaveLength(0)
      }
      const { data: orders } = await query.graph({ entity: "order", fields: ["status", "items.id", "items.detail.fulfilled_quantity"], filters: { id: orderId } })
      expect(orders[0].status).not.toBe("canceled")
      expect(Number(orders[0].items!.find((item) => item?.id === itemId)!.detail.fulfilled_quantity)).toBe(0)
    })

    it("accepts delivered-item requests and makes admin replies visible only to the owner", async () => {
      const created = await send({ ...body(), kind: "refund", items: [{ id: deliveredId, quantity: 1 }], customer_note: "The print arrived broken" })
      expect(created.status).toBe(201)
      const id = created.data.request.id
      expect((await api.get("/admin/refund-requests", { headers: admin })).data.requests[0].id).toBe(id)
      const response = await api.post(`/admin/refund-requests/${id}`, { status: "reviewing", response: "We are checking this for you." }, { headers: admin })
      expect(response.status).toBe(200)
      const mine = (await api.get("/store/account/refund-requests", { headers })).data.requests[0]
      expect(mine).toMatchObject({ status: "reviewing", response: "We are checking this for you." })
      expect(mine.reviewed_by).toBeUndefined()
      expect((await api.get("/store/account/refund-requests", { headers: other })).data.requests).toHaveLength(0)
      expect((await api.post(`/admin/refund-requests/${id}`, { status: "closed", response: "Done", refund_amount: 100 }, { headers: admin, validateStatus: () => true })).status).toBe(400)
    })

    it("does not claim guest orders by matching email or by guessing an order ID/token", async () => {
      expect(ownerId).not.toBe(guestId)
      expect((await api.get(`/store/account/refund-requests/${guestOrderId}`, { headers, validateStatus: () => true })).status).toBe(404)
      await requestOrderTransferWorkflow(getContainer()).run({ input: {
        order_id: guestOrderId, customer_id: ownerId, logged_in_user: ownerId,
      } })
      const denied = await api.post(`/store/orders/${guestOrderId}/transfer/accept`, { token: "guessed-invalid-token" }, { headers, validateStatus: () => true })
      expect(denied.status).toBe(400)
      const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
      const { data } = await query.graph({ entity: "order", fields: ["customer_id"], filters: { id: guestOrderId } })
      expect(data[0].customer_id).toBe(guestId)
      // Simulate possession of the original-inbox confirmation token in the isolated fixture only.
      const { data: changes } = await query.graph({ entity: "order_change", fields: ["actions.details"],
        filters: { order_id: guestOrderId, status: "requested" } })
      const token = changes[0].actions![0]!.details!.token
      expect(typeof token).toBe("string")
      expect((await api.post(`/store/orders/${guestOrderId}/transfer/accept`, { token }, { headers })).status).toBe(200)
      expect((await api.get(`/store/account/refund-requests/${guestOrderId}`, { headers })).status).toBe(200)
      expect((await api.get(`/store/account/refund-requests/${guestOrderId}`, { headers: other, validateStatus: () => true })).status).toBe(404)
      expect((await api.post(`/store/orders/${guestOrderId}/transfer/accept`, { token }, { headers, validateStatus: () => true })).status).toBe(400)
    })

    it("does not treat fulfillment or shipping as delivery for faulty-item requests", async () => {
      const orders = getContainer().resolve(Modules.ORDER)
      await orders.registerFulfillment({ order_id: orderId, items: [{ id: itemId, quantity: 1 }] })
      await orders.registerShipment({ order_id: orderId, items: [{ id: itemId, quantity: 1 }] })
      const details = (await api.get(`/store/account/refund-requests/${orderId}`, { headers })).data
      expect(details.order.items.find((item) => item.id === itemId)).toMatchObject({ faulty_quantity: 0, fulfillment_started: true })
      expect((await send({ ...body(), kind: "refund", customer_note: "Claimed fault before delivery" })).status).toBe(400)
      expect((await send({ ...body(), customer_note: "" })).status).toBe(201)
    })
  },
})
