#!/usr/bin/env node
/**
 * Visual capture harness — beauty / placement / chrome product packs.
 *
 * Usage:
 *   node tools/capture.mjs --label pass1
 *   node tools/capture.mjs --label r9 --beauty
 *   node tools/capture.mjs --label r9 --placement
 *   node tools/capture.mjs --label r9 --chrome
 *   node tools/capture.mjs --label r9 --beauty --placement --chrome
 *
 *   shots/<label>/              beauty (or default chrome if no flags)
 *   shots/<label>-placement/    exterior/object library
 *   shots/<label>-chrome/       full UI overlays (no ?beauty=1)
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
const placement = process.argv.includes('--placement')
const chrome = process.argv.includes('--chrome')
const forceBuild = process.argv.includes('--build')
const outDir = join(root, 'shots', label)
const placementDir = join(root, 'shots', `${label}-placement`)
const chromeDir = join(root, 'shots', `${label}-chrome`)

/** Preset names for placement library (must exist on window.__shopSetCamera / CAMERA_PRESETS). */
const PLACEMENT_PRESETS = [
  'exteriorSignFront',
  'exteriorSignThreeQ',
  'exteriorSignLeft',
  'exteriorSignLow',
  'exteriorStreet',
  'sideLeft',
  'sideRight',
  'rear',
  'signpost',
  'counterRamen',
  'counterBoba',
  'lanterns',
  'menuBoard',
  'awningUnderside',
  'roofGlyph',
  'threeQuarter',
  'front',
  'overhead',
]

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

async function resolveChromium() {
  const candidates = [
    join(root, 'node_modules/playwright'),
    '/home/kvn/workspace/zer0/products/cod/node_modules/playwright',
  ]
  for (const c of candidates) {
    try {
      const pw = await import(c + '/index.mjs').catch(() => import(c))
      if (pw.chromium) return pw.chromium
    } catch {
      /* try next */
    }
  }
  try {
    const pw = await import('playwright')
    return pw.chromium
  } catch {
    throw new Error('Install playwright in demos/room or use cod node_modules')
  }
}

/** Launch Chromium with software GL. Fresh browser per pack avoids long-session OOM. */
async function withChromium(fn) {
  const chromium = await resolveChromium()
  // Prefer workspace disk over full /tmp tmpfs (set TMPDIR when invoking capture).
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu=false',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--renderer-process-limit=1',
      '--disable-extensions',
      '--disable-background-networking',
    ],
  })
  try {
    return await fn(browser)
  } finally {
    try {
      await browser.close()
    } catch {
      /* already dead */
    }
  }
}

/** Wait until loading overlay is gone (detached from DOM).
 *  Scene Suspense + drei Environment HDR (githack) can take 30–60s on cold cache. */
