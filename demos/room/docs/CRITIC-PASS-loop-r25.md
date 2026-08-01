# Critic pass — loop-r25 (harsh, jesse-zhou blind bar)

**Date:** 2026-07-30  
**Capture label:** `loop-r25`  
**capture_ok:** **true** (beauty multi-angle + placement library + chrome pack; non-black frames)  
**Rubric:** `docs/VISUAL-BAR.md` (dims materials · lighting · read · place · **chrome** · **camux**)  
**Ship gate:** unanimous ship required among usable critics  
**Reference:** `shots/ref-jesse-zhou-02.png` (primary)  
**Our shots:**  
- Beauty: `shots/loop-r25/` (`01-beauty-hero.png` … `06-beauty-overhead.png`)  
- Placement: `shots/loop-r25-placement/` (18 stills)  
- Chrome: `shots/loop-r25-chrome/` (`01-chrome-hero` … `05-chrome-mobile`)

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
| **materials** | ~3–4 | **NO** | **NO** | Ramen: empty mottled shell—no broth/noodles/toppings/liquid clearcoat; boba: opaque purple toy cup + pipe straw (no transmission/condensation); neon: faceted emissive mesh, not glass-tube material hierarchy; hero props still procedural toys vs food-craft materials |
| **lighting** | ~3–4 | **NO** | **NO** | Flat gray/blue stage ground; no cool night-street bounce/edge fill; pink-magenta noren/rear wash = mystical mush before night kiosk; rear noren/menu panels flat magenta plastic mush under strip light |
| **read** | ~5–6 | **NO** | **NO** | Neon faceted emissive mesh not glass-tube hierarchy; brand mass OK at distance; rear menu/noren mush under strip + magenta wash |
| **placement** | ~5–6 | **NO** | **NO** | Library present; yellow mat + cyan portal rings wash counter contact/specular read; hero density not critic-cleared |
| **chrome** | ~5–6 | **NO** | **NO** | Pack present; ticket/menu aim night-shop; dense panel + mobile empty stage; cohesion not ≥8 |
| **camux** | ~5 | **NO** | **NO** | Magenta/noren wash + yellow mat/cyan portal rings erase counter contact/specular; FOV/damping not disproven; mobile sheet stack hurts UX; ground still gray/blue stage |
| **Aggregate** | **≪ 8** | **0/6** | **0/6** | Fail ship bar (need avg ≥ 8, no score &lt; 7; unanimous ship) |

## Verdict

**DO NOT SHIP.** Gate **OPEN**. prefer_ours = false (0/6). ship_votes = 0/6.

Captures are **evidence-valid** (`capture_ok=true`; full product pack beauty+placement+**chrome**) but **craft still below jesse-class product**. Ramen empty mottled shell (no broth/noodles/toppings/liquid clearcoat), boba opaque purple toy cup + pipe straw (no transmission/condensation), neon faceted emissive mesh not glass-tube hierarchy, hero props procedural toys vs food craft, rear noren/menu panels flat magenta plastic mush under strip light, pink-magenta noren/rear wash mystical before night kiosk, yellow mat + cyan portal rings wash counter contact/specular, flat gray/blue stage ground with no cool night-street bounce/edge fill. Blind pick remains **jesse-zhou**.

## Critic residuals (carry to `LOOP-RESIDUALS.md`)

1. **Ramen** — empty mottled shell—no broth/noodles/toppings/liquid clearcoat **(C)**  
2. **Boba** — opaque purple toy cup + pipe straw; no transmission/condensation **(C)**  
3. **Neon** — faceted emissive mesh, not glass-tube material hierarchy **(C)** · **(read)**  
4. **Counter contact** — yellow mat + cyan portal rings wash counter contact/specular read **(B)** · **(E)**  
5. **Rear noren/menu** — flat magenta plastic mush under strip light **(A)** · **(C)**  
6. **Hero props** — still procedural toys vs food-craft materials **(C)**  
7. **Lighting** — pink-magenta noren/rear wash = mystical mush before night kiosk **(A)**  
8. **Lighting** — flat gray/blue stage ground; no cool night-street bounce/edge fill **(A)**  
9. **Chrome cohesion** — pack present; dense panel + mobile empty stage not ship-clear **(D)**  
10. **Camux** — wash + mat/portal specular kill; hero framing not ≥8 **(E)**

## Loop contract check

1. Capture `loop-r25` product pack (beauty + placement + chrome) — **done, OK** (`capture_ok=true`)  
2. Independent harsh critics (6 usable dims) — **done**  
3. Unanimous ship — **failed (0)**  
4. Prefer ours blind — **failed (0)**  
5. Record this file + refresh residuals + PROMPT-TRUTH — **this pass**
