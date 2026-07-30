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
      const envelope = Math.sin(cycle * Math.PI)
      const mat = child.material as THREE.MeshBasicMaterial
      mat.opacity = envelope * 0.38
      const sc = s.scale * (0.55 + cycle * 1.55)
      child.scale.set(sc * (1 + cycle * 0.35), sc * (1.1 + cycle * 0.9), sc)
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
            opacity={0.28}
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
 * Hot white core + colored fill + Physical glass sleeve (reads as tubing at beauty FOV).
 * Emissive + bloom only — no per-tube pointLights (FPS).
 */
function NeonTube({
  position,
  rotation = [0, 0, 0],
  args,
  color,
  intensity = 1.4,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  args: [number, number, number]
  color: string
  intensity?: number
}) {
  const [ax, ay, az] = args
  const len = Math.max(ax, ay, az)
  // Thicker glass sleeve so tubes read as volume, not hairlines
  const t = Math.max(0.02, Math.min(ax, ay, az) * 0.95)
  // Default cylinder is Y-up; reorient so length matches the longest box axis.
  let localRot: [number, number, number] = [0, 0, 0]
  let haloSize: [number, number] = [t * 5.2, len * 1.08]
  if (ax >= ay && ax >= az) {
    localRot = [0, 0, Math.PI / 2] // length → X
    haloSize = [len * 1.08, t * 5.2]
  } else if (az >= ax && az >= ay) {
    localRot = [Math.PI / 2, 0, 0] // length → Z
    haloSize = [t * 5.2, len * 1.08]
  }
  return (
    <group position={position} rotation={rotation}>
      {/* Tube body — localRot maps Y-up cylinder onto longest axis */}
      <group rotation={localRot}>
        {/* Hot white plasma core (feeds bloom — high contrast for letter readability) */}
        <mesh>
          <cylinderGeometry args={[t * 0.42, t * 0.42, len * 0.995, 10]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        {/* Colored gas fill */}
        <mesh>
          <cylinderGeometry args={[t * 0.68, t * 0.68, len * 0.998, 12]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.98} />
        </mesh>
        {/* Outer glass sleeve — Physical for rim highlight / glass thickness read */}
        <mesh>
          <cylinderGeometry args={[t, t, len, 14]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={intensity * 2.05}
            roughness={0.06}
            metalness={0.02}
            transmission={0.18}
            thickness={0.05}
            ior={1.45}
            transparent
            opacity={0.94}
            clearcoat={0.65}
            clearcoatRoughness={0.1}
            toneMapped={false}
          />
        </mesh>
        {/* Soft end roundedness (local Y) — small so letter joints don't blob */}
        <mesh position={[0, len * 0.5, 0]}>
          <sphereGeometry args={[t * 0.82, 8, 8]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <mesh position={[0, -len * 0.5, 0]}>
          <sphereGeometry args={[t * 0.82, 8, 8]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
      {/* Additive halo — primary face (stronger for tube readability) */}
      <mesh>
        <planeGeometry args={haloSize} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4 * Math.min(intensity, 2.2)}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Soft dual-axis halo so tubes stay round under orbit */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[haloSize[1] * 0.95, haloSize[0] * 0.65]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.18 * Math.min(intensity, 2.2)}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/** 2D stroke → NeonTube segment in the XY plane (channel letter building block). */
function NeonStroke({
  from,
  to,
  color,
  thickness = 0.017,
  intensity = 1.95,
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
  return (
    <NeonTube
      position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, z]}
      rotation={[0, 0, angle]}
      args={[Math.max(len, thickness * 1.6), thickness, thickness]}
      color={color}
      intensity={intensity}
    />
  )
}

/** Unit-box stroke tables (x,y in 0..1; y-up). Blocky channel-neon letterforms. */
const NEON_LETTER_STROKES: Record<string, [number, number, number, number][]> = {
  A: [
    [0.06, 0, 0.34, 1],
    [0.34, 1, 0.62, 0],
    [0.16, 0.36, 0.52, 0.36],
  ],
  B: [
    [0.08, 0, 0.08, 1],
    [0.08, 1, 0.48, 1],
    [0.48, 1, 0.58, 0.78],
    [0.58, 0.78, 0.48, 0.55],
    [0.48, 0.55, 0.08, 0.55],
    [0.48, 0.55, 0.6, 0.3],
    [0.6, 0.3, 0.48, 0],
    [0.48, 0, 0.08, 0],
  ],
  C: [
    [0.58, 0.88, 0.22, 1],
    [0.22, 1, 0.08, 0.72],
    [0.08, 0.72, 0.08, 0.28],
    [0.08, 0.28, 0.22, 0],
    [0.22, 0, 0.58, 0.12],
  ],
  E: [
    [0.1, 0, 0.1, 1],
    [0.1, 1, 0.58, 1],
    [0.1, 0.5, 0.48, 0.5],
    [0.1, 0, 0.58, 0],
  ],
  I: [
    [0.18, 1, 0.5, 1],
    [0.34, 1, 0.34, 0],
    [0.18, 0, 0.5, 0],
  ],
  K: [
    [0.1, 0, 0.1, 1],
    [0.1, 0.48, 0.58, 1],
    [0.1, 0.48, 0.58, 0],
  ],
  M: [
    [0.06, 0, 0.06, 1],
    [0.06, 1, 0.34, 0.42],
    [0.34, 0.42, 0.62, 1],
    [0.62, 1, 0.62, 0],
  ],
  N: [
    [0.1, 0, 0.1, 1],
    [0.1, 1, 0.58, 0],
    [0.58, 0, 0.58, 1],
  ],
  O: [
    [0.18, 0, 0.5, 0],
    [0.5, 0, 0.62, 0.22],
    [0.62, 0.22, 0.62, 0.78],
    [0.62, 0.78, 0.5, 1],
    [0.5, 1, 0.18, 1],
    [0.18, 1, 0.06, 0.78],
    [0.06, 0.78, 0.06, 0.22],
    [0.06, 0.22, 0.18, 0],
  ],
  R: [
    [0.1, 0, 0.1, 1],
    [0.1, 1, 0.48, 1],
    [0.48, 1, 0.58, 0.78],
    [0.58, 0.78, 0.48, 0.52],
    [0.48, 0.52, 0.1, 0.52],
    [0.32, 0.52, 0.58, 0],
  ],
  S: [
    [0.56, 0.88, 0.22, 1],
    [0.22, 1, 0.08, 0.78],
    [0.08, 0.78, 0.2, 0.55],
    [0.2, 0.55, 0.5, 0.45],
    [0.5, 0.45, 0.6, 0.22],
    [0.6, 0.22, 0.42, 0],
    [0.42, 0, 0.1, 0.1],
  ],
  V: [
    [0.06, 1, 0.34, 0],
    [0.34, 0, 0.62, 1],
  ],
  "'": [[0.28, 0.78, 0.28, 1]],
  '&': [
    [0.48, 0.85, 0.28, 1],
    [0.28, 1, 0.12, 0.78],
    [0.12, 0.78, 0.28, 0.55],
    [0.28, 0.55, 0.52, 0.28],
    [0.52, 0.28, 0.42, 0],
    [0.42, 0, 0.12, 0.12],
    [0.2, 0.55, 0.58, 0],
  ],
}

/**
 * Channel-style neon word — glass tube strokes, not Text/flat UI type.
 * Dual-color: pink primary with cyan accents on alternate glyphs when dual=true.
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
  thickness = 0.016,
  intensity = 2.05,
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
    const w = ch === ' ' ? letterW * 0.45 : narrow ? letterW * 0.62 : wide ? letterW * 1.15 : letterW
    const entry = { ch, x, w, i }
    x += w + (ch === ' ' ? gap * 0.4 : gap)
    return entry
  })
  const totalW = x - gap
  return (
    <group position={[position[0] - totalW / 2, position[1], position[2]]}>
      {laid.map(({ ch, x: lx, w, i }) => {
        if (ch === ' ') return null
        const strokes = NEON_LETTER_STROKES[ch]
        if (!strokes) return null
        const col = dual && i % 2 === 1 ? accent : color
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
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}

/**
 * Canvas fabric weave maps — residual #1 (noren/awning fabric, not plastic).
 * Albedo: dyed canvas weave + warp/weft + soft wear. Roughness: sheen breakup.
 */
function makeFabricMaps(baseRgb: [number, number, number]): {
  albedo: THREE.CanvasTexture
  roughness: THREE.CanvasTexture
} {
  const size = 256
  const [br, bg, bb] = baseRgb
  const aCanvas = document.createElement('canvas')
  aCanvas.width = aCanvas.height = size
  const aCtx = aCanvas.getContext('2d')!
  aCtx.fillStyle = `rgb(${br},${bg},${bb})`
  aCtx.fillRect(0, 0, size, size)
  // Warp / weft thread grid (canvas tell)
  for (let i = 0; i < size; i += 3) {
    const shade = (i % 6 === 0 ? 14 : 6) * (0.6 + Math.sin(i * 0.2) * 0.4)
    aCtx.fillStyle = `rgba(${Math.min(255, br + shade)},${Math.min(255, bg + shade * 0.55)},${Math.min(255, bb + shade * 0.4)},0.12)`
    aCtx.fillRect(i, 0, 1, size)
    aCtx.fillStyle = `rgba(${Math.max(0, br - shade)},${Math.max(0, bg - shade * 0.7)},${Math.max(0, bb - shade * 0.5)},0.1)`
    aCtx.fillRect(0, i, size, 1)
  }
  // Soft dye mottling
  for (let i = 0; i < 90; i++) {
    const cx = Math.random() * size
    const cy = Math.random() * size
    const r = 8 + Math.random() * 28
    const g = aCtx.createRadialGradient(cx, cy, 1, cx, cy, r)
    const lite = Math.random() > 0.45
    g.addColorStop(
      0,
      lite
        ? `rgba(${br + 40},${bg + 18},${bb + 12},0.14)`
        : `rgba(${Math.max(0, br - 30)},${Math.max(0, bg - 22)},${Math.max(0, bb - 18)},0.16)`,
    )
    g.addColorStop(1, 'rgba(0,0,0,0)')
    aCtx.fillStyle = g
    aCtx.beginPath()
    aCtx.arc(cx, cy, r, 0, Math.PI * 2)
    aCtx.fill()
  }
  // Fine fiber noise
  for (let i = 0; i < 2800; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const v = (Math.random() - 0.5) * 28
    aCtx.fillStyle = `rgba(${br + v},${bg + v * 0.6},${bb + v * 0.4},0.07)`
    aCtx.fillRect(x, y, 1.2, 1.6)
  }

  const rCanvas = document.createElement('canvas')
  rCanvas.width = rCanvas.height = size
  const rCtx = rCanvas.getContext('2d')!
  rCtx.fillStyle = '#b0b0b0'
  rCtx.fillRect(0, 0, size, size)
  // Thread-direction roughness lanes (darker = smoother sheen)
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * size
    rCtx.strokeStyle = `rgba(55,55,55,${0.12 + Math.random() * 0.25})`
    rCtx.lineWidth = 1 + Math.random() * 3
    rCtx.beginPath()
    rCtx.moveTo(0, y)
    for (let x = 0; x <= size; x += 8) {
      rCtx.lineTo(x, y + Math.sin(x * 0.04 + i) * 2)
    }
    rCtx.stroke()
  }
  // Worn matte patches
  for (let i = 0; i < 18; i++) {
    const cx = Math.random() * size
    const cy = Math.random() * size
    const r = 10 + Math.random() * 30
    const g = rCtx.createRadialGradient(cx, cy, 1, cx, cy, r)
    g.addColorStop(0, `rgba(210,210,210,${0.35 + Math.random() * 0.35})`)
    g.addColorStop(1, 'rgba(180,180,180,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.arc(cx, cy, r, 0, Math.PI * 2)
    rCtx.fill()
  }

  const albedo = new THREE.CanvasTexture(aCanvas)
  albedo.colorSpace = THREE.SRGBColorSpace
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping
  albedo.repeat.set(3.2, 1.6)
  albedo.anisotropy = 4
  albedo.needsUpdate = true

  const roughness = new THREE.CanvasTexture(rCanvas)
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping
  roughness.repeat.set(3.2, 1.6)
  roughness.anisotropy = 2
  roughness.needsUpdate = true

  return { albedo, roughness }
}

/**
 * Fabric awning — residual #1: cloth body + draped valance panels (not plastic half-discs).
 * Thick canopy mass, weave maps, sheen, multi-layer scallop flaps with lining.
 */
function ScallopedAwning() {
  const scallops = 9
  const width = 4.6
  const step = width / scallops
  const fabricMaps = useMemo(() => makeFabricMaps([196, 40, 98]), [])
  return (
    <group position={[0, 2.28, 0.55]}>
      {/* Main fabric body (thick canvas slab) */}
      <mesh position={[0, 0.08, -0.22]} rotation={[-0.38, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.14, 1.15]} />
        <meshPhysicalMaterial
          map={fabricMaps.albedo}
          roughnessMap={fabricMaps.roughness}
          color="#d03068"
          emissive="#c02050"
          emissiveIntensity={0.06}
          roughness={0.78}
          metalness={0}
          sheen={0.55}
          sheenRoughness={0.62}
          sheenColor="#ff80a8"
        />
      </mesh>
      {/* Weave fold ridges (stitch seams) */}
      {[-0.38, -0.12, 0.14, 0.38].map((z, i) => (
        <mesh key={i} position={[0, 0.15 - i * 0.008, -0.22 + z * 0.12]} rotation={[-0.38, 0, 0]}>
          <boxGeometry args={[width - 0.1, 0.018, 0.055]} />
          <meshPhysicalMaterial
            map={fabricMaps.albedo}
            color="#9a1848"
            roughness={0.86}
            sheen={0.3}
            sheenColor="#c04070"
          />
        </mesh>
      ))}
      {/* Underside lining (warm bounce, matte cloth not pure emissive plane) */}
      <mesh position={[0, -0.03, -0.15]} rotation={[-0.38, 0, 0]}>
        <boxGeometry args={[width - 0.08, 0.028, 1.05]} />
        <meshStandardMaterial
          color="#ff9a68"
          emissive="#ff8050"
          emissiveIntensity={0.32}
          roughness={0.94}
          toneMapped={false}
        />
      </mesh>
      {/* Front valance bar (wood/metal rod) */}
      <mesh position={[0, -0.02, 0.32]} castShadow>
        <boxGeometry args={[width + 0.08, 0.05, 0.07]} />
        <meshStandardMaterial color="#5a1830" roughness={0.5} metalness={0.22} />
      </mesh>
      {/* Scallop flaps — multi-layer draped cloth panels (not half-disc plastic) */}
      {Array.from({ length: scallops }, (_, i) => {
        const x = -width / 2 + step * 0.5 + i * step
        const sag = (i % 2) * 0.025 + Math.sin(i * 0.9) * 0.01
        const w = step * 0.88
        return (
          <group key={i} position={[x, -0.12 - sag, 0.34]} rotation={[0.18 + sag * 2, 0, (i - 4) * 0.012]}>
            {/* Outer face cloth */}
            <mesh castShadow position={[0, -0.1, 0.01]}>
              <boxGeometry args={[w, 0.22, 0.028]} />
              <meshPhysicalMaterial
                map={fabricMaps.albedo}
                roughnessMap={fabricMaps.roughness}
                color={i % 2 === 0 ? '#c42862' : '#b02058'}
                emissive="#d02860"
                emissiveIntensity={0.05}
                roughness={0.8}
                sheen={0.5}
                sheenRoughness={0.65}
                sheenColor="#ff70a0"
              />
            </mesh>
            {/* Rounded bottom hem (soft cloth edge — thin cylinder, not disc plate) */}
            <mesh position={[0, -0.21, 0.01]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.018, 0.018, w * 0.92, 10]} />
              <meshPhysicalMaterial
                map={fabricMaps.albedo}
                color="#a01848"
                roughness={0.82}
                sheen={0.4}
                sheenColor="#e05080"
              />
            </mesh>
            {/* Inner lining (thickness read) */}
            <mesh position={[0, -0.09, -0.012]}>
              <boxGeometry args={[w * 0.9, 0.18, 0.012]} />
              <meshStandardMaterial color="#701030" roughness={0.9} />
            </mesh>
            {/* Center crease fold highlight */}
            <mesh position={[0, -0.08, 0.026]}>
              <boxGeometry args={[0.012, 0.16, 0.006]} />
              <meshStandardMaterial color="#e05080" roughness={0.7} transparent opacity={0.4} />
            </mesh>
          </group>
        )
      })}
      {/* Side flaps — thick fabric returns */}
      <mesh position={[-width / 2 - 0.02, 0.05, -0.15]} rotation={[0, 0, 0.12]} castShadow>
        <boxGeometry args={[0.09, 0.58, 0.92]} />
        <meshPhysicalMaterial
          map={fabricMaps.albedo}
          color="#a81850"
          emissive="#c02058"
          emissiveIntensity={0.05}
          roughness={0.8}
          sheen={0.4}
          sheenColor="#ff6088"
        />
      </mesh>
      <mesh position={[width / 2 + 0.02, 0.05, -0.15]} rotation={[0, 0, -0.12]} castShadow>
        <boxGeometry args={[0.09, 0.58, 0.92]} />
        <meshPhysicalMaterial
          map={fabricMaps.albedo}
          color="#a81850"
          emissive="#c02058"
          emissiveIntensity={0.05}
          roughness={0.8}
          sheen={0.4}
          sheenColor="#ff6088"
        />
      </mesh>
    </group>
  )
}

/**
 * Neon ramen bowl glyph — jesse-parity silhouette:
 * U-bowl + noodles + chopsticks as glass tubes (not a "W" scribble).
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
  const tube = (props: {
    position: [number, number, number]
    rotation?: [number, number, number]
    args: [number, number, number, number?]
    color: string
    intensity?: number
  }) => {
    const { position: p, rotation: r = [0, 0, 0], args, color, intensity = 2 } = props
    const [rt, rb, h, seg = 8] = args
    return (
      <mesh position={p} rotation={r}>
        <cylinderGeometry args={[rt, rb, h, seg]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity}
          roughness={0.12}
          toneMapped={false}
        />
      </mesh>
    )
  }
  return (
    <group position={position} scale={scale}>
      {/* Bowl U — lower semicircle in the XY plane (readable head-on) */}
      <mesh position={[0, 0.0, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.15, 0.02, 10, 28, Math.PI]} />
        <meshStandardMaterial
          color={cyan}
          emissive={cyan}
          emissiveIntensity={2.3}
          roughness={0.12}
          toneMapped={false}
        />
      </mesh>
      {/* Inner bowl stroke for weight */}
      <mesh position={[0, 0.01, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.11, 0.014, 8, 22, Math.PI * 0.95]} />
        <meshStandardMaterial
          color={cyan}
          emissive={cyan}
          emissiveIntensity={1.9}
          roughness={0.12}
          toneMapped={false}
        />
      </mesh>
      {/* Rim caps (left / right lip) */}
      {tube({
        position: [-0.15, 0.0, 0],
        rotation: [0, 0, Math.PI / 2],
        args: [0.018, 0.018, 0.04, 8],
        color: cyan,
        intensity: 2.1,
      })}
      {tube({
        position: [0.15, 0.0, 0],
        rotation: [0, 0, Math.PI / 2],
        args: [0.018, 0.018, 0.04, 8],
        color: cyan,
        intensity: 2.1,
      })}
      {/* Noodles rising from bowl */}
      {tube({
        position: [-0.04, 0.12, 0.01],
        rotation: [0.1, 0, 0.45],
        args: [0.011, 0.011, 0.17, 8],
        color: pink,
        intensity: 2.0,
      })}
      {tube({
        position: [0.02, 0.14, 0.01],
        rotation: [0.05, 0, -0.1],
        args: [0.011, 0.011, 0.2, 8],
        color: pink,
        intensity: 2.0,
      })}
      {tube({
        position: [0.07, 0.11, 0.01],
        rotation: [0.1, 0, 0.35],
        args: [0.011, 0.011, 0.15, 8],
        color: pink,
        intensity: 2.0,
      })}
      {/* Chopsticks — crossed pair */}
      {tube({
        position: [0.11, 0.16, 0.02],
        rotation: [0.1, 0.15, -0.62],
        args: [0.01, 0.01, 0.3, 8],
        color: pink,
        intensity: 1.85,
      })}
      {tube({
        position: [0.15, 0.14, -0.01],
        rotation: [0.05, -0.1, -0.42],
        args: [0.01, 0.01, 0.28, 8],
        color: pink,
        intensity: 1.85,
      })}
      {/* Soft additive halo */}
      <mesh position={[0.02, 0.06, -0.02]}>
        <planeGeometry args={[0.52, 0.52]} />
        <meshBasicMaterial
          color={cyan}
          transparent
          opacity={0.16}
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
 * Imagine plate stays as dim underglow only.
 */
function NeonBrandSign() {
  const neonMap = useTexture(`${texBase}neon-sign.jpg`)
  neonMap.colorSpace = THREE.SRGBColorSpace
  neonMap.anisotropy = 8
  neonMap.wrapS = neonMap.wrapT = THREE.ClampToEdgeWrapping
  neonMap.offset.set(0.04, 0.12)
  neonMap.repeat.set(0.92, 0.72)
  neonMap.needsUpdate = true

  return (
    <group position={[0.05, 2.92, 0.82]}>
      {/* Channel letter housing — deep black box, fascia-mounted */}
      <mesh position={[0, 0, -0.07]} castShadow>
        <boxGeometry args={[3.05, 0.98, 0.18]} />
        <meshStandardMaterial color="#07050c" roughness={0.5} metalness={0.35} />
      </mesh>
      {/* Inner recess (channel depth) */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[2.88, 0.84, 0.07]} />
        <meshStandardMaterial color="#030208" roughness={0.7} metalness={0.15} />
      </mesh>
      {/* Side returns — physical depth on marquee edges */}
      <mesh position={[-1.54, 0, -0.02]} castShadow>
        <boxGeometry args={[0.07, 0.98, 0.2]} />
        <meshStandardMaterial color="#0c0814" roughness={0.45} metalness={0.4} />
      </mesh>
      <mesh position={[1.54, 0, -0.02]} castShadow>
        <boxGeometry args={[0.07, 0.98, 0.2]} />
        <meshStandardMaterial color="#0c0814" roughness={0.45} metalness={0.4} />
      </mesh>
      {/* Top / bottom lips */}
      <mesh position={[0, 0.48, -0.02]}>
        <boxGeometry args={[3.05, 0.055, 0.2]} />
        <meshStandardMaterial color="#0a0610" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.48, -0.02]}>
        <boxGeometry args={[3.05, 0.055, 0.2]} />
        <meshStandardMaterial color="#0a0610" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Glass tube border — thicker dual-neon frame (cyan top / pink bottom) */}
      <NeonTube position={[0, 0.43, 0.06]} args={[2.92, 0.048, 0.048]} color="#44f0ff" intensity={2.2} />
      <NeonTube position={[0, -0.43, 0.06]} args={[2.92, 0.048, 0.048]} color="#ff2d9a" intensity={2.1} />
      <NeonTube position={[-1.46, 0, 0.06]} args={[0.048, 0.84, 0.048]} color="#b044ff" intensity={1.7} />
      <NeonTube position={[1.46, 0, 0.06]} args={[0.048, 0.84, 0.048]} color="#b044ff" intensity={1.7} />
      {/* Corner beads */}
      {(
        [
          [-1.46, 0.43],
          [1.46, 0.43],
          [-1.46, -0.43],
          [1.46, -0.43],
        ] as const
      ).map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.055]}>
          <sphereGeometry args={[0.032, 10, 10]} />
          <meshStandardMaterial
            color={i < 2 ? '#44f0ff' : '#ff2d9a'}
            emissive={i < 2 ? '#44f0ff' : '#ff2d9a'}
            emissiveIntensity={2.35}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Dim Imagine plate — deep underglow only; tube letters own brand read */}
      <mesh position={[0, 0.02, 0.02]}>
        <planeGeometry args={[2.7, 0.74]} />
        <meshStandardMaterial
          map={neonMap}
          color="#664466"
          emissive="#ffffff"
          emissiveMap={neonMap}
          emissiveIntensity={0.22}
          roughness={0.62}
          metalness={0.05}
          transparent
          opacity={0.28}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      {/* Soft dual wash in recess */}
      <mesh position={[0, 0.08, 0.03]}>
        <planeGeometry args={[2.75, 0.38]} />
        <meshBasicMaterial
          color="#ff2d9a"
          transparent
          opacity={0.1}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[0, -0.14, 0.03]}>
        <planeGeometry args={[2.75, 0.32]} />
        <meshBasicMaterial
          color="#44f0ff"
          transparent
          opacity={0.08}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ═══ GLASS TUBE LETTERFORMS (primary brand read) ═══ */}
      <NeonWord
        text="KEVIN'S"
        position={[0, 0.02, 0.08]}
        letterH={0.3}
        letterW={0.26}
        gap={0.032}
        color="#ff4db8"
        accent="#66f0ff"
        dual
        thickness={0.022}
        intensity={2.35}
      />
      <NeonWord
        text="RAMEN & BOBA"
        position={[0, -0.32, 0.08]}
        letterH={0.2}
        letterW={0.155}
        gap={0.02}
        color="#44f0ff"
        accent="#ff66cc"
        dual
        thickness={0.017}
        intensity={2.15}
      />

      {/* Mount brackets to fascia */}
      <mesh position={[-1.15, 0.52, -0.1]}>
        <boxGeometry args={[0.14, 0.07, 0.12]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[1.15, 0.52, -0.1]}>
        <boxGeometry args={[0.14, 0.07, 0.12]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  )
}

