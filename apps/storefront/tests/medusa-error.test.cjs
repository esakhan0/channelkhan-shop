const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const logs = []
const mod = { exports: {} }
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/util/medusa-error.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText
new Function("exports", "console", code)(mod.exports, { error: (...args) => logs.push(args) })
const medusaError = mod.exports.default

test("upstream errors cannot expose request headers, secrets or server details", () => {
  for (const error of [null, new Error("secret database detail"), {
    config: { url: "/cart?token=secret" }, request: "secret request",
    response: { status: 500, headers: { cookie: "secret" }, data: { message: "secret database detail" } },
  }]) {
    assert.throws(() => medusaError(error), /couldn't complete that request/)
  }
  assert.doesNotMatch(JSON.stringify(logs), /secret/)
})

test("API validation messages survive without requiring Axios URL configuration", () => {
  assert.throws(() => medusaError({ response: { status: 400, data: { message: "Insufficient stock" } } }), /Insufficient stock/)
  assert.throws(() => medusaError({ status: 400, message: "Invalid address" }), /Invalid address/)
})
