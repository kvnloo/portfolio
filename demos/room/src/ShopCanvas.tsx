import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { Project } from './types'
import { ShopShell } from './shop/ShopShell'
import { ProjectHotspots } from './shop/ProjectHotspots'

type Props = {
  projects: Project[]
  selectedId: string | null
  onSelect: (id: string) => void
  onReady?: () => void
}

function FirstFrameReady({ onReady }: { onReady?: () => void }) {
  const { gl } = useThree()
  useEffect(() => {
    if (!onReady) return
    let cancelled = false
    // Wait two frames so Environment/maps have a chance to settle
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) onReady()
      })
    })
    // Fallback if rAF is delayed
    const t = window.setTimeout(() => {
      if (!cancelled) onReady()
    }, 1200)
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
      window.clearTimeout(t)
    }
  }, [gl, onReady])
  return null
}

function Scene({ projects, selectedId, onSelect, onReady }: Props) {
  return (
    <>
      <FirstFrameReady onReady={onReady} />
      <ShopShell />
      <ProjectHotspots projects={projects} selectedId={selectedId} onSelect={onSelect} />
      {/* Night exterior mood; apartment fill for soft interior reflections */}
      <Environment preset="apartment" environmentIntensity={0.4} />
      <OrbitControls
        makeDefault
        target={[0.1, 1.0, -0.8]}
        minPolarAngle={0.45}
        maxPolarAngle={1.4}
        minAzimuthAngle={-1.1}
        maxAzimuthAngle={1.25}
        minDistance={2.2}
        maxDistance={8}
        enablePan={false}
        dampingFactor={0.06}
        enableDamping
      />
    </>
  )
}

export function ShopCanvas(props: Props) {
  return (
    <div className="canvas-host">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [2.8, 2.0, 3.6], fov: 42, near: 0.1, far: 40 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#050208', 8, 18]} />
        {/* jesse-zhou stage: neon ground wash */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <circleGeometry args={[7, 64]} />
          <meshStandardMaterial
            color="#120818"
            emissive="#6b2cff"
            emissiveIntensity={0.18}
            roughness={0.9}
          />
        </mesh>
        <pointLight position={[-3, 0.2, 2]} color="#ff2bd6" intensity={1.2} distance={10} />
        <pointLight position={[3, 0.2, 2]} color="#2bfff0" intensity={1.0} distance={10} />
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
      <p className="pipeline-badge">Kevin&apos;s Ramen &amp; Boba · orbit · click a dish</p>
    </div>
  )
}
