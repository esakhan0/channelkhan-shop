import handler from "../../../subscribers/password-reset"
import { renderShopEmail } from "../templates"
import { Modules } from "@medusajs/framework/utils"

const brand = { storefront_url: "https://mukkys3d.com", from_name: "Mukky's 3D Shop", reply_to: "support@example.com" }

describe("Password reset delivery", () => {
  const originalEnv = { ...process.env }
  afterEach(() => { process.env = { ...originalEnv } })
  it("uses the native recipient and fixed HTTPS destination, ignoring hostile metadata", async () => {
    process.env.SHOP_EMAIL_ENABLED = "true"
    process.env.STOREFRONT_URL = brand.storefront_url
    const createNotifications = jest.fn()
    const container = { resolve: (key: string) => key === Modules.LOCKING
      ? { execute: async (_key: string, fn: () => unknown) => fn() }
      : { createNotifications } }
    const event = { data: { entity_id: "customer@example.com", actor_type: "customer", token: "test.token.secret", metadata: { to: "attacker@example.com", redirect_url: "https://attacker.example" } } }
    await handler({ event, container } as any)
    const mail = createNotifications.mock.calls[0][0]
    expect(mail.to).toBe("customer@example.com")
    const link = new URL(mail.data.action_url)
    expect(link.origin).toBe(brand.storefront_url)
    expect(link.pathname).toBe("/gb/reset-password")
    expect(link.search).toBe("")
    expect(new URLSearchParams(link.hash.slice(1)).get("token")).toBe(event.data.token)
    expect(mail.idempotency_key).not.toContain(event.data.token)
    const rendered = renderShopEmail(mail.template, mail.data, brand)
    expect(rendered.html).toContain("cid:mukkys-logo@shop")
    expect(rendered.text).toContain("15 minutes")
    expect(rendered.text).toContain("If you didn't request this")
    expect(rendered.html).not.toContain("Checked out as a guest")
  })
  it("never silently redirects a reset email to an untrusted domain", () => {
    for (const action_url of ["http://mukkys3d.com/gb/reset-password", "https://attacker.example/gb/reset-password", "https://mukkys3d.com/gb/account", "https://evil@mukkys3d.com/gb/reset-password"]) {
      expect(() => renderShopEmail("password-reset", { action_url }, brand)).toThrow("Invalid password reset destination")
    }
  })
  it("does not send customer links for staff reset events", async () => {
    process.env.SHOP_EMAIL_ENABLED = "true"
    const resolve = jest.fn()
    await handler({ event: { data: { actor_type: "user" } }, container: { resolve } } as any)
    expect(resolve).not.toHaveBeenCalled()
  })
})