async function waitForLoadingGone(page, timeout = 90000) {
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

async function waitForCanvasPainted(page, attempts = 20, delayMs = 1500) {
  for (let i = 0; i < attempts; i++) {
    const dark = await canvasIsBlack(page)
    if (!dark) return true
    await page.waitForTimeout(delayMs)
  }
  return !(await canvasIsBlack(page))
}

/** CameraBridge is outside Suspense — wait for API; overlay is soft (ready may lag under load). */
async function waitForCameraBridge(page, timeout = 120000) {
  try {
    await page.waitForFunction(() => typeof window.__shopSetCamera === 'function', {
      timeout,
    })
    // Soft wait for loading chrome to detach (do not fail capture if still warming)
    await page
      .waitForFunction(() => !document.querySelector('.loading-overlay'), { timeout: 30000 })
      .catch(() => {})
    return true
  } catch {
    console.warn('window.__shopSetCamera not exposed (timeout)')
    return false
  }
}

async function setCamera(page, preset) {
  return page.evaluate((p) => {
    if (typeof window.__shopSetCamera === 'function') {
      return window.__shopSetCamera(p)
    }
    return false
  }, preset)
}

/**
 * @param {import('playwright').Page} page
 * @param {string} path
 * @param {{ mode?: 'auto' | 'canvas' | 'page' }} [opts]
 *   - canvas: WebGL toDataURL only (beauty/placement; needs preserveDrawingBuffer)
 *   - page:   full viewport screenshot (chrome UI pack — canvas readback is black
 *             without preserveDrawingBuffer, and we need DOM overlays)
 *   - auto:   try canvas, reject black/tiny, fall back to page
 */
async function shotPage(page, path, opts = {}) {
  const mode = opts.mode || 'auto'

  if (mode !== 'page') {
    // Prefer WebGL canvas readback — page.screenshot can stall under software GL
    // when preserveDrawingBuffer is on (beauty mode). Fall back if black/unusable.
    try {
      const result = await page.evaluate(() => {
        const c = document.querySelector('canvas')
        if (!c) return { ok: false, reason: 'no-canvas' }
        try {
          // Sample before full encode — black buffer is common without preserveDrawingBuffer
          const probe = document.createElement('canvas')
          probe.width = 64
          probe.height = 36
          const g = probe.getContext('2d')
          if (!g) return { ok: false, reason: 'no-2d' }
          g.drawImage(c, 0, 0, 64, 36)
          const d = g.getImageData(0, 0, 64, 36).data
          let sum = 0
          for (let j = 0; j < d.length; j += 4) sum += d[j] + d[j + 1] + d[j + 2]
          if (sum < 500) return { ok: false, reason: 'black', sum }
          const dataUrl = c.toDataURL('image/png')
          if (!dataUrl || !dataUrl.startsWith('data:image/png') || dataUrl.length < 8000) {
            return { ok: false, reason: 'tiny', len: dataUrl?.length || 0 }
          }
          return { ok: true, dataUrl }
        } catch (e) {
          return { ok: false, reason: String(e) }
        }
      })
      if (result?.ok && result.dataUrl) {
        const b64 = result.dataUrl.slice(result.dataUrl.indexOf(',') + 1)
        writeFileSync(path, Buffer.from(b64, 'base64'))
        return
      }
      if (mode === 'canvas') {
        throw new Error(`canvas shot failed: ${result?.reason || 'unknown'}`)
      }
      if (result?.reason) {
        console.warn(`canvas readback unusable (${result.reason}), using page.screenshot`)
      }
    } catch (e) {
      if (mode === 'canvas') throw e
      console.warn('canvas toDataURL failed, falling back to page.screenshot', e?.message || e)
    }
  }

  // page.screenshot can hang under software GL + host thrash; retry then CDP.
  let lastErr
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.screenshot({ path, fullPage: false, timeout: 60000 })
      return
    } catch (e) {
      lastErr = e
      console.warn(`page.screenshot attempt ${attempt + 1} failed: ${e?.message || e}`)
      await page.waitForTimeout(800)
    }
  }
  try {
    const b64 = await page.evaluate(async () => {
      // Prefer canvas composite when present (may lack overlays); used only as last resort
      // CDP path below is preferred — this is DOM html2canvas-less fallback via paint.
      return null
    })
    if (b64) {
      writeFileSync(path, Buffer.from(b64, 'base64'))
      return
    }
  } catch {
    /* ignore */
  }
  try {
    const client = await page.context().newCDPSession(page)
    const { data } = await client.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
    })
    writeFileSync(path, Buffer.from(data, 'base64'))
    await client.detach().catch(() => {})
    return
  } catch (e) {
    console.warn('CDP captureScreenshot failed', e?.message || e)
  }
  throw lastErr || new Error(`page.screenshot failed for ${path}`)
}

async function capturePresetSeries(page, dir, presets, namePrefix, startIdx = 1) {
  const shots = []
  mkdirSync(dir, { recursive: true })
  let idx = startIdx
  for (const preset of presets) {
    const ok = await setCamera(page, preset)
    if (!ok) {
      console.warn(`Preset "${preset}" unavailable, skipping`)
      continue
    }
    await page.waitForTimeout(600)
    await waitForCanvasPainted(page, 6, 500)
    const name = `${String(idx).padStart(2, '0')}-${namePrefix}-${preset}.png`
    await shotPage(page, join(dir, name))
    shots.push(name)
    idx++
  }
  return shots
}

