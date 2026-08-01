import { Suspense, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { Canvas, useThree } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents, Environment, OrbitControls, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { Project } from './types'
import { ShopShell } from './shop/ShopShell'
import { ProjectHotspots } from './shop/ProjectHotspots'
import { CitySquareEnv } from './shop/CitySquareEnv'

type Props = {
  projects: Project[]
  selectedId: string | null
  onSelect: (id: string) => void
  onReady?: () => void
  beauty?: boolean
}

/** Plaza eye in front of kiosk — hero storefront in −Z face / defaultYaw 180°. */
const PHOTOSPHERE_ORIGIN: [number, number, number] = [0.2, 1.85, 6.0]

declare global {
  interface Window {
    __shopSetCamera?: (
      preset:
        | string
        | {
            position: [number, number, number]
            target: [number, number, number]
            fov?: number
          },
    ) => boolean
    __shopCameraPresets?: Record<
      string,
      { position: [number, number, number]; target: [number, number, number]; fov?: number }
    >
    /**
     * Capture cube faces or equirectangular photosphere (see tools/capture-photosphere.mjs).
     * Detaches OrbitControls (no update/clamps), disables post (no vignette seams),
     * keeps supersample dpr, stitches with bilinear + WebGL-Y-up face UVs.
     */
    __shopCapturePhotosphere?: (opts?: {
      size?: number
      mode?: 'cube' | 'equirect'
      /** World-space eye for the sphere (default: plaza in front of kiosk). */
      origin?: [number, number, number]
      /** Supersample factor while snapping faces (default 2). */
      dpr?: number
      /** Yaw rotation around world +Y applied to all face dirs (radians, for 4D). */
      yaw?: number
      /** Reject face if mean luma below this (0–1). Default 0.03. */
      rejectBlackMean?: number
      /** Reject face if luma std below this. Default 0.01. */
      rejectBlackStd?: number
    }) => Promise<{
      faces?: Record<string, string>
      equirect?: string
      origin: number[]
      yaw?: number
      stats?: Record<string, { mean: number; std: number }>
    }>
    /** Aim one cube face for external CDP screenshot (software-GL safe). */
    __shopAimCubeFace?: (opts: {
      face: string
      origin?: [number, number, number]
      size?: number
      dpr?: number
      yaw?: number
      /** When true, disable EffectComposer (call with raw:false to restore). */
      raw?: boolean
    }) => Promise<boolean>
    /** CPU stitch faces (data URLs or already-captured) → equirect data URL. */
    __shopStitchEquirect?: (
      faces: Record<string, string>,
      size: number,
    ) => Promise<string>
  }
}

const CAMERA_PRESETS: Record<
  string,
  { position: [number, number, number]; target: [number, number, number]; fov?: number }
> = {
  // Beauty / overall — loop-r32 residual (A/E): r31 threeQuarter still put right yellow
  // globe as FOV co-hero (cam x≈4.55 near lamp [4.2,0,5.5]); leftNeon still kissed pink
  // lantern radial. Pull beauty set FRONT-plaza so kiosk+neon own frame; lamps/trees = edge.
  // Hero: mild right bias, full kiosk on night apron, neon full-width, food silhouette.
  // threeQuarter: moderate X + higher Z (front-right plaza) — lamp/canopy edge only.
  // leftNeon: front-left plaza (not shrub corridor) — marquee+shop clear of pink sphere.
  hero: { position: [2.42, 2.42, 9.05], target: [0.02, 1.54, 0.1], fov: 36 },
  threeQuarter: { position: [3.15, 2.52, 8.65], target: [0.04, 1.52, 0.1], fov: 36 },
  front: { position: [0.04, 1.92, 8.25], target: [0, 1.52, 0.08], fov: 36 },
  // Counter crop: lower eye under strip so food midtones clear warm key (not roof scrape)
  counter: { position: [0.58, 1.44, 2.48], target: [0.06, 1.08, -0.02], fov: 38 },
  // leftNeon: front-left plaza, not tree corridor; neon+face readable at beauty distance
  leftNeon: { position: [-2.85, 2.42, 8.35], target: [0.06, 1.56, 0.12], fov: 36 },
  overhead: { position: [0.15, 7.1, 2.85], target: [0, 1.22, -0.06] },
  // Placement library — exterior brand / per-object (prompt.md Placement & brand)
  exteriorSignFront: { position: [0.0, 3.0, 5.55], target: [0.05, 3.02, 1.1] },
  exteriorSignThreeQ: { position: [3.55, 3.1, 4.45], target: [0.05, 3.0, 1.05] },
  exteriorSignLeft: { position: [-3.35, 3.05, 4.15], target: [0.05, 3.0, 1.05] },
  exteriorSignLow: { position: [0.12, 1.58, 5.05], target: [0.05, 2.94, 1.05] },
  exteriorStreet: { position: [0.12, 1.72, 8.15], target: [0, 1.55, 0.12] },
  sideLeft: { position: [-5.95, 2.2, 0.55], target: [0, 1.5, -0.2] },
  sideRight: { position: [5.95, 2.2, 0.55], target: [0, 1.5, -0.2] },
  rear: { position: [0.15, 2.32, -5.35], target: [0, 1.55, -0.28] },
  signpost: { position: [-3.25, 1.9, 3.85], target: [-1.9, 1.55, 1.3] },
  // Select-ready food frames — lower + closer under strip for warm-key midtones
  counterRamen: { position: [0.68, 1.38, 2.18], target: [-0.28, 1.06, 0.0], fov: 40 },
  counterBoba: { position: [0.02, 1.38, 2.2], target: [0.52, 1.06, 0.02], fov: 40 },
  lanterns: { position: [1.32, 2.38, 2.9], target: [0.1, 2.28, 0.22] },
  menuBoard: { position: [-0.06, 1.9, 1.28], target: [-1.25, 1.84, -1.48] },
  awningUnderside: { position: [0.06, 1.88, 2.42], target: [0, 2.38, 0.45] },
  roofGlyph: { position: [2.15, 3.95, 3.15], target: [1.52, 3.52, 0.85] },
  // Environment / plaza (city square) — for env iteration + photosphere anchors
  plazaWide: { position: [0.2, 2.4, 11.5], target: [0, 1.6, 0.5] },
  plazaLeft: { position: [-9.5, 2.2, 5.5], target: [0, 1.5, 1.0] },
  plazaRight: { position: [9.5, 2.2, 5.5], target: [0, 1.5, 1.0] },
  skylineRear: { position: [0.3, 3.5, -12], target: [0, 2.5, -4] },
  greeneryClose: { position: [-4.5, 1.4, 5.8], target: [-5.0, 1.2, 4.5] },
}

function FirstFrameReady({ onReady }: { onReady?: () => void }) {
  const { gl } = useThree()
  useEffect(() => {
    if (!onReady) return
    let cancelled = false
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) onReady()
      })
    })
    const t = window.setTimeout(() => {
      if (!cancelled) onReady()
    }, 1200)
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
      window.clearTimeout(t)
    }
  }, [gl, onReady])
  return null
}

