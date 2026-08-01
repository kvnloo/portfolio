/**
 * Japanese night city square surrounding Kevin's Ramen & Boba.
 * Procedural game-env kit: plaza, neighbor buildings, street furniture, dense greenery.
 *
 * Iteration surface for workflow system=`environment` (see VISUAL-BAR / LOOP-RESIDUALS).
 * Keep poly counts instanced where possible — showcase density without killing mid-tier GPU.
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const tmpObj = new THREE.Object3D()
const tmpColor = new THREE.Color()

/** Deterministic pseudo-random in [0,1) from integer seed */
function hash01(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function WindowGrid({
  width,
  height,
  cols,
  rows,
  color = '#ffd9a8',
  intensity = 0.55,
}: {
  width: number
  height: number
  cols: number
  rows: number
  color?: string
  intensity?: number
}) {
  const positions = useMemo(() => {
    const pts: [number, number, number][] = []
    const gx = width / (cols + 1)
    const gy = height / (rows + 1)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (hash01(r * 17 + c * 31) < 0.22) continue // some dark windows
        pts.push([(c + 1) * gx - width / 2, (r + 1) * gy - height / 2, 0.02])
      }
    }
    return pts
  }, [width, height, cols, rows])

  return (
    <group>
      {positions.map((p, i) => (
        <mesh key={i} position={p}>
          <planeGeometry args={[0.14, 0.2]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={intensity * (0.7 + hash01(i) * 0.6)}
            toneMapped={false}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  )
}

function BuildingBlock({
  position,
  size,
  color = '#1a1520',
  accent = '#2a2030',
  windows = true,
  roofAccent = true,
}: {
  position: [number, number, number]
  size: [number, number, number]
  color?: string
  accent?: string
  windows?: boolean
  roofAccent?: boolean
}) {
  const [w, h, d] = size
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.88} metalness={0.05} />
      </mesh>
      {/* Plinth */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[w + 0.12, 0.16, d + 0.12]} />
        <meshStandardMaterial color={accent} roughness={0.75} />
      </mesh>
      {roofAccent && (
        <mesh position={[0, h + 0.06, 0]}>
          <boxGeometry args={[w + 0.2, 0.12, d + 0.2]} />
          <meshStandardMaterial color="#0e0c12" roughness={0.7} metalness={0.15} />
        </mesh>
      )}
      {windows && (
        <>
          <group position={[0, h * 0.55, d / 2 + 0.01]}>
            <WindowGrid width={w * 0.85} height={h * 0.7} cols={Math.max(3, Math.floor(w * 2.2))} rows={Math.max(3, Math.floor(h * 1.4))} />
          </group>
          <group position={[0, h * 0.55, -d / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
            <WindowGrid width={w * 0.85} height={h * 0.7} cols={Math.max(3, Math.floor(w * 2.2))} rows={Math.max(3, Math.floor(h * 1.4))} color="#a8d4ff" intensity={0.35} />
          </group>
        </>
      )}
      {/* Ground-floor shopfront strip */}
      <mesh position={[0, 0.55, d / 2 + 0.03]}>
        <boxGeometry args={[w * 0.7, 0.9, 0.06]} />
        <meshStandardMaterial color="#121018" roughness={0.45} metalness={0.25} emissive="#1a2840" emissiveIntensity={0.15} />
      </mesh>
    </group>
  )
}

function StreetLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.04, 0.055, 3.0, 8]} />
        <meshStandardMaterial color="#2a2a32" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0, 3.05, 0]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial
          color="#ffe6b0"
          emissive="#ffcc77"
          emissiveIntensity={1.4}
          toneMapped={false}
          roughness={0.25}
        />
      </mesh>
      <pointLight position={[0, 2.95, 0]} color="#ffd9a0" intensity={1.1} distance={7} decay={2} />
    </group>
  )
}

function PlanterBox({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
        <boxGeometry args={[0.85, 0.36, 0.55]} />
        <meshStandardMaterial color="#3a2a22" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.78, 0.08, 0.48]} />
        <meshStandardMaterial color="#1a120e" roughness={1} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.72, 0.42]} />
        <meshStandardMaterial color="#1c1410" roughness={1} />
      </mesh>
    </group>
  )
}

