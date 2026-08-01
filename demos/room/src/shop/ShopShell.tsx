import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows, Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const texBase = `${import.meta.env.BASE_URL}assets/`

/** Soft radial + noise alpha for steam sprites (no hard mesh sphere tell). */
function makeSteamSpriteTexture(): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  const cx = size * 0.5
  const cy = size * 0.5
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / cx
      const dy = (y - cy) / cy
      const r = Math.sqrt(dx * dx + dy * dy)
      // Soft gaussian falloff + cheap hash noise for wispy edge
      const n =
        Math.sin(x * 0.37 + y * 0.19) * 0.08 +
        Math.sin(x * 0.11 - y * 0.29) * 0.06 +
        Math.sin((x + y) * 0.07) * 0.04
      const fall = Math.exp(-r * r * 2.8) * (0.92 + n)
      const a = Math.max(0, Math.min(1, fall))
      const i = (y * size + x) * 4
      img.data[i] = 255
      img.data[i + 1] = 244
      img.data[i + 2] = 230
      img.data[i + 3] = Math.floor(a * 255)
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

/**
 * Soft transparent steam sprites (residual #7).
 * Replaces hard white MeshBasic spheres that wreck atmosphere scores.
 */
function SteamField({
  position,
  count = 14,
  spread = 0.22,
}: {
  position: [number, number, number]
  count?: number
  spread?: number
}) {
  const group = useRef<THREE.Group>(null)
  const map = useMemo(() => makeSteamSpriteTexture(), [])
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.sin(i * 2.17) * spread * 0.55,
        z: Math.cos(i * 1.63) * spread * 0.55,
        phase: i * 0.41,
        speed: 0.14 + (i % 5) * 0.028,
        scale: 0.11 + (i % 4) * 0.035,
        drift: 0.03 + (i % 3) * 0.01,
      })),
    [count, spread],
  )

  useFrame(({ clock, camera }) => {
    const g = group.current
    if (!g) return
    const t = clock.elapsedTime
    g.children.forEach((child, i) => {
      const s = seeds[i]
      if (!s || !(child instanceof THREE.Mesh)) return
      const cycle = ((t * s.speed + s.phase) % 1.8) / 1.8
      child.position.set(
        s.x + Math.sin(t * 0.7 + s.phase) * s.drift,
        cycle * 0.82,
        s.z + Math.cos(t * 0.55 + s.phase) * s.drift * 0.8,
      )
      // Soft sine envelope — peels in/out without hard disc edges
      // loop-r20 residual #2/#3 (A): further restrain steam so chalk SPECIALS + wood midtones survive
      const envelope = Math.sin(cycle * Math.PI)
      const mat = child.material as THREE.MeshBasicMaterial
      mat.opacity = envelope * 0.085
      const sc = s.scale * (0.42 + cycle * 1.15)
      child.scale.set(sc * (1 + cycle * 0.28), sc * (1.05 + cycle * 0.75), sc)
      // Billboard toward camera (sprite-like soft puffs)
      child.quaternion.copy(camera.quaternion)
    })
  })

  return (
    <group ref={group} position={position}>
      {seeds.map((s, i) => (
        <mesh key={i} position={[s.x, 0, s.z]} renderOrder={2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={map}
            color="#fff4e8"
            transparent
            opacity={0.09}
            depthWrite={false}
            depthTest
            toneMapped={false}
            blending={THREE.NormalBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Round glass-style neon tube (cylinder, not box).
 * `args` match prior box dims [x,y,z]; longest axis becomes tube length.
 * loop-r32 residual #11 (shell A/C): r31 beauty still reads soft extruded plastic /
 * wireframe cage from 5 nested transparent shells stacking at letter joints.
 * Letter strokes use a lean 3-layer glass hierarchy (no BackSide catch + no double
 * halo) so gas sits INSIDE a clear rim, not a solid emissive bar:
 *   1) thin hot filament (discharge spine)
 *   2) colored gas GLOW CORE (narrow — does NOT own tube body)
 *   3) frosted glass sleeve owns silhouette (Standard, no Physical crystal)
 *   4) single soft additive halo (restrained bloom fuel)
 * Frame tubes keep end caps + fuller hierarchy. High radial segs; ZERO joint spheres.
 */
function NeonTube({
  position,
  rotation = [0, 0, 0],
  args,
  color,
  intensity = 1.4,
  /** When true (letter strokes), skip end spheres + multi-shell stack. */
  letterStroke = false,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  args: [number, number, number]
  color: string
  intensity?: number
  letterStroke?: boolean
}) {
  const [ax, ay, az] = args
  const len = Math.max(ax, ay, az)
  // Letter tubes: round glass mass; frame stays secondary
  const rawT = Math.min(ax, ay, az)
  const thinLetter = letterStroke || rawT < 0.028
  // Slightly fuller letter radius so glass rim survives beauty FOV without plastic bar
  const t = Math.max(thinLetter ? 0.013 : 0.009, rawT * (thinLetter ? 1.08 : 0.98))
  // Cap intensity — glass sleeve + gas core share brand, not solid bar
  const iCap = Math.min(intensity, thinLetter ? 1.48 : 1.55)
  // Default cylinder is Y-up; reorient so length matches the longest box axis.
  let localRot: [number, number, number] = [0, 0, 0]
  if (ax >= ay && ax >= az) {
    localRot = [0, 0, Math.PI / 2] // length → X
  } else if (az >= ax && az >= ay) {
    localRot = [Math.PI / 2, 0, 0] // length → Z
  }
  // High radial segs — kill polygonal crystal / wireframe cage tell
  const segs = thinLetter ? 36 : 44
  const gasSegs = thinLetter ? 22 : 32
  // Frame runs only — letter chords with end spheres = LED-dot necklace
  const showEndCaps = !letterStroke && !thinLetter && len > t * 8
  // Letter gas narrower than glass so clear rim sells tube (not extruded plastic fill)
  const gasR = thinLetter ? 0.38 : 0.36
  const filR = thinLetter ? 0.12 : 0.12
  return (
    <group position={position} rotation={rotation}>
      <group rotation={localRot}>
        {/* 1. Hot electrode filament — thin white discharge spine */}
        <mesh>
          <cylinderGeometry args={[t * filR, t * filR, len * 0.992, thinLetter ? 10 : 14]} />
          <meshBasicMaterial
            color={thinLetter ? '#fffaf6' : '#fffef8'}
            toneMapped={false}
            transparent
            opacity={0.96}
          />
        </mesh>
        {/* 2. Colored gas GLOW CORE — narrow fill; does NOT own tube body */}
        <mesh>
          <cylinderGeometry args={[t * gasR, t * gasR, len * 0.996, gasSegs]} />
          <meshBasicMaterial
            color={color}
            toneMapped={false}
            transparent
            opacity={Math.min(0.88, (thinLetter ? 0.72 : 0.48) + iCap * 0.1)}
          />
        </mesh>
        {/* 3. Glass sleeve — owns tube silhouette (frosted glass rim, not plastic glow) */}
        <mesh>
          <cylinderGeometry args={[t * 1.0, t * 1.0, len, segs]} />
          <meshStandardMaterial
            color={thinLetter ? '#b8d0e0' : '#c4dce8'}
            emissive={color}
            // Low sleeve emissive so body reads glass, gas owns brand color
            emissiveIntensity={iCap * (thinLetter ? 0.055 : 0.07)}
            roughness={thinLetter ? 0.16 : 0.08}
            metalness={thinLetter ? 0.08 : 0.14}
            transparent
            // More opaque sleeve = solid glass wall with gas inside (not cage mesh)
            opacity={thinLetter ? 0.48 : 0.42}
            envMapIntensity={thinLetter ? 0.85 : 1.15}
            toneMapped={false}
          />
        </mesh>
        {/* Frame-only: soft inner glass catch (letters skip — nested shells = cage) */}
        {!thinLetter && (
          <mesh>
            <cylinderGeometry args={[t * 0.78, t * 0.78, len * 0.988, 28]} />
            <meshStandardMaterial
              color="#e8f4fc"
              emissive={color}
              emissiveIntensity={iCap * 0.065}
              roughness={0.18}
              metalness={0.05}
              transparent
              opacity={0.18}
              envMapIntensity={0.7}
              toneMapped={false}
              side={THREE.BackSide}
            />
          </mesh>
        )}
        {/* Soft glass-end caps ONLY on long frame tubes (never letter chords) */}
        {showEndCaps && (
          <>
            <mesh position={[0, len * 0.5, 0]}>
              <sphereGeometry args={[t * 0.92, 20, 14]} />
              <meshStandardMaterial
                color="#d8e8f4"
                emissive={color}
                emissiveIntensity={iCap * 0.1}
                roughness={0.12}
                metalness={0.08}
                transparent
                opacity={0.42}
                envMapIntensity={0.8}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[0, -len * 0.5, 0]}>
              <sphereGeometry args={[t * 0.92, 20, 14]} />
              <meshStandardMaterial
                color="#d8e8f4"
                emissive={color}
                emissiveIntensity={iCap * 0.1}
                roughness={0.12}
                metalness={0.08}
                transparent
                opacity={0.42}
                envMapIntensity={0.8}
                toneMapped={false}
              />
            </mesh>
          </>
        )}
        {/* Single soft cylindrical glow — one halo only (letters: no double cage) */}
        <mesh>
          <cylinderGeometry
            args={[
              t * (thinLetter ? 1.55 : 1.95),
              t * (thinLetter ? 1.55 : 1.95),
              len * 0.99,
              thinLetter ? 20 : 28,
            ]}
          />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={(thinLetter ? 0.038 : 0.058) * iCap}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      </group>
    </group>
  )
}

/**
 * 2D stroke → NeonTube segment in the XY plane (channel letter building block).
 * loop-r24 residual #5 / r32 #11: OVERLAP endpoints so lean glass cylinders form
 * continuous tubes — NO weld spheres (LED-dot marquee necklace).
 */
function NeonStroke({
  from,
  to,
  color,
  thickness = 0.014,
  intensity = 1.45,
  z = 0,
}: {
  from: [number, number]
  to: [number, number]
  color: string
  thickness?: number
  intensity?: number
  z?: number
}) {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const len = Math.hypot(dx, dy)
  if (len < 1e-4) return null
  const angle = Math.atan2(dy, dx)
  // Overlap past each endpoint so chord joints read as continuous glass, not bead gaps
  const overlap = thickness * 1.2
  const lenExt = Math.max(len + overlap * 2, thickness * 1.8)
  return (
    <NeonTube
      position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, z]}
      rotation={[0, 0, angle]}
      args={[lenExt, thickness, thickness]}
      color={color}
      intensity={intensity}
      letterStroke
    />
  )
}

/** Unit-box stroke tables (x,y in 0..1; y-up). Densified curves = continuous glass tubes (r22 #4). */
const NEON_LETTER_STROKES: Record<string, [number, number, number, number][]> = {
  A: [
    [0.08, 0, 0.34, 1],
    [0.34, 1, 0.6, 0],
    [0.18, 0.38, 0.5, 0.38],
  ],
  B: [
    [0.1, 0, 0.1, 1],
    [0.1, 1, 0.42, 1],
    [0.42, 1, 0.52, 0.92],
    [0.52, 0.92, 0.58, 0.8],
    [0.58, 0.8, 0.58, 0.66],
    [0.58, 0.66, 0.5, 0.56],
    [0.5, 0.56, 0.42, 0.52],
    [0.42, 0.52, 0.1, 0.52],
    [0.42, 0.52, 0.52, 0.46],
    [0.52, 0.46, 0.58, 0.34],
    [0.58, 0.34, 0.58, 0.18],
    [0.58, 0.18, 0.5, 0.06],
    [0.5, 0.06, 0.42, 0],
    [0.42, 0, 0.1, 0],
  ],
  C: [
    [0.58, 0.88, 0.42, 0.98],
    [0.42, 0.98, 0.24, 1],
    [0.24, 1, 0.12, 0.88],
    [0.12, 0.88, 0.08, 0.7],
    [0.08, 0.7, 0.08, 0.3],
    [0.08, 0.3, 0.12, 0.12],
    [0.12, 0.12, 0.24, 0],
    [0.24, 0, 0.42, 0.02],
    [0.42, 0.02, 0.58, 0.14],
  ],
  E: [
    [0.12, 0, 0.12, 1],
    [0.12, 1, 0.58, 1],
    [0.12, 0.5, 0.48, 0.5],
    [0.12, 0, 0.58, 0],
  ],
  I: [
    [0.2, 1, 0.48, 1],
    [0.34, 1, 0.34, 0],
    [0.2, 0, 0.48, 0],
  ],
  K: [
    [0.1, 0, 0.1, 1],
    [0.1, 0.5, 0.58, 1],
    [0.1, 0.5, 0.58, 0],
  ],
  M: [
    [0.06, 0, 0.06, 1],
    [0.06, 1, 0.34, 0.4],
    [0.34, 0.4, 0.62, 1],
    [0.62, 1, 0.62, 0],
  ],
  N: [
    [0.1, 0, 0.1, 1],
    [0.1, 1, 0.58, 0],
    [0.58, 0, 0.58, 1],
  ],
  O: [
    [0.28, 0, 0.42, 0],
    [0.42, 0, 0.54, 0.1],
    [0.54, 0.1, 0.6, 0.28],
    [0.6, 0.28, 0.6, 0.72],
    [0.6, 0.72, 0.54, 0.9],
    [0.54, 0.9, 0.42, 1],
    [0.42, 1, 0.28, 1],
    [0.28, 1, 0.16, 0.9],
    [0.16, 0.9, 0.1, 0.72],
    [0.1, 0.72, 0.1, 0.28],
    [0.1, 0.28, 0.16, 0.1],
    [0.16, 0.1, 0.28, 0],
  ],
  R: [
    [0.1, 0, 0.1, 1],
    [0.1, 1, 0.4, 1],
    [0.4, 1, 0.52, 0.92],
    [0.52, 0.92, 0.58, 0.78],
    [0.58, 0.78, 0.58, 0.64],
    [0.58, 0.64, 0.5, 0.54],
    [0.5, 0.54, 0.4, 0.5],
    [0.4, 0.5, 0.1, 0.5],
    [0.28, 0.5, 0.58, 0],
  ],
  S: [
    [0.56, 0.9, 0.4, 0.98],
    [0.4, 0.98, 0.22, 1],
    [0.22, 1, 0.1, 0.88],
    [0.1, 0.88, 0.1, 0.72],
    [0.1, 0.72, 0.18, 0.6],
    [0.18, 0.6, 0.32, 0.54],
    [0.32, 0.54, 0.48, 0.48],
    [0.48, 0.48, 0.58, 0.38],
    [0.58, 0.38, 0.58, 0.2],
    [0.58, 0.2, 0.48, 0.06],
    [0.48, 0.06, 0.3, 0],
    [0.3, 0, 0.14, 0.08],
    [0.14, 0.08, 0.1, 0.16],
  ],
  V: [
    [0.08, 1, 0.34, 0],
    [0.34, 0, 0.6, 1],
  ],
  "'": [[0.3, 0.72, 0.3, 1]],
  '&': [
    [0.5, 0.9, 0.36, 1],
    [0.36, 1, 0.2, 0.94],
    [0.2, 0.94, 0.12, 0.8],
    [0.12, 0.8, 0.12, 0.64],
    [0.12, 0.64, 0.22, 0.54],
    [0.22, 0.54, 0.38, 0.42],
    [0.38, 0.42, 0.52, 0.28],
    [0.52, 0.28, 0.48, 0.1],
    [0.48, 0.1, 0.36, 0],
    [0.36, 0, 0.16, 0.1],
    [0.22, 0.52, 0.58, 0],
  ],
}

/**
 * Channel-style neon word — glass tube strokes, not Text/flat UI type.
 * Word-solid primary color (residual #2 readability). When dual=true, only
 * specials (& / ') take accent — no alternating letter soup that kills word read.
 * loop-r32 residual #11: NO per-letter channel plate AND no micro-shadow box stubs
 * (r31 beauty still read extruded plastic cans under each glyph). Tubes alone own
 * the glyph against matte channel floor.
 */
