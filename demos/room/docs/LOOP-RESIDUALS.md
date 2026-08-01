# Loop residuals — Kevin's Ramen & Boba

**Date:** 2026-07-31  
**Bar:** harsh blind compare vs **jesse-zhou.com** (`prompt.md` ship gate)  
**Rubric:** `docs/VISUAL-BAR.md` (dims 1–13 incl. **chrome/brand #12**, **camera/UX #13**)  
**Honesty:** `docs/PROMPT-TRUTH.md` · latest full critic `docs/CRITIC-PASS-loop-r32.md`  
**Ship gate:** **OPEN** — not met; continue loop · **No implement this pass** (backlog only)

| Field (loop-r32) | Value |
|------------------|------:|
| last full critic label | `loop-r32` |
| capture_ok (beauty multi-angle) | **true** |
| placement library | `shots/loop-r32-placement/` present (18 stills) |
| chrome pack | `shots/loop-r32-chrome/` **present** (5 stills) |
| usable_critics / ship / prefer | **6 / 0 / 0** (materials · lighting · read · placement · chrome · camux) |
| Unanimous ship | required → **failed** |
| Gate | **OPEN** |

Systems tags: `shell` · `lighting` · `ramen` · `boba` · `ui` · `camera` · `portals` · `capture`

**Priority this pass (explore):** **(A)** lighting/style first → **(D)** chrome/brand when overlays clash with 3D hero → **(B)/(E)** placement + camera/UX → **(C)** materials last among product dims.  
Do not retire items without `npm run capture:product` (beauty + placement + **chrome**) → harsh critics.

**Workflow v4 product gate:** materials · lighting · read · place · **chrome** · **camux**.

---

## GitNexus (status snapshot)

`npx gitnexus status` / `query` not runnable in this subagent (no shell). Index meta (`.gitnexus/meta.json`) re-read:

| Field | Value |
|-------|--------|
| repo | **portfolio** |
| nodes / edges / processes | **756** / **1225** / **42** |
| branch | `dev` |
| indexedAt | 2026-07-30T17:19:47Z |
| lastCommit | `af0ffa1a…` |
| query intent | ShopCanvas · App · styles · chrome · neon · lighting |

Symbols of note: `ShopCanvas` (`CAMERA_PRESETS`, Bloom, exposure/fog/lights), `ShopShell` / `NeonBrandSign` / `NeonTube`, `App` / `styles.css` (stage chrome), `createRamenBowlModel`, `createBobaCupPairModel`, `ProjectHotspots`, `tools/capture.mjs` (beauty · placement · chrome packs).

---

## Best existing shot paths

| Role | Path | Notes |
|------|------|--------|
| **Best beauty** | `demos/room/shots/loop-r32/01-beauty-hero.png` | Valid; craft ≪ jesse; blue ground plane + fog mush |
| **Three-quarter (ground)** | `…/02-beauty-threeQuarter.png` | **(A)/(E)** blue ground + fog mush; faceted pink lantern balls + green trees = toy/mystical |
| **Front brand / noren** | `…/03-beauty-front.png` | **(A)/(C)** noren/metal flat; neon emissive mesh not glass |
| **Counter crop** | `…/04-beauty-counter.png` | **(B)/(C)** oversized floating ramen weak contact; ceramic/liquid no wet clearcoat+translucency; boba condensation white spheres not film/beads; wood no multi-lobe/edge wear |
| **Left neon** | `…/05-beauty-leftNeon.png` | **(A)/(E)/(C)** pink lanterns + green trees toy/mystical; neon emissive mesh not glass |
| **Placement library** | `shots/loop-r32-placement/` | **(B)** present; floating ramen + trees/lanterns clutter not ship-clear |
| **Chrome pack** | `shots/loop-r32-chrome/` | **(D)** pack present; dark SaaS panels ≠ ticket/shop craft |
| **Chrome mobile** | `…/05-chrome-mobile.png` | **(D)(E)** canvas crushed; bottom sheet + tab bar dominate |
| **Jesse bar** | `shots/ref-jesse-zhou-02.png` | Primary blind target — craft density wins |
| **Imagine upper bound** | `shots/imagine-v2/01-hero.png` | Still, not live 3D |

**Primary blind pair:** `loop-r32/01-beauty-hero.png` **vs** `ref-jesse-zhou-02.png`  
(+ threeQuarter/leftNeon for trees·lanterns + ground fill; counter for food/materials/contact; chrome pack for product UI).

---

## Current state (one line)

**Gate OPEN.** loop-r32 full product pack exists (beauty+placement+**chrome**); **0/6 ship**, **0/6 prefer ours**. Fail on **(A)** blue ground plane + fog mush (not night-street midtones); faceted pink lantern balls + green trees = toy/mystical env; noren/metal flat · **(D)** chrome panel still dark SaaS vs ticket/shop craft · **(B)/(E)** weak contact under oversized floating ramen; trees/lanterns clutter; cam framing · **(C)** boba condensation white spheres not film/beads; ceramic/liquid lack wet clearcoat + translucency under key; neon emissive mesh not glass; wood textured but no varnish multi-lobe/edge wear. Blind pick **jesse-zhou**.

Key code (verified):  
`/workspace/portfolio/demos/room/src/ShopCanvas.tsx` — exposure/fog/IBL/Bloom, FOV 36, Orbit damping, `CAMERA_PRESETS`  
`/workspace/portfolio/demos/room/src/shop/ShopShell.tsx` — shell/neon/noren/counter/stools  
`/workspace/portfolio/demos/room/src/App.tsx` + `styles.css` — stage chrome  
`/workspace/portfolio/demos/room/src/img2threejs/createRamenBowlModel.ts` · `createBobaCupPairModel.ts`  
`/workspace/portfolio/demos/room/tools/capture.mjs` — product packs (beauty · placement · chrome)

---

## Top residuals (priority **A → D → B/E → C**)

### 1. Lighting/ground — blue ground plane + fog mush (not night-street midtones) — `lighting` · `shell` · **(A)** · **OPEN**
- **Why:** r32 hero/threeQuarter: blue ground plane + fog mush — midtones fail vs night-street kiosk; not cool street bounce/edge fill.
- **Do:** Kill blue ground plane mush; retarget fog/ground to night-street midtones with cool bounce (not flat blue stage + fog soup); recover midtone separation without re-blowing bloom. Prefer fill over exposure crank.
- **Where:** `ShopCanvas.tsx` lights/fog/exposure/env; bounce/ground in `ShopShell.tsx`.
- **Prove:** hero + threeQuarter — ground not blue mush; night-street midtones sell; Lighting ≥ 8.

### 2. Style/env — faceted pink lantern balls + green trees = toy/mystical env — `shell` · `portals` · `lighting` · `camera` · **(A)** · **(E)** · **read** · **OPEN**
- **Why:** r32 leftNeon/threeQuarter: faceted pink lantern balls + green trees read toy/mystical env, not night-market kiosk; brand silhouette + neon + counter fail under env clutter.
- **Do:** Cull or re-scale faceted green trees; reduce pink lantern density/opacity/bloom mush so shop mass + neon remain readable at leftNeon and 3Q; separate style accents from hero massing; preserve neon + counter read at beauty distance.
- **Where:** env trees/lanterns `ShopShell.tsx` / `CitySquareEnv.tsx` / portals; `CAMERA_PRESETS` beauty framing.
- **Prove:** leftNeon + three-quarter + hero — exterior neon readable; shop not toy/mystical under trees/lantern balls; Lighting + Read + Camux ≥ 8.

### 3. Noren/metal flat; neon emissive mesh not glass — `lighting` · `shell` · **(A)** · **(C)** · **OPEN**
- **Why:** r32: noren/metal read flat (no weave/sheen/metal response); neon is emissive mesh, not glass-tube material.
- **Do:** Fix noren fabric weave/sheen under strip/warm-cool; restore metal specular on rails/hardware; glass-tube hierarchy for neon (tube + gas + housing), not emissive mesh.
- **Where:** noren/metal/neon `ShopShell.tsx` (`NeonBrandSign` / `NeonTube`); fills/IBL/bloom `ShopCanvas.tsx`.
- **Prove:** hero + front + leftNeon — fabric/metal/glass-tube readable; Lighting + Material + Read path clear.

### 4. Chrome / brand cohesion — panel still dark SaaS vs ticket/shop craft — `ui` · `capture` · **(D)** · **OPEN**
- **Why:** r32 chrome pack present; chrome panel still dark SaaS vs ticket/shop craft; cohesion not ≥8; risk of overlays fighting 3D hero.
- **Do:** Keep `capture:product` / `--chrome`. Retarget chrome to night-shop ticket/menu-board craft (not dark SaaS panels); one primary panel max; center banner only on select without covering food; share warm paper/ink tokens with 3D; fix mobile so canvas remains primary.
- **Where:** `App.tsx`, `styles.css`; `tools/capture.mjs`.
- **Prove:** chrome pack + mobile; VISUAL-BAR chrome ≥ 8; no hierarchy fail / brand split.

### 5. Placement — weak contact under oversized floating ramen — `ramen` · `shell` · `capture` · **(B)** · **OPEN**
- **Why:** r32: oversized ramen floats with weak contact shadow/settling; density/contact not critic-cleared; trees/lanterns still clutter shop.
- **Do:** Scale ramen to counter-coherent size; settle bowl with contact shadow (no float); densify counter food contact without occlusion after env cull; keep portal rings as accents not washes.
- **Where:** ramen transform/contact `createRamenBowlModel.ts` / counter layout `ShopShell.tsx`; trees/lanterns env; `CAMERA_PRESETS` + `PLACEMENT_PRESETS`.
- **Prove:** counter + hero + placement packs — bowl grounded, scale coherent; Placement pass.

### 6. Camera / UX — trees/lanterns + mobile — `camera` · `ui` · **(E)** · **OPEN**
- **Why:** leftNeon/3Q framing loses kiosk read under faceted pink lantern balls + green trees; chrome mobile crushes canvas under sheet/tabs.
- **Do:** Keep Orbit calm; leftNeon + three-quarter + hero framing preserves neon + shop when env fixed; fix mobile stack so canvas + panel both read without drowning the shop.
- **Where:** `ShopCanvas.tsx`; `App.tsx` / CSS; env/noren hang `ShopShell.tsx`.
- **Prove:** multi-angle + chrome mobile; Camera/UX ≥ 8.

### 7. Boba — condensation = white spheres, not film/beads — `boba` · **(C)** · **OPEN**
- **Why:** r32: boba condensation reads as white spheres, not film/beads (fails plastic+pearl craft).
- **Do:** Replace sphere condensation with film/bead condensate on dome/cup; liquid IOR/color depth + transmission; pearls with readable refraction/volume.
- **Where:** `createBobaCupPairModel.ts`.
- **Prove:** counter crop + hero boba mass; Not-toy ≥ 8.

### 8. Ceramic/liquid — lack wet clearcoat + translucency under key — `ramen` · **(C)** · **OPEN**
- **Why:** r32 counter: ceramic/liquid lack wet clearcoat + translucency under key — dry plastic read, not glaze+food.
- **Do:** Wet ceramic clearcoat + liquid translucency under warm key; broth/glaze/toppings that hold at counter crop.
- **Where:** `createRamenBowlModel.ts`.
- **Prove:** counter crop + hero food mass; Not-toy ≥ 8.

### 9. Counter wood — textured but no varnish multi-lobe/edge wear — `shell` · **(C)** · **OPEN**
- **Why:** r32: wood is textured but lacks varnish multi-lobe specular + edge wear (not worn varnish craft).
- **Do:** Multi-lobe varnish response + edge wear under warm key; keep grain + edge contact readable at counter crop.
- **Where:** counter materials `ShopShell.tsx`.
- **Prove:** counter crop + three-quarter; Material ≥ 8.

**Capture residual (`capture`):** beauty+placement+chrome OK for r32 (`capture_ok=true`). **Always** keep `--chrome` / `capture:product`. Never ship on harness alone.

---

## Explicit non-goals this pass

- Implement code (this pass = residuals only).
- Declare ship / invent YES.
- Lower jesse bar.
- Material micro-polish while **(A)** blue ground plane + fog mush / faceted pink lantern balls + green trees still fail gate.
- Chrome polish that ignores **(A)** lighting/style (dark SaaS cannot save blue ground mush + toy/mystical env).
- Replace live R3F with Imagine stills only.

---

## Loop contract

1. Fix order: **#1–#3 (A)** blue ground + fog mush / trees+lanterns / noren-metal-neon → **#4 (D)** chrome ticket/shop craft → **#5–#6 (B/E)** floating ramen contact + camera/UX → **#7–#9 (C)** materials (boba condensate / ceramic-liquid wet / wood multi-lobe).  
2. `cd demos/room && npm run build && npm run capture:product -- --label <round>`  
   (= beauty + placement + **chrome**).  
3. Harsh critics on all three packs + VISUAL-BAR + `ref-jesse-zhou-02.png` → unanimous ship only.  
4. Record `CRITIC-PASS-*.md`; update `PROMPT-TRUTH.md`.  
5. Stop only on prefer-ours + placement + chrome + craft pass.

**Status:** Gate **OPEN**. Top residuals: **(A)** blue ground plane + fog mush (not night-street midtones); faceted pink lantern balls + green trees = toy/mystical env; noren/metal flat + neon emissive mesh not glass · **(D)** chrome panel still dark SaaS vs ticket/shop craft · **(B)/(E)** weak contact under oversized floating ramen; cam/UX · **(C)** boba condensation white spheres not film/beads; ceramic/liquid lack wet clearcoat + translucency; wood no varnish multi-lobe/edge wear. No ship without harsh critic YES.
