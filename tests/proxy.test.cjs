const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const { NextRequest } = require('next/server')
const { unstable_doesMiddlewareMatch } = require('next/experimental/testing/server')
function setup(user) {
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync('src/proxy.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(code, { module, exports: module.exports, process, URL, require(name) {
    if (name === '@supabase/ssr') return { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user } }) } }) }
    return require(name)
  } })
  return module.exports
}
test('all admin routes retain session verification; public pages bypass proxy', () => {
  const { config } = setup(null)
  for (const path of ['/admin', '/admin/login', '/admin/orders', '/admin/products', '/admin/products/new', '/admin/products/123/edit', '/admin/categories']) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: path }), true, path)
  }
  for (const path of ['/', '/catalogo', '/product/test', '/_next/image', '/logo.png']) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: path }), false, path)
  }
})
test('unauthenticated admin visits redirect; authenticated responses remain private', async () => {
  const guest = setup(null)
  for (const path of ['/admin', '/admin/orders', '/admin/products/123/edit', '/admin/categories']) {
    const response = await guest.proxy(new NextRequest('https://store.example' + path))
    assert.equal(response.headers.get('location'), 'https://store.example/admin/login')
  }
  assert.equal((await guest.proxy(new NextRequest('https://store.example/admin/login'))).status, 200)
  const response = await setup({ id: 'test-user' }).proxy(new NextRequest('https://store.example/admin/orders'))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
})
