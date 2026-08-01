# The prompt

This is the **source of truth** for Kevin’s Ramen & Boba (portfolio `demos/room`)
and the **Grok-native harness** that builds it. Anyone cloning this repo should be
able to recreate the loop from this file + the paths it names — without tribal
knowledge from a past chat.

> **Important (Grok vs Claude):** Claude Code “ultracode” auto-spins dynamic
> workflows. **Grok does not.** A workflow only follows text that is **in the
> Rhai agent prompts** or that those agents are told to **read**. Editing
> `prompt.md` alone does **not** reprogram a run that already started; relaunch
> the workflow (or use a script that always `read_file`s this document).

---

## Creative brief (unchanged bar)

```
I want you to build an interactive personal portfolio website at the level of
jesse-zhou.com (Jesse's Ramen / the 3D room portfolio). It should be utterly
perfect, visually beautiful, with every single thing done at that fidelity—from
materials and lighting to interaction, camera, and atmosphere. Brand it as
Kevin's Ramen & Boba (Kevin Rajan / kvnloo): a ramen + boba shop that showcases
real projects as menu items and clickable props, not a generic resume page.

The reference bar is jesse-zhou.com. Study it, capture it, and match its craft:
immersive 3D (or equivalent high-fidelity presentation), premium materials,
readable interaction, and a shop that feels like a place—not a hobby WebGL demo
or flat Tailwind card grid.

Use Grok Imagine (image_gen / image_edit) for high-fidelity reference plates,
textures, and look-dev stills. Use img2threejs
(https://github.com/img2threejs/img2threejs) for reconstruction-by-code:
reference image → forge pipeline → form/material passes → animation-ready
Three.js factories. Do not ship untextured primitives or unreviewed blockouts.
Prefer code-only procedural Three.js models grounded in Imagine references over
downloaded art packs.

Fan out sub-agents and have sub-agents tackle each system individually so the
portfolio is utterly perfect—shop shell, lighting, ramen props, boba props,
menu/UI, project portals, loading, mobile, capture harness, object placement.
You should loop on each item and have a separate sub-agent check it visually to
ensure it hits jesse-zhou-class quality. That separate sub-agent should be a
really harsh critic, and if it doesn't look that good, it should keep going.

Don't stop until each sub-agent is utterly wowed with the quality when compared
with jesse-zhou.com (and your Imagine reference plates). It should literally
compare them side by side blind and say which one looks better. Do this in
Three.js (React Three Fiber is fine). Loop until it's utterly perfect. Fan out
sub-agents and run Grok's full multi-agent harness (see "How to run this on
Grok" below)—not Claude's ultracode keyword.

Ship under demos/room (and demos/spline if needed), with npm run capture /
placement library / visual verification, docs/VISUAL-BAR.md style rubric, and
project portals to real work (Evolve, ACE, .files, tmux-agent-fleet,
AudioEngine, Monument). The whole build is driven by this prompt.md—do not
invent a lower bar.
```

### Ship gate (non-negotiable)

Work is **not done** until **all** are true:

1. **Product capture** — `npm run capture:product -- --label <id>` produces usable non-black PNGs in:
   - `shots/<id>/` (beauty 3D)
   - `shots/<id>-placement/` (exterior/object library)
   - `shots/<id>-chrome/` (full UI overlays — not beauty mode)
2. **Harsh critics** score `VISUAL-BAR.md`: materials, lighting/style, neon/readability, placement, **chrome/brand cohesion**, **camera/UX**.
3. **Blind compare** vs jesse-zhou.com: critics **prefer ours** on craft.
4. **Placement pass** — exterior neon marquee; props grounded; placement library proves it.
5. **Lighting/style pass** — night kiosk not glowing forest; readable neon; visible detail.
6. **Chrome/brand pass** — overlays feel like the same shop (menu/ticket), not a generic SaaS panel; 3D stays hero.
7. **Camera/UX pass** — calm framing/orbit; clear select feedback; mobile usable.
8. Verdict is ship / YES — not soft-stop.

Until then: implement → beauty + placement capture → critic → fix → **relaunch loop**.
Partial polish while critics say NO is failure mode, not progress theater.

**Gate OPEN ⇒ continue.** A finished workflow run with `ship: false` is **not** project complete. Immediately relaunch:

```text
/workflow ramen-boba-loop {"start_round":N,"rounds":16}
```

with `N = last_label + 1` and high `agent_budget` (384–512).

Live code: `demos/room/`. Rubric: `demos/room/docs/VISUAL-BAR.md`.  
Honesty: `demos/room/docs/PROMPT-TRUTH.md`. Residuals: `demos/room/docs/LOOP-RESIDUALS.md`.

---

## Placement & brand (extra critic dimension)

Known fail class: **neon shop sign hidden behind wall / fascia / awning** instead of reading as an exterior marquee.

### Rules

