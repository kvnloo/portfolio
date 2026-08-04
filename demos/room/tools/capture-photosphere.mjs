#!/usr/bin/env node
/**
 * Photosphere / cubemap + multi-frame 4D capture for the room + city square.
 *
 * Primary path (software-GL safe):
 *   1. __shopAimCubeFace per 90° face (OrbitControls detached, post off)
 *   2. CDP canvas screenshot → face PNG
 *   3. In-page bilinear equirect stitch (__shopStitchEquirect)
 * Fallback: window.__shopCapturePhotosphere (in-page toDataURL + same stitch)
 *
 * Usage:
 *   node tools/capture-photosphere.mjs --build --label ramen-hq --size 1024
 *   # Live 4D (Wallpaper Engine style — fixed eye, steam/time, NOT yaw spin):
 *   node tools/capture-photosphere.mjs --label ramen-hq --size 1024 --frames 24 --orbit live --fps 8
 *   # Explicit yaw turntable (discouraged for showcase):
 *   node tools/capture-photosphere.mjs --label ramen-hq --frames 36 --orbit yaw --fps 12
 *   node tools/capture-photosphere.mjs --label ramen-hq --size 1024 --method inpage
 *
 * Output:
 *   shots/<label>-photosphere/
 *     px.png nx.png py.png ny.png pz.png nz.png
 *     equirect.png
 *     faces-cross.png
 *     frames/f000.png …          (when --frames ≥ 2)
 *     equirect.mp4               (live scene video or yaw orbit)
 *     README.md  manifest.json
 */
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  rmdirSync,
  renameSync,
} from 'node:fs'
import { join, dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')

const FACE_NAMES = ['px', 'nx', 'py', 'ny', 'pz', 'nz']
/** Plaza eye in front of kiosk — matches ShopCanvas PHOTOSPHERE_ORIGIN / adapter. */
const DEFAULT_ORIGIN = [0.2, 1.85, 6.0]

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : null
}

function hasFlag(flag) {
  return process.argv.includes(flag)
}

const label = argValue('--label') || 'ramen-hq'
const size = Number(argValue('--size') || 1024)
// Social HQ default dpr≥2 (supersample). Pass --dpr 1 only for draft/SwiftShader thrash.
// Explicit --dpr always wins (including 1).
const dpr = Number(argValue('--dpr') || 2)
const frames = Math.max(1, Number(argValue('--frames') || 1))
// Live 4D (scene animation / steam): low fps wallpaper loop. Yaw orbit: higher ok.
const orbit = (argValue('--orbit') || (frames >= 2 ? 'live' : 'none')).toLowerCase()
// live | yaw | none — live = fixed eye, time between snaps (Wallpaper Engine style)
const defaultFps = orbit === 'live' ? 8 : 24
const fps = Number(argValue('--fps') || defaultFps)
// Real-time settle between live frames so SteamField / lights advance
const settleMs = Number(argValue('--settle-ms') || (orbit === 'live' ? 600 : 0))
// Prefer inpage (toDataURL after aim) — CDP canvas.screenshot can hang on SwiftShader.
// Pass --method cdp to force CDP per-face screenshots.
const method = (argValue('--method') || 'inpage').toLowerCase() // inpage | cdp
const forceBuild = hasFlag('--build')
const rejectMean = Number(argValue('--reject-mean') || 0.03)
const rejectStd = Number(argValue('--reject-std') || 0.01)
const audioPath = argValue('--audio') // optional ambient to mux into equirect.mp4
const eye = (() => {
  const raw = argValue('--origin')
  if (!raw) return [...DEFAULT_ORIGIN]
  const parts = raw.split(',').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`--origin must be x,y,z — got ${raw}`)
  }
  return parts
})()

const outDir = join(root, 'shots', `${label}-photosphere`)
const framesDir = join(outDir, 'frames')

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.hdr': 'application/octet-stream',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

function run(cmd, args, cwd = root) {
  return new Promise((resolveP, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: 'inherit', shell: false })
    p.on('exit', (code) => (code === 0 ? resolveP() : reject(new Error(`${cmd} ${code}`))))
  })
}

