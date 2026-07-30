import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { Project } from './types'
import { ShopShell } from './shop/ShopShell'
import { ProjectHotspots } from './shop/ProjectHotspots'

type Props = {
  projects: Project[]
  selectedId: string | null
  onSelect: (id: string) => void
  onReady?: () => void
  /** Pure-3D capture mode (chrome hidden in App); reserved for future shot tweaks */
  beauty?: boolean
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
      {/* Neon bloom — jesse-class emissive soft falloff */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.85}
          luminanceThreshold={0.35}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
        <Vignette offset={0.25} darkness={0.55} />
      </EffectComposer>
      <OrbitControls
        makeDefault
        target={[0, 1.35, -0.2]}
        minPolarAngle={0.35}
        maxPolarAngle={1.42}
        minAzimuthAngle={-1.45}
        maxAzimuthAngle={1.45}
        minDistance={3.2}
        maxDistance={14}
        enablePan={false}
        dampingFactor={0.055}
        enableDamping
      />
    </>
  )
}

/**
 * Stage camera framed like jesse ref: full kiosk silhouette + ground glow,
 * pure black void, strong magenta/cyan stage wash.
 */
export function ShopCanvas(props: Props) {
  return (
    <div className="canvas-host">
      <Canvas
        shadows
        dpr={[1, 1.85]}
        camera={{ position: [5.4, 3.15, 6.4], fov: 36, near: 0.1, far: 60 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.15
        }}
      >
        <color attach="background" args={['#000000']} />
        {/* Soft falloff into black — silhouette pops */}
        <fog attach="fog" args={['#000000', 14, 28]} />

        {/* Ground plane — purple→cyan gradient via layered emissives */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0.2]} receiveShadow>
          <circleGeometry args={[12, 80]} />
          <meshStandardMaterial
            color="#080612"
            emissive="#6a22d8"
            emissiveIntensity={0.42}
            roughness={0.92}
          />
        </mesh>
        {/* Magenta inner wash */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0.3]}>
          <circleGeometry args={[5.5, 72]} />
          <meshStandardMaterial
            color="#0a0614"
            emissive="#d028a0"
            emissiveIntensity={0.28}
            roughness={1}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Cyan outer ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.045, 0.4]}>
          <ringGeometry args={[4.2, 9.5, 80]} />
          <meshStandardMaterial
            color="#060414"
            emissive="#18e0d0"
            emissiveIntensity={0.22}
            roughness={1}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Soft pink halo near stall feet */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
          <ringGeometry args={[1.6, 4.0, 64]} />
          <meshStandardMaterial
            color="#0a0610"
            emissive="#ff40b0"
            emissiveIntensity={0.14}
            roughness={1}
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Ground-level stage wash lights */}
        <pointLight position={[-5.0, 0.3, 4.0]} color="#ff2bd6" intensity={3.0} distance={16} decay={2} />
        <pointLight position={[5.0, 0.3, 4.0]} color="#2bfff0" intensity={2.6} distance={16} decay={2} />
        <pointLight position={[0, 0.18, 6.5]} color="#9040ff" intensity={1.5} distance={14} decay={2} />
        <pointLight position={[0, 0.12, -4]} color="#ff50c0" intensity={0.9} distance={10} decay={2} />
        <pointLight position={[-3, 0.15, -1]} color="#c040ff" intensity={0.7} distance={8} decay={2} />
        <pointLight position={[3, 0.15, -1]} color="#40e0ff" intensity={0.65} distance={8} decay={2} />

        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
      <p className="pipeline-badge">Kevin&apos;s Ramen &amp; Boba · orbit · click a dish</p>
    </div>
  )
}
