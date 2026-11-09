import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { issueShopAccess } from "../../src/lib/shop-access"

jest.setTimeout(120000)
medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let publicHeaders: Record<string, string>, owner: Record<string, string>, other: Record<string, string>
    let orderId: string, regionId: string
    beforeAll(async () => {
      const container = getContainer()
      const { data: keys } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({ entity: "api_key", fields: ["token"], filters: { type: "publishable" } })
      publicHeaders = { "x-publishable-api-key": keys[0].token }
      const customer = async (email: string) => {
        const registration = await api.post("/auth/customer/emailpass/register", { email, password: "local-test-password" })
        const created = await api.post("/store/customers", { email }, { headers: { ...publicHeaders, authorization: `Bearer ${registration.data.token}` } })
        const login = await api.post("/auth/customer/emailpass", { email, password: "local-test-password" })
        return { id: created.data.customer.id, headers: { ...publicHeaders, authorization: `Bearer ${login.data.token}` } }
      }
      const person = await customer("access-owner@example.com")
      owner = person.headers
      other = (await customer("access-other@example.com")).headers
      orderId = (await container.resolve(Modules.ORDER).createOrders({ customer_id: person.id, email: "access-owner@example.com", currency_code: "gbp", items: [{ title: "Test", quantity: 1, unit_price: 6, requires_shipping: false }] })).id
      regionId = (await container.resolve(Modules.REGION).createRegions({ name: "Test GB", currency_code: "gbp", countries: ["gb"] })).id
      await container.resolve(ContainerRegistrationKeys.LINK).create({
        [Modules.REGION]: { region_id: regionId },
        [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
      })
    })
    const get = (path: string, headers = publicHeaders) => api.get(path, { headers, validateStatus: () => true })
    const post = (path: string, data: unknown, headers = publicHeaders) => api.post(path, data, { headers, validateStatus: () => true })
    it("denies anonymous and other-customer order reads, including expanded fields", async () => {
      for (const suffix of ["", "?fields=*items,*shipping_address,*payment_collections"]) {
        expect((await get(`/store/orders/${orderId}${suffix}`)).status).toBe(404)
        expect((await get(`/store/orders/${orderId}${suffix}`, other)).status).toBe(404)
        expect((await get(`/store/orders/${orderId}${suffix}`, owner)).status).toBe(200)
      }
      const receipt = { ...publicHeaders, "x-order-access-token": issueShopAccess("order", orderId) }
      expect((await get(`/store/orders/${orderId}`, receipt)).status).toBe(200)
      expect((await get(`/store/orders/${orderId}`, { ...receipt, ...other })).status).toBe(404)
    })
    it("protects cart reads, mutations, shipping and payment collections with the same capability", async () => {
      const created = await post("/store/carts", { region_id: regionId })
      expect(created.status).toBe(200)
      const id = created.data.cart.id
      expect(created.data.cart_access_token).toEqual(expect.any(String))
      const access = { ...publicHeaders, "x-cart-access-token": created.data.cart_access_token }
      expect((await get(`/store/carts/${id}`)).status).toBe(404)
      expect((await get(`/store/carts/${id}`, other)).status).toBe(404)
      expect((await get(`/store/carts/${id}`, access)).status).toBe(200)
      expect((await post(`/store/carts/${id}`, { email: "attacker@example.com" })).status).toBe(404)
      expect((await post(`/store/carts/${id}/complete`, {})).status).toBe(404)
      expect((await get(`/store/shipping-options?cart_id=${id}`)).status).toBe(404)
      expect((await get(`/store/shipping-options?cart_id=${id}`, access)).status).toBe(200)
      expect((await post("/store/payment-collections", { cart_id: id })).status).toBe(404)
      const collection = await post("/store/payment-collections", { cart_id: id }, access)
      expect(collection.status).toBe(200)
      const path = `/store/payment-collections/${collection.data.payment_collection.id}/payment-sessions`
      expect((await post(path, { provider_id: "pp_system_default" })).status).toBe(404)
      expect((await post(path, { provider_id: "pp_system_default" }, access)).status).toBe(400)
      expect((await post(path, { provider_id: "pp_stripe_stripe", data: { capture_method: "manual" } }, access)).status).toBe(400)
    })
    it("rejects completion of an existing manual-payment cart on the server", async () => {
      const container = getContainer()
      const created = await post("/store/carts", { region_id: regionId, email: "checkout@example.com", shipping_address: { country_code: "gb" }, billing_address: { country_code: "gb" } })
      expect(created.status).toBe(200)
      const id = created.data.cart.id
      const access = { ...publicHeaders, "x-cart-access-token": created.data.cart_access_token }
      await container.resolve(Modules.CART).addLineItems(id, [{ title: "Test print", quantity: 1, unit_price: 6, requires_shipping: false }])
      const collection = await post("/store/payment-collections", { cart_id: id }, access)
      expect(collection.status).toBe(200)
      // Simulate a legacy session created before the endpoint restriction.
      await container.resolve(Modules.PAYMENT).createPaymentSession(collection.data.payment_collection.id, { provider_id: "pp_system_default", amount: 6, currency_code: "gbp", data: {} })
      const result = await post(`/store/carts/${id}/complete`, {}, access)
      expect(result.status).toBe(400)
      expect(result.data.message).toContain("card or wallet")
      expect(result.data.order_access_token).toBeUndefined()
      const cart = await container.resolve(Modules.CART).retrieveCart(id)
      expect(cart.completed_at).toBeNull()
    })
    it("issues a receipt capability only after a legitimate free cart completes", async () => {
      const container = getContainer()
      const created = await post("/store/carts", { region_id: regionId, email: "free-checkout@example.com", shipping_address: { country_code: "gb" } })
      const id = created.data.cart.id
      const access = { ...publicHeaders, "x-cart-access-token": created.data.cart_access_token }
      await container.resolve(Modules.CART).addLineItems(id, [{ title: "Free sample", quantity: 1, unit_price: 0, requires_shipping: false }])
      const result = await post(`/store/carts/${id}/complete`, {}, access)
      expect(result.status).toBe(200)
      expect(result.data.type).toBe("order")
      expect(result.data.order_access_token).toEqual(expect.any(String))
      expect((await get(`/store/orders/${result.data.order.id}`)).status).toBe(404)
      expect((await get(`/store/orders/${result.data.order.id}`, { ...publicHeaders, "x-order-access-token": result.data.order_access_token })).status).toBe(200)
    })
  },
})
