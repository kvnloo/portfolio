import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows, Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const texBase = `${import.meta.env.BASE_URL}assets/`

function SteamField({
  position,
  count = 20,
  spread = 0.22,
}: {
  position: [number, number, number]
  count?: number
  spread?: number
}) {
  const group = useRef<THREE.Group>(null)
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.sin(i * 2.17) * spread * 0.55,
        z: Math.cos(i * 1.63) * spread * 0.55,
        phase: i * 0.41,
        speed: 0.18 + (i % 5) * 0.032,
        scale: 0.04 + (i % 4) * 0.012,
      })),
    [count, spread],
  )

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const t = clock.elapsedTime
    g.children.forEach((child, i) => {
      const s = seeds[i]
      if (!s || !(child instanceof THREE.Mesh)) return
      const cycle = ((t * s.speed + s.phase) % 1.5) / 1.5
      child.position.set(
        s.x + Math.sin(t * 0.9 + s.phase) * 0.04,
        cycle * 0.75,
        s.z + Math.cos(t * 0.7 + s.phase) * 0.03,
      )
      const mat = child.material as THREE.MeshBasicMaterial
      mat.opacity = Math.sin(cycle * Math.PI) * 0.42
      child.scale.setScalar(s.scale * (0.5 + cycle * 1.8))
    })
  })

  return (
    <group ref={group} position={position}>
      {seeds.map((s, i) => (
        <mesh key={i} position={[s.x, 0, s.z]}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#fff2e8" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

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
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={args} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          // Slightly hotter emissive so bloom still sells glow without a pointLight per tube
          emissiveIntensity={intensity * 1.15}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>
      {/* No per-tube pointLight — was exploding light count (main FPS killer) */}
    </group>
  )
}

/** Thick fabric scalloped awning — volumetric pink canopy, not a flat slab. */
function ScallopedAwning() {
  const scallops = 9
  const width = 4.6
  const step = width / scallops
  return (
    <group position={[0, 2.28, 0.55]}>
      {/* Main fabric body (thick) */}
      <mesh position={[0, 0.08, -0.22]} rotation={[-0.38, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.14, 1.15]} />
        <meshStandardMaterial
          color="#d42a6a"
          emissive="#ff2d7a"
          emissiveIntensity={0.28}
          roughness={0.72}
        />
      </mesh>
      {/* Underside glow (warm key bounce) */}
      <mesh position={[0, -0.02, -0.15]} rotation={[-0.38, 0, 0]}>
        <boxGeometry args={[width - 0.08, 0.02, 1.05]} />
        <meshStandardMaterial
          color="#ff8a50"
          emissive="#ff9050"
          emissiveIntensity={0.55}
          roughness={0.9}
          toneMapped={false}
        />
      </mesh>
      {/* Front valance bar */}
      <mesh position={[0, -0.02, 0.32]} castShadow>
        <boxGeometry args={[width + 0.08, 0.06, 0.08]} />
        <meshStandardMaterial color="#8a1848" roughness={0.55} metalness={0.15} />
      </mesh>
      {/* Scallop lobes along front edge */}
      {Array.from({ length: scallops }, (_, i) => {
        const x = -width / 2 + step * 0.5 + i * step
        return (
          <group key={i} position={[x, -0.12, 0.38]}>
            <mesh castShadow>
              <sphereGeometry args={[step * 0.48, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial
                color="#c42060"
                emissive="#ff2d7a"
                emissiveIntensity={0.2}
                roughness={0.7}
              />
            </mesh>
            {/* Thickness — rear half of scallop volume */}
            <mesh position={[0, 0.02, -0.06]} scale={[1, 0.7, 0.85]}>
              <sphereGeometry args={[step * 0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#a81850" roughness={0.75} />
            </mesh>
          </group>
        )
      })}
      {/* Side flaps */}
      <mesh position={[-width / 2 - 0.02, 0.05, -0.15]} rotation={[0, 0, 0.12]} castShadow>
        <boxGeometry args={[0.08, 0.55, 0.9]} />
        <meshStandardMaterial color="#b82058" emissive="#ff2d7a" emissiveIntensity={0.12} roughness={0.7} />
      </mesh>
      <mesh position={[width / 2 + 0.02, 0.05, -0.15]} rotation={[0, 0, -0.12]} castShadow>
        <boxGeometry args={[0.08, 0.55, 0.9]} />
        <meshStandardMaterial color="#b82058" emissive="#ff2d7a" emissiveIntensity={0.12} roughness={0.7} />
      </mesh>
    </group>
  )
}

/** Neon ramen bowl glyph — bowl + chopsticks as emissive tubes. */
function NeonRamenGlyph({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Bowl body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.028, 12, 36, Math.PI]} />
        <meshStandardMaterial
          color="#66f0ff"
          emissive="#22e0ff"
          emissiveIntensity={2.0}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>
      {/* Bowl base arc */}
      <mesh position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.022, 10, 28, Math.PI]} />
        <meshStandardMaterial
          color="#66f0ff"
          emissive="#22e0ff"
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>
      {/* Noodles / steam squiggles */}
      {[
        { x: -0.06, r: 0.35 },
        { x: 0.02, r: -0.2 },
        { x: 0.1, r: 0.5 },
      ].map((n, i) => (
        <mesh key={i} position={[n.x, 0.12, 0]} rotation={[0, 0, n.r]}>
          <cylinderGeometry args={[0.014, 0.014, 0.22, 8]} />
          <meshStandardMaterial
            color="#ff9ad5"
            emissive="#ff66cc"
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* Chopsticks */}
      <mesh position={[0.14, 0.14, 0.02]} rotation={[0, 0, -0.55]}>
        <cylinderGeometry args={[0.012, 0.012, 0.28, 8]} />
        <meshStandardMaterial color="#ffb0e0" emissive="#ff66cc" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      <mesh position={[0.18, 0.12, -0.02]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.012, 0.012, 0.26, 8]} />
        <meshStandardMaterial color="#ffb0e0" emissive="#ff66cc" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      {/* Glyph glow handled by shared brand key light in lighting rig */}
    </group>
  )
}

/** Main marquee: "Kevin's Ramen & Boba" as neon tubes on building face. */
function NeonBrandSign() {
  return (
    <group position={[0.2, 2.55, 0.08]}>
      {/* Sign housing / black channel letter box */}
      <mesh position={[0, 0, -0.06]} castShadow>
        <boxGeometry args={[3.55, 0.78, 0.14]} />
        <meshStandardMaterial color="#0a0610" roughness={0.55} metalness={0.25} />
      </mesh>
      {/* Neon border frame */}
      <NeonTube position={[0, 0.34, 0.02]} args={[3.4, 0.035, 0.035]} color="#ff2d9a" intensity={1.6} />
      <NeonTube position={[0, -0.34, 0.02]} args={[3.4, 0.035, 0.035]} color="#2db0ff" intensity={1.4} />
      <NeonTube position={[-1.68, 0, 0.02]} args={[0.035, 0.68, 0.035]} color="#b044ff" intensity={1.2} />
      <NeonTube position={[1.68, 0, 0.02]} args={[0.035, 0.68, 0.035]} color="#b044ff" intensity={1.2} />

      <Text
        position={[0.12, 0.12, 0.06]}
        fontSize={0.24}
        color="#ff6ad5"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.014}
        outlineColor="#ff1490"
        maxWidth={3.1}
        letterSpacing={0.04}
      >
        Kevin&apos;s Ramen
      </Text>
      <Text
        position={[0.12, -0.16, 0.06]}
        fontSize={0.17}
        color="#66f0ff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#00c8e0"
        letterSpacing={0.08}
      >
        &amp; Boba
      </Text>
      {/* Glow plates behind text for bloom-friendly emissives */}
      <mesh position={[0.12, 0.12, 0.01]}>
        <planeGeometry args={[2.6, 0.28]} />
        <meshStandardMaterial
          color="#ff2d9a"
          emissive="#ff2d9a"
          emissiveIntensity={0.55}
          transparent
          opacity={0.35}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0.12, -0.16, 0.01]}>
        <planeGeometry args={[1.4, 0.2]} />
        <meshStandardMaterial
          color="#22e0ff"
          emissive="#22e0ff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      {/* Brand wash is a single shared pointLight in the lighting rig */}
    </group>
  )
}

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
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.4, 6]} />
        <meshStandardMaterial color="#2a1c14" roughness={0.9} />
      </mesh>
      <mesh castShadow>
        <sphereGeometry args={[0.15, 24, 18]} />
        <meshPhysicalMaterial
          color={hue}
          emissive={hue}
          emissiveIntensity={1.05}
          roughness={0.5}
          transmission={0.18}
          thickness={0.2}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.05, 0.065, 0.03, 16]} />
        <meshStandardMaterial color="#1a1008" />
      </mesh>
      <mesh position={[0, -0.14, 0]}>
        <cylinderGeometry args={[0.065, 0.05, 0.03, 16]} />
        <meshStandardMaterial color="#1a1008" />
      </mesh>
      {/* Shared awning key lights cover lantern contribution; skip per-lantern lights */}
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
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.16, 0.055, 24]} />
        <meshStandardMaterial map={woodMap} color="#5a3a28" roughness={0.55} />
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
        <group key={s.label} position={[0.55, s.y, 0]} rotation={[0, s.yaw, 0]}>
          <mesh castShadow>
            <boxGeometry args={[s.w, 0.22, 0.06]} />
            <meshStandardMaterial
              color={s.color}
              emissive={s.color}
              emissiveIntensity={0.95}
              roughness={0.3}
              toneMapped={false}
            />
          </mesh>
          {/* Arrow tip */}
          <mesh position={[s.w / 2 + 0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.12, 0.2, 3]} />
            <meshStandardMaterial
              color={s.color}
              emissive={s.color}
              emissiveIntensity={0.95}
              toneMapped={false}
            />
          </mesh>
          <Text
            position={[0, 0, 0.04]}
            fontSize={0.09}
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

