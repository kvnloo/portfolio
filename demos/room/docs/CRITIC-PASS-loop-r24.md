# Critic pass — loop-r24 (harsh, jesse-zhou blind bar)

**Date:** 2026-07-30  
**Capture label:** `loop-r24`  
**capture_ok:** **true** (beauty multi-angle + placement library + chrome pack; non-black frames)  
**Rubric:** `docs/VISUAL-BAR.md` (dims materials · lighting · read · place · **chrome** · **camux**)  
**Ship gate:** unanimous ship required among usable critics  
**Reference:** `shots/ref-jesse-zhou-02.png` (primary)  
**Our shots:**  
- Beauty: `shots/loop-r24/` (`01-beauty-hero.png` … `06-beauty-overhead.png`)  
- Placement: `shots/loop-r24-placement/` (18 stills)  
- Chrome: `shots/loop-r24-chrome/` (`01-chrome-hero` … `05-chrome-mobile`)

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
| **materials** | ~3–4 | **NO** | **NO** | Ramen interior lacks broth/noodles/topping materials; boba is opaque toy cup + pipe straw (no liquid translucency); neon is faceted mesh not readable glass-tube; hero props still plastic/procedural vs food craft |
| **lighting** | ~3–4 | **NO** | **NO** | Flat gray stage ground — no cool night-street bounce/edge fill; pink-magenta noren/strip wash reads mystical mush before night kiosk; magenta wash flattens rear menu boards into mush |
| **read** | ~5–6 | **NO** | **NO** | Neon faceted mesh not glass-tube hierarchy; brand mass OK at distance; menu boards mush under magenta wash |
| **placement** | ~5–6 | **NO** | **NO** | Library present; flat yellow mat + cyan portal rings wash counter contact/detail; hero density not critic-cleared |
| **chrome** | ~5–6 | **NO** | **NO** | Pack present; ticket/menu aim night-shop; dense panel + mobile empty stage; cohesion not ≥8 |
| **camux** | ~5 | **NO** | **NO** | Magenta wash + mat/portal wash erase counter contact; FOV/damping not disproven; mobile white-void + label stack hurt UX; ground still gray stage |
| **Aggregate** | **≪ 8** | **0/6** | **0/6** | Fail ship bar (need avg ≥ 8, no score &lt; 7; unanimous ship) |

## Verdict

**DO NOT SHIP.** Gate **OPEN**. prefer_ours = false (0/6). ship_votes = 0/6.

Captures are **evidence-valid** (`capture_ok=true`; full product pack beauty+placement+**chrome**) but **craft still below jesse-class product**. Ramen lacks broth/noodles/toppings, boba opaque toy + pipe straw, neon faceted mesh not glass-tube, hero props plastic/procedural, magenta wash mush on menu boards + noren/strip mystical before night kiosk, flat yellow mat + cyan portal rings wash counter contact, flat gray stage ground with no cool night-street bounce/edge fill. Blind pick remains **jesse-zhou**.

## Critic residuals (carry to `LOOP-RESIDUALS.md`)

1. **Ramen** — interior lacks broth/noodles/topping materials **(C)**  
2. **Boba** — opaque toy cup + pipe straw; no liquid translucency **(C)**  
3. **Menu boards** — magenta wash flattens rear menus into mush **(A)** · **(C)**  
4. **Neon** — faceted mesh, not readable glass-tube material **(C)** · **(read)**  
5. **Counter contact** — flat yellow mat + cyan portal rings wash contact/detail **(B)** · **(E)**  
6. **Hero props** — still plastic/procedural vs food craft **(C)**  
7. **Lighting** — pink-magenta noren/strip wash reads mystical mush before night kiosk **(A)**  
8. **Lighting** — flat gray stage ground — no cool night-street bounce/edge fill **(A)**  
9. **Chrome cohesion** — pack present; dense panel + mobile empty stage not ship-clear **(D)**  
10. **Camux** — magenta + mat/portal wash; hero framing not ≥8 **(E)**

## Loop contract check

1. Capture `loop-r24` product pack (beauty + placement + chrome) — **done, OK** (`capture_ok=true`)  
2. Independent harsh critics (6 usable dims) — **done**  
3. Unanimous ship — **failed (0)**  
4. Prefer ours blind — **failed (0)**  
5. Record this file + refresh residuals + PROMPT-TRUTH — **this pass**