| Object | Placement rule |
|--------|----------------|
| **Brand neon (`NeonBrandSign`)** | Mounted on the **outside** front of the building (street-facing). Full lettering readable from front + three-quarter exterior cameras. Must not be inside the room volume, behind side walls, or clipped by roof/fascia/awning from normal approach angles. |
| **Roof glyph / corner tubes** | Exterior silhouette accents; not buried in roof solid. |
| **Directional signpost** | Street-side, clear of kiosk mass; readable arrow stack. |
| **Counter props (ramen, boba, portals)** | Sit on counter with contact shadow; no floor float, no wall clip. |
| **Lanterns** | Under awning exterior; hang free, not inside solid geometry. |
| **Menu / chalkboard** | On intended wall plane; frame not z-fighting. |
| **Noren / stools / stools+counter** | Consistent scale; seats in front of counter apron. |

### How to validate (mandatory each quality round)

1. Expand camera presets in `ShopCanvas` `CAMERA_PRESETS` / `__shopSetCamera` for object close-ups and exterior sign reads.
2. Run **placement library** capture (many angles + per-object stills).
3. Critic opens that library **as its own dimension** (placement score + fail list) **in addition to** craft vs jesse.

Agents should fix placement residuals **before** endless material micro-polish when the sign is unreadable or props clip.

---

## Claude “ultracode” vs Grok harness

### What ultracode is (Claude Code, 2026)

| Claude | Behavior |
|--------|----------|
| `/effort ultracode` | xhigh reasoning + **automatic** dynamic workflows for substantive tasks |
| Keyword `ultracode` in a human prompt | One-shot dynamic workflow opt-in |

### Grok map (this repo)

| Intent | Use this | Notes |
|--------|----------|--------|
| Max reasoning | `/effort high` | **grok-4.5** menu: `low` / `medium` / **`high` only** (no `xhigh` / ultracode) |
| Multi-agent quality loop | **`.grok/workflows/ramen-boba-loop.rhai`** | Closest to Claude dynamic workflows |
| Autonomous until verified | `/goal` + this file | Host rounds + adversarial completion check |
| Heartbeat | `/loop 15m …` | Not the main build loop |
| Fan-out | `spawn_subagent` or workflow `parallel()` | Nothing auto-fires from a magic word |
| Graph nav (cheap) | **GitNexus CLI** `npx gitnexus …` | Indexed at repo root; prefer over full-file dumps |
| Imagine | `image_gen` / `image_edit` | Reference plates / textures |

**Bottom line:** Explicitly launch a workflow or goal. Effort alone only thinks harder.

---

## Recreate from a clean clone (runbook)

### 0. Prerequisites

```bash
git clone <this-repo> && cd portfolio
# Grok Build TUI (or compatible host with workflow + subagents)
cd demos/room && npm ci
# Optional: index for cheaper code nav
cd ../.. && npx gitnexus analyze .
```

### 1. Effort

```text
/effort high
```

### 2. Start the quality workflow (preferred)

```text
/workflow ramen-boba-loop {"rounds":12,"start_round":1}
```

Raise budget when launching via agent/tool: `agent_budget` **256–512**.  
Watch: `/workflows`. Stop: `/workflow stop ramen-boba-loop` (or numbered handle).

**Continuation when gate OPEN** (required — host does not auto-chain runs):

```text
/workflow ramen-boba-loop {"start_round":7,"rounds":16}
```

### 3. Or goal mode

```text
/goal Execute portfolio/prompt.md for demos/room until harsh critics prefer
  Kevin's Ramen & Boba over jesse-zhou.com. Evidence: beauty shots + placement
  library + CRITIC-PASS docs. Do not soft-stop. --budget 2000000
```

### 4. Manual room commands (any agent)

```bash
cd demos/room
npm run build
npm run capture -- --label loop-rN --beauty
npm run capture:placement -- --label loop-rN
# or: npm run capture -- --label loop-rN --beauty --placement
```

### 5. What “done” looks like

- `demos/room/docs/PROMPT-TRUTH.md` → `ship_gate_met=true` only with evidence.
- Unanimous harsh critics: `prefer_ours` + `ship` on craft **and** placement.
- No residual “sign behind wall” / clipping in placement library.

---

## Harness catalog (reusable artifacts)

Everything needed to re-run this project without chat history:

