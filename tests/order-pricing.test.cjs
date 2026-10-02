const { test } = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const vm = require('node:vm')
const id = '11111111-1111-1111-1111-111111111111'
function setup({ available = true, active = true, sale = 80 } = {}) {
  const writes = []
  const products = [{ id, title: 'Zapatos reales', base_price: 100, sale_price: sale, is_active: active, product_variants: [{ size: '42', is_available: available }] }]
  const db = { from(table) { return {
    select() { return { in: async () => ({ data: products }) } },
    insert(rows) { writes.push({ table, rows }); return table === 'orders' ? { select: () => ({ single: async () => ({ data: { id: 'order-id' } }) }) } : Promise.resolve({ error: null }) }
  } } }
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync('src/actions/orders.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(code, { module, exports: module.exports, console, require(name) {
    if (name === '@/lib/supabase/server') return { createClient: async () => db }
    if (name === 'next/headers') return { cookies: async () => ({ get: () => undefined, set() {} }) }
    throw Error(name)
  } })
  return { createOrder: module.exports.createOrder, writes }
}
test('ignores forged prices, titles and totals; applies catalog offer', async () => {
  const { createOrder, writes } = setup()
  const result = await createOrder([{ product_id: id, size: '42', quantity: 2, price: 1, title: 'Falso' }], 'Entrega', 'Pago')
  assert.equal(result.success, true)
  assert.equal(result.total, 160)
  assert.equal(result.subtotal, 200)
  assert.equal(writes[0].rows[0].total_amount, 160)
  assert.equal(writes[1].rows[0].price, 80)
  assert.equal(writes[1].rows[0].title, 'Zapatos reales')
})
test('uses base price without an offer', async () => {
  const { createOrder } = setup({ sale: null })
  assert.equal((await createOrder([{ product_id: id, size: '42', quantity: 1 }], 'Entrega', 'Pago')).total, 100)
})
test('rejects unavailable sizes, inactive products, unknown IDs and invalid quantities without writing', async () => {
  for (const scenario of [
    { options: { available: false } }, { options: { active: false } },
    { item: { size: '99' } }, { item: { product_id: '22222222-2222-2222-2222-222222222222' } },
    ...[0, -1, 1.5, '2', 101].map(quantity => ({ item: { quantity } }))
  ]) {
    const { createOrder, writes } = setup(scenario.options)
    const result = await createOrder([{ product_id: id, size: '42', quantity: 1, ...scenario.item }], 'Entrega', 'Pago')
    assert.equal(result.success, false)
    assert.equal(writes.length, 0)
  }
  const { createOrder, writes } = setup()
  assert.equal((await createOrder([], 'Entrega', 'Pago')).success, false)
  assert.equal(writes.length, 0)
})
