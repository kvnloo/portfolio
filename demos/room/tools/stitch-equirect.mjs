#!/usr/bin/env node
/**
 * Bilinear cube→equirect stitch (Node + ImageMagick raw IO).
 * Matches ShopCanvas dirToCubeUV (WebGL Y-up face orientation).
 *
 * Usage:
 *   node tools/stitch-equirect.mjs --faces-dir shots/ramen-hq-photosphere --out equirect.png
 *   node tools/stitch-equirect.mjs --faces-dir path --size 1024 --out path/equirect.png
 */
import { spawnSync } from 'node:child_process'
import { existsSync, writeFileSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : null
}

const FACE_NAMES = ['px', 'nx', 'py', 'ny', 'pz', 'nz']

function magickReadRgba(file) {
  const r = spawnSync('magick', [file, '-depth', '8', 'rgba:-'], {
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024,
  })
  if (r.status !== 0) {
    throw new Error(`magick read failed ${file}: ${r.stderr?.toString() || ''}`)
  }
  return r.stdout
}

function magickWriteRgba(buf, w, h, outFile) {
  const r = spawnSync(
    'magick',
    ['-size', `${w}x${h}`, '-depth', '8', 'rgba:-', outFile],
    { input: buf, maxBuffer: 64 * 1024 * 1024 },
  )
  if (r.status !== 0) {
    throw new Error(`magick write failed: ${r.stderr?.toString() || ''}`)
  }
}

function magickSize(file) {
  const r = spawnSync('magick', [file, '-format', '%w', 'info:'], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`magick size ${file}`)
  return Number(r.stdout.trim())
}

function dirToCubeUV(dx, dy, dz) {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  const az = Math.abs(dz)
  if (ax >= ay && ax >= az) {
    const s = 1 / ax
    if (dx > 0) return { name: 'px', u: (dz * s + 1) / 2, v: (-dy * s + 1) / 2 }
    return { name: 'nx', u: (-dz * s + 1) / 2, v: (-dy * s + 1) / 2 }
  }
  if (ay >= ax && ay >= az) {
    const s = 1 / ay
    if (dy > 0) return { name: 'py', u: (-dx * s + 1) / 2, v: (dz * s + 1) / 2 }
    return { name: 'ny', u: (-dx * s + 1) / 2, v: (-dz * s + 1) / 2 }
  }
  const s = 1 / az
  if (dz > 0) return { name: 'pz', u: (-dx * s + 1) / 2, v: (-dy * s + 1) / 2 }
  // −Z kiosk: camera.lookAt(-Z) has right=+X in GL, but canvas screenshot
    // is stored with image-x matching screen left→right. Equirect brand LTR needs
    // u flipped vs raw dx so neon reads correctly (not mirrored).
    return { name: 'nz', u: (-dx * s + 1) / 2, v: (-dy * s + 1) / 2 }
}

/**
 * @param {Record<string, Buffer>} faceBufs raw RGBA size²
 * @param {number} size
 * @returns {Buffer} RGBA equirect (2size × size)
 */
export function stitchEquirect(faceBufs, size) {
  const eqW = size * 2
  const eqH = size
  const out = Buffer.alloc(eqW * eqH * 4)
  const faces = faceBufs

  const sample = (name, u, v) => {
    const b = faces[name]
    const x = Math.min(size - 1, Math.max(0, u * (size - 1)))
    const y = Math.min(size - 1, Math.max(0, v * (size - 1)))
    const x0 = x | 0
    const y0 = y | 0
    const x1 = Math.min(size - 1, x0 + 1)
    const y1 = Math.min(size - 1, y0 + 1)
    const fx = x - x0
    const fy = y - y0
    const i00 = (y0 * size + x0) * 4
    const i10 = (y0 * size + x1) * 4
    const i01 = (y1 * size + x0) * 4
    const i11 = (y1 * size + x1) * 4
    const r =
      b[i00] * (1 - fx) * (1 - fy) +
      b[i10] * fx * (1 - fy) +
      b[i01] * (1 - fx) * fy +
      b[i11] * fx * fy
    const g =
      b[i00 + 1] * (1 - fx) * (1 - fy) +
      b[i10 + 1] * fx * (1 - fy) +
      b[i01 + 1] * (1 - fx) * fy +
      b[i11 + 1] * fx * fy
    const bl =
      b[i00 + 2] * (1 - fx) * (1 - fy) +
      b[i10 + 2] * fx * (1 - fy) +
      b[i01 + 2] * (1 - fx) * fy +
      b[i11 + 2] * fx * fy
    const a =
      b[i00 + 3] * (1 - fx) * (1 - fy) +
      b[i10 + 3] * fx * (1 - fy) +
      b[i01 + 3] * (1 - fx) * fy +
      b[i11 + 3] * fx * fy
    return [r, g, bl, a]
  }

  for (let y = 0; y < eqH; y++) {
    const phi = ((y + 0.5) / eqH) * Math.PI
    const sinPhi = Math.sin(phi)
    const cosPhi = Math.cos(phi)
    for (let x = 0; x < eqW; x++) {
      const theta = (x / eqW) * Math.PI * 2 - Math.PI
      const dx = sinPhi * Math.sin(theta)
      const dy = cosPhi
      const dz = sinPhi * Math.cos(theta)
      const { name, u, v } = dirToCubeUV(dx, dy, dz)
      const [r, g, b, a] = sample(name, u, v)
      const o = (y * eqW + x) * 4
      out[o] = r
      out[o + 1] = g
      out[o + 2] = b
      out[o + 3] = a
    }
  }
  return out
}

export function stitchFacesDir(facesDir, outFile, sizeHint = null) {
  const dir = resolve(facesDir)
  const nz = join(dir, 'nz.png')
  if (!existsSync(nz)) throw new Error(`missing ${nz}`)
  const size = sizeHint || magickSize(nz)
  const faceBufs = {}
  for (const name of FACE_NAMES) {
    const f = join(dir, `${name}.png`)
    if (!existsSync(f)) throw new Error(`missing face ${f}`)
    const raw = magickReadRgba(f)
    if (raw.length !== size * size * 4) {
      throw new Error(`face ${name} raw length ${raw.length} != ${size * size * 4}`)
    }
    faceBufs[name] = raw
  }
  const t0 = Date.now()
  const rgba = stitchEquirect(faceBufs, size)
  const out = resolve(outFile || join(dir, 'equirect.png'))
  magickWriteRgba(rgba, size * 2, size, out)
  console.log(`stitched equirect ${size * 2}×${size} → ${out} (${Date.now() - t0}ms)`)
  return out
}

// CLI when executed directly
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('stitch-equirect.mjs') ||
    process.argv[1].endsWith('stitch-equirect.js'))
if (isMain) {
  const facesDir = argValue('--faces-dir')
  if (!facesDir) {
    console.error('Usage: node tools/stitch-equirect.mjs --faces-dir <dir> [--out equirect.png] [--size 1024]')
    process.exit(1)
  }
  const out = argValue('--out') || join(facesDir, 'equirect.png')
  const size = argValue('--size') ? Number(argValue('--size')) : null
  stitchFacesDir(facesDir, out, size)
}
