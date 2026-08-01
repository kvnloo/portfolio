#!/usr/bin/env node
/**
 * Behance / designer showcase pack — 8K stills + full-res grid preview.png
 *
 * Shot plan (S-tier product case study):
 *  UI-forward (show product craft + interaction design)
 *  01  Desktop hero — full chrome + 3D shop (primary portfolio frame)
 *  02  Menu + detail panel — information architecture / selection state
 *  03  Mobile product — responsive stack
 *  04  Interaction — hotspot + panel sync
 *
 *  Craft / atmosphere (prove the 3D is real, not a flat mock)
 *  05  Beauty hero — cinematic three-quarter pure 3D
 *  06  Brand neon — exterior marquee readable
 *  07  Counter craft — food / materials close
 *  08  Atmosphere — front elevation night market
 *
 * Usage:
 *   node tools/capture-behance.mjs
 *   node tools/capture-behance.mjs --width 1920 --height 1080 --dpr 2   # default: true 4K via supersample
 *   node tools/capture-behance.mjs --width 2560 --height 1440 --dpr 2   # heavier
 *
 * Quality: R3F ?capture=1&dpr=N supersamples the WebGL buffer (not Lanczos upscale of 1×).
 * That was why older preview.png looked jagged/soft vs the browser.
 *
 * Output: demos/room/shots/preview/
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import {
  readFileSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  readdirSync,
} from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')
const outDir = join(root, 'shots', 'preview')

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : null
}

// Logical CSS viewport. WebGL supersamples via ?dpr= (default 2) so stills match
// browser sharpness — NOT Lanczos upscale of a 1× jagged frame (that was the soft/jaggy look).
const WIDTH = Number(argValue('--width') || process.env.BEHANCE_W || 1920)
const HEIGHT = Number(argValue('--height') || process.env.BEHANCE_H || 1080)
// Supersample factor for R3F canvas + (for chrome) deviceScaleFactor. 2 → 1080p CSS = 4K buffer.
const CAPTURE_DPR = Number(argValue('--dpr') || process.env.BEHANCE_DPR || 2)
// Optional extra resize AFTER true supersample (default 1 = no fake upscale).
const UPSCALE = Number(argValue('--upscale') || 1)
const forceBuild = process.argv.includes('--build')
const OUT_W = Math.round(WIDTH * CAPTURE_DPR)
const OUT_H = Math.round(HEIGHT * CAPTURE_DPR)

/** Ordered Behance storyboard — filenames sort in narrative order */
const SHOTS = [
  {
    id: '01-desktop-hero-ui',
    title: 'Desktop product hero',
    mode: 'chrome',
    role: 'Primary Behance cover / case-study open: full UI + 3D together',
  },
  {
    id: '02-menu-panel-detail',
    title: 'Menu + project panel',
    mode: 'chrome',
    selectMenu: 1,
    role: 'IA / selection state — menu list + detail ticket',
  },
  {
    id: '03-mobile-product',
    title: 'Mobile stack',
    mode: 'chrome',
    mobile: true,
    role: 'Responsive product UI',
  },
  {
    id: '04-hotspot-interaction',
    title: 'Hotspot interaction',
    mode: 'chrome',
    clickHotspot: true,
    role: '3D ↔ panel interaction moment',
  },
  {
    id: '05-beauty-cinematic',
    title: 'Cinematic pure 3D',
    mode: 'beauty',
    preset: 'threeQuarter',
    role: 'Craft credibility without chrome',
  },
  {
    id: '06-brand-neon-exterior',
    title: 'Brand neon exterior',
    mode: 'beauty',
    preset: 'exteriorSignFront',
    role: 'Identity / marquee readability',
  },
  {
    id: '07-counter-craft',
    title: 'Counter materials',
    mode: 'beauty',
    preset: 'counter',
    role: 'Food / prop material craft close',
  },
  {
    id: '08-front-atmosphere',
    title: 'Front night market',
    mode: 'beauty',
    preset: 'front',
    role: 'Atmosphere elevation for case-study close',
  },
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
  '.hdr': 'application/octet-stream',
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

function serveDist(port = 4188) {
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
      /* next */
    }
  }
  const pw = await import('playwright')
  return pw.chromium
}

async function waitForLoadingGone(page, timeout = 90000) {
  await page.waitForSelector('.loading-overlay', { state: 'detached', timeout }).catch(() => {})
}

async function waitForCameraBridge(page, timeout = 90000) {
  await page
    .waitForFunction(() => typeof window.__shopSetCamera === 'function', { timeout })
    .catch(() => console.warn('__shopSetCamera timeout'))
}

