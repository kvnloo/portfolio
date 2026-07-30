import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Loader } from '@react-three/drei'
import shopData from './data/projects.json'
import type { ShopData } from './types'
import { ShopScene } from './ShopScene'
import { ProjectPanel } from './ProjectPanel'

const data = shopData as ShopData

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const project = useMemo(
    () => data.projects.find((p) => p.id === selectedId) ?? null,
    [selectedId],
  )

  return (
    <div className="app">
      <div className="stage">
        <Canvas
          shadows
          camera={{ position: [3.2, 2.4, 4.2], fov: 42 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#120d0a']} />
          <fog attach="fog" args={['#120d0a', 8, 18]} />
          <Suspense fallback={null}>
            <ShopScene
              projects={data.projects}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <Environment preset="night" />
          </Suspense>
          <OrbitControls
            makeDefault
            target={[0, 1.1, -0.4]}
            minPolarAngle={0.6}
            maxPolarAngle={1.45}
            minDistance={3}
            maxDistance={8}
            enablePan={false}
          />
        </Canvas>
        <Loader />
        <div className="hud-tip">Drag to look · scroll to zoom · click the menu</div>
      </div>
      <ProjectPanel
        data={data}
        project={project}
        onClose={() => setSelectedId(null)}
        onSelect={setSelectedId}
      />
    </div>
  )
}
