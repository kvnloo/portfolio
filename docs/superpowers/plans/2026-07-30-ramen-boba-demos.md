# Kevin's Ramen & Boba Demos Implementation Plan

> **For agentic workers:** Execute tasks in order; room and spline apps can be built in parallel after Task 1.

**Goal:** Ship two interactive demos under `demos/room` and `demos/spline` themed as Kevin's Ramen & Boba with project portals, linked from the main portfolio and built on GitHub Pages.

**Architecture:** Shared `demos/shared/projects.json`. Two independent Vite+React TS apps (R3F room; Spline + HTML hotspots). Unified deploy workflow builds both into `deploy/demos/{room,spline}`.

**Tech Stack:** Vite 6, React 19, TypeScript, @react-three/fiber, drei, three, @splinetool/react-spline, GitHub Pages.

## Global Constraints

- Shop signage: **Kevin's Ramen & Boba**
- Pages base: `/portfolio/demos/room/` and `/portfolio/demos/spline/`
- No secrets; no claiming non-original projects
- Attribution footer for jesse-zhou-style shop format

## Tasks

### Task 1: Shared projects + demos README
- Create `demos/shared/projects.json`
- Create `demos/README.md`

### Task 2: Room app (R3F) — parallel with Task 3
- Scaffold Vite React TS in `demos/room`
- Scene, clickables, ProjectPanel, loading

### Task 3: Spline app — parallel with Task 2
- Scaffold Vite React TS in `demos/spline`
- Spline canvas + hotspot overlay + ProjectPanel

### Task 4: Main site CTAs + deploy workflow
- Link from `index.html`
- Node build steps in `deploy-unified.yml`

### Task 5: Build verify
- `npm run build` both apps with production base