async function waitPainted(page, attempts = 24, delayMs = 800) {
  for (let i = 0; i < attempts; i++) {
    const dark = await page.evaluate(() => {
      const c = document.querySelector('canvas')
      if (!c) return true
      const ctx = document.createElement('canvas')
      ctx.width = 48
      ctx.height = 27
      const g = ctx.getContext('2d')
      if (!g) return true
      try {
        g.drawImage(c, 0, 0, 48, 27)
      } catch {
        return true
      }
      const d = g.getImageData(0, 0, 48, 27).data
      let sum = 0
      for (let j = 0; j < d.length; j += 4) sum += d[j] + d[j + 1] + d[j + 2]
      return sum < 400
    })
    if (!dark) return true
    await page.waitForTimeout(delayMs)
  }
  return false
}

async function setCamera(page, preset) {
  return page.evaluate((p) => {
    if (typeof window.__shopSetCamera === 'function') return window.__shopSetCamera(p)
    return false
  }, preset)
}

async function cdpScreenshot(page, file) {
  const client = await page.context().newCDPSession(page)
  const { data } = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  writeFileSync(file, Buffer.from(data, 'base64'))
  await client.detach().catch(() => {})
}

/** Full WebGL backing store (CSS × dpr) — true supersample, not composited CSS size. */
async function canvasDataUrlShot(page, file) {
  const dataUrl = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    if (!c) throw new Error('no canvas')
    // Force one present so preserveDrawingBuffer has a frame
    return c.toDataURL('image/png')
  })
  writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'))
}

async function frameStats(file) {
  return new Promise((resolve) => {
    const p = spawn(
      'magick',
      [file, '-resize', '64x36!', '-format', '%[fx:mean] %[fx:standard_deviation]', 'info:'],
      { cwd: root },
    )
    let out = ''
    p.stdout.on('data', (d) => {
      out += d
    })
    p.on('exit', () => {
      const [meanS, stdS] = out.trim().split(/\s+/)
      resolve({ mean: Number(meanS) || 0, std: Number(stdS) || 0 })
    })
    p.on('error', () => resolve({ mean: 1, std: 1 }))
  })
}

async function isEmptyFrame(file) {
  const { mean, std } = await frameStats(file)
  // Night scenes can be dark (mean ~0.15) but still have structure (std > 0.04).
  // True empty/black: mean < 0.02 or (mean < 0.05 && std < 0.02)
  return mean < 0.02 || (mean < 0.05 && std < 0.02)
}

async function captureShot(browser, originBase, shot, size) {
  const isBeauty = shot.mode === 'beauty'
  const qs = new URLSearchParams()
  qs.set('capture', '1')
  qs.set('dpr', String(CAPTURE_DPR))
  if (isBeauty) qs.set('beauty', '1')
  const origin = `${originBase}?${qs.toString()}`

  // Logical CSS viewport; backing store = × CAPTURE_DPR via R3F dpr + deviceScaleFactor
  const vp = shot.mobile ? { width: 1080, height: 1920 } : { width: size.w, height: size.h }

  const page = await browser.newPage({
    viewport: vp,
    // deviceScaleFactor multiplies CDP/page screenshots (DOM + composited canvas).
    // Pair with R3F dpr so UI chrome and 3D both land at OUT resolution.
    deviceScaleFactor: CAPTURE_DPR,
  })

  const outW = vp.width * CAPTURE_DPR
  const outH = vp.height * CAPTURE_DPR
  console.log(
    `→ ${shot.id}  CSS ${vp.width}×${vp.height} @dpr=${CAPTURE_DPR} → ~${outW}×${outH}  ${shot.role}`,
  )
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await waitForLoadingGone(page, 60000)
  await waitForCameraBridge(page, 45000)
  await waitPainted(page)
  await page.waitForTimeout(1200)

  if (shot.preset) {
    const ok = await setCamera(page, shot.preset)
    if (!ok) console.warn(`  preset ${shot.preset} missing — using default camera`)
    await page.waitForTimeout(800)
    await waitPainted(page, 10, 400)
  }

  if (typeof shot.selectMenu === 'number') {
    try {
      await page.locator('.menu-item').nth(shot.selectMenu).click({ timeout: 8000 })
      await page.waitForTimeout(600)
    } catch {
      console.warn('  menu click skipped')
    }
  }

  if (shot.clickHotspot) {
    try {
      const hs = page.locator('.hotspot').first()
      if (await hs.count()) await hs.click({ timeout: 5000 })
      else await page.locator('.menu-item').nth(2).click({ timeout: 5000 })
      await page.waitForTimeout(600)
    } catch {
      console.warn('  hotspot click skipped')
    }
  }

  await page.waitForTimeout(500)
  const file = join(outDir, `${shot.id}.png`)

  // Beauty: export WebGL backing store (true supersample). Chrome: CDP so DOM overlays included.
  const tryCapture = async () => {
    if (isBeauty) {
      try {
        await canvasDataUrlShot(page, file)
      } catch (err) {
        console.warn(`  canvas dataURL failed (${err.message}); CDP…`)
        await cdpScreenshot(page, file)
      }
    } else {
      try {
        await cdpScreenshot(page, file)
      } catch (err) {
        console.warn(`  CDP screenshot failed (${err.message}); canvas dataURL…`)
        await canvasDataUrlShot(page, file)
      }
    }
  }

  await tryCapture()
  if (await isEmptyFrame(file)) {
    console.warn(`  empty/black frame on ${shot.id} — wait + retry`)
    await page.waitForTimeout(2000)
    await waitPainted(page, 12, 500)
    await tryCapture()
    if (await isEmptyFrame(file)) {
      console.error(`  STILL empty: ${shot.id} — leaving file for inspection`)
    }
  }

  // Optional post resize only if explicitly requested (not a quality substitute for dpr)
  if (UPSCALE > 1) {
    const tmp = join(outDir, `${shot.id}.tmp.png`)
    await run('magick', [file, '-filter', 'Lanczos', '-resize', `${UPSCALE * 100}%`, tmp])
    await run('mv', [tmp, file])
  }

  const st = await frameStats(file)
  console.log(`  ok mean=${st.mean.toFixed(3)} std=${st.std.toFixed(3)}`)

  await page.close()
  return file
}

