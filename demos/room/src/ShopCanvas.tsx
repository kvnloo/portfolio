import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { createRamenBowlModel, createRamenBowlLookDevLights } from './img2threejs/createRamenBowlModel'
import { createBobaCupPairModel } from './img2threejs/createBobaCupPairModel'
import type { Project } from './types'

type Props = {
  projects: Project[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function AnimatedModel({
  object,
  selected,
  onSelect,
}: {
  object: THREE.Group
  selected: boolean
  onSelect: () => void
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    g.traverse((obj) => {
      const tick = obj.userData?.tick as ((t: number) => void) | undefined
      if (typeof tick === 'function') tick(t)
    })
    const s = selected ? 1.08 : 1
    g.scale.lerp(new THREE.Vector3(s, s, s), 0.12)
  })

  return (
    <group
      ref={ref}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      <primitive object={object} />
    </group>
  )
}

function Scene({ projects, selectedId, onSelect }: Props) {
  const ramen = useMemo(() => createRamenBowlModel({ castShadow: true }), [])
  const boba = useMemo(() => createBobaCupPairModel({ castShadow: true }), [])
  const lights = useMemo(() => createRamenBowlLookDevLights('reference'), [])

  const evolve = projects.find((p) => p.id === 'evolve')
  const ace = projects.find((p) => p.id === 'ace')
  const monument = projects.find((p) => p.id === 'monument')

  return (
    <>
      <primitive object={lights} />
      <Environment preset="apartment" environmentIntensity={0.45} />
      <ambientLight intensity={0.2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#2a1c14" roughness={0.75} />
      </mesh>
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <boxGeometry args={[5.5, 0.5, 2.2]} />
        <meshStandardMaterial color="#3d291e" roughness={0.6} />
      </mesh>

      <group position={[-1.1, 0.02, 0.1]}>
        <AnimatedModel
          object={ramen}
          selected={selectedId === 'evolve'}
          onSelect={() => evolve && onSelect('evolve')}
        />
        {evolve && (
          <Html position={[0, 0.75, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <div className="r3f-label">{evolve.menuName}</div>
          </Html>
        )}
      </group>

      <group position={[1.0, 0.02, 0.15]} scale={1.15}>
        <AnimatedModel
          object={boba}
          selected={selectedId === 'ace' || selectedId === 'monument'}
          onSelect={() => ace && onSelect('ace')}
        />
        {ace && (
          <Html position={[-0.2, 0.85, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <div className="r3f-label">{ace.menuName}</div>
          </Html>
        )}
        {monument && (
          <Html position={[0.25, 0.85, 0]} center distanceFactor={6}>
            <div
              className="r3f-label"
              style={{ cursor: 'pointer', pointerEvents: 'auto' }}
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

      <ContactShadows position={[0, 0.01, 0]} opacity={0.55} scale={8} blur={2.2} far={3} />
      <OrbitControls
        makeDefault
        target={[0, 0.25, 0]}
        minPolarAngle={0.35}
        maxPolarAngle={1.35}
        minDistance={1.8}
        maxDistance={6}
        enablePan={false}
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
        camera={{ position: [2.2, 1.6, 2.8], fov: 40 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={['#0c0908']} />
        <fog attach="fog" args={['#0c0908', 6, 14]} />
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
      <p className="pipeline-badge">
        img2threejs · form/material pass · ref → procedural THREE.Group
      </p>
    </div>
  )
}