async function ensureBuild() {
  if (forceBuild || !existsSync(join(dist, 'index.html'))) {
    console.log('Building…')
    await run('npm', ['run', 'build'])
  }
}

function serveDist(port = 0) {
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
  return new Promise((resolveP, reject) => {
    server.once('error', reject)
    // port 0 → ephemeral free port (avoids EADDRINUSE when 4191 is sticky)
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address()
      const p = typeof addr === 'object' && addr ? addr.port : port
      resolveP({ server, port: p, base })
    })
  })
}

async function resolveChromium() {
  try {
    const pw = await import(join(root, 'node_modules/playwright/index.mjs')).catch(() =>
      import('playwright'),
    )
    return pw.chromium
  } catch {
    const pw = await import('playwright')
    return pw.chromium
  }
}

function dataUrlToBuffer(dataUrl) {
  const b64 = dataUrl.split(',')[1]
  return Buffer.from(b64, 'base64')
}

function magickFx(file, expr) {
  const r = spawnSync(
    'magick',
    [file, '-colorspace', 'Gray', '-format', `%[fx:${expr}]`, 'info:'],
    { encoding: 'utf8' },
  )
  if (r.status !== 0) {
    throw new Error(`magick failed on ${file}: ${(r.stderr || r.stdout || '').trim()}`)
  }
  const n = Number(String(r.stdout).trim())
  if (!Number.isFinite(n)) throw new Error(`magick non-numeric for ${expr}: ${r.stdout}`)
  return n
}

function checkImageStats(file, { minMean, minStd, label: lab, soft = false }) {
  const mean = magickFx(file, 'mean')
  const std = magickFx(file, 'standard_deviation')
  const bytes = statSync(file).size
  console.log(`  stats ${lab || file}: mean=${mean.toFixed(4)} std=${std.toFixed(4)} bytes=${bytes}`)
  if (mean < minMean || std < minStd) {
    const msg = `REJECT ${lab || file}: mean=${mean.toFixed(4)} std=${std.toFixed(4)} (need mean≥${minMean} std≥${minStd})`
    if (soft) {
      console.warn('  soft:', msg)
    } else {
      throw new Error(msg)
    }
  }
  return { mean, std, bytes }
}

async function encode4d(framesPath, outFile, frameFps) {
  const list = readdirSync(framesPath)
    .filter((f) => /\.png$/i.test(f) && !f.startsWith('_'))
    .sort()
  if (list.length < 2) throw new Error(`need ≥2 frames in ${framesPath}`)

  // Showcase living loop: prefer ≥ ~4s. If N/fps is short, slow the encode fps
  // (keep capture fps in manifest; stretch presentation).
  const MIN_SEC = 4.0
  let encodeFps = frameFps
  const natural = list.length / frameFps
  if (natural < MIN_SEC - 0.05) {
    encodeFps = list.length / MIN_SEC
    console.log(
      `  encode stretch: ${list.length} frames @ capture ${frameFps}fps → present ${encodeFps.toFixed(3)}fps (~${MIN_SEC}s)`,
    )
  }

  // Prefer 4dps encode if available
  const fourDps = resolve(root, '../../../zer0/products/4dps/bin/7dps.mjs')
  if (existsSync(fourDps)) {
    console.log('Encoding 4D via 7dps encode-4d…')
    await run('node', [
      fourDps,
      'encode-4d',
      '--frames',
      framesPath,
      '--fps',
      String(encodeFps),
      '--out',
      outFile,
    ])
    return { outFile, encodeFps, frameCount: list.length, durationSec: list.length / encodeFps }
  }

  console.log('Encoding 4D via ffmpeg…')
  const listFile = join(framesPath, '_ffmpeg_list.txt')
  const duration = 1 / encodeFps
  const body =
    list.map((f) => `file '${join(framesPath, f).replace(/'/g, "'\\''")}'\nduration ${duration}`).join('\n') +
    `\nfile '${join(framesPath, list[list.length - 1]).replace(/'/g, "'\\''")}'\n`
  writeFileSync(listFile, body)
  try {
    await run('ffmpeg', [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listFile,
      '-vsync',
      'vfr',
      '-pix_fmt',
      'yuv420p',
      '-c:v',
      'libx264',
      '-crf',
      '18',
      '-movflags',
      '+faststart',
      outFile,
    ])
  } finally {
    try {
      const { unlinkSync } = await import('node:fs')
      unlinkSync(listFile)
    } catch {
      /* ignore */
    }
  }
  return { outFile, encodeFps, frameCount: list.length, durationSec: list.length / encodeFps }
}

