import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { databaseSsl } from "../database-security"

describe("database CA configuration", () => {
  let directory: string
  beforeEach(() => { directory = mkdtempSync(join(tmpdir(), "mukky-db-tls-")) })
  afterEach(() => { rmSync(directory, { recursive: true, force: true }) })

  it("loads the mounted CA and keeps verification enabled", () => {
    const file = join(directory, "ca.crt")
    writeFileSync(file, "test CA contents\n")
    expect(databaseSsl({ DATABASE_SSL: "true", DATABASE_SSL_CA_FILE: file })).toEqual({
      rejectUnauthorized: true, ca: "test CA contents\n",
    })
  })
  it("fails closed when the mounted CA is missing or empty", () => {
    const file = join(directory, "ca.crt")
    expect(() => databaseSsl({ DATABASE_SSL: "true", DATABASE_SSL_CA_FILE: file })).toThrow()
    writeFileSync(file, "  ")
    expect(() => databaseSsl({ DATABASE_SSL: "true", DATABASE_SSL_CA_FILE: file })).toThrow("empty")
  })
  it("rejects ambiguous CA settings", () => {
    expect(() => databaseSsl({ DATABASE_SSL: "true", DATABASE_SSL_CA: "pem", DATABASE_SSL_CA_FILE: "file" })).toThrow("only one")
  })
  it.each(["sslmode=disable", "sslmode=no-verify", "sslmode=require", "sslrootcert=file", "sslcert=file", "ssl=true"])(
    "rejects connection-string overrides: %s", (parameter) => {
      expect(() => databaseSsl({ DATABASE_SSL: "true", DATABASE_URL: `postgresql://user:pass@postgres/shop?${parameter}` })).toThrow("Remove SSL parameters")
    }
  )
})