function NeonWord({
  text,
  position,
  letterH = 0.28,
  letterW = 0.2,
  gap = 0.028,
  color = '#ff4db8',
  accent = '#44f0ff',
  dual = true,
  thickness = 0.014,
  intensity = 1.55,
}: {
  text: string
  position: [number, number, number]
  letterH?: number
  letterW?: number
  gap?: number
  color?: string
  accent?: string
  dual?: boolean
  thickness?: number
  intensity?: number
}) {
  const chars = text.toUpperCase().split('')
  let x = 0
  const laid = chars.map((ch, i) => {
    const narrow = ch === 'I' || ch === "'"
    const wide = ch === 'M' || ch === 'W' || ch === '&'
    const w = ch === ' ' ? letterW * 0.45 : narrow ? letterW * 0.58 : wide ? letterW * 1.12 : letterW
    const entry = { ch, x, w, i }
    x += w + (ch === ' ' ? gap * 0.45 : gap)
    return entry
  })
  const totalW = x - gap
  return (
    <group position={[position[0] - totalW / 2, position[1], position[2]]}>
      {laid.map(({ ch, x: lx, w, i }) => {
        if (ch === ' ') return null
        const strokes = NEON_LETTER_STROKES[ch]
        if (!strokes) return null
        // Word-solid: only & / ' use accent so "KEVIN'S" / "RAMEN & BOBA" read as words
        const special = ch === '&' || ch === "'"
        const col = dual && special ? accent : color
        return (
          <group key={`${ch}${i}`} position={[lx, 0, 0]}>
            {strokes.map(([x0, y0, x1, y1], si) => (
              <NeonStroke
                key={si}
                from={[x0 * w, y0 * letterH]}
                to={[x1 * w, y1 * letterH]}
                color={col}
                thickness={thickness}
                intensity={intensity}
                z={0.012}
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}

/**
 * Canvas fabric weave maps — residual #7 / loop-r31 A #3 (noren/awning fabric, not plastic cards).
 * Albedo: high-contrast warp/weft + optional noren stripe/crest print that survives beauty FOV.
 * Roughness: sheen breakup so cloth sells under warm key.
 */
function makeFabricMaps(
  baseRgb: [number, number, number],
  opts?: { norenPrint?: boolean },
): {
  albedo: THREE.CanvasTexture
  roughness: THREE.CanvasTexture
} {
  // Deterministic so noren weave doesn't flicker across remounts
  let seed = (baseRgb[0] * 73856093) ^ (baseRgb[1] * 19349663) ^ (baseRgb[2] * 83492791)
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0x100000000
  }
  const size = 256
  const [br, bg, bb] = baseRgb
  const aCanvas = document.createElement('canvas')
  aCanvas.width = aCanvas.height = size
  const aCtx = aCanvas.getContext('2d')!
  aCtx.fillStyle = `rgb(${br},${bg},${bb})`
  aCtx.fillRect(0, 0, size, size)
  // High-contrast warp/weft — loop-r31 A #3: weave MUST read at beauty FOV (not flat cards)
  for (let i = 0; i < size; i += 1) {
    const shade = (i % 2 === 0 ? 78 : 32) * (0.8 + Math.sin(i * 0.31) * 0.28)
    aCtx.fillStyle = `rgba(${Math.min(255, br + shade)},${Math.min(255, bg + shade * 0.55)},${Math.min(255, bb + shade * 0.4)},0.55)`
    aCtx.fillRect(i, 0, 1, size)
    aCtx.fillStyle = `rgba(${Math.max(0, br - shade * 0.95)},${Math.max(0, bg - shade * 0.7)},${Math.max(0, bb - shade * 0.5)},0.5)`
    aCtx.fillRect(0, i, size, 1)
  }
  // Coarser canvas bands (beauty-FOV weave tell)
  for (let i = 0; i < size; i += 3) {
    aCtx.fillStyle = `rgba(${Math.min(255, br + 58)},${Math.min(255, bg + 24)},${Math.min(255, bb + 16)},0.32)`
    aCtx.fillRect(i, 0, 2, size)
    aCtx.fillStyle = `rgba(${Math.max(0, br - 48)},${Math.max(0, bg - 30)},${Math.max(0, bb - 22)},0.34)`
    aCtx.fillRect(0, i, size, 2)
  }
  // Twill diagonal bias (canvas character)
  for (let i = 0; i < 90; i++) {
    const y = rnd() * size
    aCtx.strokeStyle = `rgba(${Math.min(255, br + 40)},${Math.min(255, bg + 16)},${Math.min(255, bb + 10)},${0.12 + rnd() * 0.16})`
    aCtx.lineWidth = 1 + rnd() * 2.5
    aCtx.beginPath()
    aCtx.moveTo(0, y)
    for (let x = 0; x <= size; x += 6) {
      aCtx.lineTo(x, y + x * 0.12 + Math.sin(x * 0.08 + i) * 2)
    }
    aCtx.stroke()
  }
  // Soft dye mottling + edge wear blotches
  for (let i = 0; i < 150; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const r = 6 + rnd() * 28
    const g = aCtx.createRadialGradient(cx, cy, 1, cx, cy, r)
    const lite = rnd() > 0.4
    g.addColorStop(
      0,
      lite
        ? `rgba(${Math.min(255, br + 68)},${Math.min(255, bg + 30)},${Math.min(255, bb + 18)},0.32)`
        : `rgba(${Math.max(0, br - 48)},${Math.max(0, bg - 34)},${Math.max(0, bb - 28)},0.34)`,
    )
    g.addColorStop(1, 'rgba(0,0,0,0)')
    aCtx.fillStyle = g
    aCtx.beginPath()
    aCtx.arc(cx, cy, r, 0, Math.PI * 2)
    aCtx.fill()
  }
  // Fine fiber noise + fray flecks
  for (let i = 0; i < 5600; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const v = (rnd() - 0.5) * 56
    aCtx.fillStyle = `rgba(${br + v},${bg + v * 0.6},${bb + v * 0.4},0.16)`
    aCtx.fillRect(x, y, 1.3, 1.8)
  }

  // loop-r31 residual A #3: noren stripe bands + mon crest print (not blank untextured cards)
  if (opts?.norenPrint) {
    // Classic horizontal stripe bands (ink on cloth)
    const stripeYs = [0.12, 0.22, 0.78, 0.88]
    for (const t of stripeYs) {
      const y = t * size
      aCtx.fillStyle = `rgba(${Math.min(255, br + 90)},${Math.min(255, bg + 40)},${Math.min(255, bb + 30)},0.55)`
      aCtx.fillRect(0, y - 3, size, 6)
      aCtx.fillStyle = `rgba(${Math.max(0, br - 30)},${Math.max(0, bg - 20)},${Math.max(0, bb - 14)},0.4)`
      aCtx.fillRect(0, y + 4, size, 2)
    }
    // Soft mon crest circle (center family mark)
    const cx = size * 0.5
    const cy = size * 0.48
    const R = size * 0.16
    aCtx.strokeStyle = `rgba(${Math.min(255, br + 100)},${Math.min(255, bg + 50)},${Math.min(255, bb + 40)},0.62)`
    aCtx.lineWidth = 5
    aCtx.beginPath()
    aCtx.arc(cx, cy, R, 0, Math.PI * 2)
    aCtx.stroke()
    aCtx.strokeStyle = `rgba(${Math.min(255, br + 70)},${Math.min(255, bg + 32)},${Math.min(255, bb + 24)},0.45)`
    aCtx.lineWidth = 2.5
    aCtx.beginPath()
    aCtx.arc(cx, cy, R * 0.72, 0, Math.PI * 2)
    aCtx.stroke()
    // Simple kanji-like cross bars inside mon (graphic mark, not type)
    aCtx.strokeStyle = `rgba(${Math.min(255, br + 85)},${Math.min(255, bg + 42)},${Math.min(255, bb + 28)},0.5)`
    aCtx.lineWidth = 3.5
    aCtx.beginPath()
    aCtx.moveTo(cx - R * 0.42, cy)
    aCtx.lineTo(cx + R * 0.42, cy)
    aCtx.moveTo(cx, cy - R * 0.38)
    aCtx.lineTo(cx, cy + R * 0.38)
    aCtx.stroke()
    // Soft fill behind mon so crest reads on dark cloth
    const monG = aCtx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.15)
    monG.addColorStop(0, `rgba(${Math.min(255, br + 40)},${Math.min(255, bg + 18)},${Math.min(255, bb + 12)},0.22)`)
    monG.addColorStop(1, 'rgba(0,0,0,0)')
    aCtx.fillStyle = monG
    aCtx.beginPath()
    aCtx.arc(cx, cy, R * 1.15, 0, Math.PI * 2)
    aCtx.fill()
  }

  // Hem / edge fade wear (UV perimeter darken → cloth age)
  const fabricEdge = aCtx.createLinearGradient(0, 0, 0, size)
  fabricEdge.addColorStop(0, 'rgba(10,4,8,0.4)')
  fabricEdge.addColorStop(0.08, 'rgba(10,4,8,0)')
  fabricEdge.addColorStop(0.92, 'rgba(10,4,8,0)')
  fabricEdge.addColorStop(1, 'rgba(8,2,6,0.48)')
  aCtx.fillStyle = fabricEdge
  aCtx.fillRect(0, 0, size, size)

  const rCanvas = document.createElement('canvas')
  rCanvas.width = rCanvas.height = size
  const rCtx = rCanvas.getContext('2d')!
  rCtx.fillStyle = '#b0a8a8'
  rCtx.fillRect(0, 0, size, size)
  // Thread-direction roughness lanes (darker = smoother sheen)
  for (let i = 0; i < 70; i++) {
    const y = rnd() * size
    rCtx.strokeStyle = `rgba(40,40,45,${0.2 + rnd() * 0.32})`
    rCtx.lineWidth = 1 + rnd() * 3.5
    rCtx.beginPath()
    rCtx.moveTo(0, y)
    for (let x = 0; x <= size; x += 8) {
      rCtx.lineTo(x, y + Math.sin(x * 0.04 + i) * 2.4)
    }
    rCtx.stroke()
  }
  // Worn matte patches
  for (let i = 0; i < 34; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const r = 8 + rnd() * 32
    const g = rCtx.createRadialGradient(cx, cy, 1, cx, cy, r)
    g.addColorStop(0, `rgba(230,222,210,${0.45 + rnd() * 0.4})`)
    g.addColorStop(1, 'rgba(180,175,170,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.arc(cx, cy, r, 0, Math.PI * 2)
    rCtx.fill()
  }
  // Sparse soft sheen pools (darker)
  for (let i = 0; i < 18; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const r = 6 + rnd() * 18
    const g = rCtx.createRadialGradient(cx, cy, 1, cx, cy, r)
    g.addColorStop(0, `rgba(28,26,30,${0.3 + rnd() * 0.25})`)
    g.addColorStop(1, 'rgba(120,115,120,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.arc(cx, cy, r, 0, Math.PI * 2)
    rCtx.fill()
  }

  const albedo = new THREE.CanvasTexture(aCanvas)
  albedo.colorSpace = THREE.SRGBColorSpace
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping
  albedo.repeat.set(2.4, 3.6)
  albedo.anisotropy = 8
  albedo.needsUpdate = true

  const roughness = new THREE.CanvasTexture(rCanvas)
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping
  roughness.repeat.set(2.4, 3.6)
  roughness.anisotropy = 4
  roughness.needsUpdate = true

  return { albedo, roughness }
}

/**
 * Fabric awning — residual #1: cloth body + draped valance panels (not plastic half-discs).
 * loop-r27 residual #2/#3 (A): deep night wine/indigo canvas — r26 hot pink RGB(196,40,98)
 * + pink sheen/emissive read as mystical magenta mush under strip before night kiosk.
 * Underside stays warm amber for food midtones (two-temperature story).
 */
function ScallopedAwning() {
  const scallops = 9
  const width = 4.6
  const step = width / scallops
  // Deep wine night cloth (not carnival pink) — weave survives beauty FOV
  const fabricMaps = useMemo(() => makeFabricMaps([92, 28, 48]), [])
  return (
    <group position={[0, 2.28, 0.55]}>
      {/* Main fabric body (thick canvas slab) — matte night wine */}
      <mesh position={[0, 0.08, -0.22]} rotation={[-0.38, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.14, 1.15]} />
        <meshPhysicalMaterial
          map={fabricMaps.albedo}
          roughnessMap={fabricMaps.roughness}
          color="#6a2840"
          emissive="#000000"
          emissiveIntensity={0}
          roughness={0.9}
          metalness={0}
          sheen={0.22}
          sheenRoughness={0.78}
          sheenColor="#8a4058"
        />
      </mesh>
      {/* Weave fold ridges (stitch seams) */}
      {[-0.38, -0.12, 0.14, 0.38].map((z, i) => (
        <mesh key={i} position={[0, 0.15 - i * 0.008, -0.22 + z * 0.12]} rotation={[-0.38, 0, 0]}>
          <boxGeometry args={[width - 0.1, 0.018, 0.055]} />
          <meshPhysicalMaterial
            map={fabricMaps.albedo}
            color="#4a1830"
            roughness={0.92}
            sheen={0.12}
            sheenColor="#6a3048"
          />
        </mesh>
      ))}
      {/* Underside lining — warm amber bounce for food (not pink; residual #2 A) */}
      <mesh position={[0, -0.03, -0.15]} rotation={[-0.38, 0, 0]}>
        <boxGeometry args={[width - 0.08, 0.028, 1.05]} />
        <meshStandardMaterial
          color="#e89860"
          emissive="#d88848"
          emissiveIntensity={0.48}
          roughness={0.94}
          toneMapped={false}
        />
      </mesh>
      {/* Soft additive under-awning wash — amber midtone fill (restrained vs mystical) */}
      <mesh position={[0, -0.06, -0.08]} rotation={[-0.38, 0, 0]}>
        <planeGeometry args={[width - 0.2, 0.95]} />
        <meshBasicMaterial
          color="#e8a878"
          transparent
          opacity={0.05}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Front valance bar (dark timber, not pink metal) */}
      <mesh position={[0, -0.02, 0.32]} castShadow>
        <boxGeometry args={[width + 0.08, 0.05, 0.07]} />
        <meshStandardMaterial color="#2a1810" roughness={0.62} metalness={0.12} />
      </mesh>
      {/* Scallop flaps — multi-layer draped cloth panels (not half-disc plastic) */}
      {Array.from({ length: scallops }, (_, i) => {
        const x = -width / 2 + step * 0.5 + i * step
        const sag = (i % 2) * 0.025 + Math.sin(i * 0.9) * 0.01
        const w = step * 0.88
        return (
          <group key={i} position={[x, -0.12 - sag, 0.34]} rotation={[0.18 + sag * 2, 0, (i - 4) * 0.012]}>
            {/* Outer face cloth — deep wine, zero emissive */}
            <mesh castShadow position={[0, -0.1, 0.01]}>
              <boxGeometry args={[w, 0.22, 0.028]} />
              <meshPhysicalMaterial
                map={fabricMaps.albedo}
                roughnessMap={fabricMaps.roughness}
                color={i % 2 === 0 ? '#5a2038' : '#4a1830'}
                emissive="#000000"
                emissiveIntensity={0}
                roughness={0.9}
                sheen={0.18}
                sheenRoughness={0.8}
                sheenColor="#704058"
              />
            </mesh>
            {/* Rounded bottom hem (soft cloth edge — thin cylinder, not disc plate) */}
            <mesh position={[0, -0.21, 0.01]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.018, 0.018, w * 0.92, 10]} />
              <meshPhysicalMaterial
                map={fabricMaps.albedo}
                color="#3a1424"
                roughness={0.9}
                sheen={0.12}
                sheenColor="#5a2840"
              />
            </mesh>
            {/* Inner lining (thickness read) */}
            <mesh position={[0, -0.09, -0.012]}>
              <boxGeometry args={[w * 0.9, 0.18, 0.012]} />
              <meshStandardMaterial color="#281018" roughness={0.94} />
            </mesh>
            {/* Center crease fold — subtle, not pink highlight plastic */}
            <mesh position={[0, -0.08, 0.026]}>
              <boxGeometry args={[0.012, 0.16, 0.006]} />
              <meshStandardMaterial color="#6a3850" roughness={0.85} transparent opacity={0.28} />
            </mesh>
          </group>
        )
      })}
      {/* Side flaps — thick fabric returns */}
      <mesh position={[-width / 2 - 0.02, 0.05, -0.15]} rotation={[0, 0, 0.12]} castShadow>
        <boxGeometry args={[0.09, 0.58, 0.92]} />
        <meshPhysicalMaterial
          map={fabricMaps.albedo}
          color="#4a1830"
          emissive="#000000"
          emissiveIntensity={0}
          roughness={0.9}
          sheen={0.15}
          sheenColor="#603848"
        />
      </mesh>
      <mesh position={[width / 2 + 0.02, 0.05, -0.15]} rotation={[0, 0, -0.12]} castShadow>
        <boxGeometry args={[0.09, 0.58, 0.92]} />
        <meshPhysicalMaterial
          map={fabricMaps.albedo}
          color="#4a1830"
          emissive="#000000"
          emissiveIntensity={0}
          roughness={0.9}
          sheen={0.15}
          sheenColor="#603848"
        />
      </mesh>
    </group>
  )
}

/**
 * Neon ramen bowl glyph — jesse-parity silhouette:
 * U-bowl + noodles + chopsticks as glass tubes (not a "W" scribble).
 * loop-r28 residual #11: use NeonTube hierarchy (no Physical transmission crystal).
 */
function NeonRamenGlyph({
  position,
  scale = 1,
}: {
  position: [number, number, number]
  scale?: number
}) {
  const cyan = '#44f0ff'
  const pink = '#ff66cc'
  return (
    <group position={position} scale={scale}>
      {/* Bowl U — glass-tube arc (Standard glass + gas core, matches NeonTube) */}
      <mesh position={[0, 0.0, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.15, 0.018, 14, 36, Math.PI]} />
        <meshStandardMaterial
          color="#b8d0e0"
          emissive={cyan}
          emissiveIntensity={0.12}
          roughness={0.1}
          metalness={0.1}
          transparent
          opacity={0.48}
          envMapIntensity={0.9}
          toneMapped={false}
        />
      </mesh>
      {/* Gas core for bowl arc */}
      <mesh position={[0, 0.0, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.15, 0.008, 10, 32, Math.PI]} />
        <meshBasicMaterial color={cyan} toneMapped={false} transparent opacity={0.72} />
      </mesh>
      {/* Filament spine */}
      <mesh position={[0, 0.0, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.15, 0.0035, 8, 28, Math.PI]} />
        <meshBasicMaterial color="#fffef8" toneMapped={false} transparent opacity={0.95} />
      </mesh>
      {/* Inner bowl stroke for weight */}
      <mesh position={[0, 0.01, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.11, 0.012, 12, 28, Math.PI * 0.95]} />
        <meshStandardMaterial
          color="#c8dce8"
          emissive={cyan}
          emissiveIntensity={0.1}
          roughness={0.12}
          metalness={0.08}
          transparent
          opacity={0.44}
          envMapIntensity={0.8}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.11, 0.005, 8, 24, Math.PI * 0.95]} />
        <meshBasicMaterial color={cyan} toneMapped={false} transparent opacity={0.68} />
      </mesh>
      {/* Rim caps (left / right lip) — NeonTube glass hierarchy */}
      <NeonTube
        position={[-0.15, 0.0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        args={[0.04, 0.016, 0.016]}
        color={cyan}
        intensity={1.15}
        letterStroke
      />
      <NeonTube
        position={[0.15, 0.0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        args={[0.04, 0.016, 0.016]}
        color={cyan}
        intensity={1.15}
        letterStroke
      />
      {/* Noodles rising from bowl */}
      <NeonTube
        position={[-0.04, 0.12, 0.01]}
        rotation={[0.1, 0, 0.45]}
        args={[0.012, 0.17, 0.012]}
        color={pink}
        intensity={1.1}
        letterStroke
      />
      <NeonTube
        position={[0.02, 0.14, 0.01]}
        rotation={[0.05, 0, -0.1]}
        args={[0.012, 0.2, 0.012]}
        color={pink}
        intensity={1.1}
        letterStroke
      />
      <NeonTube
        position={[0.07, 0.11, 0.01]}
        rotation={[0.1, 0, 0.35]}
        args={[0.012, 0.15, 0.012]}
        color={pink}
        intensity={1.05}
        letterStroke
      />
      {/* Chopsticks — crossed pair */}
      <NeonTube
        position={[0.11, 0.16, 0.02]}
        rotation={[0.1, 0.15, -0.62]}
        args={[0.01, 0.3, 0.01]}
        color={pink}
        intensity={1.0}
        letterStroke
      />
      <NeonTube
        position={[0.15, 0.14, -0.01]}
        rotation={[0.05, -0.1, -0.42]}
        args={[0.01, 0.28, 0.01]}
        color={pink}
        intensity={1.0}
        letterStroke
      />
      {/* Soft additive halo — restrained vs marquee letters */}
      <mesh position={[0.02, 0.06, -0.02]}>
        <planeGeometry args={[0.48, 0.48]} />
        <meshBasicMaterial
          color={cyan}
          transparent
          opacity={0.055}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/**
 * Main marquee — channel-style neon like jesse-zhou:
 * black housing + glass tube border + extruded tube letterforms
 * ("Kevin's" / "Ramen & Boba") — not flat Text / UI type.
 * Exterior street face (world +Z outside fascia) — residual #5 loop-r24:
 * continuous glass-tube letters (NO joint spheres / LED-dot marquee);
 * frame secondary + mitered corners without pearl beads; housing is physical
 * enclosure craft (drip lip, ears, arms to fascia). Word-solid colors.
 * Layout: clear Y margins so KEVIN'S never merges into top frame tube (glow blob).
 * loop-r32 residual #11 + enclosure (shell): timber-backed channel housing with
 * visible wood midtones + deep matte channel so glass-tube letters read mounted
 * night-kiosk brand (not soft extruded plastic on a flat LED panel). Wood backer
 * shares fascia family grain; channel divider separates word rows.
 */
function NeonBrandSign({ woodMap }: { woodMap?: THREE.Texture }) {
  const neonMap = useTexture(`${texBase}neon-sign.jpg`)
  neonMap.colorSpace = THREE.SRGBColorSpace
  neonMap.anisotropy = 8
  neonMap.wrapS = neonMap.wrapT = THREE.ClampToEdgeWrapping
  neonMap.offset.set(0.04, 0.12)
  neonMap.repeat.set(0.92, 0.72)
  neonMap.needsUpdate = true

  // Timber UV for wood backer — same family as fascia so marquee mounts as enclosure
  const backerMap = useMemo(() => {
    if (!woodMap) return null
    const t = woodMap.clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1.8, 0.85)
    t.offset.set(0.08, 0.28)
    t.anisotropy = 8
    t.needsUpdate = true
    return t
  }, [woodMap])
  // Face timber lip UV (slightly different tile so housing ≠ flat black TV)
  const faceWoodMap = useMemo(() => {
    if (!woodMap) return null
    const t = woodMap.clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2.4, 0.55)
    t.offset.set(0.2, 0.5)
    t.anisotropy = 8
    t.needsUpdate = true
    return t
  }, [woodMap])

  // Street-face marquee: world +Z past roof fascia (~0.87) / roof front (~0.9)
  // so housing + letters sit OUTSIDE the building volume (prompt placement rule).
  // group z=1.86 → housing face clear of fascia + awning; y=3.16 lifts brand
  // above paper-lantern band so hero FOV keeps full word silhouette.
  return (
    <group position={[0.05, 3.16, 1.86]}>
      {/* Channel letter housing — deeper black box, street-facing, worn metal (enclosure) */}
      <mesh position={[0, 0, -0.1]} castShadow>
        <boxGeometry args={[3.52, 1.34, 0.48]} />
        <meshStandardMaterial color="#0a0810" roughness={0.62} metalness={0.4} envMapIntensity={0.5} />
      </mesh>
      {/* Wood backer plate (enclosure timber — marquee belongs to fascia family) */}
      <mesh position={[0, 0, -0.32]} castShadow>
        <boxGeometry args={[3.68, 1.48, 0.12]} />
        <meshStandardMaterial
          map={backerMap ?? undefined}
          color="#5a3c28"
          emissive="#2a1810"
          emissiveIntensity={0.16}
          roughness={0.72}
          metalness={0.05}
          envMapIntensity={0.28}
        />
      </mesh>
      {/* Timber face frame rails — warm midtones so housing ≠ floating black TV */}
      <mesh position={[0, 0.66, 0.1]} castShadow>
        <boxGeometry args={[3.58, 0.12, 0.1]} />
        <meshStandardMaterial
          map={faceWoodMap ?? undefined}
          color="#6a4830"
          emissive="#241810"
          emissiveIntensity={0.1}
          roughness={0.58}
          metalness={0.08}
          envMapIntensity={0.35}
        />
      </mesh>
      <mesh position={[0, -0.66, 0.1]} castShadow>
        <boxGeometry args={[3.58, 0.12, 0.1]} />
        <meshStandardMaterial
          map={faceWoodMap ?? undefined}
          color="#5a3a26"
          emissive="#1e140c"
          emissiveIntensity={0.08}
          roughness={0.6}
          metalness={0.08}
          envMapIntensity={0.32}
        />
      </mesh>
      {/* Outer metal bevel rim (physical marquee depth vs flat card) */}
      <mesh position={[0, 0, 0.14]} castShadow>
        <boxGeometry args={[3.58, 1.4, 0.055]} />
        <meshStandardMaterial color="#1c1a24" roughness={0.36} metalness={0.62} envMapIntensity={0.8} />
      </mesh>
      {/* Bevel step-in (enclosure craft — multi-lip housing) */}
      <mesh position={[0, 0, 0.155]}>
        <boxGeometry args={[3.3, 1.16, 0.022]} />
        <meshStandardMaterial color="#0c0a12" roughness={0.48} metalness={0.48} envMapIntensity={0.55} />
      </mesh>
      {/* Inner recess (deep channel) — pure matte so glass tubes own brand read */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[3.12, 1.04, 0.22]} />
        <meshStandardMaterial color="#000002" roughness={0.99} metalness={0.0} />
      </mesh>
      {/* Channel floor — near-black matte (kill purple LED panel plate residual #5) */}
      <mesh position={[0, 0.01, 0.12]}>
        <planeGeometry args={[3.0, 0.96]} />
        <meshStandardMaterial
          map={neonMap}
          color="#010103"
          roughness={0.99}
          metalness={0.01}
          transparent
          opacity={0.05}
        />
      </mesh>
      {/* Horizontal channel divider rail (enclosure craft — separates word rows) */}
      <mesh position={[0, -0.04, 0.14]} castShadow>
        <boxGeometry args={[3.0, 0.028, 0.04]} />
        <meshStandardMaterial color="#121018" roughness={0.45} metalness={0.42} />
      </mesh>
      {/* Side returns — physical depth on marquee edges + timber outer cheeks */}
      <mesh position={[-1.82, 0, -0.04]} castShadow>
        <boxGeometry args={[0.16, 1.34, 0.5]} />
        <meshStandardMaterial color="#100c16" roughness={0.42} metalness={0.52} />
      </mesh>
      <mesh position={[1.82, 0, -0.04]} castShadow>
        <boxGeometry args={[0.16, 1.34, 0.5]} />
        <meshStandardMaterial color="#100c16" roughness={0.42} metalness={0.52} />
      </mesh>
      {/* Timber cheek plates (enclosure wood visible at 3Q / leftNeon) */}
      <mesh position={[-1.9, 0, -0.08]} castShadow>
        <boxGeometry args={[0.06, 1.28, 0.38]} />
        <meshStandardMaterial
          map={faceWoodMap ?? undefined}
          color="#5a3c28"
          roughness={0.65}
          metalness={0.06}
          envMapIntensity={0.3}
        />
      </mesh>
      <mesh position={[1.9, 0, -0.08]} castShadow>
        <boxGeometry args={[0.06, 1.28, 0.38]} />
        <meshStandardMaterial
          map={faceWoodMap ?? undefined}
          color="#5a3c28"
          roughness={0.65}
          metalness={0.06}
          envMapIntensity={0.3}
        />
      </mesh>
      {/* Top / bottom metal lips */}
      <mesh position={[0, 0.7, -0.04]}>
        <boxGeometry args={[3.52, 0.09, 0.48]} />
        <meshStandardMaterial color="#0a0812" metalness={0.54} roughness={0.34} />
      </mesh>
      <mesh position={[0, -0.7, -0.04]}>
        <boxGeometry args={[3.52, 0.09, 0.48]} />
        <meshStandardMaterial color="#0a0812" metalness={0.54} roughness={0.34} />
      </mesh>
      {/* Bottom drip edge / rain lip (enclosure craft) */}
      <mesh position={[0, -0.76, 0.12]}>
        <boxGeometry args={[3.4, 0.052, 0.15]} />
        <meshStandardMaterial color="#06040a" metalness={0.62} roughness={0.3} />
      </mesh>
      {/* Secondary drip rib (enclosure craft density) */}
      <mesh position={[0, -0.8, 0.06]}>
        <boxGeometry args={[3.28, 0.03, 0.08]} />
        <meshStandardMaterial color="#040308" metalness={0.56} roughness={0.34} />
      </mesh>
      {/* Tertiary rain gutter return (enclosure thickness under street face) */}
      <mesh position={[0, -0.82, -0.06]}>
        <boxGeometry args={[3.14, 0.022, 0.1]} />
        <meshStandardMaterial color="#030206" metalness={0.5} roughness={0.44} />
      </mesh>
      {/* Mount ear plates (enclosure craft — marquee ≠ floating card) */}
      <mesh position={[-1.9, 0.28, -0.04]} castShadow>
        <boxGeometry args={[0.15, 0.44, 0.24]} />
        <meshStandardMaterial color="#1c1822" metalness={0.64} roughness={0.32} />
      </mesh>
      <mesh position={[1.9, 0.28, -0.04]} castShadow>
        <boxGeometry args={[0.15, 0.44, 0.24]} />
        <meshStandardMaterial color="#1c1822" metalness={0.64} roughness={0.32} />
      </mesh>
      {/* Lower mount ears */}
      <mesh position={[-1.9, -0.3, -0.04]} castShadow>
        <boxGeometry args={[0.13, 0.34, 0.2]} />
        <meshStandardMaterial color="#18141e" metalness={0.6} roughness={0.36} />
      </mesh>
      <mesh position={[1.9, -0.3, -0.04]} castShadow>
        <boxGeometry args={[0.13, 0.34, 0.2]} />
        <meshStandardMaterial color="#18141e" metalness={0.6} roughness={0.36} />
      </mesh>
      {/* Ear bolt nubs (enclosure craft micro-detail) */}
      {([-1.9, 1.9] as const).flatMap((ex, ei) =>
        ([0.42, 0.18, -0.18, -0.42] as const).map((ey, ej) => (
          <mesh key={`ear-bolt-${ei}-${ej}`} position={[ex, ey, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.028, 8]} />
            <meshStandardMaterial color="#2c2a32" metalness={0.78} roughness={0.22} />
          </mesh>
        )),
      )}

      {/* Frame tubes secondary to word read — cool-biased continuous glass, NO corner pearls */}
      <NeonTube position={[0, 0.58, 0.18]} args={[3.28, 0.016, 0.016]} color="#44f0ff" intensity={0.52} />
      <NeonTube position={[0, -0.58, 0.18]} args={[3.28, 0.016, 0.016]} color="#e85890" intensity={0.38} />
      <NeonTube position={[-1.64, 0, 0.18]} args={[0.016, 1.12, 0.016]} color="#7088c8" intensity={0.36} />
      <NeonTube position={[1.64, 0, 0.18]} args={[0.016, 1.12, 0.016]} color="#7088c8" intensity={0.36} />
      {/* Mitered corner fillers — short continuous tube stubs (not emissive spheres) */}
      {(
        [
          [-1.64, 0.58, 0.04, 0.04, '#44f0ff'],
          [1.64, 0.58, 0.04, 0.04, '#44f0ff'],
          [-1.64, -0.58, 0.04, 0.04, '#e85890'],
          [1.64, -0.58, 0.04, 0.04, '#e85890'],
        ] as const
      ).map(([x, y, sx, sy, col], i) => (
        <NeonTube
          key={i}
          position={[x, y, 0.18]}
          args={[sx, sy, 0.016]}
          color={col}
          intensity={0.42}
          letterStroke
        />
      ))}

      {/* ═══ GLASS TUBE LETTERFORMS (r32 #11: lean glass hierarchy, no plastic plate) ═══ */}
      <NeonWord
        text="KEVIN'S"
        position={[0, 0.18, 0.2]}
        letterH={0.32}
        letterW={0.308}
        gap={0.038}
        color="#ff8ad4"
        accent="#78f6ff"
        dual
        thickness={0.024}
        intensity={1.42}
      />
      <NeonWord
        text="RAMEN & BOBA"
        position={[0, -0.3, 0.2]}
        letterH={0.21}
        letterW={0.168}
        gap={0.022}
        color="#58faff"
        accent="#f290bc"
        dual
        thickness={0.019}
        intensity={1.36}
      />

      {/* Mount brackets back toward fascia (building) */}
      <mesh position={[-1.2, 0.58, -0.5]}>
        <boxGeometry args={[0.18, 0.1, 0.54]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.68} roughness={0.26} />
      </mesh>
      <mesh position={[1.2, 0.58, -0.5]}>
        <boxGeometry args={[0.18, 0.1, 0.54]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.68} roughness={0.26} />
      </mesh>
      {/* Arms span from marquee back to roof fascia lip (~z 0.78 world) */}
      <mesh position={[-1.2, 0.3, -0.7]}>
        <boxGeometry args={[0.12, 0.12, 1.06]} />
        <meshStandardMaterial color="#1a1820" metalness={0.64} roughness={0.32} />
      </mesh>
      <mesh position={[1.2, 0.3, -0.7]}>
        <boxGeometry args={[0.12, 0.12, 1.06]} />
        <meshStandardMaterial color="#1a1820" metalness={0.64} roughness={0.32} />
      </mesh>
      {/* Lower support rods (enclosure craft — dual-arm hang density) */}
      <mesh position={[-1.2, -0.22, -0.62]}>
        <boxGeometry args={[0.07, 0.07, 0.94]} />
        <meshStandardMaterial color="#16141c" metalness={0.58} roughness={0.36} />
      </mesh>
      <mesh position={[1.2, -0.22, -0.62]}>
        <boxGeometry args={[0.07, 0.07, 0.94]} />
        <meshStandardMaterial color="#16141c" metalness={0.58} roughness={0.36} />
      </mesh>
      {/* Cross brace between arms (enclosure craft — marquee structure) */}
      <mesh position={[0, 0.3, -0.66]}>
        <boxGeometry args={[2.35, 0.055, 0.065]} />
        <meshStandardMaterial color="#141218" metalness={0.56} roughness={0.36} />
      </mesh>
      <mesh position={[0, -0.22, -0.58]}>
        <boxGeometry args={[2.28, 0.04, 0.05]} />
        <meshStandardMaterial color="#121018" metalness={0.52} roughness={0.4} />
      </mesh>
      {/* Diagonal braces (enclosure craft — marquee ≠ floating card) */}
      <mesh position={[-0.55, 0.04, -0.62]} rotation={[0, 0, 0.35]}>
        <boxGeometry args={[0.045, 0.74, 0.045]} />
        <meshStandardMaterial color="#15131a" metalness={0.52} roughness={0.4} />
      </mesh>
      <mesh position={[0.55, 0.04, -0.62]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.045, 0.74, 0.045]} />
        <meshStandardMaterial color="#15131a" metalness={0.52} roughness={0.4} />
      </mesh>
      {/* Fascia contact plates — timber pads (anchors marquee to roof front lip) */}
      <mesh position={[-1.2, 0.3, -1.16]} castShadow>
        <boxGeometry args={[0.3, 0.28, 0.14]} />
        <meshStandardMaterial
          map={backerMap ?? undefined}
          color="#5a3e2c"
          emissive="#2a1810"
          emissiveIntensity={0.12}
          metalness={0.1}
          roughness={0.54}
        />
      </mesh>
      <mesh position={[1.2, 0.3, -1.16]} castShadow>
        <boxGeometry args={[0.3, 0.28, 0.14]} />
        <meshStandardMaterial
          map={backerMap ?? undefined}
          color="#5a3e2c"
          emissive="#2a1810"
          emissiveIntensity={0.12}
          metalness={0.1}
          roughness={0.54}
        />
      </mesh>
      <mesh position={[-1.2, -0.22, -1.08]} castShadow>
        <boxGeometry args={[0.22, 0.18, 0.1]} />
        <meshStandardMaterial
          map={backerMap ?? undefined}
          color="#4a3224"
          metalness={0.1}
          roughness={0.56}
        />
      </mesh>
      <mesh position={[1.2, -0.22, -1.08]} castShadow>
        <boxGeometry args={[0.22, 0.18, 0.1]} />
        <meshStandardMaterial
          map={backerMap ?? undefined}
          color="#4a3224"
          metalness={0.1}
          roughness={0.56}
        />
      </mesh>
      {/* Under-marquee spill — cool-restrained (no cyan wash that flattens noren) */}
      <mesh position={[0, -0.84, -0.32]} rotation={[0.55, 0, 0]}>
        <planeGeometry args={[3.0, 0.7]} />
        <meshBasicMaterial
          color="#58b0c8"
          transparent
          opacity={0.028}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, -0.98, -0.18]} rotation={[0.7, 0, 0]}>
        <planeGeometry args={[2.5, 0.5]} />
        <meshBasicMaterial
          color="#48b0c8"
          transparent
          opacity={0.03}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Front street-face soft glow — very restrained (no plastic panel plate wash) */}
      <mesh position={[0, 0.0, 0.24]}>
        <planeGeometry args={[2.9, 0.95]} />
        <meshBasicMaterial
          color="#68d0e8"
          transparent
          opacity={0.014}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/**
 * Paper lantern — thin paper shell + dim warm core.
 * loop-r31 residual A #2: restrained emissive + small halo so lanterns never
 * form bloom mush beside NeonBrandSign / counter at hero·3Q·leftNeon.
 * Not a solid matte pink Standard sphere.
 */
function PaperLantern({
  position,
  scale = 1,
  hue = '#e8a070',
}: {
  position: [number, number, number]
  scale?: number
  hue?: string
}) {
  return (
    <group position={position} scale={scale}>
      {/* Cord */}
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.42, 6]} />
        <meshStandardMaterial color="#2a1c14" roughness={0.92} />
      </mesh>
      {/* Dim warm core — fill only, not bloom key (r31 A #2) */}
      <mesh scale={[0.58, 0.72, 0.58]}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshBasicMaterial color={hue} toneMapped={false} transparent opacity={0.42} />
      </mesh>
      {/* Thin paper shell — elongated, matte paper not emissive orb */}
      <mesh castShadow scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.145, 28, 20]} />
        <meshPhysicalMaterial
          color={hue}
          emissive={hue}
          emissiveIntensity={0.28}
          roughness={0.86}
          metalness={0}
          transmission={0.22}
          thickness={0.05}
          ior={1.18}
          transparent
          opacity={0.72}
          side={THREE.DoubleSide}
          clearcoat={0.04}
          clearcoatRoughness={0.72}
        />
      </mesh>
      {/* Soft additive halo — tiny, not FOV mush */}
      <mesh scale={[1.18, 1.28, 1.18]} renderOrder={1}>
        <sphereGeometry args={[0.15, 14, 10]} />
        <meshBasicMaterial
          color={hue}
          transparent
          opacity={0.045}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Wood/metal caps */}
      <mesh position={[0, 0.155, 0]}>
        <cylinderGeometry args={[0.042, 0.058, 0.028, 16]} />
        <meshStandardMaterial color="#1a1008" roughness={0.65} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.155, 0]}>
        <cylinderGeometry args={[0.058, 0.042, 0.028, 16]} />
        <meshStandardMaterial color="#1a1008" roughness={0.65} metalness={0.15} />
      </mesh>
      {/* Tassel nub */}
      <mesh position={[0, -0.2, 0]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshStandardMaterial color="#3a2010" roughness={0.7} />
      </mesh>
    </group>
  )
}

