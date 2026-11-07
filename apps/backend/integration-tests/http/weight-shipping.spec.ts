import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { WEIGHT_OPTION_ID, WEIGHT_PROVIDER_ID } from "../../src/modules/weight-shipping/config"
import { calculateShippingOptionsPricesWorkflow } from "@medusajs/medusa/core-flows"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    it("persists Admin bands, rejects invalid and unauthenticated updates, and reprices through the native provider", async () => {
      const container = getContainer()
      const fulfillment = container.resolve(Modules.FULFILLMENT)
      const user = await container.resolve(Modules.USER).createUsers({ email: "shipping-admin@example.com" })
      const auth = container.resolve(Modules.AUTH)
      const registered = await auth.register("emailpass", { body: { email: user.email, password: "local-test-password" } })
      await auth.updateAuthIdentities({ id: registered.authIdentity!.id, app_metadata: { user_id: user.id } })
      const login = await api.post("/auth/user/emailpass", { email: user.email, password: "local-test-password" })
      const headers = { authorization: `Bearer ${login.data.token}` }
      const location = await container.resolve(Modules.STOCK_LOCATION).createStockLocations({ name: "Weight test warehouse" })
      const set = await fulfillment.createFulfillmentSets({ name: "Weight test set", type: "shipping", service_zones: [
        { name: "UK", geo_zones: [{ type: "country", country_code: "gb" }] },
      ] })
      const link = container.resolve(ContainerRegistrationKeys.LINK)
      await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
        [Modules.FULFILLMENT]: { fulfillment_provider_id: WEIGHT_PROVIDER_ID } })
      await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
        [Modules.FULFILLMENT]: { fulfillment_set_id: set.id } })
      const profile = await fulfillment.createShippingProfiles({ name: "Weight test profile", type: "default" })
      const created = await api.post("/admin/shipping-options", {
        name: "Test delivery", price_type: "calculated", provider_id: WEIGHT_PROVIDER_ID,
        service_zone_id: set.service_zones[0].id, shipping_profile_id: profile.id,
        type: { label: "Test", code: "weight-test", description: "Test delivery" },
        prices: [], data: { id: WEIGHT_OPTION_ID, unrelated: "preserved" },
      }, { headers })
      expect(created.status).toBe(200)
      const id = created.data.shipping_option.id
      const config = { id: WEIGHT_OPTION_ID, name: "Test delivery", country_codes: ["gb"],
        packaging_weight_g: 50, tax_inclusive: false,
        bands: [{ max_weight_g: 250, price_pence: 200 }, { max_weight_g: 1000, price_pence: 400 }] }
      const body = { name: config.name, price_type: "calculated", provider_id: WEIGHT_PROVIDER_ID,
        data: { id: WEIGHT_OPTION_ID, unrelated: "preserved", weight_config: config } }
      expect((await api.post(`/admin/shipping-options/${id}`, body, { validateStatus: () => true })).status).toBe(401)
      const saved = await api.post(`/admin/shipping-options/${id}`, body, { headers })
      expect(saved.data.shipping_option.data).toEqual(body.data)
      const listed = await api.get(`/admin/shipping-options?provider_id=${WEIGHT_PROVIDER_ID}&fields=id,name,price_type,data`, { headers })
      expect(listed.data.shipping_options.find(option => option.id === id).data.weight_config).toEqual(config)
      const bad = await api.post(`/admin/shipping-options/${id}`, { ...body, data: { ...body.data,
        weight_config: { ...config, bands: [...config.bands].reverse() },
      } }, { headers, validateStatus: () => true })
      expect(bad.status).toBe(400)
      const quote = async () => {
        const persisted = await fulfillment.retrieveShippingOption(id)
        return fulfillment.calculateShippingOptionsPrices([{
          id, provider_id: WEIGHT_PROVIDER_ID, optionData: persisted.data!,
          data: { weight_config: { ...config, bands: [{ max_weight_g: 9999, price_pence: 0 }] } },
          context: { currency_code: "gbp", shipping_address: { country_code: "gb" },
            items: [{ requires_shipping: true, quantity: 3, variant: { weight: 100 } }] },
        }] as unknown as Parameters<typeof fulfillment.calculateShippingOptionsPrices>[0])
      }
      expect((await quote())[0].calculated_amount).toBe(4)
      await api.post(`/admin/shipping-options/${id}`, { ...body, data: { ...body.data,
        weight_config: { ...config, bands: [{ max_weight_g: 1000, price_pence: 375 }] },
      } }, { headers })
      expect((await quote())[0].calculated_amount).toBe(3.75)
      const product = await container.resolve(Modules.PRODUCT).createProducts({
        title: "Weighted print", variants: [{ title: "Medium", weight: 100, manage_inventory: false }],
      })
      await link.create({ [Modules.PRODUCT]: { product_id: product.id },
        [Modules.FULFILLMENT]: { shipping_profile_id: profile.id } })
      const cart = await container.resolve(Modules.CART).createCarts({ currency_code: "gbp",
        shipping_address: { country_code: "gb" }, items: [{ title: "Weighted print", quantity: 3, unit_price: 9,
          variant_id: product.variants![0].id, product_id: product.id, requires_shipping: true }],
      })
      const actual = await calculateShippingOptionsPricesWorkflow(container).run({
        input: { cart_id: cart.id, shipping_options: [{ id }] },
      })
      expect(actual.result[0].calculated_amount).toBe(3.75)
      await api.post(`/admin/shipping-options/${id}`, body, { headers })
      const calculateCart = () => calculateShippingOptionsPricesWorkflow(container).run({
        input: { cart_id: cart.id, shipping_options: [{ id }] },
      })
      expect((await calculateCart()).result[0].calculated_amount).toBe(4)
      await container.resolve(Modules.PRODUCT).updateProductVariants(product.variants![0].id, { weight: 40 })
      expect((await calculateCart()).result[0].calculated_amount).toBe(2)
    })
  },
})