/**
 * Paper lantern — thin emissive shell + warm core (residual #5).
 * Not a solid matte pink Standard sphere.
 */
function PaperLantern({
  position,
  scale = 1,
  hue = '#ff9a5c',
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
      {/* Hot inner core (feeds bloom through thin paper) */}
      <mesh scale={[0.72, 0.85, 0.72]}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshBasicMaterial color={hue} toneMapped={false} transparent opacity={0.85} />
      </mesh>
      {/* Thin paper shell — elongated, translucent, soft falloff edge */}
      <mesh castShadow scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.145, 28, 20]} />
        <meshPhysicalMaterial
          color={hue}
          emissive={hue}
          emissiveIntensity={0.72}
          roughness={0.78}
          metalness={0}
          transmission={0.42}
          thickness={0.06}
          ior={1.2}
          transparent
          opacity={0.78}
          side={THREE.DoubleSide}
          clearcoat={0.08}
          clearcoatRoughness={0.6}
        />
      </mesh>
      {/* Soft additive halo disc (paper glow without hard limb) */}
      <mesh scale={[1.35, 1.5, 1.35]} renderOrder={1}>
        <sphereGeometry args={[0.15, 16, 12]} />
        <meshBasicMaterial
          color={hue}
          transparent
          opacity={0.12}
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
 * Counter stool — residual #1: warm wood seat + varnish, not untextured gray.
 * Tight-grain wood UV clone so small geometry still reads timber.
 */
