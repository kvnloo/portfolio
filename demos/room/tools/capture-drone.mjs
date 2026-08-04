#!/usr/bin/env node
/**
 * Drone-style perspective flythrough capture for ramen room.
 *
 * Samples 7dps drone-path keyframes via window.__shopSetCamera, screenshots
 * canvas frames, writes shots/<label>-drone/{path.json,frames/,manifest.json}.
 *
 * Usage:
 *   node tools/capture-drone.mjs --build --label ramen-hq --kind orbit --frames 24
 *   node tools/capture-drone.mjs --path shots/ramen-hq-drone/path.json --label ramen-hq
 *
 * Encode (from 4dps package):
 *   7dps encode-drone --frames $PORTFOLIO_ROOM/shots/ramen-hq-drone/frames \
 *     --out $PORTFOLIO_ROOM/shots/ramen-hq-drone/drone.mp4 --fps 12
 */
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { join, dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')
const require = createRequire(import.meta.url)

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : null
}
function hasFlag(flag) {
  return process.argv.includes(flag)
}

const label = argValue('--label') || 'ramen-hq'
const kind = argValue('--kind') || 'orbit'
const framesN = Math.max(8, Number(argValue('--frames') || 24))
const fps = Number(argValue('--fps') || 12)
const settleMs = Number(argValue('--settle-ms') || 400)
const forceBuild = hasFlag('--build')
const pathIn = argValue('--path')
const width = Number(argValue('--width') || 1280)
const height = Number(argValue('--height') || 720)
const dpr = Number(argValue('--dpr') || 1)

// Adapter-aligned ramen orbit defaults
const origin = (argValue('--origin') || '0,0,0').split(',').map(Number)
const target = (argValue('--target') || '0.1,1.35,0.2').split(',').map(Number)
const radius = Number(argValue('--radius') || 7.5)
const droneHeight = Number(argValue('--height-cam') || 2.35)
const fov = Number(argValue('--fov') || 38)

const outDir = join(root, 'shots', `${label}-drone`)
const framesDir = join(outDir, 'frames')

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.wasm': 'application/wasm',
}

function buildDronePath() {
  const keyframes = []
  for (let i = 0; i < framesN; i++) {
    const t = i / (framesN - 1)
    let position
    let look = [...target]
    if (kind === 'orbit') {
      const a = t * Math.PI * 2
      position = [
        origin[0] + Math.sin(a) * radius,
        droneHeight,
        origin[2] + Math.cos(a) * radius,
      ]
    } else if (kind === 'pushin') {
      position = [
        origin[0] + 0.4,
        droneHeight + (1 - t) * 1.2,
        origin[2] + radius * (1.2 - t * 0.75),
      ]
      look = [origin[0], origin[1] + 1.3, origin[2]]
    } else if (kind === 'flyover') {
      const a = t * Math.PI
      position = [
        origin[0],
        droneHeight + Math.sin(a) * 4,
        origin[2] + Math.cos(a) * radius,
      ]
      look = [origin[0], origin[1] + 1.0, origin[2]]
    } else if (kind === 'spiral') {
      const a = t * Math.PI * 3
      const r = radius * (1.15 - t * 0.6)
      position = [
        origin[0] + Math.sin(a) * r,
        droneHeight + 2.5 * (1 - t),
        origin[2] + Math.cos(a) * r,
      ]
    } else {
      throw new Error(`unknown kind ${kind}`)
    }
    keyframes.push({
      i,
      t,
      position: position.map((n) => Math.round(n * 1000) / 1000),
      target: look.map((n) => Math.round(n * 1000) / 1000),
      fov,
    })
  }
  return {
    kind: '7dps-drone-path',
    version: 1,
    path: kind,
    frames: framesN,
    origin,
    target,
    fov,
    radius,
    height: droneHeight,
    keyframes,
    note: 'Host capture-drone.mjs samples via __shopSetCamera then 7dps encode-drone.',
  }
}

