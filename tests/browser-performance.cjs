// Repeatable production-build measurement; results depend on network and host load.
const { chromium, devices } = require('playwright')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
async function main() {
  const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100'
  const results = []
  let server, browser
  try {
    if (process.env.TEST_START_SERVER === '1') {
      server = spawn('node', ['node_modules/next/dist/bin/next', 'start', '--port', '3100', '--hostname', '127.0.0.1'], { env: { ...process.env, NODE_USE_ENV_PROXY: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
      await new Promise((resolve, reject) => { server.stdout.on('data', d => { if (d.toString().includes('Ready')) resolve() }); server.on('exit', c => reject(Error('Next exited: ' + c))) })
    }
    browser = await chromium.launch({ executablePath: process.env.TEST_BROWSER_PATH || undefined, proxy: process.env.TEST_PROXY ? { server: process.env.TEST_PROXY, bypass: '127.0.0.1,localhost' } : undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
    for (const path of ['/', '/catalogo', '/product/adidas-samba-og-1790301253570']) {
      for (let run = 0; run < 3; run++) {
        const context = await browser.newContext({ ...devices['iPhone 13'], ignoreHTTPSErrors: !!process.env.TEST_PROXY })
        await context.route('**/*', route => route.request().headers()['next-router-prefetch'] ? route.abort() : route.continue())
        const page = await context.newPage()
        const requests = []
        const scripts = []
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        page.on('request', request => requests.push(request.url()))
        page.on('response', response => { if (response.request().resourceType() === 'script') scripts.push(response.body().then(b => b.length).catch(() => 0)) })
        const started = performance.now()
        const response = await page.goto(base + path, { waitUntil: 'domcontentloaded' })
        if (response.status() !== 200) throw Error(path + ': ' + response.status())
        if (path.startsWith('/product/')) await page.getByRole('button', { name: 'Agregar al Carrito' }).waitFor()
        else await page.locator('a[href^="/product/"]').first().waitFor()
        const readyMs = Math.round(performance.now() - started)
        await page.waitForTimeout(700)
        const nav = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { ttfbMs: Math.round(n.responseStart), domMs: Math.round(n.domContentLoadedEventEnd) } })
        results.push({ path, run, ...nav, readyMs, decodedScriptBytes: (await Promise.all(scripts)).reduce((a,b) => a+b, 0), scriptRequests: scripts.length, exchangeRateRequests: requests.filter(x => x.includes('dolarapi')).length, catalogBrowserQueries: requests.filter(x => x.includes('/rest/v1/products')).length, errors })
        await context.close()
      }
    }
    console.log(JSON.stringify(results))
  } finally {
    if (process.env.TEST_REPORT_PATH) fs.writeFileSync(process.env.TEST_REPORT_PATH, JSON.stringify(results, null, 2))
    await browser?.close()
    server?.kill()
  }
}
main().catch(e => { console.error(e); process.exitCode = 1 })