function CondimentBottle({
  position,
  color,
  height = 0.32,
}: {
  position: [number, number, number]
  color: string
  height?: number
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.035, 0.04, height, 14]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.15}
          transmission={0.4}
          thickness={0.18}
          transparent
          opacity={0.9}
          clearcoat={0.5}
        />
      </mesh>
      <mesh position={[0, height / 2 + 0.02, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.05, 10]} />
        <meshStandardMaterial color="#1a1410" roughness={0.5} />
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

      {/* ═══ COUNTER (wood grain, grounded) ═══ */}
      <mesh position={[0, 0.5, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[4.15, 0.92, 0.92]} />
        <meshStandardMaterial map={woodMap} color={wood} roughness={0.55} />
      </mesh>
      {/* Counter front apron panels (grain vertical feel) */}
      <mesh position={[0, 0.42, -0.02]} castShadow>
        <boxGeometry args={[4.05, 0.72, 0.04]} />
        <meshStandardMaterial map={woodMap} color="#4a3020" roughness={0.6} />
      </mesh>
      {/* Polished counter top */}
      <mesh position={[0, 0.98, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[4.28, 0.08, 1.05]} />
        <meshPhysicalMaterial
          map={woodMap}
          color={counterTop}
          roughness={0.28}
          clearcoat={0.7}
          clearcoatRoughness={0.18}
          metalness={0.05}
        />
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

      {/* ═══ NEON BRAND ON BUILDING ═══ */}
      <NeonBrandSign />
      <NeonRamenGlyph position={[-1.95, 2.55, 0.1]} />

      {/* Accent neon tubes on front corners / roof line */}
      <NeonTube position={[-2.28, 1.7, 0.55]} args={[0.045, 1.6, 0.045]} color="#ff2d6a" intensity={1.5} />
      <NeonTube position={[2.28, 1.7, 0.55]} args={[0.045, 1.6, 0.045]} color="#2db0ff" intensity={1.5} />
      <NeonTube position={[0, 3.05, 0.55]} args={[4.6, 0.035, 0.035]} color="#b044ff" intensity={1.0} />
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

      {/* Noren curtains under sign / awning */}
      {[-1.0, 0, 1.0].map((x, i) => (
        <group key={i} position={[x, 1.95, 0.22]}>
          <mesh castShadow>
            <boxGeometry args={[0.62, 0.72, 0.025]} />
            <meshStandardMaterial
              color={i === 1 ? '#ff2d6a' : '#2a1840'}
              emissive={i === 1 ? '#ff2d6a' : '#4020a0'}
              emissiveIntensity={0.18}
              transparent
              opacity={0.88}
              roughness={0.85}
            />
          </mesh>
          {/* Vertical slits suggestion */}
          <mesh position={[0, -0.2, 0.01]}>
            <boxGeometry args={[0.02, 0.35, 0.01]} />
            <meshStandardMaterial color="#0a0610" transparent opacity={0.5} />
          </mesh>
        </group>
      ))}

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

      {/* Second decorative bowl on counter (non-interactive prop density) */}
      <group position={[1.55, 1.02, -0.55]} scale={0.55}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.16, 0.14, 24]} />
          <meshStandardMaterial color="#1a1418" roughness={0.4} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.04, 24]} />
          <meshStandardMaterial
            color="#c86828"
            emissive="#e87830"
            emissiveIntensity={0.35}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0.04, 0.12, 0.02]} rotation={[0.2, 0, 0.3]}>
          <torusGeometry args={[0.06, 0.015, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#e8d0a0" roughness={0.6} />
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

      {/* Steam — fewer particles (was 48 total) */}
      <SteamField position={[-0.85, 1.08, -0.4]} count={10} spread={0.2} />
      <SteamField position={[0.7, 1.08, -0.45]} count={8} spread={0.16} />

      {/* ═══ LIGHTING RIG — consolidated (was 8+ local + many neon lights) ═══ */}
      <ambientLight intensity={0.08} />
      <hemisphereLight args={['#ffb0e0', '#06040c', 0.32]} />
      {/* Single shadow-casting key — 1024 map is enough at this scale */}
      <directionalLight
        castShadow
        position={[2.8, 4.2, 3.2]}
        intensity={0.55}
        color="#ffd0f0"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={16}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.00025}
      />
      {/* One warm under-awning key (was 3) */}
      <pointLight position={[0, 2.05, 0.2]} intensity={2.8} color="#ffb070" distance={6} decay={2} />
      {/* One cool fill */}
      <pointLight position={[-1.4, 1.6, 1.3]} intensity={0.7} color="#88ccff" distance={5} decay={2} />
      {/* Brand neon bounce (keeps sign readable without per-tube lights) */}
      <pointLight position={[0.2, 2.55, 0.5]} intensity={1.6} color="#ff66cc" distance={5} decay={2} />
      {/* Signpost globes */}
      <pointLight position={[-2.9, 2.4, 1.6]} intensity={1.1} color="#ffe0ff" distance={5} decay={2} />

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
