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

declare global {
  interface Window {
    __shopSetCamera?: (
      preset: string | { position: [number, number, number]; target: [number, number, number] },
    ) => boolean
    __shopCameraPresets?: Record<string, { position: [number, number, number]; target: [number, number, number] }>
  }
}

const CAMERA_PRESETS: Record<
  string,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  hero: { position: [5.4, 3.15, 6.4], target: [0, 1.35, -0.2] },
  threeQuarter: { position: [4.2, 2.6, 5.2], target: [0, 1.3, -0.1] },
  front: { position: [0.2, 2.0, 6.5], target: [0, 1.4, -0.3] },
  counter: { position: [1.2, 1.6, 2.8], target: [0.2, 1.05, -0.4] },
  leftNeon: { position: [-4.5, 2.4, 4.0], target: [0, 1.5, -0.2] },
  overhead: { position: [0.5, 7.5, 2.5], target: [0, 0.8, -0.3] },
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

/** Expose camera presets for Playwright capture harness (prompt.md loop). */
function CameraBridge() {
  const { camera, controls } = useThree()
  useEffect(() => {
    window.__shopCameraPresets = CAMERA_PRESETS
    window.__shopSetCamera = (preset) => {
      const cfg =
        typeof preset === 'string' ? CAMERA_PRESETS[preset] : preset
      if (!cfg) return false
      camera.position.set(...cfg.position)
      camera.lookAt(...cfg.target)
      camera.updateProjectionMatrix()
      const c = controls as unknown as {
        target: THREE.Vector3
        update: () => void
      } | null
      if (c?.target) {
        c.target.set(...cfg.target)
        c.update()
      }
      return true
    }
    return () => {
      delete window.__shopSetCamera
      delete window.__shopCameraPresets
    }
  }, [camera, controls])
  return null
}

function Scene({ projects, selectedId, onSelect, onReady }: Props) {
  return (
    <>
      <FirstFrameReady onReady={onReady} />
      <CameraBridge />
      <ShopShell />
      <ProjectHotspots projects={projects} selectedId={selectedId} onSelect={onSelect} />
      {/* Night IBL — ceramic clearcoat / glass bottles need catch lights */}
      <Environment preset="night" environmentIntensity={0.42} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        {/* Bloom: lower threshold so lantern cores + paper shells soft-glow; steam stays soft via smoothing */}
        <Bloom
          intensity={0.96}
          luminanceThreshold={0.28}
          luminanceSmoothing={0.64}
          mipmapBlur
          levels={5}
        />
        <Vignette offset={0.26} darkness={0.52} />
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
 * - stage rim (2) + warm lantern key + cool window + neon bounce (5 total; no per-tube)
 * - shadow maps 1024, single caster (in ShopShell)
 * - preserveDrawingBuffer only in beauty/capture
 * - bloom levels 5; night fog for depth layering (near clear / far void)
 */
export function ShopCanvas(props: Props) {
  const beauty = !!props.beauty
  // Warm interior so ceramic/wood clearcoat catch; void still dark via fog
  const exposure = 1.34

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
          toneMappingExposure: exposure,
          powerPreference: 'high-performance',
          // Only for screenshots — has a real GPU cost every frame
          preserveDrawingBuffer: beauty,
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = exposure
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}
      >
        <color attach="background" args={['#000000']} />
        {/* Night fog: near stall stays readable; denser far void for depth (critic: soft depth lacking) */}
        <fog attach="fog" args={['#06030c', 8.2, 19.5]} />

        {/*
          Stage ground — soft gradient disc, NOT harsh purple/cyan ring tell.
          Outer fades via fog; inner warm wash under kiosk (lantern key spill).
        */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0.15]} receiveShadow>
          <circleGeometry args={[14, 64]} />
          <meshStandardMaterial
            color="#06040c"
            emissive="#3a1868"
            emissiveIntensity={0.2}
            roughness={0.96}
          />
        </mesh>
        {/* Soft warm-pink pool under stall — sells lantern spill on ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.052, 0.25]}>
          <circleGeometry args={[6.2, 48]} />
          <meshStandardMaterial
            color="#0a0612"
            emissive="#b02860"
            emissiveIntensity={0.22}
            roughness={1}
            transparent
            opacity={0.58}
          />
        </mesh>
        {/* Faint cyan side wash — cool window spill on stage floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.8, -0.048, 1.2]}>
          <circleGeometry args={[5.5, 40]} />
          <meshStandardMaterial
            color="#04060c"
            emissive="#18c0b8"
            emissiveIntensity={0.14}
            roughness={1}
            transparent
            opacity={0.38}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.8, -0.048, 1.2]}>
          <circleGeometry args={[5.5, 40]} />
          <meshStandardMaterial
            color="#06040c"
            emissive="#c028a0"
            emissiveIntensity={0.12}
            roughness={1}
            transparent
            opacity={0.32}
          />
        </mesh>

        {/* ── Soft stage rim washes (magenta L / cyan R) — dialed so interior key reads ── */}
        <pointLight position={[-4.0, 0.55, 3.6]} color="#ff2bd6" intensity={2.15} distance={14} decay={2} />
        <pointLight position={[4.0, 0.55, 3.6]} color="#2bfff0" intensity={1.95} distance={14} decay={2} />

        {/*
          Residual #1 / critic bounce-fill:
          Emissive materials never light neighbors — short-range real lights co-located with
          lantern cluster + cool “window” fill + neon fascia bounce (5 total, no per-tube bloat).
        */}
        {/* Warm lantern key — under-awning cluster lights wood/counter/food neighbors */}
        <pointLight position={[-0.35, 2.16, 0.18]} color="#ff9a55" intensity={5.4} distance={4.2} decay={2} />
        {/* Cool night-window bounce — back-left fill so warm key has contrast (not ambient mush) */}
        <pointLight position={[-2.55, 2.4, -1.35]} color="#5a9cff" intensity={3.4} distance={7.2} decay={2} />
        {/* Neon fascia short bounce — pink wash on brand / upper fascia */}
        <pointLight position={[0.05, 2.58, 1.08]} color="#ff48c8" intensity={3.1} distance={4.0} decay={2} />

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
