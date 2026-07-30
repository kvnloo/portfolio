import { Suspense, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'
import shopData from './data/projects.json'
import type { Project, ShopData } from './types'

const data = shopData as ShopData

/** Public demo scene — override with VITE_SPLINE_SCENE for your own shop. */
const DEFAULT_SCENE =
  import.meta.env.VITE_SPLINE_SCENE ||
  'https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode'

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [sceneError, setSceneError] = useState(false)

  const project = useMemo(
    () => data.projects.find((p) => p.id === selectedId) ?? null,
    [selectedId],
  )

  return (
    <div className="app">
      <div className="stage">
        <div className="signage">
          <p className="eyebrow">Spline demo</p>
          <h1>{data.shopName}</h1>
          <p className="tagline">{data.tagline}</p>
        </div>

        <div className="canvas-wrap">
          {!sceneError ? (
            <Suspense fallback={<div className="loading">Loading 3D scene…</div>}>
              <Spline
                scene={DEFAULT_SCENE}
                onLoad={() => setSceneReady(true)}
                onError={() => setSceneError(true)}
              />
            </Suspense>
          ) : (
            <div className="loading fallback">
              <p>Spline scene could not load (network or URL).</p>
              <p>Use the menu hotspots — or set <code>VITE_SPLINE_SCENE</code> to your scene.</p>
            </div>
          )}
          {!sceneReady && !sceneError && <div className="loading overlay">Warming the shop lights…</div>}
        </div>

        <div className="hotspots" aria-label="Project hotspots">
          {data.projects.map((p, i) => (
            <HotspotButton
              key={p.id}
              project={p}
              active={selectedId === p.id}
              index={i}
              total={data.projects.length}
              onSelect={setSelectedId}
            />
          ))}
        </div>

        <a className="back-link" href="/portfolio/">
          ← Portfolio
        </a>
      </div>

      <aside className="panel" aria-label="Project details">
        <nav className="menu-list">
          {data.projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`menu-item${selectedId === p.id ? ' active' : ''}`}
              style={{ ['--accent' as string]: p.accent }}
              onClick={() => setSelectedId(p.id)}
            >
              <span className="menu-dot" />
              <span>
                <strong>{p.menuName}</strong>
                <small>{p.title}</small>
              </span>
            </button>
          ))}
        </nav>

        {project ? (
          <div className="detail" style={{ ['--accent' as string]: project.accent }}>
            <button type="button" className="close" onClick={() => setSelectedId(null)} aria-label="Close">
              ×
            </button>
            <p className="detail-menu">{project.menuName}</p>
            <h2>{project.title}</h2>
            <p className="blurb">{project.blurb}</p>
            <div className="tags">
              {project.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="actions">
              <a className="btn primary" href={project.demoUrl} target="_blank" rel="noreferrer">
                Live demo
              </a>
              <a className="btn" href={project.repoUrl} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
          </div>
        ) : (
          <p className="hint">
            Click a floating pin on the scene or a menu item. Pins map to Kevin&apos;s projects —
            swap the Spline scene later for a full ramen &amp; boba interior.
          </p>
        )}

        <footer className="panel-footer">
          <p>{data.attribution}</p>
          <p className="muted-note">
            Default scene is a public Spline sample. Set <code>VITE_SPLINE_SCENE</code> to use your
            own.
          </p>
        </footer>
      </aside>
    </div>
  )
}

function HotspotButton({
  project,
  active,
  index,
  total,
  onSelect,
}: {
  project: Project
  active: boolean
  index: number
  total: number
  onSelect: (id: string) => void
}) {
  // Fan pins across the lower/mid canvas so they work with any decorative scene
  const left = 12 + (index / Math.max(total - 1, 1)) * 76
  const top = 28 + (index % 2) * 22

  return (
    <button
      type="button"
      className={`hotspot${active ? ' active' : ''}`}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        ['--accent' as string]: project.accent,
      }}
      onClick={() => onSelect(project.id)}
      title={project.menuName}
    >
      <span className="pin" />
      <span className="label">{project.menuName}</span>
    </button>
  )
}
