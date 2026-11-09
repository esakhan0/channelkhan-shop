import { createHmac, timingSafeEqual } from "node:crypto"

type Purpose = "cart" | "order"
const lifetime = 7 * 24 * 60 * 60

function secret() {
  const value = process.env.COOKIE_SECRET
  if (!value || value.length < 32) throw new Error("COOKIE_SECRET must contain at least 32 characters")
  return value
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(`shop-access-v1:${payload}`).digest()
}

// These are bearer capabilities, never generated from a public lookup endpoint.
export function issueShopAccess(purpose: Purpose, id: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ purpose, id, exp: Math.floor(now / 1000) + lifetime })).toString("base64url")
  return `${payload}.${signature(payload).toString("base64url")}`
}

export function verifyShopAccess(token: unknown, purpose: Purpose, id: string, now = Date.now()) {
  if (typeof token !== "string" || token.length > 1024) return false
  const parts = token.split(".")
  if (parts.length !== 2) return false
  try {
    const expected = signature(parts[0])
    const actual = Buffer.from(parts[1], "base64url")
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false
    const claims = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"))
    return claims.purpose === purpose && claims.id === id && Number.isSafeInteger(claims.exp) &&
      claims.exp > Math.floor(now / 1000) && claims.exp <= Math.floor(now / 1000) + lifetime
  } catch { return false }
}
