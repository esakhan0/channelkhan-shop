import { readFileSync } from "node:fs"

export function databaseSsl(env: NodeJS.ProcessEnv) {
  if (!env.DATABASE_SSL || env.DATABASE_SSL === "false") return false
  if (env.DATABASE_SSL !== "true") throw new Error("DATABASE_SSL must be true or false")
  if (env.DATABASE_SSL_CA && env.DATABASE_SSL_CA_FILE) {
    throw new Error("Set only one of DATABASE_SSL_CA or DATABASE_SSL_CA_FILE")
  }
  // pg connection-string TLS parameters can override the verified SSL object.
  if (env.DATABASE_URL) {
    const url = new URL(env.DATABASE_URL)
    for (const name of url.searchParams.keys()) {
      if (name.toLowerCase().startsWith("ssl")) {
        throw new Error("Remove SSL parameters from DATABASE_URL; use DATABASE_SSL settings")
      }
    }
  }
  const ca = env.DATABASE_SSL_CA_FILE
    ? readFileSync(env.DATABASE_SSL_CA_FILE, "utf8")
    : env.DATABASE_SSL_CA?.replace(/\\n/g, "\n")
  if (env.DATABASE_SSL_CA_FILE && !ca?.trim()) throw new Error("Database CA file is empty")
  return { rejectUnauthorized: true, ...(ca ? { ca } : {}) }
}

export function validateProductionSecrets(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== "production") return
  for (const name of ["JWT_SECRET", "COOKIE_SECRET"] as const) {
    if (!env[name] || env[name]!.length < 32) throw new Error(`${name} must contain at least 32 random characters`)
  }
  if (env.JWT_SECRET === env.COOKIE_SECRET) throw new Error("JWT_SECRET and COOKIE_SECRET must be different")
}
