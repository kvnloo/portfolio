import type { Project, ShopData } from './types'

type Props = {
  data: ShopData
  project: Project | null
  onClose: () => void
  onSelect: (id: string) => void
}

export function ProjectPanel({ data, project, onClose, onSelect }: Props) {
  return (
    <aside className="panel" aria-label="Shop menu and project details">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Now serving</p>
          <h1>{data.shopName}</h1>
          <p className="tagline">{data.tagline}</p>
        </div>
        <a className="back-link" href="/portfolio/">
          ← Portfolio
        </a>
      </header>

      <nav className="menu-list" aria-label="Project menu">
        {data.projects.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`menu-item${project?.id === p.id ? ' active' : ''}`}
            style={{ ['--accent' as string]: p.accent }}
            onClick={() => onSelect(p.id)}
          >
            <span className="menu-dot" />
            <span className="menu-copy">
              <strong>{p.menuName}</strong>
              <small>{p.title}</small>
            </span>
          </button>
        ))}
      </nav>

      {project ? (
        <div className="detail" style={{ ['--accent' as string]: project.accent }}>
          <button type="button" className="close" onClick={onClose} aria-label="Close details">
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
        <p className="hint">Click a bowl, cup, laptop, or menu item — or pick from the list.</p>
      )}

      <footer className="panel-footer">
        <p>{data.attribution}</p>
        <p className="contact">
          <a href={data.contact.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          {' · '}
          <a href={data.contact.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </p>
      </footer>
    </aside>
  )
}
