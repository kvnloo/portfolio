import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr, OrbitControls, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import './pc-room.css'

type ViewMode = 'entrance' | 'overview' | 'inspect'

declare global {
  interface Window {
    __pcRoomMetrics?: {
      calls: number
      triangles: number
      points: number
      lines: number
      frameSamplesMs: number[]
    }
  }
}

const CAMERA = {
  entrance: { position: [4.9, 3.1, 7.8], target: [0, 1.35, 0] },
  overview: { position: [4.25, 2.65, 6.25], target: [0, 1.25, -0.15] },
  inspect: { position: [2.25, 1.7, 2.65], target: [1.18, 1.08, -0.28] },
} satisfies Record<ViewMode, { position: number[]; target: number[] }>

function CameraDirector({ mode, reducedMotion }: { mode: ViewMode; reducedMotion: boolean }) {
  const { camera, controls, size } = useThree()
  const mobileInspect = mode === 'inspect' && size.width < 768
  const destination = useMemo(
    () => new THREE.Vector3(...(mobileInspect ? [3.05, 2.05, 4.25] : CAMERA[mode].position)),
    [mobileInspect, mode],
  )
  const target = useMemo(
    () => new THREE.Vector3(...(mobileInspect ? [1.1, 1.38, -0.4] : CAMERA[mode].target)),
    [mobileInspect, mode],
  )

  useFrame((_, delta) => {
    const orbit = controls as { target?: THREE.Vector3; update?: () => void } | undefined
    const factor = reducedMotion ? 1 : 1 - Math.exp(-delta * 2.8)
    camera.position.lerp(destination, factor)
    orbit?.target?.lerp(target, factor)
    orbit?.update?.()
  })
  return null
}

function PerformanceProbe() {
  const { gl } = useThree()
  const previous = useRef<number | null>(null)
  const samples = useRef<number[]>([])
  useFrame(({ clock }) => {
    const now = clock.elapsedTime * 1000
    if (previous.current !== null && samples.current.length < 600) {
      samples.current.push(now - previous.current)
    }
    previous.current = now
    window.__pcRoomMetrics = {
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      points: gl.info.render.points,
      lines: gl.info.render.lines,
      frameSamplesMs: samples.current,
    }
  })
  return null
}

function RoomShell() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.4, 7.2]} />
        <meshStandardMaterial color="#17191b" roughness={0.88} metalness={0.02} />
      </mesh>
      <mesh position={[0, 2.15, -2.55]} receiveShadow>
        <boxGeometry args={[8.4, 4.3, 0.12]} />
        <meshStandardMaterial color="#202326" roughness={0.93} />
      </mesh>
      <mesh position={[-4.14, 2.15, 0]} receiveShadow>
        <boxGeometry args={[0.12, 4.3, 5.2]} />
        <meshStandardMaterial color="#1a1d20" roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.035, -1.05]} receiveShadow>
        <boxGeometry args={[7.8, 0.07, 0.1]} />
        <meshStandardMaterial color="#2c3033" roughness={0.7} />
      </mesh>
    </group>
  )
}

function Desk() {
  return (
    <group position={[0, 0, -0.35]}>
      <mesh position={[0, 0.93, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.25, 0.12, 1.15]} />
        <meshStandardMaterial color="#493527" roughness={0.58} metalness={0.02} />
      </mesh>
      {[-1.8, 1.8].map((x) => (
        <mesh key={x} position={[x, 0.45, 0]} castShadow>
          <boxGeometry args={[0.11, 0.9, 0.84]} />
          <meshStandardMaterial color="#24282b" roughness={0.36} metalness={0.72} />
        </mesh>
      ))}
    </group>
  )
}

function PrimaryDisplay() {
  return (
    <group position={[-0.35, 1.64, -0.62]}>
      <mesh castShadow>
        <boxGeometry args={[1.9, 1.08, 0.09]} />
        <meshStandardMaterial color="#111416" roughness={0.22} metalness={0.52} />
      </mesh>
      <mesh position={[0, 0, 0.051]}>
        <planeGeometry args={[1.77, 0.95]} />
        <meshStandardMaterial color="#18272b" emissive="#274b52" emissiveIntensity={0.42} roughness={0.34} />
      </mesh>
      <mesh position={[0, -0.72, -0.03]} castShadow>
        <boxGeometry args={[0.09, 0.38, 0.09]} />
        <meshStandardMaterial color="#2a2e31" metalness={0.74} roughness={0.28} />
      </mesh>
      <mesh position={[0, -0.9, 0.05]} castShadow>
        <boxGeometry args={[0.52, 0.04, 0.34]} />
        <meshStandardMaterial color="#272b2e" metalness={0.78} roughness={0.3} />
      </mesh>
    </group>
  )
}

