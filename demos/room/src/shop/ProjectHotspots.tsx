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

/** Call tick only on model root — never traverse every child every frame. */
function useModelTick(model: THREE.Object3D | null) {
  useFrame(({ clock }) => {
    if (!model) return
    const tick = model.userData?.tick as ((t: number) => void) | undefined
    if (typeof tick === 'function') tick(clock.elapsedTime)
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
  const active = selected || hovered

  useFrame(() => {
    const g = ref.current
    if (!g) return
    // Skip work when already at rest scale
    const target = selected ? 1.1 : hovered ? 1.05 : 1
    if (!active && Math.abs(g.scale.x - 1) < 0.001) {
      if (g.scale.x !== 1) g.scale.set(1, 1, 1)
      return
    }
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
      {active && (
        <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.3, 0.4, 40]} />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={selected ? 0.58 : 0.32}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[0.22, 0.27, 32]} />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={selected ? 0.28 : 0.14}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
      {showLabel && label && (
        <Html position={[0, labelY, 0]} center distanceFactor={7} style={{ pointerEvents: 'none' }}>
          <div className={`r3f-label${selected ? ' selected' : ''}`}>{label}</div>
        </Html>
      )}
    </group>
  )
}

/** Authored laptop — residual #7 portal prop (kill raw-box tell). */
function DetailedLaptop({ selected }: { selected: boolean }) {
  const screenGlow = selected ? 0.72 : 0.28
  const chassis = '#1a1c21'
  const chassisHi = '#252830'
  const keycap = '#2c3038'

  return (
    <group>
      {/* Rubber feet */}
      {(
        [
          [-0.16, 0.006, 0.1],
          [0.16, 0.006, 0.1],
          [-0.16, 0.006, -0.1],
          [0.16, 0.006, -0.1],
        ] as const
      ).map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <cylinderGeometry args={[0.012, 0.014, 0.01, 8]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.9} />
        </mesh>
      ))}

      {/* Base chassis */}
      <mesh position={[0, 0.022, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.018, 0.3]} />
        <meshStandardMaterial color={chassis} roughness={0.32} metalness={0.62} />
      </mesh>
      {/* Edge bevel strip */}
      <mesh position={[0, 0.032, 0]} castShadow>
        <boxGeometry args={[0.438, 0.004, 0.298]} />
        <meshStandardMaterial color={chassisHi} roughness={0.28} metalness={0.7} />
      </mesh>

      {/* Keyboard deck recess */}
      <mesh position={[0, 0.036, 0.035]} castShadow>
        <boxGeometry args={[0.4, 0.006, 0.18]} />
        <meshStandardMaterial color="#0e1014" roughness={0.55} metalness={0.25} />
      </mesh>

      {/* Keycap rows (3× sparse — readable silhouette, low cost) */}
      {([-0.055, 0, 0.055] as const).map((z, row) =>
        ([-0.15, -0.075, 0, 0.075, 0.15] as const).map((x, col) => (
          <mesh key={`k${row}${col}`} position={[x, 0.042, z + 0.035]} castShadow>
            <boxGeometry args={[0.062, 0.008, 0.042]} />
            <meshStandardMaterial
              color={keycap}
              roughness={0.48}
              metalness={0.15}
              emissive={selected && row === 1 && col === 2 ? '#4a9eff' : '#000000'}
              emissiveIntensity={selected && row === 1 && col === 2 ? 0.35 : 0}
            />
          </mesh>
        )),
      )}

      {/* Space bar */}
      <mesh position={[0, 0.042, 0.095]} castShadow>
        <boxGeometry args={[0.2, 0.007, 0.028]} />
        <meshStandardMaterial color="#343842" roughness={0.5} metalness={0.12} />
      </mesh>

      {/* Trackpad + glass inset */}
      <mesh position={[0, 0.038, -0.085]} castShadow>
        <boxGeometry args={[0.14, 0.004, 0.08]} />
        <meshStandardMaterial color="#1e222a" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.041, -0.085]}>
        <boxGeometry args={[0.12, 0.002, 0.065]} />
        <meshStandardMaterial color="#2a303c" roughness={0.22} metalness={0.55} />
      </mesh>

      {/* Side ports (USB / headphone) */}
      <mesh position={[0.221, 0.024, 0.04]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.012, 0.006, 0.028]} />
        <meshStandardMaterial color="#0a0c10" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0.221, 0.024, -0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.006, 0.006, 0.008, 8]} />
        <meshStandardMaterial color="#111318" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Hinge barrel */}
      <mesh position={[0, 0.04, -0.14]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.42, 12]} />
        <meshStandardMaterial color="#121418" roughness={0.25} metalness={0.75} />
      </mesh>

      {/* Lid + screen */}
      <group position={[0, 0.048, -0.14]} rotation={[-0.42, 0, 0]}>
        <mesh position={[0, 0.145, -0.004]} castShadow>
          <boxGeometry args={[0.44, 0.29, 0.01]} />
          <meshStandardMaterial color={chassis} roughness={0.28} metalness={0.58} />
        </mesh>
        {/* Lid back logo glow */}
        <mesh position={[0, 0.145, -0.01]}>
          <circleGeometry args={[0.028, 16]} />
          <meshStandardMaterial
            color="#0a0c10"
            emissive={selected ? '#6ec6ff' : '#2a3a50'}
            emissiveIntensity={selected ? 0.55 : 0.12}
            roughness={0.3}
            metalness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Bezel */}
        <mesh position={[0, 0.145, 0.002]} castShadow>
          <boxGeometry args={[0.41, 0.26, 0.004]} />
          <meshStandardMaterial color="#0c0e12" roughness={0.45} metalness={0.35} />
        </mesh>
        {/* Screen panel */}
        <mesh position={[0, 0.145, 0.005]}>
          <planeGeometry args={[0.385, 0.235]} />
          <meshStandardMaterial
            color="#061018"
            emissive="#3d8fd9"
            emissiveIntensity={screenGlow}
            roughness={0.12}
            metalness={0.15}
          />
        </mesh>
        {/* UI chrome lines on screen (code/dashboard tell) */}
        {(
          [
            [0, 0.22, 0.12, 0.018],
            [-0.08, 0.14, 0.14, 0.012],
            [0.1, 0.14, 0.1, 0.012],
            [-0.05, 0.06, 0.22, 0.01],
            [0.02, -0.02, 0.18, 0.01],
            [-0.1, -0.1, 0.12, 0.01],
          ] as const
        ).map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, 0.145 + y * 0.5, 0.0065]}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial
              color={i === 0 ? '#7dd3fc' : i < 3 ? '#38bdf8' : '#94a3b8'}
              transparent
              opacity={selected ? 0.55 : 0.28}
              depthWrite={false}
            />
          </mesh>
        ))}
        {/* Webcam pill */}
        <mesh position={[0, 0.268, 0.004]}>
          <capsuleGeometry args={[0.004, 0.018, 4, 8]} />
          <meshStandardMaterial color="#151820" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.268, 0.007]}>
          <circleGeometry args={[0.003, 8]} />
          <meshStandardMaterial
            color="#1a2030"
            emissive="#88aaff"
            emissiveIntensity={selected ? 0.4 : 0.1}
          />
        </mesh>
      </group>
    </group>
  )
}