function Stool({
  position,
  woodMap,
}: {
  position: [number, number, number]
  woodMap: THREE.Texture
}) {
  // Local UV tiles — shared map.repeat is too coarse on seat-scale cylinders
  const seatWood = useMemo(() => {
    const t = woodMap.clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = THREE.SRGBColorSpace
    t.repeat.set(1.6, 1.6)
    t.offset.set(0.12, 0.07)
    t.anisotropy = 8
    t.needsUpdate = true
    return t
  }, [woodMap])
  const legWood = useMemo(() => {
    const t = woodMap.clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = THREE.SRGBColorSpace
    t.repeat.set(0.55, 2.4)
    t.anisotropy = 4
    t.needsUpdate = true
    return t
  }, [woodMap])

  return (
    <group position={position}>
      {/* Seat disc — thick timber slab with warm varnish (primary wood read) */}
      <mesh position={[0, 0.43, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.155, 0.165, 0.06, 28]} />
        <meshPhysicalMaterial
          map={seatWood}
          color="#8a5a38"
          roughness={0.38}
          clearcoat={0.55}
          clearcoatRoughness={0.22}
          metalness={0.03}
          envMapIntensity={0.9}
        />
      </mesh>
      {/* Polished seat top (grain + clearcoat, not gray plastic) */}
      <mesh position={[0, 0.462, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.145, 28]} />
        <meshPhysicalMaterial
          map={seatWood}
          color="#9a6844"
          roughness={0.22}
          clearcoat={0.78}
          clearcoatRoughness={0.12}
          metalness={0.04}
          envMapIntensity={1.05}
        />
      </mesh>
      {/* Underside seat (darker wood) */}
      <mesh position={[0, 0.398, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 20]} />
        <meshStandardMaterial map={seatWood} color="#3a2418" roughness={0.75} />
      </mesh>
      {/* Edge bullnose ring (varnish catch) */}
      <mesh position={[0, 0.43, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.155, 0.012, 8, 28]} />
        <meshPhysicalMaterial
          map={seatWood}
          color="#7a4a30"
          roughness={0.28}
          clearcoat={0.65}
          clearcoatRoughness={0.18}
        />
      </mesh>
      {/* Soft leather/foam pad under rim — dark brown, not gray Standard */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.125, 0.028, 24]} />
        <meshPhysicalMaterial
          color="#2a1814"
          roughness={0.55}
          clearcoat={0.25}
          clearcoatRoughness={0.4}
          sheen={0.2}
          sheenColor="#4a3028"
        />
      </mesh>
      {/* Four tapered wood legs */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.4
        return (
          <mesh key={i} position={[Math.cos(a) * 0.095, 0.2, Math.sin(a) * 0.095]} castShadow>
            <cylinderGeometry args={[0.015, 0.022, 0.4, 10]} />
            <meshStandardMaterial map={legWood} color="#5a3a28" roughness={0.62} metalness={0.06} />
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
            <cylinderGeometry args={[0.008, 0.008, 0.2, 6]} />
            <meshStandardMaterial map={legWood} color="#4a3020" roughness={0.68} />
          </mesh>
        )
      })}
      {/* Foot ring — dark wood, ground contact mass */}
      <mesh position={[0, 0.025, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.115, 0.125, 0.032, 20]} />
        <meshStandardMaterial map={seatWood} color="#2a1810" roughness={0.78} />
      </mesh>
      {/* Contact darkening disc under stool (prop contact residual spirit) */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.16, 20]} />
        <meshBasicMaterial color="#050208" transparent opacity={0.38} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Full directional signpost — tall pole, twin globe lamps, stacked arrow signs (thumbnail-readable). */
