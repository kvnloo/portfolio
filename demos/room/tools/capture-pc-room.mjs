#!/usr/bin/env node
import { createServer } from 'node:http'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const output = process.argv[2] || join(root, 'shots', 'pc-room-v1-evidence')
const base = '/portfolio/demos/room'
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.hdr': 'application/octet-stream' }
mkdirSync(output, { recursive: true })

const server = createServer((req, res) => {
  let url = req.url?.split('?')[0] || '/'
  if (url.startsWith(base)) url = url.slice(base.length) || '/'
  if (url === '/') url = '/index.html'
  try {
    const file = join(dist, url.replace(/^\//, ''))
    const body = readFileSync(file)
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
})

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] || 0
}

async function capture(browser, name, viewport, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport, reducedMotion })
  const page = await context.newPage()
  const errors = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  const url = `http://127.0.0.1:4187${base}/?setup=1`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector('.pc-loading', { state: 'detached', timeout: 15000 })
  await page.waitForTimeout(reducedMotion === 'reduce' ? 300 : 2200)
  await page.screenshot({ path: join(output, `${name}-overview.png`), fullPage: true })
  await page.getByRole('button', { name: 'Inspect tower' }).focus()
  await page.keyboard.press('Enter')
  await page.waitForSelector('.pc-detail')
  await page.waitForTimeout(1000)
  await page.screenshot({ path: join(output, `${name}-inspect.png`), fullPage: true })
  const result = await page.evaluate(() => {
    const metrics = window.__pcRoomMetrics
    const resources = performance.getEntriesByType('resource')
    return {
      metrics,
      transferBytes: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
      encodedBytes: resources.reduce((sum, entry) => sum + (entry.encodedBodySize || 0), 0),
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      detailText: document.querySelector('.pc-detail')?.textContent?.replace(/\s+/g, ' ').trim(),
    }
  })
  const samples = result.metrics?.frameSamplesMs || []
  result.frame = { count: samples.length, p50Ms: percentile(samples, .5), p95Ms: percentile(samples, .95), p99Ms: percentile(samples, .99) }
  delete result.metrics.frameSamplesMs
  result.consoleErrors = errors
  await context.close()
  return result
}

await new Promise((resolve) => server.listen(4187, '127.0.0.1', resolve))
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] })
try {
  const report = {
    schemaVersion: 1,
    acceptanceClaim: false,
    route: `${base}/?setup=1`,
    backend: 'Chromium headless ANGLE SwiftShader',
    desktop: await capture(browser, 'candidate-a-desktop', { width: 1440, height: 1000 }),
    mobile: await capture(browser, 'candidate-a-mobile', { width: 412, height: 915 }),
    reducedMotion: await capture(browser, 'candidate-a-reduced-motion', { width: 1440, height: 1000 }, 'reduce'),
  }
  writeFileSync(join(output, 'runtime-report.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}
