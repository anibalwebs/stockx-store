// E2E: run with TEST_BASE_URL, TEST_ADMIN_EMAIL, TEST_ADMIN_PIN and
// TEST_PRODUCT_SLUG. Set TEST_BROWSER_PATH for a non-default Chromium binary.
// TEST_START_SERVER=1 starts Next locally in the same network namespace.
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { spawn } = require('node:child_process')
async function main() {
  const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100'
  const report = { checks: [], orderCode: null, pageErrors: [] }
  let server, browser
  try {
    if (process.env.TEST_START_SERVER === '1') {
      server = spawn('node', ['node_modules/next/dist/bin/next', 'dev', '--port', '3100', '--hostname', '127.0.0.1'], { env: { ...process.env, NODE_USE_ENV_PROXY: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
      await new Promise((resolve, reject) => { server.stdout.on('data', d => { if (d.toString().includes('Ready')) resolve() }); server.on('exit', c => reject(Error('Next exited: ' + c))) })
    }
    browser = await chromium.launch({ executablePath: process.env.TEST_BROWSER_PATH || undefined, proxy: process.env.TEST_PROXY ? { server: process.env.TEST_PROXY, bypass: '127.0.0.1,localhost' } : undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
    const context = await browser.newContext({ ignoreHTTPSErrors: !!process.env.TEST_PROXY, viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    page.on('pageerror', e => report.pageErrors.push(e.message))
    // Capture the generated WhatsApp URL without opening or sending a message.
    await page.addInitScript(() => { window.open = url => { window.__checkoutURL = url; return null } })
    for (const path of ['/', '/catalogo']) {
      const response = await page.goto(base + path)
      assert.equal(response.status(), 200)
      await page.locator('a[href^="/product/"]').first().waitFor()
    }
    report.checks.push('home and catalog load')
    await page.goto(base + '/product/' + process.env.TEST_PRODUCT_SLUG)
    await page.getByRole('button', { name: 'Agregar al Carrito' }).click()
    await page.getByText('Selecciona una talla para continuar.', { exact: true }).waitFor()
    report.checks.push('size required')
    await page.getByRole('button', { name: '36', exact: true }).click()
    await page.getByRole('button', { name: 'Agregar al Carrito' }).click()
    await page.getByRole('button', { name: 'Quitar', exact: true }).click()
    await page.getByText('Tu carrito está vacío', { exact: true }).waitFor()
    // Close the drawer by clicking its backdrop, then re-add the product.
    await page.locator('div.fixed.inset-0.bg-black\\/50').click({ position: { x: 20, y: 20 } })
    await page.getByRole('button', { name: 'Agregar al Carrito' }).click()
    const cart = page.locator('div.fixed.top-0.right-0')
    await cart.getByRole('button', { name: '+', exact: true }).click()
    await cart.getByRole('button', { name: '-', exact: true }).click()
    await cart.getByRole('button', { name: '+', exact: true }).click()
    assert.equal(await cart.getByRole('button', { name: 'Completa los datos' }).isDisabled(), true)
    report.checks.push('cart remove, quantity updates, required delivery/payment')
    await cart.getByRole('button', { name: 'Selecciona una opción...', exact: true }).first().click()
    await cart.getByRole('button', { name: 'Delivery', exact: true }).click()
    await cart.getByRole('button', { name: 'Selecciona una opción...', exact: true }).click()
    await cart.getByRole('button', { name: 'Pago móvil', exact: true }).click()
    await cart.getByRole('button', { name: 'Pedir por WhatsApp', exact: true }).click()
    await page.waitForFunction(() => !!window.__checkoutURL, { timeout: 30000 })
    const url = await page.evaluate(() => window.__checkoutURL)
    const message = new URL(url).searchParams.get('text')
    report.orderCode = message.match(/PED-[A-Z0-9]+/)[0]
    assert.ok(message.includes('Cantidad: 2'))
    assert.ok(message.includes('Precio unitario: $36.99'))
    assert.ok(message.includes('TOTAL A PAGAR:* $73.98'))
    assert.ok(message.includes('Subtotal:* $89.98'))
    await page.getByText('Tu carrito está vacío', { exact: true }).waitFor({ state: 'attached' })
    report.checks.push('checkout creates order, uses catalog offer and clears cart; WhatsApp captured only')

    await page.goto(base + '/admin/orders')
    await page.waitForURL('**/admin/login')
    report.checks.push('admin redirects unauthenticated visitors')
    await page.getByPlaceholder('tu@correo.com').fill(process.env.TEST_ADMIN_EMAIL)
    await page.getByRole('button', { name: 'Continuar', exact: true }).click()
    await page.keyboard.type(process.env.TEST_ADMIN_PIN, { delay: 150 })
    await page.waitForURL('**/admin/orders')
    await page.getByRole('heading', { name: 'Gestión de Pedidos' }).waitFor()
    await page.getByPlaceholder('Buscar código (Ej: PED-ABCD)').fill(report.orderCode)
    const row = page.getByRole('row').filter({ hasText: report.orderCode })
    await row.waitFor()
    assert.ok((await row.innerText()).includes('Adidas Samba OG'))
    await row.getByRole('button', { name: 'Pendiente', exact: true }).click()
    await row.getByRole('button', { name: 'Confirmado', exact: true }).click()
    await page.getByRole('heading', { name: 'Autorizar Acción' }).waitFor()
    for (const digit of process.env.TEST_ADMIN_PIN) await page.getByRole('button', { name: digit, exact: true }).click()
    await page.getByRole('heading', { name: 'Autorizar Acción' }).waitFor({ state: 'detached' })
    await row.getByRole('button', { name: 'Confirmado', exact: true }).waitFor()
    report.checks.push('admin login, order and line visibility, PIN-protected status update')
    for (const path of ['/admin', '/admin/products', '/admin/categories', '/admin/products/new']) {
      const response = await page.goto(base + path)
      assert.equal(response.status(), 200)
      await page.locator('main').waitFor()
      assert.ok(!(await page.locator('body').innerText()).includes('Application error'))
    }
    report.checks.push('dashboard, products, categories/brands and product creation form load')
    assert.deepEqual(report.pageErrors, [])
    console.log(JSON.stringify(report))
  } finally {
    if (process.env.TEST_REPORT_PATH) fs.writeFileSync(process.env.TEST_REPORT_PATH, JSON.stringify(report, null, 2))
    await browser?.close()
    server?.kill()
  }
}
main().catch(e => { console.error(e.message); process.exitCode = 1 })