async function captureEquirectCdp(page, { size: faceSize, dpr: faceDpr, origin, yaw }) {
  // Aim + CDP screenshot each face (software GL safe — no RT readback)
  const faceBufs = {}
  for (const name of FACE_NAMES) {
    await page.evaluate(
      async ({ face, origin: o, size: sz, dpr: d, yaw: y }) => {
        return window.__shopAimCubeFace({ face, origin: o, size: sz, dpr: d, yaw: y, raw: true })
      },
      { face: name, origin, size: faceSize, dpr: faceDpr, yaw },
    )
    // Extra settle for SwiftShader + scene lights
    await page.waitForTimeout(180)

    const canvas = page.locator('canvas').first()
    const buf = await canvas.screenshot({ type: 'png' })
    // Ensure face is faceSize² (viewport may be larger; canvas was set to size×size CSS)
    // Resize via magick if needed after write — first write temp then normalize
    faceBufs[name] = buf
    console.log(`  face ${name} cdp ${buf.length} B`)
  }

  // Restore camera / post after last face
  await page.evaluate(async () => {
    if (typeof window.__shopAimCubeFace === 'function') {
      await window.__shopAimCubeFace({ face: 'nz', raw: false })
    }
  })

  return faceBufs
}

async function captureEquirectInpage(page, { size: faceSize, dpr: faceDpr, origin, yaw, destDir = null, keepCapture = false }) {
  // Per-face from Node (one evaluate per face) so SwiftShader progress is visible and
  // a hung face fails with a clear label instead of a silent 5min all-or-nothing evaluate.
  // Equirect stitch stays in Node (browser stitch too slow at 1024²).
  // When destDir set, write each face PNG immediately (survives late stitch timeouts).
  // keepCapture: stay in raw capture mode between live-4D frames (continuous R3F clock + steam).
  const faceBufs = {}
  const stats = {}
  if (destDir) mkdirSync(destDir, { recursive: true })
  for (const name of FACE_NAMES) {
    let accepted = false
    let lastErr = null
    for (let faceAttempt = 1; faceAttempt <= 4 && !accepted; faceAttempt++) {
      console.log(`    aim+snap ${name}${faceAttempt > 1 ? ` retry ${faceAttempt}` : ''}…`)
      try {
        const dataUrl = await page.evaluate(
          async ({ face, sz, d, origin: o, yaw: y }) => {
            await window.__shopAimCubeFace({ face, origin: o, size: sz, dpr: d, yaw: y, raw: true })
            // Extra rAFs: steam boost (prio1) + SwiftShader front buffer settle
            await new Promise((r) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => requestAnimationFrame(r)),
              ),
            )
            const canvas = document.querySelector('canvas')
            if (!canvas) throw new Error('no canvas')
            const faceCanvas = document.createElement('canvas')
            faceCanvas.width = sz
            faceCanvas.height = sz
            const fctx = faceCanvas.getContext('2d')
            const sw = canvas.width
            const sh = canvas.height
            if (!sw || !sh) throw new Error(`canvas buffer ${sw}x${sh}`)
            const side = Math.min(sw, sh)
            const sx = (sw - side) / 2
            const sy = (sh - side) / 2
            fctx.imageSmoothingEnabled = true
            fctx.imageSmoothingQuality = 'high'
            fctx.clearRect(0, 0, sz, sz)
            fctx.drawImage(canvas, sx, sy, side, side, 0, 0, sz, sz)
            return faceCanvas.toDataURL('image/png')
          },
          { face: name, sz: faceSize, d: faceDpr, origin, yaw },
        )
        if (!dataUrl || !String(dataUrl).startsWith('data:image')) {
          throw new Error(`inpage face ${name}: bad dataUrl`)
        }
        const buf = dataUrlToBuffer(dataUrl)
        // Write temp and gate per-face so we retry only the bad face (not whole sphere)
        const tmpPath = destDir
          ? join(destDir, `${name}.png`)
          : join(outDir, `_tmp_${name}.png`)
        if (destDir) mkdirSync(destDir, { recursive: true })
        normalizeFacePng(buf, faceSize, tmpPath)
        let minStd = Math.max(rejectStd, 0.03)
        let minMean = rejectMean
        if (name === 'py') {
          minStd = 0
          minMean = 0.01
        } else if (name === 'ny') {
          minStd = Math.max(rejectStd, 0.015)
        } else if (name === 'nz') {
          minStd = Math.max(rejectStd, 0.04) // kiosk — structure required
        } else if (name === 'px' || name === 'nx' || name === 'pz') {
          minStd = Math.max(rejectStd, 0.028) // plaza sides can be softer night
        }
        const st = checkImageStats(tmpPath, {
          minMean,
          minStd,
          label: name,
          soft: false,
        })
        faceBufs[name] = buf
        stats[name] = st
        console.log(`    face ${name} inpage ${buf.length} B`)
        if (destDir) console.log(`    wrote ${tmpPath}`)
        accepted = true
      } catch (e) {
        lastErr = e
        console.warn(`    face ${name} attempt ${faceAttempt} failed:`, e?.message || e)
        await page.waitForTimeout(250 + faceAttempt * 150)
      }
    }
    if (!accepted) throw lastErr || new Error(`face ${name} failed after retries`)
  }
  // Only fully exit capture when NOT mid live-4D series (keepCapture).
  // Exiting every sphere re-inits GL and was a major source of nz/starfield flakiness.
  if (!keepCapture) {
    await page.evaluate(async () => {
      if (typeof window.__shopAimCubeFace === 'function') {
        await window.__shopAimCubeFace({ face: 'nz', raw: false })
      }
    })
  }
  return { faceBufs, equirectBuf: null, origin, stats }
}

