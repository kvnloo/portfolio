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
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) onReady()
      })
    })
    const t = window.setTimeout(() => {
      if (!cancelled) onReady()
    }, 1500)
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
      <Environment preset="night" environmentIntensity={0.35} />
      <OrbitControls
        makeDefault
        target={[0, 1.15, -0.15]}
        minPolarAngle={0.3}
        maxPolarAngle={1.45}
        minAzimuthAngle={-1.5}
        maxAzimuthAngle={1.5}
        minDistance={2.5}
        maxDistance={12}
        enablePan={false}
        dampingFactor={0.055}
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
        dpr={[1, 1.85]}
        camera={{ position: [4.8, 2.8, 5.6], fov: 38, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.28,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.28
        }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#020008', 11, 22]} />

        {/* jesse-style stage wash — stronger magenta/cyan */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <circleGeometry args={[10, 72]} />
          <meshStandardMaterial
            color="#0c0818"
            emissive="#7a28e8"
            emissiveIntensity={0.38}
            roughness={0.9}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
          <ringGeometry args={[2.8, 7.2, 72]} />
          <meshStandardMaterial
            color="#0a0614"
            emissive="#ff2db0"
            emissiveIntensity={0.16}
            roughness={1}
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
        <pointLight position={[-4.5, 0.35, 3.5]} color="#ff2bd6" intensity={2.4} distance={14} />
        <pointLight position={[4.5, 0.35, 3.5]} color="#2bfff0" intensity={2.0} distance={14} />
        <pointLight position={[0, 0.2, 5.5]} color="#9040ff" intensity={1.2} distance={12} />
        <pointLight position={[0, 0.15, -3]} color="#ff60c0" intensity={0.7} distance={8} />

        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
      <p className="pipeline-badge">Kevin&apos;s Ramen &amp; Boba · orbit · click a dish</p>
    </div>
  )
}