| Artifact | Path | Purpose |
|----------|------|---------|
| **Master prompt** | `prompt.md` (this file) | Bar, ship gate, Grok activation, placement rules, runbook |
| **Quality workflow** | `.grok/workflows/ramen-boba-loop.rhai` | Parallel impl → capture → critics; continue-stack; GitNexus |
| **Workflow README** | `.grok/README.md` | How to list/run/extend project workflows & personas |
| **Personas (token thrift)** | `.grok/personas/*.toml` | `cheap-critic`, `cheap-explore`, `focused-impl` effort overlays |
| **Visual rubric** | `demos/room/docs/VISUAL-BAR.md` | Scoring dimensions incl. placement |
| **Honesty log** | `demos/room/docs/PROMPT-TRUTH.md` | Gate open/closed; never invent YES |
| **Residuals backlog** | `demos/room/docs/LOOP-RESIDUALS.md` | System-mapped TODO for next implementers |
| **Critic reports** | `demos/room/docs/CRITIC-PASS-*.md` | Per-round evidence |
| **Beauty capture** | `demos/room/tools/capture.mjs` | Playwright PNGs; `--beauty` multi-angle |
| **Placement capture** | same tool + `--placement` / `npm run capture:placement` | Object/exterior angle library |
| **Camera bridge** | `demos/room/src/ShopCanvas.tsx` | `window.__shopSetCamera` presets |
| **Live stack** | `demos/room/src/**` | R3F shop — **continue**, do not rewrite |
| **GitNexus** | `npx gitnexus` + `AGENTS.md` / `CLAUDE.md` blocks | Impact/query before edits |
| **Shot archive** | `demos/room/shots/` | Labels: `loop-r*`, `*-placement`, jesse refs |
| **boplog bridge** | `scripts/sync-shop-from-boplog.mjs` + `demos/room/data/scene-map.json` | Same public project info as [boplog](https://kvnloo.github.io/boplog/); shop is the 3D surface |
| **Shop manifest** | `demos/room/public/data/shop-manifest.json` | Machine-readable artifacts (parallel to boplog `data/manifest.json`) |

### Parallel surface: boplog ↔ this shop (hybrid)

| Surface | Role |
|---------|------|
| **boplog** | SSOT — full public build log (`data/manifest.json` + year files) |
| **This room** | Same projects as **3D props**; presentation via `scene-map.json` |

**Hybrid (no drift):**

1. **Runtime** — shop fetches live boplog data on load (stale-while-revalidate: baked paint → live upgrade).
2. **Build** — `npm run prebuild` / CI checks out boplog `data/` → refreshes baked snapshot.
3. Never hand-edit `projects.json`.

```bash
export BOPLOG_DATA_DIR=~/workspace/boplog/data   # optional local
cd demos/room && npm run sync:boplog && npm run build
```

boplog `surfaces.interactivePortfolio` points here.

### Workflow ↔ prompt coupling (read this)

| Layer | Loads `prompt.md`? |
|-------|--------------------|
| Human `@prompt.md` in chat | Yes (attached context) |
| `/goal … prompt.md` | Goal text references it; agent should read file |
| `ramen-boba-loop` workflow | **Must** `read_file prompt.md` ship-gate + placement sections in bootstrap and critic prompts (wired in the Rhai script). Residuals still live in `LOOP-RESIDUALS.md`. |
| Mid-flight edit of `prompt.md` | Does **not** mutate an already-running run. **Relaunch** to pick up changes. |

### Stack law (non-negotiable for agents)

- **Continue** existing `demos/room`: React 19 + R3F + drei + three + postprocessing + Vite + Playwright.
- **Never** rewrite from scratch or swap engines.
- Prefer **GitNexus CLI** over dumping whole files.
- **Critics NO** ⇒ fix residuals + recapture + **new workflow run** if the previous `complete()`d.

---

## Per-round contract

1. Read `prompt.md` ship gate + placement + `LOOP-RESIDUALS.md` + latest `CRITIC-PASS-*`.
2. Implement **one residual cluster** (prefer exterior brand/placement if failing).
3. `npm run build`.
4. Beauty capture **and** placement library.
5. Parallel harsh critics (materials / lighting / composition+**placement**).
6. Write `CRITIC-PASS-<label>.md`, refresh residuals + `PROMPT-TRUTH.md`.
7. If not unanimous ship → next round or **relaunch workflow** with higher `start_round`.

Systems (parallel when file-owned):

| System | Primary paths |
|--------|----------------|
| Shop shell + brand exterior | `src/shop/ShopShell.tsx` (`NeonBrandSign`, walls, awning) |
| Lighting / post | `src/ShopCanvas.tsx` |
| Ramen | `src/img2threejs/createRamenBowlModel.ts` |
| Boba | `src/img2threejs/createBobaCupPairModel.ts` |
| Portals | `src/shop/ProjectHotspots.tsx` |
| Capture / cameras | `tools/capture.mjs`, `ShopCanvas` presets |

---

## How to run on Grok (quick)

### Option A — Workflow (preferred)

```text
/effort high
/workflow ramen-boba-loop {"rounds":12,"start_round":1}
```

### Option B — Goal

```text
/effort high
/goal Execute portfolio/prompt.md until ship gate YES with beauty + placement evidence.
```

### Option C — Main session manual fan-out

```text
@prompt.md — spawn system implementers + placement-aware critics; capture beauty and
placement libraries; loop until YES. Continue demos/room stack only.
```

### Does not work

- Typing `ultracode` on Grok  
- `/effort high` alone  
- `/effort xhigh` on grok-4.5  
- Soft-stop when `ship: false`  
- Assuming a running workflow re-reads `prompt.md` without relaunch  

---

## One-liner (new session)

```text
/effort high
@prompt.md — run ramen-boba-loop; continue until critics prefer ours AND exterior
brand/placement pass. Beauty + placement capture every round. Do not soft-stop.
```
