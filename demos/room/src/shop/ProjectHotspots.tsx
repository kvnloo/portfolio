import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { createRamenBowlModel } from '../img2threejs/createRamenBowlModel'
import { createBobaCupPairModel } from '../img2threejs/createBobaCupPairModel'
import type { Project } from '../types'

type Props = {
  projects: Project[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function useModelTick(root: THREE.Object3D | null) {
  useFrame(({ clock }) => {
    if (!root) return
    const t = clock.elapsedTime
    root.traverse((obj) => {
      const tick = obj.userData?.tick as ((time: number) => void) | undefined
      if (typeof tick === 'function') tick(t)
    })
  })
}

function HotspotRoot({
  selected,
  hovered,
  onSelect,
  onHover,
  children,
  label,
  labelY = 0.85,
  glowColor = '#ffb56b',
}: {
  selected: boolean
  hovered: boolean
  onSelect: () => void
  onHover: (v: boolean) => void
  children: ReactNode
  label?: string
  labelY?: number
  glowColor?: string
}) {
  const ref = useRef<THREE.Group>(null)
  const showLabel = selected || hovered

  useFrame(() => {
    const g = ref.current
    if (!g) return
    const target = selected ? 1.1 : hovered ? 1.05 : 1
    g.scale.lerp(new THREE.Vector3(target, target, target), 0.14)
  })

  return (
    <group
      ref={ref}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        onHover(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {children}
      {(selected || hovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.38, 48]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={selected ? 0.55 : 0.3}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {showLabel && label && (
        <Html position={[0, labelY, 0]} center distanceFactor={7} style={{ pointerEvents: 'none' }}>
          <div className={`r3f-label${selected ? ' selected' : ''}`}>{label}</div>
        </Html>
      )}
    </group>
  )
}

function DetailedLaptop({ selected }: { selected: boolean }) {
  const screenGlow = selected ? 0.55 : 0.22
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.02, 0.28]} />
        <meshPhysicalMaterial color="#1c1e22" roughness={0.35} metalness={0.55} clearcoat={0.3} />
      </mesh>
      {/* Keyboard deck */}
      <mesh position={[0, 0.045, 0.02]} castShadow>
        <boxGeometry args={[0.38, 0.008, 0.2]} />
        <meshStandardMaterial color="#12141a" roughness={0.5} />
      </mesh>
      {/* Keys suggestion */}
      <mesh position={[0, 0.052, 0.03]}>
        <boxGeometry args={[0.32, 0.004, 0.14]} />
        <meshStandardMaterial color="#2a2e38" roughness={0.6} />
      </mesh>
      {/* Trackpad */}
      <mesh position={[0, 0.052, -0.08]}>
        <boxGeometry args={[0.1, 0.003, 0.06]} />
        <meshStandardMaterial color="#3a404c" roughness={0.4} />
      </mesh>
      {/* Screen hinge + lid */}
      <group position={[0, 0.05, -0.12]} rotation={[-0.35, 0, 0]}>
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[0.42, 0.28, 0.012]} />
          <meshPhysicalMaterial color="#1a1c20" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.14, 0.008]}>
          <planeGeometry args={[0.38, 0.24]} />
          <meshStandardMaterial
            color="#0a1628"
            emissive="#4a9eff"
            emissiveIntensity={screenGlow}
            roughness={0.2}
          />
        </mesh>
        {/* Fake terminal lines */}
        {[0.06, 0.02, -0.02, -0.06].map((y, i) => (
          <mesh key={i} position={[-0.08, 0.14 + y, 0.01]}>
            <planeGeometry args={[0.18 - i * 0.02, 0.012]} />
            <meshBasicMaterial color={i === 0 ? '#7ddea2' : '#6ec6ff'} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Headphones({ selected }: { selected: boolean }) {
  const accent = selected ? 0xb794f6 : 0x2a2430
  return (
    <group rotation={[0, 0.4, 0]}>
      {/* Headband */}
      <mesh castShadow>
        <torusGeometry args={[0.12, 0.015, 10, 28, Math.PI]} />
        <meshPhysicalMaterial
          color="#1a1a1e"
          roughness={0.4}
          metalness={0.3}
          emissive={selected ? accent : 0x000000}
          emissiveIntensity={selected ? 0.25 : 0}
        />
      </mesh>
      {/* Left cup */}
      <mesh position={[-0.12, -0.02, 0]} rotation={[0, 0, 0.15]} castShadow>
        <cylinderGeometry args={[0.05, 0.055, 0.04, 20]} />
        <meshPhysicalMaterial color="#141418" roughness={0.45} clearcoat={0.3} />
      </mesh>
      <mesh position={[-0.12, -0.02, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial
          color="#1a1020"
          emissive={accent}
          emissiveIntensity={selected ? 0.4 : 0.08}
        />
      </mesh>
      {/* Right cup */}
      <mesh position={[0.12, -0.02, 0]} rotation={[0, 0, -0.15]} castShadow>
        <cylinderGeometry args={[0.05, 0.055, 0.04, 20]} />
        <meshPhysicalMaterial color="#141418" roughness={0.45} clearcoat={0.3} />
      </mesh>
      <mesh position={[0.12, -0.02, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial
          color="#1a1020"
          emissive={accent}
          emissiveIntensity={selected ? 0.4 : 0.08}
        />
      </mesh>
    </group>
  )
}

/**
 * Clickable project props placed in the shop.
 * evolve → ramen · ace+monument → boba · files+fleet → laptop · audio → headphones
 */
export function ProjectHotspots({ projects, selectedId, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const ramen = useMemo(() => createRamenBowlModel({ castShadow: true }), [])
  const boba = useMemo(() => createBobaCupPairModel({ castShadow: true }), [])
  const ramenRef = useRef<THREE.Group>(null)
  const bobaRef = useRef<THREE.Group>(null)

  useModelTick(ramen)
  useModelTick(boba)

  const byId = useMemo(() => {
    const m = new Map(projects.map((p) => [p.id, p]))
    return m
  }, [projects])

  const evolve = byId.get('evolve')
  const ace = byId.get('ace')
  const monument = byId.get('monument')
  const files = byId.get('files')
  const fleet = byId.get('fleet')
  const audio = byId.get('audio')

  const bobaSelected = selectedId === 'ace' || selectedId === 'monument'
  const laptopSelected = selectedId === 'files' || selectedId === 'fleet'

  return (
    <group name="ProjectHotspots">
      {/* Ramen on counter — evolve */}
      <group position={[-0.5, 0.95, -1.35]} scale={0.85}>
        <HotspotRoot
          selected={selectedId === 'evolve'}
          hovered={hovered === 'evolve'}
          onSelect={() => evolve && onSelect('evolve')}
          onHover={(v) => setHovered(v ? 'evolve' : null)}
          label={evolve?.menuName}
          labelY={0.72}
          glowColor={evolve?.accent ?? '#e8a54b'}
        >
          <group ref={ramenRef}>
            <primitive object={ramen} />
          </group>
        </HotspotRoot>
      </group>

      {/* Boba pair on counter — ace + monument */}
      <group position={[0.85, 0.95, -1.4]} scale={0.95}>
        <HotspotRoot
          selected={bobaSelected}
          hovered={hovered === 'boba'}
          onSelect={() => {
            if (selectedId === 'ace' && monument) onSelect('monument')
            else if (ace) onSelect('ace')
          }}
          onHover={(v) => setHovered(v ? 'boba' : null)}
          label={
            selectedId === 'monument'
              ? monument?.menuName
              : ace?.menuName
          }
          labelY={0.9}
          glowColor={
            selectedId === 'monument'
              ? monument?.accent ?? '#f0a0c0'
              : ace?.accent ?? '#c47a3a'
          }
        >
          <group ref={bobaRef}>
            <primitive object={boba} />
          </group>
        </HotspotRoot>
        {/* Secondary label for monument when hovered/selected */}
        {(hovered === 'boba' || bobaSelected) && monument && selectedId !== 'monument' && (
          <Html position={[0.22, 0.95, 0]} center distanceFactor={7} style={{ pointerEvents: 'auto' }}>
            <div
              className="r3f-label"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation()
                onSelect('monument')
              }}
            >
              {monument.menuName}
            </div>
          </Html>
        )}
      </group>

      {/* Laptop on booth table — files + fleet */}
      <group position={[-2.65, 0.75, 0.3]} rotation={[0, 0.55, 0]} scale={1.15}>
        <HotspotRoot
          selected={laptopSelected}
          hovered={hovered === 'laptop'}
          onSelect={() => {
            if (selectedId === 'files' && fleet) onSelect('fleet')
            else if (files) onSelect('files')
          }}
          onHover={(v) => setHovered(v ? 'laptop' : null)}
          label={
            selectedId === 'fleet' ? fleet?.menuName : files?.menuName
          }
          labelY={0.45}
          glowColor={
            selectedId === 'fleet'
              ? fleet?.accent ?? '#7ddea2'
              : files?.accent ?? '#6ec6ff'
          }
        >
          <DetailedLaptop selected={laptopSelected} />
        </HotspotRoot>
        {(hovered === 'laptop' || laptopSelected) && fleet && selectedId !== 'fleet' && (
          <Html position={[0.2, 0.4, 0]} center distanceFactor={7} style={{ pointerEvents: 'auto' }}>
            <div
              className="r3f-label"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation()
                onSelect('fleet')
              }}
            >
              {fleet.menuName}
            </div>
          </Html>
        )}
      </group>

      {/* Headphones near counter end — audio */}
      <group position={[2.55, 0.98, -1.15]} scale={1.4}>
        <HotspotRoot
          selected={selectedId === 'audio'}
          hovered={hovered === 'audio'}
          onSelect={() => audio && onSelect('audio')}
          onHover={(v) => setHovered(v ? 'audio' : null)}
          label={audio?.menuName}
          labelY={0.28}
          glowColor={audio?.accent ?? '#b794f6'}
        >
          <Headphones selected={selectedId === 'audio'} />
        </HotspotRoot>
      </group>
    </group>
  )
}