function normalizeFacePng(buf, faceSize, outPath) {
  // Atomic write: concurrent/competing runs + mkdir races caused ENOENT mid-frame.
  const dir = dirname(outPath)
  mkdirSync(dir, { recursive: true })
  const tmp = `${outPath}.${process.pid}.${Date.now()}.tmp`
  writeFileSync(tmp, buf)
  try {
    const id = spawnSync('magick', [tmp, '-format', '%wx%h', 'info:'], { encoding: 'utf8' })
    if (id.status === 0 && id.stdout.trim() === `${faceSize}x${faceSize}`) {
      // ok size
    } else {
      const r = spawnSync(
        'magick',
        [tmp, '-resize', `${faceSize}x${faceSize}!`, '-quality', '100', tmp],
        { encoding: 'utf8' },
      )
      if (r.status !== 0) {
        console.warn('magick resize skipped:', (r.stderr || '').trim())
      }
    }
  } catch {
    /* keep tmp as-is */
  }
  renameSync(tmp, outPath)
}

async function stitchNode(outDirLocal, faceSize) {
  const { stitchFacesDir } = await import(join(__dirname, 'stitch-equirect.mjs'))
  const eqPath = join(outDirLocal, 'equirect.png')
  stitchFacesDir(outDirLocal, eqPath, faceSize)
  return readFileSync(eqPath)
}