async function openShop(browser, origin, { needBridge, checkCanvas = true }) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  console.log(`Navigating ${origin}`)
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await waitForLoadingGone(page)
  await page.waitForTimeout(800)
  if (needBridge) await waitForCameraBridge(page, 90000)
  // canvasIsBlack uses 2d drawImage of WebGL — only reliable with preserveDrawingBuffer
  // (?beauty=1). Chrome pack skips this probe; readiness = loading gone + optional bridge.
  if (checkCanvas) {
    const painted = await waitForCanvasPainted(page)
    if (!painted) console.warn('Warning: canvas still looks black after wait')
  } else {
    // Give the compositor a beat so page.screenshot includes the painted frame
    await page.waitForTimeout(2500)
    await page
      .waitForSelector('.menu-item, .stage, canvas', { timeout: 15000 })
      .catch(() => {})
  }
  await page.waitForTimeout(1000)
  return page
}

/** Full product UI (stage chrome + side panel) — never ?beauty=1.
 *  Always page.screenshot: without preserveDrawingBuffer, canvas toDataURL is black,
 *  and chrome pack must include DOM overlays (menu, panel, hotspots). */
async function captureChromePack(page, dir) {
  const shots = []
  mkdirSync(dir, { recursive: true })
  const pageShot = async (p) => {
    try {
      await shotPage(page, p, { mode: 'page' })
      return true
    } catch (e) {
      console.warn(`chrome shot failed ${p}: ${e?.message || e}`)
      return false
    }
  }

  if (await pageShot(join(dir, '01-chrome-hero.png'))) shots.push('01-chrome-hero.png')

  // SPA clicks can trip Playwright's "scheduled navigations" wait (hash/history).
  // Prefer DOM dispatch via page.evaluate — locator.evaluate can hang under load.
  const safeClickSel = async (selector, index = 0) => {
    try {
      const loc = page.locator(selector).nth(index)
      await loc.click({ force: true, noWaitAfter: true, timeout: 8000 })
      return true
    } catch {
      /* fall through */
    }
    try {
      return await page.evaluate(
        ({ selector: sel, index: idx }) => {
          const el = document.querySelectorAll(sel)[idx]
          if (!el) return false
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
          if (typeof el.click === 'function') el.click()
          return true
        },
        { selector, index },
      )
    } catch (e) {
      console.warn(`safeClickSel ${selector}[${index}] failed: ${e?.message || e}`)
      return false
    }
  }

  const menuCount = await page.locator('.menu-item').count().catch(() => 0)
  if (menuCount > 0) {
    await safeClickSel('.menu-item', 0)
    await page.waitForTimeout(600)
    if (await pageShot(join(dir, '02-chrome-menu-selected.png'))) {
      shots.push('02-chrome-menu-selected.png')
    }
  }

  if (menuCount > 1) {
    await safeClickSel('.menu-item', 1)
    await page.waitForTimeout(500)
    if (await pageShot(join(dir, '03-chrome-panel-detail.png'))) {
      shots.push('03-chrome-panel-detail.png')
    }
  }

  // Interaction: try HTML hotspot label if present.
  // Labels often CSS-animate (float/pulse) so Playwright's stability gate never settles.
  const hotspotCount = await page.locator('.hotspot').count().catch(() => 0)
  if (hotspotCount > 0) {
    await safeClickSel('.hotspot', 0)
    await page.waitForTimeout(600)
    if (await pageShot(join(dir, '04-chrome-hotspot.png'))) {
      shots.push('04-chrome-hotspot.png')
    }
  }

  // Narrow viewport — mobile chrome stack
  try {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(500)
    if (await pageShot(join(dir, '05-chrome-mobile.png'))) {
      shots.push('05-chrome-mobile.png')
    }
    await page.setViewportSize({ width: 1440, height: 900 })
  } catch (e) {
    console.warn(`mobile chrome shot failed: ${e?.message || e}`)
  }

  writeFileSync(
    join(dir, 'CATALOG.md'),
    [
      '# Chrome / UI library',
      '',
      `Label parent: \`${label}\``,
      '',
      'Critic: brand cohesion, chrome craft, UX clarity (VISUAL-BAR).',
      '',
      '## Checklist',
      '',
      '- [ ] Chrome feels night-shop menu (not generic SaaS panel)',
      '- [ ] Palette/type matches kiosk warmth',
      '- [ ] Panel supports 3D hero (does not fight neon)',
      '- [ ] Menu select ↔ detail coherent',
      '- [ ] Mobile stack usable',
      '',
      '## Shots',
      '',
      ...shots.map((s) => `- \`${s}\``),
      '',
    ].join('\n'),
  )
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify(
      {
        label: `${label}-chrome`,
        parentLabel: label,
        dimension: 'chrome',
        rubric: 'docs/VISUAL-BAR.md',
        shots,
      },
      null,
      2,
    ),
  )
  console.log(`Chrome library written to ${dir} (${shots.length} images)`)
  return shots
}

