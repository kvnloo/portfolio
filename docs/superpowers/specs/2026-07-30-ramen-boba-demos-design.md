# Design: Ramen + Boba Shop Portfolio Demos

**Date:** 2026-07-30  
**Status:** Draft for user review  
**Owner:** Kevin Rajan (kvnloo)  
**Repo:** `kvnloo/portfolio`

## Summary

Ship **two parallel interactive demos** under the existing portfolio repo, both themed as a **personal ramen + boba shop** with Kevin’s name on the sign. Visitors explore the shop; clicking props opens **project portals** (live demo + GitHub). Inspired by interactive shop portfolios such as [jesse-zhou.com](https://jesse-zhou.com) — **not a visual or asset clone**.

## Goals

1. **Show craft** — site *is* the demo (3D + interaction), not only markdown cards.
2. **Brand** — playful, premium, “I can build whatever I want,” up-to-date AI eng + full-stack.
3. **Parallel tracks** — Room (Three.js / R3F) and Spline, same content model.
4. **Deployable** on GitHub Pages beside the current static site.

## Non-goals (v1)

- Pixel-perfect recreation of jesse-zhou.com or any third-party shop.
- Custom Blender mesh pipeline (procedural geometry first).
- Custom authored Spline scene required for v1 (placeholder public scene + swap path).
- Replacing `index.html` as the sole homepage (link *to* demos instead).
- Physics multiplayer, accounts, analytics backends.

## Placement & URLs

```
portfolio/
  index.html                      # existing site + nav/CTA to demos
  demos/
    room/                         # Vite + React + R3F (ramen + boba shop)
    spline/                       # Vite + React + Spline (same metaphor)
  shared/projects.json            # single source of truth for portals
  docs/superpowers/specs/...      # this design
```

| Environment | Room | Spline |
|-------------|------|--------|
| Local | `demos/room` dev server | `demos/spline` dev server |
| Production Pages | `/portfolio/demos/room/` | `/portfolio/demos/spline/` |
| Dev Pages (if dual deploy kept) | `/portfolio/dev/demos/room/` | `/portfolio/dev/demos/spline/` |

Vite `base` must match Pages path (`/portfolio/demos/room/` and `/portfolio/demos/spline/`).

## Shop identity

| Field | Value |
|-------|--------|
| Signage | **Kevin’s Ramen & Boba** (primary) |
| Optional short | **Kevin’s** on noren / cups |
| Tone | Cozy night shop, soft neon, steam, warm wood + cool boba pastels |
| Footer credit | “Interactive shop portfolio format inspired by sites like jesse-zhou.com” |

## Spatial layout (both demos map the same zones)

| Zone | Visual | Portal mapping (v1) |
|------|--------|---------------------|
| Entrance / noren | Shop name, night window | Intro only (no project) |
| Ramen counter | Bowls, pot, steam, chopsticks | **Evolve**, **zer0-cockpit** (or harness) |
| Boba station | Cups, pearls, shaker | **ACE**, **monument** |
| Menu board | Lit menu | Opens full list / focused project picker |
| Booth + laptop | Seat, glowing laptop | **.files**, **tmux-agent-fleet** |
| Audio nook | Headphones / small speaker | **AudioEngine** |
| Receipt / bag | Small prop | Contact / GitHub profile |

Hover: subtle glow + label. Click: shared project panel.

## Shared content model

`shared/projects.json` (or `demos/shared/projects.json` imported/copied into both apps):

```json
{
  "shopName": "Kevin's Ramen & Boba",
  "projects": [
    {
      "id": "evolve",
      "title": "Evolve Framework",
      "menuName": "Miso Multi-Agent Ramen",
      "zone": "ramen",
      "blurb": "...",
      "tags": ["AI", "Multi-Agent"],
      "demoUrl": "https://kvnloo.github.io/evolve/",
      "repoUrl": "https://github.com/kvnloo/evolve",
      "accent": "#e8a54b"
    }
  ]
}
```

**v1 project set (minimum 5):** Evolve, ACE, .files, tmux-agent-fleet, AudioEngine.  
**Optional extras if time:** monument, zer0-cockpit.

Honesty rules from prior portfolio audit still apply: no claiming forks as originals; dimos not featured.

## Track A — Room demo (`demos/room`)

### Stack
- Vite + React + TypeScript  
- `@react-three/fiber`, `@react-three/drei`, `three`  
- CSS modules or plain CSS (no requirement for Tailwind)

### Experience
1. Loading screen with shop name.
2. Enter scene: interior, warm key light, cool rim from window/neon.
3. Constrained orbit / gentle auto-idle camera; reset view control.
4. Clickable meshes for zones above.
5. Right or bottom **panel**: menu name, real title, blurb, tags, Live Demo, GitHub, Close.
6. Mobile: same panel + “Menu” button listing all projects if raycast is awkward.
7. Accessibility: keyboard focusable menu list; reduce-motion prefers less camera motion.

### Implementation approach (v1)
- Procedural meshes (box/cylinder/lathe primitives + materials).
- Steam: simple particle or sprite plane animation.
- No external GLB required for v1.

## Track B — Spline demo (`demos/spline`)

### Stack
- Vite + React + TypeScript  
- `@splinetool/react-spline` (or runtime viewer equivalent)

### Experience
1. Full-viewport Spline canvas.
2. Overlay chrome: shop title **Kevin’s Ramen & Boba**, hotspot buttons or screen-space pins aligned to project set.
3. Same panel component pattern as room (shared copy from JSON).
4. `VITE_SPLINE_SCENE` env for scene URL; commit a working default public/community scene so CI/build works without secrets.
5. README section: how Kevin replaces the scene with a custom Spline file later.

### Note
If Spline hotspots inside the scene are brittle, **v1 may use HTML hotspots only** over a decorative scene — still valid as “Spline track.”

## Main site integration

Update root `index.html`:
- Nav or hero CTAs: **Room Shop** → `demos/room/`, **Spline Shop** → `demos/spline/`.
- Short line: interactive ramen & boba portfolio demos.

## Deploy

Extend `.github/workflows/deploy-unified.yml` (or equivalent):
1. Setup Node.
2. `npm ci && npm run build` in `demos/room` and `demos/spline` with correct `base`.
3. Copy each `dist/` to `deploy/demos/room` and `deploy/demos/spline` (and under `deploy/dev/...` if dual branch deploy remains).
4. Keep existing static root copy of main site.

Local verify: `npx serve` of combined deploy folder or Pages preview.

## Success criteria

- [ ] Both demos run locally.
- [ ] Both build with Pages `base` paths.
- [ ] ≥5 project portals with real outbound links.
- [ ] Shop sign shows Kevin’s name.
- [ ] No API keys or secrets committed.
- [ ] Main site links to both demos.
- [ ] README (root or `demos/README.md`) documents run/build.

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Large R3F bundle on Pages | Code-split; compress; lazy Canvas |
| Spline scene unavailable | Env override + documented fallback UI list |
| Dual deploy path bugs | Single workflow job builds both after static copy |
| Over-claiming projects | Stick to audited public originals |

## Open decisions (resolved)

| Decision | Choice |
|----------|--------|
| Location | Two demos under portfolio repo |
| v1 emphasis | Interactive project portals |
| Theme | Ramen + boba shop |
| Signage | Kevin’s name on the shop |

## Next steps after approval

1. User approves this spec (or requests edits).  
2. Write implementation plan (`docs/superpowers/plans/...`).  
3. Implement room + spline **in parallel** (two workstreams).  
4. Wire deploy + main-site CTAs.  
5. Manual verify on dev Pages before calling done.