async function writeCross(outDirLocal, faceSize) {
  try {
    const cross = join(outDirLocal, 'faces-cross.png')
    // ImageMagick 7: prefer `magick` (not `magick convert`)
    await run('magick', [
      '-size',
      `${faceSize * 4}x${faceSize * 3}`,
      'xc:black',
      join(outDirLocal, 'py.png'),
      '-geometry',
      `+${faceSize}+0`,
      '-composite',
      join(outDirLocal, 'nx.png'),
      '-geometry',
      `+0+${faceSize}`,
      '-composite',
      join(outDirLocal, 'pz.png'),
      '-geometry',
      `+${faceSize}+${faceSize}`,
      '-composite',
      join(outDirLocal, 'px.png'),
      '-geometry',
      `+${faceSize * 2}+${faceSize}`,
      '-composite',
      join(outDirLocal, 'nz.png'),
      '-geometry',
      `+${faceSize * 3}+${faceSize}`,
      '-composite',
      join(outDirLocal, 'ny.png'),
      '-geometry',
      `+${faceSize}+${faceSize * 2}`,
      '-composite',
      cross,
    ])
    console.log('  wrote faces-cross.png')
  } catch (e) {
    console.warn('cross montage skipped:', e.message || e)
  }
}

async function captureOneSphere(page, { size: faceSize, dpr: faceDpr, origin, yaw, destDir, writeFaces, keepCapture = false }) {
  mkdirSync(destDir, { recursive: true })
  const maxAttempts = 3
  let lastErr = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let faceBufs
    let equirectBuf = null
    let usedOrigin = origin
    let stats = null
    try {
      if (method === 'inpage') {
        console.log(
          `  inpage capture size=${faceSize} dpr=${faceDpr} yaw=${yaw.toFixed(3)} attempt=${attempt}/${maxAttempts} keepCapture=${keepCapture}`,
        )
        const r = await captureEquirectInpage(page, {
          size: faceSize,
          dpr: faceDpr,
          origin,
          yaw,
          destDir,
          keepCapture,
        })
        faceBufs = r.faceBufs
        equirectBuf = r.equirectBuf
        usedOrigin = r.origin || origin
        stats = r.stats
      } else {
        console.log(`  cdp capture size=${faceSize} dpr=${faceDpr} yaw=${yaw.toFixed(3)} attempt=${attempt}`)
        try {
          faceBufs = await captureEquirectCdp(page, { size: faceSize, dpr: faceDpr, origin, yaw })
        } catch (e) {
          console.warn('CDP face capture failed, falling back to inpage:', e.message || e)
          const r = await captureEquirectInpage(page, {
            size: faceSize,
            dpr: faceDpr,
            origin,
            yaw,
            destDir,
            keepCapture,
          })
          faceBufs = r.faceBufs
          equirectBuf = r.equirectBuf
          usedOrigin = r.origin || origin
          stats = r.stats
        }
      }

      mkdirSync(destDir, { recursive: true })
      for (const name of FACE_NAMES) {
        if (!faceBufs[name]) throw new Error(`missing face buffer ${name}`)
        const f = join(destDir, `${name}.png`)
        if (!existsSync(f)) normalizeFacePng(faceBufs[name], faceSize, f)
      }
      void writeFaces
      void equirectBuf
      for (const name of FACE_NAMES) {
        const f = join(destDir, `${name}.png`)
        if (!existsSync(f)) throw new Error(`face missing after capture: ${f}`)
      }
      return { origin: usedOrigin, stats: stats || {}, eqPath: join(destDir, 'equirect.png'), facesReady: true }
    } catch (e) {
      lastErr = e
      console.warn(`  capture attempt ${attempt} failed:`, e?.message || e)
      // Cool-down; only full exit if not keeping capture for live series
      if (!keepCapture) {
        await page.evaluate(async () => {
          if (typeof window.__shopAimCubeFace === 'function') {
            await window.__shopAimCubeFace({ face: 'nz', raw: false })
          }
        }).catch(() => {})
      }
      await page.waitForTimeout(800)
    }
  }
  throw lastErr || new Error('captureOneSphere failed')
}