/** Layered bush — stacked spheres/ellipsoids with leaf color variance */
function Shrub({
  position,
  scale = 1,
  hue = 0.32,
}: {
  position: [number, number, number]
  scale?: number
  hue?: number
}) {
  const lobes = useMemo(() => {
    const list: { p: [number, number, number]; s: [number, number, number]; c: string }[] = []
    for (let i = 0; i < 7; i++) {
      const a = hash01(i * 3 + hue * 10)
      const b = hash01(i * 7 + 2)
      const c = hash01(i * 11 + 5)
      list.push({
        p: [(a - 0.5) * 0.55, 0.25 + b * 0.35, (c - 0.5) * 0.45],
        s: [0.28 + a * 0.22, 0.22 + b * 0.28, 0.26 + c * 0.2],
        c: new THREE.Color().setHSL(hue + (a - 0.5) * 0.06, 0.45 + b * 0.2, 0.18 + c * 0.12).getStyle(),
      })
    }
    return list
  }, [hue])

  return (
    <group position={position} scale={scale}>
      {lobes.map((l, i) => (
        <mesh key={i} position={l.p} scale={l.s} castShadow>
          <sphereGeometry args={[1, 9, 9]} />
          <meshStandardMaterial color={l.c} roughness={0.88} metalness={0.02} flatShading />
        </mesh>
      ))}
    </group>
  )
}

/** Stylized night sakura / street tree */
function StreetTree({
  position,
  scale = 1,
  blossom = false,
}: {
  position: [number, number, number]
  scale?: number
  blossom?: boolean
}) {
  const canopyColor = blossom ? '#e8a0b8' : '#1e4a28'
  const canopyEmissive = blossom ? '#402030' : '#0a180c'
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.09, 0.14, 2.2, 8]} />
        <meshStandardMaterial color="#2a1c14" roughness={0.85} />
      </mesh>
      {/* Canopy clusters */}
      {[
        [0, 2.5, 0, 0.95],
        [0.45, 2.35, 0.2, 0.55],
        [-0.4, 2.4, -0.15, 0.5],
        [0.15, 2.85, -0.35, 0.48],
        [-0.2, 2.7, 0.4, 0.52],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} castShadow>
          <sphereGeometry args={[r as number, 12, 12]} />
          <meshStandardMaterial
            color={canopyColor}
            emissive={canopyEmissive}
            emissiveIntensity={blossom ? 0.12 : 0.04}
            roughness={0.9}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[1.2, 0.08, 0.42]} />
        <meshStandardMaterial color="#4a3020" roughness={0.75} />
      </mesh>
      <mesh castShadow position={[0, 0.62, -0.16]}>
        <boxGeometry args={[1.2, 0.35, 0.07]} />
        <meshStandardMaterial color="#3a2818" roughness={0.8} />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} castShadow position={[x, 0.22, 0]}>
          <boxGeometry args={[0.08, 0.44, 0.38]} />
          <meshStandardMaterial color="#2a2a32" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function Bollard({ position }: { position: [number, number, number] }) {
  return (
    <mesh castShadow position={[position[0], 0.35, position[2]]}>
      <cylinderGeometry args={[0.08, 0.1, 0.7, 8]} />
      <meshStandardMaterial color="#3a3a44" metalness={0.55} roughness={0.4} />
    </mesh>
  )
}

function VendingMachine({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.95, 0]}>
        <boxGeometry args={[0.75, 1.9, 0.55]} />
        <meshStandardMaterial color="#1a3048" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.15, 0.28]}>
        <planeGeometry args={[0.55, 1.1]} />
        <meshStandardMaterial
          color="#88c8ff"
          emissive="#4a90c0"
          emissiveIntensity={0.45}
          toneMapped={false}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 0.35, 0.28]}>
        <boxGeometry args={[0.5, 0.2, 0.08]} />
        <meshStandardMaterial color="#111820" metalness={0.5} roughness={0.35} />
      </mesh>
    </group>
  )
}