/**
 * Counter stool — residual #3: grain variance + varnish/wear maps (not plank lines only).
 * Seat uses counter-family surface maps; legs thicker timber with grain UV.
 */
function Stool({
  position,
  woodMap,
  surfaceAlbedo,
  surfaceRough,
  surfaceClearcoatRough,
}: {
  position: [number, number, number]
  woodMap: THREE.Texture
  surfaceAlbedo: THREE.Texture
  surfaceRough: THREE.Texture
  surfaceClearcoatRough: THREE.Texture
}) {
  // Seat-scale UV clones — tight grain so varnish breakups read on disc tops
  const seatMaps = useMemo(() => {
    const mk = (src: THREE.Texture, rep: number, off: [number, number], aniso = 8) => {
      const t = src.clone()
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(rep, rep)
      t.offset.set(off[0], off[1])
      t.anisotropy = aniso
      t.needsUpdate = true
      return t
    }
    return {
      albedo: mk(surfaceAlbedo, 1.05, [0.18, 0.11]),
      rough: mk(surfaceRough, 1.05, [0.18, 0.11], 4),
      ccr: mk(surfaceClearcoatRough, 1.05, [0.18, 0.11], 2),
    }
  }, [surfaceAlbedo, surfaceRough, surfaceClearcoatRough])
  const legWood = useMemo(() => {
    const t = woodMap.clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = THREE.SRGBColorSpace
    t.repeat.set(0.7, 2.8)
    t.anisotropy = 4
    t.needsUpdate = true
    return t
  }, [woodMap])
  const legRough = useMemo(() => {
    const t = surfaceRough.clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(0.55, 2.2)
    t.anisotropy = 2
    t.needsUpdate = true
    return t
  }, [surfaceRough])

  return (
    <group position={position}>
      {/* Seat disc — worn timber (r31 C #10: not flat toy disc / plastic varnish) */}
      <mesh position={[0, 0.43, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.172, 0.182, 0.078, 28]} />
        <meshPhysicalMaterial
          map={seatMaps.albedo}
          roughnessMap={seatMaps.rough}
          clearcoatRoughnessMap={seatMaps.ccr}
          color="#8a5a34"
          roughness={0.84}
          clearcoat={0.02}
          clearcoatRoughness={0.9}
          metalness={0.015}
          envMapIntensity={0.12}
          sheen={0.12}
          sheenColor="#c0a070"
        />
      </mesh>
      {/* Seat top — multi-scale wear varnish (kill specular hotspot residual #9/#10) */}
      <mesh position={[0, 0.47, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.162, 28]} />
        <meshPhysicalMaterial
          map={seatMaps.albedo}
          roughnessMap={seatMaps.rough}
          clearcoatRoughnessMap={seatMaps.ccr}
          color="#926238"
          roughness={0.86}
          clearcoat={0.018}
          clearcoatRoughness={0.92}
          metalness={0.015}
          envMapIntensity={0.1}
          sheen={0.14}
          sheenColor="#b89868"
        />
      </mesh>
      {/* Micro-wear ring near rim (hand contact — matte breakups) */}
      <mesh position={[0, 0.47, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.155, 28]} />
        <meshStandardMaterial
          map={seatMaps.albedo}
          roughnessMap={seatMaps.rough}
          color="#3a2414"
          roughness={0.94}
          transparent
          opacity={0.52}
          depthWrite={false}
        />
      </mesh>
      {/* Center wear disc — breaks single hot mirror (varnish pool breakup) */}
      <mesh position={[0, 0.471, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.07, 20]} />
        <meshStandardMaterial
          map={seatMaps.albedo}
          color="#6a4428"
          roughness={0.9}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
      {/* Underside seat (darker wood mass / thickness) */}
      <mesh position={[0, 0.392, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.165, 20]} />
        <meshStandardMaterial map={seatMaps.albedo} color="#2a1810" roughness={0.82} />
      </mesh>
      {/* Edge bullnose ring — matte rim catch, not chrome-varnish ring (residual #8) */}
      <mesh position={[0, 0.43, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.168, 0.016, 8, 28]} />
        <meshPhysicalMaterial
          map={seatMaps.albedo}
          roughnessMap={seatMaps.rough}
          color="#5a3820"
          roughness={0.58}
          clearcoat={0.14}
          clearcoatRoughness={0.65}
          envMapIntensity={0.3}
        />
      </mesh>
      {/* Soft leather/foam pad under rim — dark brown, not gray Standard */}
      <mesh position={[0, 0.395, 0]} castShadow>
        <cylinderGeometry args={[0.125, 0.132, 0.032, 24]} />
        <meshPhysicalMaterial
          color="#2a1814"
          roughness={0.55}
          clearcoat={0.25}
          clearcoatRoughness={0.4}
          sheen={0.2}
          sheenColor="#4a3028"
        />
      </mesh>
      {/* Four tapered wood legs — thicker timber silhouette + grain UV */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.4
        return (
          <mesh key={i} position={[Math.cos(a) * 0.1, 0.2, Math.sin(a) * 0.1]} castShadow>
            <cylinderGeometry args={[0.022, 0.032, 0.4, 10]} />
            <meshStandardMaterial
              map={legWood}
              roughnessMap={legRough}
              color="#6a442c"
              roughness={0.52}
              metalness={0.06}
            />
          </mesh>
        )
      })}
      {/* Cross braces (wood density) */}
      {[0, 1].map((i) => {
        const a = (i / 2) * Math.PI + 0.4
        return (
          <mesh
            key={`brace-${i}`}
            position={[0, 0.14, 0]}
            rotation={[0, a, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
            <meshStandardMaterial map={legWood} color="#4a3020" roughness={0.62} />
          </mesh>
        )
      })}
      {/* Chrome foot ring (residual #5 metal — contrast vs wood seat) */}
      <mesh position={[0, 0.028, 0]} receiveShadow castShadow>
        <torusGeometry args={[0.118, 0.014, 8, 28]} />
        <meshStandardMaterial
          color="#c8d4dc"
          metalness={0.94}
          roughness={0.14}
          envMapIntensity={1.65}
        />
      </mesh>
      {/* Dark wood pad under chrome ring (thickness / ground mass) */}
      <mesh position={[0, 0.014, 0]} receiveShadow>
        <cylinderGeometry args={[0.125, 0.135, 0.02, 20]} />
        <meshStandardMaterial map={seatMaps.albedo} color="#2a1810" roughness={0.85} />
      </mesh>
      {/* Contact darkening disc under stool (prop contact residual spirit) */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.19, 20]} />
        <meshBasicMaterial color="#050208" transparent opacity={0.45} depthWrite={false} />
      </mesh>
    </group>
  )
}

/**
 * Full directional signpost — tall pole, twin frosted lanterns, stacked arrow signs.
 * loop-r31 residual A #1+#2 (read/E): r30 leftNeon still buried under bright white
 * frosted orbs. Globes are now tiny paper-frost shells + very dim cores; cross-arm
 * short; pole parked far street-left so marquee + counter stay clear at beauty FOVs.
 */
function SignPost({ position }: { position: [number, number, number] }) {
  const signs = [
    { y: 2.0, label: 'projects', color: '#ff2d6a', yaw: 0.22, w: 0.98 },
    { y: 1.66, label: 'articles', color: '#2dffb0', yaw: -0.38, w: 0.92 },
    { y: 1.32, label: 'about me', color: '#2db0ff', yaw: 0.48, w: 0.96 },
    { y: 0.98, label: 'credits', color: '#ffb02d', yaw: -0.18, w: 0.88 },
  ]
  return (
    <group position={position}>
      {/* Base plate — ground contact */}
      <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.08, 12]} />
        <meshStandardMaterial color="#0e0e14" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Main pole — shorter so lamp heads sit below marquee band */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.044, 0.058, 2.2, 14]} />
        <meshStandardMaterial color="#12121a" metalness={0.55} roughness={0.35} />
      </mesh>
      {/* Cross-arm for twin lamps — short hug so globes never span FOV */}
      <mesh position={[0, 2.18, 0.04]} castShadow>
        <boxGeometry args={[0.52, 0.045, 0.045]} />
        <meshStandardMaterial color="#1a1a24" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Vertical mast extension */}
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.022, 0.026, 0.36, 8]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.5} />
      </mesh>
      {/* Top cap bulb — pinhead frosted shell, not yellow key orb (r31 A #1) */}
      <mesh position={[0, 2.6, 0]}>
        <sphereGeometry args={[0.028, 14, 12]} />
        <meshPhysicalMaterial
          color="#fff4e8"
          emissive="#ffd0a0"
          emissiveIntensity={0.22}
          roughness={0.48}
          metalness={0}
          transmission={0.22}
          thickness={0.03}
          transparent
          opacity={0.72}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <sphereGeometry args={[0.01, 8, 6]} />
        <meshBasicMaterial color="#ffe0b8" toneMapped={false} transparent opacity={0.55} />
      </mesh>
      {/* Twin street lanterns — tiny frosted glass (r31 A #1+#2: no white orb bury) */}
      {(
        [
          [0.22, 2.1, 0.06, '#fff4e8', '#f0c890'],
          [-0.22, 2.1, 0.06, '#f0f4f8', '#c0d8e8'],
        ] as const
      ).map(([lx, ly, lz, shell, core], i) => (
        <group key={i} position={[lx, ly, lz]}>
          {/* Dim core — fill only */}
          <mesh>
            <sphereGeometry args={[0.016, 10, 8]} />
            <meshBasicMaterial color={core} toneMapped={false} transparent opacity={0.5} />
          </mesh>
          {/* Frosted glass sleeve — small silhouette; restrained emissive */}
          <mesh castShadow>
            <sphereGeometry args={[0.042, 18, 14]} />
            <meshPhysicalMaterial
              color={shell}
              emissive={core}
              emissiveIntensity={0.18}
              roughness={0.55}
              metalness={0}
              transmission={0.28}
              thickness={0.04}
              ior={1.32}
              transparent
              opacity={0.72}
              toneMapped={false}
            />
          </mesh>
          {/* Soft outer halo — almost gone (no bloom fuel) */}
          <mesh scale={1.22}>
            <sphereGeometry args={[0.042, 10, 8]} />
            <meshBasicMaterial
              color={core}
              transparent
              opacity={0.035}
              depthWrite={false}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
              side={THREE.BackSide}
            />
          </mesh>
          {/* Stem */}
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.012, 0.016, 0.14, 8]} />
            <meshStandardMaterial color="#2a2a35" metalness={0.5} />
          </mesh>
          {/* Metal collar */}
          <mesh position={[0, -0.03, 0]}>
            <cylinderGeometry args={[0.028, 0.024, 0.02, 10]} />
            <meshStandardMaterial color="#1e1e28" metalness={0.65} roughness={0.32} />
          </mesh>
        </group>
      ))}
      {/* Tech clutter on pole (jesse density) — dim accent, not pink flood */}
      <mesh position={[0.08, 2.32, 0.05]}>
        <boxGeometry args={[0.08, 0.06, 0.05]} />
        <meshStandardMaterial color="#c84868" emissive="#c84868" emissiveIntensity={0.22} toneMapped={false} />
      </mesh>
      <mesh position={[-0.06, 2.28, 0.05]}>
        <boxGeometry args={[0.06, 0.06, 0.05]} />
        <meshStandardMaterial color="#2dffb0" emissive="#2dffb0" emissiveIntensity={0.28} toneMapped={false} />
      </mesh>
      <mesh position={[0.03, 2.48, 0.06]}>
        <boxGeometry args={[0.1, 0.12, 0.03]} />
        <meshStandardMaterial color="#1a2030" emissive="#4080c0" emissiveIntensity={0.2} />
      </mesh>

      {signs.map((s) => (
        <group key={s.label} position={[0.38, s.y, 0]} rotation={[0, s.yaw, 0]}>
          {/* Rounded plate body — ticket-style blade, restrained emissive */}
          <mesh castShadow>
            <boxGeometry args={[s.w * 0.88, 0.16, 0.04]} />
            <meshStandardMaterial
              color={s.color}
              emissive={s.color}
              emissiveIntensity={0.32}
              roughness={0.48}
              metalness={0.08}
              toneMapped={false}
            />
          </mesh>
          {/* Soft chevron tip (smaller, less composition-wrecking) */}
          <mesh position={[s.w * 0.44, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.07, 0.1, 3]} />
            <meshStandardMaterial
              color={s.color}
              emissive={s.color}
              emissiveIntensity={0.28}
              roughness={0.48}
              toneMapped={false}
            />
          </mesh>
          <Text
            position={[0, 0, 0.028]}
            fontSize={0.072}
            color="#0a0610"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            {s.label}
          </Text>
        </group>
      ))}
    </group>
  )
}

/**
 * Shelf bottle — glass shell + colored liquid core (residual #8).
 * Not multicolor solid cylinders.
 */
function CondimentBottle({
  position,
  color,
  height = 0.32,
}: {
  position: [number, number, number]
  color: string
  height?: number
}) {
  const liquidH = height * 0.72
  return (
    <group position={position}>
      {/* Glass shell */}
      <mesh castShadow>
        <cylinderGeometry args={[0.036, 0.04, height, 18]} />
        <meshPhysicalMaterial
          color="#e8f4f8"
          roughness={0.06}
          metalness={0}
          transmission={0.88}
          thickness={0.12}
          ior={1.5}
          transparent
          opacity={0.28}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* Colored liquid core (attenuation read) */}
      <mesh position={[0, -height * 0.08, 0]}>
        <cylinderGeometry args={[0.028, 0.032, liquidH, 14]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.18}
          transmission={0.22}
          thickness={0.35}
          transparent
          opacity={0.92}
          ior={1.38}
          attenuationColor={color}
          attenuationDistance={0.12}
          clearcoat={0.35}
          clearcoatRoughness={0.2}
        />
      </mesh>
      {/* Liquid meniscus disc */}
      <mesh position={[0, liquidH * 0.5 - height * 0.08 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.027, 16]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.08}
          transparent
          opacity={0.55}
          clearcoat={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Neck */}
      <mesh position={[0, height / 2 + 0.02, 0]}>
        <cylinderGeometry args={[0.014, 0.02, 0.045, 12]} />
        <meshPhysicalMaterial
          color="#d8e8f0"
          roughness={0.1}
          transmission={0.7}
          thickness={0.05}
          transparent
          opacity={0.45}
          ior={1.5}
        />
      </mesh>
      {/* Cap */}
      <mesh position={[0, height / 2 + 0.048, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.022, 12]} />
        <meshStandardMaterial color="#1a1410" roughness={0.45} metalness={0.2} />
      </mesh>
    </group>
  )
}

function AFrameChalkboard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, -0.5, 0]}>
      <mesh position={[-0.14, 0.4, 0]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[0.055, 0.95, 0.055]} />
        <meshStandardMaterial color="#3a2818" roughness={0.75} />
      </mesh>
      <mesh position={[0.14, 0.4, 0]} rotation={[0, 0, -0.2]} castShadow>
        <boxGeometry args={[0.055, 0.95, 0.055]} />
        <meshStandardMaterial color="#3a2818" roughness={0.75} />
      </mesh>
      {/* Board face */}
      <mesh position={[0, 0.58, 0.06]} castShadow>
        <boxGeometry args={[0.62, 0.78, 0.04]} />
        <meshStandardMaterial color="#1a2420" roughness={0.95} />
      </mesh>
      {/* Wood frame */}
      <mesh position={[0, 0.58, 0.04]}>
        <boxGeometry args={[0.68, 0.84, 0.02]} />
        <meshStandardMaterial color="#4a3018" roughness={0.7} />
      </mesh>
      {/* Chalk art — ramen doodle */}
      <mesh position={[0, 0.72, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.012, 8, 24, Math.PI]} />
        <meshBasicMaterial color="#e8f0e0" />
      </mesh>
      <mesh position={[-0.04, 0.8, 0.09]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
        <meshBasicMaterial color="#e8f0e0" />
      </mesh>
      <mesh position={[0.04, 0.8, 0.09]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
        <meshBasicMaterial color="#e8f0e0" />
      </mesh>
      <Text position={[0, 0.5, 0.09]} fontSize={0.065} color="#f0e6d0" anchorX="center">
        OPEN LATE
      </Text>
      <Text position={[0, 0.35, 0.09]} fontSize={0.045} color="#c8e6c0" anchorX="center" maxWidth={0.5}>
        click a dish · 夜
      </Text>
    </group>
  )
}

/**
 * Floor plank maps (loop-r13 residual #2) — night-market timber that SURVIVES warm key.
 * Prior maps were RGB~22–30 crushed by #1c1412 mesh tint → muddy black plastic.
 * Albedo: mid-warm oak planks with value breaks; roughness: worn matte + seam grit.
 */