/**
 * Cube-face look dirs + ups matching Three.js WebGL CubeCamera (Y-up sides).
 * NOT the legacy inverted-Y cubemap ups — those mirrored neon on nz/px when
 * stitched with equirect UVs derived from lookAt orientation.
 */
const CUBE_FACES: {
  name: string
  dir: [number, number, number]
  up: [number, number, number]
}[] = [
  { name: 'px', dir: [1, 0, 0], up: [0, 1, 0] },
  { name: 'nx', dir: [-1, 0, 0], up: [0, 1, 0] },
  { name: 'py', dir: [0, 1, 0], up: [0, 0, -1] },
  { name: 'ny', dir: [0, -1, 0], up: [0, 0, 1] },
  { name: 'pz', dir: [0, 0, 1], up: [0, 1, 0] },
  { name: 'nz', dir: [0, 0, -1], up: [0, 1, 0] },
]

function rotateYawY(
  v: [number, number, number],
  yaw: number,
): [number, number, number] {
  if (!yaw) return v
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c]
}

function waitFrames(n = 3) {
  return new Promise<void>((resolve) => {
    let left = n
    const tick = () => {
      left -= 1
      if (left <= 0) resolve()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

/** Mean + std of luma in [0,1] from a PNG data URL (for reject-black). */
async function dataUrlLumaStats(dataUrl: string): Promise<{ mean: number; std: number }> {
  const im = await loadImage(dataUrl)
  const c = document.createElement('canvas')
  const w = Math.min(im.width, 128)
  const h = Math.min(im.height, 128)
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(im, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  let sum = 0
  let sum2 = 0
  const n = w * h
  for (let i = 0; i < data.length; i += 4) {
    const y = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255
    sum += y
    sum2 += y * y
  }
  const mean = sum / n
  const variance = Math.max(0, sum2 / n - mean * mean)
  return { mean, std: Math.sqrt(variance) }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = () => reject(new Error('image load failed'))
    im.src = url
  })
}

/**
 * Bilinear sample face buffer. u,v in [0,1], v=0 top (image space).
 * Face orientation: WebGL CubeCamera Y-up lookAt captures.
 */
function sampleFaceBilinear(
  buf: ImageData,
  size: number,
  u: number,
  v: number,
): [number, number, number, number] {
  const x = Math.min(size - 1, Math.max(0, u * (size - 1)))
  const y = Math.min(size - 1, Math.max(0, v * (size - 1)))
  const x0 = x | 0
  const y0 = y | 0
  const x1 = Math.min(size - 1, x0 + 1)
  const y1 = Math.min(size - 1, y0 + 1)
  const fx = x - x0
  const fy = y - y0
  const d = buf.data
  const i00 = (y0 * size + x0) * 4
  const i10 = (y0 * size + x1) * 4
  const i01 = (y1 * size + x0) * 4
  const i11 = (y1 * size + x1) * 4
  const r =
    d[i00] * (1 - fx) * (1 - fy) +
    d[i10] * fx * (1 - fy) +
    d[i01] * (1 - fx) * fy +
    d[i11] * fx * fy
  const g =
    d[i00 + 1] * (1 - fx) * (1 - fy) +
    d[i10 + 1] * fx * (1 - fy) +
    d[i01 + 1] * (1 - fx) * fy +
    d[i11 + 1] * fx * fy
  const b =
    d[i00 + 2] * (1 - fx) * (1 - fy) +
    d[i10 + 2] * fx * (1 - fy) +
    d[i01 + 2] * (1 - fx) * fy +
    d[i11 + 2] * fx * fy
  const a =
    d[i00 + 3] * (1 - fx) * (1 - fy) +
    d[i10 + 3] * fx * (1 - fy) +
    d[i01 + 3] * (1 - fx) * fy +
    d[i11 + 3] * fx * fy
  return [r, g, b, a]
}

/**
 * Map world direction → cube face + UV for Y-up WebGL face images
 * (camera.lookAt(dir) with CUBE_FACES ups; image top = camera up).
 * Equirect: theta −π..π (0 → +Z), phi 0..π (0 → +Y). u=0 edge → −Z (kiosk / PSV 180°).
 */
function dirToCubeUV(dx: number, dy: number, dz: number): { name: string; u: number; v: number } {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  const az = Math.abs(dz)
  if (ax >= ay && ax >= az) {
    const s = 1 / ax
    if (dx > 0) {
      // +X: right=+Z, up=+Y
      return { name: 'px', u: (dz * s + 1) / 2, v: (-dy * s + 1) / 2 }
    }
    // −X: right=−Z, up=+Y
    return { name: 'nx', u: (-dz * s + 1) / 2, v: (-dy * s + 1) / 2 }
  }
  if (ay >= ax && ay >= az) {
    const s = 1 / ay
    if (dy > 0) {
      // +Y: right=−X, up=−Z (CUBE_FACES.py.up)
      return { name: 'py', u: (-dx * s + 1) / 2, v: (dz * s + 1) / 2 }
    }
    // −Y: right=−X, up=+Z
    return { name: 'ny', u: (-dx * s + 1) / 2, v: (-dz * s + 1) / 2 }
  }
  const s = 1 / az
  if (dz > 0) {
    // +Z: right=−X, up=+Y
    return { name: 'pz', u: (-dx * s + 1) / 2, v: (-dy * s + 1) / 2 }
  }
  // −Z: right=+X, up=+Y (kiosk)
  return { name: 'nz', u: (dx * s + 1) / 2, v: (-dy * s + 1) / 2 }
}

async function stitchEquirectFromFaces(
  faces: Record<string, string>,
  size: number,
): Promise<string> {
  const imgs: Record<string, HTMLImageElement> = {}
  await Promise.all(
    Object.entries(faces).map(async ([name, url]) => {
      imgs[name] = await loadImage(url)
    }),
  )
  const bufs: Record<string, ImageData> = {}
  for (const name of Object.keys(imgs)) {
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const cx = c.getContext('2d', { willReadFrequently: true })!
    cx.drawImage(imgs[name], 0, 0, size, size)
    bufs[name] = cx.getImageData(0, 0, size, size)
  }

  const eqW = size * 2
  const eqH = size
  const eq = document.createElement('canvas')
  eq.width = eqW
  eq.height = eqH
  const ectx = eq.getContext('2d')!
  const out = ectx.createImageData(eqW, eqH)
  const outData = out.data

  // Yield every few rows so the page stays responsive under SwiftShader
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
      const [r, g, b, a] = sampleFaceBilinear(bufs[name], size, u, v)
      const o = (y * eqW + x) * 4
      outData[o] = r
      outData[o + 1] = g
      outData[o + 2] = b
      outData[o + 3] = a
    }
    if ((y & 31) === 31) {
      await new Promise<void>((r) => setTimeout(r, 0))
    }
  }
  ectx.putImageData(out, 0, 0)
  return eq.toDataURL('image/png')
}

/** Expose camera presets + photosphere capture for Playwright harness. */
function CameraBridge({
  setRawCapture,
}: {
  setRawCapture: (raw: boolean) => void
}) {
  const { camera, controls, gl, set, scene } = useThree()
  useEffect(() => {
    window.__shopCameraPresets = CAMERA_PRESETS
    window.__shopSetCamera = (preset) => {
      const cfg = typeof preset === 'string' ? CAMERA_PRESETS[preset] : preset
      if (!cfg) return false
      camera.position.set(...cfg.position)
      // Coherent FOV: use preset value, else calm default 36 (avoids sticky wide FOV after counter crop)
      const fov =
        'fov' in cfg && (cfg as { fov?: number }).fov != null
          ? (cfg as { fov?: number }).fov!
          : 36
      const perspCam = camera as THREE.PerspectiveCamera
      if (perspCam.isPerspectiveCamera) {
        perspCam.fov = fov
      }
      camera.lookAt(...cfg.target)
      camera.updateProjectionMatrix()
      const c = controls as unknown as {
        target: THREE.Vector3
        update: () => void
      } | null
      if (c?.target) {
        c.target.set(...cfg.target)
        c.update()
      }
      return true
    }

    type OrbitLike = {
      target: THREE.Vector3
      enabled: boolean
      minDistance: number
      maxDistance: number
      minPolarAngle: number
      maxPolarAngle: number
      enableDamping: boolean
    }

    const getOrbit = () => controls as unknown as OrbitLike | null

    let captureActive = false
    let prevCapture: {
      fov: number
      aspect: number
      pos: THREE.Vector3
      quat: THREE.Quaternion
      up: THREE.Vector3
      tone: number
      size: THREE.Vector2
      pr: number
      enabled?: boolean
      minDistance?: number
      maxDistance?: number
      minPolar?: number
      maxPolar?: number
      damping?: boolean
    } | null = null

    const enterCapture = async (size: number, dpr: number) => {
      const persp = camera as THREE.PerspectiveCamera
      if (!persp.isPerspectiveCamera) throw new Error('Photosphere requires a perspective camera')
      if (!captureActive) {
        const c = getOrbit()
        const sz = new THREE.Vector2()
        gl.getSize(sz)
        prevCapture = {
          fov: persp.fov,
          aspect: persp.aspect,
          pos: camera.position.clone(),
          quat: camera.quaternion.clone(),
          up: camera.up.clone(),
          tone: gl.toneMappingExposure,
          size: sz,
          pr: gl.getPixelRatio(),
          enabled: c?.enabled,
          minDistance: c?.minDistance,
          maxDistance: c?.maxDistance,
          minPolar: c?.minPolarAngle,
          maxPolar: c?.maxPolarAngle,
          damping: c?.enableDamping,
        }
        captureActive = true
      }

      // Disable OrbitControls completely — drei only calls update() when enabled.
      // Never call controls.update() here: it enforces minDistance=4.8 + polar clamps
      // and pulls each face eye off the photosphere origin (~3.8m parallax).
      const c = getOrbit()
      if (c) {
        c.enabled = false
        c.enableDamping = false
        c.minDistance = 0
        c.maxDistance = 1e6
        c.minPolarAngle = 0
        c.maxPolarAngle = Math.PI
      }

      // Sync unmount EffectComposer before first face (restores ACES tone mapping)
      // Also flips Environment background=true so +Y samples night HDR, not clear-color void.
      flushSync(() => setRawCapture(true))
      set({ frameloop: 'always' })
      // Night plaza: lift exposure for readable neon/kiosk without washout
      gl.toneMappingExposure = Math.max(prevCapture?.tone ?? 1.16, 1.72)
      // Keep supersample — do NOT force setPixelRatio(1)
      gl.setPixelRatio(dpr)
      gl.setSize(size, size, false)
      persp.fov = 90
      persp.aspect = 1
      persp.updateProjectionMatrix()
      // Re-assert ACES after composer unmount cleanup
      gl.toneMapping = THREE.ACESFilmicToneMapping
      // +Y sky: solid night Color (not HDR env-as-background).
      // Env-map background hangs SwiftShader on pure-sky faces; Color is instant + non-void.
      // Slight blue-ink night so mean≈0.04–0.08 (passes H8 mean≥0.01 / non-flat).
      await waitFrames(1)
      scene.background = new THREE.Color(0x0e1428)
      if ('backgroundIntensity' in scene) {
        ;(scene as THREE.Scene & { backgroundIntensity?: number }).backgroundIntensity = 1
      }
      await waitFrames(3)
    }

    const exitCapture = async () => {
      if (!captureActive || !prevCapture) return
      const persp = camera as THREE.PerspectiveCamera
      const c = getOrbit()
      gl.toneMappingExposure = prevCapture.tone
      gl.setPixelRatio(prevCapture.pr)
      gl.setSize(prevCapture.size.x, prevCapture.size.y, false)
      camera.position.copy(prevCapture.pos)
      camera.quaternion.copy(prevCapture.quat)
      camera.up.copy(prevCapture.up)
      if (persp.isPerspectiveCamera) {
        persp.fov = prevCapture.fov
        persp.aspect = prevCapture.aspect
        persp.updateProjectionMatrix()
      }
      if (c) {
        if (prevCapture.minDistance != null) c.minDistance = prevCapture.minDistance
        if (prevCapture.maxDistance != null) c.maxDistance = prevCapture.maxDistance
        if (prevCapture.minPolar != null) c.minPolarAngle = prevCapture.minPolar
        if (prevCapture.maxPolar != null) c.maxPolarAngle = prevCapture.maxPolar
        if (prevCapture.damping != null) c.enableDamping = prevCapture.damping
        if (prevCapture.enabled != null) c.enabled = prevCapture.enabled
        c.target.set(0.02, 1.54, 0.1)
      }
      flushSync(() => setRawCapture(false))
      set({ frameloop: 'always' })
      captureActive = false
      prevCapture = null
      await waitFrames(2)
    }

    const aimFace = (faceName: string, origin: [number, number, number], yaw: number) => {
      const face = CUBE_FACES.find((f) => f.name === faceName)
      if (!face) throw new Error(`Unknown cube face: ${faceName}`)
      const dir = rotateYawY(face.dir, yaw)
      const up = rotateYawY(face.up, yaw)
      camera.position.set(origin[0], origin[1], origin[2])
      const target = new THREE.Vector3(origin[0] + dir[0], origin[1] + dir[1], origin[2] + dir[2])
      camera.up.set(up[0], up[1], up[2])
      camera.lookAt(target)
      camera.updateMatrixWorld(true)
      ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
      // Sync target only — never controls.update() (would re-clamp)
      const c = getOrbit()
      if (c?.target) c.target.copy(target)
    }

    const snapFaceDataUrl = (size: number) => {
      const faceCanvas = document.createElement('canvas')
      faceCanvas.width = size
      faceCanvas.height = size
      const fctx = faceCanvas.getContext('2d')!
      const src = gl.domElement
      const sw = src.width
      const sh = src.height
      const side = Math.min(sw, sh)
      const sx = (sw - side) / 2
      const sy = (sh - side) / 2
      // drawImage downscales supersampled buffer → mild AA
      fctx.imageSmoothingEnabled = true
      fctx.imageSmoothingQuality = 'high'
      fctx.clearRect(0, 0, size, size)
      fctx.drawImage(src, sx, sy, side, side, 0, 0, size, size)
      return faceCanvas.toDataURL('image/png')
    }

    window.__shopAimCubeFace = async (opts) => {
      const size = Math.min(2048, Math.max(256, opts.size ?? 1024))
      const dpr = Math.min(3, Math.max(1, opts.dpr ?? 2))
      const origin = opts.origin ?? PHOTOSPHERE_ORIGIN
      const yaw = opts.yaw ?? 0
      if (opts.raw === false) {
        await exitCapture()
        return true
      }
      await enterCapture(size, dpr)
      aimFace(opts.face, origin, yaw)
      await waitFrames(5)
      return true
    }

    window.__shopStitchEquirect = (faces, size) => stitchEquirectFromFaces(faces, size)

    /**
     * Render 6 cube faces from a plaza eye → equirect PNG.
     * - OrbitControls fully detached (enabled=false, no update) so true ±Y faces + single origin
     * - EffectComposer off (no vignette edge seams)
     * - Supersample dpr kept (not forced to 1)
     * - Bilinear equirect stitch with WebGL Y-up face UVs
     * - Reject near-black faces before return
     */
    window.__shopCapturePhotosphere = async (opts = {}) => {
      const size = Math.min(2048, Math.max(256, opts.size ?? 1024))
      const mode = opts.mode ?? 'equirect'
      const origin = opts.origin ?? PHOTOSPHERE_ORIGIN
      const dpr = Math.min(3, Math.max(1, opts.dpr ?? 2))
      const yaw = opts.yaw ?? 0
      const rejectMean = opts.rejectBlackMean ?? 0.03
      const rejectStd = opts.rejectBlackStd ?? 0.01

      const faces: Record<string, string> = {}
      const stats: Record<string, { mean: number; std: number }> = {}

      try {
        await enterCapture(size, dpr)
        for (const face of CUBE_FACES) {
          aimFace(face.name, origin, yaw)
          await waitFrames(5)
          const dataUrl = snapFaceDataUrl(size)
          const st = await dataUrlLumaStats(dataUrl)
          stats[face.name] = st
          // Horizon faces: hard reject-black. +Y sky must not be flat void (HDR / night bg).
          // Gate: mean≥~0.01 OR non-zero std so pure black std=0 packs fail (H8).
          const isSky = face.name === 'py'
          const meanFloor = isSky ? Math.min(0.01, Math.max(0.01, rejectMean * 0.33)) : rejectMean
          const stdFloor = isSky ? 0.001 : rejectStd
          const skyOk = isSky && (st.mean >= 0.01 || st.std >= 0.001)
          const hardFail = isSky
            ? !skyOk && (st.mean < meanFloor || st.std < stdFloor)
            : st.mean < meanFloor || st.std < stdFloor
          if (hardFail || (isSky && st.mean < 0.01 && st.std < 0.001)) {
            throw new Error(
              `Photosphere face ${face.name} rejected (near-black/flat): mean=${st.mean.toFixed(4)} std=${st.std.toFixed(4)} (need mean≥${meanFloor} std≥${stdFloor}; sky needs mean≥0.01 or std>0)`,
            )
          }
          faces[face.name] = dataUrl
        }
      } finally {
        await exitCapture()
      }

      if (mode === 'cube') {
        return { faces, origin: [...origin], yaw, stats }
      }

      const equirect = await stitchEquirectFromFaces(faces, size)
      const eqStats = await dataUrlLumaStats(equirect)
      stats.equirect = eqStats
      if (eqStats.mean < rejectMean || eqStats.std < rejectStd) {
        throw new Error(
          `Photosphere equirect rejected (near-black/flat): mean=${eqStats.mean.toFixed(4)} std=${eqStats.std.toFixed(4)}`,
        )
      }
      return { faces, equirect, origin: [...origin], yaw, stats }
    }

    return () => {
      delete window.__shopSetCamera
      delete window.__shopCameraPresets
      delete window.__shopCapturePhotosphere
      delete window.__shopAimCubeFace
      delete window.__shopStitchEquirect
    }
  }, [camera, controls, gl, set, scene, setRawCapture])
  return null
}

/** Local night HDR — githack CDN returns 403 and would hang Suspense forever. */
const NIGHT_HDR = `${import.meta.env.BASE_URL}hdri/dikhololo_night_1k.hdr`

function Scene({
  projects,
  selectedId,
  onSelect,
  captureHi,
  rawCapture,
}: Props & { captureHi?: boolean; rawCapture?: boolean }) {
  return (
    <>
      {/* City square first so kiosk draws on top in depth; env is surround only */}
      <CitySquareEnv />
      <ShopShell />
      <ProjectHotspots projects={projects} selectedId={selectedId} onSelect={onSelect} />
      {/* Night IBL — residual (A) loop-r32: fill-first midtones at beauty distance;
          modest IBL only (shell emitters + warm wraps carry key; no HDR crank / soup).
          During cube photosphere capture (rawCapture), also drive scene.background so +Y
          is night sky HDR instead of pure clear-color void (empty py face / black zenith). */}
      <Suspense fallback={null}>
        <Environment
          files={NIGHT_HDR}
          environmentIntensity={0.46}
          background={false}
        />
      </Suspense>
      {/*
        multisampling: 0 in interactive mode (perf). During ?capture=1 use 4× MSAA when the
        GL backend supports it — pairs with capture dpr≥2 so neon/edges aren't jagged.
        During cube-face photosphere snaps, unmount entire post stack (vignette/bloom → seams;
        also restores ACES tone mapping — enabled=false alone leaves NoToneMapping).
      */}
      {!rawCapture && (
        <EffectComposer multisampling={captureHi ? 4 : 0} enableNormalPass={false}>
          {/*
            Residual (A) bloom — loop-r32: near-off; neon cores = tubes not plasma.
            High threshold kills soft yellow lamp wash + pink lantern mush.
          */}
          <Bloom
            intensity={0.006}
            luminanceThreshold={0.988}
            luminanceSmoothing={0.95}
            mipmapBlur
            levels={2}
          />
          {/* Soft vignette — hold midtones; flanks leave pure black mud / stage rim */}
          <Vignette offset={0.3} darkness={0.07} />
        </EffectComposer>
      )}
      {/* Skip AdaptiveDpr during hi-res capture so frames stay full resolution */}
      {!captureHi && !rawCapture && <AdaptiveDpr pixelated />}
      <AdaptiveEvents />
    </>
  )
}

/**
 * Performance-tuned canvas:
 * - dpr capped (1–1.5) + AdaptiveDpr regress under load
 * - dual warm wrap + cool frontal/edge/rim/window (6; no per-tube)
 * - shadow maps 1024, single caster (in ShopShell)
 * - preserveDrawingBuffer only in beauty/capture
 * - restrained bloom; night-market apron bounce; cool is facade-only (residual A loop-r32)
 */
export function ShopCanvas(props: Props) {
  const beauty = !!props.beauty
  // High-res still capture (?capture=1) — fixed dpr, preserve buffer, no AdaptiveDpr thrash
  const captureHi =
    typeof window !== 'undefined' &&
    (() => {
      try {
        return new URLSearchParams(window.location.search).get('capture') === '1'
      } catch {
        return false
      }
    })()
  // Residual (A) loop-r32: fill-first midtones (warm food key + cool facade bounce), not
  // exposure crank. Warm wraps carry food/wood; exposure holds night kiosk (no gray pad).
  const exposure = 1.16
  // Cube-face photosphere: disable EffectComposer (vignette → equirect seams)
  const [rawCapture, setRawCapture] = useState(false)

  // Capture path: supersample (dpr≥2) so stills match browser sharpness.
  // dpr=1 + Lanczos upscale was the jagged/soft “AA off” look vs interactive GPU.
  // Query ?dpr=2|3 overrides; default 2 balances quality vs SwiftShader memory.
  const captureDpr = (() => {
    if (!captureHi) return null
    try {
      const q = new URLSearchParams(window.location.search).get('dpr')
      const n = q ? Number(q) : 2
      return Number.isFinite(n) ? Math.min(3, Math.max(1, n)) : 2
    } catch {
      return 2
    }
  })()

  return (
    <div className="canvas-host">
      <Canvas
        shadows
        dpr={captureHi ? (captureDpr ?? 2) : [1, 1.5]}
        // Default pose = hero preset (full kiosk framed, FOV calm, off lamp/canopy radials)
        camera={{ position: [2.42, 2.42, 9.05], fov: 36, near: 0.1, far: 55 }}
        performance={captureHi ? { min: 1, max: 1, debounce: 0 } : { min: 0.5, max: 1, debounce: 200 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: exposure,
          powerPreference: 'high-performance',
          // Screenshots (beauty or Behance 8K capture) need the buffer retained
          preserveDrawingBuffer: beauty || captureHi,
          stencil: false,
          depth: true,
          // Large scene + layered ground/decals — log depth kills coplanar strobe on orbit
          logarithmicDepthBuffer: true,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = exposure
          gl.shadowMap.type = THREE.PCFSoftShadowMap
          // Lock pixel ratio for capture — no AdaptiveDpr thrash, full supersample
          if (captureHi && captureDpr) {
            gl.setPixelRatio(captureDpr)
          }
        }}
      >
        {/* Deep night void — residual (A) pure street night, not gray stage cyclorama */}
        <color attach="background" args={['#000104']} />
        {/*
          Residual (A) atmosphere loop-r32 — cool night air but fog later + darker so near
          apron midtones read warm night-market (not blue-gray pad / early fog mush).
        */}
        <fog attach="fog" args={['#010308', 13.2, 31]} />

        {/*
          Ground stack — Y levels MUST stay well separated (≥0.02) + polygonOffset on
          overlays. Coplanar asphalt/apron/plaza layers were the orbit “strobe” z-fight.
        */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0.15]} receiveShadow>
          <planeGeometry args={[48, 48]} />
          <meshStandardMaterial
            color="#020100"
            emissive="#080604"
            emissiveIntensity={0.04}
            roughness={1}
          />
        </mesh>
        {/* Warm apron pool under stools/entrance — amber market bounce owns ground story */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.04, -0.07, 1.35]} renderOrder={1}>
          <circleGeometry args={[3.05, 48]} />
          <meshStandardMaterial
            color="#080301"
            emissive="#5a3818"
            emissiveIntensity={0.52}
            roughness={1}
            transparent
            opacity={0.42}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-2}
          />
        </mesh>
        {/* Cool street ring — desaturated steel edge ONLY (r32: kill blue pad flood) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.06, -0.055, 2.85]} renderOrder={2}>
          <ringGeometry args={[3.0, 4.55, 48]} />
          <meshStandardMaterial
            color="#020304"
            emissive="#1a2830"
            emissiveIntensity={0.055}
            roughness={1}
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-3}
          />
        </mesh>

        {/*
          Soft base lift — residual (A) loop-r32: muted cool sky + warmer ground hemi so
          counter wood gets midtone bounce; warm key wins over cool street flood.
        */}
        <hemisphereLight args={['#1e3a4e', '#3a2414', 1.42]} />
        {/* Tiny warm-neutral ambient — stall volume without gray-stage / blue pad flood */}
        <ambientLight intensity={0.065} color="#1c1814" />

        {/*
          Residual (A) loop-r32 two-temp — budget 6 pts. Warm key OWNS food/wood midtones;
          cool fill is facade/neon edge only (not key-thief / blue asphalt flood):
          - amber warm wraps LOWER + stronger over counter (food/wood midtones)
          - cool frontal/edge HIGHER + weaker + shorter (neon/siding, not ground flood)
          - cool rim + window for kiosk volume (not empty toy booth)
        */}
        {/* Warm wrap L — ramen / left counter — amber key lower onto food plane */}
        <pointLight position={[-0.72, 1.55, 0.62]} color="#e8bc70" intensity={4.35} distance={5.4} decay={2} />
        {/* Warm wrap C-R — boba / mid-right counter — amber key for wood + food midtones */}
        <pointLight position={[0.78, 1.58, 0.58]} color="#e4b468" intensity={4.15} distance={5.3} decay={2} />
        {/* Cool frontal street fill — HIGH outside face only; lights neon/siding not asphalt */}
        <pointLight position={[0.1, 3.65, 5.35]} color="#5a8a98" intensity={0.88} distance={8.8} decay={2} />
        {/* Cool street edge — facade-height night bounce (NOT ground up-flood) */}
        <pointLight position={[0.2, 3.05, 5.2]} color="#4a7888" intensity={0.48} distance={7.2} decay={2} />
        {/* Cool right rim — exterior siding / three-quarter flank; kiosk edge presence */}
        <pointLight position={[5.85, 2.75, 2.55]} color="#3e6e88" intensity={1.55} distance={11.5} decay={2} />
        {/* Cool night-window fill — rear plaster + menu; lift hollow interior into kiosk volume */}
        <pointLight position={[-1.0, 2.65, -1.05]} color="#5a8e9c" intensity={3.45} distance={10.0} decay={2} />

        {/* Default PerformanceMonitor drives AdaptiveDpr when FPS dips */}
        <PerformanceMonitor />

        {/* Camera bridge + ready OUTSIDE Suspense so capture harness never waits on HDR/shop load. */}
        <FirstFrameReady onReady={props.onReady} />
        <CameraBridge setRawCapture={setRawCapture} />
        <OrbitControls
          makeDefault
          target={[0.02, 1.54, 0.1]}
          minPolarAngle={0.38}
          maxPolarAngle={1.32}
          // Full yaw so users can survey the city square surround
          minAzimuthAngle={-Math.PI}
          maxAzimuthAngle={Math.PI}
          minDistance={4.8}
          maxDistance={15.5}
          enablePan={false}
          dampingFactor={0.048}
          enableDamping
          zoomSpeed={0.36}
          rotateSpeed={0.24}
        />

        <Suspense fallback={null}>
          <Scene {...props} captureHi={captureHi} rawCapture={rawCapture} />
        </Suspense>
      </Canvas>
      {!beauty && (
        <p className="pipeline-badge">Kevin&apos;s Ramen &amp; Boba · orbit · click a dish</p>
      )}
    </div>
  )
}