/** Instanced ground pebbles / plaza grit for micro-detail */
function PlazaScatter({ count = 180 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  useMemo(() => {
    /* layout computed in useFrame first mount via layout flag */
  }, [])
  useFrame(() => {
    const m = meshRef.current
    if (!m || m.userData.laid) return
    for (let i = 0; i < count; i++) {
      const a = hash01(i * 3.1)
      const b = hash01(i * 5.7)
      const x = (a - 0.5) * 28
      const z = (b - 0.5) * 28
      // keep clear of kiosk footprint roughly |x|<3 && z in [-2,3]
      if (Math.abs(x) < 3.2 && z > -2.5 && z < 3.5) {
        tmpObj.position.set(x * 1.4, -1, z)
      } else {
        tmpObj.position.set(x, 0.02 + hash01(i) * 0.03, z)
      }
      tmpObj.scale.setScalar(0.04 + hash01(i + 9) * 0.08)
      tmpObj.rotation.set(hash01(i + 1) * 2, hash01(i + 2) * 6, 0)
      tmpObj.updateMatrix()
      m.setMatrixAt(i, tmpObj.matrix)
      tmpColor.setHSL(0.08, 0.15, 0.12 + hash01(i + 4) * 0.1)
      m.setColorAt(i, tmpColor)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.userData.laid = true
  })
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow={false} receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial vertexColors roughness={0.95} />
    </instancedMesh>
  )
}

/**
 * Full city square shell — place behind/around the shop (shop stays near origin).
 * Plaza extends +Z (street), buildings on flanks and -Z rear alley.
 */
export function CitySquareEnv() {
  const buildings = useMemo(
    () =>
      [
        // Left row (street-facing neighbors)
        { position: [-7.5, 0, 2.5] as [number, number, number], size: [3.2, 5.5, 3.0] as [number, number, number], color: '#16121c' },
        { position: [-7.2, 0, 6.8] as [number, number, number], size: [2.8, 4.2, 2.6] as [number, number, number], color: '#1a1522' },
        { position: [-11.5, 0, 4.0] as [number, number, number], size: [3.5, 7.2, 3.2] as [number, number, number], color: '#12101a' },
        // Right row
        { position: [7.8, 0, 2.2] as [number, number, number], size: [3.0, 6.0, 2.8] as [number, number, number], color: '#18141f' },
        { position: [8.0, 0, 6.5] as [number, number, number], size: [2.6, 4.8, 2.5] as [number, number, number], color: '#141018' },
        { position: [11.8, 0, 3.5] as [number, number, number], size: [3.4, 8.0, 3.0] as [number, number, number], color: '#100e16' },
        // Rear alley massing
        { position: [-4.5, 0, -6.5] as [number, number, number], size: [4.0, 5.0, 2.4] as [number, number, number], color: '#15121a' },
        { position: [4.2, 0, -6.8] as [number, number, number], size: [3.8, 6.5, 2.5] as [number, number, number], color: '#12101a' },
        { position: [0, 0, -9.5] as [number, number, number], size: [8.0, 4.5, 2.2] as [number, number, number], color: '#0e0c14' },
        // Far backdrop towers (skyline)
        { position: [-14, 0, -8] as [number, number, number], size: [4, 12, 4] as [number, number, number], color: '#0a0810' },
        { position: [13, 0, -10] as [number, number, number], size: [5, 14, 4] as [number, number, number], color: '#09070e' },
        { position: [0, 0, -16] as [number, number, number], size: [10, 11, 3] as [number, number, number], color: '#08060c' },
      ] as const,
    [],
  )

  return (
    <group name="CitySquareEnv">
      {/*
        Plaza layers sit ABOVE ShopCanvas base asphalt (−0.12) with ≥0.025 Y gaps +
        polygonOffset so orbit/zoom never strobes (coplanar depth fight).
      */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.09, 1.5]} receiveShadow>
        <circleGeometry args={[22, 64]} />
        <meshStandardMaterial
          color="#0a0c12"
          roughness={0.92}
          metalness={0.04}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {/* Warm plaza wash under market — subtle, not stage gray */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 2.2]} receiveShadow renderOrder={1}>
        <circleGeometry args={[9, 48]} />
        <meshStandardMaterial
          color="#0c1018"
          emissive="#1a2430"
          emissiveIntensity={0.12}
          roughness={0.95}
          transparent
          opacity={0.85}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-2}
        />
      </mesh>
      {/* Stone ring pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 2.0]} renderOrder={2}>
        <ringGeometry args={[5.5, 5.75, 64]} />
        <meshStandardMaterial
          color="#1a1e28"
          roughness={0.85}
          metalness={0.08}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-3}
        />
      </mesh>

      <PlazaScatter count={160} />

      {buildings.map((b, i) => (
        <BuildingBlock key={i} {...b} />
      ))}

      {/* Street lamps ring */}
      <StreetLamp position={[-4.2, 0, 5.5]} />
      <StreetLamp position={[4.2, 0, 5.5]} />
      <StreetLamp position={[-5.5, 0, 1.2]} />
      <StreetLamp position={[5.5, 0, 1.2]} />
      <StreetLamp position={[-3.5, 0, -3.8]} />
      <StreetLamp position={[3.5, 0, -3.8]} />
      <StreetLamp position={[0, 0, 8.5]} />

      {/* Greenery corridor — left */}
      <StreetTree position={[-5.2, 0, 4.2]} scale={1.05} blossom />
      <StreetTree position={[-6.0, 0, 0.5]} scale={0.95} />
      <StreetTree position={[-4.8, 0, -2.5]} scale={1.1} blossom />
      <PlanterBox position={[-3.6, 0, 4.8]} />
      <Shrub position={[-3.6, 0.35, 4.8]} scale={0.85} hue={0.3} />
      <PlanterBox position={[-3.9, 0, 3.2]} scale={0.9} />
      <Shrub position={[-3.9, 0.32, 3.2]} scale={0.75} hue={0.28} />
      <Shrub position={[-5.0, 0, 6.5]} scale={1.2} hue={0.33} />
      <Shrub position={[-6.2, 0, 5.0]} scale={0.9} hue={0.26} />

      {/* Greenery corridor — right */}
      <StreetTree position={[5.3, 0, 4.0]} scale={1.0} />
      <StreetTree position={[5.8, 0, 0.2]} scale={1.15} blossom />
      <StreetTree position={[4.9, 0, -2.8]} scale={0.9} />
      <PlanterBox position={[3.7, 0, 4.6]} />
      <Shrub position={[3.7, 0.35, 4.6]} scale={0.9} hue={0.31} />
      <PlanterBox position={[3.9, 0, 2.8]} scale={0.85} />
      <Shrub position={[3.9, 0.32, 2.8]} scale={0.7} hue={0.29} />
      <Shrub position={[5.5, 0, 6.2]} scale={1.1} hue={0.34} />
      <Shrub position={[6.4, 0, 3.5]} scale={0.95} hue={0.27} />

      {/* Front plaza plant islands */}
      <PlanterBox position={[-2.2, 0, 7.2]} scale={1.1} />
      <Shrub position={[-2.2, 0.38, 7.2]} scale={1.0} hue={0.32} />
      <PlanterBox position={[2.2, 0, 7.2]} scale={1.1} />
      <Shrub position={[2.2, 0.38, 7.2]} scale={1.0} hue={0.3} />
      <StreetTree position={[-1.2, 0, 9.0]} scale={0.85} blossom />
      <StreetTree position={[1.4, 0, 9.2]} scale={0.9} />

      {/* Furniture / urban props */}
      <Bench position={[-4.0, 0, 6.2]} rotation={0.4} />
      <Bench position={[4.0, 0, 6.0]} rotation={-0.35} />
      <Bollard position={[-2.8, 0, 5.8]} />
      <Bollard position={[-2.4, 0, 5.8]} />
      <Bollard position={[2.4, 0, 5.8]} />
      <Bollard position={[2.8, 0, 5.8]} />
      <VendingMachine position={[-6.2, 0, 1.8]} rotation={Math.PI / 2} />
      <VendingMachine position={[6.4, 0, 1.5]} rotation={-Math.PI / 2} />

      {/* Low hedges framing approach */}
      {[-1.8, -0.9, 0, 0.9, 1.8].map((x, i) => (
        <Shrub key={`h${i}`} position={[x * 1.3, 0, 8.0]} scale={0.55 + hash01(i) * 0.15} hue={0.31} />
      ))}

      {/* Soft plaza market lights — cool ambient wash for square (does not cook kiosk apron) */}
      <pointLight position={[-6, 4.5, 4]} color="#6a9bb8" intensity={1.2} distance={18} decay={2} />
      <pointLight position={[6, 4.5, 4]} color="#6a9bb8" intensity={1.2} distance={18} decay={2} />
      <pointLight position={[0, 5, 10]} color="#7aaccc" intensity={0.85} distance={22} decay={2} />
    </group>
  )
}