function makeFloorTileMaps(): {
  albedo: THREE.CanvasTexture
  roughness: THREE.CanvasTexture
} {
  const size = 512
  const aCanvas = document.createElement('canvas')
  aCanvas.width = aCanvas.height = size
  const aCtx = aCanvas.getContext('2d')!
  aCtx.fillStyle = '#2a1c16'
  aCtx.fillRect(0, 0, size, size)
  const plankH = size / 8
  // Per-plank base values mid enough to read under night key (not mud)
  const plankBases = [
    [78, 52, 36],
    [92, 62, 42],
    [68, 46, 32],
    [86, 58, 38],
    [74, 50, 34],
    [98, 66, 44],
    [70, 48, 34],
    [84, 56, 40],
  ]
  for (let row = 0; row < 8; row++) {
    const y = row * plankH
    const [br, bg, bb] = plankBases[row]
    // Board body with slight horizontal value gradient (board crown)
    const body = aCtx.createLinearGradient(0, y, 0, y + plankH)
    body.addColorStop(0, `rgb(${br - 10},${bg - 8},${bb - 6})`)
    body.addColorStop(0.45, `rgb(${br + 12},${bg + 8},${bb + 4})`)
    body.addColorStop(1, `rgb(${br - 6},${bg - 4},${bb - 4})`)
    aCtx.fillStyle = body
    aCtx.fillRect(0, y, size, plankH - 3)
    // Dark grout / board seam (construction tell vs plastic slab)
    aCtx.fillStyle = 'rgba(12,8,6,0.92)'
    aCtx.fillRect(0, y + plankH - 3, size, 3)
    aCtx.fillStyle = 'rgba(48,32,22,0.35)'
    aCtx.fillRect(0, y + plankH - 4, size, 1)
    // Staggered end joints
    const jointX = ((row % 2) * 0.38 + 0.16) * size
    aCtx.fillStyle = 'rgba(10,6,4,0.88)'
    aCtx.fillRect(jointX, y, 3, plankH - 3)
    aCtx.fillStyle = 'rgba(110,80,50,0.18)'
    aCtx.fillRect(jointX + 3, y, 1.5, plankH - 3)
    // Authored grain streaks (readable at beauty FOV)
    for (let i = 0; i < 10; i++) {
      const yy = y + 3 + Math.random() * (plankH - 8)
      const dark = Math.random() > 0.35
      aCtx.strokeStyle = dark
        ? `rgba(${28 + Math.random() * 22},${16 + Math.random() * 12},${8},${0.28 + Math.random() * 0.32})`
        : `rgba(${150 + Math.random() * 40},${110 + Math.random() * 30},${70},${0.14 + Math.random() * 0.18})`
      aCtx.lineWidth = 0.9 + Math.random() * 2.4
      aCtx.beginPath()
      aCtx.moveTo(0, yy)
      for (let x = 0; x <= size; x += 6) {
        aCtx.lineTo(x, yy + Math.sin(x * 0.028 + row + i) * 2.4 + Math.sin(x * 0.07) * 1.1)
      }
      aCtx.stroke()
    }
    // Knot rings (oak character, sparse)
    if (row % 2 === 0) {
      const cx = 40 + ((row * 97) % (size - 80))
      const cy = y + plankH * 0.45
      for (let k = 0; k < 4; k++) {
        aCtx.strokeStyle = `rgba(30,16,8,${0.12 + k * 0.04})`
        aCtx.lineWidth = 1.1
        aCtx.beginPath()
        aCtx.ellipse(cx, cy, 6 + k * 2.8, (6 + k * 2.8) * 0.45, 0.3, 0, Math.PI * 2)
        aCtx.stroke()
      }
    }
  }
  // Foot-traffic scuffs / lighter wear (front half of UV more worn)
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    aCtx.fillStyle = `rgba(${90 + Math.random() * 50},${60 + Math.random() * 30},${35},${0.1 + Math.random() * 0.16})`
    aCtx.fillRect(x, y, 6 + Math.random() * 28, 1.5 + Math.random() * 4)
  }
  // Dust / grit flecks
  for (let i = 0; i < 2200; i++) {
    const v = 40 + Math.floor(Math.random() * 90)
    aCtx.fillStyle = `rgba(${v},${v * 0.75},${v * 0.5},0.06)`
    aCtx.fillRect(Math.random() * size, Math.random() * size, 1.2, 1)
  }

  // loop-r21 residual #9 (C): matte-dominant floor — kill stretched specular streaks under key
  let rSeed = 0x666c6f72 // 'flor'
  const rndR = () => {
    rSeed = (rSeed * 1664525 + 1013904223) >>> 0
    return rSeed / 0x100000000
  }
  const rCanvas = document.createElement('canvas')
  rCanvas.width = rCanvas.height = size
  const rCtx = rCanvas.getContext('2d')!
  // loop-r23 residual #3: very high base = rough matte timber (kill strip-hot floor under keys)
  rCtx.fillStyle = '#e8e2d8'
  rCtx.fillRect(0, 0, size, size)
  for (let row = 0; row < 8; row++) {
    const y = row * plankH
    // Soft per-board variance only — NO continuous dark center strip
    rCtx.fillStyle = `rgba(${210 + rndR() * 35},${200 + rndR() * 25},${185},${0.3 + rndR() * 0.22})`
    rCtx.fillRect(0, y, size, plankH - 3)
    // Rough seams (lighter = matte)
    rCtx.fillStyle = 'rgba(245,238,225,0.92)'
    rCtx.fillRect(0, y + plankH - 3, size, 3)
  }
  // Sparse micro polish islands only (tiny — never full-width streaks)
  for (let i = 0; i < 12; i++) {
    const cx = 20 + rndR() * (size - 40)
    const cy = rndR() * size
    const rx = 2 + rndR() * 7
    const ry = 1.5 + rndR() * 4
    const g = rCtx.createRadialGradient(cx, cy, 1, cx, cy, rx)
    g.addColorStop(0, `rgba(70,62,52,${0.12 + rndR() * 0.1})`)
    g.addColorStop(1, 'rgba(180,170,160,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.ellipse(cx, cy, rx, ry, rndR() * Math.PI, 0, Math.PI * 2)
    rCtx.fill()
  }
  // Heavy foot-traffic matte (breaks any residual gloss continuity)
  for (let i = 0; i < 55; i++) {
    const cx = rndR() * size
    const cy = rndR() * size
    const rx = 12 + rndR() * 48
    const g = rCtx.createRadialGradient(cx, cy, 1, cx, cy, rx)
    g.addColorStop(0, `rgba(240,232,218,${0.5 + rndR() * 0.4})`)
    g.addColorStop(1, 'rgba(200,190,175,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.ellipse(cx, cy, rx, rx * 0.5, rndR() * Math.PI, 0, Math.PI * 2)
    rCtx.fill()
  }
  for (let i = 0; i < 180; i++) {
    rCtx.fillStyle = `rgba(${200 + rndR() * 40},${190 + rndR() * 30},${170},${0.22})`
    rCtx.fillRect(rndR() * size, rndR() * size, 2 + rndR() * 12, 1 + rndR() * 3)
  }
  for (let i = 0; i < 9000; i++) {
    const v = 140 + Math.floor(rndR() * 90)
    rCtx.fillStyle = `rgba(${v},${v},${v * 0.95},0.06)`
    rCtx.fillRect(rndR() * size, rndR() * size, 1.2, 1)
  }

  const albedo = new THREE.CanvasTexture(aCanvas)
  albedo.colorSpace = THREE.SRGBColorSpace
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping
  // Tighter Y tiles so planks resolve without UV stretch streaks
  albedo.repeat.set(2.2, 2.8)
  albedo.anisotropy = 8
  albedo.needsUpdate = true

  const roughness = new THREE.CanvasTexture(rCanvas)
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping
  roughness.repeat.set(2.2, 2.8)
  roughness.anisotropy = 4
  roughness.needsUpdate = true

  return { albedo, roughness }
}

/**
 * Night-market street asphalt (loop-r25 residual #1 A).
 * Prior street pad reused warm wood plank UVs under a cool tint → flat gray stage void.
 * Dedicated cool asphalt midtones + grit + tar patches so three-quarter ground sells
 * night street, not studio floor.
 */
function makeStreetAsphaltMaps(): {
  albedo: THREE.CanvasTexture
  roughness: THREE.CanvasTexture
} {
  const size = 512
  let seed = 0x61736674 // 'asft'
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0x100000000
  }
  const aCanvas = document.createElement('canvas')
  aCanvas.width = aCanvas.height = size
  const aCtx = aCanvas.getContext('2d')!
  // Cool night asphalt base — r27 residual #1 A: darker mids so ground ≠ blown gray stage
  aCtx.fillStyle = '#2e3a48'
  aCtx.fillRect(0, 0, size, size)
  // Soft large-scale value clouds (asphalt wear — restrained lift, night midtones)
  for (let i = 0; i < 28; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const rx = 40 + rnd() * 120
    const g = aCtx.createRadialGradient(cx, cy, 4, cx, cy, rx)
    const lift = rnd() > 0.5
    g.addColorStop(
      0,
      lift
        ? `rgba(${70 + rnd() * 35},${82 + rnd() * 30},${98 + rnd() * 28},${0.14 + rnd() * 0.18})`
        : `rgba(${18 + rnd() * 14},${22 + rnd() * 12},${28 + rnd() * 14},${0.22 + rnd() * 0.28})`,
    )
    g.addColorStop(1, 'rgba(40,50,62,0)')
    aCtx.fillStyle = g
    aCtx.beginPath()
    aCtx.ellipse(cx, cy, rx, rx * (0.55 + rnd() * 0.5), rnd() * Math.PI, 0, Math.PI * 2)
    aCtx.fill()
  }
  // Aggregate grit flecks (reads at beauty FOV as asphalt, not painted plane)
  for (let i = 0; i < 9000; i++) {
    const v = 40 + Math.floor(rnd() * 75)
    const cool = rnd() > 0.35
    aCtx.fillStyle = cool
      ? `rgba(${v * 0.72},${v * 0.82},${v},${0.09 + rnd() * 0.11})`
      : `rgba(${v},${v * 0.88},${v * 0.72},${0.07 + rnd() * 0.08})`
    aCtx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2.2, 1 + rnd() * 1.6)
  }
  // Tar seams / expansion joints (street construction tell vs stage disc)
  for (let i = 0; i < 7; i++) {
    const y = (0.12 + i * 0.12 + rnd() * 0.04) * size
    aCtx.strokeStyle = `rgba(18,20,26,${0.45 + rnd() * 0.3})`
    aCtx.lineWidth = 2 + rnd() * 3.5
    aCtx.beginPath()
    aCtx.moveTo(0, y)
    for (let x = 0; x <= size; x += 8) {
      aCtx.lineTo(x, y + Math.sin(x * 0.02 + i) * 3.5 + Math.sin(x * 0.055) * 1.5)
    }
    aCtx.stroke()
    aCtx.strokeStyle = `rgba(95,105,120,${0.12 + rnd() * 0.1})`
    aCtx.lineWidth = 1
    aCtx.beginPath()
    aCtx.moveTo(0, y + 2)
    for (let x = 0; x <= size; x += 10) {
      aCtx.lineTo(x, y + 2 + Math.sin(x * 0.02 + i) * 3)
    }
    aCtx.stroke()
  }
  // Cross joints
  for (let i = 0; i < 5; i++) {
    const x = (0.15 + i * 0.18 + rnd() * 0.05) * size
    aCtx.strokeStyle = `rgba(16,18,24,${0.4 + rnd() * 0.25})`
    aCtx.lineWidth = 1.5 + rnd() * 2.5
    aCtx.beginPath()
    aCtx.moveTo(x, 0)
    for (let y = 0; y <= size; y += 10) {
      aCtx.lineTo(x + Math.sin(y * 0.018 + i) * 2.5, y)
    }
    aCtx.stroke()
  }
  // Oil / wet sheen patches (dark cool, sparse)
  for (let i = 0; i < 14; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const rx = 12 + rnd() * 40
    const g = aCtx.createRadialGradient(cx, cy, 1, cx, cy, rx)
    g.addColorStop(0, `rgba(22,28,38,${0.35 + rnd() * 0.3})`)
    g.addColorStop(0.55, `rgba(40,50,65,${0.12 + rnd() * 0.1})`)
    g.addColorStop(1, 'rgba(60,70,85,0)')
    aCtx.fillStyle = g
    aCtx.beginPath()
    aCtx.ellipse(cx, cy, rx, rx * 0.55, rnd() * Math.PI, 0, Math.PI * 2)
    aCtx.fill()
  }
  // Cool bounce midtone lift islands — sparse edge fill, not full-stage gray wash
  for (let i = 0; i < 14; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const rx = 18 + rnd() * 48
    const g = aCtx.createRadialGradient(cx, cy, 2, cx, cy, rx)
    g.addColorStop(0, `rgba(${85 + rnd() * 28},${100 + rnd() * 22},${120 + rnd() * 22},${0.1 + rnd() * 0.1})`)
    g.addColorStop(1, 'rgba(50,62,78,0)')
    aCtx.fillStyle = g
    aCtx.beginPath()
    aCtx.ellipse(cx, cy, rx, rx * 0.6, rnd() * Math.PI, 0, Math.PI * 2)
    aCtx.fill()
  }

  // Roughness: mostly matte asphalt, sparse wet oil (darker = smoother)
  const rCanvas = document.createElement('canvas')
  rCanvas.width = rCanvas.height = size
  const rCtx = rCanvas.getContext('2d')!
  rCtx.fillStyle = '#d8d4cc'
  rCtx.fillRect(0, 0, size, size)
  for (let i = 0; i < 40; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const rx = 8 + rnd() * 35
    const g = rCtx.createRadialGradient(cx, cy, 1, cx, cy, rx)
    g.addColorStop(0, `rgba(${50 + rnd() * 40},${48 + rnd() * 35},${45},${0.35 + rnd() * 0.35})`)
    g.addColorStop(1, 'rgba(200,195,185,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.ellipse(cx, cy, rx, rx * 0.5, rnd() * Math.PI, 0, Math.PI * 2)
    rCtx.fill()
  }
  for (let i = 0; i < 5000; i++) {
    const v = 160 + Math.floor(rnd() * 70)
    rCtx.fillStyle = `rgba(${v},${v},${v * 0.95},0.07)`
    rCtx.fillRect(rnd() * size, rnd() * size, 1.2, 1)
  }

  const albedo = new THREE.CanvasTexture(aCanvas)
  albedo.colorSpace = THREE.SRGBColorSpace
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping
  albedo.repeat.set(3.4, 3.4)
  albedo.anisotropy = 8
  albedo.needsUpdate = true

  const roughness = new THREE.CanvasTexture(rCanvas)
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping
  roughness.repeat.set(3.4, 3.4)
  roughness.anisotropy = 4
  roughness.needsUpdate = true

  return { albedo, roughness }
}

/**
 * Soft radial ground-bounce disc (no hard ringGeometry edge = stage tell).
 * loop-r25 residual #1 (A): cool night fill without concentric cyan studio rings.
 */
function makeSoftGroundWashMap(rgb: [number, number, number]): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const [r, g, b] = rgb
  const cx = size * 0.5
  const cy = size * 0.5
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / cx
      const dy = (y - cy) / cy
      // Slightly elliptical so it reads apron not perfect stage disc
      const rr = Math.sqrt(dx * dx * 1.05 + dy * dy * 0.92)
      const fall = Math.exp(-rr * rr * 2.4) * (1 - Math.pow(Math.min(1, rr), 1.6))
      const a = Math.max(0, Math.min(1, fall))
      const i = (y * size + x) * 4
      img.data[i] = r
      img.data[i + 1] = g
      img.data[i + 2] = b
      img.data[i + 3] = Math.floor(a * 255)
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

/**
 * Booth leather maps (loop-r14 residual #2) — tufted upholstery that survives night key.
 * Flat #5a2438 Physical alone crushed to black plastic; authored diamond tufts +
 * mid-warm oxblood so grain/tuft read under warm key without plastic sheen soup.
 */
function makeLeatherTuftMaps(): {
  albedo: THREE.CanvasTexture
  roughness: THREE.CanvasTexture
} {
  const size = 512
  const aCanvas = document.createElement('canvas')
  aCanvas.width = aCanvas.height = size
  const aCtx = aCanvas.getContext('2d')!
  // loop-r27 residual #3 (A): deep oxblood night fabric — not candy-pink plastic maroon
  aCtx.fillStyle = '#3a1824'
  aCtx.fillRect(0, 0, size, size)
  // Soft body gradient (cushion crown — fabric pile lift, cool wine not hot pink)
  const body = aCtx.createRadialGradient(size * 0.5, size * 0.45, 20, size * 0.5, size * 0.5, size * 0.72)
  body.addColorStop(0, 'rgba(95,42,55,0.45)')
  body.addColorStop(0.55, 'rgba(58,22,34,0.28)')
  body.addColorStop(1, 'rgba(22,8,14,0.55)')
  aCtx.fillStyle = body
  aCtx.fillRect(0, 0, size, size)
  // Fabric nap / micro-fiber direction (kills plastic leather slab)
  for (let i = 0; i < 180; i++) {
    const y = Math.random() * size
    aCtx.strokeStyle = `rgba(${55 + Math.random() * 40},${22 + Math.random() * 18},${30 + Math.random() * 22},${0.04 + Math.random() * 0.06})`
    aCtx.lineWidth = 0.6 + Math.random() * 1.4
    aCtx.beginPath()
    aCtx.moveTo(0, y)
    for (let x = 0; x <= size; x += 6) {
      aCtx.lineTo(x, y + Math.sin(x * 0.05 + i) * 1.8)
    }
    aCtx.stroke()
  }
  // Leather/fabric grain noise
  for (let i = 0; i < 4800; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const v = 12 + Math.random() * 32
    aCtx.fillStyle = `rgba(${v + 28},${v * 0.28},${v * 0.35},${0.04 + Math.random() * 0.08})`
    aCtx.fillRect(x, y, 1 + Math.random() * 2.2, 1 + Math.random() * 2.2)
  }
  // Diamond tuft channels (stitch valleys)
  const cols = 4
  const rows = 3
  const cellW = size / cols
  const cellH = size / rows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) * cellW
      const cy = (r + 0.5) * cellH
      // Valley to button
      const g = aCtx.createRadialGradient(cx, cy, 2, cx, cy, cellW * 0.42)
      g.addColorStop(0, 'rgba(28,8,14,0.78)')
      g.addColorStop(0.35, 'rgba(70,24,40,0.35)')
      g.addColorStop(1, 'rgba(90,36,55,0)')
      aCtx.fillStyle = g
      aCtx.beginPath()
      aCtx.ellipse(cx, cy, cellW * 0.42, cellH * 0.4, 0, 0, Math.PI * 2)
      aCtx.fill()
      // Highlight pillows between tufts — deep wine, not candy pink
      const hx = cx + cellW * 0.22
      const hy = cy - cellH * 0.18
      const hg = aCtx.createRadialGradient(hx, hy, 1, hx, hy, cellW * 0.28)
      hg.addColorStop(0, 'rgba(110,55,70,0.38)')
      hg.addColorStop(1, 'rgba(70,32,48,0)')
      aCtx.fillStyle = hg
      aCtx.beginPath()
      aCtx.ellipse(hx, hy, cellW * 0.26, cellH * 0.22, -0.4, 0, Math.PI * 2)
      aCtx.fill()
      // Button core
      aCtx.fillStyle = 'rgba(16,4,10,0.94)'
      aCtx.beginPath()
      aCtx.arc(cx, cy, 7, 0, Math.PI * 2)
      aCtx.fill()
      aCtx.strokeStyle = 'rgba(90,45,58,0.5)'
      aCtx.lineWidth = 1.5
      aCtx.beginPath()
      aCtx.arc(cx, cy, 5, 0, Math.PI * 2)
      aCtx.stroke()
    }
  }
  // Diamond stitch lines
  aCtx.strokeStyle = 'rgba(30,10,16,0.45)'
  aCtx.lineWidth = 1.4
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = c * cellW
      const y0 = r * cellH
      aCtx.beginPath()
      aCtx.moveTo(x0, y0)
      aCtx.lineTo(x0 + cellW * 0.5, y0 + (r < rows ? cellH * 0.5 : -cellH * 0.5))
      aCtx.lineTo(x0 + cellW, y0)
      aCtx.stroke()
    }
  }
  // Soft edge wear (darken perimeter — contact / age)
  const edge = aCtx.createLinearGradient(0, 0, 0, size)
  edge.addColorStop(0, 'rgba(20,6,12,0.4)')
  edge.addColorStop(0.12, 'rgba(20,6,12,0)')
  edge.addColorStop(0.88, 'rgba(20,6,12,0)')
  edge.addColorStop(1, 'rgba(16,4,10,0.5)')
  aCtx.fillStyle = edge
  aCtx.fillRect(0, 0, size, size)

  // Roughness: soft sheen in pillow peaks, matte in tuft valleys
  const rCanvas = document.createElement('canvas')
  rCanvas.width = rCanvas.height = size
  const rCtx = rCanvas.getContext('2d')!
  rCtx.fillStyle = '#9a9088'
  rCtx.fillRect(0, 0, size, size)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) * cellW
      const cy = (r + 0.5) * cellH
      // Valley matte (light = rough)
      const g = rCtx.createRadialGradient(cx, cy, 2, cx, cy, cellW * 0.4)
      g.addColorStop(0, 'rgba(220,210,200,0.85)')
      g.addColorStop(0.45, 'rgba(180,170,160,0.35)')
      g.addColorStop(1, 'rgba(120,110,100,0)')
      rCtx.fillStyle = g
      rCtx.beginPath()
      rCtx.ellipse(cx, cy, cellW * 0.4, cellH * 0.38, 0, 0, Math.PI * 2)
      rCtx.fill()
      // Pillow soft sheen (dark = smooth)
      const hx = cx + cellW * 0.2
      const hy = cy - cellH * 0.16
      const sg = rCtx.createRadialGradient(hx, hy, 1, hx, hy, cellW * 0.24)
      sg.addColorStop(0, 'rgba(28,24,22,0.7)')
      sg.addColorStop(1, 'rgba(80,70,60,0)')
      rCtx.fillStyle = sg
      rCtx.beginPath()
      rCtx.ellipse(hx, hy, cellW * 0.22, cellH * 0.18, -0.4, 0, Math.PI * 2)
      rCtx.fill()
    }
  }

  const albedo = new THREE.CanvasTexture(aCanvas)
  albedo.colorSpace = THREE.SRGBColorSpace
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping
  albedo.repeat.set(1.15, 0.95)
  albedo.anisotropy = 8
  albedo.needsUpdate = true

  const roughness = new THREE.CanvasTexture(rCanvas)
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping
  roughness.repeat.set(1.15, 0.95)
  roughness.anisotropy = 4
  roughness.needsUpdate = true

  return { albedo, roughness }
}

/**
 * Wall plaster maps (loop-r16 residual #8) — night-stall painted timber/plaster.
 * Kill near-black untextured slabs: lifted midtones, clapboard bands, scuffs, grit.
 * Optional photo wallMap boosts character when available.
 */
