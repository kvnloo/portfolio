import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Text, RoundedBox, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import type { Project } from './types'

type Props = {
  projects: Project[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function Hotspot({
  position,
  project,
  selected,
  onSelect,
  children,
}: {
  position: [number, number, number]
  project: Project
  selected: boolean
  onSelect: (id: string) => void
  children: ReactNode
}) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (!group.current) return
    const s = selected ? 1.08 : 1
    group.current.scale.lerp(new THREE.Vector3(s, s, s), dt * 6)
  })

  return (
    <group
      ref={group}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(project.id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      {children}
      <Text
        position={[0, 0.85, 0]}
        fontSize={0.12}
        color={selected ? project.accent : '#f5e6d3'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#1a1008"
      >
        {project.menuName}
      </Text>
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.42, 32]} />
          <meshBasicMaterial color={project.accent} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  )
}

function Steam({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.children.forEach((child, i) => {
      const t = clock.elapsedTime * 0.6 + i * 0.7
      child.position.y = 0.2 + (t % 1.4)
      const m = child as THREE.Mesh
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = 0.35 * (1 - (t % 1.4) / 1.4)
    })
  })
  return (
    <group ref={ref} position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[(i - 1) * 0.08, 0.2, 0]}>
          <sphereGeometry args={[0.06 + i * 0.01, 12, 12]} />
          <meshBasicMaterial color="#fff8ee" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function RamenBowl({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.28, 0.22, 0.16, 24]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.06, 24]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0.12, 0.2, 0.05]} rotation={[0.2, 0.4, 0.8]}>
        <boxGeometry args={[0.02, 0.28, 0.02]} />
        <meshStandardMaterial color="#2a1a10" />
      </mesh>
      <mesh position={[0.16, 0.2, 0.02]} rotation={[0.15, 0.5, 0.85]}>
        <boxGeometry args={[0.02, 0.28, 0.02]} />
        <meshStandardMaterial color="#2a1a10" />
      </mesh>
    </group>
  )
}

function BobaCup({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.36, 20]} />
        <meshStandardMaterial color={color} transparent opacity={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.04, 20]} />
        <meshStandardMaterial color="#f7f2ea" />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
        <meshStandardMaterial color="#e8dcc8" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[(i % 2) * 0.05 - 0.025, 0.05 + i * 0.04, (i > 1 ? 0.03 : -0.02)]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#1a0f0a" roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