async function main() {
  await ensureBuild()
  // Default (no flags) = legacy chrome-in-outDir; explicit packs use their dirs
  const anyPack = beauty || placement || chrome
  const needSceneOut = beauty || !anyPack
  if (needSceneOut) mkdirSync(outDir, { recursive: true })
  if (placement) mkdirSync(placementDir, { recursive: true })
  if (chrome) mkdirSync(chromeDir, { recursive: true })

  const { server, port, base } = await serveDist()
  const beautyOrigin = `http://127.0.0.1:${port}${base}/?beauty=1`
  const chromeOrigin = `http://127.0.0.1:${port}${base}/`

  const shots = []
  let placementShots = []
  let chromeShots = []

  try {
    // Fresh Chromium per pack — long multi-pack sessions OOM under software GL.
    if (needSceneOut) {
      await withChromium(async (browser) => {
        const origin = beauty || anyPack ? beautyOrigin : chromeOrigin
        const page = await openShop(browser, origin, {
          needBridge: beauty || placement,
        })

        const heroName = beauty ? '01-beauty-hero.png' : '01-hero.png'
        await shotPage(page, join(outDir, heroName))
        shots.push(heroName)

        if (beauty) {
          const beautyPresets = ['threeQuarter', 'front', 'counter', 'leftNeon', 'overhead']
          let idx = 2
          for (const preset of beautyPresets) {
            const ok = await setCamera(page, preset)
            if (!ok) {
              console.warn(`Preset "${preset}" unavailable, skipping`)
              continue
            }
            await page.waitForTimeout(600)
            await waitForCanvasPainted(page, 6, 500)
            const name = `${String(idx).padStart(2, '0')}-beauty-${preset}.png`
            await shotPage(page, join(outDir, name))
            shots.push(name)
            idx++
          }
        } else if (!placement && !chrome) {
          // Legacy single-pack UI shots into outDir
          const first = page.locator('.menu-item').first()
          if (await first.count()) {
            try {
              await first.click({ force: true, noWaitAfter: true, timeout: 10000 })
            } catch {
              await first.evaluate((el) =>
                el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
              )
            }
            await page.waitForTimeout(500)
            await shotPage(page, join(outDir, '02-project-panel.png'))
            shots.push('02-project-panel.png')
          }
        }

        writeFileSync(
          join(outDir, 'manifest.json'),
          JSON.stringify(
            {
              label,
              beauty,
              placement,
              chrome,
              origin,
              rubric: 'docs/VISUAL-BAR.md',
              shots,
              note: beauty
                ? 'Beauty: DOM chrome hidden (?beauty=1).'
                : 'Default pack (legacy).',
            },
            null,
            2,
          ),
        )
        console.log(`Shots written to ${outDir} (${shots.length} images, beauty=${beauty})`)
        await page.close()
      })
    }

    if (placement) {
      await withChromium(async (browser) => {
        const page = await openShop(browser, beautyOrigin, { needBridge: true })
        placementShots = await capturePresetSeries(page, placementDir, PLACEMENT_PRESETS, 'place')
        writeFileSync(
          join(placementDir, 'CATALOG.md'),
          [
            '# Placement library',
            '',
            `Label: \`${label}\``,
            '',
            ...placementShots.map((s) => `- \`${s}\``),
            '',
          ].join('\n'),
        )
        writeFileSync(
          join(placementDir, 'manifest.json'),
          JSON.stringify(
            {
              label: `${label}-placement`,
              parentLabel: label,
              dimension: 'placement',
              presets: PLACEMENT_PRESETS,
              shots: placementShots,
            },
            null,
            2,
          ),
        )
        console.log(
          `Placement library written to ${placementDir} (${placementShots.length} images)`,
        )
        await page.close()
      })
    }

    // --- Chrome / UI pack (full overlays) ---
    if (chrome) {
      await withChromium(async (browser) => {
        const chromePage = await openShop(browser, chromeOrigin, {
          needBridge: true,
          checkCanvas: false,
        })
        chromeShots = await captureChromePack(chromePage, chromeDir)
        await chromePage.close()
      })
    }
  } finally {
    server.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
