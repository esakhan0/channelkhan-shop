import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { requestOrderTransferWorkflow } from "@medusajs/medusa/core-flows"
import { sendShopEmailWorkflow } from "../../src/workflows/send-shop-email"
import { prepareShopEmail } from "../../src/lib/shop-email"
import nodemailer from "nodemailer"
import { REFUND_REQUEST_MODULE } from "../../src/modules/refund-request"
import type RefundRequestModuleService from "../../src/modules/refund-request/service"

jest.mock("nodemailer", () => {
  const sendMail = jest.fn().mockResolvedValue({ accepted: ["guest@example.com"], rejected: [], messageId: "test-smtp" })
  return { __esModule: true, default: { createTransport: jest.fn(() => ({ sendMail })) } }
})
jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    let orderId: string, customerId: string
    const sent = () => (nodemailer.createTransport as jest.Mock).mock.results.at(-1)!.value.sendMail as jest.Mock
    beforeAll(async () => {
      const container = getContainer()
      const customer = await container.resolve(Modules.CUSTOMER).createCustomers({ email: "account@example.com", has_account: true })
      customerId = customer.id
      const order = await container.resolve(Modules.ORDER).createOrders({ email: "guest@example.com", currency_code: "gbp", items: [{ title: "Phone stand", quantity: 2, unit_price: 4 }] })
      orderId = order.id
    })
    it("renders real order totals in GBP and deduplicates order confirmations", async () => {
      const container = getContainer()
      const input = { name: "order.placed", id: orderId }
      await Promise.all([sendShopEmailWorkflow(container).run({ input }), sendShopEmailWorkflow(container).run({ input })])
      const count = sent().mock.calls.length
      await sendShopEmailWorkflow(container).run({ input })
      expect(sent()).toHaveBeenCalledTimes(count)
      const mail = sent().mock.calls.at(-1)![0]
      expect(mail.to.address).toBe("guest@example.com")
      expect(mail.text).toContain("£8.00")
      expect(mail.text).not.toContain("£0.08")
      const records = await container.resolve(Modules.NOTIFICATION).listNotifications({ resource_id: orderId, template: "order-placed" })
      expect(records).toHaveLength(1)
      expect(records[0].status).toBe("success")
    })
    it("records a failed send and retries the same notification without creating a second record", async () => {
      const container = getContainer()
      const input = { name: "order.canceled", id: orderId }
      sent().mockRejectedValue(new Error("SMTP temporarily unavailable"))
      const failed = await sendShopEmailWorkflow(container).run({ input, throwOnError: false })
      expect(failed.errors.length).toBeGreaterThan(0)
      sent().mockResolvedValue({ accepted: ["guest@example.com"], rejected: [], messageId: "retry-smtp" })
      await sendShopEmailWorkflow(container).run({ input })
      const records = await container.resolve(Modules.NOTIFICATION).listNotifications({ resource_id: orderId, template: "order-canceled" })
      expect(records).toHaveLength(1)
      expect(records[0].status).toBe("success")
    })
    it.each([false, true])("uses native discounted totals without double-counting shipping tax (tax inclusive: %s)", async (inclusive) => {
      const container = getContainer()
      const order = await container.resolve(Modules.ORDER).createOrders({
        email: "guest@example.com", currency_code: "gbp",
        shipping_address: { first_name: "Alex", last_name: "Example", address_1: "1 Example Road", city: "London", postal_code: "SW1A 1AA", country_code: "gb" },
        items: [{ title: "Phone stand", variant_title: "Blue", quantity: 2, unit_price: inclusive ? 12 : 10, is_tax_inclusive: inclusive,
          tax_lines: [{ rate: 20, code: "test-tax" }], adjustments: [{ amount: 2, code: "TEST" }] }],
        shipping_methods: [{ name: "Test delivery", amount: inclusive ? 6 : 5, is_tax_inclusive: inclusive, tax_lines: [{ rate: 20, code: "test-tax" }] }],
      })
      const email = await prepareShopEmail(container, { name: "order.placed", id: order.id })
      const data = email!.data
      expect(data.subtotal).toBe("£20.00")
      expect(data.shipping).toBe("£5.00")
      const amount = (value?: string) => Number(value?.replace(/[^0-9.-]/g, ""))
      expect(amount(data.subtotal) + amount(data.shipping) - amount(data.discount) + amount(data.tax)).toBeCloseTo(amount(data.total), 2)
      expect(amount(data.tax)).toBeGreaterThan(0)
      expect(data.address).toContain("1 Example Road")
      expect(data.shipping_method).toBe("Test delivery")
      expect(data.items?.[0].variant).toBe("Blue")
      const transfer = await prepareShopEmail(container, { name: "order.canceled", id: order.id })
      expect(transfer?.data.address).toBeUndefined()
    })
    it("honours no-notification and the disabled transfer-email gate", async () => {
      const container = getContainer(), count = sent().mock.calls.length
      await sendShopEmailWorkflow(container).run({ input: { name: "order.placed", id: orderId, no_notification: true } })
      expect(sent()).toHaveBeenCalledTimes(count)
      expect(await prepareShopEmail(container, { name: "order.transfer_requested", id: orderId, order_change_id: "missing" })).toBeUndefined()
    })
    it("addresses refund updates to the requesting customer and includes the staff response", async () => {
      const container = getContainer()
      const request = await container.resolve<RefundRequestModuleService>(REFUND_REQUEST_MODULE).createRefundRequests({
        customer_id: customerId, order_id: orderId, order_display_id: 1, kind: "refund",
        items: { lines: [] }, customer_note: "Faulty item", status: "reviewing", response: "We are checking your request.",
      })
      await sendShopEmailWorkflow(container).run({ input: { name: "shop.refund-updated", id: request.id, version: "test" } })
      const mail = sent().mock.calls.at(-1)![0]
      expect(mail.to.address).toBe("account@example.com")
      expect(mail.text).toContain("We are checking your request.")
      expect(mail.text).toContain("Request status: reviewing")
    })
    it("sends native order-link approval only to the original order email", async () => {
      const container = getContainer()
      await requestOrderTransferWorkflow(container).run({ input: { order_id: orderId, customer_id: customerId, logged_in_user: customerId } })
      const { data: changes } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({ entity: "order_change", filters: { order_id: orderId, status: "requested" }, fields: ["id"] })
      process.env.ORDER_TRANSFER_EMAIL_ENABLED = "true"
      try {
        const email = await prepareShopEmail(container, { name: "order.transfer_requested", id: orderId, order_change_id: changes[0].id })
        expect(email?.to).toBe("guest@example.com")
        expect(email?.data.requested_by).toBe("account@example.com")
        expect(email?.data.action_url).toMatch(new RegExp(`/gb/order/${orderId}/transfer/`))
      } finally { process.env.ORDER_TRANSFER_EMAIL_ENABLED = "false" }
    })
  },
})
