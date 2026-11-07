const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const mod = { exports: {} }
  new Function('require', 'module', 'exports', code)(id => {
    if (id in mocks) return mocks[id]
    throw new Error('Unexpected dependency: ' + id)
  }, mod, mod.exports)
  return mod.exports
}
const errors = load('src/lib/util/shipping-error.ts')
function actions(fetch) {
  return load('src/lib/data/fulfillment.ts', {
    '@lib/config': { sdk: { client: { fetch } } },
    './cookies': { getAuthHeaders: async () => ({}) },
    'next/navigation': { unstable_rethrow: () => {} },
    '@lib/util/shipping-error': errors,
  })
}
test('shipping errors become actionable messages without exposing arbitrary backend details', async () => {
  const action = actions(async () => { throw new Error('A cart item has missing or invalid shipping weight. Please contact the shop.') })
  const result = await action.calculatePriceForShippingOption('so', 'cart')
  assert.equal(result.shipping_option, null)
  assert.match(result.error, /no valid shipping weight/)
  assert.equal(errors.shippingErrorMessage(new Error('secret database connection')), errors.SHIPPING_QUOTE_ERROR)
})
test('missing, non-finite and negative amounts cannot become free shipping', async () => {
  for (const amount of [undefined, null, NaN, Infinity, -1]) {
    const result = await actions(async () => ({ shipping_option: { id: 'so', amount } })).calculatePriceForShippingOption('so', 'cart')
    assert.equal(result.shipping_option, null)
    assert.equal(result.error, errors.SHIPPING_QUOTE_ERROR)
  }
  const result = await actions(async () => ({ shipping_option: { id: 'so', amount: 0 } })).calculatePriceForShippingOption('so', 'cart')
  assert.equal(result.shipping_option.amount, 0)
  assert.equal(result.error, null)
})
test('listing and quote calls bypass cached shipping configuration', async () => {
  const calls = []
  const action = actions(async (url, options) => {
    calls.push(options)
    return { shipping_options: [], shipping_option: { id: 'so', amount: 3.75 } }
  })
  await action.listCartShippingMethods('cart')
  await action.calculatePriceForShippingOption('so', 'cart')
  assert.equal(calls.length, 2)
  for (const call of calls) assert.equal(call.cache, 'no-store')
})
