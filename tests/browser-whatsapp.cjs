// Mobile emulation verifies the shop's handoff, not the native iOS/Android app.
// External WhatsApp navigation is captured; no message is sent.
const { chromium, devices } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { spawn } = require('node:child_process')
async function main() {
  const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100'
  const report = { checks: [], orderCodes: [], pageErrors: [] }
  let browser, server
  try {
    if (process.env.TEST_START_SERVER === '1') {
      server = spawn('node', ['node_modules/next/dist/bin/next', 'dev', '--port', '3100', '--hostname', '127.0.0.1'], { env: { ...process.env, NODE_USE_ENV_PROXY: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
      await new Promise((resolve, reject) => { server.stdout.on('data', d => { if (d.toString().includes('Ready')) resolve() }); server.on('exit', c => reject(Error('Next exited: ' + c))) })
    }
    browser = await chromium.launch({ executablePath: process.env.TEST_BROWSER_PATH || undefined, proxy: process.env.TEST_PROXY ? { server: process.env.TEST_PROXY, bypass: '127.0.0.1,localhost' } : undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
    for (const device of ['iPhone 13', 'Pixel 7', 'desktop']) {
      const mobile = device !== 'desktop'
      const context = await browser.newContext({ ...(mobile ? devices[device] : { viewport: { width: 1440, height: 1000 } }), ignoreHTTPSErrors: !!process.env.TEST_PROXY })
      await context.route('https://wa.me/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>WhatsApp navigation captured</h1>' }))
      const page = await context.newPage()
      page.on('pageerror', error => report.pageErrors.push(error.message))
      const errors = []
      page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(response.status() + ' ' + response.url()) })
      const productUrl = base + '/product/adidas-samba-og-1790301253570'
      assert.equal((await page.goto(productUrl)).status(), 200)
      await page.getByRole('button', { name: '36', exact: true }).click()
      await page.getByRole('button', { name: 'Agregar al Carrito' }).click()
      const cart = page.locator('div.fixed.top-0.right-0')
      async function selectOptions() {
        await cart.getByRole('button', { name: 'Selecciona una opción...', exact: true }).first().click()
        await cart.getByRole('button', { name: 'Delivery', exact: true }).click()
        await cart.getByRole('button', { name: 'Selecciona una opción...', exact: true }).click()
        await cart.getByRole('button', { name: 'Pago móvil', exact: true }).click()
      }
      await selectOptions()
      const automaticPopup = mobile ? null : context.waitForEvent('page')
      await cart.getByRole('button', { name: 'Pedir por WhatsApp', exact: true }).click()
      const link = cart.getByRole('link', { name: 'Abrir WhatsApp', exact: true })
      await link.waitFor({ timeout: 45000 })
      const url = new URL(await link.getAttribute('href'))
      assert.equal(url.origin, 'https://wa.me')
      assert.equal(url.pathname, '/584244601480')
      const message = url.searchParams.get('text')
      report.orderCodes.push(message.match(/PED-[A-Z0-9]+/)[0])
      assert.ok(message.includes('TOTAL A PAGAR:* $36.99'))
      assert.ok(message.includes('👟 *Adidas Samba OG*'))
      await cart.getByText('Tu carrito está vacío', { exact: true }).waitFor()
      assert.equal(page.url(), productUrl)
      if (mobile) {
        assert.equal(context.pages().length, 1, 'no automatic mobile navigation')
        for (let attempt = 0; attempt < 2; attempt++) {
          const popupPromise = context.waitForEvent('page')
          await link.click()
          const popup = await popupPromise
          await popup.waitForLoadState()
          assert.equal(popup.url(), url.href)
          await popup.close()
        }
      } else {
        const popup = await automaticPopup
        await popup.waitForLoadState()
        assert.equal(popup.url(), url.href)
        await popup.close()
      }
      assert.deepEqual(errors, [])
      report.checks.push(device + ': confirmed order, correct message, empty cart, retained store, WhatsApp handoff and no HTTP errors')
      if (mobile) {
        // A second order during cooldown fails; its cart must remain intact.
        await page.goto(productUrl)
        await page.getByRole('button', { name: '36', exact: true }).click()
        await page.getByRole('button', { name: 'Agregar al Carrito' }).click()
        await selectOptions()
        await cart.getByRole('button', { name: 'Pedir por WhatsApp', exact: true }).click()
        await page.getByText(/espera un minuto/i).waitFor()
        assert.equal(await cart.getByRole('button', { name: 'Quitar', exact: true }).count(), 1)
        assert.equal(await cart.getByRole('link', { name: 'Abrir WhatsApp', exact: true }).count(), 0)
        report.checks.push(device + ': failed checkout retains cart and does not open WhatsApp')
      }
      await context.close()
    }
    assert.deepEqual(report.pageErrors, [])
    console.log(JSON.stringify(report))
  } finally {
    if (process.env.TEST_REPORT_PATH) fs.writeFileSync(process.env.TEST_REPORT_PATH, JSON.stringify(report, null, 2))
    await browser?.close()
    server?.kill()
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
