import { issueShopAccess, verifyShopAccess } from "../shop-access"
import { databaseSsl, validateProductionSecrets } from "../database-security"

describe("shop access capabilities", () => {
  const original = process.env.COOKIE_SECRET
  const now = 1800000000000
  beforeEach(() => { process.env.COOKIE_SECRET = "test-cookie-secret-with-at-least-32-characters" })
  afterAll(() => { if (original === undefined) delete process.env.COOKIE_SECRET; else process.env.COOKIE_SECRET = original })
  it("accepts only the signed resource and purpose", () => {
    const token = issueShopAccess("cart", "cart_one", now)
    expect(verifyShopAccess(token, "cart", "cart_one", now)).toBe(true)
    expect(verifyShopAccess(token, "cart", "cart_two", now)).toBe(false)
    expect(verifyShopAccess(token, "order", "cart_one", now)).toBe(false)
    const parts = token.split(".")
    parts[0] = Buffer.from(JSON.stringify({ purpose: "cart", id: "cart_two", exp: now / 1000 + 60 })).toString("base64url")
    expect(verifyShopAccess(parts.join("."), "cart", "cart_two", now)).toBe(false)
  })
  it("rejects expired, malformed, and rotated-secret tokens", () => {
    const token = issueShopAccess("order", "order_one", now)
    expect(verifyShopAccess(token, "order", "order_one", now + 604800000)).toBe(false)
    for (const invalid of [undefined, [], "", "x.y.z", "x.y", "x".repeat(1025)]) {
      expect(verifyShopAccess(invalid, "order", "order_one", now)).toBe(false)
    }
    process.env.COOKIE_SECRET = "a-different-test-secret-with-at-least-32-characters"
    expect(verifyShopAccess(token, "order", "order_one", now)).toBe(false)
  })
  it("does not issue capabilities with a missing or short secret", () => {
    process.env.COOKIE_SECRET = "short"
    expect(() => issueShopAccess("cart", "cart_one")).toThrow()
  })
})

describe("database transport and production secrets", () => {
  it("requires certificate validation whenever TLS is enabled", () => {
    expect(databaseSsl({ DATABASE_SSL: "true" })).toEqual({ rejectUnauthorized: true })
    expect(databaseSsl({ DATABASE_SSL: "true", DATABASE_SSL_CA: "line1\\nline2" })).toEqual({ rejectUnauthorized: true, ca: "line1\nline2" })
    expect(databaseSsl({ DATABASE_SSL: "false" })).toBe(false)
    expect(() => databaseSsl({ DATABASE_SSL: "insecure" })).toThrow()
  })
  it("fails startup with weak or shared production secrets", () => {
    expect(() => validateProductionSecrets({ NODE_ENV: "production" })).toThrow()
    const jwt = "a".repeat(40)
    expect(() => validateProductionSecrets({ NODE_ENV: "production", JWT_SECRET: jwt, COOKIE_SECRET: jwt })).toThrow()
    expect(() => validateProductionSecrets({ NODE_ENV: "production", JWT_SECRET: jwt, COOKIE_SECRET: "b".repeat(40) })).not.toThrow()
  })
})
