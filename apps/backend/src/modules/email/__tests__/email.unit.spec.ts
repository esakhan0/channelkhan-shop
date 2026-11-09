import { renderShopEmail } from "../templates"
import SmtpNotificationProviderService from "../service"
import nodemailer from "nodemailer"

jest.mock("nodemailer", () => ({ __esModule: true, default: { createTransport: jest.fn() } }))
const options = { host: "smtp.gmail.com", port: 587, user: "shop@example.com", password: "test-password", from: "shop@example.com", reply_to: "shop@example.com", from_name: "Mukky's 3D Shop", storefront_url: "https://mukkys3d.com" }

describe("Branded shop email", () => {
  const sendMail = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
    ;(nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail })
  })
  it("escapes customer content and rejects unsafe links in HTML and plain text", () => {
    const result = renderShopEmail("refund-updated", { first_name: '<img src=x onerror="alert(1)">', response: "<script>bad()</script>", tracking: [{ number: "ABC", url: "javascript:alert(1)" }], action_url: "https://evil.example/phish" }, options)
    expect(result.html).not.toContain("<script>")
    expect(result.html).not.toContain("javascript:")
    expect(result.html).not.toContain("evil.example")
    expect(result.html).toContain("&lt;img")
    expect(result.text).toContain("https://mukkys3d.com/gb/account/orders")
    expect(result.text).not.toContain("javascript:")
  })
  it("has a readable text alternative and never calls a request a paid refund", () => {
    for (const template of ["order-placed", "order-shipped", "order-delivered", "order-canceled", "refund-requested", "refund-updated", "order-transfer", "smtp-test"]) {
      const mail = renderShopEmail(template, { order_number: 42 }, options)
      expect(mail.html).toContain('name="viewport"')
      expect(mail.html).toContain("mukkys-logo.png")
      expect(mail.text).toContain("Order #42")
      expect(mail.subject).toContain("#42")
    }
    expect(renderShopEmail("refund-updated", {}, options).text).toContain("doesn't confirm a payment refund")
  })
  it("requires encrypted authenticated SMTP and keeps sender configuration private", async () => {
    sendMail.mockResolvedValue({ accepted: ["customer@example.com"], rejected: [], messageId: "smtp-1" })
    const provider = new SmtpNotificationProviderService({}, options)
    const result = await provider.send({ to: "customer@example.com", channel: "email", template: "order-placed", from: "attacker@example.com", provider_data: { bcc: "attacker@example.com" }, content: { subject: "override", html: "override" } })
    expect(result).toEqual({ id: "smtp-1" })
    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({ secure: false, requireTLS: true, disableFileAccess: true, disableUrlAccess: true, tls: { minVersion: "TLSv1.2", rejectUnauthorized: true } }))
    expect(sendMail.mock.calls[0][0]).toMatchObject({ from: { address: options.from }, replyTo: options.reply_to })
    expect(sendMail.mock.calls[0][0].bcc).toBeUndefined()
    expect(sendMail.mock.calls[0][0].html).not.toBe("override")
  })
  it("includes zero tax and delivery details safely in both email formats", () => {
    const mail = renderShopEmail("order-placed", {
      subtotal: "£4.00", shipping: "£2.00", tax: "£0.00", total: "£6.00",
      address: ["<script>address</script>"], contact_email: "guest@example.com",
      shipping_method: "Royal Mail", payment_method: "Debit / credit card or wallet",
      items: [{ title: "Phone stand", variant: "<Blue>", quantity: 1, total: "£4.00" }],
    }, options)
    expect(mail.html).toContain("Taxes")
    expect(mail.html).toContain("£0.00")
    expect(mail.html).not.toContain("<script>")
    expect(mail.html).toContain("&lt;Blue&gt;")
    expect(mail.text).toContain("Subtotal (excl. shipping and taxes): £4.00")
    expect(mail.text).toContain("Taxes: £0.00")
    expect(mail.text).toContain("Shipping method: Royal Mail")
    expect(mail.text).toContain("Payment method: Debit / credit card or wallet")
  })
  it("supports Resend SMTP credentials separately from the verified sender", async () => {
    sendMail.mockResolvedValue({ accepted: ["customer@example.com"], rejected: [], messageId: "resend-test" })
    const provider = new SmtpNotificationProviderService({}, {
      ...options, host: "smtp.resend.com", user: "resend", password: "test-api-key",
      from: "orders@example.com", reply_to: "support@example.com",
    })
    await provider.send({ to: "customer@example.com", channel: "email", template: "order-placed" })
    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: "smtp.resend.com", port: 587, requireTLS: true,
      auth: { user: "resend", pass: "test-api-key" },
    }))
    expect(sendMail.mock.calls[0][0]).toMatchObject({
      from: { address: "orders@example.com" }, replyTo: "support@example.com",
    })
  })
  it("rejects multiple recipients and hides SMTP errors containing secrets", async () => {
    const provider = new SmtpNotificationProviderService({}, options)
    await expect(provider.send({ to: "a@example.com,b@example.com", channel: "email", template: "smtp-test" })).rejects.toThrow("single valid email")
    sendMail.mockRejectedValue(new Error("password=test-password recipient=customer@example.com"))
    await expect(provider.send({ to: "customer@example.com", channel: "email", template: "smtp-test" })).rejects.toThrow("Shop email delivery failed")
    expect(() => new SmtpNotificationProviderService({}, { ...options, password: "" })).toThrow("Set SMTP")
  })
})
