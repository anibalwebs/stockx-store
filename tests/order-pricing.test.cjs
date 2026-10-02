const { test } = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const vm = require('node:vm')
const id = '11111111-1111-1111-1111-111111111111'
function setup({ error = null, cooldown = false } = {}) {
  const calls = [], cookiesWritten = []
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync('src/actions/orders.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(code, { module, exports: module.exports, console: { error() {} }, require(name) {
    if (name === '@/lib/supabase/server') return { createClient: async () => ({ rpc: async (name, args) => {
      calls.push({ name, args }); return { error, data: error ? null : { shortId: 'PED-TEST', total: 160, subtotal: 200, items: [{ title: 'Zapatos reales', size: '42', quantity: 2, price: 80 }] } }
    } }) }
    if (name === 'next/headers') return { cookies: async () => ({ get: () => cooldown ? { value: String(Date.now()) } : undefined, set: (...args) => cookiesWritten.push(args) }) }
    throw Error(name)
  } })
  return { createOrder: module.exports.createOrder, calls, cookiesWritten }
}
test('only sends product IDs, sizes and quantities to atomic checkout', async () => {
  const { createOrder, calls, cookiesWritten } = setup()
  const result = await createOrder([{ product_id: id, size: '42', quantity: 2, price: 1, title: 'Falso' }], 'Delivery', 'Pago móvil')
  assert.equal(result.success, true)
  assert.equal(result.total, 160)
  assert.equal(result.items[0].price, 80)
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [{ name: 'create_store_order', args: { cart_items: [{ product_id: id, size: '42', quantity: 2 }], delivery_method: 'Delivery', payment_method: 'Pago móvil' } }])
  assert.equal(cookiesWritten.length, 1)
})
test('rejects malformed carts before database access', async () => {
  for (const input of [[], null, [{ product_id: 'bad', size: '42', quantity: 1 }], ...[0, -1, 1.5, '2', 101].map(quantity => [{ product_id: id, size: '42', quantity }])]) {
    const { createOrder, calls } = setup()
    assert.equal((await createOrder(input, 'Delivery', 'Pago móvil')).success, false)
    assert.equal(calls.length, 0)
  }
})
test('cooldown prevents duplicate checkout', async () => {
  const { createOrder, calls } = setup({ cooldown: true })
  assert.equal((await createOrder([{ product_id: id, size: '42', quantity: 1 }], 'Delivery', 'Pago móvil')).success, false)
  assert.equal(calls.length, 0)
})
test('database validation errors do not create success cookies; internal details are hidden', async () => {
  for (const error of [{ code: 'P0001', message: 'Talla no disponible.' }, { code: 'XX000', message: 'Sensitive internal detail' }]) {
    const { createOrder, cookiesWritten } = setup({ error })
    const result = await createOrder([{ product_id: id, size: '42', quantity: 1 }], 'Delivery', 'Pago móvil')
    assert.equal(result.success, false)
    assert.equal(cookiesWritten.length, 0)
    assert.equal(result.error.includes('Sensitive'), false)
  }
})
