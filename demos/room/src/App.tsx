import { useMemo, useState } from 'react'
import shopData from './data/projects.json'
import type { Project, ShopData } from './types'
import { ShopCanvas } from './ShopCanvas'

const data = shopData as ShopData

const PLATES: Record<string, string> = {
  evolve: 'assets/ramen.jpg',
  audio: 'assets/ramen.jpg',
  ace: 'assets/boba.jpg',
  monument: 'assets/boba.jpg',
  files: 'assets/booth.jpg',
  fleet: 'assets/booth.jpg',
}

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>('evolve')
  const [showRef, setShowRef] = useState(true)

  const project = useMemo(
    () => data.projects.find((p) => p.id === selectedId) ?? null,
    [selectedId],
  )

  const plate = PLATES[selectedId ?? ''] ?? 'assets/shop-hero.jpg'

  return (
    <div className="app">
      <div className="stage">
        <ShopCanvas
          projects={data.projects}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <header className="stage-chrome">
          <div>
            <p className="eyebrow">img2threejs reconstruction</p>
            <h1>{data.shopName}</h1>
            <p className="tagline">
              Reference images rebuilt as code-only Three.js models — not photogrammetry.
            </p>
          </div>
          <div className="chrome-actions">
            <button type="button" className="ghost" onClick={() => setShowRef((v) => !v)}>
              {showRef ? 'Hide reference' : 'Show reference'}
            </button>
            <a className="ghost" href="/portfolio/">
              ← Portfolio
            </a>
          </div>
        </header>

        {showRef && (
          <div className="ref-strip" aria-label="img2threejs reference images">
            <figure>
              <img src={`${import.meta.env.BASE_URL}assets/ramen.jpg`} alt="Ramen reference" />
              <figcaption>Ref → createRamenBowlModel</figcaption>
            </figure>
            <figure>
              <img src={`${import.meta.env.BASE_URL}assets/boba.jpg`} alt="Boba reference" />
              <figcaption>Ref → createBobaCupPairModel</figcaption>
            </figure>
          </div>
        )}
      </div>

      <aside className="panel" aria-label="Project order">
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
            <div className="plate-wrap">
              <img src={`${import.meta.env.BASE_URL}${plate}`} alt="" className="plate" />
            </div>
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
        ) : null}

        <footer className="panel-footer">
          <p>
            Pipeline:{' '}
            <a href="https://github.com/img2threejs/img2threejs" target="_blank" rel="noreferrer">
              img2threejs
            </a>{' '}
            forge + agent form pass · Imagine refs
          </p>
          <p className="muted">{data.attribution}</p>
        </footer>
      </aside>
    </div>
  )
}
