export function databaseSsl(env: NodeJS.ProcessEnv) {
  if (!env.DATABASE_SSL || env.DATABASE_SSL === "false") return false
  if (env.DATABASE_SSL !== "true") throw new Error("DATABASE_SSL must be true or false")
  return { rejectUnauthorized: true, ...(env.DATABASE_SSL_CA ? { ca: env.DATABASE_SSL_CA.replace(/\\n/g, "\n") } : {}) }
}

export function validateProductionSecrets(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== "production") return
  for (const name of ["JWT_SECRET", "COOKIE_SECRET"] as const) {
    if (!env[name] || env[name]!.length < 32) throw new Error(`${name} must contain at least 32 random characters`)
  }
  if (env.JWT_SECRET === env.COOKIE_SECRET) throw new Error("JWT_SECRET and COOKIE_SECRET must be different")
}