function PcTower({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <group position={[1.38, 1.76, -0.48]}>
      <mesh
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
        onPointerEnter={(event) => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerLeave={() => {
          setHovered(false)
          document.body.style.cursor = ''
        }}
        scale={selected ? 1.025 : hovered ? 1.012 : 1}
      >
        <boxGeometry args={[0.72, 1.48, 0.82]} />
        <meshPhysicalMaterial color="#181c1f" roughness={0.3} metalness={0.68} clearcoat={0.28} />
      </mesh>
      <mesh position={[-0.366, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.7, 1.3]} />
        <meshPhysicalMaterial color="#172126" transparent opacity={0.48} roughness={0.12} transmission={0.04} />
      </mesh>
      {[0.43, 0, -0.43].map((y) => (
        <mesh key={y} position={[0.366, y, 0.22]} rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[0.14, 0.19, 32]} />
          <meshStandardMaterial color="#65757a" emissive="#6a9ba0" emissiveIntensity={selected ? 0.42 : 0.14} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, -0.78, 0.27]}>
        <boxGeometry args={[0.54, 0.08, 0.18]} />
        <meshStandardMaterial color="#101214" roughness={0.72} />
      </mesh>
    </group>
  )
}

function Scene({ mode, reducedMotion, onSelect }: { mode: ViewMode; reducedMotion: boolean; onSelect: () => void }) {
  return (
    <>
      <color attach="background" args={['#171a1c']} />
      <fog attach="fog" args={['#171a1c', 8, 18]} />
      <ambientLight intensity={0.62} color="#a9b2b2" />
      <hemisphereLight args={['#91aab0', '#352a22', 1.05]} />
      <directionalLight position={[2.8, 5.4, 4.2]} color="#e2e9e6" intensity={2.75} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-1.5, 2.25, 1.2]} color="#c99369" intensity={5.4} distance={6} decay={2} />
      <pointLight position={[2.1, 2.2, 0.55]} color="#78a7aa" intensity={5.2} distance={4.5} decay={2} />
      <RoomShell />
      <Desk />
      <PrimaryDisplay />
      <PcTower selected={mode === 'inspect'} onSelect={onSelect} />
      <CameraDirector mode={mode} reducedMotion={reducedMotion} />
      <OrbitControls
        makeDefault
        target={CAMERA.overview.target as [number, number, number]}
        enablePan={false}
        minDistance={3.1}
        maxDistance={8.5}
        minPolarAngle={0.62}
        maxPolarAngle={1.38}
        minAzimuthAngle={-1.05}
        maxAzimuthAngle={1.05}
        enableDamping={!reducedMotion}
        dampingFactor={0.055}
        rotateSpeed={0.3}
        zoomSpeed={0.42}
      />
      <PerformanceMonitor />
      <PerformanceProbe />
      <AdaptiveDpr pixelated />
    </>
  )
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

export function PcRoomExperience() {
  const reducedMotion = useReducedMotion()
  const [mode, setMode] = useState<ViewMode>(reducedMotion ? 'overview' : 'entrance')
  const [ready, setReady] = useState(false)
  const entered = useRef(false)

  useEffect(() => {
    if (entered.current || reducedMotion) return
    entered.current = true
    const timer = window.setTimeout(() => setMode('overview'), 1500)
    return () => window.clearTimeout(timer)
  }, [reducedMotion])

  return (
    <main className="pc-room" data-view={mode}>
      <a className="pc-skip" href="#pc-controls">Skip to controls</a>
      <div className="pc-canvas" aria-label="Interactive three-dimensional workstation study">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: CAMERA.entrance.position as [number, number, number], fov: 38, near: 0.1, far: 30 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFSoftShadowMap
            requestAnimationFrame(() => setReady(true))
          }}
          fallback={<div className="pc-fallback">Interactive view unavailable. The workstation study includes a desk, tower, and primary display.</div>}
        >
          <Suspense fallback={null}>
            <Scene mode={mode} reducedMotion={reducedMotion} onSelect={() => setMode('inspect')} />
          </Suspense>
        </Canvas>
      </div>

      {!ready && <div className="pc-loading" role="status">Preparing the room study</div>}

      <header className="pc-title">
        <a href="/portfolio/" aria-label="Return to portfolio">Kevin Luo</a>
        <p>Workstation study</p>
      </header>

      <section className="pc-copy" aria-labelledby="pc-heading">
        <p className="pc-kicker">A private setup, reduced to public-safe form</p>
        <h1 id="pc-heading">The room behind the work.</h1>
        <p>One desk, one display, and the machine that drives the portfolio.</p>
      </section>

      <nav className="pc-controls" id="pc-controls" aria-label="Room camera controls">
        <button type="button" onClick={() => setMode('overview')} aria-pressed={mode === 'overview'}>Overview</button>
        <button type="button" onClick={() => setMode('inspect')} aria-pressed={mode === 'inspect'}>Inspect tower</button>
      </nav>

      {mode === 'inspect' && (
        <aside className="pc-detail" aria-live="polite">
          <button type="button" className="pc-close" onClick={() => setMode('overview')} aria-label="Close equipment details">Close</button>
          <p>Primary workstation</p>
          <h2>Quiet power, kept within reach.</h2>
          <dl>
            <div><dt>Category</dt><dd>Desktop tower</dd></div>
            <div><dt>Placement</dt><dd>Desk right</dd></div>
            <div><dt>Model status</dt><dd>Dimension-informed hypothesis</dd></div>
          </dl>
        </aside>
      )}

      <p className="pc-hint">Drag to orbit. Scroll to move closer.</p>
    </main>
  )
}
