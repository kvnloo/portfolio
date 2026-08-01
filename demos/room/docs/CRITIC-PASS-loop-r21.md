# Critic pass — loop-r21 (harsh, jesse-zhou blind bar)

**Date:** 2026-07-30  
**Capture label:** `loop-r21`  
**capture_ok:** **true** (beauty multi-angle + placement library + chrome pack; non-black frames)  
**Rubric:** `docs/VISUAL-BAR.md` (dims materials · lighting · read · place · **chrome** · **camux**)  
**Ship gate:** unanimous ship required among usable critics  
**Reference:** `shots/ref-jesse-zhou-02.png` (primary)  
**Our shots:**  
- Beauty: `shots/loop-r21/` (`01-beauty-hero.png` … `06-beauty-overhead.png`)  
- Placement: `shots/loop-r21-placement/` (18 stills)  
- Chrome: `shots/loop-r21-chrome/` (`01-chrome-hero` … `05-chrome-mobile`)

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
| **materials** | ~3–4 | **NO** | **NO** | Boba: weak plastic transmission/liquid SSS/condensation; pearls as opaque beads; ramen matte broth + plastic toppings, ceramic clearcoat weak under key; noren flat two-tone color cards—no weave/sheen/thickness; stool tops blown specular hotspots = plastic not varnish; counter rail/floor stretched specular under warm strip flattens grain; neon legible segments, not glass-tube material response |
| **lighting** | ~3–4 | **NO** | **NO** | Flat gray ground / weak cool street bounce — no night-market fill story; warm strip over rail/floor flattens grain vs photographed kiosk |
| **read** | ~5–6 | **NO** | **NO** | Neon segments legible; brand mass OK; craft still segment/panel emissive vs glass-tube hierarchy; surface detail below bar |
| **placement** | ~5–6 | **NO** | **NO** | Library present (18 stills); hero counter too sparse—food/hotspots fail to sell kiosk density; not critic-cleared under product gate |
| **chrome** | ~5–6 | **NO** | **NO** | Pack present; ticket/menu aim night-shop; dense panel + mobile empty stage; cohesion not ≥8 |
| **camux** | ~5 | **NO** | **NO** | Hero frames full shop; FOV/damping not disproven; mobile white-void + label stack hurt UX; ground still gray stage not street fill |
| **Aggregate** | **≪ 8** | **0/6** | **0/6** | Fail ship bar (need avg ≥ 8, no score &lt; 7; unanimous ship) |

## Verdict

**DO NOT SHIP.** Gate **OPEN**. prefer_ours = false (0/6). ship_votes = 0/6.

Captures are **evidence-valid** (`capture_ok=true`; full product pack beauty+placement+**chrome**) but **craft still below jesse-class product**. Weak boba transmission + opaque pearls, plastic ramen, flat noren, blown stool/rail/floor specular, neon segments-not-tubes, flat gray ground / weak cool street bounce, and sparse hero counter keep hobby-WebGL. Blind pick remains **jesse-zhou**.

## Critic residuals (carry to `LOOP-RESIDUALS.md`)

1. **Boba** — weak plastic transmission/liquid SSS/condensation; pearls as opaque beads **(C)**  
2. **Ramen** — matte broth + plastic toppings; ceramic clearcoat weak under key **(C)**  
3. **Noren** — flat two-tone color cards—no weave/sheen/thickness **(C)**  
4. **Stool tops** — blown specular hotspots = plastic not varnish **(C)**  
5. **Counter rail/floor** — stretched specular under warm strip flattens grain **(C)** · **(A)**  
6. **Neon** — legible segments, not glass-tube material response **(C)** · **(read)**  
7. **Lighting** — flat gray ground / weak cool street bounce — no night-market fill story **(A)**  
8. **Hero counter density** — too sparse; food/hotspots fail to sell kiosk density **(B)**  
9. **Chrome cohesion** — pack present; dense panel + mobile empty stage not ship-clear **(D)**  
10. **Placement / camux** — libraries present; sparse counter + stage void not unanimous-cleared **(B)** · **(E)**

## Loop contract check

1. Capture `loop-r21` product pack (beauty + placement + chrome) — **done, OK** (`capture_ok=true`)  
2. Independent harsh critics (6 usable dims) — **done**  
3. Unanimous ship — **failed (0)**  
4. Prefer ours blind — **failed (0)**  
5. Record this file + refresh residuals + PROMPT-TRUTH — **this pass**