async function main() {
  if (size < 1024) {
    console.warn(`WARNING: face size ${size} < social bar 1024 — continuing anyway`)
  }
  if (dpr < 2 && !hasFlag('--dpr')) {
    console.warn(`WARNING: dpr ${dpr} < social bar 2 — unexpected default`)
  } else if (dpr < 2) {
    console.warn(`NOTE: explicit --dpr ${dpr} (draft path); social HQ expects dpr≥2`)
  }
  mkdirSync(outDir, { recursive: true })
  await ensureBuild()
  const { server, port, base } = await serveDist()
  const originUrl = `http://127.0.0.1:${port}${base}/?beauty=1&capture=1&dpr=${dpr}`
  const chromium = await resolveChromium()
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
  })

  try {
    const page = await browser.newPage({
      // Square viewport ≥ face size so canvas can fill
      viewport: { width: Math.max(size, 1024), height: Math.max(size, 1024) },
      deviceScaleFactor: 1,
    })
    // Face snaps + CPU equirect stitch on software GL need a long budget
    page.setDefaultTimeout(300000)
    page.setDefaultNavigationTimeout(120000)
    console.log('Loading', originUrl)
    await page.goto(originUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await page.waitForSelector('.loading-overlay', { state: 'detached', timeout: 90000 }).catch(() => {})
    await page
      .waitForFunction(
        () =>
          typeof window.__shopCapturePhotosphere === 'function' &&
          typeof window.__shopAimCubeFace === 'function',
        { timeout: 90000 },
      )
      .catch(() => {
        throw new Error(
          'Photosphere APIs not exposed — rebuild with CameraBridge photosphere + aim APIs',
        )
      })
    // settle scene (HDR + plaza)
    await page.waitForTimeout(4000)

    // Probe real WEBGL_RENDERER (J) — not a static CHROMIUM_PATH string
    let webglRenderer = null
    try {
      webglRenderer = await page.evaluate(() => {
        try {
          const c = document.createElement('canvas')
          const gl =
            c.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
            c.getContext('webgl', { failIfMajorPerformanceCaveat: false })
          if (!gl) return null
          const dbg = gl.getExtension('WEBGL_debug_renderer_info')
          if (dbg) {
            return String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
          }
          return String(gl.getParameter(gl.RENDERER) || '')
        } catch {
          return null
        }
      })
    } catch {
      webglRenderer = null
    }
    const rendererLabel =
      webglRenderer && String(webglRenderer).trim()
        ? String(webglRenderer).trim()
        : process.env.CHROMIUM_PATH
          ? `playwright+${process.env.CHROMIUM_PATH}`
          : 'playwright-chromium+swiftshader-angle'
    console.log('  WEBGL_RENDERER:', rendererLabel)
    globalThis.__hqRendererProbe = rendererLabel

    console.log(
      `Capturing photosphere label=${label} size=${size} dpr=${dpr} method=${method} frames=${frames} origin=${JSON.stringify(eye)}`,
    )

    // Keep the browser OPEN for all face snaps so live frames can advance R3F time.
    // Stitch is Node-side after browser close (RAM). Previous bug: closed browser after
    // frame 0, so multi-frame live used a dead page → still / broken 4D packs.
    const frameFaceDirs = []

    // Frame 0 / still at yaw 0
    const still = await captureOneSphere(page, {
      size,
      dpr,
      origin: eye,
      yaw: 0,
      destDir: outDir,
      writeFaces: true,
      keepCapture: frames >= 2,
    })
    frameFaceDirs.push({ i: 0, dir: outDir })
    console.log('  frame 1/' + frames + ' faces on disk (still)')

    // Multi-frame 4D: capture remaining faces while scene clock runs
    //   orbit=live: FIXED eye — steam/lights advance (Wallpaper Engine living sphere)
    //   orbit=yaw: turntable (not default showcase)
    if (frames >= 2) {
      const modeLabel =
        orbit === 'yaw' ? 'yaw-orbit' : 'live (fixed-eye, scene time)'
      console.log(
        `4D: capturing ${frames} frames · orbit=${modeLabel} · settle=${settleMs}ms · encode@${fps}fps`,
      )
      for (let i = 1; i < frames; i++) {
        const yaw = orbit === 'yaw' ? (i / frames) * Math.PI * 2 : 0
        if (settleMs > 0) {
          await page.evaluate(async (ms) => {
            const t0 = performance.now()
            while (performance.now() - t0 < ms) {
              await new Promise((r) => requestAnimationFrame(r))
            }
          }, settleMs)
        }
        const tmpDir = join(outDir, `_f_${String(i).padStart(3, '0')}`)
        mkdirSync(tmpDir, { recursive: true })
        await captureOneSphere(page, {
          size,
          dpr,
          origin: eye,
          yaw,
          destDir: tmpDir,
          writeFaces: false,
          keepCapture: true,
        })
        frameFaceDirs.push({ i, dir: tmpDir })
        const extra =
          orbit === 'yaw'
            ? ` yaw=${((yaw * 180) / Math.PI).toFixed(1)}°`
            : ' eye-fixed'
        console.log(`  frame ${i + 1}/${frames} faces${extra}`)
      }
    }

    // Single exitCapture after all live frames so scene time + steam stay continuous
    await page.evaluate(async () => {
      if (typeof window.__shopAimCubeFace === 'function') {
        await window.__shopAimCubeFace({ face: 'nz', raw: false })
      }
    }).catch(() => {})
    console.log('  all faces captured — releasing browser before stitch')
    await browser.close().catch(() => {})

    console.log('  stitching equirect (frame 0)…')
    await stitchNode(outDir, size)
    checkImageStats(join(outDir, 'equirect.png'), {
      minMean: rejectMean,
      minStd: Math.max(rejectStd, 0.05),
      label: 'equirect',
    })
    console.log('  wrote equirect.png + faces')
    await writeCross(outDir, size)

    if (frames >= 2) {
      mkdirSync(framesDir, { recursive: true })
      copyFileSync(join(outDir, 'equirect.png'), join(framesDir, 'f000.png'))
      for (const { i, dir } of frameFaceDirs) {
        if (i === 0) continue
        console.log(`  stitching frame ${i + 1}/${frames}…`)
        await stitchNode(dir, size)
        const dest = join(framesDir, `f${String(i).padStart(3, '0')}.png`)
        copyFileSync(join(dir, 'equirect.png'), dest)
        for (const name of FACE_NAMES) {
          try {
            unlinkSync(join(dir, `${name}.png`))
          } catch {
            /* ignore */
          }
        }
        try {
          unlinkSync(join(dir, 'equirect.png'))
          rmdirSync(dir)
        } catch {
          /* ignore */
        }
      }

      const mp4 = join(outDir, 'equirect.mp4')
      const enc = await encode4d(framesDir, mp4, fps)
      let audioPresent = false
      let audioSrcUsed = null
      // Optional ambient bed (night market / rain / etc.)
      const audioSrc =
        audioPath && existsSync(audioPath)
          ? audioPath
          : existsSync(join(root, 'public/audio/night-market.mp3'))
            ? join(root, 'public/audio/night-market.mp3')
            : existsSync(join(outDir, 'ambient.mp3'))
              ? join(outDir, 'ambient.mp3')
              : null
      if (audioSrc) {
        const muxed = join(outDir, 'equirect-audio.mp4')
        try {
          await run('ffmpeg', [
            '-y',
            '-i',
            mp4,
            '-stream_loop',
            '-1',
            '-i',
            audioSrc,
            '-shortest',
            '-c:v',
            'copy',
            '-c:a',
            'aac',
            '-b:a',
            '160k',
            '-movflags',
            '+faststart',
            muxed,
          ])
          copyFileSync(muxed, mp4)
          try {
            unlinkSync(muxed)
          } catch {
            /* ignore */
          }
          audioPresent = true
          audioSrcUsed = audioSrc
          console.log('  muxed ambient audio ←', audioSrc)
        } catch (e) {
          console.warn('  audio mux failed:', e?.message || e)
        }
      }
      // Probe real duration for manifest (J)
      let durationSec = enc?.durationSec ?? frames / fps
      try {
        const pr = spawnSync(
          'ffprobe',
          ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', mp4],
          { encoding: 'utf8' },
        )
        if (pr.status === 0 && pr.stdout.trim()) {
          const d = Number(pr.stdout.trim())
          if (Number.isFinite(d) && d > 0) durationSec = d
        }
      } catch {
        /* ignore */
      }
      // Reject-black gate on stitched multi-frames (not only f000)
      for (const f of readdirSync(framesDir).filter((x) => /^f\d+\.png$/i.test(x)).sort()) {
        checkImageStats(join(framesDir, f), {
          minMean: rejectMean,
          minStd: Math.max(rejectStd, 0.05),
          label: `frame ${f}`,
          soft: false,
        })
      }
      // Persist encode meta for manifest
      globalThis.__hq4dMeta = {
        durationSec,
        audioPresent,
        audioSrc: audioSrcUsed,
        encodeFps: enc?.encodeFps ?? fps,
      }
      console.log(
        `  wrote equirect.mp4 duration=${durationSec.toFixed(3)}s audio=${audioPresent} encodeFps=${enc?.encodeFps ?? fps}`,
      )
    }

    writeFileSync(
      join(outDir, 'README.md'),
      [
        '# Photosphere pack (HQ)',
        '',
        `Eye origin: \`${JSON.stringify(still.origin)}\` (plaza in front of kiosk).`,
        `Face size: ${size}² · Equirect: ${size * 2}×${size} · dpr: ${dpr} · method: ${method}`,
        frames >= 2
          ? `4D: ${frames} frames @ ${fps} fps · orbit=${orbit}${settleMs ? ` · settle ${settleMs}ms` : ''} · equirect ${size * 2}×${size}`
          : '4D: single still only',
        frames >= 2 && orbit === 'live'
          ? 'Motion: fixed-eye LIVE scene time (steam/lights) — not a yaw turntable.'
          : frames >= 2 && orbit === 'yaw'
            ? 'Motion: yaw turntable (discouraged for showcase living 4D).'
            : '',
        '',
        '## Files',
        '',
        '- `px/nx/py/ny/pz/nz.png` — cube faces (WebGL Y-up / no OrbitControls parallax)',
        '- `equirect.png` — full 360×180 spherical panorama (PSV defaultYaw 180° → kiosk / −Z)',
        '- `faces-cross.png` — cube net for designers',
        frames >= 2 ? '- `frames/f###.png` + `equirect.mp4` — multi-frame 4D' : '',
        '',
        '## Notes',
        '',
        '- Capture detaches OrbitControls (no minDistance/polar clamps on faces).',
        '- EffectComposer (vignette/bloom) off during face snaps.',
        '- Bilinear equirect stitch; reject-black gated before save.',
        '',
        `Generated: ${new Date().toISOString()}`,
        '',
      ]
        .filter(Boolean)
        .join('\n'),
    )
    const meta4d = globalThis.__hq4dMeta || {}
    writeFileSync(
      join(outDir, 'manifest.json'),
      JSON.stringify(
        {
          kind: 'photosphere',
          label,
          size,
          dpr,
          method,
          origin: still.origin,
          faces: FACE_NAMES,
          equirect: 'equirect.png',
          frames: frames >= 2 ? frames : 1,
          fps: frames >= 2 ? fps : null,
          encodeFps: frames >= 2 ? meta4d.encodeFps ?? fps : null,
          orbit: frames >= 2 ? orbit : 'none',
          settleMs: frames >= 2 ? settleMs : 0,
          equirectMp4: frames >= 2 ? 'equirect.mp4' : null,
          durationSec: frames >= 2 ? meta4d.durationSec ?? null : null,
          audioPresent: frames >= 2 ? Boolean(meta4d.audioPresent) : false,
          audioSrc: frames >= 2 ? meta4d.audioSrc ?? null : null,
          renderer: globalThis.__hqRendererProbe || process.env.CHROMIUM_PATH || 'playwright-chromium+swiftshader-angle',
          captureUrlQuery: `beauty=1&capture=1&dpr=${dpr}`,
          rejectBlackMean: rejectMean,
          rejectBlackStd: rejectStd,
          stats: still.stats,
          quality: dpr >= 2 && size >= 1024 ? 'social' : 'draft',
        },
        null,
        2,
      ),
    )
    console.log(`Photosphere ready: ${outDir}`)
  } finally {
    await browser.close().catch(() => {})
    server.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
