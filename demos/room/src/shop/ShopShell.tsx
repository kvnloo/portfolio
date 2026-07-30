import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows, Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const texBase = `${import.meta.env.BASE_URL}assets/`

/** Soft rising steam particles (emissive soft spheres). */
function SteamField({
  position,
  count = 18,
  spread = 0.28,
}: {
  position: [number, number, number]
  count?: number
  spread?: number
}) {
  const group = useRef<THREE.Group>(null)
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.sin(i * 2.1) * 0.5 + Math.cos(i * 0.7) * 0.5) * spread,
        z: (Math.cos(i * 1.7) * 0.5 + Math.sin(i * 0.9) * 0.5) * spread,
        phase: i * 0.37,
        speed: 0.22 + (i % 5) * 0.04,
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
      const cycle = ((t * s.speed + s.phase) % 1.4) / 1.4
      child.position.y = cycle * 0.55
      child.position.x = s.x + Math.sin(t * 0.8 + s.phase) * 0.03
      child.position.z = s.z + Math.cos(t * 0.7 + s.phase) * 0.03
      const fade = Math.sin(cycle * Math.PI)
      const mat = child.material as THREE.MeshStandardMaterial
      mat.opacity = fade * 0.35
      child.scale.setScalar(s.scale * (0.6 + cycle * 1.4))
    })
  })

  return (
    <group ref={group} position={position}>
      {seeds.map((s, i) => (
        <mesh key={i} position={[s.x, 0, s.z]}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial
            color="#f5f0e8"
            emissive="#fff8f0"
            emissiveIntensity={0.35}
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
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.35, 6]} />
        <meshStandardMaterial color="#2a1c14" roughness={0.9} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.14, 24, 18]} />
        <meshPhysicalMaterial
          color={hue}
          emissive={hue}
          emissiveIntensity={0.85}
          roughness={0.55}
          transmission={0.15}
          thickness={0.2}
          transparent
          opacity={0.92}
        />
      </mesh>
      {/* Caps */}
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.03, 16]} />
        <meshStandardMaterial color="#1a1008" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.13, 0]}>
        <cylinderGeometry args={[0.06, 0.05, 0.03, 16]} />
        <meshStandardMaterial color="#1a1008" roughness={0.6} />
      </mesh>
      <pointLight color={hue} intensity={0.55} distance={3.5} decay={2} position={[0, 0, 0]} />
    </group>
  )
}

function Stool({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.17, 0.06, 24]} />
        <meshStandardMaterial color="#4a3022" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 24]} />
        <meshPhysicalMaterial
          color="#1a1210"
          roughness={0.35}
          clearcoat={0.4}
          clearcoatRoughness={0.3}
        />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.4
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.1, 0.2, Math.sin(a) * 0.1]}
            castShadow
          >
            <cylinderGeometry args={[0.018, 0.022, 0.4, 8]} />
            <meshStandardMaterial color="#3a281c" roughness={0.7} metalness={0.15} />
          </mesh>
        )
      })}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.12, 0.13, 0.03, 16]} />
        <meshStandardMaterial color="#2a1c14" roughness={0.8} />
      </mesh>
    </group>
  )
}

function ChalkboardMenu({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.95, 0.06]} />
        <meshStandardMaterial color="#2c2118" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshStandardMaterial color="#1a2420" roughness={0.95} />
      </mesh>
      <Text
        position={[0, 0.28, 0.04]}
        fontSize={0.09}
        color="#f0e6d0"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.1}
      >
        TODAY&apos;S SPECIALS
      </Text>
      <Text
        position={[0, 0.08, 0.04]}
        fontSize={0.055}
        color="#c8e6c0"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.1}
        lineHeight={1.35}
      >
        {`Miso Multi-Agent Ramen\nBrown Sugar Boba\nTaro Monument Float\nLaptop Lunch Set`}
      </Text>
      <Text
        position={[0, -0.28, 0.04]}
        fontSize={0.04}
        color="#a89880"
        anchorX="center"
        anchorY="middle"
      >
        click a dish · explore projects
      </Text>
    </group>
  )
}

/**
 * Full immersive shop interior — not props on a plane.
 * Warm night shop: wood, neon, lanterns, L-counter, booth, window.
 */
