import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ShopData } from './types'
import { ShopCanvas } from './ShopCanvas'
import {
  BAKED_SHOP,
  bakedResolved,
  preferBakedOnly,
  resolveShopData,
  type ShopDataSource,
} from './data/loadShopData'

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
  const initial = bakedResolved()
  const [data, setData] = useState<ShopData>(initial.data)
  const [source, setSource] = useState<ShopDataSource>(initial.source)
  // Residual D: idle hang-board first — no forced kitchen ticket on load
  // so stage/neon stay the hero until the guest taps a dish.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // Stale-while-revalidate: paint baked, then upgrade from live boplog
  useEffect(() => {
    if (preferBakedOnly()) return
    let cancelled = false
    resolveShopData().then((resolved) => {
      if (cancelled) return
      setData(resolved.data)
      setSource(resolved.source)
      setSelectedId((cur) => {
        // Keep idle (null) or a still-valid order; never auto-order first dish
        if (!cur) return null
        if (resolved.data.projects.some((p) => p.id === cur)) return cur
        return null
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const onReady = useCallback(() => setReady(true), [])

  const project = useMemo(
    () => data.projects.find((p) => p.id === selectedId) ?? null,
    [data.projects, selectedId],
  )

  const boplogUrl = data.boplogUrl || BAKED_SHOP.boplogUrl || 'https://kvnloo.github.io/boplog/'

  return (
    <div
      className={`app${beauty ? ' beauty' : ''}${project ? ' has-order' : ''}`}
      data-menu-source={source}
    >
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
            {/* Residual D r32: paper table-tent — shared ticket tokens with hang-board */}
            <div className="loading-card">
              <p className="loading-kicker">
                <span className="open-stamp" aria-hidden>
                  OPEN LATE
                </span>
                <span className="loading-kicker-text">table tent · night market</span>
              </p>
              <h2 className="loading-title">{data.shopName}</h2>
              <div className="loading-bar" aria-hidden />
              <p className="loading-hint">Warming the broth… hang the noren</p>
            </div>
          </div>
        )}

        {!beauty && (
          <header className="stage-chrome">
            {/*
              Residual D r32: bare wood fascia whisper — serif shop name only.
              No frosted SaaS plate. Chalk hang-board owns SPECIALS; ticket owns order.
            */}
            <div className="stage-chrome-copy">
              <p className="eyebrow">
                <span className="open-stamp" aria-hidden>
                  OPEN LATE
                </span>
                {!project ? (
                  <span className="eyebrow-meta">night market</span>
                ) : null}
              </p>
              <h1>{data.shopName}</h1>
              {!project ? (
                <p className="tagline">Tap a bowl or cup</p>
              ) : null}
            </div>
            {/* Residual D r32: cream paper exit tags unmount once kitchen ticket owns chrome */}
            {!project ? (
              <div className="chrome-actions" aria-label="Shop exits">
                <a className="ghost" href="/portfolio/">
                  ← alley
                </a>
                <a className="ghost" href={boplogUrl} target="_blank" rel="noreferrer">
                  boplog ↗
                </a>
              </div>
            ) : null}
          </header>
        )}

        {/*
          Residual D r32: bare counter-lip chalk — no status box / LED.
          Hang-board rail owns hours + specials.
        */}
        {!beauty && ready && !project && (
          <div className="stage-dock" aria-live="polite">
            <span className="stage-dock-hint">orbit · pick a bowl</span>
          </div>
        )}
      </div>

      {!beauty && (
        <aside
          className={`panel${project ? ' has-order' : ''}`}
          aria-label="Tonight's chalkboard specials"
        >
          <div className="panel-frame" aria-hidden />
          <div className="panel-join" aria-hidden title="wood join to stall" />
          {/*
            Residual D r32: chalk hang-board head only while idle.
            Ordered = paper kitchen ticket is the sole board head (no dual marquee).
          */}
          {!project ? (
            <header className="panel-board-head">
              <div className="panel-rail" aria-hidden>
                <span>TONIGHT</span>
                <span className="panel-rail-dot" />
                <span>SPECIALS</span>
                <span className="panel-rail-hours">dusk–late</span>
              </div>
              <p className="panel-board-chalk" aria-hidden>
                house chalk · pick a dish
              </p>
            </header>
          ) : null}

          {/* Kitchen ticket — sole dense chrome when ordered (residual D r32 paper-on-slate) */}
          {project ? (
            <div className="detail" style={{ ['--accent' as string]: project.accent }}>
              <div className="detail-perf" aria-hidden />
              <p className="detail-kitchen-stamp" aria-hidden>
                kitchen ticket
              </p>
              <p className="detail-menu">
                <span className="detail-ticket-no">
                  #
                  {String(
                    Math.max(
                      1,
                      data.projects.findIndex((x) => x.id === project.id) + 1,
                    ),
                  ).padStart(2, '0')}
                </span>
                {project.zone ? (
                  <span className="detail-zone-chip">{project.zone}</span>
                ) : null}
              </p>
              <h2 className="detail-dish">{project.menuName}</h2>
              <div className="actions">
                <a className="btn primary" href={project.demoUrl} target="_blank" rel="noreferrer">
                  Taste live
                </a>
                <a className="btn" href={project.repoUrl} target="_blank" rel="noreferrer">
                  Kitchen
                </a>
                <a
                  className="btn"
                  href={`${boplogUrl.replace(/\/$/, '')}/?q=${encodeURIComponent(project.boplogId || project.title)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  boplog
                </a>
              </div>
            </div>
          ) : null}

          {/*
            Residual D r32: chalk dish lines on slate — never SaaS list cards.
            Ordered = quiet # switcher under paper ticket.
          */}
          <nav className="menu-list" aria-label="Tonight's specials">
            {data.projects.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`menu-item${selectedId === p.id ? ' active' : ''}`}
                style={{ ['--accent' as string]: p.accent }}
                onClick={() =>
                  setSelectedId((cur) => (cur === p.id ? null : p.id))
                }
                aria-current={selectedId === p.id ? 'true' : undefined}
                aria-pressed={selectedId === p.id}
              >
                <span className="menu-item-body">
                  <strong>
                    <span className="menu-no">#{String(i + 1).padStart(2, '0')}</span>
                    <span className="menu-name">{p.menuName}</span>
                  </strong>
                </span>
                <span className="menu-leaders" aria-hidden />
                {/* Zone only idle — chalk scribble, not badge row (D density) */}
                {!project ? (
                  <span className="menu-zone">{p.zone || 'house'}</span>
                ) : null}
                {selectedId === p.id ? (
                  <span className="menu-item-ordered" aria-hidden>
                    ordered
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          {/* Residual D r32: contact chalk whisper only while idle */}
          {!project ? (
            <footer className="panel-footer">
              <p className="panel-footer-links">
                <a href={data.contact.github} target="_blank" rel="noreferrer">
                  github
                </a>
                <span className="panel-footer-dot" aria-hidden>
                  ·
                </span>
                <a href={data.contact.linkedin} target="_blank" rel="noreferrer">
                  linkedin
                </a>
                <span className="panel-footer-dot" aria-hidden>
                  ·
                </span>
                <a href={data.contact.email}>email</a>
              </p>
            </footer>
          ) : null}
        </aside>
      )}
    </div>
  )
}