export function ShopScene({ projects, selectedId, onSelect }: Props) {
  const byId = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects])
  const evolve = byId.evolve
  const ace = byId.ace
  const files = byId.files
  const fleet = byId.fleet
  const audio = byId.audio
  const monument = byId.monument

  return (
    <group>
      {/* Room shell */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#2a1f18" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2, -3.2]} receiveShadow>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial color="#3d2918" roughness={0.85} />
      </mesh>
      <mesh position={[-5.5, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#322218" />
      </mesh>
      <mesh position={[5.5, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#322218" />
      </mesh>

      {/* Window night glow */}
      <mesh position={[0, 2.2, -3.15]}>
        <planeGeometry args={[2.4, 1.6]} />
        <meshStandardMaterial color="#1a2744" emissive="#3d5a9e" emissiveIntensity={0.35} />
      </mesh>

      {/* Neon sign */}
      <Text
        position={[0, 3.55, -3.1]}
        fontSize={0.28}
        color="#ffb86b"
        anchorX="center"
        outlineWidth={0.012}
        outlineColor="#4a2008"
      >
        Kevin&apos;s Ramen &amp; Boba
      </Text>
      <Text position={[0, 3.2, -3.1]} fontSize={0.12} color="#9fd3ff" anchorX="center">
        night market · open late
      </Text>

      {/* Ramen counter (left) */}
      <RoundedBox position={[-1.6, 0.45, -0.6]} args={[2.8, 0.9, 1.2]} radius={0.06} receiveShadow castShadow>
        <meshStandardMaterial color="#4a3224" roughness={0.55} />
      </RoundedBox>
      <RoundedBox position={[-1.6, 0.95, -0.6]} args={[2.9, 0.08, 1.3]} radius={0.02}>
        <meshStandardMaterial color="#6b4a32" roughness={0.4} />
      </RoundedBox>
      <mesh position={[-2.4, 1.15, -0.9]}>
        <cylinderGeometry args={[0.35, 0.4, 0.35, 20]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.3} />
      </mesh>
      <Steam position={[-2.4, 1.35, -0.9]} />

      {evolve && (
        <Hotspot position={[-1.2, 1.0, -0.35]} project={evolve} selected={selectedId === evolve.id} onSelect={onSelect}>
          <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.15}>
            <RamenBowl color={evolve.accent} />
          </Float>
        </Hotspot>
      )}

      {/* Boba bar (right) */}
      <RoundedBox position={[1.8, 0.45, -0.5]} args={[2.4, 0.9, 1.1]} radius={0.06} castShadow receiveShadow>
        <meshStandardMaterial color="#3a2a38" roughness={0.5} />
      </RoundedBox>
      <RoundedBox position={[1.8, 0.95, -0.5]} args={[2.5, 0.08, 1.2]} radius={0.02}>
        <meshStandardMaterial color="#5c3d52" />
      </RoundedBox>

      {ace && (
        <Hotspot position={[1.35, 1.0, -0.3]} project={ace} selected={selectedId === ace.id} onSelect={onSelect}>
          <Float speed={1.4} floatIntensity={0.2}>
            <BobaCup color={ace.accent} />
          </Float>
        </Hotspot>
      )}
      {monument && (
        <Hotspot position={[2.25, 1.0, -0.35]} project={monument} selected={selectedId === monument.id} onSelect={onSelect}>
          <Float speed={1.1} floatIntensity={0.18}>
            <BobaCup color={monument.accent} />
          </Float>
        </Hotspot>
      )}

      {/* Menu board */}
      <group position={[0, 1.7, -2.6]}>
        <RoundedBox args={[1.6, 1.1, 0.08]} radius={0.03}>
          <meshStandardMaterial color="#1c1410" />
        </RoundedBox>
        <Text position={[0, 0.35, 0.05]} fontSize={0.1} color="#ffd9a0" anchorX="center">
          MENU
        </Text>
        <Text position={[0, 0.1, 0.05]} fontSize={0.07} color="#e8d5b5" anchorX="center" maxWidth={1.3}>
          Click bowls · cups · gear
        </Text>
        <Text position={[0, -0.2, 0.05]} fontSize={0.065} color="#9fd3ff" anchorX="center">
          projects on every plate
        </Text>
      </group>

      {/* Booth + laptop */}
      <RoundedBox position={[-2.8, 0.25, 1.6]} args={[1.4, 0.5, 1.0]} radius={0.05}>
        <meshStandardMaterial color="#3d2a20" />
      </RoundedBox>
      {files && (
        <Hotspot position={[-2.8, 0.55, 1.5]} project={files} selected={selectedId === files.id} onSelect={onSelect}>
          <group>
            <mesh>
              <boxGeometry args={[0.45, 0.02, 0.3]} />
              <meshStandardMaterial color="#222" metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.14, -0.1]} rotation={[-0.35, 0, 0]}>
              <boxGeometry args={[0.42, 0.28, 0.015]} />
              <meshStandardMaterial color="#0a1628" emissive="#2a6fff" emissiveIntensity={0.45} />
            </mesh>
          </group>
        </Hotspot>
      )}
      {fleet && (
        <Hotspot position={[-2.2, 0.55, 1.85]} project={fleet} selected={selectedId === fleet.id} onSelect={onSelect}>
          <mesh>
            <boxGeometry args={[0.2, 0.04, 0.28]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </Hotspot>
      )}

      {/* Audio nook */}
      {audio && (
        <Hotspot position={[3.2, 0.55, 1.4]} project={audio} selected={selectedId === audio.id} onSelect={onSelect}>
          <group>
            <mesh rotation={[0.2, 0.4, 0]}>
              <torusGeometry args={[0.18, 0.03, 12, 24, Math.PI]} />
              <meshStandardMaterial color="#b794f6" metalness={0.4} />
            </mesh>
            <mesh position={[-0.16, 0, 0]}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshStandardMaterial color="#2a2030" />
            </mesh>
            <mesh position={[0.16, 0, 0]}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshStandardMaterial color="#2a2030" />
            </mesh>
          </group>
        </Hotspot>
      )}

      {/* Stools */}
      {[
        [-2.2, 0.35],
        [-1.0, 0.35],
        [1.3, 0.35],
        [2.3, 0.35],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.14, 0.16, 0.06, 16]} />
            <meshStandardMaterial color="#5a4030" />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.28, 8]} />
            <meshStandardMaterial color="#333" metalness={0.5} />
          </mesh>
        </group>
      ))}

      <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={12} blur={2.5} far={4} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 8, 2]} intensity={1.1} castShadow color="#ffd8a8" />
      <pointLight position={[-2.2, 2.2, -0.5]} intensity={12} distance={6} color="#ffb070" />
      <pointLight position={[2, 2, -0.3]} intensity={10} distance={5} color="#e8a0c8" />
      <pointLight position={[0, 2.2, -2.8]} intensity={6} distance={5} color="#6a9fff" />
    </group>
  )
}
