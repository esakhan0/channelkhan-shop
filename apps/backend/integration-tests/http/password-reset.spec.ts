import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, generateJwtToken } from "@medusajs/framework/utils"
import { generateResetPasswordTokenWorkflow } from "@medusajs/medusa/core-flows"

jest.setTimeout(120000)
medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    const email = "reset-owner@example.com"
    const otherEmail = "reset-other@example.com"
    const originalPassword = "original-unique-password"
    const newPassword = "replacement-unique-password"
    let loginToken: string
    beforeAll(async () => {
      const result = await api.post("/auth/customer/emailpass/register", { email, password: originalPassword })
      loginToken = result.data.token
      await api.post("/auth/customer/emailpass/register", { email: otherEmail, password: originalPassword })
    })
    const issue = async () => {
      const container = getContainer()
      const secret = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig.http!.jwtSecret!
      return (await generateResetPasswordTokenWorkflow(container).run({ input: { entityId: email, actorType: "customer", provider: "emailpass", secret } })).result
    }
    const update = (token?: string, body = { password: newPassword }) => api.post("/auth/customer/emailpass/update", body, {
      headers: token ? { authorization: `Bearer ${token}` } : {}, validateStatus: () => true,
    })
    const login = (address: string, password: string) => api.post("/auth/customer/emailpass", { email: address, password }, { validateStatus: () => true })

    it("gives the same public response for registered and unknown addresses", async () => {
      const existing = await api.post("/auth/customer/emailpass/reset-password", { identifier: email })
      const unknown = await api.post("/auth/customer/emailpass/reset-password", { identifier: "absent@example.com" })
      expect(existing.status).toBe(201)
      expect(unknown.status).toBe(existing.status)
      expect(unknown.data).toEqual(existing.data)
    })
    it("rejects missing, forged and ordinary login tokens", async () => {
      expect((await update()).status).toBe(401)
      expect((await update("forged.token.value")).status).toBe(401)
      expect((await update(loginToken)).status).toBe(401)
      expect((await login(email, originalPassword)).status).toBe(200)
    })
    it("rejects expiry and invalidates older reset links", async () => {
      const old = await issue()
      const newest = await issue()
      expect((await update(old)).status).toBe(401)
      const { exp: _exp, iat: _iat, ...claims } = JSON.parse(Buffer.from(newest.split(".")[1], "base64url").toString())
      const secret = getContainer().resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig.http!.jwtSecret!
      const expired = generateJwtToken(claims, { secret, expiresIn: "-1s" })
      expect((await update(expired)).status).toBe(401)
      expect((await update(newest)).status).toBe(200)
    })
    it("updates only the token owner and refuses reuse, even with another email in the body", async () => {
      const token = await issue()
      expect((await update(token, { password: newPassword, entity_id: otherEmail, email: otherEmail } as any)).status).toBe(200)
      expect((await login(email, originalPassword)).status).toBe(401)
      expect((await login(email, newPassword)).status).toBe(200)
      expect((await login(otherEmail, originalPassword)).status).toBe(200)
      expect((await update(token)).status).toBe(401)
    })
    it("enforces the password policy for direct API requests", async () => {
      for (const password of ["short", "x".repeat(129), ""]) {
        expect((await update(await issue(), { password })).status).toBe(400)
      }
      expect((await login(email, originalPassword)).status).toBe(200)
    })
    it("allows only one of two simultaneous password updates with the same token", async () => {
      const token = await issue()
      const results = await Promise.all([update(token), update(token)])
      expect(results.map((r) => r.status).sort()).toEqual([200, 401])
    })
  },
})
