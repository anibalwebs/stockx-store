const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
async function main() {
  let server, browser
  try {
    const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100'
    if (process.env.TEST_START_SERVER === '1') {
      server = spawn('node', ['node_modules/next/dist/bin/next', 'start', '--port', '3100', '--hostname', '127.0.0.1'], { env: { ...process.env, NODE_USE_ENV_PROXY: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
      await new Promise((resolve, reject) => { server.stdout.on('data', d => { if (d.toString().includes('Ready')) resolve() }); server.on('exit', c => reject(Error('Next exited: ' + c))) })
    }
    browser = await chromium.launch({ executablePath: process.env.TEST_BROWSER_PATH || undefined, proxy: process.env.TEST_PROXY ? { server: process.env.TEST_PROXY, bypass: '127.0.0.1,localhost' } : undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
    const context = await browser.newContext({ ignoreHTTPSErrors: !!process.env.TEST_PROXY, viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    const errors = []
    let productQueries = 0
    page.on('pageerror', e => errors.push(e.message))
    page.on('request', r => { if (r.url().includes('/rest/v1/products')) productQueries++ })
    const cards = page.locator('a[href^="/product/"]')
    await page.goto(base + '/catalogo')
    await cards.first().waitFor()
    await page.waitForTimeout(600)
    assert.equal(productQueries, 0, 'no duplicate browser query on first catalog render')
    assert.equal(await page.locator('div.fixed.top-0.right-0').count(), 0, 'cart deferred until first use')
    const search = page.getByPlaceholder('Buscar sneakers, ropa, marcas...')
    await search.fill('Samba')
    await page.waitForFunction(() => {
      const cards = [...document.querySelectorAll('a[href^="/product/"]')]
      return cards.length === 1 && cards[0].textContent.includes('Samba')
    })
    await search.fill('Nike')
    await page.waitForFunction(() => {
      const cards = [...document.querySelectorAll('a[href^="/product/"]')]
      return cards.length > 0 && cards.every(c => c.textContent.includes('Nike'))
    })
    await search.fill('nothing-matches-e2e')
    await page.getByText('No hay productos que coincidan con tus filtros actuales.', { exact: false }).waitFor()
    await page.getByRole('button', { name: 'Limpiar todo', exact: true }).first().click()
    await cards.first().waitFor()
    assert.ok(await cards.count() > 1)
    await page.getByPlaceholder('Max', { exact: true }).fill('30')
    await page.waitForResponse(r => r.url().includes('base_price=lte.30') && r.status() === 200)
    await page.waitForTimeout(200)
    assert.ok(await cards.count() > 0)
    await page.getByPlaceholder('Max', { exact: true }).fill('')
    await page.waitForResponse(r => r.url().includes('/rest/v1/products') && !r.url().includes('base_price=lte') && r.status() === 200)
    await page.goto(base + '/catalogo?categoria=Zapatos&genero=Dama')
    await page.getByText('No hay productos que coincidan con tus filtros actuales.', { exact: false }).waitFor()
    await page.goto(base + '/catalogo?categoria=Zapatos&genero=Caballero')
    await cards.first().waitFor()
    for (const card of await cards.all()) assert.ok((await card.textContent()).includes('Caballero'))
    await page.getByRole('button', { name: 'Buscar productos', exact: true }).click()
    await page.waitForURL('**/catalogo?focus=search')
    await search.waitFor()
    assert.equal(await search.evaluate(el => document.activeElement === el), true)
    assert.deepEqual(errors, [])
    console.log(JSON.stringify({ checks: ['SSR catalog without duplicate browser fetch', 'deferred cart', 'search, empty results and clear filters', 'price filter and reset', 'category name and gender URL filters', 'search navigation and focus'], pageErrors: errors }))
  } finally { await browser?.close(); server?.kill() }
}
main().catch(e => { console.error(e); process.exitCode = 1 })