function makeWallPlasterMaps(wallMap: THREE.Texture): {
  albedo: THREE.CanvasTexture
  roughness: THREE.CanvasTexture
} {
  // Deterministic PRNG — stable across HMR (no flicker)
  let seed = 0x7368656c // 'shel'
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0x100000000
  }
  const size = 512
  const aCanvas = document.createElement('canvas')
  aCanvas.width = aCanvas.height = size
  const aCtx = aCanvas.getContext('2d')!
  const src = wallMap.image as CanvasImageSource | undefined
  if (src && (src as HTMLImageElement).width) {
    aCtx.drawImage(src, 0, 0, size, size)
  } else {
    // Authored base — warm painted night stall (not pure black)
    aCtx.fillStyle = '#5c4254'
    aCtx.fillRect(0, 0, size, size)
  }
  // Aggressive mid lift so exterior survives underexposure (residual #8 near-black slabs)
  const img = aCtx.getImageData(0, 0, size, size)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.sin(i * 0.0017) * 0.5 + 0.5) * 34
    const n2 = (Math.sin(i * 0.0009 + 1.7) * 0.5 + 0.5) * 18
    // Warm plum-brown night paint — readable midtones under beauty key
    d[i] = Math.max(0, Math.min(255, d[i] * 0.78 + 52 + n + n2 * 0.45))
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] * 0.68 + 36 + n * 0.6))
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] * 0.82 + 48 + n * 0.45 + n2 * 0.35))
  }
  aCtx.putImageData(img, 0, 0)
  // Horizontal clapboard / painted timber board bands (stall cladding tell at beauty FOV)
  for (let b = 0; b < 11; b++) {
    const y = (b / 11) * size + (rnd() - 0.5) * 4
    const bandH = size / 11
    // Board face mid lift
    aCtx.fillStyle = `rgba(${88 + rnd() * 28},${58 + rnd() * 18},${72 + rnd() * 22},${0.1 + rnd() * 0.1})`
    aCtx.fillRect(0, y, size, bandH * 0.72)
    // Shadow groove under each board
    aCtx.fillStyle = `rgba(22,12,18,${0.22 + rnd() * 0.14})`
    aCtx.fillRect(0, y + bandH * 0.78, size, 2.4)
    // Soft highlight lip on board top
    aCtx.fillStyle = `rgba(${130 + rnd() * 30},${90 + rnd() * 20},${105 + rnd() * 25},${0.08 + rnd() * 0.08})`
    aCtx.fillRect(0, y + 1, size, 1.6)
  }
  // Large value blotches (painted plaster variation — readable at beauty FOV)
  for (let i = 0; i < 34; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const r = 28 + rnd() * 95
    const g = aCtx.createRadialGradient(cx, cy, 2, cx, cy, r)
    const lite = rnd() > 0.38
    g.addColorStop(
      0,
      lite
        ? `rgba(${110 + rnd() * 50},${70 + rnd() * 30},${88 + rnd() * 35},${0.18 + rnd() * 0.16})`
        : `rgba(${32 + rnd() * 22},${18 + rnd() * 14},${34 + rnd() * 18},${0.16 + rnd() * 0.14})`,
    )
    g.addColorStop(1, 'rgba(50,34,48,0)')
    aCtx.fillStyle = g
    aCtx.beginPath()
    aCtx.arc(cx, cy, r, 0, Math.PI * 2)
    aCtx.fill()
  }
  // Hairline cracks / plaster texture
  for (let i = 0; i < 42; i++) {
    aCtx.strokeStyle = `rgba(18,10,20,${0.1 + rnd() * 0.16})`
    aCtx.lineWidth = 0.8 + rnd() * 1.4
    aCtx.beginPath()
    const x0 = rnd() * size
    const y0 = rnd() * size
    aCtx.moveTo(x0, y0)
    aCtx.bezierCurveTo(
      x0 + (rnd() - 0.5) * 90,
      y0 + (rnd() - 0.5) * 90,
      x0 + (rnd() - 0.5) * 140,
      y0 + (rnd() - 0.5) * 140,
      x0 + (rnd() - 0.5) * 180,
      y0 + (rnd() - 0.5) * 180,
    )
    aCtx.stroke()
  }
  // Peeling paint chips / scuff highlights (edge wear interest)
  for (let i = 0; i < 28; i++) {
    const x = rnd() * size
    const y = rnd() * size
    aCtx.fillStyle = `rgba(${130 + rnd() * 55},${85 + rnd() * 35},${100 + rnd() * 40},${0.14 + rnd() * 0.16})`
    aCtx.beginPath()
    aCtx.ellipse(x, y, 4 + rnd() * 14, 2 + rnd() * 6, rnd() * Math.PI, 0, Math.PI * 2)
    aCtx.fill()
  }
  // Fine grit noise
  for (let i = 0; i < 5200; i++) {
    const v = (rnd() - 0.5) * 40
    aCtx.fillStyle = `rgba(${95 + v},${65 + v * 0.6},${80 + v * 0.8},0.055)`
    aCtx.fillRect(rnd() * size, rnd() * size, 1.3, 1.2)
  }

  const rCanvas = document.createElement('canvas')
  rCanvas.width = rCanvas.height = size
  const rCtx = rCanvas.getContext('2d')!
  rCtx.fillStyle = '#b8b0a8' // painted plaster — mostly matte
  rCtx.fillRect(0, 0, size, size)
  // Board-edge roughness grooves (matte seams between clapboards)
  for (let b = 0; b < 11; b++) {
    const y = (b / 11) * size
    rCtx.fillStyle = 'rgba(210,200,190,0.55)'
    rCtx.fillRect(0, y + size / 11 * 0.78, size, 3)
    rCtx.fillStyle = 'rgba(70,65,60,0.35)'
    rCtx.fillRect(0, y + 2, size, size / 11 * 0.55)
  }
  for (let i = 0; i < 60; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const r = 14 + rnd() * 55
    const g = rCtx.createRadialGradient(cx, cy, 1, cx, cy, r)
    // Slight sheen patches (older paint)
    g.addColorStop(0, `rgba(${70 + rnd() * 40},${65},${60},${0.4})`)
    g.addColorStop(1, 'rgba(160,150,140,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.arc(cx, cy, r, 0, Math.PI * 2)
    rCtx.fill()
  }
  // Matte wear / chalky patches
  for (let i = 0; i < 28; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const r = 10 + rnd() * 40
    const g = rCtx.createRadialGradient(cx, cy, 1, cx, cy, r)
    g.addColorStop(0, `rgba(220,210,200,${0.35 + rnd() * 0.3})`)
    g.addColorStop(1, 'rgba(180,170,160,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.arc(cx, cy, r, 0, Math.PI * 2)
    rCtx.fill()
  }
  for (let i = 0; i < 7000; i++) {
    const v = 140 + Math.floor(rnd() * 80)
    rCtx.fillStyle = `rgba(${v},${v - 5},${v - 10},0.08)`
    rCtx.fillRect(rnd() * size, rnd() * size, 1.5, 1.2)
  }

  const albedo = new THREE.CanvasTexture(aCanvas)
  albedo.colorSpace = THREE.SRGBColorSpace
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping
  albedo.repeat.set(1.6, 2.2)
  albedo.anisotropy = 8
  albedo.needsUpdate = true

  const roughness = new THREE.CanvasTexture(rCanvas)
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping
  roughness.repeat.set(1.6, 2.2)
  roughness.anisotropy = 4
  roughness.needsUpdate = true

  return { albedo, roughness }
}

/**
 * Exterior clapboard timber — residual #12 loop-r18.
 * Multi-scale wear (board grooves + grain + peeling paint + scuffs) so side walls
 * sell under night key instead of underexposed purple slabs.
 */
function makeExteriorSidingMaps(woodMap: THREE.Texture): {
  albedo: THREE.CanvasTexture
  roughness: THREE.CanvasTexture
} {
  // loop-r19 residual #12 / shell (C)+(A): multi-scale clapboard wear that survives night key
  // (uniform grain + underexposure hid prior maps — lift midtones, board-to-board variance,
  // nail rows, end joints, grey weather vs fresh timber, roughness roughness breakup).
  let seed = 0x73696465 // 'side'
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0x100000000
  }
  const size = 512
  const aCanvas = document.createElement('canvas')
  aCanvas.width = aCanvas.height = size
  const aCtx = aCanvas.getContext('2d')!
  const src = woodMap.image as CanvasImageSource | undefined
  if (src && (src as HTMLImageElement).width) {
    aCtx.drawImage(src, 0, 0, size, size)
  } else {
    aCtx.fillStyle = '#7a5840'
    aCtx.fillRect(0, 0, size, size)
  }
  // loop-r20 residual #1+#13 (A)+(C): stronger midtone lift so night void doesn't crush siding
  const img = aCtx.getImageData(0, 0, size, size)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.sin(i * 0.0011) * 0.5 + 0.5) * 42
    const n2 = (Math.sin(i * 0.00037 + 1.7) * 0.5 + 0.5) * 22
    d[i] = Math.max(0, Math.min(255, d[i] * 0.82 + 78 + n + n2 * 0.45))
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] * 0.72 + 52 + n * 0.58 + n2 * 0.28))
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] * 0.55 + 32 + n * 0.35))
  }
  aCtx.putImageData(img, 0, 0)

  // Horizontal clapboard bands — per-board albedo variance (multi-scale wear tell)
  const boardCount = 12
  for (let b = 0; b < boardCount; b++) {
    const y = (b / boardCount) * size
    const bandH = size / boardCount
    // Board-to-board warm/cool/weathered shift
    const hueShift = rnd()
    const baseR = hueShift > 0.55 ? 95 + rnd() * 55 : hueShift > 0.25 ? 70 + rnd() * 40 : 55 + rnd() * 30
    const baseG = baseR * (0.55 + rnd() * 0.18)
    const baseB = baseR * (0.32 + rnd() * 0.14)
    aCtx.fillStyle = `rgba(${baseR + 30},${baseG},${baseB},${0.14 + rnd() * 0.16})`
    aCtx.fillRect(0, y + 1, size, bandH * 0.78)
    // Top catch light edge (bevel read)
    aCtx.fillStyle = `rgba(${160 + rnd() * 40},${120 + rnd() * 25},${80},${0.14 + rnd() * 0.1})`
    aCtx.fillRect(0, y + 1, size, 2.2)
    // Deep groove shadow under each board
    aCtx.fillStyle = `rgba(12,6,4,${0.38 + rnd() * 0.2})`
    aCtx.fillRect(0, y + bandH * 0.86, size, 4.2)
    // Secondary groove darken
    aCtx.fillStyle = `rgba(28,14,8,${0.18 + rnd() * 0.12})`
    aCtx.fillRect(0, y + bandH * 0.78, size, 2)
  }

  // Vertical butt joints / end-grain seams (breaks continuous strip read)
  for (let j = 0; j < 14; j++) {
    const x = 20 + rnd() * (size - 40)
    const board = Math.floor(rnd() * boardCount)
    const y0 = (board / boardCount) * size
    const y1 = y0 + size / boardCount * 0.85
    aCtx.fillStyle = `rgba(16,8,4,${0.32 + rnd() * 0.28})`
    aCtx.fillRect(x, y0 + 2, 1.6 + rnd() * 1.4, y1 - y0)
    aCtx.fillStyle = `rgba(140,100,70,${0.08 + rnd() * 0.1})`
    aCtx.fillRect(x + 2, y0 + 3, 1.2, y1 - y0 - 4)
  }

  // Grain streaks along boards (high contrast dark/light lanes)
  for (let i = 0; i < 110; i++) {
    const y = rnd() * size
    const dark = rnd() > 0.35
    aCtx.strokeStyle = dark
      ? `rgba(${22 + rnd() * 28},${12 + rnd() * 14},${6},${0.22 + rnd() * 0.36})`
      : `rgba(${175 + rnd() * 45},${130 + rnd() * 30},${85},${0.1 + rnd() * 0.18})`
    aCtx.lineWidth = 0.7 + rnd() * 4.2
    aCtx.beginPath()
    aCtx.moveTo(0, y)
    for (let x = 0; x <= size; x += 5) {
      aCtx.lineTo(x, y + Math.sin(x * 0.016 + i) * 7 + Math.sin(x * 0.05 + i * 0.4) * 2.5)
    }
    aCtx.stroke()
  }

  // Large weather / peeling patches (grey weathered vs warm timber — multi-scale)
  for (let i = 0; i < 48; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const rx = 14 + rnd() * 64
    const ry = 7 + rnd() * 28
    const g = aCtx.createRadialGradient(cx, cy, 1, cx, cy, rx)
    const kind = rnd()
    if (kind > 0.55) {
      // Sun-bleached / dry timber
      g.addColorStop(0, `rgba(${150 + rnd() * 45},${115 + rnd() * 30},${85},${0.2 + rnd() * 0.18})`)
    } else if (kind > 0.28) {
      // Dark wet / rot patch
      g.addColorStop(0, `rgba(${22 + rnd() * 20},${12 + rnd() * 12},${8},${0.26 + rnd() * 0.2})`)
    } else {
      // Grey weathered paint flake
      g.addColorStop(0, `rgba(${95 + rnd() * 35},${88 + rnd() * 28},${78},${0.18 + rnd() * 0.16})`)
    }
    g.addColorStop(1, 'rgba(60,40,28,0)')
    aCtx.fillStyle = g
    aCtx.beginPath()
    aCtx.ellipse(cx, cy, rx, ry, rnd() * Math.PI, 0, Math.PI * 2)
    aCtx.fill()
  }

  // Nail rows along board bottoms (readable at beauty FOV)
  for (let b = 0; b < boardCount; b++) {
    const y = (b / boardCount) * size + (size / boardCount) * 0.72
    for (let n = 0; n < 9; n++) {
      const x = 28 + n * (size / 9) + (rnd() - 0.5) * 10
      aCtx.fillStyle = `rgba(${40 + rnd() * 30},${32 + rnd() * 20},${24},${0.45 + rnd() * 0.3})`
      aCtx.beginPath()
      aCtx.arc(x, y + rnd() * 3, 1.1 + rnd() * 0.9, 0, Math.PI * 2)
      aCtx.fill()
      // Tiny highlight
      aCtx.fillStyle = 'rgba(180,160,130,0.25)'
      aCtx.fillRect(x - 0.4, y - 0.6, 1.2, 0.8)
    }
  }

  // Scuff flecks near board edges
  for (let i = 0; i < 140; i++) {
    const x = rnd() * size
    const y = (Math.floor(rnd() * boardCount) / boardCount) * size + rnd() * 10
    aCtx.fillStyle = `rgba(${90 + rnd() * 55},${58 + rnd() * 32},${38},${0.2 + rnd() * 0.28})`
    aCtx.fillRect(x, y, 2 + rnd() * 12, 1 + rnd() * 3)
  }
  // Fine grit
  for (let i = 0; i < 6000; i++) {
    const v = (rnd() - 0.5) * 42
    aCtx.fillStyle = `rgba(${100 + v},${72 + v * 0.6},${52 + v * 0.4},0.07)`
    aCtx.fillRect(rnd() * size, rnd() * size, 1.3, 1.2)
  }

  // ── Roughness: grooves matte, faces mixed varnish/weather ──
  const rCanvas = document.createElement('canvas')
  rCanvas.width = rCanvas.height = size
  const rCtx = rCanvas.getContext('2d')!
  rCtx.fillStyle = '#9a9080'
  rCtx.fillRect(0, 0, size, size)
  for (let b = 0; b < boardCount; b++) {
    const y = (b / boardCount) * size
    const bandH = size / boardCount
    // Groove = rough matte
    rCtx.fillStyle = 'rgba(230,220,200,0.55)'
    rCtx.fillRect(0, y + bandH * 0.84, size, 4.5)
    // Board face — slightly smoother mid band
    rCtx.fillStyle = `rgba(${50 + rnd() * 40},${45},${38},${0.22 + rnd() * 0.2})`
    rCtx.fillRect(0, y + 3, size, bandH * 0.55)
  }
  // Weather-matte islands
  for (let i = 0; i < 55; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const r = 10 + rnd() * 50
    const g = rCtx.createRadialGradient(cx, cy, 1, cx, cy, r)
    g.addColorStop(0, `rgba(235,225,205,${0.45 + rnd() * 0.4})`)
    g.addColorStop(1, 'rgba(180,170,155,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.arc(cx, cy, r, 0, Math.PI * 2)
    rCtx.fill()
  }
  // Sparse polished / sealed patches (dark = smoother)
  for (let i = 0; i < 28; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const r = 8 + rnd() * 32
    const g = rCtx.createRadialGradient(cx, cy, 1, cx, cy, r)
    g.addColorStop(0, `rgba(${30 + rnd() * 25},${26},${22},${0.4 + rnd() * 0.3})`)
    g.addColorStop(1, 'rgba(150,140,125,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.arc(cx, cy, r, 0, Math.PI * 2)
    rCtx.fill()
  }
  for (let i = 0; i < 8000; i++) {
    const v = 40 + Math.floor(rnd() * 150)
    rCtx.fillStyle = `rgba(${v},${v},${v * 0.95},0.07)`
    rCtx.fillRect(rnd() * size, rnd() * size, 1.3, 1)
  }

  const albedo = new THREE.CanvasTexture(aCanvas)
  albedo.colorSpace = THREE.SRGBColorSpace
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping
  // More Y tiles so board bands resolve at hero FOV
  albedo.repeat.set(1.55, 3.1)
  albedo.anisotropy = 8
  albedo.needsUpdate = true

  const roughness = new THREE.CanvasTexture(rCanvas)
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping
  roughness.repeat.set(1.55, 3.1)
  roughness.anisotropy = 4
  roughness.needsUpdate = true

  return { albedo, roughness }
}

/**
 * Chrome sink + faucet (residual #5) — high metalness, low roughness; true chrome under env.
 * Sits on rear counter so hero food stays clear; adds counter metal density vs oak.
 */
function ChromeSinkFaucet({ position }: { position: [number, number, number] }) {
  const chrome = {
    color: '#d0d8e0',
    metalness: 0.96,
    roughness: 0.1,
    envMapIntensity: 1.85,
  } as const
  const steel = {
    color: '#8a949c',
    metalness: 0.88,
    roughness: 0.28,
    envMapIntensity: 1.35,
  } as const
  return (
    <group position={position}>
      {/* Sink basin housing (brushed steel insert) */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.06, 0.32]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {/* Inner basin bowl */}
      <mesh position={[0, 0.01, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.12, 0.08, 20]} />
        <meshStandardMaterial color="#6a7278" metalness={0.9} roughness={0.22} envMapIntensity={1.5} />
      </mesh>
      {/* Basin dark water plane */}
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.115, 20]} />
        <meshPhysicalMaterial
          color="#1a2830"
          roughness={0.08}
          metalness={0.15}
          transmission={0.12}
          thickness={0.2}
          transparent
          opacity={0.92}
          ior={1.33}
        />
      </mesh>
      {/* Rim ring (chrome) */}
      <mesh position={[0, 0.048, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.145, 0.012, 8, 24]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
      {/* Faucet base flange */}
      <mesh position={[0, 0.055, -0.12]} castShadow>
        <cylinderGeometry args={[0.035, 0.04, 0.025, 16]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
      {/* Faucet column */}
      <mesh position={[0, 0.14, -0.12]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 0.16, 12]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
      {/* Gooseneck arc (approx with short segments) */}
      {[0.15, 0.32, 0.55, 0.78, 1.0].map((t, i) => {
        const ang = -0.15 + t * 1.35
        const r = 0.11
        const x = Math.sin(ang) * r
        const y = 0.2 + (1 - Math.cos(ang * 0.85)) * 0.12
        const z = -0.12 + (1 - Math.cos(ang)) * 0.08
        return (
          <mesh key={i} position={[x, y, z]} rotation={[0.4 - t * 0.9, 0, ang * 0.5]} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.055, 10]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
        )
      })}
      {/* Spout tip */}
      <mesh position={[0.1, 0.22, -0.02]} rotation={[0.9, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.012, 0.016, 0.05, 10]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
      {/* Handles */}
      <mesh position={[-0.06, 0.09, -0.12]} rotation={[0, 0, 0.4]} castShadow>
        <boxGeometry args={[0.045, 0.014, 0.014]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
      <mesh position={[0.06, 0.09, -0.12]} rotation={[0, 0, -0.4]} castShadow>
        <boxGeometry args={[0.045, 0.014, 0.014]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
      {/* Drain grate */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.035, 12]} />
        <meshStandardMaterial color="#a8b0b8" metalness={0.92} roughness={0.18} />
      </mesh>
    </group>
  )
}

/**
 * Counter oak surfaces (residual #6 / shell) — UV grain + broken varnish face.
 * Kill single-strip gloss + thin-slat read: patchy wet pools + matte wear, soft seams.
 * Roughness: dark = polished varnish, light = matte wear. ClearcoatRough: wet pools.
 */
function makeCounterSurfaceMaps(woodMap: THREE.Texture): {
  albedo: THREE.CanvasTexture
  roughness: THREE.CanvasTexture
  clearcoatRough: THREE.CanvasTexture
} {
  // Deterministic PRNG so maps stay stable across HMR / remount (no flicker)
  let seed = 0x6c6f6f70 // 'loop'
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0x100000000
  }
  const size = 512
  // ── Albedo: photo oak + contrast boost + authored grain + edge wear darken ──
  const aCanvas = document.createElement('canvas')
  aCanvas.width = aCanvas.height = size
  const aCtx = aCanvas.getContext('2d')!
  const src = woodMap.image as CanvasImageSource | undefined
  if (src && (src as HTMLImageElement).width) {
    aCtx.drawImage(src, 0, 0, size, size)
  } else {
    aCtx.fillStyle = '#6a4528'
    aCtx.fillRect(0, 0, size, size)
  }
  // loop-r18 residual #8: lift midtones + multi-scale grain so face isn't crushed mud strip
  const img = aCtx.getImageData(0, 0, size, size)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i]
    let g = d[i + 1]
    let b = d[i + 2]
    // Midtone contrast with higher mean so night key still sells grain
    r = Math.max(0, Math.min(255, (r - 128) * 1.78 + 118))
    g = Math.max(0, Math.min(255, (g - 128) * 1.58 + 100))
    b = Math.max(0, Math.min(255, (b - 128) * 1.32 + 72))
    // Apron-family warm oak (not candy orange / not black varnish)
    r = Math.min(255, r * 1.02 + 6)
    g = Math.min(255, g * 0.94 + 2)
    b = Math.min(255, b * 0.7)
    d[i] = r
    d[i + 1] = g
    d[i + 2] = b
  }
  aCtx.putImageData(img, 0, 0)
  // Soft plank seam lanes (UV only) — no hard black rails that read as thin plastic slats
  for (let p = 1; p < 4; p++) {
    const y = (p / 4) * size + (rnd() - 0.5) * 6
    aCtx.fillStyle = 'rgba(22,12,6,0.22)'
    aCtx.fillRect(0, y - 1.2, size, 2.4)
    aCtx.fillStyle = 'rgba(110,72,38,0.1)'
    aCtx.fillRect(0, y + 1.2, size, 1.6)
  }
  // Authored grain streaks (dark/light lanes — UV grain tell at beauty FOV)
  for (let i = 0; i < 88; i++) {
    const y = rnd() * size
    const dark = rnd() > 0.38
    aCtx.strokeStyle = dark
      ? `rgba(${22 + rnd() * 28},${12 + rnd() * 16},${6},${0.2 + rnd() * 0.38})`
      : `rgba(${190 + rnd() * 40},${150 + rnd() * 30},${90},${0.1 + rnd() * 0.2})`
    aCtx.lineWidth = 0.7 + rnd() * 5.5
    aCtx.beginPath()
    aCtx.moveTo(0, y)
    for (let x = 0; x <= size; x += 5) {
      aCtx.lineTo(x, y + Math.sin(x * 0.02 + i) * 11 + Math.sin(x * 0.065 + i * 0.3) * 3.5)
    }
    aCtx.stroke()
  }
  // Figure/ring knots (oak character)
  for (let i = 0; i < 11; i++) {
    const cx = 40 + rnd() * (size - 80)
    const cy = 40 + rnd() * (size - 80)
    const rr = 7 + rnd() * 28
    for (let k = 0; k < 6; k++) {
      aCtx.strokeStyle = `rgba(32,16,6,${0.1 + k * 0.035})`
      aCtx.lineWidth = 1.3
      aCtx.beginPath()
      aCtx.ellipse(cx, cy, rr + k * 3.2, (rr + k * 3.2) * 0.52, i * 0.45, 0, Math.PI * 2)
      aCtx.stroke()
    }
  }
  // Edge wear darkening (UV perimeter → front lip / bullnose reads worn timber)
  const edge = aCtx.createLinearGradient(0, 0, 0, size)
  edge.addColorStop(0, 'rgba(18,10,4,0.48)')
  edge.addColorStop(0.1, 'rgba(18,10,4,0)')
  edge.addColorStop(0.88, 'rgba(18,10,4,0)')
  edge.addColorStop(1, 'rgba(14,8,3,0.58)')
  aCtx.fillStyle = edge
  aCtx.fillRect(0, 0, size, size)
  const edgeX = aCtx.createLinearGradient(0, 0, size, 0)
  edgeX.addColorStop(0, 'rgba(16,8,3,0.4)')
  edgeX.addColorStop(0.05, 'rgba(16,8,3,0)')
  edgeX.addColorStop(0.95, 'rgba(16,8,3,0)')
  edgeX.addColorStop(1, 'rgba(16,8,3,0.4)')
  aCtx.fillStyle = edgeX
  aCtx.fillRect(0, 0, size, size)
  // Front-working-edge scuffs (bottom UV) — matte worn flecks
  for (let i = 0; i < 56; i++) {
    const x = rnd() * size
    const y = size * 0.7 + rnd() * size * 0.3
    aCtx.fillStyle = `rgba(${42 + rnd() * 36},${26 + rnd() * 20},${10},${0.22 + rnd() * 0.3})`
    aCtx.fillRect(x, y, 2 + rnd() * 14, 1 + rnd() * 3.5)
  }
  // Broken amber varnish pools (face patches — NOT continuous center strip)
  for (let i = 0; i < 22; i++) {
    const cx = 30 + rnd() * (size - 60)
    const cy = size * 0.12 + rnd() * size * 0.55
    const rx = 14 + rnd() * 55
    const ry = 8 + rnd() * 28
    const g = aCtx.createRadialGradient(cx, cy, 1, cx, cy, rx)
    g.addColorStop(0, `rgba(215,165,95,${0.07 + rnd() * 0.1})`)
    g.addColorStop(0.55, `rgba(190,140,70,${0.03 + rnd() * 0.05})`)
    g.addColorStop(1, 'rgba(180,130,60,0)')
    aCtx.fillStyle = g
    aCtx.beginPath()
    aCtx.ellipse(cx, cy, rx, ry, rnd() * Math.PI, 0, Math.PI * 2)
    aCtx.fill()
  }

  // ── Roughness: broken varnish pools (r31 C #9 shell — kill continuous plastic varnish) ──
  const rCanvas = document.createElement('canvas')
  rCanvas.width = rCanvas.height = size
  const rCtx = rCanvas.getContext('2d')!
  // Matte-dominant base (lighter = rougher) so face is worn timber not plastic
  rCtx.fillStyle = '#ebe4da'
  rCtx.fillRect(0, 0, size, size)
  // Short interrupted polish segments (NOT full-width lanes → strip specular)
  for (let i = 0; i < 8; i++) {
    const y = rnd() * size
    const x0 = rnd() * size * 0.75
    const x1 = x0 + 8 + rnd() * 24
    rCtx.strokeStyle = `rgba(18,16,12,${0.05 + rnd() * 0.1})`
    rCtx.lineWidth = 0.8 + rnd() * 2.2
    rCtx.beginPath()
    rCtx.moveTo(x0, y)
    for (let x = x0; x <= Math.min(size, x1); x += 7) {
      rCtx.lineTo(x, y + Math.sin(x * 0.022 + i * 0.4) * 8 + Math.sin(x * 0.06) * 2.5)
    }
    rCtx.stroke()
  }
  // Discrete wet-varnish pools (dark = smooth) — very sparse micro-islands only
  for (let i = 0; i < 5; i++) {
    const cx = 25 + rnd() * (size - 50)
    const cy = size * 0.1 + rnd() * size * 0.65
    const rx = 2 + rnd() * 8
    const ry = 1.5 + rnd() * 5
    const g = rCtx.createRadialGradient(cx, cy, 1.5, cx, cy, rx)
    g.addColorStop(0, `rgba(8,8,6,${0.12 + rnd() * 0.1})`)
    g.addColorStop(0.5, `rgba(28,26,22,${0.04 + rnd() * 0.05})`)
    g.addColorStop(1, 'rgba(100,96,88,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.ellipse(cx, cy, rx, ry, rnd() * Math.PI, 0, Math.PI * 2)
    rCtx.fill()
  }
  // Wear / contact patches across full face (lighter = rougher matte) — denser micro-rough
  for (let i = 0; i < 110; i++) {
    const cx = 20 + rnd() * (size - 40)
    const cy = size * 0.08 + rnd() * size * 0.84
    const rx = 10 + rnd() * 64
    const ry = 8 + rnd() * 38
    const g = rCtx.createRadialGradient(cx, cy, 2, cx, cy, rx)
    g.addColorStop(0, `rgba(250,242,228,${0.65 + rnd() * 0.32})`)
    g.addColorStop(1, 'rgba(220,210,190,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.ellipse(cx, cy, rx, ry, rnd() * Math.PI, 0, Math.PI * 2)
    rCtx.fill()
  }
  // Front lip hand-wear — broken patches only (no continuous dull band across face)
  for (let i = 0; i < 28; i++) {
    const cx = 16 + rnd() * (size - 32)
    const cy = size * 0.78 + rnd() * size * 0.2
    const rx = 14 + rnd() * 50
    const ry = 5 + rnd() * 14
    const g = rCtx.createRadialGradient(cx, cy, 2, cx, cy, rx)
    g.addColorStop(0, `rgba(240,230,210,${0.6 + rnd() * 0.35})`)
    g.addColorStop(1, 'rgba(205,195,175,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.ellipse(cx, cy, rx, ry, rnd() * 0.5, 0, Math.PI * 2)
    rCtx.fill()
  }
  // Micro-scratch noise (beauty FOV grain under warm key)
  for (let i = 0; i < 900; i++) {
    const x = rnd() * size
    const y = rnd() * size
    rCtx.fillStyle = `rgba(245,238,220,${0.15 + rnd() * 0.35})`
    rCtx.fillRect(x, y, 0.8 + rnd() * 2.5, 0.5 + rnd() * 1.2)
  }
  // Soft seam roughness (not hard matte rails)
  for (let p = 1; p < 4; p++) {
    const y = (p / 4) * size
    rCtx.fillStyle = 'rgba(190,180,160,0.28)'
    rCtx.fillRect(0, y - 1.5, size, 3)
  }
  for (let i = 0; i < 14000; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const v = 50 + Math.floor(rnd() * 130)
    rCtx.fillStyle = `rgba(${v},${v},${v * 0.95},0.08)`
    rCtx.fillRect(x, y, 1.4, 0.85)
  }

  // ── Clearcoat roughness: near-dry face (loop-r20 residual #9 — no mirror strip) ──
  const cCanvas = document.createElement('canvas')
  cCanvas.width = cCanvas.height = size
  const cCtx = cCanvas.getContext('2d')!
  // Very high base = dry face; tiny rare wet pools only
  cCtx.fillStyle = '#c4bcb0'
  cCtx.fillRect(0, 0, size, size)
  for (let i = 0; i < 8; i++) {
    const cx = 30 + rnd() * (size - 60)
    const cy = size * 0.12 + rnd() * size * 0.5
    const rx = 4 + rnd() * 14
    const ry = 3 + rnd() * 10
    const g = cCtx.createRadialGradient(cx, cy, 1, cx, cy, rx)
    g.addColorStop(0, `rgba(0,0,0,${0.32 + rnd() * 0.2})`)
    g.addColorStop(0.55, `rgba(24,22,18,${0.1 + rnd() * 0.1})`)
    g.addColorStop(1, 'rgba(100,95,85,0)')
    cCtx.fillStyle = g
    cCtx.beginPath()
    cCtx.ellipse(cx, cy, rx, ry, rnd() * Math.PI, 0, Math.PI * 2)
    cCtx.fill()
  }
  for (let i = 0; i < 56; i++) {
    const cx = rnd() * size
    const cy = size * 0.4 + rnd() * size * 0.55
    cCtx.fillStyle = `rgba(235,225,210,${0.55 + rnd() * 0.4})`
    cCtx.beginPath()
    cCtx.ellipse(cx, cy, 8 + rnd() * 28, 4 + rnd() * 14, 0, 0, Math.PI * 2)
    cCtx.fill()
  }

  const albedo = new THREE.CanvasTexture(aCanvas)
  albedo.colorSpace = THREE.SRGBColorSpace
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping
  // Grain along length; ~1 Y tile so face reads as one timber slab with soft seams
  albedo.repeat.set(2.6, 1.05)
  albedo.anisotropy = 8
  albedo.needsUpdate = true

  const roughness = new THREE.CanvasTexture(rCanvas)
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping
  roughness.repeat.set(2.6, 1.05)
  roughness.anisotropy = 4
  roughness.needsUpdate = true

  const clearcoatRough = new THREE.CanvasTexture(cCanvas)
  clearcoatRough.wrapS = clearcoatRough.wrapT = THREE.RepeatWrapping
  clearcoatRough.repeat.set(2.6, 1.05)
  clearcoatRough.anisotropy = 2
  clearcoatRough.needsUpdate = true

  return { albedo, roughness, clearcoatRough }
}

/**
 * Kevin's Ramen & Boba — complete night-market kiosk silhouette
 * (jesse-zhou typology: roof volume, front face, side walls, ground contact).
 */
export function ShopShell() {
  const woodMap = useTexture(`${texBase}tex-wood.jpg`)
  const wallMap = useTexture(`${texBase}tex-wall.jpg`)
  ;[woodMap, wallMap].forEach((t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = THREE.SRGBColorSpace
  })
  woodMap.repeat.set(2.8, 2.0)
  wallMap.repeat.set(2.0, 1.4)

  // loop-r14 residual #2: mid-warm timber family so under-counter/booth survive night key
  // (prior #3a/#2a tints crushed to black plastic under underexposure)
  const wood = '#7a5238'
  const woodDark = '#4a3020'
  // Dedicated UV tiles: apron grain + residual #3 counter surfaces (grain/varnish/wear)
  const { woodApron, woodCounter, varnishRough, clearcoatRough, counterAlbedo } = useMemo(() => {
    const apron = woodMap.clone()
    apron.repeat.set(3.4, 1.2)
    apron.wrapS = apron.wrapT = THREE.RepeatWrapping
    apron.colorSpace = THREE.SRGBColorSpace
    apron.anisotropy = 8
    // Fallback photo tile (underlayer / dark rails)
    const counter = woodMap.clone()
    counter.repeat.set(3.6, 1.35)
    counter.wrapS = counter.wrapT = THREE.RepeatWrapping
    counter.colorSpace = THREE.SRGBColorSpace
    counter.anisotropy = 8
    const surfaces = makeCounterSurfaceMaps(woodMap)
    return {
      woodApron: apron,
      woodCounter: counter,
      counterAlbedo: surfaces.albedo,
      varnishRough: surfaces.roughness,
      clearcoatRough: surfaces.clearcoatRough,
    }
  }, [woodMap])

  // Noren fabric weave + stripe/mon print — loop-r31 residual A #3 (A/B/C):
  // deep wine/indigo night cloth with weave+crest so hang sells fabric craft (not flat cards)
  const norenFabrics = useMemo(() => {
    const wine = makeFabricMaps([128, 36, 58], { norenPrint: true })
    // Coarser UV so weave + mon crest read at beauty FOV
    wine.albedo.repeat.set(1.15, 1.8)
    wine.roughness.repeat.set(1.15, 1.8)
    const indigo = makeFabricMaps([42, 40, 92], { norenPrint: true })
    indigo.albedo.repeat.set(1.15, 1.8)
    indigo.roughness.repeat.set(1.15, 1.8)
    return { wine, indigo }
  }, [])

  // Floor plank + wall plaster maps (loop-r13 residual #2 — kill muddy plastic shell)
  const floorMaps = useMemo(() => makeFloorTileMaps(), [])
  // Street asphalt (loop-r25 residual #1 A) — not wood plank UV under cool tint
  const streetMaps = useMemo(() => makeStreetAsphaltMaps(), [])
  const wallPlaster = useMemo(() => makeWallPlasterMaps(wallMap), [wallMap])
  // Exterior clapboard timber wear (loop-r18 residual #12)
  const sidingMaps = useMemo(() => makeExteriorSidingMaps(woodMap), [woodMap])
  // Booth leather tuft maps (loop-r14 residual #2 — not flat color plastic)
  const leatherMaps = useMemo(() => makeLeatherTuftMaps(), [])
  // Soft radial washes (no hard ringGeometry stage tell — residual #1 A)
  // loop-r27: cooler edge fill, darker center so ground sells night apron not gray stage
  const groundWashes = useMemo(
    () => ({
      cool: makeSoftGroundWashMap([72, 118, 155]),
      coolDeep: makeSoftGroundWashMap([48, 78, 112]),
      warm: makeSoftGroundWashMap([180, 125, 80]),
      edge: makeSoftGroundWashMap([90, 130, 165]),
    }),
    [],
  )

  return (
    <group name="ShopShell">
      {/* ═══ GROUND CONTACT FOOTPRINT ═══ */}
      {/* Street pad — loop-r27 residual #1 (A): dark cool asphalt + grit (not blown gray stage) */}
      <mesh position={[0, -0.06, 0.15]} receiveShadow>
        <cylinderGeometry args={[5.5, 5.85, 0.07, 48]} />
        <meshStandardMaterial
          map={streetMaps.albedo}
          roughnessMap={streetMaps.roughness}
          color="#4a5a6c"
          emissive="#1a2838"
          emissiveIntensity={0.28}
          roughness={0.96}
          metalness={0.06}
          envMapIntensity={0.18}
        />
      </mesh>
      {/* Soft cool street bounce — r30 residual A #1: night-market apron (not studio void) */}
      <mesh position={[0.1, -0.012, 0.45]} rotation={[-Math.PI / 2, 0, 0.08]}>
        <planeGeometry args={[11.2, 10.4]} />
        <meshBasicMaterial
          map={groundWashes.cool}
          transparent
          opacity={0.4}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Outer cool air — wider soft disc, offset so it isn't a centered stage bullseye */}
      <mesh position={[-0.25, -0.008, 0.15]} rotation={[-Math.PI / 2, 0, -0.12]}>
        <planeGeometry args={[13.5, 12.8]} />
        <meshBasicMaterial
          map={groundWashes.coolDeep}
          transparent
          opacity={0.34}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Front apron street edge fill — rectangular, sells three-quarter ground not disc */}
      <mesh position={[0.05, -0.005, 2.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.2, 3.4]} />
        <meshBasicMaterial
          map={groundWashes.edge}
          transparent
          opacity={0.46}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Side street edge fills — cool bounce along plinth flanks (enclosure footprint) */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`street-edge-${side}`}
          position={[side * 3.1, -0.004, 0.2]}
          rotation={[-Math.PI / 2, 0, side * 0.05]}
        >
          <planeGeometry args={[2.6, 7.5]} />
          <meshBasicMaterial
            map={groundWashes.edge}
            transparent
            opacity={0.34}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Soft warm kiosk core bounce — secondary, under counter only (not global wash) */}
      <mesh position={[0, -0.01, 0.15]} rotation={[-Math.PI / 2, 0, 0.04]}>
        <planeGeometry args={[5.2, 4.6]} />
        <meshBasicMaterial
          map={groundWashes.warm}
          transparent
          opacity={0.14}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Shop floor slab under plinth — matte timber, residual #3 kill strip specular */}
      <mesh position={[0, -0.02, -0.45]} receiveShadow>
        <boxGeometry args={[5.65, 0.1, 4.15]} />
        <meshStandardMaterial
          map={floorMaps.albedo}
          roughnessMap={floorMaps.roughness}
          color="#7a5a40"
          emissive="#241810"
          emissiveIntensity={0.06}
          roughness={0.96}
          metalness={0.0}
          envMapIntensity={0.1}
        />
      </mesh>
      {/* Raised plinth / platform edge — thick mass so kiosk sits on a pad */}
      <mesh position={[0, 0.055, -0.45]} receiveShadow castShadow>
        <boxGeometry args={[5.35, 0.16, 3.85]} />
        <meshStandardMaterial
          map={floorMaps.albedo}
          roughnessMap={floorMaps.roughness}
          color="#6e4e38"
          emissive="#1a1008"
          emissiveIntensity={0.03}
          roughness={0.95}
          metalness={0.0}
          envMapIntensity={0.08}
        />
      </mesh>
      {/* Plinth nosing (front lip catch) — thicker timber edge */}
      <mesh position={[0, 0.135, 1.42]} castShadow>
        <boxGeometry args={[5.4, 0.05, 0.1]} />
        <meshStandardMaterial map={woodMap} color="#5a3a28" roughness={0.5} metalness={0.08} />
      </mesh>
      {/* Front threshold step bar (enclosure mass under stools) */}
      <mesh position={[0, 0.1, 1.05]} castShadow receiveShadow>
        <boxGeometry args={[4.9, 0.08, 0.28]} />
        <meshStandardMaterial
          map={sidingMaps.albedo}
          roughnessMap={sidingMaps.roughness}
          color="#6a4a32"
          roughness={0.62}
        />
      </mesh>
      {/* Side plinth returns (enclosure footprint mass) */}
      <mesh position={[-2.65, 0.08, -0.45]} castShadow>
        <boxGeometry args={[0.08, 0.12, 3.85]} />
        <meshStandardMaterial map={woodMap} color="#4a3220" roughness={0.68} />
      </mesh>
      <mesh position={[2.65, 0.08, -0.45]} castShadow>
        <boxGeometry args={[0.08, 0.12, 3.85]} />
        <meshStandardMaterial map={woodMap} color="#4a3220" roughness={0.68} />
      </mesh>

      {/* ═══ BACK WALL (thick masonry + plaster — residual #2 A: warm plaster not mauve mush) ═══ */}
      <mesh position={[0, 1.55, -1.98]} receiveShadow castShadow>
        <boxGeometry args={[5.1, 3.2, 0.34]} />
        <meshStandardMaterial
          map={wallPlaster.albedo}
          roughnessMap={wallPlaster.roughness}
          color="#6a5848"
          roughness={0.86}
        />
      </mesh>
      {/* Inner back panel (slightly lighter for depth) */}
      <mesh position={[0, 1.35, -1.78]}>
        <boxGeometry args={[4.6, 2.5, 0.1]} />
        <meshStandardMaterial
          map={wallPlaster.albedo}
          roughnessMap={wallPlaster.roughness}
          color="#7a6858"
          roughness={0.8}
        />
      </mesh>
      {/* Baseboard + crown on back wall (enclosure trim — thick timber) */}
      <mesh position={[0, 0.14, -1.72]} castShadow>
        <boxGeometry args={[4.8, 0.18, 0.12]} />
        <meshStandardMaterial map={woodMap} color={woodDark} roughness={0.55} />
      </mesh>
      <mesh position={[0, 2.74, -1.72]} castShadow>
        <boxGeometry args={[4.8, 0.12, 0.12]} />
        <meshStandardMaterial map={woodMap} color="#3a2418" roughness={0.5} />
      </mesh>
      {/* Mid chair-rail trim (enclosure density) */}
      <mesh position={[0, 1.05, -1.72]} castShadow>
        <boxGeometry args={[4.7, 0.06, 0.08]} />
        <meshStandardMaterial map={woodMap} color="#4a3020" roughness={0.52} />
      </mesh>

      {/* ═══ SIDE WALLS — r30 residual A #1: exterior wood midtones under night void ═══ */}
      <mesh position={[-2.48, 1.55, -0.65]} receiveShadow castShadow>
        <boxGeometry args={[0.34, 3.2, 2.95]} />
        <meshStandardMaterial
          map={sidingMaps.albedo}
          roughnessMap={sidingMaps.roughness}
          color="#c89876"
          emissive="#523018"
          emissiveIntensity={0.26}
          roughness={0.74}
          metalness={0.02}
        />
      </mesh>
      <mesh position={[2.48, 1.55, -0.65]} receiveShadow castShadow>
        <boxGeometry args={[0.34, 3.2, 2.95]} />
        <meshStandardMaterial
          map={sidingMaps.albedo}
          roughnessMap={sidingMaps.roughness}
          color="#c89876"
          emissive="#523018"
          emissiveIntensity={0.26}
          roughness={0.74}
          metalness={0.02}
        />
      </mesh>
      {/* Exterior clapboard battens — physical board faces + groove (loop-r21 #1 midtones) */}
      {([-1, 1] as const).flatMap((side) =>
        Array.from({ length: 11 }, (_, i) => {
          const y = 0.22 + i * 0.275
          const boardTint = i % 3 === 0 ? '#d0a078' : i % 3 === 1 ? '#b88868' : '#a87858'
          return (
            <group key={`clap-${side}-${i}`}>
              <mesh position={[side * 2.66, y, -0.65]} castShadow receiveShadow>
                <boxGeometry args={[0.08, 0.24, 2.9]} />
                <meshStandardMaterial
                  map={sidingMaps.albedo}
                  roughnessMap={sidingMaps.roughness}
                  color={boardTint}
                  emissive="#3a2214"
                  emissiveIntensity={0.14}
                  roughness={0.7 + (i % 3) * 0.05}
                  metalness={0.02}
                />
              </mesh>
              {/* Bevel catch on board top edge (enclosure craft under night key) */}
              <mesh position={[side * 2.705, y + 0.1, -0.65]}>
                <boxGeometry args={[0.018, 0.03, 2.86]} />
                <meshStandardMaterial
                  map={sidingMaps.albedo}
                  color="#e0b890"
                  emissive="#5a3820"
                  emissiveIntensity={0.08}
                  roughness={0.55}
                />
              </mesh>
              {/* Shadow groove under each board (physical multi-scale tell) */}
              <mesh position={[side * 2.705, y - 0.125, -0.65]}>
                <boxGeometry args={[0.022, 0.03, 2.88]} />
                <meshStandardMaterial color="#120c08" roughness={0.95} />
              </mesh>
            </group>
          )
        }),
      )}
      {/* Vertical studs between clapboards (timber framing density + wear) */}
      {([-1, 1] as const).flatMap((side) =>
        ([-1.55, -0.75, 0.05, 0.85] as const).map((z, zi) => (
          <mesh key={`stud-${side}-${zi}`} position={[side * 2.69, 1.55, z]} castShadow>
            <boxGeometry args={[0.05, 2.98, 0.08]} />
            <meshStandardMaterial
              map={sidingMaps.albedo}
              roughnessMap={sidingMaps.roughness}
              color="#6a4630"
              roughness={0.55}
            />
          </mesh>
        )),
      )}
      {/* Soft cool flank bounce wash — r30 residual A #1: exterior siding midtones */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`side-wash-${side}`}
          position={[side * 2.74, 1.45, 0.2]}
          rotation={[0, side * -Math.PI / 2, 0]}
        >
          <planeGeometry args={[2.7, 2.9]} />
          <meshBasicMaterial
            color="#b0ccd8"
            transparent
            opacity={0.14}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      {/* Upper flank cool rim — three-quarter hero siding not crushed by void */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`side-upper-${side}`}
          position={[side * 2.75, 2.15, -0.1]}
          rotation={[0, side * -Math.PI / 2, 0]}
        >
          <planeGeometry args={[2.0, 1.4]} />
          <meshBasicMaterial
            color="#98b8d0"
            transparent
            opacity={0.1}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      {/* Warm ground-up bounce on lower siding (sells wear at night — residual #1) */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`side-warm-${side}`}
          position={[side * 2.73, 0.5, -0.15]}
          rotation={[0, side * -Math.PI / 2, 0]}
        >
          <planeGeometry args={[2.4, 1.35]} />
          <meshBasicMaterial
            color="#ffb898"
            transparent
            opacity={0.12}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      {/* Front corner post wash — posts sell at three-quarter (enclosure craft) */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`post-wash-${side}`}
          position={[side * 2.5, 1.4, 0.92]}
          rotation={[0, side * 0.15, 0]}
        >
          <planeGeometry args={[0.55, 2.6]} />
          <meshBasicMaterial
            color="#ffc8a0"
            transparent
            opacity={0.1}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      {/* Inner side cladding (warm plaster — not mauve/pink interior mush) */}
      <mesh position={[-2.26, 1.3, -0.7]}>
        <boxGeometry args={[0.1, 2.55, 2.55]} />
        <meshStandardMaterial
          map={wallPlaster.albedo}
          roughnessMap={wallPlaster.roughness}
          color="#6a5848"
          roughness={0.82}
        />
      </mesh>
      <mesh position={[2.26, 1.3, -0.7]}>
        <boxGeometry args={[0.1, 2.55, 2.55]} />
        <meshStandardMaterial
          map={wallPlaster.albedo}
          roughnessMap={wallPlaster.roughness}
          color="#6a5848"
          roughness={0.82}
        />
      </mesh>
      {/* Side baseboards (enclosure wood thickness) */}
      <mesh position={[-2.22, 0.12, -0.7]} castShadow>
        <boxGeometry args={[0.08, 0.16, 2.5]} />
        <meshStandardMaterial map={woodMap} color={woodDark} roughness={0.58} />
      </mesh>
      <mesh position={[2.22, 0.12, -0.7]} castShadow>
        <boxGeometry args={[0.08, 0.16, 2.5]} />
        <meshStandardMaterial map={woodMap} color={woodDark} roughness={0.58} />
      </mesh>
      {/* Front corner posts (heavy timber — r30 A #1 midtones so posts sell at night) */}
      <mesh position={[-2.38, 1.35, 0.72]} castShadow>
        <boxGeometry args={[0.38, 2.8, 0.38]} />
        <meshStandardMaterial
          map={sidingMaps.albedo}
          roughnessMap={sidingMaps.roughness}
          color="#c89868"
          emissive="#4a2c18"
          emissiveIntensity={0.22}
          roughness={0.5}
          metalness={0.04}
        />
      </mesh>
      <mesh position={[2.38, 1.35, 0.72]} castShadow>
        <boxGeometry args={[0.38, 2.8, 0.38]} />
        <meshStandardMaterial
          map={sidingMaps.albedo}
          roughnessMap={sidingMaps.roughness}
          color="#c89868"
          emissive="#4a2c18"
          emissiveIntensity={0.22}
          roughness={0.5}
          metalness={0.04}
        />
      </mesh>
      {/* Post corner chamfer strips (enclosure timber craft) */}
      {([-1, 1] as const).map((side) => (
        <mesh key={`post-chamfer-${side}`} position={[side * 2.2, 1.35, 0.9]} castShadow>
          <boxGeometry args={[0.06, 2.7, 0.06]} />
          <meshStandardMaterial
            map={sidingMaps.albedo}
            color="#8a5a3a"
            roughness={0.48}
          />
        </mesh>
      ))}
      {/* Post base wraps (enclosure foot mass) */}
      <mesh position={[-2.38, 0.12, 0.72]} castShadow>
        <boxGeometry args={[0.46, 0.22, 0.46]} />
        <meshStandardMaterial map={sidingMaps.albedo} color="#5a3a28" roughness={0.62} />
      </mesh>
      <mesh position={[2.38, 0.12, 0.72]} castShadow>
        <boxGeometry args={[0.46, 0.22, 0.46]} />
        <meshStandardMaterial map={sidingMaps.albedo} color="#5a3a28" roughness={0.62} />
      </mesh>
      {/* Post cap blocks (thickness at roof junction) */}
      <mesh position={[-2.38, 2.76, 0.72]} castShadow>
        <boxGeometry args={[0.46, 0.18, 0.46]} />
        <meshStandardMaterial map={sidingMaps.albedo} color="#8a5a40" roughness={0.44} />
      </mesh>
      <mesh position={[2.38, 2.76, 0.72]} castShadow>
        <boxGeometry args={[0.46, 0.18, 0.46]} />
        <meshStandardMaterial map={sidingMaps.albedo} color="#8a5a40" roughness={0.44} />
      </mesh>
      {/* Front header beam (closes upper volume, anchors awning/sign — r30 A midtones) */}
      <mesh position={[0, 2.55, 0.68]} castShadow>
        <boxGeometry args={[4.9, 0.32, 0.4]} />
        <meshStandardMaterial
          map={sidingMaps.albedo}
          roughnessMap={sidingMaps.roughness}
          color="#9a6a48"
          emissive="#2a1810"
          emissiveIntensity={0.12}
          roughness={0.48}
          metalness={0.05}
        />
      </mesh>
      {/* Header under-beam (double timber thickness read) */}
      <mesh position={[0, 2.36, 0.6]} castShadow>
        <boxGeometry args={[4.75, 0.12, 0.22]} />
        <meshStandardMaterial
          map={sidingMaps.albedo}
          color="#825438"
          emissive="#1a1008"
          emissiveIntensity={0.08}
          roughness={0.52}
        />
      </mesh>
      {/* Front window sill bar (closes opening under counter — enclosure mass) */}
      <mesh position={[0, 0.95, 0.55]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.1, 0.16]} />
        <meshStandardMaterial
          map={sidingMaps.albedo}
          roughnessMap={sidingMaps.roughness}
          color="#7a5038"
          roughness={0.52}
        />
      </mesh>

      {/* ═══ ROOF VOLUME (thick box + underside — residual #8 lift, not purple slab) ═══ */}
      <mesh position={[0, 3.2, -0.7]} castShadow receiveShadow>
        <boxGeometry args={[5.45, 0.42, 3.2]} />
        <meshStandardMaterial
          map={wallPlaster.albedo}
          roughnessMap={wallPlaster.roughness}
          color="#3a3228"
          roughness={0.7}
          metalness={0.08}
        />
      </mesh>
      {/* Ceiling underside — residual #1 loop-r20: warm bounce fill (not black slab) */}
      <mesh position={[0, 2.96, -0.75]} receiveShadow>
        <boxGeometry args={[4.95, 0.08, 2.8]} />
        <meshStandardMaterial
          map={floorMaps.albedo}
          roughnessMap={floorMaps.roughness}
          color="#8a6a48"
          emissive="#6a4a28"
          emissiveIntensity={0.4}
          roughness={0.74}
        />
      </mesh>
      {/* Ceiling bounce wash plane — soft area fill for interior midtones (night-kiosk, not cave) */}
      <mesh position={[0, 2.9, -0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.5, 2.3]} />
        <meshBasicMaterial
          color="#ffc098"
          transparent
          opacity={0.12}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Back-wall bounce plane — cool-neutral so plaster/noren/chalk leave pure shadow */}
      <mesh position={[0, 1.5, -1.7]}>
        <planeGeometry args={[4.2, 2.4]} />
        <meshBasicMaterial
          color="#b0c0d0"
          transparent
          opacity={0.065}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Roof eave soffit returns (enclosure thickness under overhang) */}
      <mesh position={[0, 2.88, 0.55]} castShadow>
        <boxGeometry args={[5.2, 0.06, 0.55]} />
        <meshStandardMaterial
          map={floorMaps.albedo}
          color="#5a3e2c"
          emissive="#3a2418"
          emissiveIntensity={0.12}
          roughness={0.7}
        />
      </mesh>
      {/* Roof fascia / front lip — r30 A #1 mid timber anchors exterior marquee */}
      <mesh position={[0, 2.98, 0.8]} castShadow>
        <boxGeometry args={[5.45, 0.32, 0.28]} />
        <meshStandardMaterial
          map={woodApron}
          color="#8a6048"
          emissive="#4a2c1a"
          emissiveIntensity={0.22}
          roughness={0.48}
          metalness={0.05}
          envMapIntensity={0.42}
        />
      </mesh>
      {/* Fascia paint lip (slightly proud — marquee anchor craft) */}
      <mesh position={[0, 3.16, 0.96]} castShadow>
        <boxGeometry args={[5.3, 0.09, 0.11]} />
        <meshStandardMaterial color="#4a3428" roughness={0.44} metalness={0.14} />
      </mesh>
      {/* Corner timber blocks where marquee arms meet fascia (enclosure craft) */}
      <mesh position={[-1.2, 3.02, 0.98]} castShadow>
        <boxGeometry args={[0.32, 0.26, 0.18]} />
        <meshStandardMaterial
          map={woodApron}
          color="#7a5440"
          emissive="#3a2214"
          emissiveIntensity={0.14}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[1.2, 3.02, 0.98]} castShadow>
        <boxGeometry args={[0.32, 0.26, 0.18]} />
        <meshStandardMaterial
          map={woodApron}
          color="#7a5440"
          emissive="#3a2214"
          emissiveIntensity={0.14}
          roughness={0.5}
        />
      </mesh>
      {/* Fascia under-lip timber return (enclosure thickness under marquee arms) */}
      <mesh position={[0, 2.82, 0.72]} castShadow>
        <boxGeometry args={[5.2, 0.1, 0.2]} />
        <meshStandardMaterial
          map={woodApron}
          color="#7a5038"
          emissive="#2a1810"
          emissiveIntensity={0.14}
          roughness={0.54}
          envMapIntensity={0.32}
        />
      </mesh>
      {/* Fascia face grain catch — midtone wood so marquee arms read mounted not floating */}
      <mesh position={[0, 2.96, 0.94]}>
        <planeGeometry args={[5.2, 0.24]} />
        <meshStandardMaterial
          map={woodApron}
          color="#9a6c50"
          roughness={0.52}
          transparent
          opacity={0.62}
          depthWrite={false}
        />
      </mesh>
      {/* Roof side lips */}
      <mesh position={[-2.6, 3.08, -0.7]} castShadow>
        <boxGeometry args={[0.16, 0.28, 3.1]} />
        <meshStandardMaterial
          map={wallPlaster.albedo}
          color="#4a3440"
          roughness={0.62}
        />
      </mesh>
      <mesh position={[2.6, 3.08, -0.7]} castShadow>
        <boxGeometry args={[0.16, 0.28, 3.1]} />
        <meshStandardMaterial
          map={wallPlaster.albedo}
          color="#4a3440"
          roughness={0.62}
        />
      </mesh>

      {/* Thick scalloped fabric awning */}
      <ScallopedAwning />

      {/* ═══ COUNTER (thick timber + residual #2/#3 midtones / grain / varnish) ═══ */}
      {/* Body carcass — thicker mass; mid-warm so under-counter grain survives night key */}
      <mesh position={[0, 0.48, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[4.42, 0.96, 1.18]} />
        <meshStandardMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color={wood}
          roughness={0.48}
          metalness={0.04}
        />
      </mesh>
      {/* Counter front apron — r30 C #9 matte oak (kill uniform plastic sheen) */}
      <mesh position={[0, 0.44, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[4.28, 0.88, 0.2]} />
        <meshPhysicalMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          clearcoatRoughnessMap={clearcoatRough}
          color="#a06842"
          roughness={0.82}
          clearcoat={0.02}
          clearcoatRoughness={0.92}
          metalness={0.015}
          envMapIntensity={0.18}
          sheen={0.16}
          sheenRoughness={0.8}
          sheenColor="#c8a070"
        />
      </mesh>
      {/* Soft warm apron face wash — r30 A #1: midtone fill (not underglow strip) */}
      <mesh position={[0, 0.48, 0.22]}>
        <planeGeometry args={[4.1, 0.72]} />
        <meshBasicMaterial
          color="#ffc090"
          transparent
          opacity={0.045}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Vertical stile divisions on apron */}
      {[-1.55, -0.52, 0.52, 1.55].map((x, i) => (
        <mesh key={i} position={[x, 0.44, 0.21]} castShadow>
          <boxGeometry args={[0.1, 0.84, 0.07]} />
          <meshStandardMaterial
            map={counterAlbedo}
            roughnessMap={varnishRough}
            color="#6a4028"
            roughness={0.58}
          />
        </mesh>
      ))}
      {/* Mid rail on apron — matte timber, not stretched specular rail residual #2 */}
      <mesh position={[0, 0.55, 0.21]}>
        <boxGeometry args={[4.22, 0.07, 0.055]} />
        <meshStandardMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color="#8a5a36"
          roughness={0.62}
          envMapIntensity={0.25}
        />
      </mesh>
      {/* Bottom apron rail (extra timber density — still readable mid wood) */}
      <mesh position={[0, 0.12, 0.21]}>
        <boxGeometry args={[4.22, 0.07, 0.055]} />
        <meshStandardMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color="#5a3824"
          roughness={0.68}
        />
      </mesh>
      {/* Top apron rail under counter lip (closes wood family to face veneer) */}
      <mesh position={[0, 0.82, 0.21]} castShadow>
        <boxGeometry args={[4.22, 0.06, 0.06]} />
        <meshStandardMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color="#8a5a36"
          roughness={0.6}
          envMapIntensity={0.25}
        />
      </mesh>
      {/* Residual #6: thick oak slab + face varnish breakup (not thin-slat + single gloss strip) */}
      {/* Core carcass — top face plane held at ~1.136 for hotspot props (thicken downward) */}
      <mesh position={[0, 0.995, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[4.52, 0.22, 1.28]} />
        <meshStandardMaterial
          map={woodCounter}
          roughnessMap={varnishRough}
          color="#3a2414"
          roughness={0.58}
          metalness={0.03}
        />
      </mesh>
      {/* Face veneer — r31 residual C #9 shell: worn oak + micro-roughness (not continuous plastic varnish) */}
      <mesh position={[0, 1.091, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[4.56, 0.09, 1.32]} />
        <meshPhysicalMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          clearcoatRoughnessMap={clearcoatRough}
          color="#8a5e40"
          roughness={0.88}
          clearcoat={0.012}
          clearcoatRoughness={0.94}
          metalness={0.005}
          envMapIntensity={0.14}
          sheen={0.1}
          sheenRoughness={0.84}
          sheenColor="#b89870"
        />
      </mesh>
      {/* Soft seam scores (shallow + low contrast — UV grain owns board read, not hard rails) */}
      {[-0.3, 0.0, 0.3].map((z, i) => (
        <mesh key={i} position={[0, 1.138, -0.5 + z]} receiveShadow>
          <boxGeometry args={[4.38, 0.003, 0.01]} />
          <meshStandardMaterial
            map={counterAlbedo}
            color="#2e1c10"
            roughness={0.88}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* Dark plywood underlayer reveal (thickness read from front) */}
      <mesh position={[0, 0.9, 0.18]} castShadow>
        <boxGeometry args={[4.5, 0.12, 0.1]} />
        <meshStandardMaterial map={woodCounter} color="#1a1008" roughness={0.74} />
      </mesh>
      {/* Front edge bullnose — worn apron-tone oak (hand-wear, matte-er than face) */}
      <mesh position={[0, 1.09, 0.185]} castShadow>
        <boxGeometry args={[4.54, 0.09, 0.12]} />
        <meshPhysicalMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color="#5a3820"
          roughness={0.62}
          clearcoat={0.12}
          clearcoatRoughness={0.7}
          metalness={0.04}
          envMapIntensity={0.55}
        />
      </mesh>
      {/* Front lip micro-chamfer (dark edge wear line) */}
      <mesh position={[0, 1.055, 0.23]} castShadow>
        <boxGeometry args={[4.5, 0.028, 0.032]} />
        <meshStandardMaterial map={counterAlbedo} color="#2a180c" roughness={0.88} />
      </mesh>
      {/* Rounded front nosing cylinder (thickness catch light — matte, no hot strip) */}
      <mesh position={[0, 1.1, 0.24]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.036, 0.036, 4.5, 12]} />
        <meshPhysicalMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color="#4a2e18"
          roughness={0.65}
          clearcoat={0.1}
          clearcoatRoughness={0.72}
        />
      </mesh>
      {/* Side bullnoses — thicker timber edge matching apron family */}
      <mesh position={[-2.3, 1.1, -0.5]} castShadow>
        <boxGeometry args={[0.11, 0.09, 1.3]} />
        <meshPhysicalMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color="#5a3820"
          roughness={0.5}
          clearcoat={0.22}
          clearcoatRoughness={0.55}
          envMapIntensity={0.7}
        />
      </mesh>
      <mesh position={[2.3, 1.1, -0.5]} castShadow>
        <boxGeometry args={[0.11, 0.09, 1.3]} />
        <meshPhysicalMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color="#5a3820"
          roughness={0.5}
          clearcoat={0.22}
          clearcoatRoughness={0.55}
          envMapIntensity={0.7}
        />
      </mesh>
      {/* Rear counter rail — brushed chrome (residual #9 loop-r23: kill stretched specular streak) */}
      <mesh position={[0, 1.125, -1.1]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 4.25, 16]} />
        <meshStandardMaterial
          color="#a8b4bc"
          metalness={0.72}
          roughness={0.52}
          envMapIntensity={0.45}
        />
      </mesh>
      {/* Chrome rail mounts */}
      {[-1.9, -0.65, 0.65, 1.9].map((x, i) => (
        <mesh key={i} position={[x, 1.105, -1.1]} castShadow>
          <boxGeometry args={[0.04, 0.05, 0.04]} />
          <meshStandardMaterial color="#9aa4ac" metalness={0.78} roughness={0.32} envMapIntensity={0.5} />
        </mesh>
      ))}
      {/* Wood rear splash under chrome rail — soft oil varnish, not mirror strip */}
      <mesh position={[0, 1.095, -1.14]} castShadow>
        <boxGeometry args={[4.4, 0.09, 0.07]} />
        <meshPhysicalMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color="#6a4228"
          roughness={0.62}
          clearcoat={0.14}
          clearcoatRoughness={0.68}
          envMapIntensity={0.28}
        />
      </mesh>
      {/* Chrome sink + faucet — rear-right, clear of hero food; y on face plane ~1.136 */}
      <ChromeSinkFaucet position={[1.15, 1.14, -0.85]} />
      {/* Contact darkening under props — tight ovals only (loop-r18: no face-spanning mud band) */}
      {(
        [
          [-0.85, -0.4, 0.42, 0.28, 0.12],
          [0.55, -0.42, 0.32, 0.24, 0.1],
          [1.55, -0.55, 0.28, 0.22, 0.09],
          [-1.65, -0.35, 0.22, 0.18, 0.08],
          [1.15, -0.85, 0.26, 0.2, 0.1],
        ] as const
      ).map(([x, z, w, d, op], i) => (
        <mesh key={i} position={[x, 1.14, z]} rotation={[-Math.PI / 2, 0, i * 0.15]}>
          <circleGeometry args={[Math.max(w, d) * 0.5, 20]} />
          <meshBasicMaterial color="#1a0e06" transparent opacity={op} depthWrite={false} />
        </mesh>
      ))}
      {/* Micro-wear scuffs near front lip — broken matte chips only */}
      {[-1.6, -0.85, -0.15, 0.55, 1.15, 1.7].map((x, i) => (
        <mesh key={i} position={[x, 1.141, 0.12]} rotation={[-Math.PI / 2, 0, 0.18 * (i - 2.5)]}>
          <planeGeometry args={[0.16 + (i % 3) * 0.06, 0.04 + (i % 2) * 0.02]} />
          <meshStandardMaterial
            map={counterAlbedo}
            color="#5a3a22"
            roughness={0.98}
            metalness={0}
            transparent
            opacity={0.28}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* Under-counter shelf (density + thickness — mid wood, residual #2) */}
      <mesh position={[0, 0.22, -0.42]} castShadow receiveShadow>
        <boxGeometry args={[4.18, 0.1, 0.88]} />
        <meshStandardMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color="#6a4228"
          roughness={0.52}
        />
      </mesh>
      {/* Under-counter inner back panel — grain plane so cavity isn't black void */}
      <mesh position={[0, 0.42, -0.95]} castShadow receiveShadow>
        <boxGeometry args={[4.1, 0.72, 0.06]} />
        <meshStandardMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color="#5a3824"
          roughness={0.55}
        />
      </mesh>
      {/* Chrome foot rail under counter — brushed, not streak mirror (residual #9 loop-r23) */}
      <mesh position={[0, 0.18, 0.22]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 3.9, 16]} />
        <meshStandardMaterial color="#a0aab2" metalness={0.7} roughness={0.55} envMapIntensity={0.4} />
      </mesh>
      {/* Foot rail brackets */}
      {[-1.7, -0.55, 0.55, 1.7].map((x, i) => (
        <mesh key={i} position={[x, 0.14, 0.16]} castShadow>
          <boxGeometry args={[0.03, 0.1, 0.06]} />
          <meshStandardMaterial color="#8a949c" metalness={0.75} roughness={0.35} envMapIntensity={0.45} />
        </mesh>
      ))}
      {/* Counter face cyan accent — recessed channel, SECONDARY to warm wood (residual #1) */}
      {/* Was emissive 2.35 + bloom 0.28 → cyan toe-kick competed with wood/food hierarchy */}
      <mesh position={[0, 0.26, 0.2]}>
        <boxGeometry args={[3.95, 0.042, 0.032]} />
        <meshStandardMaterial
          color="#3a6870"
          emissive="#1a88a0"
          emissiveIntensity={0.52}
          roughness={0.35}
          metalness={0.15}
          toneMapped={false}
        />
      </mesh>
      {/* Soft additive wash — dim accent only; wood apron owns midtones */}
      <mesh position={[0, 0.26, 0.22]}>
        <planeGeometry args={[3.85, 0.09]} />
        <meshBasicMaterial
          color="#3ab8c8"
          transparent
          opacity={0.08}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Toe kick */}
      <mesh position={[0, 0.04, 0.02]}>
        <boxGeometry args={[4.28, 0.1, 0.14]} />
        <meshStandardMaterial color="#120e0c" roughness={0.92} />
      </mesh>

      {/* Stools — four for denser counter front; residual #3 surface maps */}
      <Stool
        position={[-1.45, 0.05, 0.52]}
        woodMap={woodMap}
        surfaceAlbedo={counterAlbedo}
        surfaceRough={varnishRough}
        surfaceClearcoatRough={clearcoatRough}
      />
      <Stool
        position={[-0.48, 0.05, 0.52]}
        woodMap={woodMap}
        surfaceAlbedo={counterAlbedo}
        surfaceRough={varnishRough}
        surfaceClearcoatRough={clearcoatRough}
      />
      <Stool
        position={[0.48, 0.05, 0.52]}
        woodMap={woodMap}
        surfaceAlbedo={counterAlbedo}
        surfaceRough={varnishRough}
        surfaceClearcoatRough={clearcoatRough}
      />
      <Stool
        position={[1.45, 0.05, 0.52]}
        woodMap={woodMap}
        surfaceAlbedo={counterAlbedo}
        surfaceRough={varnishRough}
        surfaceClearcoatRough={clearcoatRough}
      />

      {/* ═══ NEON BRAND ON BUILDING (exterior street-face marquee + roof glyph) ═══ */}
      <NeonBrandSign woodMap={woodMap} />
      {/* Single 3D tube glyph above-right — exterior silhouette, clear of roof solid */}
      <NeonRamenGlyph position={[1.78, 3.78, 1.42]} scale={0.92} />

      {/* Accent neon tubes — dim cool/amber secondary (r27 #2 A: no hot pink wash on enclosure) */}
      <NeonTube position={[-2.32, 1.7, 0.58]} args={[0.042, 1.7, 0.042]} color="#e85880" intensity={0.28} />
      <NeonTube position={[2.32, 1.7, 0.58]} args={[0.042, 1.7, 0.042]} color="#2db0ff" intensity={0.36} />
      {/* Roof front lip tube sits behind marquee (fascia plane); secondary to brand letters */}
      <NeonTube position={[0, 3.08, 0.9]} args={[4.75, 0.022, 0.022]} color="#7080c0" intensity={0.22} />
      <NeonTube position={[-2.32, 2.92, -0.6]} rotation={[0, 0, Math.PI / 2]} args={[0.022, 1.9, 0.022]} color="#58a8c8" intensity={0.2} />
      <NeonTube position={[2.32, 2.92, -0.6]} rotation={[0, 0, Math.PI / 2]} args={[0.022, 1.9, 0.022]} color="#44e0ff" intensity={0.22} />

      {/* Paper lanterns — r31 residual A #2: only two deep under awning (warm amber, small).
          No front-facing pink orbs that mush marquee / counter at hero·3Q·leftNeon. */}
      <PaperLantern position={[-0.9, 1.92, -0.62]} hue="#e89860" scale={0.46} />
      <PaperLantern position={[1.05, 1.9, -0.58]} hue="#e8a878" scale={0.42} />

      {/* Back shelf + bottles (prop density) */}
      <mesh position={[1.45, 1.05, -1.7]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.08, 0.35]} />
        <meshStandardMaterial map={woodMap} color={woodDark} roughness={0.55} />
      </mesh>
      <mesh position={[1.45, 1.45, -1.7]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.06, 0.32]} />
        <meshStandardMaterial map={woodMap} color={woodDark} roughness={0.55} />
      </mesh>
      <group position={[0.9, 1.15, -1.65]}>
        {[0, 0.14, 0.28, 0.42, 0.56, 0.72, 0.88, 1.02].map((x, i) => (
          <CondimentBottle
            key={i}
            position={[x, 0.18, (i % 2) * 0.06]}
            color={['#3a1828', '#1a3040', '#2a2010', '#402020', '#1a2830', '#402818', '#301828', '#203028'][i]}
            height={0.28 + (i % 3) * 0.06}
          />
        ))}
      </group>
      {/* Shelf upper bottles */}
      <group position={[1.0, 1.55, -1.65]}>
        {[0, 0.18, 0.36, 0.54, 0.72].map((x, i) => (
          <CondimentBottle
            key={i}
            position={[x, 0.12, 0]}
            color={['#502030', '#204040', '#403010', '#302040', '#104028'][i]}
            height={0.22 + (i % 2) * 0.1}
          />
        ))}
      </group>

      {/* Menu board on back wall — thick wood frame + chalk craft (r31 A #3: not flat untextured card) */}
      <group position={[-1.35, 1.75, -1.78]}>
        {/* Wood housing (depth) */}
        <mesh castShadow>
          <boxGeometry args={[1.42, 1.02, 0.12]} />
          <meshStandardMaterial map={woodMap} color="#1a1410" roughness={0.72} />
        </mesh>
        {/* Frame rails — timber lip so board reads framed craft */}
        <mesh position={[0, 0.48, 0.05]}>
          <boxGeometry args={[1.42, 0.07, 0.07]} />
          <meshStandardMaterial map={woodMap} color="#4a3220" roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.48, 0.05]}>
          <boxGeometry args={[1.42, 0.07, 0.07]} />
          <meshStandardMaterial map={woodMap} color="#4a3220" roughness={0.55} />
        </mesh>
        <mesh position={[-0.68, 0, 0.05]}>
          <boxGeometry args={[0.07, 0.96, 0.07]} />
          <meshStandardMaterial map={woodMap} color="#4a3220" roughness={0.55} />
        </mesh>
        <mesh position={[0.68, 0, 0.05]}>
          <boxGeometry args={[0.07, 0.96, 0.07]} />
          <meshStandardMaterial map={woodMap} color="#4a3220" roughness={0.55} />
        </mesh>
        {/* Chalk face slab — deep green with grit (not flat plastic card) */}
        <mesh position={[0, 0, 0.07]} castShadow>
          <boxGeometry args={[1.22, 0.84, 0.035]} />
          <meshStandardMaterial
            color="#1c2e26"
            emissive="#0a1410"
            emissiveIntensity={0.18}
            roughness={0.97}
            metalness={0.02}
          />
        </mesh>
        {/* Soft chalk grain wash — protect chalk under key */}
        <mesh position={[0, 0, 0.09]}>
          <planeGeometry args={[1.18, 0.8]} />
          <meshStandardMaterial color="#2e4036" roughness={0.98} transparent opacity={0.48} />
        </mesh>
        {/* Chalk dust / wipe marks (menu craft density) */}
        <mesh position={[0.15, -0.12, 0.092]} rotation={[0, 0, 0.08]}>
          <planeGeometry args={[0.7, 0.22]} />
          <meshBasicMaterial
            color="#d8f0c8"
            transparent
            opacity={0.06}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Board face lift so chalk stays above midtones */}
        <mesh position={[0, 0, 0.094]}>
          <planeGeometry args={[1.14, 0.76]} />
          <meshBasicMaterial
            color="#e0f8d0"
            transparent
            opacity={0.07}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Underline rule under SPECIALS (print craft) */}
        <mesh position={[0, 0.2, 0.096]}>
          <planeGeometry args={[0.72, 0.008]} />
          <meshBasicMaterial color="#e8ffe0" transparent opacity={0.55} depthWrite={false} toneMapped={false} />
        </mesh>
        <Text position={[0, 0.28, 0.1]} fontSize={0.088} color="#fffef5" anchorX="center">
          SPECIALS
        </Text>
        <Text
          position={[0, -0.02, 0.1]}
          fontSize={0.056}
          color="#f0ffe8"
          anchorX="center"
          maxWidth={1.05}
          lineHeight={1.45}
        >
          {`Miso Multi-Agent\nBrown Sugar Boba\nTaro Monument\nLaptop Lunch`}
        </Text>
      </group>

      {/* Noren curtains — loop-r31 residual A #3 (A/B/C): multi-fold wine/indigo cloth with
          weave + stripe/mon print. Side panels longer; center short so food stays readable.
          ZERO emissive; thin cloth depth (not flat untextured cards under warm key). */}
      {[-1.12, 0, 1.12].map((x, panelI) => {
        const maps = panelI === 1 ? norenFabrics.wine : norenFabrics.indigo
        // Deep cloth midtones (wine center / indigo flanks — not hot pink / cyan mush)
        const baseHue = panelI === 1 ? '#8a3048' : '#3a3868'
        const strips = 4
        const stripW = 0.105
        const gap = 0.014
        const totalW = strips * stripW + (strips - 1) * gap
        // Center panel shorter so ramen/boba clear; flanks hang fuller fabric mass
        const baseLen = panelI === 1 ? 0.48 : 0.78
        return (
          <group key={panelI} position={[x, 1.95, 0.18]}>
            {/* Rod (horizontal dark timber) */}
            <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.012, 0.012, totalW + 0.1, 10]} />
              <meshStandardMaterial color="#2a1c14" roughness={0.65} metalness={0.2} />
            </mesh>
            {/* Rod end caps */}
            {[-1, 1].map((side) => (
              <mesh key={side} position={[(totalW / 2 + 0.025) * side, 0.42, 0]}>
                <sphereGeometry args={[0.016, 8, 8]} />
                <meshStandardMaterial color="#1a100c" roughness={0.55} metalness={0.25} />
              </mesh>
            ))}
            {Array.from({ length: strips }, (_, s) => {
              const sx = -totalW / 2 + stripW / 2 + s * (stripW + gap)
              const foldZ = Math.sin(s * 1.9 + panelI * 0.7) * 0.028
              const len = baseLen + (s % 3) * 0.03 - (panelI === 1 ? 0 : 0)
              const sway = 0.028 * (s - 1.5)
              // Three vertical segments for S-curve cloth hang (not single flat box card)
              const segH = len / 3
              const segs = [
                { y: segH, z: 0, rx: 0.02 * (s - 1.5) },
                { y: 0, z: foldZ * 0.6, rx: 0.05 * (s % 2 === 0 ? 1 : -1) },
                { y: -segH, z: foldZ * 1.2, rx: -0.04 * (s - 1.5) },
              ]
              return (
                <group
                  key={s}
                  position={[sx, 0.02, foldZ]}
                  rotation={[0.03 * (s - 1.5), sway * 0.12, foldZ * 0.5]}
                >
                  {segs.map((seg, si) => (
                    <group key={si} position={[0, seg.y, seg.z]} rotation={[seg.rx, 0, 0]}>
                      {/* Main cloth body — thin weave mass + print map */}
                      <mesh castShadow receiveShadow>
                        <boxGeometry args={[stripW * 0.94, segH * 1.02, 0.022]} />
                        <meshPhysicalMaterial
                          map={maps.albedo}
                          roughnessMap={maps.roughness}
                          color={baseHue}
                          emissive="#000000"
                          emissiveIntensity={0}
                          roughness={0.9}
                          metalness={0}
                          sheen={0.35}
                          sheenRoughness={0.78}
                          sheenColor={panelI === 1 ? '#b05870' : '#585088'}
                          clearcoat={0}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                      {/* Back lining (thickness / two-sided cloth) */}
                      <mesh position={[0, 0, -0.014]}>
                        <boxGeometry args={[stripW * 0.88, segH * 0.98, 0.01]} />
                        <meshStandardMaterial
                          color={panelI === 1 ? '#3a1018' : '#141028'}
                          roughness={0.96}
                        />
                      </mesh>
                      {/* Side edge ribbon (cloth edge catch under key) */}
                      <mesh position={[stripW * 0.44, 0, 0]}>
                        <boxGeometry args={[0.006, segH * 0.97, 0.02]} />
                        <meshStandardMaterial
                          color={panelI === 1 ? '#6a2038' : '#3a3460'}
                          roughness={0.88}
                        />
                      </mesh>
                      <mesh position={[-stripW * 0.44, 0, 0]}>
                        <boxGeometry args={[0.006, segH * 0.97, 0.02]} />
                        <meshStandardMaterial
                          color={panelI === 1 ? '#4a1428' : '#221838'}
                          roughness={0.9}
                        />
                      </mesh>
                      {/* Vertical fold ridge */}
                      <mesh position={[stripW * 0.18, 0, 0.01]}>
                        <boxGeometry args={[0.01, segH * 0.94, 0.004]} />
                        <meshStandardMaterial
                          color={panelI === 1 ? '#7a3048' : '#484070'}
                          roughness={0.86}
                          transparent
                          opacity={0.38}
                        />
                      </mesh>
                    </group>
                  ))}
                  {/* Hem weight bar (bottom cloth mass) */}
                  <mesh position={[0, -len * 0.5 + 0.01, foldZ * 1.1]} castShadow>
                    <boxGeometry args={[stripW * 0.9, 0.02, 0.018]} />
                    <meshPhysicalMaterial
                      map={maps.albedo}
                      color={panelI === 1 ? '#5a1830' : '#201838'}
                      roughness={0.9}
                      sheen={0.18}
                      sheenColor={panelI === 1 ? '#804050' : '#403868'}
                    />
                  </mesh>
                  {/* Hang loop at rod */}
                  <mesh position={[0, len * 0.5 + 0.03, 0]}>
                    <torusGeometry args={[0.01, 0.0035, 6, 10]} />
                    <meshStandardMaterial color="#2a1c14" metalness={0.3} roughness={0.5} />
                  </mesh>
                </group>
              )
            })}
          </group>
        )
      })}

      {/* Stickers / neon tiles on front posts — dim accents (r27 #2: restrain pink wash) */}
      {[
        { p: [-2.25, 1.4, 0.7] as [number, number, number], c: '#c84868', e: 0.28 },
        { p: [-2.25, 1.6, 0.7] as [number, number, number], c: '#2dffb0', e: 0.35 },
        { p: [-2.25, 1.2, 0.7] as [number, number, number], c: '#2db0ff', e: 0.35 },
        { p: [2.25, 1.5, 0.7] as [number, number, number], c: '#ffb02d', e: 0.35 },
        { p: [2.25, 1.3, 0.7] as [number, number, number], c: '#7080c0', e: 0.28 },
      ].map((t, i) => (
        <mesh key={i} position={t.p}>
          <boxGeometry args={[0.05, 0.16, 0.16]} />
          <meshStandardMaterial color={t.c} emissive={t.c} emissiveIntensity={t.e} toneMapped={false} />
        </mesh>
      ))}

      {/* Booth nook left — residual #2 mid wood + tufted leather (kill black plastic) */}
      <group position={[-1.7, 0.05, 0.98]}>
        {/* Plinth base — mid timber pad (was #2a→void) */}
        <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.48, 0.32, 1.22]} />
          <meshStandardMaterial
            map={counterAlbedo}
            roughnessMap={varnishRough}
            color="#5a3828"
            roughness={0.58}
          />
        </mesh>
        {/* Seat box */}
        <mesh position={[0, 0.38, -0.05]} castShadow receiveShadow>
          <boxGeometry args={[1.36, 0.36, 1.05]} />
          <meshStandardMaterial
            map={counterAlbedo}
            roughnessMap={varnishRough}
            color="#6a422c"
            roughness={0.5}
          />
        </mesh>
        {/* Seat front apron (wood thickness + grain) */}
        <mesh position={[0, 0.32, 0.48]} castShadow>
          <boxGeometry args={[1.34, 0.24, 0.1]} />
          <meshStandardMaterial
            map={counterAlbedo}
            roughnessMap={varnishRough}
            color="#6a4028"
            roughness={0.46}
          />
        </mesh>
        {/* Cushion top — oxblood night fabric (r27 #3 A: kill magenta plastic mush) */}
        <mesh position={[0, 0.6, -0.05]} castShadow receiveShadow>
          <boxGeometry args={[1.28, 0.16, 0.96]} />
          <meshPhysicalMaterial
            map={leatherMaps.albedo}
            roughnessMap={leatherMaps.roughness}
            color="#4a2432"
            roughness={0.84}
            sheen={0.28}
            sheenRoughness={0.75}
            sheenColor="#6a3850"
            clearcoat={0.02}
            clearcoatRoughness={0.85}
            envMapIntensity={0.35}
          />
        </mesh>
        {/* Physical tuft buttons (3×2 grid — silhouette read at beauty FOV) */}
        {([-0.32, 0, 0.32] as const).flatMap((bx, bi) =>
          ([-0.22, 0.18] as const).map((bz, bj) => (
            <mesh key={`tuft-${bi}-${bj}`} position={[bx, 0.69, bz - 0.05]} castShadow>
              <sphereGeometry args={[0.028, 10, 10]} />
              <meshPhysicalMaterial
                color="#241018"
                roughness={0.7}
                clearcoat={0.15}
                clearcoatRoughness={0.55}
                sheen={0.15}
                sheenColor="#4a2838"
              />
            </mesh>
          )),
        )}
        {/* Diamond pipe / welt seams between buttons */}
        {([-0.16, 0.16] as const).map((bx, i) => (
          <mesh key={`seam-x-${i}`} position={[bx, 0.685, -0.05]} rotation={[0, 0, 0.35 * (i ? -1 : 1)]}>
            <boxGeometry args={[0.7, 0.012, 0.018]} />
            <meshStandardMaterial color="#2a1018" roughness={0.85} />
          </mesh>
        ))}
        {/* Cushion edge welt */}
        <mesh position={[0, 0.53, 0.44]}>
          <boxGeometry args={[1.24, 0.05, 0.05]} />
          <meshStandardMaterial
            map={leatherMaps.albedo}
            color="#3a1824"
            roughness={0.82}
          />
        </mesh>
        {/* Back rest pad — oxblood fabric nap (r27 #3 A: not pink plastic) */}
        <mesh position={[0, 1.05, -0.48]} castShadow receiveShadow>
          <boxGeometry args={[1.3, 0.9, 0.18]} />
          <meshPhysicalMaterial
            map={leatherMaps.albedo}
            roughnessMap={leatherMaps.roughness}
            color="#422030"
            roughness={0.82}
            sheen={0.24}
            sheenRoughness={0.72}
            sheenColor="#5a3448"
            clearcoat={0.02}
            clearcoatRoughness={0.88}
            envMapIntensity={0.32}
          />
        </mesh>
        {/* Back-rest tuft buttons (2×3) */}
        {([-0.35, 0, 0.35] as const).flatMap((bx, bi) =>
          ([0.85, 1.05, 1.25] as const).map((by, bj) => (
            <mesh key={`btuft-${bi}-${bj}`} position={[bx, by, -0.38]} castShadow>
              <sphereGeometry args={[0.024, 8, 8]} />
              <meshPhysicalMaterial
                color="#1c0c12"
                roughness={0.68}
                clearcoat={0.12}
                sheen={0.12}
                sheenColor="#3a2030"
              />
            </mesh>
          )),
        )}
        {/* Wood back panel (thickness behind cushion) */}
        <mesh position={[0, 1.0, -0.6]} castShadow>
          <boxGeometry args={[1.38, 1.0, 0.14]} />
          <meshStandardMaterial
            map={counterAlbedo}
            roughnessMap={varnishRough}
            color="#5a3824"
            roughness={0.5}
          />
        </mesh>
        {/* Wood back rail + top cap */}
        <mesh position={[0, 1.48, -0.48]} castShadow>
          <boxGeometry args={[1.4, 0.12, 0.22]} />
          <meshStandardMaterial
            map={counterAlbedo}
            roughnessMap={varnishRough}
            color="#6a4228"
            roughness={0.42}
          />
        </mesh>
        {/* Side arm rails — thicker timber + grain maps */}
        <mesh position={[-0.66, 0.86, 0.05]} castShadow>
          <boxGeometry args={[0.16, 0.7, 1.0]} />
          <meshStandardMaterial
            map={counterAlbedo}
            roughnessMap={varnishRough}
            color="#6a4028"
            roughness={0.48}
          />
        </mesh>
        <mesh position={[0.66, 0.86, 0.05]} castShadow>
          <boxGeometry args={[0.16, 0.7, 1.0]} />
          <meshStandardMaterial
            map={counterAlbedo}
            roughnessMap={varnishRough}
            color="#6a4028"
            roughness={0.48}
          />
        </mesh>
        {/* Arm cap rails — varnish catch */}
        <mesh position={[-0.66, 1.22, 0.08]} castShadow>
          <boxGeometry args={[0.18, 0.06, 0.94]} />
          <meshPhysicalMaterial
            map={counterAlbedo}
            roughnessMap={varnishRough}
            color="#7a5230"
            roughness={0.34}
            clearcoat={0.5}
            clearcoatRoughness={0.32}
          />
        </mesh>
        <mesh position={[0.66, 1.22, 0.08]} castShadow>
          <boxGeometry args={[0.18, 0.06, 0.94]} />
          <meshPhysicalMaterial
            map={counterAlbedo}
            roughnessMap={varnishRough}
            color="#7a5230"
            roughness={0.34}
            clearcoat={0.5}
            clearcoatRoughness={0.32}
          />
        </mesh>
        {/* Booth table — thick oak + residual #3 grain/varnish (match counter family) */}
        <mesh position={[0.15, 0.76, 0.25]} castShadow receiveShadow>
          <boxGeometry args={[0.78, 0.12, 0.78]} />
          <meshStandardMaterial
            map={woodCounter}
            roughnessMap={varnishRough}
            color="#5a3820"
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0.15, 0.83, 0.25]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.055, 0.8]} />
          <meshPhysicalMaterial
            map={counterAlbedo}
            roughnessMap={varnishRough}
            clearcoatRoughnessMap={clearcoatRough}
            color="#8a5a36"
            roughness={0.26}
            clearcoat={0.82}
            clearcoatRoughness={0.16}
            metalness={0.03}
            envMapIntensity={1.2}
            sheen={0.16}
            sheenColor="#c8a070"
          />
        </mesh>
        {/* Table edge thickness reveal + edge wear */}
        <mesh position={[0.15, 0.7, 0.25]} castShadow>
          <boxGeometry args={[0.84, 0.05, 0.84]} />
          <meshStandardMaterial map={counterAlbedo} color="#4a2e18" roughness={0.68} />
        </mesh>
        {/* Front lip wear on booth table */}
        <mesh position={[0.15, 0.86, 0.62]} castShadow>
          <boxGeometry args={[0.76, 0.018, 0.05]} />
          <meshStandardMaterial map={counterAlbedo} color="#5a3820" roughness={0.88} />
        </mesh>
        <mesh position={[0.15, 0.5, 0.25]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.46, 12]} />
          <meshStandardMaterial
            map={counterAlbedo}
            roughnessMap={varnishRough}
            color="#5a3824"
            roughness={0.5}
          />
        </mesh>
        {/* Chrome foot rail under seat (residual #5) */}
        <mesh position={[0, 0.2, 0.54]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 1.22, 12]} />
          <meshStandardMaterial color="#c8d4dc" metalness={0.94} roughness={0.13} envMapIntensity={1.55} />
        </mesh>
        <mesh position={[-0.52, 0.16, 0.48]} castShadow>
          <boxGeometry args={[0.03, 0.1, 0.05]} />
          <meshStandardMaterial color="#a0aab2" metalness={0.9} roughness={0.18} />
        </mesh>
        <mesh position={[0.52, 0.16, 0.48]} castShadow>
          <boxGeometry args={[0.03, 0.1, 0.05]} />
          <meshStandardMaterial color="#a0aab2" metalness={0.9} roughness={0.18} />
        </mesh>
      </group>

      {/* A-frame chalkboard outside */}
      <AFrameChalkboard position={[2.75, 0.05, 1.25]} />

      {/* Full directional signpost — r31 A #1+#2: far street-left + forward so
          frosted pinhead lanterns never bury marquee at beauty hero·leftNeon FOV */}
      <SignPost position={[-4.2, 0, 2.55]} />

      {/* ═══ ROOF-TOP CLUTTER (jesse density) ═══ */}
      <group position={[0, 3.35, -0.85]}>
        <mesh position={[-0.9, 0.28, 0]} castShadow>
          <boxGeometry args={[1.0, 0.55, 0.55]} />
          <meshStandardMaterial color="#1a2030" metalness={0.35} roughness={0.48} />
        </mesh>
        <mesh position={[0.55, 0.4, 0.1]} castShadow>
          <boxGeometry args={[0.6, 0.8, 0.45]} />
          <meshStandardMaterial color="#2a1828" roughness={0.55} />
        </mesh>
        <mesh position={[1.35, 0.2, -0.15]} castShadow>
          <boxGeometry args={[0.45, 0.4, 0.4]} />
          <meshStandardMaterial color="#182028" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Antenna */}
        <mesh position={[1.5, 0.85, 0]}>
          <cylinderGeometry args={[0.018, 0.022, 1.35, 8]} />
          <meshStandardMaterial color="#8899aa" metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[1.5, 1.55, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#66f0ff" emissive="#22e0ff" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        {/* Floating screens / posters */}
        <mesh position={[-0.25, 0.6, 0.35]} rotation={[0.12, 0.25, 0]}>
          <planeGeometry args={[0.75, 0.42]} />
          <meshStandardMaterial color="#0a2030" emissive="#2a80c0" emissiveIntensity={0.65} toneMapped={false} />
        </mesh>
        <mesh position={[0.95, 0.7, 0.3]} rotation={[-0.1, -0.18, 0]}>
          <planeGeometry args={[0.55, 0.38]} />
          <meshStandardMaterial color="#0a1820" emissive="#3080a0" emissiveIntensity={0.42} toneMapped={false} />
        </mesh>
        {/* Cable runs */}
        {[-1.1, 0.1, 1.2].map((x, i) => (
          <mesh key={i} position={[x, 0.05, 0.4]} rotation={[0.3, 0, 0.1 * (i - 1)]}>
            <cylinderGeometry args={[0.01, 0.01, 0.9 + i * 0.1, 6]} />
            <meshStandardMaterial color="#1a1a22" />
          </mesh>
        ))}
        {/* Tiny bird silhouette */}
        <mesh position={[-0.4, 0.95, 0.2]} rotation={[0, 0.4, 0.1]}>
          <boxGeometry args={[0.14, 0.04, 0.06]} />
          <meshStandardMaterial color="#2a2030" />
        </mesh>
      </group>

      {/* Decorative hanging cables from roof front */}
      {[-1.4, -0.4, 0.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 2.75, 0.5]} rotation={[0.4, 0, 0.05 * (i - 1.5)]}>
          <cylinderGeometry args={[0.008, 0.008, 0.55 + (i % 2) * 0.15, 6]} />
          <meshStandardMaterial color="#1a1a22" />
        </mesh>
      ))}

      {/* Second decorative bowl — ceramic clearcoat + broth (prop density, not Standard trash) */}
      <group position={[1.55, 1.06, -0.55]} scale={0.55}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.16, 0.14, 28]} />
          <meshPhysicalMaterial
            color="#f0e8dc"
            roughness={0.22}
            clearcoat={1}
            clearcoatRoughness={0.12}
            metalness={0.02}
          />
        </mesh>
        <mesh position={[0, 0.055, 0]}>
          <cylinderGeometry args={[0.195, 0.195, 0.035, 28]} />
          <meshPhysicalMaterial
            color="#e8d8a8"
            roughness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.05}
            transmission={0.15}
            thickness={0.4}
            transparent
            opacity={0.95}
            ior={1.35}
            emissive="#c87830"
            emissiveIntensity={0.12}
          />
        </mesh>
        {/* Rim bead */}
        <mesh position={[0, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.205, 0.012, 8, 28]} />
          <meshPhysicalMaterial color="#ebe2d6" roughness={0.2} clearcoat={0.85} clearcoatRoughness={0.1} />
        </mesh>
        <mesh position={[0.04, 0.12, 0.02]} rotation={[0.2, 0, 0.3]}>
          <torusGeometry args={[0.06, 0.014, 8, 16, Math.PI]} />
          <meshPhysicalMaterial color="#f0d8a0" roughness={0.4} clearcoat={0.25} />
        </mesh>
      </group>

      {/* Napkin holder / small tray on counter */}
      <mesh position={[-1.7, 1.08, -0.35]} castShadow>
        <boxGeometry args={[0.18, 0.06, 0.14]} />
        <meshStandardMaterial map={woodMap} color="#4a3020" roughness={0.5} />
      </mesh>
      <mesh position={[-1.7, 1.14, -0.35]}>
        <boxGeometry args={[0.12, 0.08, 0.02]} />
        <meshStandardMaterial color="#f0e8e0" roughness={0.9} />
      </mesh>

      {/* Steam — tight rear bowls only so SPECIALS + counter grain survive (loop-r20 #2/#3) */}
      <SteamField position={[-0.85, 1.14, -0.52]} count={5} spread={0.1} />
      <SteamField position={[0.55, 1.16, -0.55]} count={4} spread={0.08} />

      {/* ═══ LIGHTING RIG — residual #1+#2 loop-r21: exterior fill + break warm underglow strip ═══ */}
      {/* Soft base lift — cool ground + warm sky split (loop-r26 #2 A: not magenta flood) */}
      <ambientLight intensity={0.34} />
      <hemisphereLight args={['#e8d8c0', '#0a121c', 1.12]} />
      {/* Single shadow-casting key — warm street side */}
      <directionalLight
        castShadow
        position={[2.8, 4.2, 3.2]}
        intensity={1.05}
        color="#ffd8b8"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={16}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.00025}
      />
      {/* Split under-awning keys — residual #3: break hot strip that flattens grain + stool tops */}
      <pointLight position={[-0.95, 2.2, 0.0]} intensity={1.35} color="#ffc090" distance={5.2} decay={2} />
      <pointLight position={[1.05, 2.18, 0.05]} intensity={1.25} color="#ffb878" distance={5.2} decay={2} />
      <pointLight position={[0.05, 2.4, -0.45]} intensity={1.15} color="#e8c0a0" distance={5.6} decay={2} />
      <pointLight position={[-0.2, 2.05, 0.35]} intensity={0.55} color="#d8b090" distance={4.0} decay={2} />
      {/* Ceiling bounce — soft warm down-fill for enclosure walls/booth (not hotspot) */}
      <pointLight position={[0.1, 2.72, -0.7]} intensity={2.55} color="#e8b890" distance={7.8} decay={2} />
      {/* Rear-wall bounce — cool-neutral so back plaster/noren/chalk read without mud */}
      <pointLight position={[0, 1.7, -1.55]} intensity={2.55} color="#9aa8b8" distance={6.0} decay={2} />
      {/* Menu SPECIALS local fill — residual #3 chalk legibility under steam/haze */}
      <pointLight position={[-1.2, 1.85, -1.2]} intensity={1.15} color="#d8e8c8" distance={3.2} decay={2} />
      {/* Under-counter apron bounce — soft dual fill (no single floor/stool specular strip) */}
      <pointLight position={[-0.9, 0.62, 0.42]} intensity={0.55} color="#b89878" distance={3.4} decay={2} />
      <pointLight position={[1.0, 0.62, 0.42]} intensity={0.5} color="#b09068" distance={3.4} decay={2} />
      {/* Cool flank fill R — exterior siding / three-quarter (night-kiosk fill residual #1) */}
      <pointLight position={[3.2, 1.75, 1.15]} intensity={2.75} color="#80a8c0" distance={9.2} decay={2} />
      {/* Cool flank fill L — left siding midtones */}
      <pointLight position={[-3.15, 1.7, 1.0]} intensity={2.55} color="#78a4b8" distance={9.0} decay={2} />
      {/* Cool street fill L — secondary only */}
      <pointLight position={[-1.4, 1.6, 1.3]} intensity={1.55} color="#90c0d8" distance={6.2} decay={2} />
      {/* Front street cool fill — exterior posts + plinth midtones */}
      <pointLight position={[0.3, 1.5, 2.6]} intensity={1.55} color="#88a8c0" distance={7.5} decay={2} />
      {/* Cool ground up-fill — r27 #1 A: edge-biased night bounce, not full-stage gray flood */}
      <pointLight position={[0.15, 0.08, 1.6]} intensity={1.15} color="#6aa0b8" distance={6.8} decay={2} />
      <pointLight position={[-1.8, 0.1, 1.1]} intensity={0.95} color="#5e98b0" distance={5.8} decay={2} />
      <pointLight position={[1.9, 0.1, 1.1]} intensity={0.9} color="#5e98b0" distance={5.8} decay={2} />
      <pointLight position={[0.0, 0.06, 2.4]} intensity={1.05} color="#68a0b8" distance={6.8} decay={2} />
      {/* Outer street edge fill — three-quarter ground leaves pure black void */}
      <pointLight position={[0.2, 0.05, 3.4]} intensity={1.05} color="#5898b0" distance={7.5} decay={2} />
      <pointLight position={[-3.0, 0.12, 0.4]} intensity={0.75} color="#5488a0" distance={5.8} decay={2} />
      <pointLight position={[3.0, 0.12, 0.4]} intensity={0.75} color="#5488a0" distance={5.8} decay={2} />
      {/* Brand neon bounce — cool-dominant (r30 A: support fuller channel glass read) */}
      <pointLight position={[0.05, 3.16, 1.9]} intensity={0.32} color="#a878a0" distance={3.2} decay={2} />
      <pointLight position={[0.05, 3.05, 1.68]} intensity={0.88} color="#48d8ff" distance={3.8} decay={2} />
      {/* Signpost frosted lanterns — r31 A #1+#2: follow far-left post, dim fill only (no key steal) */}
      <pointLight position={[-4.2, 2.12, 2.55]} intensity={0.32} color="#ffe8d0" distance={3.2} decay={2} />
      <pointLight position={[-4.45, 2.12, 2.55]} intensity={0.2} color="#d0ecf8" distance={2.8} decay={2} />
      {/* Warm ground bounce — soft residual only; floor ≠ hot strip residual #3 */}
      <pointLight position={[0.2, 0.12, 0.55]} intensity={0.32} color="#b09068" distance={3.8} decay={2} />

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.78}
        scale={14}
        blur={2.2}
        far={5}
        resolution={512}
        frames={1}
        color="#050208"
      />
    </group>
  )
}
