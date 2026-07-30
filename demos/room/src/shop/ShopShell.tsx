import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows, Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const texBase = `${import.meta.env.BASE_URL}assets/`

function SteamField({
  position,
  count = 16,
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
        speed: 0.2 + (i % 5) * 0.035,
        scale: 0.035 + (i % 4) * 0.01,
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
        cycle * 0.65,
        s.z + Math.cos(t * 0.7 + s.phase) * 0.03,
      )
      const mat = child.material as THREE.MeshStandardMaterial
      mat.opacity = Math.sin(cycle * Math.PI) * 0.38
      child.scale.setScalar(s.scale * (0.5 + cycle * 1.6))
    })
  })

  return (
    <group ref={group} position={position}>
      {seeds.map((s, i) => (
        <mesh key={i} position={[s.x, 0, s.z]}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial
            color="#fff8f0"
            emissive="#ffe8d0"
            emissiveIntensity={0.4}
            transparent
            opacity={0.25}
            depthWrite={false}
            roughness={1}
          />
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
  intensity = 1.2,
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
          emissiveIntensity={intensity}
          roughness={0.25}
          toneMapped={false}
        />
      </mesh>
      <pointLight color={color} intensity={intensity * 0.35} distance={2.5} />
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
          emissiveIntensity={0.95}
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
      <pointLight color={hue} intensity={0.65} distance={3.2} decay={2} />
    </group>
  )
}

function Stool({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.16, 0.055, 24]} />
        <meshStandardMaterial color="#4a3022" roughness={0.55} />
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
            <meshStandardMaterial color="#3a281c" roughness={0.7} metalness={0.12} />
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

function SignPost({ position }: { position: [number, number, number] }) {
  const signs = [
    { y: 2.05, label: 'projects', color: '#ff2d6a', yaw: 0.2 },
    { y: 1.72, label: 'articles', color: '#2dffb0', yaw: -0.35 },
    { y: 1.4, label: 'about me', color: '#2db0ff', yaw: 0.45 },
    { y: 1.08, label: 'credits', color: '#ffb02d', yaw: -0.15 },
  ]
  return (
    <group position={position}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 2.3, 12]} />
        <meshStandardMaterial color="#14141c" metalness={0.55} roughness={0.35} />
      </mesh>
      {/* Twin street lamps */}
      <mesh position={[0, 2.35, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#fff0ff" emissive="#ff66dd" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <mesh position={[0.55, 2.2, 0.1]}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffe0ff" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      <mesh position={[-0.55, 2.2, 0.1]}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial color="#ffffff" emissive="#e0ffff" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <mesh position={[0.55, 2.0, 0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.5} />
      </mesh>
      <mesh position={[-0.55, 2.0, 0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.5} />
      </mesh>
      <pointLight color="#ff66dd" intensity={1.1} distance={5} position={[0.55, 2.2, 0.1]} />
      <pointLight color="#66eeff" intensity={0.9} distance={5} position={[-0.55, 2.2, 0.1]} />

      {signs.map((s) => (
        <group key={s.label} position={[0.42, s.y, 0]} rotation={[0, s.yaw, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.85, 0.18, 0.05]} />
            <meshStandardMaterial
              color={s.color}
              emissive={s.color}
              emissiveIntensity={0.7}
              roughness={0.35}
              toneMapped={false}
            />
          </mesh>
          {/* Arrow tip */}
          <mesh position={[0.48, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.1, 0.16, 3]} />
            <meshStandardMaterial
              color={s.color}
              emissive={s.color}
              emissiveIntensity={0.7}
              toneMapped={false}
            />
          </mesh>
          <Text
            position={[0, 0, 0.035]}
            fontSize={0.075}
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

function StallDecor() {
  return (
    <group>
      {/* Hanging cables */}
      {[-1.2, 0.2, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 2.85, -0.9]} rotation={[0, 0, 0.08 * (i - 1)]}>
          <cylinderGeometry args={[0.008, 0.008, 1.2 + i * 0.15, 6]} />
          <meshStandardMaterial color="#1a1a22" />
        </mesh>
      ))}
      {/* Stickers / square neon tiles on stall front */}
      {[
        { p: [-1.6, 1.35, 0.42] as [number, number, number], c: '#ff2d6a' },
        { p: [-1.35, 1.5, 0.42] as [number, number, number], c: '#2dffb0' },
        { p: [-1.1, 1.28, 0.42] as [number, number, number], c: '#2db0ff' },
        { p: [1.9, 1.4, 0.42] as [number, number, number], c: '#ffb02d' },
      ].map((t, i) => (
        <mesh key={i} position={t.p}>
          <boxGeometry args={[0.16, 0.16, 0.03]} />
          <meshStandardMaterial color={t.c} emissive={t.c} emissiveIntensity={0.8} toneMapped={false} />
        </mesh>
      ))}
      {/* A-frame chalkboard outside */}
      <group position={[2.6, 0.55, 1.1]} rotation={[0, -0.45, 0]}>
        <mesh position={[-0.12, 0.35, 0]} rotation={[0, 0, 0.18]} castShadow>
          <boxGeometry args={[0.06, 0.9, 0.06]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        <mesh position={[0.12, 0.35, 0]} rotation={[0, 0, -0.18]} castShadow>
          <boxGeometry args={[0.06, 0.9, 0.06]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        <mesh position={[0, 0.55, 0.05]} castShadow>
          <boxGeometry args={[0.55, 0.7, 0.04]} />
          <meshStandardMaterial color="#1a2420" roughness={0.95} />
        </mesh>
        <Text position={[0, 0.7, 0.08]} fontSize={0.06} color="#f0e6d0" anchorX="center">
          OPEN LATE
        </Text>
        <Text position={[0, 0.5, 0.08]} fontSize={0.045} color="#c8e6c0" anchorX="center" maxWidth={0.45}>
          click a dish
        </Text>
      </group>
    </group>
  )
}

/**
 * Kevin's Ramen & Boba — compact neon night stall (jesse-zhou craft language).
 * Open front diorama on black stage.
 */
export function ShopShell() {
  const woodMap = useTexture(`${texBase}tex-wood.jpg`)
  const wallMap = useTexture(`${texBase}tex-wall.jpg`)
  ;[woodMap, wallMap].forEach((t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = THREE.SRGBColorSpace
  })
  woodMap.repeat.set(2.5, 1.8)
  wallMap.repeat.set(1.8, 1.2)

  const wood = '#5c3d28'
  const woodDark = '#3a2618'
  const counter = '#2a1e16'

  return (
    <group name="ShopShell">
      {/* —— STALL FLOOR PLATFORM —— */}
      <mesh position={[0, -0.04, -0.3]} receiveShadow>
        <boxGeometry args={[5.2, 0.08, 3.6]} />
        <meshStandardMaterial map={woodMap} color="#1a1210" roughness={0.7} />
      </mesh>

      {/* —— BACK WALL —— */}
      <mesh position={[0, 1.35, -1.85]} receiveShadow castShadow>
        <boxGeometry args={[4.8, 2.7, 0.14]} />
        <meshStandardMaterial map={wallMap} color="#2a1c28" roughness={0.82} />
      </mesh>
      {/* Side walls (short, open front) */}
      <mesh position={[-2.35, 1.35, -0.55]} receiveShadow castShadow>
        <boxGeometry args={[0.12, 2.7, 2.5]} />
        <meshStandardMaterial map={wallMap} color="#241820" roughness={0.85} />
      </mesh>
      <mesh position={[2.35, 1.35, -0.55]} receiveShadow castShadow>
        <boxGeometry args={[0.12, 2.7, 2.5]} />
        <meshStandardMaterial map={wallMap} color="#241820" roughness={0.85} />
      </mesh>

      {/* —— ROOF / AWNING —— */}
      <mesh position={[0, 2.75, -0.7]} castShadow>
        <boxGeometry args={[5.0, 0.1, 2.8]} />
        <meshStandardMaterial color="#1a0e18" roughness={0.75} />
      </mesh>
      <mesh position={[0, 2.35, 0.35]} rotation={[-0.45, 0, 0]} castShadow>
        <boxGeometry args={[4.9, 0.08, 1.1]} />
        <meshStandardMaterial
          color="#d42a6a"
          emissive="#ff2d7a"
          emissiveIntensity={0.25}
          roughness={0.5}
        />
      </mesh>
      {/* Awning scallops suggestion */}
      {[-1.8, -0.9, 0, 0.9, 1.8].map((x) => (
        <mesh key={x} position={[x, 2.05, 0.75]}>
          <sphereGeometry args={[0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#c42060" emissive="#ff2d7a" emissiveIntensity={0.15} />
        </mesh>
      ))}

      {/* —— COUNTER —— */}
      <mesh position={[0, 0.48, -0.55]} castShadow receiveShadow>
        <boxGeometry args={[4.0, 0.96, 0.85]} />
        <meshStandardMaterial map={woodMap} color={wood} roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.98, -0.55]} castShadow receiveShadow>
        <boxGeometry args={[4.15, 0.07, 0.98]} />
        <meshPhysicalMaterial
          color={counter}
          roughness={0.22}
          clearcoat={0.65}
          clearcoatRoughness={0.2}
          metalness={0.06}
        />
      </mesh>
      {/* Counter face glow strip */}
      <mesh position={[0, 0.35, -0.1]}>
        <boxGeometry args={[3.9, 0.04, 0.02]} />
        <meshStandardMaterial color="#66f0ff" emissive="#22d0ff" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>

      {/* Stools */}
      <Stool position={[-1.1, 0, 0.35]} />
      <Stool position={[0, 0, 0.35]} />
      <Stool position={[1.1, 0, 0.35]} />

      {/* —— NEON SIGN —— */}
      <group position={[0.15, 2.15, -1.72]}>
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[3.2, 0.7, 0.08]} />
          <meshStandardMaterial color="#0a0610" roughness={0.6} />
        </mesh>
        <Text
          position={[0, 0.08, 0.05]}
          fontSize={0.22}
          color="#ff6ad5"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#ff1490"
          maxWidth={3}
        >
          Kevin&apos;s Ramen
        </Text>
        <Text
          position={[0, -0.16, 0.05]}
          fontSize={0.16}
          color="#66f0ff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#00c8e0"
        >
          &amp; Boba
        </Text>
        <pointLight color="#ff66cc" intensity={2.2} distance={7} position={[0, 0, 0.6]} />
        <pointLight color="#44e8ff" intensity={1.2} distance={5} position={[0.8, -0.2, 0.4]} />
      </group>

      {/* Bowl neon icon */}
      <group position={[-1.85, 2.2, -1.72]}>
        <mesh>
          <torusGeometry args={[0.16, 0.035, 12, 32]} />
          <meshStandardMaterial color="#66f0ff" emissive="#22e0ff" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <mesh position={[0.12, 0.12, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.015, 0.015, 0.22, 8]} />
          <meshStandardMaterial color="#ff9ad5" emissive="#ff66cc" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <pointLight color="#44e8ff" intensity={0.7} distance={3} />
      </group>

      {/* Accent neon tubes */}
      <NeonTube position={[-2.2, 1.6, -1.7]} args={[0.04, 1.4, 0.04]} color="#ff2d6a" />
      <NeonTube position={[2.2, 1.6, -1.7]} args={[0.04, 1.4, 0.04]} color="#2db0ff" />
      <NeonTube position={[0, 2.65, -1.0]} args={[4.2, 0.03, 0.03]} color="#b044ff" intensity={0.8} />

      {/* Paper lanterns */}
      <PaperLantern position={[-1.4, 2.35, -0.3]} hue="#ff7a4a" scale={0.95} />
      <PaperLantern position={[0.3, 2.4, 0.1]} hue="#ffb060" scale={0.85} />
      <PaperLantern position={[1.5, 2.32, -0.5]} hue="#ff6090" scale={0.9} />

      {/* Back shelf bottles */}
      <group position={[1.5, 1.15, -1.55]}>
        {[0, 0.16, 0.32, 0.48].map((x, i) => (
          <mesh key={i} position={[x, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.045, 0.38 + (i % 2) * 0.08, 14]} />
            <meshPhysicalMaterial
              color={['#3a1828', '#1a3040', '#2a2010', '#402020'][i]}
              roughness={0.15}
              transmission={0.45}
              thickness={0.2}
              transparent
              opacity={0.88}
              clearcoat={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* Menu board back wall */}
      <group position={[1.55, 1.7, -1.76]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.85, 0.05]} />
          <meshStandardMaterial color="#1a1410" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[1.05, 0.7]} />
          <meshStandardMaterial color="#121c18" roughness={0.95} />
        </mesh>
        <Text position={[0, 0.24, 0.04]} fontSize={0.07} color="#f0e6d0" anchorX="center">
          SPECIALS
        </Text>
        <Text
          position={[0, 0.0, 0.04]}
          fontSize={0.045}
          color="#b8e0b0"
          anchorX="center"
          maxWidth={0.95}
          lineHeight={1.4}
        >
          {`Miso Multi-Agent\nBrown Sugar Boba\nTaro Monument\nLaptop Lunch`}
        </Text>
      </group>

      {/* Booth nook left */}
      <group position={[-1.65, 0, 0.85]}>
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.55, 0.9]} />
          <meshStandardMaterial color="#3a2228" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.58, 0]} castShadow>
          <boxGeometry args={[1.05, 0.1, 0.85]} />
          <meshPhysicalMaterial color="#6a2a40" roughness={0.8} sheen={0.4} sheenColor="#a04060" />
        </mesh>
        <mesh position={[0, 0.95, -0.35]} castShadow>
          <boxGeometry args={[1.05, 0.75, 0.12]} />
          <meshPhysicalMaterial color="#5a2438" roughness={0.75} sheen={0.3} />
        </mesh>
        <mesh position={[0.15, 0.72, 0.15]} castShadow receiveShadow>
          <boxGeometry args={[0.55, 0.04, 0.55]} />
          <meshPhysicalMaterial color={woodDark} roughness={0.35} clearcoat={0.35} />
        </mesh>
      </group>

      <SignPost position={[-2.9, 0, 1.5]} />
      <StallDecor />

      {/* Roof-top clutter (jesse density language) */}
      <group position={[0, 2.95, -0.9]}>
        <mesh position={[-0.8, 0.25, 0]} castShadow>
          <boxGeometry args={[0.9, 0.5, 0.5]} />
          <meshStandardMaterial color="#1a2030" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0.6, 0.35, 0.1]} castShadow>
          <boxGeometry args={[0.55, 0.7, 0.4]} />
          <meshStandardMaterial color="#2a1828" roughness={0.6} />
        </mesh>
        {/* Antenna */}
        <mesh position={[1.4, 0.7, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
          <meshStandardMaterial color="#8899aa" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[1.4, 1.35, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#66f0ff" emissive="#22e0ff" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        {/* Floating screens / posters */}
        <mesh position={[-0.2, 0.55, 0.3]} rotation={[0.1, 0.2, 0]}>
          <planeGeometry args={[0.7, 0.4]} />
          <meshStandardMaterial color="#0a2030" emissive="#2a80c0" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0.9, 0.6, 0.25]} rotation={[-0.1, -0.15, 0]}>
          <planeGeometry args={[0.5, 0.35]} />
          <meshStandardMaterial color="#200a20" emissive="#c040a0" emissiveIntensity={0.45} />
        </mesh>
      </group>

      {/* Japanese-style hanging noren suggestion */}
      {[-0.9, 0, 0.9].map((x, i) => (
        <mesh key={i} position={[x, 1.85, 0.15]}>
          <boxGeometry args={[0.55, 0.7, 0.02]} />
          <meshStandardMaterial
            color={i === 1 ? '#ff2d6a' : '#2a1840'}
            emissive={i === 1 ? '#ff2d6a' : '#4020a0'}
            emissiveIntensity={0.15}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}

      {/* Steam */}
      <SteamField position={[-0.85, 1.05, -0.45]} count={16} spread={0.18} />
      <SteamField position={[0.7, 1.05, -0.5]} count={12} spread={0.14} />

      {/* Lighting rig — night market */}
      <ambientLight intensity={0.08} />
      <hemisphereLight args={['#ffb0e0', '#080510', 0.35]} />
      <directionalLight
        castShadow
        position={[2.5, 4, 3]}
        intensity={0.45}
        color="#ffd0f0"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={18}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.00025}
      />
      <pointLight position={[0, 2.0, -0.3]} intensity={1.3} color="#ffb080" distance={6} decay={2} />
      <pointLight position={[-1.5, 1.6, 0.5]} intensity={0.55} color="#88ccff" distance={4} decay={2} />
      <spotLight
        position={[0, 3.2, 1.2]}
        angle={0.5}
        penumbra={0.65}
        intensity={0.85}
        color="#ffe8ff"
        castShadow
      />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.75}
        scale={14}
        blur={2.6}
        far={5}
        color="#050208"
      />
    </group>
  )
}