/** Authored studio cans — residual #7 portal prop. */
function Headphones({ selected }: { selected: boolean }) {
  const accent = selected ? 0xb794f6 : 0x3a2a48
  const shell = '#121218'
  const pad = '#1a141c'
  const metal = '#2a2c34'

  return (
    <group rotation={[0, 0.45, 0]}>
      {/* Headband outer metal arc */}
      <mesh castShadow rotation={[0, 0, 0]}>
        <torusGeometry args={[0.125, 0.01, 8, 28, Math.PI]} />
        <meshStandardMaterial
          color={metal}
          roughness={0.28}
          metalness={0.78}
          emissive={selected ? accent : 0x000000}
          emissiveIntensity={selected ? 0.18 : 0}
        />
      </mesh>
      {/* Soft pad under headband */}
      <mesh position={[0, 0.01, 0]}>
        <torusGeometry args={[0.118, 0.016, 8, 24, Math.PI]} />
        <meshStandardMaterial color={pad} roughness={0.72} metalness={0.05} />
      </mesh>

      {/* Slider yokes L/R */}
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 0.12, -0.02, 0]} rotation={[0, 0, side * 0.12]}>
          <mesh castShadow position={[0, 0.04, 0]}>
            <boxGeometry args={[0.018, 0.07, 0.012]} />
            <meshStandardMaterial color={metal} roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Ear cup shell */}
          <mesh position={[0, -0.015, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.06, 0.042, 20]} />
            <meshStandardMaterial color={shell} roughness={0.38} metalness={0.45} />
          </mesh>
          {/* Cushion ring */}
          <mesh position={[0, -0.015, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.042, 0.012, 8, 20]} />
            <meshStandardMaterial color={pad} roughness={0.78} metalness={0.04} />
          </mesh>
          {/* Driver face + accent glow */}
          <mesh position={[0, -0.015, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.036, 16]} />
            <meshStandardMaterial
              color="#141018"
              emissive={accent}
              emissiveIntensity={selected ? 0.55 : 0.1}
              roughness={0.35}
              metalness={0.2}
            />
          </mesh>
          <mesh position={[0, -0.015, 0.021]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.022, 0.03, 16]} />
            <meshBasicMaterial
              color={selected ? '#c4b0ff' : '#5a4a70'}
              transparent
              opacity={selected ? 0.65 : 0.25}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      {/* Thin cable drape */}
      <mesh position={[0.1, -0.08, 0.02]} rotation={[0.4, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.004, 0.004, 0.12, 6]} />
        <meshStandardMaterial color="#0e0e12" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0.12, -0.14, 0.04]} rotation={[0.9, 0.2, 0.1]}>
        <cylinderGeometry args={[0.004, 0.004, 0.08, 6]} />
        <meshStandardMaterial color="#0e0e12" roughness={0.6} metalness={0.2} />
      </mesh>
    </group>
  )
}