function writeReadme(files, size) {
  const body = [
    '# Behance / designer preview pack',
    '',
    `CSS viewport: **${WIDTH}×${HEIGHT}** @ **dpr=${CAPTURE_DPR}** → stills **~${size.w}×${size.h}** (mobile ~${1080 * CAPTURE_DPR}×${1920 * CAPTURE_DPR}).`,
    '',
    'Capture uses real WebGL supersampling (`?capture=1&dpr=2`), not Lanczos upscale of a 1× frame.',
    '',
    '## Shot list (narrative order)',
    '',
    ...SHOTS.map(
      (s, i) =>
        `${i + 1}. **\`${s.id}.png\`** — ${s.title}  \n   ${s.role}`,
    ),
    '',
    '## Grid',
    '',
    '- `preview.png` — full native-resolution tile of all stills (4×2; mobile fitted/letterboxed in landscape cells).',
    '',
    '## Behance layout tips',
    '',
    '1. Open with **01-desktop-hero-ui** (full product).',
    '2. UI deep-dive: **02** menu/panel, **03** mobile, **04** interaction.',
    '3. Craft proof: **05–08** pure 3D / brand / materials / atmosphere.',
    '4. Pair with short captions: problem → 3D shop concept → interaction → craft.',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
  ].join('\n')
  writeFileSync(join(outDir, 'README.md'), body)
  writeFileSync(
    join(outDir, 'manifest.json'),
    JSON.stringify(
      {
        kind: 'behance-preview',
        cssWidth: WIDTH,
        cssHeight: HEIGHT,
        dpr: CAPTURE_DPR,
        width: size.w,
        height: size.h,
        shots: SHOTS,
        files,
        grid: 'preview.png',
      },
      null,
      2,
    ),
  )
}

async function montageGrid(files) {
  // Cells = native supersampled still size (not the low CSS viewport).
  const cellW = OUT_W
  const cellH = OUT_H
  const gap = 48
  const out = join(outDir, 'preview.png')
  console.log(`Montage ${files.length} stills → ${out} (cells ${cellW}×${cellH})`)

  await run('magick', [
    'montage',
    ...files,
    '-tile',
    '4x2',
    '-geometry',
    `${cellW}x${cellH}+${gap}+${gap}`,
    '-background',
    '#050308',
    '-gravity',
    'center',
    out,
  ])
  console.log('Wrote', out)
  return out
}

async function main() {
  mkdirSync(outDir, { recursive: true })
  await ensureBuild()
  const { server, port, base } = await serveDist()
  const originBase = `http://127.0.0.1:${port}${base}/`
  const chromium = await resolveChromium()

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
      // allow large textures / viewports
      '--max-texture-size=16384',
      `--window-size=${WIDTH},${HEIGHT}`,
    ],
  })

  const files = []
  try {
    for (const shot of SHOTS) {
      try {
        const f = await captureShot(browser, originBase, shot, { w: WIDTH, h: HEIGHT })
        files.push(f)
      } catch (err) {
        console.error(`FAILED ${shot.id}:`, err.message || err)
      }
    }
  } finally {
    await browser.close().catch(() => {})
    server.close()
  }

  if (!files.length) {
    console.error('No shots captured')
    process.exit(1)
  }

  writeReadme(files.map((f) => f.split('/').pop()), { w: OUT_W, h: OUT_H })
  await montageGrid(files)

  // List sizes
  for (const f of readdirSync(outDir).filter((n) => n.endsWith('.png'))) {
    const p = join(outDir, f)
    const st = readFileSync(p)
    console.log(`  ${f}  ${(st.length / 1024 / 1024).toFixed(1)} MB`)
  }
  console.log(`\nBehance pack ready: ${outDir}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