function SignPost({ position }: { position: [number, number, number] }) {
  const signs = [
    { y: 2.15, label: 'projects', color: '#ff2d6a', yaw: 0.22, w: 1.05 },
    { y: 1.78, label: 'articles', color: '#2dffb0', yaw: -0.38, w: 0.98 },
    { y: 1.42, label: 'about me', color: '#2db0ff', yaw: 0.48, w: 1.02 },
    { y: 1.06, label: 'credits', color: '#ffb02d', yaw: -0.18, w: 0.92 },
  ]
  return (
    <group position={position}>
      {/* Base plate — ground contact */}
      <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.08, 12]} />
        <meshStandardMaterial color="#0e0e14" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Main pole */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.07, 2.6, 14]} />
        <meshStandardMaterial color="#12121a" metalness={0.55} roughness={0.35} />
      </mesh>
      {/* Cross-arm for twin lamps */}
      <mesh position={[0, 2.55, 0.05]} castShadow>
        <boxGeometry args={[1.35, 0.07, 0.07]} />
        <meshStandardMaterial color="#1a1a24" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Vertical mast extension */}
      <mesh position={[0, 2.85, 0]}>
        <cylinderGeometry args={[0.03, 0.035, 0.55, 8]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.5} />
      </mesh>
      <mesh position={[0, 3.15, 0]}>
        <sphereGeometry args={[0.07, 14, 14]} />
        <meshStandardMaterial color="#fff0ff" emissive="#ff66dd" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      {/* Twin street lamp globes */}
      <mesh position={[0.58, 2.45, 0.12]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffe0ff" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <mesh position={[-0.58, 2.45, 0.12]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#e0ffff" emissiveIntensity={2.0} toneMapped={false} />
      </mesh>
      {/* Lamp stems */}
      <mesh position={[0.58, 2.22, 0.12]}>
        <cylinderGeometry args={[0.025, 0.03, 0.28, 8]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.5} />
      </mesh>
      <mesh position={[-0.58, 2.22, 0.12]}>
        <cylinderGeometry args={[0.025, 0.03, 0.28, 8]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.5} />
      </mesh>
      {/* Tech clutter on pole (jesse density) */}
      <mesh position={[0.12, 2.75, 0.08]}>
        <boxGeometry args={[0.12, 0.1, 0.08]} />
        <meshStandardMaterial color="#ff2d6a" emissive="#ff2d6a" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      <mesh position={[-0.1, 2.7, 0.08]}>
        <boxGeometry args={[0.1, 0.1, 0.08]} />
        <meshStandardMaterial color="#2dffb0" emissive="#2dffb0" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      <mesh position={[0.05, 2.95, 0.1]}>
        <boxGeometry args={[0.14, 0.18, 0.04]} />
        <meshStandardMaterial color="#1a2030" emissive="#4080c0" emissiveIntensity={0.4} />
      </mesh>
      {/* Globe contribution covered by signpost light in lighting rig */}

      {signs.map((s) => (
        <group key={s.label} position={[0.48, s.y, 0]} rotation={[0, s.yaw, 0]}>
          {/* Rounded plate body — less toy cone-arrow silhouette */}
          <mesh castShadow>
            <boxGeometry args={[s.w * 0.92, 0.2, 0.05]} />
            <meshStandardMaterial
              color={s.color}
              emissive={s.color}
              emissiveIntensity={0.55}
              roughness={0.42}
              metalness={0.08}
              toneMapped={false}
            />
          </mesh>
          {/* Soft chevron tip (smaller, less composition-wrecking) */}
          <mesh position={[s.w * 0.46, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.09, 0.14, 3]} />
            <meshStandardMaterial
              color={s.color}
              emissive={s.color}
              emissiveIntensity={0.5}
              roughness={0.42}
              toneMapped={false}
            />
          </mesh>
          <Text
            position={[0, 0, 0.035]}
            fontSize={0.085}
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
 * Counter oak surfaces (residual #3 / shell) — UV grain + varnish + edge wear.
 * Boosts tex-wood.jpg contrast so grain survives neon wash; not flat tinted planes.
 * Roughness: dark = polished varnish, light = matte wear. ClearcoatRough: wet pools.
 */
function makeCounterSurfaceMaps(woodMap: THREE.Texture): {
  albedo: THREE.CanvasTexture
  roughness: THREE.CanvasTexture
  clearcoatRough: THREE.CanvasTexture
} {
  const size = 512
  // ── Albedo: photo oak + contrast boost + authored grain + edge wear darken ──
  const aCanvas = document.createElement('canvas')
  aCanvas.width = aCanvas.height = size
  const aCtx = aCanvas.getContext('2d')!
  const src = woodMap.image as CanvasImageSource | undefined
  if (src && (src as HTMLImageElement).width) {
    aCtx.drawImage(src, 0, 0, size, size)
  } else {
    aCtx.fillStyle = '#8a6238'
    aCtx.fillRect(0, 0, size, size)
  }
  // Contrast / saturation push so grain reads under warm neon key
  const img = aCtx.getImageData(0, 0, size, size)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i]
    let g = d[i + 1]
    let b = d[i + 2]
    // Midtone contrast (push away from 128)
    r = Math.max(0, Math.min(255, (r - 128) * 1.45 + 118))
    g = Math.max(0, Math.min(255, (g - 128) * 1.35 + 108))
    b = Math.max(0, Math.min(255, (b - 128) * 1.25 + 88))
    // Warm oak bias
    r = Math.min(255, r * 1.06 + 8)
    g = Math.min(255, g * 0.98)
    b = Math.min(255, b * 0.82)
    d[i] = r
    d[i + 1] = g
    d[i + 2] = b
  }
  aCtx.putImageData(img, 0, 0)
  // Authored grain streaks (dark/light lanes along X — UV grain tell at beauty FOV)
  for (let i = 0; i < 48; i++) {
    const y = Math.random() * size
    const dark = Math.random() > 0.45
    aCtx.strokeStyle = dark
      ? `rgba(${28 + Math.random() * 30},${16 + Math.random() * 18},${8},${0.18 + Math.random() * 0.28})`
      : `rgba(${210 + Math.random() * 40},${170 + Math.random() * 30},${110},${0.1 + Math.random() * 0.16})`
    aCtx.lineWidth = 1 + Math.random() * 4.5
    aCtx.beginPath()
    aCtx.moveTo(0, y)
    for (let x = 0; x <= size; x += 6) {
      aCtx.lineTo(x, y + Math.sin(x * 0.022 + i) * 10 + Math.sin(x * 0.07 + i * 0.3) * 3)
    }
    aCtx.stroke()
  }
  // Figure/ring knots (oak character, not procedural noise only)
  for (let i = 0; i < 7; i++) {
    const cx = 60 + Math.random() * (size - 120)
    const cy = 60 + Math.random() * (size - 120)
    const rr = 10 + Math.random() * 28
    for (let k = 0; k < 5; k++) {
      aCtx.strokeStyle = `rgba(40,22,10,${0.08 + k * 0.03})`
      aCtx.lineWidth = 1.2
      aCtx.beginPath()
      aCtx.ellipse(cx, cy, rr + k * 3.5, (rr + k * 3.5) * 0.55, i * 0.4, 0, Math.PI * 2)
      aCtx.stroke()
    }
  }
  // Edge wear darkening (UV perimeter → front lip / bullnose reads worn timber)
  const edge = aCtx.createLinearGradient(0, 0, 0, size)
  edge.addColorStop(0, 'rgba(22,12,6,0.38)')
  edge.addColorStop(0.08, 'rgba(22,12,6,0)')
  edge.addColorStop(0.92, 'rgba(22,12,6,0)')
  edge.addColorStop(1, 'rgba(18,10,4,0.45)')
  aCtx.fillStyle = edge
  aCtx.fillRect(0, 0, size, size)
  const edgeX = aCtx.createLinearGradient(0, 0, size, 0)
  edgeX.addColorStop(0, 'rgba(20,10,4,0.32)')
  edgeX.addColorStop(0.06, 'rgba(20,10,4,0)')
  edgeX.addColorStop(0.94, 'rgba(20,10,4,0)')
  edgeX.addColorStop(1, 'rgba(20,10,4,0.32)')
  aCtx.fillStyle = edgeX
  aCtx.fillRect(0, 0, size, size)
  // Scuff chips near "front" (bottom of UV) — matte worn flecks
  for (let i = 0; i < 28; i++) {
    const x = Math.random() * size
    const y = size * 0.78 + Math.random() * size * 0.22
    aCtx.fillStyle = `rgba(${50 + Math.random() * 40},${32 + Math.random() * 24},${14},${0.2 + Math.random() * 0.25})`
    aCtx.fillRect(x, y, 2 + Math.random() * 10, 1 + Math.random() * 3)
  }

  // ── Roughness: varnish lanes vs wear ──
  const rCanvas = document.createElement('canvas')
  rCanvas.width = rCanvas.height = size
  const rCtx = rCanvas.getContext('2d')!
  rCtx.fillStyle = '#3a3a3a' // glossy base varnish
  rCtx.fillRect(0, 0, size, size)
  for (let i = 0; i < 42; i++) {
    const y = Math.random() * size
    rCtx.strokeStyle = `rgba(8,8,8,${0.28 + Math.random() * 0.5})`
    rCtx.lineWidth = 2 + Math.random() * 14
    rCtx.beginPath()
    rCtx.moveTo(0, y)
    for (let x = 0; x <= size; x += 8) {
      rCtx.lineTo(x, y + Math.sin(x * 0.018 + i * 0.5) * 12 + Math.sin(x * 0.05) * 3)
    }
    rCtx.stroke()
  }
  // Wet-varnish pools
  for (let i = 0; i < 12; i++) {
    const cx = 50 + Math.random() * (size - 100)
    const cy = 50 + Math.random() * (size - 100)
    const rx = 22 + Math.random() * 70
    const ry = 14 + Math.random() * 48
    const g = rCtx.createRadialGradient(cx, cy, 2, cx, cy, rx)
    g.addColorStop(0, `rgba(4,4,4,${0.6 + Math.random() * 0.35})`)
    g.addColorStop(0.55, `rgba(18,18,18,${0.28 + Math.random() * 0.2})`)
    g.addColorStop(1, 'rgba(40,40,40,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2)
    rCtx.fill()
  }
  // Wear / contact patches (lighter = rougher matte)
  for (let i = 0; i < 20; i++) {
    const cx = 40 + Math.random() * (size - 80)
    const cy = 40 + Math.random() * (size - 80)
    const rx = 14 + Math.random() * 52
    const ry = 10 + Math.random() * 40
    const g = rCtx.createRadialGradient(cx, cy, 2, cx, cy, rx)
    g.addColorStop(0, `rgba(210,200,185,${0.45 + Math.random() * 0.4})`)
    g.addColorStop(1, 'rgba(160,155,145,0)')
    rCtx.fillStyle = g
    rCtx.beginPath()
    rCtx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2)
    rCtx.fill()
  }
  // Perimeter edge wear (rougher at UV edges = bullnose hand-wear)
  const wearEdge = rCtx.createLinearGradient(0, 0, 0, size)
  wearEdge.addColorStop(0, 'rgba(200,190,170,0.55)')
  wearEdge.addColorStop(0.07, 'rgba(200,190,170,0)')
  wearEdge.addColorStop(0.93, 'rgba(200,190,170,0)')
  wearEdge.addColorStop(1, 'rgba(215,205,185,0.7)')
  rCtx.fillStyle = wearEdge
  rCtx.fillRect(0, 0, size, size)
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const v = 50 + Math.floor(Math.random() * 100)
    rCtx.fillStyle = `rgba(${v},${v},${v},0.06)`
    rCtx.fillRect(x, y, 1.4, 0.8)
  }

  // ── Clearcoat roughness: smooth wet pools vs dry worn chips ──
  const cCanvas = document.createElement('canvas')
  cCanvas.width = cCanvas.height = size
  const cCtx = cCanvas.getContext('2d')!
  cCtx.fillStyle = '#2a2a2a'
  cCtx.fillRect(0, 0, size, size)
  for (let i = 0; i < 14; i++) {
    const cx = 40 + Math.random() * (size - 80)
    const cy = 40 + Math.random() * (size - 80)
    const rx = 18 + Math.random() * 60
    const g = cCtx.createRadialGradient(cx, cy, 1, cx, cy, rx)
    g.addColorStop(0, 'rgba(0,0,0,0.85)')
    g.addColorStop(1, 'rgba(40,40,40,0)')
    cCtx.fillStyle = g
    cCtx.beginPath()
    cCtx.ellipse(cx, cy, rx, rx * 0.6, Math.random() * Math.PI, 0, Math.PI * 2)
    cCtx.fill()
  }
  for (let i = 0; i < 22; i++) {
    const cx = Math.random() * size
    const cy = size * 0.7 + Math.random() * size * 0.3
    cCtx.fillStyle = `rgba(200,195,180,${0.35 + Math.random() * 0.4})`
    cCtx.beginPath()
    cCtx.ellipse(cx, cy, 6 + Math.random() * 18, 3 + Math.random() * 8, 0, 0, Math.PI * 2)
    cCtx.fill()
  }

  const albedo = new THREE.CanvasTexture(aCanvas)
  albedo.colorSpace = THREE.SRGBColorSpace
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping
  albedo.repeat.set(2.4, 1.05)
  albedo.anisotropy = 8
  albedo.needsUpdate = true

  const roughness = new THREE.CanvasTexture(rCanvas)
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping
  roughness.repeat.set(2.4, 1.05)
  roughness.anisotropy = 4
  roughness.needsUpdate = true

  const clearcoatRough = new THREE.CanvasTexture(cCanvas)
  clearcoatRough.wrapS = clearcoatRough.wrapT = THREE.RepeatWrapping
  clearcoatRough.repeat.set(2.4, 1.05)
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

  const wood = '#6a4530'
  const woodDark = '#3a2618'
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

  // Noren fabric weave maps (residual #1) — once per shell, not per render
  const norenFabrics = useMemo(() => {
    const pink = makeFabricMaps([210, 48, 110])
    pink.albedo.repeat.set(1.2, 2.8)
    pink.roughness.repeat.set(1.2, 2.8)
    const indigo = makeFabricMaps([48, 32, 90])
    indigo.albedo.repeat.set(1.2, 2.8)
    indigo.roughness.repeat.set(1.2, 2.8)
    return { pink, indigo }
  }, [])

  return (
    <group name="ShopShell">
      {/* ═══ GROUND CONTACT FOOTPRINT ═══ */}
      <mesh position={[0, -0.02, -0.45]} receiveShadow>
        <boxGeometry args={[5.55, 0.08, 4.05]} />
        <meshStandardMaterial map={woodMap} color="#14100e" roughness={0.88} />
      </mesh>
      {/* Raised plinth / platform edge — thick mass so kiosk sits on a pad */}
      <mesh position={[0, 0.05, -0.45]} receiveShadow castShadow>
        <boxGeometry args={[5.25, 0.14, 3.75]} />
        <meshStandardMaterial map={woodMap} color="#1e1612" roughness={0.72} />
      </mesh>
      {/* Plinth nosing (front lip catch) */}
      <mesh position={[0, 0.12, 1.38]} castShadow>
        <boxGeometry args={[5.28, 0.04, 0.08]} />
        <meshStandardMaterial map={woodMap} color="#2a1c14" roughness={0.55} metalness={0.06} />
      </mesh>

      {/* ═══ BACK WALL (thick masonry + cladding) ═══ */}
      <mesh position={[0, 1.55, -1.98]} receiveShadow castShadow>
        <boxGeometry args={[5.0, 3.15, 0.28]} />
        <meshStandardMaterial map={wallMap} color="#2a1c28" roughness={0.84} />
      </mesh>
      {/* Inner back panel (slightly lighter for depth) */}
      <mesh position={[0, 1.35, -1.82]}>
        <boxGeometry args={[4.55, 2.45, 0.08]} />
        <meshStandardMaterial map={wallMap} color="#3a2438" roughness={0.78} />
      </mesh>
      {/* Baseboard + crown on back wall (enclosure trim) */}
      <mesh position={[0, 0.12, -1.78]} castShadow>
        <boxGeometry args={[4.7, 0.14, 0.1]} />
        <meshStandardMaterial map={woodMap} color={woodDark} roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.72, -1.78]} castShadow>
        <boxGeometry args={[4.7, 0.1, 0.1]} />
        <meshStandardMaterial map={woodMap} color="#2a1814" roughness={0.55} />
      </mesh>

      {/* ═══ SIDE WALLS (full volume, thick mass, open front) ═══ */}
      <mesh position={[-2.45, 1.55, -0.65]} receiveShadow castShadow>
        <boxGeometry args={[0.28, 3.15, 2.85]} />
        <meshStandardMaterial map={wallMap} color="#241820" roughness={0.86} />
      </mesh>
      <mesh position={[2.45, 1.55, -0.65]} receiveShadow castShadow>
        <boxGeometry args={[0.28, 3.15, 2.85]} />
        <meshStandardMaterial map={wallMap} color="#241820" roughness={0.86} />
      </mesh>
      {/* Inner side cladding (thickness read from interior) */}
      <mesh position={[-2.28, 1.3, -0.7]}>
        <boxGeometry args={[0.06, 2.5, 2.5]} />
        <meshStandardMaterial map={wallMap} color="#322028" roughness={0.8} />
      </mesh>
      <mesh position={[2.28, 1.3, -0.7]}>
        <boxGeometry args={[0.06, 2.5, 2.5]} />
        <meshStandardMaterial map={wallMap} color="#322028" roughness={0.8} />
      </mesh>
      {/* Front corner posts (heavy timber silhouette — enclosure mass) */}
      <mesh position={[-2.35, 1.35, 0.68]} castShadow>
        <boxGeometry args={[0.24, 2.75, 0.24]} />
        <meshStandardMaterial map={woodMap} color="#1a1018" roughness={0.62} metalness={0.1} />
      </mesh>
      <mesh position={[2.35, 1.35, 0.68]} castShadow>
        <boxGeometry args={[0.24, 2.75, 0.24]} />
        <meshStandardMaterial map={woodMap} color="#1a1018" roughness={0.62} metalness={0.1} />
      </mesh>
      {/* Post cap blocks (thickness at roof junction) */}
      <mesh position={[-2.35, 2.72, 0.68]} castShadow>
        <boxGeometry args={[0.3, 0.12, 0.3]} />
        <meshStandardMaterial map={woodMap} color="#221418" roughness={0.55} />
      </mesh>
      <mesh position={[2.35, 2.72, 0.68]} castShadow>
        <boxGeometry args={[0.3, 0.12, 0.3]} />
        <meshStandardMaterial map={woodMap} color="#221418" roughness={0.55} />
      </mesh>
      {/* Front header beam (closes upper volume, anchors awning/sign) */}
      <mesh position={[0, 2.55, 0.62]} castShadow>
        <boxGeometry args={[4.75, 0.22, 0.26]} />
        <meshStandardMaterial map={woodMap} color="#1e1218" roughness={0.55} metalness={0.1} />
      </mesh>

      {/* ═══ ROOF VOLUME (thick box + underside ceiling panel) ═══ */}
      <mesh position={[0, 3.18, -0.7]} castShadow receiveShadow>
        <boxGeometry args={[5.3, 0.36, 3.1]} />
        <meshStandardMaterial color="#120c14" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Ceiling underside (closes room from above) */}
      <mesh position={[0, 2.98, -0.75]} receiveShadow>
        <boxGeometry args={[4.85, 0.06, 2.7]} />
        <meshStandardMaterial map={woodMap} color="#1a1014" roughness={0.75} />
      </mesh>
      {/* Roof fascia / front lip */}
      <mesh position={[0, 2.95, 0.78]} castShadow>
        <boxGeometry args={[5.35, 0.22, 0.18]} />
        <meshStandardMaterial color="#1a0e18" roughness={0.58} metalness={0.22} />
      </mesh>
      {/* Roof side lips */}
      <mesh position={[-2.6, 3.08, -0.7]} castShadow>
        <boxGeometry args={[0.16, 0.28, 3.1]} />
        <meshStandardMaterial color="#160e16" roughness={0.65} />
      </mesh>
      <mesh position={[2.6, 3.08, -0.7]} castShadow>
        <boxGeometry args={[0.16, 0.28, 3.1]} />
        <meshStandardMaterial color="#160e16" roughness={0.65} />
      </mesh>

      {/* Thick scalloped fabric awning */}
      <ScallopedAwning />

      {/* ═══ COUNTER (thick timber + residual #3 UV grain / varnish / edge wear) ═══ */}
      {/* Body carcass — thicker mass for enclosure density */}
      <mesh position={[0, 0.48, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[4.25, 0.9, 1.02]} />
        <meshStandardMaterial map={woodMap} color={wood} roughness={0.58} metalness={0.04} />
      </mesh>
      {/* Counter front apron — thick panel + raised stile rails (grain density) */}
      <mesh position={[0, 0.44, 0.04]} castShadow>
        <boxGeometry args={[4.14, 0.8, 0.12]} />
        <meshStandardMaterial map={woodApron} color="#4a3020" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Vertical stile divisions on apron */}
      {[-1.55, -0.52, 0.52, 1.55].map((x, i) => (
        <mesh key={i} position={[x, 0.44, 0.11]} castShadow>
          <boxGeometry args={[0.065, 0.76, 0.04]} />
          <meshStandardMaterial map={woodApron} color="#3a2418" roughness={0.46} />
        </mesh>
      ))}
      {/* Mid rail on apron */}
      <mesh position={[0, 0.55, 0.11]}>
        <boxGeometry args={[4.08, 0.045, 0.035]} />
        <meshStandardMaterial map={woodApron} color="#5a3824" roughness={0.42} />
      </mesh>
      {/* Bottom apron rail (extra timber density) */}
      <mesh position={[0, 0.12, 0.11]}>
        <boxGeometry args={[4.08, 0.05, 0.035]} />
        <meshStandardMaterial map={woodApron} color="#2a1810" roughness={0.55} />
      </mesh>
      {/* Polished oak counter top — contrast grain albedo + varnish maps (not tinted plane) */}
      <mesh position={[0, 1.02, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[4.42, 0.18, 1.18]} />
        <meshPhysicalMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          clearcoatRoughnessMap={clearcoatRough}
          color="#a87848"
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.08}
          metalness={0.04}
          envMapIntensity={1.55}
          sheen={0.22}
          sheenRoughness={0.35}
          sheenColor="#e8c090"
        />
      </mesh>
      {/* Dark plywood underlayer reveal (thickness read from front) */}
      <mesh position={[0, 0.92, 0.1]} castShadow>
        <boxGeometry args={[4.38, 0.055, 0.06]} />
        <meshStandardMaterial map={woodCounter} color="#1a1008" roughness={0.74} />
      </mesh>
      {/* Front edge bullnose — worn amber oak (hand-wear, not perfect plastic strip) */}
      <mesh position={[0, 1.055, 0.12]} castShadow>
        <boxGeometry args={[4.38, 0.055, 0.085]} />
        <meshPhysicalMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color="#8a5a30"
          roughness={0.32}
          clearcoat={0.7}
          clearcoatRoughness={0.28}
          metalness={0.08}
          envMapIntensity={1.25}
        />
      </mesh>
      {/* Front lip micro-chamfer (dark edge wear line) */}
      <mesh position={[0, 1.028, 0.155]} castShadow>
        <boxGeometry args={[4.36, 0.018, 0.022]} />
        <meshStandardMaterial map={counterAlbedo} color="#3a2210" roughness={0.78} />
      </mesh>
      {/* Side bullnoses — thicker timber edge */}
      <mesh position={[-2.22, 1.055, -0.5]} castShadow>
        <boxGeometry args={[0.06, 0.055, 1.16]} />
        <meshPhysicalMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color="#7a4e28"
          roughness={0.28}
          clearcoat={0.85}
          clearcoatRoughness={0.18}
          envMapIntensity={1.2}
        />
      </mesh>
      <mesh position={[2.22, 1.055, -0.5]} castShadow>
        <boxGeometry args={[0.06, 0.055, 1.16]} />
        <meshPhysicalMaterial
          map={counterAlbedo}
          roughnessMap={varnishRough}
          color="#7a4e28"
          roughness={0.28}
          clearcoat={0.85}
          clearcoatRoughness={0.18}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* Rear counter rail (booth density / thickness at back of slab) */}
      <mesh position={[0, 1.08, -1.02]} castShadow>
        <boxGeometry args={[4.3, 0.07, 0.08]} />
        <meshPhysicalMaterial
          map={counterAlbedo}
          color="#6a4228"
          roughness={0.4}
          clearcoat={0.55}
          clearcoatRoughness={0.25}
        />
      </mesh>
      {/* Contact darkening under props — soft ovals (low opacity so oak grain stays visible) */}
      {(
        [
          [-0.85, -0.4, 0.55, 0.38, 0.18],
          [0.55, -0.42, 0.42, 0.32, 0.15],
          [1.55, -0.55, 0.38, 0.3, 0.13],
          [-1.65, -0.35, 0.28, 0.22, 0.11],
          [0, -0.7, 1.6, 0.28, 0.09],
        ] as const
      ).map(([x, z, w, d, op], i) => (
        <mesh key={i} position={[x, 1.115, z]} rotation={[-Math.PI / 2, 0, i * 0.15]}>
          <circleGeometry args={[Math.max(w, d) * 0.55, 20]} />
          <meshBasicMaterial color="#1a0e06" transparent opacity={op} depthWrite={false} />
        </mesh>
      ))}
      {/* Micro-wear scuffs (rougher matte chips near front lip — residual #3 edge wear) */}
      {[-1.6, -0.85, -0.15, 0.55, 1.15, 1.7].map((x, i) => (
        <mesh key={i} position={[x, 1.116, 0.04]} rotation={[-Math.PI / 2, 0, 0.18 * (i - 2.5)]}>
          <planeGeometry args={[0.18 + (i % 3) * 0.07, 0.05 + (i % 2) * 0.025]} />
          <meshStandardMaterial
            map={counterAlbedo}
            color="#5a3a22"
            roughness={0.95}
            metalness={0}
            transparent
            opacity={0.34}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* Under-counter shelf (density + thickness) */}
      <mesh position={[0, 0.22, -0.42]} castShadow receiveShadow>
        <boxGeometry args={[3.98, 0.07, 0.76]} />
        <meshStandardMaterial map={woodMap} color={woodDark} roughness={0.62} />
      </mesh>
      {/* Counter face cyan glow strip — recessed channel neon readability */}
      <mesh position={[0, 0.26, 0.12]}>
        <boxGeometry args={[3.95, 0.055, 0.04]} />
        <meshStandardMaterial
          color="#88f8ff"
          emissive="#33e0ff"
          emissiveIntensity={2.1}
          toneMapped={false}
        />
      </mesh>
      {/* Soft additive bloom plane on cyan tube (readability under counter) */}
      <mesh position={[0, 0.26, 0.14]}>
        <planeGeometry args={[3.9, 0.12]} />
        <meshBasicMaterial
          color="#44e8ff"
          transparent
          opacity={0.22}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Toe kick */}
      <mesh position={[0, 0.04, -0.05]}>
        <boxGeometry args={[4.12, 0.09, 0.1]} />
        <meshStandardMaterial color="#120e0c" roughness={0.92} />
      </mesh>

      {/* Stools — four for denser counter front */}
      <Stool position={[-1.45, 0.05, 0.5]} woodMap={woodMap} />
      <Stool position={[-0.48, 0.05, 0.5]} woodMap={woodMap} />
      <Stool position={[0.48, 0.05, 0.5]} woodMap={woodMap} />
      <Stool position={[1.45, 0.05, 0.5]} woodMap={woodMap} />

      {/* ═══ NEON BRAND ON BUILDING (fascia marquee + roof glyph) ═══ */}
      <NeonBrandSign />
      {/* Single 3D tube glyph above-right — jesse silhouette parity (plate already has bowl art) */}
      <NeonRamenGlyph position={[1.72, 3.58, 0.52]} scale={1.05} />

      {/* Accent neon tubes on front corners / roof line — thicker + hotter for readability */}
      <NeonTube position={[-2.28, 1.7, 0.55]} args={[0.052, 1.65, 0.052]} color="#ff2d6a" intensity={1.85} />
      <NeonTube position={[2.28, 1.7, 0.55]} args={[0.052, 1.65, 0.052]} color="#2db0ff" intensity={1.85} />
      <NeonTube position={[0, 3.05, 0.78]} args={[4.65, 0.042, 0.042]} color="#b044ff" intensity={1.45} />
      <NeonTube position={[-2.28, 2.9, -0.6]} rotation={[0, 0, Math.PI / 2]} args={[0.036, 1.85, 0.036]} color="#ff2d9a" intensity={0.95} />

      {/* Paper lanterns under awning */}
      <PaperLantern position={[-1.35, 2.15, 0.15]} hue="#ff7a4a" scale={0.95} />
      <PaperLantern position={[0.15, 2.22, 0.35]} hue="#ffb060" scale={0.88} />
      <PaperLantern position={[1.45, 2.12, 0.05]} hue="#ff6090" scale={0.92} />
      <PaperLantern position={[-0.55, 2.35, -0.9]} hue="#ffaa70" scale={0.7} />

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

      {/* Menu board on back wall — thick wood frame + chalkboard mass */}
      <group position={[-1.35, 1.75, -1.78]}>
        {/* Wood housing (depth) */}
        <mesh castShadow>
          <boxGeometry args={[1.42, 1.02, 0.1]} />
          <meshStandardMaterial map={woodMap} color="#1a1410" roughness={0.72} />
        </mesh>
        {/* Frame rails */}
        <mesh position={[0, 0.48, 0.04]}>
          <boxGeometry args={[1.42, 0.06, 0.06]} />
          <meshStandardMaterial map={woodMap} color="#3a2818" roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.48, 0.04]}>
          <boxGeometry args={[1.42, 0.06, 0.06]} />
          <meshStandardMaterial map={woodMap} color="#3a2818" roughness={0.55} />
        </mesh>
        <mesh position={[-0.68, 0, 0.04]}>
          <boxGeometry args={[0.06, 0.96, 0.06]} />
          <meshStandardMaterial map={woodMap} color="#3a2818" roughness={0.55} />
        </mesh>
        <mesh position={[0.68, 0, 0.04]}>
          <boxGeometry args={[0.06, 0.96, 0.06]} />
          <meshStandardMaterial map={woodMap} color="#3a2818" roughness={0.55} />
        </mesh>
        {/* Chalk face slab (not a paper-thin plane) */}
        <mesh position={[0, 0, 0.06]} castShadow>
          <boxGeometry args={[1.22, 0.84, 0.03]} />
          <meshStandardMaterial color="#121c18" roughness={0.96} metalness={0.02} />
        </mesh>
        {/* Soft chalk grain wash */}
        <mesh position={[0, 0, 0.078]}>
          <planeGeometry args={[1.18, 0.8]} />
          <meshStandardMaterial color="#1a2820" roughness={0.98} transparent opacity={0.55} />
        </mesh>
        <Text position={[0, 0.28, 0.09]} fontSize={0.075} color="#f0e6d0" anchorX="center">
          SPECIALS
        </Text>
        <Text
          position={[0, -0.02, 0.09]}
          fontSize={0.048}
          color="#b8e0b0"
          anchorX="center"
          maxWidth={1.05}
          lineHeight={1.45}
        >
          {`Miso Multi-Agent\nBrown Sugar Boba\nTaro Monument\nLaptop Lunch`}
        </Text>
      </group>

      {/* Noren curtains — residual #1: thick fabric strips + weave maps, not plastic plates */}
      {[-1.05, 0, 1.05].map((x, panelI) => {
        const maps = panelI === 1 ? norenFabrics.pink : norenFabrics.indigo
        const baseHue = panelI === 1 ? '#e83878' : '#3a2860'
        const emitHue = panelI === 1 ? '#ff2d6a' : '#6040b0'
        const strips = 5
        const stripW = 0.12
        const gap = 0.012
        const totalW = strips * stripW + (strips - 1) * gap
        return (
          <group key={panelI} position={[x, 1.92, 0.22]}>
            {/* Rod (horizontal wood/metal) */}
            <mesh position={[0, 0.38, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.014, 0.014, totalW + 0.08, 10]} />
              <meshStandardMaterial color="#2a1c14" roughness={0.65} metalness={0.2} />
            </mesh>
            {/* Rod end caps */}
            {[-1, 1].map((side) => (
              <mesh key={side} position={[(totalW / 2 + 0.02) * side, 0.38, 0]}>
                <sphereGeometry args={[0.018, 8, 8]} />
                <meshStandardMaterial color="#1a100c" roughness={0.55} metalness={0.25} />
              </mesh>
            ))}
            {Array.from({ length: strips }, (_, s) => {
              const sx = -totalW / 2 + stripW / 2 + s * (stripW + gap)
              const fold = Math.sin(s * 1.7 + panelI) * 0.03
              const len = 0.72 + (s % 3) * 0.025
              const sway = 0.03 * (s - 2)
              return (
                <group
                  key={s}
                  position={[sx, 0.0, fold]}
                  rotation={[0.04 * (s - 2), sway * 0.15, fold * 0.6]}
                >
                  {/* Main cloth body — thick mass, weave albedo */}
                  <mesh castShadow receiveShadow>
                    <boxGeometry args={[stripW * 0.96, len, 0.028]} />
                    <meshPhysicalMaterial
                      map={maps.albedo}
                      roughnessMap={maps.roughness}
                      color={baseHue}
                      emissive={emitHue}
                      emissiveIntensity={0.04}
                      roughness={0.82}
                      metalness={0}
                      sheen={0.55}
                      sheenRoughness={0.68}
                      sheenColor={panelI === 1 ? '#ff90b8' : '#9070d0'}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                  {/* Back lining (thickness / two-sided cloth read) */}
                  <mesh position={[0, 0, -0.016]}>
                    <boxGeometry args={[stripW * 0.9, len * 0.98, 0.008]} />
                    <meshStandardMaterial
                      color={panelI === 1 ? '#701030' : '#1a1030'}
                      roughness={0.92}
                    />
                  </mesh>
                  {/* Vertical fold ridge (highlight + shadow pair) */}
                  <mesh position={[stripW * 0.22, 0, 0.015]}>
                    <boxGeometry args={[0.014, len * 0.96, 0.006]} />
                    <meshStandardMaterial
                      color={panelI === 1 ? '#ff70a0' : '#6050a0'}
                      roughness={0.72}
                      transparent
                      opacity={0.5}
                    />
                  </mesh>
                  <mesh position={[-stripW * 0.25, 0, 0.012]}>
                    <boxGeometry args={[0.01, len * 0.94, 0.005]} />
                    <meshStandardMaterial
                      color={panelI === 1 ? '#801040' : '#201838'}
                      roughness={0.88}
                      transparent
                      opacity={0.55}
                    />
                  </mesh>
                  {/* Hem weight bar (bottom cloth mass) */}
                  <mesh position={[0, -len * 0.48, 0.004]} castShadow>
                    <boxGeometry args={[stripW * 0.92, 0.022, 0.02]} />
                    <meshPhysicalMaterial
                      map={maps.albedo}
                      color={panelI === 1 ? '#a01848' : '#281840'}
                      roughness={0.78}
                      sheen={0.35}
                      sheenColor={panelI === 1 ? '#e05080' : '#7050b0'}
                    />
                  </mesh>
                  {/* Hang loop at rod */}
                  <mesh position={[0, len * 0.5 + 0.02, 0]}>
                    <torusGeometry args={[0.012, 0.004, 6, 10]} />
                    <meshStandardMaterial color="#2a1c14" metalness={0.3} roughness={0.5} />
                  </mesh>
                </group>
              )
            })}
          </group>
        )
      })}

      {/* Stickers / neon tiles on front posts */}
      {[
        { p: [-2.25, 1.4, 0.7] as [number, number, number], c: '#ff2d6a' },
        { p: [-2.25, 1.6, 0.7] as [number, number, number], c: '#2dffb0' },
        { p: [-2.25, 1.2, 0.7] as [number, number, number], c: '#2db0ff' },
        { p: [2.25, 1.5, 0.7] as [number, number, number], c: '#ffb02d' },
        { p: [2.25, 1.3, 0.7] as [number, number, number], c: '#b044ff' },
      ].map((t, i) => (
        <mesh key={i} position={t.p}>
          <boxGeometry args={[0.05, 0.16, 0.16]} />
          <meshStandardMaterial color={t.c} emissive={t.c} emissiveIntensity={1.0} toneMapped={false} />
        </mesh>
      ))}

      {/* Booth nook left — thick timber base + cushion + back + side rail + table */}
      <group position={[-1.7, 0.05, 0.98]}>
        {/* Plinth base */}
        <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.28, 0.24, 1.05]} />
          <meshStandardMaterial map={woodMap} color="#2a1818" roughness={0.72} />
        </mesh>
        {/* Seat box */}
        <mesh position={[0, 0.34, -0.05]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.28, 0.92]} />
          <meshStandardMaterial map={woodMap} color="#3a2228" roughness={0.65} />
        </mesh>
        {/* Cushion top (thick upholstery mass) */}
        <mesh position={[0, 0.52, -0.05]} castShadow>
          <boxGeometry args={[1.14, 0.12, 0.86]} />
          <meshPhysicalMaterial
            color="#6a2a40"
            roughness={0.78}
            sheen={0.45}
            sheenRoughness={0.55}
            sheenColor="#a04060"
          />
        </mesh>
        {/* Cushion edge welt */}
        <mesh position={[0, 0.47, 0.38]}>
          <boxGeometry args={[1.12, 0.04, 0.04]} />
          <meshStandardMaterial color="#4a1830" roughness={0.7} />
        </mesh>
        {/* Back rest pad */}
        <mesh position={[0, 0.95, -0.42]} castShadow>
          <boxGeometry args={[1.16, 0.78, 0.14]} />
          <meshPhysicalMaterial color="#5a2438" roughness={0.72} sheen={0.35} sheenColor="#903050" />
        </mesh>
        {/* Wood back rail + top cap */}
        <mesh position={[0, 1.35, -0.42]} castShadow>
          <boxGeometry args={[1.22, 0.08, 0.16]} />
          <meshStandardMaterial map={woodMap} color={woodDark} roughness={0.5} />
        </mesh>
        {/* Side arm rails */}
        <mesh position={[-0.58, 0.78, 0.05]} castShadow>
          <boxGeometry args={[0.08, 0.55, 0.85]} />
          <meshStandardMaterial map={woodMap} color="#3a221c" roughness={0.58} />
        </mesh>
        <mesh position={[0.58, 0.78, 0.05]} castShadow>
          <boxGeometry args={[0.08, 0.55, 0.85]} />
          <meshStandardMaterial map={woodMap} color="#3a221c" roughness={0.58} />
        </mesh>
        {/* Booth table — thick oak + residual #3 grain/varnish language */}
        <mesh position={[0.15, 0.71, 0.18]} castShadow receiveShadow>
          <boxGeometry args={[0.68, 0.1, 0.68]} />
          <meshPhysicalMaterial
            map={counterAlbedo}
            roughnessMap={varnishRough}
            clearcoatRoughnessMap={clearcoatRough}
            color="#a07040"
            roughness={0.18}
            clearcoat={0.95}
            clearcoatRoughness={0.1}
            metalness={0.03}
            envMapIntensity={1.35}
            sheen={0.15}
            sheenColor="#e0b888"
          />
        </mesh>
        {/* Table edge thickness reveal + edge wear */}
        <mesh position={[0.15, 0.65, 0.18]} castShadow>
          <boxGeometry args={[0.7, 0.028, 0.7]} />
          <meshStandardMaterial map={counterAlbedo} color="#3a2210" roughness={0.62} />
        </mesh>
        {/* Front lip wear on booth table */}
        <mesh position={[0.15, 0.765, 0.5]} castShadow>
          <boxGeometry args={[0.66, 0.012, 0.03]} />
          <meshStandardMaterial map={counterAlbedo} color="#5a3a20" roughness={0.85} />
        </mesh>
        <mesh position={[0.15, 0.48, 0.18]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.38, 12]} />
          <meshStandardMaterial map={woodMap} color="#2a1c14" roughness={0.6} />
        </mesh>
        {/* Small under-seat foot rail */}
        <mesh position={[0, 0.18, 0.42]}>
          <boxGeometry args={[1.05, 0.03, 0.04]} />
          <meshStandardMaterial color="#1a1010" metalness={0.4} roughness={0.45} />
        </mesh>
      </group>

      {/* A-frame chalkboard outside */}
      <AFrameChalkboard position={[2.75, 0.05, 1.25]} />

      {/* Full directional signpost */}
      <SignPost position={[-3.05, 0, 1.65]} />

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
          <meshStandardMaterial color="#200a20" emissive="#c040a0" emissiveIntensity={0.55} toneMapped={false} />
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
      <group position={[1.55, 1.02, -0.55]} scale={0.55}>
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
      <mesh position={[-1.7, 1.04, -0.35]} castShadow>
        <boxGeometry args={[0.18, 0.06, 0.14]} />
        <meshStandardMaterial map={woodMap} color="#4a3020" roughness={0.5} />
      </mesh>
      <mesh position={[-1.7, 1.1, -0.35]}>
        <boxGeometry args={[0.12, 0.08, 0.02]} />
        <meshStandardMaterial color="#f0e8e0" roughness={0.9} />
      </mesh>

      {/* Steam — soft sprites over ramen + boba (residual #7, no white mesh spheres) */}
      <SteamField position={[-0.85, 1.08, -0.4]} count={12} spread={0.18} />
      <SteamField position={[0.55, 1.12, -0.42]} count={8} spread={0.12} />

      {/* ═══ LIGHTING RIG — consolidated; warm fill so materials read at beauty FOV ═══ */}
      <ambientLight intensity={0.1} />
      <hemisphereLight args={['#ffb0e0', '#08050e', 0.38]} />
      {/* Single shadow-casting key — 1024 map is enough at this scale */}
      <directionalLight
        castShadow
        position={[2.8, 4.2, 3.2]}
        intensity={0.68}
        color="#ffd0f0"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={16}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.00025}
      />
      {/* Warm under-awning key → counter + food (residual #11 bounce spirit) */}
      <pointLight position={[0, 2.05, 0.2]} intensity={3.4} color="#ffb070" distance={6} decay={2} />
      {/* Cool fill */}
      <pointLight position={[-1.4, 1.6, 1.3]} intensity={0.85} color="#88ccff" distance={5} decay={2} />
      {/* Brand neon bounce — fascia marquee */}
      <pointLight position={[0.05, 2.95, 1.15]} intensity={2.15} color="#ff70d0" distance={5.5} decay={2} />
      {/* Signpost globes */}
      <pointLight position={[-2.9, 2.4, 1.6]} intensity={1.0} color="#ffe0ff" distance={5} decay={2} />

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
