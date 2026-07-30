import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import shopData from './data/projects.json'
import type { Project, ShopData } from './types'

const data = shopData as ShopData

/** Hotspot positions as % of the hero stage (tuned to shop-hero; labels hover-only). */
const HOTSPOTS: {
  id: string
  left: string
  top: string
  plate: string
}[] = [
  { id: 'evolve', left: '16%', top: '68%', plate: 'assets/ramen.jpg' },
  { id: 'audio', left: '32%', top: '58%', plate: 'assets/ramen.jpg' },
  { id: 'ace', left: '54%', top: '52%', plate: 'assets/boba.jpg' },
  { id: 'monument', left: '64%', top: '40%', plate: 'assets/boba.jpg' },
  { id: 'files', left: '74%', top: '70%', plate: 'assets/booth.jpg' },
  { id: 'fleet', left: '86%', top: '62%', plate: 'assets/booth.jpg' },
]

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })

  const project = useMemo(
    () => data.projects.find((p) => p.id === selectedId) ?? null,
    [selectedId],
  )

  const plate = useMemo(() => {
    const hs = HOTSPOTS.find((h) => h.id === selectedId)
    return hs?.plate ?? 'assets/shop-hero.jpg'
  }, [selectedId])

  const onMove = useCallback((e: MouseEvent) => {
    const el = stageRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width - 0.5
    const ny = (e.clientY - r.top) / r.height - 0.5
    setParallax({ x: nx * 12, y: ny * 8 })
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) setParallax({ x: 0, y: 0 })
  }, [])

  return (
    <div className="app">
      <div
        className="stage"
        ref={stageRef}
        onMouseMove={onMove}
        onMouseLeave={() => setParallax({ x: 0, y: 0 })}
      >
        <div
          className="hero-layer"
          style={{
            transform: `translate3d(${parallax.x * -1}px, ${parallax.y * -1}px, 0) scale(1.06)`,
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}assets/shop-hero.jpg`}
            alt="Kevin's Ramen & Boba — cinematic shop interior"
            className="hero-img"
            draggable={false}
          />
          <div className="hero-vignette" />
          <div className="hero-grain" />
        </div>

        <header className="stage-chrome">
          <div>
            <p className="eyebrow">Interactive portfolio shop</p>
            <h1>{data.shopName}</h1>
            <p className="tagline">{data.tagline}</p>
          </div>
          <div className="chrome-actions">
            <button type="button" className="ghost" onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? 'Hide menu' : 'Full menu'}
            </button>
            <a className="ghost" href="/portfolio/">
              ← Portfolio
            </a>
          </div>
        </header>

        <div className="hotspots">
          {HOTSPOTS.map((h) => {
            const p = data.projects.find((x) => x.id === h.id)
            if (!p) return null
            const active = selectedId === p.id
            return (
              <button
                key={h.id}
                type="button"
                className={`hotspot${active ? ' active' : ''}`}
                style={{
                  left: h.left,
                  top: h.top,
                  ['--accent' as string]: p.accent,
                }}
                onClick={() => setSelectedId(p.id)}
                aria-label={`${p.menuName}: ${p.title}`}
              >
                <span className="pulse" />
                <span className="pin" />
                <span className="label">
                  <strong>{p.menuName}</strong>
                  <small>{p.title}</small>
                </span>
              </button>
            )
          })}
        </div>

        <p className="hint-bar">Explore the shop · click a pin to order a project</p>
      </div>

      <aside className={`panel${menuOpen ? ' expanded' : ''}`} aria-label="Order details">
        {(menuOpen || !project) && (
          <nav className="menu-list" aria-label="Full menu">
            {data.projects.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`menu-item${selectedId === p.id ? ' active' : ''}`}
                style={{ ['--accent' as string]: p.accent }}
                onClick={() => {
                  setSelectedId(p.id)
                  setMenuOpen(false)
                }}
              >
                <span className="menu-dot" />
                <span>
                  <strong>{p.menuName}</strong>
                  <small>{p.title}</small>
                </span>
              </button>
            ))}
          </nav>
        )}

        {project ? (
          <div className="detail" style={{ ['--accent' as string]: project.accent }}>
            <button type="button" className="close" onClick={() => setSelectedId(null)} aria-label="Close">
              ×
            </button>
            <div className="plate-wrap">
              <img
                src={`${import.meta.env.BASE_URL}${plate.replace(/^\//, '')}`}
                alt=""
                className="plate"
              />
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
        ) : (
          <div className="welcome">
            <p>
              Welcome to <strong>{data.shopName}</strong>. This is a high-fidelity interactive shop —
              not a box-primitive demo. Pins map to real projects.
            </p>
            <p className="muted">{data.attribution}</p>
          </div>
        )}

        <footer className="panel-footer">
          <a href={data.contact.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          {' · '}
          <a href={data.contact.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </footer>
      </aside>
    </div>
  )
}
