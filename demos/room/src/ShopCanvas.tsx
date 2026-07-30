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
      {/* Night IBL — residual #6: glass-tube IOR + ceramic/wood clearcoat catch (not mush) */}
      <Environment preset="night" environmentIntensity={0.72} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        {/*
          Residual #6 bloom (loop-r6): hot white neon plasma cores + tube gas only.
          Higher threshold kills midtone wash / blown signpost globes / lantern shells so
          glass-tube IOR and counter varnish read; soft mipmap keeps multi-layer tube halo
          (not flat emissive-quad billboard).
        */}
        <Bloom
          intensity={1.08}
          luminanceThreshold={0.34}
          luminanceSmoothing={0.68}
          mipmapBlur
          levels={5}
        />
        <Vignette offset={0.22} darkness={0.52} />
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
 * - stage rim (2) + dual lantern-neighbor keys + cool window + neon bounce (6; no per-tube)
 * - shadow maps 1024, single caster (in ShopShell)
 * - preserveDrawingBuffer only in beauty/capture
 * - bloom levels 5; night fog depth (near readable / far void)
 */
export function ShopCanvas(props: Props) {
  const beauty = !!props.beauty
  // Residual #6 / loop-r6: keep wood varnish + ceramic clearcoat lit; avoid globe/lantern blowout
  const exposure = 1.48

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
        {/*
          Residual #6 / loop-r6 atmosphere: cool-violet void → pure black like jesse ground falloff.
          Near holds counter/food readable; far eats shell edges into void (depth layers).
        */}
        <fog attach="fog" args={['#03010e', 5.6, 15.8]} />

        {/*
          Stage ground — soft jesse-class purple→cyan gradient (NOT hard L/R color-split tell).
          Base disc: cool violet void. Center: warm lantern/neon spill under stall.
          Side washes: larger radius + lower opacity + more overlap so L→R blends seamlessly.
        */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0.15]} receiveShadow>
          <circleGeometry args={[15, 64]} />
          <meshStandardMaterial
            color="#03010a"
            emissive="#2e1058"
            emissiveIntensity={0.42}
            roughness={0.98}
          />
        </mesh>
        {/* Warm-magenta pool under stall — lantern + neon fascia neighbor spill on ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.05, -0.052, 0.25]}>
          <circleGeometry args={[8.2, 48]} />
          <meshStandardMaterial
            color="#0a0610"
            emissive="#b02870"
            emissiveIntensity={0.52}
            roughness={1}
            transparent
            opacity={0.58}
          />
        </mesh>
        {/* Cool cyan floor wash (R) — large, soft, overlaps warm center (no hard seam) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.8, -0.048, 1.1]}>
          <circleGeometry args={[8.6, 40]} />
          <meshStandardMaterial
            color="#03060c"
            emissive="#14b8c8"
            emissiveIntensity={0.18}
            roughness={1}
            transparent
            opacity={0.28}
          />
        </mesh>
        {/* Magenta floor wash (L / signpost) — soft blend into warm center */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.6, -0.048, 1.0]}>
          <circleGeometry args={[8.4, 40]} />
          <meshStandardMaterial
            color="#06030c"
            emissive="#a82090"
            emissiveIntensity={0.16}
            roughness={1}
            transparent
            opacity={0.26}
          />
        </mesh>

        {/*
          Soft stage rims — real lights so ground + stall flanks pick up color (emissive discs
          alone never light neighbors). Lower intensity + longer distance = soft jesse gradient,
          not hard L/R color bands.
        */}
        <pointLight position={[-4.8, 0.55, 3.6]} color="#e832c0" intensity={1.35} distance={18} decay={2} />
        <pointLight position={[4.8, 0.55, 3.6]} color="#24e0d8" intensity={1.28} distance={18} decay={2} />

        {/*
          Residual #6 / loop-r6 — warm key + cool window bounce; emissives light neighbors:
          Dual warm keys sit *below* paper lanterns (y≈1.45–1.55) so counter wood, stools,
          ceramic/glass catch value without cooking lantern shells. Cool window sculpts contrast
          (no ambient mush). Neon fascia pink washes brand housing / letterforms / awning edge
          so tubes light neighbors (not pure self-emissive quads). Budget: 6 point lights.
        */}
        {/* Warm lantern L — under left paper lantern; lights ramen / left counter / noren / stools */}
        <pointLight position={[-1.35, 1.48, 0.35]} color="#ff9a52" intensity={11.5} distance={6.8} decay={2} />
        {/* Warm lantern C-R span — center→right lanterns; lights boba / mid-right counter / apron / stools */}
        <pointLight position={[0.75, 1.52, 0.42]} color="#ffc070" intensity={10.8} distance={6.6} decay={2} />
        {/* Cool night-window bounce — back-left; blue fill sculpts warm key on counter edge / stools */}
        <pointLight position={[-2.15, 2.35, -1.55]} color="#5aa0ff" intensity={7.6} distance={10.2} decay={2} />
        {/* Neon fascia bounce — pink wash on brand housing / letterforms / awning underside (neighbor spill) */}
        <pointLight position={[0.05, 2.72, 1.15]} color="#ff48c8" intensity={6.8} distance={6.4} decay={2} />

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