export function ProjectHotspots({ projects, selectedId, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const ramen = useMemo(() => createRamenBowlModel({ castShadow: true }), [])
  const boba = useMemo(() => createBobaCupPairModel({ castShadow: true }), [])

  useModelTick(ramen)
  useModelTick(boba)

  const byId = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])

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
      <group position={[-0.85, 1.02, -0.45]} scale={0.9}>
        <HotspotRoot
          selected={selectedId === 'evolve'}
          hovered={hovered === 'evolve'}
          onSelect={() => evolve && onSelect('evolve')}
          onHover={(v) => setHovered(v ? 'evolve' : null)}
          label={evolve?.menuName}
          labelY={0.72}
          glowColor={evolve?.accent ?? '#e8a54b'}
        >
          <primitive object={ramen} />
        </HotspotRoot>
      </group>

      <group position={[0.75, 1.02, -0.5]} scale={1.0}>
        <HotspotRoot
          selected={bobaSelected}
          hovered={hovered === 'boba'}
          onSelect={() => {
            if (selectedId === 'ace' && monument) onSelect('monument')
            else if (ace) onSelect('ace')
          }}
          onHover={(v) => setHovered(v ? 'boba' : null)}
          label={selectedId === 'monument' ? monument?.menuName : ace?.menuName}
          labelY={0.9}
          glowColor={
            selectedId === 'monument' ? monument?.accent ?? '#f0a0c0' : ace?.accent ?? '#c47a3a'
          }
        >
          <primitive object={boba} />
        </HotspotRoot>
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

      <group position={[-1.5, 0.76, 1.0]} rotation={[0, 0.4, 0]} scale={1.15}>
        <HotspotRoot
          selected={laptopSelected}
          hovered={hovered === 'laptop'}
          onSelect={() => {
            if (selectedId === 'files' && fleet) onSelect('fleet')
            else if (files) onSelect('files')
          }}
          onHover={(v) => setHovered(v ? 'laptop' : null)}
          label={selectedId === 'fleet' ? fleet?.menuName : files?.menuName}
          labelY={0.45}
          glowColor={
            selectedId === 'fleet' ? fleet?.accent ?? '#7ddea2' : files?.accent ?? '#6ec6ff'
          }
        >
          <DetailedLaptop selected={laptopSelected} />
        </HotspotRoot>
      </group>

      <group position={[1.65, 1.05, -0.35]} scale={1.45}>
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
