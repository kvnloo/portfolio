import { useCallback, useMemo, useState } from 'react'
import shopData from './data/projects.json'
import type { ShopData } from './types'
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

function useBeautyMode() {
  return useMemo(() => {
    if (typeof window === 'undefined') return false
    try {
      const sp = new URLSearchParams(window.location.search)
      if (sp.get('beauty') === '1' || sp.get('beauty') === 'true') return true
      if (window.localStorage.getItem('shop-beauty') === '1') return true
    } catch {
      /* ignore */
    }
    return false
  }, [])
}

export default function App() {
  const beauty = useBeautyMode()
  const [selectedId, setSelectedId] = useState<string | null>('evolve')
  const [ready, setReady] = useState(false)

  const onReady = useCallback(() => setReady(true), [])

  const project = useMemo(
    () => data.projects.find((p) => p.id === selectedId) ?? null,
    [selectedId],
  )

  const plate = PLATES[selectedId ?? ''] ?? 'assets/shop-hero.jpg'

  return (
    <div className={`app${beauty ? ' beauty' : ''}`}>
      <div className="stage">
        <ShopCanvas
          projects={data.projects}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onReady={onReady}
          beauty={beauty}
        />

        {!ready && (
          <div className="loading-overlay" aria-live="polite" aria-busy="true">
            <div className="loading-card">
              <p className="eyebrow">Opening tonight</p>
              <h2 className="loading-title">{data.shopName}</h2>
              <div className="loading-bar" />
              <p className="loading-hint">Warming the broth…</p>
            </div>
          </div>
        )}

        {!beauty && (
          <header className="stage-chrome">
            <div>
              <p className="eyebrow">Portfolio · interactive shop</p>
              <h1>{data.shopName}</h1>
              <p className="tagline">
                Interactive shop · projects on the menu · pull up a stool
              </p>
            </div>
            <div className="chrome-actions">
              <a className="ghost" href="/portfolio/">
                ← Portfolio
              </a>
            </div>
          </header>
        )}
      </div>

      {!beauty && (
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
              <a href={data.contact.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
              {' · '}
              <a href={data.contact.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              {' · '}
              <a href={data.contact.email}>Email</a>
            </p>
            <p className="muted">{data.attribution}</p>
          </footer>
        </aside>
      )}
    </div>
  )
}