function serveDist(port = 0) {
  const base = '/portfolio/demos/room'
  const server = createServer((req, res) => {
    let url = decodeURIComponent((req.url || '/').split('?')[0])
    if (url.startsWith(base)) url = url.slice(base.length) || '/'
    if (url === '/') url = '/index.html'
    const file = join(dist, url.replace(/^\//, ''))
    try {
      if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
        res.writeHead(404)
        res.end('not found')
        return
      }
      const body = readFileSync(file)
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end('not found')
    }
  })
  return new Promise((resolveServe, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address()
      resolveServe({ server, port: addr.port, base })
    })
  })
}

async function main() {
  mkdirSync(framesDir, { recursive: true })

  let pathObj
  if (pathIn && existsSync(pathIn)) {
    pathObj = JSON.parse(readFileSync(pathIn, 'utf8'))
    console.log('path ←', pathIn, pathObj.path || pathObj.kind, pathObj.keyframes?.length)
  } else {
    pathObj = buildDronePath()
  }
  const pathFile = join(outDir, 'path.json')
  writeFileSync(pathFile, JSON.stringify(pathObj, null, 2))
  console.log('wrote', pathFile)

  if (forceBuild || !existsSync(join(dist, 'index.html'))) {
    console.log('→ npm run build')
    const b = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', stdio: 'inherit' })
    if (b.status !== 0) throw new Error('build failed')
  }

  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    throw new Error('playwright required in host room package')
  }

  const { server, port, base } = await serveDist(0)
  const url = `http://127.0.0.1:${port}${base}/?beauty=1&capture=1&dpr=${dpr}`
  console.log('→', url)

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
  })
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: Math.min(dpr, 2),
  })

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await page.waitForFunction(() => typeof window.__shopSetCamera === 'function', {
      timeout: 120000,
    })
    await page.waitForTimeout(1500)

    const keys = pathObj.keyframes || []
    for (let i = 0; i < keys.length; i++) {
      const kf = keys[i]
      const ok = await page.evaluate((c) => {
        if (typeof window.__shopSetCamera !== 'function') return false
        return window.__shopSetCamera({
          position: c.position,
          target: c.target,
          fov: c.fov,
        })
      }, kf)
      if (!ok) console.warn(`  setCamera failed frame ${i}`)
      await page.waitForTimeout(settleMs)

      const out = join(framesDir, `f${String(i).padStart(3, '0')}.png`)
      // Canvas readback preferred
      const dataUrl = await page.evaluate(() => {
        const c = document.querySelector('canvas')
        if (!c) return null
        try {
          return c.toDataURL('image/png')
        } catch {
          return null
        }
      })
      if (dataUrl && dataUrl.length > 8000) {
        const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
        writeFileSync(out, Buffer.from(b64, 'base64'))
      } else {
        await page.screenshot({ path: out, type: 'png' })
      }
      const st = statSync(out)
      console.log(`  frame ${i + 1}/${keys.length} ${st.size}B → ${out}`)
    }

    const manifest = {
      kind: 'drone',
      label,
      path: kind,
      frames: keys.length,
      fps,
      width,
      height,
      dpr,
      settleMs,
      origin,
      target,
      radius,
      heightCam: droneHeight,
      fov,
      pathFile: 'path.json',
      framesDir: 'frames',
      at: new Date().toISOString(),
    }
    writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    writeFileSync(
      join(outDir, 'README.md'),
      `# ${label} drone flythrough\n\n- kind: ${kind}\n- frames: ${keys.length} @ ${fps}fps\n- encode: \`7dps encode-drone --frames ${outDir}/frames --out ${outDir}/drone.mp4 --fps ${fps}\`\n`,
    )
    console.log('drone capture OK →', outDir)
  } finally {
    await browser.close().catch(() => {})
    server.close()
  }
}

main().catch((e) => {
  console.error('capture-drone FAIL:', e.message || e)
  process.exit(1)
})
