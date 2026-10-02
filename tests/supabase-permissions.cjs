// Live API verification using a disposable, authenticated admin test account.
// Requires NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, TEST_ADMIN_EMAIL/PIN.
const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('node:crypto')
const assert = require('node:assert/strict')
const fs = require('node:fs')
async function main() {
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const pending = process.env.TEST_PENDING_LOCKDOWN === '1'
  const report = { checks: [], orderCode: null, directAccessLockdownPending: pending }
  const productId = randomUUID(), categoryId = randomUUID(), brandId = randomUUID(), imageId = randomUUID()
  const file = 'e2e/' + productId + '.png'
  function ok(result) { if (result.error) throw Error(result.error.message); return result.data }
  try {
    ok(await admin.auth.signInWithPassword({ email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_ADMIN_PIN }))
    for (const table of ['products', 'product_variants', 'product_images', 'categories', 'brands']) {
      ok(await anon.from(table).select('*').limit(1))
    }
    if (!pending) {
    for (const table of ['orders', 'order_items']) {
      assert.ok((await anon.from(table).select('*').limit(1)).error)
    }
    assert.ok((await anon.from('orders').insert({ short_id: 'FORGED-' + productId, total_amount: 1, status: 'Confirmado' })).error)
    assert.ok((await anon.from('order_items').insert({ title: 'FORGED', size: '42', quantity: 1, price: 1 })).error)
    assert.ok((await anon.from('orders').update({ status: 'Confirmado' }).eq('id', productId)).error)
    report.checks.push('anonymous direct order reads, inserts and updates denied')
    }
    report.checks.push('anonymous catalog reads allowed')
    ok(await admin.from('categories').insert({ id: categoryId, name: 'E2E test', slug: 'e2e-' + categoryId }))
    ok(await admin.from('brands').insert({ id: brandId, name: 'E2E test', slug: 'e2e-' + brandId }))
    ok(await admin.from('products').insert({ id: productId, title: 'E2E test product', slug: 'e2e-' + productId, base_price: 100, sale_price: 80, is_active: true, category_id: categoryId, brand_id: brandId }))
    ok(await admin.from('products').update({ description: 'Temporary permission test' }).eq('id', productId))
    ok(await admin.from('product_variants').insert({ product_id: productId, size: '42', is_available: true }))
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jYAAAAABJRU5ErkJggg==', 'base64')
    ok(await admin.storage.from('product_images').upload(file, png, { contentType: 'image/png' }))
    ok(await admin.storage.from('product_images').upload(file, png, { contentType: 'image/png', upsert: true }))
    const url = admin.storage.from('product_images').getPublicUrl(file).data.publicUrl
    ok(await admin.from('product_images').insert({ id: imageId, product_id: productId, image_url: url, is_primary: true }))
    ok(await admin.from('product_images').update({ is_primary: false }).eq('id', imageId))
    ok(await admin.from('categories').update({ name: 'E2E updated' }).eq('id', categoryId))
    ok(await admin.from('brands').update({ name: 'E2E updated' }).eq('id', brandId))
    report.checks.push('authenticated catalog CRUD and image upload/replacement allowed')
    const order = ok(await anon.rpc('create_store_order', { cart_items: [{ product_id: productId, size: '42', quantity: 2, price: 1, title: 'Forged' }], delivery_method: 'Delivery', payment_method: 'Pago móvil' }))
    report.orderCode = order.shortId
    assert.equal(order.total, 160)
    const stored = ok(await admin.from('orders').select('*,order_items(*)').eq('short_id', order.shortId).single())
    assert.equal(stored.total_amount, 160)
    assert.equal(stored.order_items[0].price, 80)
    assert.equal(stored.order_items[0].title, 'E2E test product')
    ok(await admin.from('orders').update({ status: 'Confirmado' }).eq('id', stored.id))
    const updated = ok(await admin.from('orders').select('status').eq('id', stored.id).single())
    assert.equal(updated.status, 'Confirmado')
    if (!pending) {
    assert.ok((await admin.from('orders').update({ total_amount: 1 }).eq('id', stored.id)).error)
    assert.ok((await admin.from('orders').update({ status: 'Invalid' }).eq('id', stored.id)).error)
    assert.ok((await admin.from('orders').insert({ short_id: 'FORGED-' + productId, total_amount: 1, status: 'Pendiente' })).error)
    report.checks.push('forged totals/status and direct admin order inserts denied')
    }
    report.checks.push('guest RPC creates catalog-priced order; admin reads lines and changes status')
    const removed = ok(await admin.storage.from('product_images').remove([file]))
    assert.equal(removed.length, 1)
    ok(await admin.from('product_images').delete().eq('id', imageId))
    ok(await admin.from('product_variants').update({ is_available: false }).eq('product_id', productId))
    assert.ok((await anon.rpc('create_store_order', { cart_items: [{ product_id: productId, size: '42', quantity: 1 }], delivery_method: 'Delivery', payment_method: 'Pago móvil' })).error)
    report.checks.push('image deletion allowed; unavailable size checkout denied')
    console.log(JSON.stringify(report))
  } finally {
    await admin.storage.from('product_images').remove([file])
    await admin.from('product_images').delete().eq('product_id', productId)
    await admin.from('product_variants').delete().eq('product_id', productId)
    await admin.from('products').delete().eq('id', productId)
    await admin.from('categories').delete().eq('id', categoryId)
    await admin.from('brands').delete().eq('id', brandId)
    await admin.auth.signOut()
    if (process.env.TEST_REPORT_PATH) fs.writeFileSync(process.env.TEST_REPORT_PATH, JSON.stringify(report, null, 2))
  }
}
main().catch(e => { console.error(e.message); process.exitCode = 1 })
