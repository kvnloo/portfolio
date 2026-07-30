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
  const t = Math.max(0.018, Math.min(ax, ay, az) * 0.88)
  // Default cylinder is Y-up; reorient so length matches the longest box axis.
  let localRot: [number, number, number] = [0, 0, 0]
  let haloSize: [number, number] = [t * 4.4, len * 1.06]
  if (ax >= ay && ax >= az) {
    localRot = [0, 0, Math.PI / 2] // length → X
    haloSize = [len * 1.06, t * 4.4]
  } else if (az >= ax && az >= ay) {
    localRot = [Math.PI / 2, 0, 0] // length → Z
    haloSize = [t * 4.4, len * 1.06]
  }
  return (
    <group position={position} rotation={rotation}>
      {/* Tube body — localRot maps Y-up cylinder onto longest axis */}
      <group rotation={localRot}>
        {/* Hot white plasma core (feeds bloom) */}
        <mesh>
          <cylinderGeometry args={[t * 0.38, t * 0.38, len * 0.995, 10]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        {/* Colored gas fill */}
        <mesh>
          <cylinderGeometry args={[t * 0.62, t * 0.62, len * 0.998, 12]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.95} />
        </mesh>
        {/* Outer glass sleeve — Physical for rim highlight / glass thickness read */}
        <mesh>
          <cylinderGeometry args={[t, t, len, 14]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={intensity * 1.7}
            roughness={0.08}
            metalness={0.02}
            transmission={0.22}
            thickness={0.04}
            ior={1.45}
            transparent
            opacity={0.92}
            clearcoat={0.55}
            clearcoatRoughness={0.12}
            toneMapped={false}
          />
        </mesh>
        {/* End-cap beads (local Y) so tube terminates as glass, not cut cylinder */}
        <mesh position={[0, len * 0.5, 0]}>
          <sphereGeometry args={[t * 0.95, 8, 8]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <mesh position={[0, -len * 0.5, 0]}>
          <sphereGeometry args={[t * 0.95, 8, 8]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
      {/* Additive halo — primary face */}
      <mesh>
        <planeGeometry args={haloSize} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.32 * Math.min(intensity, 2)}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Soft dual-axis halo so tubes stay round under orbit */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[haloSize[1] * 0.95, haloSize[0] * 0.6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.14 * Math.min(intensity, 2)}
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

/** Thick fabric scalloped awning — volumetric pink canopy, not a flat slab. */
/**
 * Fabric awning — thick body + flattened half-cylinder scallops (not mushroom spheres).
 * Residual #6: stop pure emissive flat / toy scallop tell.
 */
function ScallopedAwning() {
  const scallops = 9
  const width = 4.6
  const step = width / scallops
  const fabric = {
    color: '#c42862',
    emissive: '#e02868',
    emissiveIntensity: 0.12,
    roughness: 0.82,
    metalness: 0.02,
  }
  return (
    <group position={[0, 2.28, 0.55]}>
      {/* Main fabric body (thick) */}
      <mesh position={[0, 0.08, -0.22]} rotation={[-0.38, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.12, 1.15]} />
        <meshStandardMaterial {...fabric} />
      </mesh>
      {/* Subtle weave fold ridges */}
      {[-0.35, 0, 0.35].map((z, i) => (
        <mesh key={i} position={[0, 0.14 - i * 0.01, -0.22 + z * 0.15]} rotation={[-0.38, 0, 0]}>
          <boxGeometry args={[width - 0.12, 0.015, 0.08]} />
          <meshStandardMaterial color="#a81848" roughness={0.88} />
        </mesh>
      ))}
      {/* Underside warm bounce (not pure emissive plane) */}
      <mesh position={[0, -0.02, -0.15]} rotation={[-0.38, 0, 0]}>
        <boxGeometry args={[width - 0.08, 0.02, 1.05]} />
        <meshStandardMaterial
          color="#ff9a60"
          emissive="#ff8050"
          emissiveIntensity={0.38}
          roughness={0.92}
          toneMapped={false}
        />
      </mesh>
      {/* Front valance bar */}
      <mesh position={[0, -0.02, 0.32]} castShadow>
        <boxGeometry args={[width + 0.08, 0.05, 0.07]} />
        <meshStandardMaterial color="#6a1838" roughness={0.55} metalness={0.18} />
      </mesh>
      {/* Scallop flaps — half-cylinder cloth, flattened (not solid mushroom spheres) */}
      {Array.from({ length: scallops }, (_, i) => {
        const x = -width / 2 + step * 0.5 + i * step
        const sag = (i % 2) * 0.02
        return (
          <group key={i} position={[x, -0.14 - sag, 0.36]}>
            <mesh castShadow rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.55, 1]}>
              <cylinderGeometry args={[step * 0.46, step * 0.46, 0.055, 14, 1, false, 0, Math.PI]} />
              <meshStandardMaterial
                color="#b42058"
                emissive="#d02860"
                emissiveIntensity={0.1}
                roughness={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Thin inner lining for thickness read */}
            <mesh position={[0, 0.01, -0.02]} rotation={[Math.PI / 2, 0, 0]} scale={[0.92, 0.45, 0.9]}>
              <cylinderGeometry args={[step * 0.42, step * 0.42, 0.02, 12, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color="#8a1840" roughness={0.88} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )
      })}
      {/* Side flaps */}
      <mesh position={[-width / 2 - 0.02, 0.05, -0.15]} rotation={[0, 0, 0.12]} castShadow>
        <boxGeometry args={[0.07, 0.55, 0.9]} />
        <meshStandardMaterial color="#a81850" emissive="#c02058" emissiveIntensity={0.08} roughness={0.8} />
      </mesh>
      <mesh position={[width / 2 + 0.02, 0.05, -0.15]} rotation={[0, 0, -0.12]} castShadow>
        <boxGeometry args={[0.07, 0.55, 0.9]} />
        <meshStandardMaterial color="#a81850" emissive="#c02058" emissiveIntensity={0.08} roughness={0.8} />
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

      {/* Glass tube border — cyan top / pink bottom (jesse dual-neon) */}
      <NeonTube position={[0, 0.43, 0.055]} args={[2.92, 0.038, 0.038]} color="#44f0ff" intensity={2.05} />
      <NeonTube position={[0, -0.43, 0.055]} args={[2.92, 0.038, 0.038]} color="#ff2d9a" intensity={1.95} />
      <NeonTube position={[-1.46, 0, 0.055]} args={[0.038, 0.84, 0.038]} color="#b044ff" intensity={1.55} />
      <NeonTube position={[1.46, 0, 0.055]} args={[0.038, 0.84, 0.038]} color="#b044ff" intensity={1.55} />
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

function Stool({
  position,
  woodMap,
}: {
  position: [number, number, number]
  woodMap: THREE.Texture
}) {
  return (
    <group position={position}>
      {/* Seat — wood + varnish edge ring */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.16, 0.055, 24]} />
        <meshPhysicalMaterial
          map={woodMap}
          color="#5a3a28"
          roughness={0.42}
          clearcoat={0.45}
          clearcoatRoughness={0.28}
          metalness={0.04}
        />
      </mesh>
      {/* Seat top varnish disc */}
      <mesh position={[0, 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.13, 24]} />
        <meshPhysicalMaterial
          map={woodMap}
          color="#4a3020"
          roughness={0.2}
          clearcoat={0.7}
          clearcoatRoughness={0.15}
        />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.035, 24]} />
        <meshPhysicalMaterial color="#1a1210" roughness={0.3} clearcoat={0.45} clearcoatRoughness={0.25} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.4
        return (
          <mesh key={i} position={[Math.cos(a) * 0.09, 0.2, Math.sin(a) * 0.09]} castShadow>
            <cylinderGeometry args={[0.016, 0.02, 0.4, 8]} />
            <meshStandardMaterial map={woodMap} color="#3a281c" roughness={0.7} metalness={0.08} />
          </mesh>
        )
      })}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.11, 0.12, 0.03, 16]} />
        <meshStandardMaterial color="#2a1c14" roughness={0.8} />
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
  const counterTop = '#2e2218'

  return (
    <group name="ShopShell">
      {/* ═══ GROUND CONTACT FOOTPRINT ═══ */}
      <mesh position={[0, -0.02, -0.45]} receiveShadow>
        <boxGeometry args={[5.4, 0.06, 3.9]} />
        <meshStandardMaterial map={woodMap} color="#14100e" roughness={0.85} />
      </mesh>
      {/* Raised plinth / platform edge */}
      <mesh position={[0, 0.04, -0.45]} receiveShadow castShadow>
        <boxGeometry args={[5.15, 0.1, 3.65]} />
        <meshStandardMaterial map={woodMap} color="#1e1612" roughness={0.75} />
      </mesh>

      {/* ═══ BACK WALL (full height to roof) ═══ */}
      <mesh position={[0, 1.55, -1.95]} receiveShadow castShadow>
        <boxGeometry args={[4.9, 3.1, 0.16]} />
        <meshStandardMaterial map={wallMap} color="#2a1c28" roughness={0.82} />
      </mesh>
      {/* Inner back panel (slightly lighter for depth) */}
      <mesh position={[0, 1.35, -1.86]}>
        <boxGeometry args={[4.5, 2.4, 0.04]} />
        <meshStandardMaterial map={wallMap} color="#3a2438" roughness={0.78} />
      </mesh>

      {/* ═══ SIDE WALLS (full volume, open front) ═══ */}
      <mesh position={[-2.42, 1.55, -0.65]} receiveShadow castShadow>
        <boxGeometry args={[0.16, 3.1, 2.7]} />
        <meshStandardMaterial map={wallMap} color="#241820" roughness={0.85} />
      </mesh>
      <mesh position={[2.42, 1.55, -0.65]} receiveShadow castShadow>
        <boxGeometry args={[0.16, 3.1, 2.7]} />
        <meshStandardMaterial map={wallMap} color="#241820" roughness={0.85} />
      </mesh>
      {/* Front corner posts (silhouette edges) */}
      <mesh position={[-2.35, 1.35, 0.62]} castShadow>
        <boxGeometry args={[0.14, 2.7, 0.14]} />
        <meshStandardMaterial color="#1a1018" roughness={0.7} metalness={0.15} />
      </mesh>
      <mesh position={[2.35, 1.35, 0.62]} castShadow>
        <boxGeometry args={[0.14, 2.7, 0.14]} />
        <meshStandardMaterial color="#1a1018" roughness={0.7} metalness={0.15} />
      </mesh>

      {/* ═══ ROOF VOLUME (thick box, not a thin slab) ═══ */}
      <mesh position={[0, 3.15, -0.7]} castShadow receiveShadow>
        <boxGeometry args={[5.2, 0.28, 3.0]} />
        <meshStandardMaterial color="#120c14" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Roof fascia / front lip */}
      <mesh position={[0, 2.95, 0.72]} castShadow>
        <boxGeometry args={[5.25, 0.18, 0.14]} />
        <meshStandardMaterial color="#1a0e18" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Roof side lips */}
      <mesh position={[-2.55, 3.05, -0.7]} castShadow>
        <boxGeometry args={[0.12, 0.22, 3.0]} />
        <meshStandardMaterial color="#160e16" roughness={0.65} />
      </mesh>
      <mesh position={[2.55, 3.05, -0.7]} castShadow>
        <boxGeometry args={[0.12, 0.22, 3.0]} />
        <meshStandardMaterial color="#160e16" roughness={0.65} />
      </mesh>

      {/* Thick scalloped fabric awning */}
      <ScallopedAwning />

      {/* ═══ COUNTER (wood grain + varnish edge + contact darkening) ═══ */}
      <mesh position={[0, 0.5, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[4.15, 0.92, 0.92]} />
        <meshStandardMaterial map={woodMap} color={wood} roughness={0.62} metalness={0.04} />
      </mesh>
      {/* Counter front apron panels */}
      <mesh position={[0, 0.42, -0.02]} castShadow>
        <boxGeometry args={[4.05, 0.72, 0.04]} />
        <meshStandardMaterial map={woodMap} color="#4a3020" roughness={0.58} />
      </mesh>
      {/* Polished counter top — clearcoat varnish (residual #3) */}
      <mesh position={[0, 0.98, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[4.28, 0.08, 1.05]} />
        <meshPhysicalMaterial
          map={woodMap}
          color={counterTop}
          roughness={0.22}
          clearcoat={0.85}
          clearcoatRoughness={0.14}
          metalness={0.06}
          envMapIntensity={0.9}
        />
      </mesh>
      {/* Front edge varnish strip (light catch on bullnose) */}
      <mesh position={[0, 0.995, 0.04]} castShadow>
        <boxGeometry args={[4.26, 0.018, 0.04]} />
        <meshPhysicalMaterial
          map={woodMap}
          color="#5a4030"
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.08}
          metalness={0.08}
        />
      </mesh>
      {/* Contact darkening under props (center of top surface) */}
      <mesh position={[0, 1.025, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.6, 0.75]} />
        <meshBasicMaterial color="#0a0604" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* Counter face cyan glow strip */}
      <mesh position={[0, 0.28, 0.0]}>
        <boxGeometry args={[4.0, 0.045, 0.025]} />
        <meshStandardMaterial
          color="#66f0ff"
          emissive="#22d0ff"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      {/* Toe kick */}
      <mesh position={[0, 0.04, -0.08]}>
        <boxGeometry args={[4.05, 0.08, 0.08]} />
        <meshStandardMaterial color="#120e0c" roughness={0.9} />
      </mesh>

      {/* Stools */}
      <Stool position={[-1.15, 0.05, 0.45]} woodMap={woodMap} />
      <Stool position={[0, 0.05, 0.45]} woodMap={woodMap} />
      <Stool position={[1.15, 0.05, 0.45]} woodMap={woodMap} />

      {/* ═══ NEON BRAND ON BUILDING (fascia marquee + roof glyph) ═══ */}
      <NeonBrandSign />
      {/* Single 3D tube glyph above-right — jesse silhouette parity (plate already has bowl art) */}
      <NeonRamenGlyph position={[1.72, 3.58, 0.52]} scale={1.05} />

      {/* Accent neon tubes on front corners / roof line */}
      <NeonTube position={[-2.28, 1.7, 0.55]} args={[0.045, 1.6, 0.045]} color="#ff2d6a" intensity={1.5} />
      <NeonTube position={[2.28, 1.7, 0.55]} args={[0.045, 1.6, 0.045]} color="#2db0ff" intensity={1.5} />
      <NeonTube position={[0, 3.05, 0.78]} args={[4.6, 0.035, 0.035]} color="#b044ff" intensity={1.15} />
      <NeonTube position={[-2.28, 2.9, -0.6]} rotation={[0, 0, Math.PI / 2]} args={[0.03, 1.8, 0.03]} color="#ff2d9a" intensity={0.7} />

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

      {/* Menu board on back wall */}
      <group position={[-1.35, 1.75, -1.84]}>
        <mesh castShadow>
          <boxGeometry args={[1.35, 0.95, 0.06]} />
          <meshStandardMaterial map={woodMap} color="#1a1410" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.18, 0.8]} />
          <meshStandardMaterial color="#121c18" roughness={0.95} />
        </mesh>
        <Text position={[0, 0.28, 0.05]} fontSize={0.075} color="#f0e6d0" anchorX="center">
          SPECIALS
        </Text>
        <Text
          position={[0, -0.02, 0.05]}
          fontSize={0.048}
          color="#b8e0b0"
          anchorX="center"
          maxWidth={1.05}
          lineHeight={1.45}
        >
          {`Miso Multi-Agent\nBrown Sugar Boba\nTaro Monument\nLaptop Lunch`}
        </Text>
      </group>

      {/* Noren curtains — multi-strip fabric with folds (residual #6), not flat emissive quads */}
      {[-1.05, 0, 1.05].map((x, panelI) => {
        const baseHue = panelI === 1 ? '#e02868' : '#2a1848'
        const emitHue = panelI === 1 ? '#ff2d6a' : '#5030a8'
        const strips = 5
        const stripW = 0.11
        const gap = 0.014
        const totalW = strips * stripW + (strips - 1) * gap
        return (
          <group key={panelI} position={[x, 1.92, 0.22]}>
            {/* Rod (horizontal) */}
            <mesh position={[0, 0.38, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.012, 0.012, totalW + 0.06, 8]} />
              <meshStandardMaterial color="#2a1c14" roughness={0.7} metalness={0.15} />
            </mesh>
            {Array.from({ length: strips }, (_, s) => {
              const sx = -totalW / 2 + stripW / 2 + s * (stripW + gap)
              const fold = Math.sin(s * 1.7 + panelI) * 0.025
              const len = 0.68 + (s % 3) * 0.02
              return (
                <group key={s} position={[sx, 0.02, fold]} rotation={[0.02 * (s - 2), 0, fold * 0.8]}>
                  <mesh castShadow>
                    <boxGeometry args={[stripW * 0.95, len, 0.012]} />
                    <meshPhysicalMaterial
                      color={baseHue}
                      emissive={emitHue}
                      emissiveIntensity={0.08}
                      roughness={0.88}
                      metalness={0}
                      sheen={0.35}
                      sheenRoughness={0.7}
                      sheenColor={panelI === 1 ? '#ff80a8' : '#8060c0'}
                      transparent
                      opacity={0.9}
                    />
                  </mesh>
                  {/* Fold highlight strip */}
                  <mesh position={[stripW * 0.28, 0, 0.004]}>
                    <boxGeometry args={[0.012, len * 0.95, 0.004]} />
                    <meshStandardMaterial
                      color={panelI === 1 ? '#ff6090' : '#4a3080'}
                      roughness={0.75}
                      transparent
                      opacity={0.45}
                    />
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

      {/* Booth nook left */}
      <group position={[-1.7, 0.05, 0.95]}>
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.15, 0.55, 0.95]} />
          <meshStandardMaterial map={woodMap} color="#3a2228" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.58, 0]} castShadow>
          <boxGeometry args={[1.1, 0.1, 0.9]} />
          <meshPhysicalMaterial color="#6a2a40" roughness={0.8} sheen={0.4} sheenColor="#a04060" />
        </mesh>
        <mesh position={[0, 0.95, -0.38]} castShadow>
          <boxGeometry args={[1.1, 0.75, 0.12]} />
          <meshPhysicalMaterial color="#5a2438" roughness={0.75} sheen={0.3} />
        </mesh>
        <mesh position={[0.12, 0.72, 0.12]} castShadow receiveShadow>
          <boxGeometry args={[0.58, 0.045, 0.58]} />
          <meshPhysicalMaterial map={woodMap} color={woodDark} roughness={0.35} clearcoat={0.35} />
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
