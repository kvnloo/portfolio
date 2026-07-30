#!/usr/bin/env node
/**
 * Visual capture harness (cod-style loop).
 * Builds the room demo if needed, serves dist, screenshots hero + project opens.
 *
 * Usage:
 *   node tools/capture.mjs --label pass1
 *   node tools/capture.mjs --label beauty-v1 --beauty
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : null
}

const label = argValue('--label') || `run-${Date.now()}`
const beauty = process.argv.includes('--beauty')
const forceBuild = process.argv.includes('--build')
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
  if (forceBuild || !existsSync(join(dist, 'index.html'))) {
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
    args: ['--no-sandbox', '--disable-gpu=false', '--use-gl=angle', '--enable-webgl'],
  })
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}

/** Wait until loading overlay is gone (detached from DOM). */
async function waitForLoadingGone(page, timeout = 25000) {
  await page.waitForSelector('.loading-overlay', { state: 'detached', timeout }).catch(() => {})
}

/** Sample canvas pixels; true if still essentially black. */
async function canvasIsBlack(page) {
  return page.evaluate(() => {
    const c = document.querySelector('canvas')
    if (!c) return true
    const ctx = document.createElement('canvas')
    ctx.width = 64
    ctx.height = 36
    const g = ctx.getContext('2d')
    if (!g) return true
    try {
      g.drawImage(c, 0, 0, 64, 36)
    } catch {
      return true
    }
    const d = g.getImageData(0, 0, 64, 36).data
    let sum = 0
    for (let j = 0; j < d.length; j += 4) sum += d[j] + d[j + 1] + d[j + 2]
    return sum < 500
  })
}

async function waitForCanvasPainted(page, attempts = 8, delayMs = 1200) {
  for (let i = 0; i < attempts; i++) {
    const dark = await canvasIsBlack(page)
    if (!dark) return true
    await page.waitForTimeout(delayMs)
  }
  return !(await canvasIsBlack(page))
}

async function setCamera(page, preset) {
  return page.evaluate((p) => {
    if (typeof window.__shopSetCamera === 'function') {
      return window.__shopSetCamera(p)
    }
    return false
  }, preset)
}

async function main() {
  await ensureBuild()
  mkdirSync(outDir, { recursive: true })
  const { server, port, base } = await serveDist()
  const qs = beauty ? '?beauty=1' : ''
  const origin = `http://127.0.0.1:${port}${base}/${qs}`

  const shots = []

  try {
    await withChromium(async (browser) => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      console.log(`Navigating ${origin}`)
      await page.goto(origin, { waitUntil: 'load', timeout: 60000 })

      // 1) loading overlay must detach
      await waitForLoadingGone(page)
      await page.waitForTimeout(800)

      // 2) canvas must not be black
      const painted = await waitForCanvasPainted(page)
      if (!painted) console.warn('Warning: canvas still looks black after wait')

      // Wait for camera bridge API when beauty multi-angle
      if (beauty) {
        await page
          .waitForFunction(() => typeof window.__shopSetCamera === 'function', { timeout: 10000 })
          .catch(() => console.warn('window.__shopSetCamera not exposed'))
      }

      // --- hero ---
      const heroName = beauty ? '01-beauty-hero.png' : '01-hero.png'
      await page.screenshot({ path: join(outDir, heroName), fullPage: false })
      shots.push(heroName)

      if (beauty) {
        // Multi-angle pure 3D shots via __shopSetCamera
        const presets = ['threeQuarter', 'front', 'counter', 'leftNeon', 'overhead']
        let idx = 2
        for (const preset of presets) {
          const ok = await setCamera(page, preset)
          if (!ok) {
            console.warn(`Preset "${preset}" unavailable, skipping`)
            continue
          }
          await page.waitForTimeout(450)
          // settle damping + one more paint check
          await waitForCanvasPainted(page, 3, 400)
          const name = `${String(idx).padStart(2, '0')}-beauty-${preset}.png`
          await page.screenshot({ path: join(outDir, name), fullPage: false })
          shots.push(name)
          idx++
        }
      } else {
        // --- panel / UI chrome shots ---
        const first = page.locator('.menu-item').first()
        if (await first.count()) {
          await first.click()
          await page.waitForTimeout(500)
          await page.screenshot({ path: join(outDir, '02-project-panel.png'), fullPage: false })
          shots.push('02-project-panel.png')
        }

        const hotspot = page.locator('.hotspot').nth(1)
        if (await hotspot.count()) {
          await hotspot.click()
          await page.waitForTimeout(500)
          await page.screenshot({ path: join(outDir, '03-hotspot.png'), fullPage: false })
          shots.push('03-hotspot.png')
        }
      }

      writeFileSync(
        join(outDir, 'manifest.json'),
        JSON.stringify(
          {
            label,
            beauty,
            origin,
            rubric: 'docs/VISUAL-BAR.md',
            shots,
            note: beauty
              ? 'Beauty mode: DOM chrome hidden (?beauty=1). Multi-angle via window.__shopSetCamera.'
              : 'Critic must score against VISUAL-BAR.md; regenerate Imagine assets if < 8 avg.',
          },
          null,
          2,
        ),
      )
      console.log(`Shots written to ${outDir} (${shots.length} images, beauty=${beauty})`)
    })
  } finally {
    server.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