export function ShopShell() {
  const woodMap = useTexture(`${texBase}tex-wood.jpg`)
  const wallMap = useTexture(`${texBase}tex-wall.jpg`)
  ;[woodMap, wallMap].forEach((t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = THREE.SRGBColorSpace
  })
  woodMap.repeat.set(3, 2)
  wallMap.repeat.set(2, 1.5)

  const woodDark = '#3d291e'
  const woodMid = '#5a3d2a'
  const woodLight = '#6b4a32'
  const plaster = '#2a221c'
  const plasterWarm = '#322820'
  const tile = '#1e1814'
  const counterTop = '#2a1f18'
  const metal = '#8a7a6a'

  return (
    <group name="ShopShell">
      {/* —— FLOOR —— */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial
          map={woodMap}
          color={tile}
          roughness={0.68}
          metalness={0.05}
        />
      </mesh>
      {/* Wood plank strips suggestion */}
      {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((z, i) => (
        <mesh
          key={`plank-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.002, z]}
          receiveShadow
        >
          <planeGeometry args={[9.5, 0.02]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#241810' : '#1a120e'}
            roughness={0.85}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}

      {/* —— WALLS —— back */}
      <mesh position={[0, 1.6, -3.2]} receiveShadow>
        <boxGeometry args={[10, 3.2, 0.18]} />
        <meshStandardMaterial map={wallMap} color={plaster} roughness={0.85} />
      </mesh>
      {/* left */}
      <mesh position={[-5, 1.6, 0]} receiveShadow>
        <boxGeometry args={[0.18, 3.2, 6.5]} />
        <meshStandardMaterial map={wallMap} color={plasterWarm} roughness={0.88} />
      </mesh>
      {/* right */}
      <mesh position={[5, 1.6, 0]} receiveShadow>
        <boxGeometry args={[0.18, 3.2, 6.5]} />
        <meshStandardMaterial map={wallMap} color={plasterWarm} roughness={0.88} />
      </mesh>
      {/* Open front — diorama presentation (jesse-style), no solid wall blocking orbit */}

      {/* —— CEILING —— */}
      <mesh position={[0, 3.15, 0]} receiveShadow>
        <boxGeometry args={[10.2, 0.12, 6.8]} />
        <meshStandardMaterial color="#1c1612" roughness={0.95} />
      </mesh>
      {/* Ceiling beams */}
      {[-2, 0, 2].map((x) => (
        <mesh key={`beam-${x}`} position={[x, 3.05, 0]} castShadow>
          <boxGeometry args={[0.12, 0.1, 6.2]} />
          <meshStandardMaterial color={woodDark} roughness={0.7} />
        </mesh>
      ))}

      {/* —— NIGHT WINDOW (back wall left) —— */}
      <group position={[-2.6, 1.75, -3.08]}>
        <mesh>
          <boxGeometry args={[2.4, 1.6, 0.08]} />
          <meshStandardMaterial color="#1a1410" roughness={0.6} />
        </mesh>
        {/* Glass plane — cool night emissive */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[2.1, 1.35]} />
          <meshPhysicalMaterial
            color="#1a2848"
            emissive="#3a6ab0"
            emissiveIntensity={0.55}
            roughness={0.05}
            metalness={0.1}
            transmission={0.35}
            thickness={0.1}
            transparent
            opacity={0.92}
          />
        </mesh>
        {/* Window mullions */}
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[0.04, 1.35, 0.02]} />
          <meshStandardMaterial color="#2a2018" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[2.1, 0.04, 0.02]} />
          <meshStandardMaterial color="#2a2018" roughness={0.5} />
        </mesh>
        {/* Frame */}
        <mesh position={[0, 0.72, 0.04]}>
          <boxGeometry args={[2.25, 0.08, 0.1]} />
          <meshStandardMaterial color={woodMid} roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.72, 0.04]}>
          <boxGeometry args={[2.25, 0.08, 0.1]} />
          <meshStandardMaterial color={woodMid} roughness={0.55} />
        </mesh>
        <pointLight color="#6a9ad4" intensity={0.8} distance={5} position={[0, 0, 0.4]} />
      </group>

      {/* —— L-SHAPED COUNTER —— */}
      {/* Long run along back-right */}
      <group position={[1.4, 0, -1.6]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.9, 0.75]} />
          <meshStandardMaterial color={woodMid} roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.35, 0.06, 0.88]} />
          <meshPhysicalMaterial
            color={counterTop}
            roughness={0.28}
            clearcoat={0.55}
            clearcoatRoughness={0.25}
            metalness={0.05}
          />
        </mesh>
        {/* Face panels */}
        <mesh position={[0, 0.35, 0.38]} receiveShadow>
          <boxGeometry args={[4.1, 0.65, 0.04]} />
          <meshStandardMaterial color={woodDark} roughness={0.7} />
        </mesh>
        {/* Metal edge strip */}
        <mesh position={[0, 0.88, 0.42]}>
          <boxGeometry args={[4.35, 0.02, 0.03]} />
          <meshStandardMaterial color={metal} roughness={0.35} metalness={0.6} />
        </mesh>
      </group>
      {/* Short L leg toward camera-right */}
      <group position={[3.2, 0, 0.35]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.75, 0.9, 2.4]} />
          <meshStandardMaterial color={woodMid} roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.88, 0.06, 2.55]} />
          <meshPhysicalMaterial
            color={counterTop}
            roughness={0.28}
            clearcoat={0.55}
            clearcoatRoughness={0.25}
          />
        </mesh>
      </group>

      {/* Stools at counter */}
      <Stool position={[-0.2, 0, -0.85]} />
      <Stool position={[0.9, 0, -0.85]} />
      <Stool position={[2.0, 0, -0.85]} />
      <Stool position={[2.55, 0, 0.4]} />

      {/* —— BOOTH (left side) —— */}
      <group position={[-3.2, 0, 0.3]}>
        {/* Seat base */}
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.55, 1.1]} />
          <meshStandardMaterial color="#3a2820" roughness={0.7} />
        </mesh>
        {/* Cushion */}
        <mesh position={[0, 0.58, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.75, 0.1, 1.05]} />
          <meshPhysicalMaterial
            color="#5c2e28"
            roughness={0.85}
            sheen={0.4}
            sheenColor="#8a4038"
          />
        </mesh>
        {/* Backrest against left wall */}
        <mesh position={[-0.75, 0.95, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.18, 0.9, 1.1]} />
          <meshPhysicalMaterial
            color="#4a2622"
            roughness={0.8}
            sheen={0.3}
            sheenColor="#7a3830"
          />
        </mesh>
        {/* Booth table */}
        <mesh position={[0.55, 0.72, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.05, 0.95]} />
          <meshPhysicalMaterial
            color={woodLight}
            roughness={0.4}
            clearcoat={0.3}
            clearcoatRoughness={0.4}
          />
        </mesh>
        <mesh position={[0.55, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.7, 12]} />
          <meshStandardMaterial color="#2a1c14" roughness={0.6} metalness={0.2} />
        </mesh>
      </group>

      {/* —— NEON SIGN —— */}
      <group position={[1.6, 2.45, -3.05]}>
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[2.6, 0.55, 0.06]} />
          <meshStandardMaterial color="#120e0c" roughness={0.7} />
        </mesh>
        <Text
          position={[0, 0.02, 0.04]}
          fontSize={0.18}
          color="#ff6b4a"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#ff2200"
          maxWidth={2.4}
        >
          Kevin&apos;s Ramen &amp; Boba
        </Text>
        <pointLight color="#ff6644" intensity={1.4} distance={6} position={[0, 0, 0.5]} />
        <pointLight color="#ffaa66" intensity={0.4} distance={4} position={[0.8, -0.2, 0.3]} />
      </group>

      {/* Paper lanterns */}
      <PaperLantern position={[-1.2, 2.55, -1.2]} hue="#ff8a4a" scale={1.05} />
      <PaperLantern position={[0.6, 2.6, -0.4]} hue="#ffb060" scale={0.9} />
      <PaperLantern position={[2.4, 2.5, -1.5]} hue="#ff7060" scale={1} />
      <PaperLantern position={[-3.0, 2.45, 0.8]} hue="#ff9a70" scale={0.85} />

      {/* Chalkboard menu on back wall right */}
      <ChalkboardMenu position={[3.5, 1.85, -3.05]} />

      {/* Decorative shelf / bottles on counter back */}
      <group position={[2.8, 1.0, -1.85]}>
        {[0, 0.18, 0.36].map((x, i) => (
          <mesh key={i} position={[x, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.045, 0.36, 12]} />
            <meshPhysicalMaterial
              color={i === 1 ? '#3a1820' : i === 2 ? '#1a2830' : '#2a2010'}
              roughness={0.2}
              transmission={0.4}
              thickness={0.15}
              transparent
              opacity={0.85}
            />
          </mesh>
        ))}
      </group>

      {/* Warm key / shop lighting */}
      <ambientLight intensity={0.12} />
      <hemisphereLight args={['#ffd8a8', '#1a1210', 0.35]} />
      <directionalLight
        castShadow
        position={[-2.5, 3.5, 1.5]}
        intensity={0.55}
        color="#ffc898"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={16}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0002}
      />
      <pointLight position={[1.2, 2.2, -1.2]} intensity={0.9} color="#ffb070" distance={7} decay={2} />
      <pointLight position={[-2.5, 1.8, 0.5]} intensity={0.45} color="#88aadd" distance={5} decay={2} />
      <spotLight
        position={[0, 3, 0.5]}
        angle={0.55}
        penumbra={0.6}
        intensity={0.7}
        color="#ffe0c0"
        castShadow
      />

      {/* Steam over counter food zone */}
      <SteamField position={[-0.5, 1.05, -1.35]} count={14} spread={0.2} />
      <SteamField position={[0.8, 1.05, -1.4]} count={10} spread={0.15} />

      {/* —— NEON SIGNPOST (jesse-style nav density) —— */}
      <group position={[-3.4, 0, 1.4]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 2.2, 10]} />
          <meshStandardMaterial color="#1a1a22" metalness={0.4} roughness={0.45} />
        </mesh>
        {[
          { y: 1.85, label: 'projects', color: '#ff2d6a', rot: 0.15 },
          { y: 1.55, label: 'articles', color: '#2dffb0', rot: -0.25 },
          { y: 1.25, label: 'about', color: '#2db0ff', rot: 0.35 },
          { y: 0.95, label: 'credits', color: '#ffb02d', rot: -0.1 },
        ].map((s) => (
          <group key={s.label} position={[0.35, s.y, 0]} rotation={[0, s.rot, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.7, 0.16, 0.04]} />
              <meshStandardMaterial
                color={s.color}
                emissive={s.color}
                emissiveIntensity={0.55}
                roughness={0.4}
              />
            </mesh>
            <Text
              position={[0, 0, 0.03]}
              fontSize={0.07}
              color="#0a0610"
              anchorX="center"
              anchorY="middle"
              fontWeight={700}
            >
              {s.label}
            </Text>
          </group>
        ))}
        <mesh position={[0, 2.35, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#ffe8ff" emissive="#ff66cc" emissiveIntensity={1.2} />
        </mesh>
        <pointLight color="#ff66cc" intensity={0.8} distance={4} position={[0, 2.35, 0]} />
      </group>

      {/* Awning over counter */}
      <group position={[1.2, 2.05, -1.25]}>
        <mesh rotation={[-0.35, 0, 0]} castShadow>
          <boxGeometry args={[3.8, 0.06, 0.9]} />
          <meshStandardMaterial
            color="#c43a6e"
            emissive="#ff2d6a"
            emissiveIntensity={0.15}
            roughness={0.55}
          />
        </mesh>
        {[-1.6, -0.5, 0.5, 1.6].map((x) => (
          <mesh key={x} position={[x, -0.25, 0.35]}>
            <boxGeometry args={[0.08, 0.5, 0.08]} />
            <meshStandardMaterial color="#2a1c14" roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Extra neon bowl icon */}
      <group position={[-0.3, 2.55, -3.05]}>
        <mesh>
          <torusGeometry args={[0.18, 0.04, 12, 32]} />
          <meshStandardMaterial color="#66f0ff" emissive="#22d0ff" emissiveIntensity={1.4} />
        </mesh>
        <pointLight color="#44e0ff" intensity={0.6} distance={3} />
      </group>

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.65}
        scale={12}
        blur={2.4}
        far={4}
        color="#0a0604"
      />
    </group>
  )
}
