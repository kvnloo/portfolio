#!/usr/bin/env node
/**
 * Visual capture harness (cod-style loop).
 * Builds the room demo if needed, serves dist, screenshots hero + project opens.
 *
 * Usage:
 *   node tools/capture.mjs --label pass1
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')
const label = process.argv.includes('--label')
  ? process.argv[process.argv.indexOf('--label') + 1]
  : `run-${Date.now()}`
const outDir = join(root, 'shots', label)

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

function run(cmd, args, cwd = root) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: 'inherit', shell: false })
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
  })
}

async function ensureBuild() {
  if (!existsSync(join(dist, 'index.html'))) {
    console.log('Building…')
    await run('npm', ['run', 'build'])
  }
}

function serveDist(port = 4177) {
  const base = '/portfolio/demos/room'
  const server = createServer((req, res) => {
    let url = req.url?.split('?')[0] || '/'
    if (url.startsWith(base)) url = url.slice(base.length) || '/'
    if (url === '/') url = '/index.html'
    const file = join(dist, url.replace(/^\//, ''))
    try {
      const body = readFileSync(file)
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end('not found')
    }
  })
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve({ server, port, base }))
  })
}

async function withChromium(fn) {
  const candidates = [
    join(root, 'node_modules/playwright'),
    '/home/kvn/workspace/zer0/products/cod/node_modules/playwright',
  ]
  let chromium
  for (const c of candidates) {
    try {
      const pw = await import(c + '/index.mjs').catch(() => import(c))
      chromium = pw.chromium
      if (chromium) break
    } catch {
      /* try next */
    }
  }
  if (!chromium) {
    // fallback: system chromium headless screenshot via CLI is limited; try dynamic import path
    try {
      const pw = await import('playwright')
      chromium = pw.chromium
    } catch {
      throw new Error('Install playwright in demos/room or use cod node_modules')
    }
  }
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-gpu=false'],
  })
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}

async function main() {
  await ensureBuild()
  mkdirSync(outDir, { recursive: true })
  const { server, port, base } = await serveDist()
  const origin = `http://127.0.0.1:${port}${base}/`

  try {
    await withChromium(async (browser) => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      // load not networkidle — Environment HDR / fonts keep network busy
      await page.goto(origin, { waitUntil: 'load', timeout: 60000 })
      // Wait for loading overlay to clear (first WebGL frame ready)
      await page.waitForSelector('.loading-overlay', { state: 'detached', timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(2500)
      // Ensure canvas has painted non-black pixels (retry)
      for (let i = 0; i < 5; i++) {
        const dark = await page.evaluate(() => {
          const c = document.querySelector('canvas')
          if (!c) return true
          const ctx = document.createElement('canvas')
          ctx.width = 64
          ctx.height = 36
          const g = ctx.getContext('2d')
          g.drawImage(c, 0, 0, 64, 36)
          const d = g.getImageData(0, 0, 64, 36).data
          let sum = 0
          for (let j = 0; j < d.length; j += 4) sum += d[j] + d[j + 1] + d[j + 2]
          return sum < 500
        })
        if (!dark) break
        await page.waitForTimeout(1200)
      }
      await page.screenshot({ path: join(outDir, '01-hero.png'), fullPage: false })

      // open first hotspot / menu item
      const first = page.locator('.menu-item').first()
      if (await first.count()) {
        await first.click()
        await page.waitForTimeout(500)
        await page.screenshot({ path: join(outDir, '02-project-panel.png'), fullPage: false })
      }

      // click a hotspot if present
      const hotspot = page.locator('.hotspot').nth(1)
      if (await hotspot.count()) {
        await hotspot.click()
        await page.waitForTimeout(500)
        await page.screenshot({ path: join(outDir, '03-hotspot.png'), fullPage: false })
      }

      writeFileSync(
        join(outDir, 'manifest.json'),
        JSON.stringify(
          {
            label,
            origin,
            rubric: 'docs/VISUAL-BAR.md',
            shots: ['01-hero.png', '02-project-panel.png', '03-hotspot.png'],
            note: 'Critic must score against VISUAL-BAR.md; regenerate Imagine assets if < 8 avg.',
          },
          null,
          2,
        ),
      )
      console.log(`Shots written to ${outDir}`)
    })
  } finally {
    server.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
