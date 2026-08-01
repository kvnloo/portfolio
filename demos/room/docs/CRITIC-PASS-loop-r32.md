# Critic pass — loop-r32 (harsh, jesse-zhou blind bar)

**Date:** 2026-07-31  
**Capture label:** `loop-r32`  
**capture_ok:** **true** (beauty multi-angle + placement library + chrome pack; non-black frames)  
**Rubric:** `docs/VISUAL-BAR.md` (dims materials · lighting · read · place · **chrome** · **camux**)  
**Ship gate:** unanimous ship required among usable critics  
**Reference:** `shots/ref-jesse-zhou-02.png` (primary)  
**Our shots:**  
- Beauty: `shots/loop-r32/` (`01-beauty-hero.png` … `06-beauty-overhead.png`)  
- Placement: `shots/loop-r32-placement/` (18 stills)  
- Chrome: `shots/loop-r32-chrome/` (`01-chrome-hero` … `05-chrome-mobile`)

## Scores / ship / prefer

| Field | Value |
|-------|------:|
| usable_critics | 6 (materials · lighting · read · placement · chrome · camux) |
| ship_votes | 0 |
| prefer_votes | 0 |
| ship | **false** |
| prefer_ours | **false** |
| Unanimous ship | **required → not met** |
| Gate | **OPEN** |
| Blind pick | **jesse-zhou** |

### Six-critic table (workflow v4 product gate)

| Critic | Score (≈) | Ship | Prefer ours | Notes |
|--------|----------:|:----:|:-----------:|-------|
| **materials** | ~3–4 | **NO** | **NO** | Boba condensation = white spheres, not film/beads; ceramic/liquid lack wet clearcoat + translucency under key; noren/metal flat; neon emissive mesh not glass; wood textured but no varnish multi-lobe/edge wear |
| **lighting** | ~3–4 | **NO** | **NO** | Blue ground plane + fog mush (not night-street midtones); ceramic/liquid fail to show wet response under key; env pink lanterns + green trees compete with warm kiosk story |
| **read** | ~3–4 | **NO** | **NO** | Faceted pink lantern balls + green trees = toy/mystical env not kiosk; neon emissive mesh undercuts glass-tube brand; noren/metal flat mute shop materials hierarchy |
| **placement** | ~3–4 | **NO** | **NO** | Weak contact under oversized floating ramen; density/contact not critic-cleared; env trees/lanterns still clutter shop silhouette |
| **chrome** | ~4–5 | **NO** | **NO** | Pack present; chrome panel still dark SaaS vs ticket/shop craft; cohesion not ≥8 |
| **camux** | ~3–4 | **NO** | **NO** | STYLE/FRAME: faceted pink lantern balls + green trees read toy/mystical not kiosk; FOV/damping not disproven; mobile sheet stack still hurts UX |
| **Aggregate** | **≪ 8** | **0/6** | **0/6** | Fail ship bar (need avg ≥ 8, no score &lt; 7; unanimous ship) |

## Verdict

**DO NOT SHIP.** Gate **OPEN**. prefer_ours = false (0/6). ship_votes = 0/6.

Captures are **evidence-valid** (`capture_ok=true`; full product pack beauty+placement+**chrome**) but **craft still below jesse-class product**. Boba condensation reads as white spheres, not film/beads. Ceramic/liquid lack wet clearcoat + translucency under key. Noren/metal flat; neon is emissive mesh, not glass. Weak contact under oversized floating ramen. Wood textured but no varnish multi-lobe/edge wear. Chrome panel still dark SaaS vs ticket/shop craft. Blue ground plane + fog mush (not night-street midtones). Faceted pink lantern balls + green trees = toy/mystical env. Blind pick remains **jesse-zhou**.

## Critic residuals (carry to `LOOP-RESIDUALS.md`)

1. **Boba** — condensation = white spheres, not film/beads **(C)**  
2. **Ceramic/liquid** — lack wet clearcoat + translucency under key **(C)**  
3. **Noren/metal** — flat; **neon** emissive mesh not glass **(C)** · **(A)**  
4. **Ramen placement** — weak contact under oversized floating ramen **(B)**  
5. **Counter wood** — textured but no varnish multi-lobe/edge wear **(C)**  
6. **Chrome** — panel still dark SaaS vs ticket/shop craft **(D)**  
7. **Lighting/ground** — blue ground plane + fog mush (not night-street midtones) **(A)**  
8. **Style/env** — faceted pink lantern balls + green trees = toy/mystical env **(A)** · **(E)** · **read**  
9. **Placement / camux** — floating ramen + trees/lanterns clutter; density + framing not ship-clear **(B)** · **(E)**

## Loop contract check

1. Capture `loop-r32` product pack (beauty + placement + chrome) — **done, OK** (`capture_ok=true`)  
2. Independent harsh critics (6 usable dims) — **done**  
3. Unanimous ship — **failed (0)**  
4. Prefer ours blind — **failed (0)**  
5. Record this file + refresh residuals + PROMPT-TRUTH — **this pass**
