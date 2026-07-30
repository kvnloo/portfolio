import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents, Environment, OrbitControls, PerformanceMonitor } from '@react-three/drei'
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
    }, 1200)
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
      window.clearTimeout(t)
    }
  }, [gl, onReady])
  return null
}

/** Invalidate render loop when orbiting so we can use demand framing carefully — keep always for steam. */
function Scene({ projects, selectedId, onSelect, onReady }: Props) {
  return (
    <>
      <FirstFrameReady onReady={onReady} />
      <ShopShell />
      <ProjectHotspots projects={projects} selectedId={selectedId} onSelect={onSelect} />
      {/* Lower intensity env — IBL is expensive; bloom carries neon */}
      <Environment preset="night" environmentIntensity={0.22} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          intensity={0.7}
          luminanceThreshold={0.42}
          luminanceSmoothing={0.45}
          mipmapBlur
          levels={5}
        />
        <Vignette offset={0.28} darkness={0.5} />
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
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </>
  )
}

/**
 * Performance-tuned canvas:
 * - dpr capped (1–1.5) + AdaptiveDpr regress under load
 * - fewer ground lights (2) vs previous 6+
 * - shadow maps 1024, single caster
 * - preserveDrawingBuffer only in beauty/capture
 * - bloom levels reduced
 */
export function ShopCanvas(props: Props) {
  const beauty = !!props.beauty

  return (
    <div className="canvas-host">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [5.4, 3.15, 6.4], fov: 36, near: 0.1, far: 50 }}
        performance={{ min: 0.5, max: 1, debounce: 200 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          powerPreference: 'high-performance',
          // Only for screenshots — has a real GPU cost every frame
          preserveDrawingBuffer: beauty,
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.15
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 14, 28]} />

        {/* Stage ground — fewer segments (48 vs 80), same look */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0.2]} receiveShadow>
          <circleGeometry args={[12, 48]} />
          <meshStandardMaterial
            color="#080612"
            emissive="#6a22d8"
            emissiveIntensity={0.42}
            roughness={0.92}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0.3]}>
          <circleGeometry args={[5.5, 40]} />
          <meshStandardMaterial
            color="#0a0614"
            emissive="#d028a0"
            emissiveIntensity={0.28}
            roughness={1}
            transparent
            opacity={0.85}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.045, 0.4]}>
          <ringGeometry args={[4.2, 9.5, 48]} />
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

        {/* 2 stage wash lights (was 6) — same magenta/cyan read, far less fill rate */}
        <pointLight position={[-4.2, 0.35, 3.8]} color="#ff2bd6" intensity={3.6} distance={14} decay={2} />
        <pointLight position={[4.2, 0.35, 3.8]} color="#2bfff0" intensity={3.2} distance={14} decay={2} />

        {/* Default PerformanceMonitor drives AdaptiveDpr when FPS dips */}
        <PerformanceMonitor />

        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
      {!beauty && (
        <p className="pipeline-badge">Kevin&apos;s Ramen &amp; Boba · orbit · click a dish</p>
      )}
    </div>
  )
}
