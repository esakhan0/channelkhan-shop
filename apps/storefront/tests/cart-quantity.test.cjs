// Run from apps/storefront: node --test tests/cart-quantity.test.cjs
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

function load(relative, mocks = {}) {
  const filename = path.resolve(__dirname, '..', relative)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const mod = { exports: {} }
  new Function('require', 'module', 'exports', code)((id) => {
    if (id in mocks) return mocks[id]
    throw new Error(`Unexpected dependency: ${id}`)
  }, mod, mod.exports)
  return mod.exports
}
const stock = load('src/lib/util/cart-stock.ts')
const items = [{ id: 'line1', variant_id: 'v1', product_id: 'p1', quantity: 2 }]
const products = (variant) => [{ id: 'p1', variants: [{ id: 'v1', manage_inventory: true, allow_backorder: false, ...variant }] }]

test('stock limits use available stock, not a fixed ten, and share stock between duplicate variant lines', () => {
  assert.deepEqual(stock.getCartStockLimits(items, products({ inventory_quantity: 3 })), { line1: 3 })
  assert.deepEqual(stock.getCartStockLimits(items, products({ inventory_quantity: 20 })), { line1: 20 })
  assert.deepEqual(stock.getCartStockLimits([...items, { ...items[0], id: 'line2', quantity: 3 }], products({ inventory_quantity: 5 })), { line1: 2, line2: 3 })
})
test('zero stock, unknown stock, and intentional backorders are distinct', () => {
  assert.deepEqual(stock.getCartStockLimits(items, products({ inventory_quantity: -2 })), { line1: 0 })
  assert.deepEqual(stock.getCartStockLimits(items, products({})), {})
  assert.deepEqual(stock.getCartStockLimits(items, []), {})
  assert.deepEqual(stock.getCartStockLimits(items, products({ allow_backorder: true, inventory_quantity: 0 })), { line1: null })
  assert.deepEqual(stock.getCartStockLimits(items, products({ manage_inventory: false })), { line1: null })
})
function actions({ update, fetch, cartId = 'cookie-cart', revalidate = () => {} } = {}) {
  return load('src/lib/data/cart-stock.ts', {
    '@lib/config': { sdk: { client: { fetch }, store: { cart: { updateLineItem: update } } } },
    '@lib/util/cart-stock': stock,
    'next/cache': { revalidateTag: revalidate },
    'next/navigation': { unstable_rethrow: () => {} },
    './cookies': { getCartId: async () => cartId, getAuthHeaders: async () => ({}), getCacheTag: async (name) => name },
  })
}
test('stock reads are uncached and scoped to the cart sales channel; outages leave stock unknown', async () => {
  const api = actions({ fetch: async (url, options) => {
    assert.equal(url, '/store/products')
    assert.equal(options.cache, 'no-store')
    assert.equal(options.query.sales_channel_id, 'channel1')
    assert.deepEqual(options.query.id, ['p1'])
    return { products: products({ inventory_quantity: 3 }) }
  } })
  assert.deepEqual(await api.retrieveCartStock({ items, sales_channel_id: 'channel1' }), { line1: 3 })
  assert.deepEqual(await actions({ fetch: async () => { throw new Error('offline') } }).retrieveCartStock({ items }), {})
})
test('quantity changes use the cookie cart and Medusa stock enforcement; rejected changes return safe feedback', async () => {
  let calls = 0
  const tags = []
  const api = actions({ revalidate: (tag) => tags.push(tag), update: async (cart, line, body) => {
    calls++
    assert.equal(cart, 'cookie-cart')
    assert.equal(line, 'line1')
    if (body.quantity > 3) throw new Error('Insufficient inventory for variant v1')
  } })
  assert.deepEqual(await api.updateCartQuantity({ lineId: 'line1', quantity: 3 }), { success: true })
  assert.deepEqual(tags, ['carts', 'fulfillment'])
  const result = await api.updateCartQuantity({ lineId: 'line1', quantity: 4 })
  assert.equal(result.success, false)
  assert.match(result.error, /no longer available/)
  for (const quantity of [0, -1, 1.5, NaN, Infinity, '2']) {
    assert.equal((await api.updateCartQuantity({ lineId: 'line1', quantity })).success, false)
  }
  assert.equal(calls, 2)
})
test('expired carts and unexpected failures never expose upstream error details', async () => {
  assert.match((await actions({ cartId: null }).updateCartQuantity({ lineId: 'line1', quantity: 1 })).error, /expired/)
  const api = actions({ update: async () => { throw new Error('secret upstream detail') } })
  const result = await api.updateCartQuantity({ lineId: 'line1', quantity: 1 })
  assert.equal(result.success, false)
  assert.doesNotMatch(result.error, /secret|React/)
})
