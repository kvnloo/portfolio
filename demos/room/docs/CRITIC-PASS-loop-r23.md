# Critic pass — loop-r23 (harsh, jesse-zhou blind bar)

**Date:** 2026-07-30  
**Capture label:** `loop-r23`  
**capture_ok:** **true** (beauty multi-angle + placement library + chrome pack; non-black frames)  
**Rubric:** `docs/VISUAL-BAR.md` (dims materials · lighting · read · place · **chrome** · **camux**)  
**Ship gate:** unanimous ship required among usable critics  
**Reference:** `shots/ref-jesse-zhou-02.png` (primary)  
**Our shots:**  
- Beauty: `shots/loop-r23/` (`01-beauty-hero.png` … `06-beauty-overhead.png`)  
- Placement: `shots/loop-r23-placement/` (18 stills)  
- Chrome: `shots/loop-r23-chrome/` (`01-chrome-hero` … `05-chrome-mobile`)

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
| **materials** | ~3–4 | **NO** | **NO** | Ramen reads as empty shell + rim, not broth/topping materials under warm key; noren/back panels flat pink plastic planes (wash midtones into mush); stool/counter varnish = hot specular blobs, toy clearcoat not shop wood; neon is dim LED-dot marquee, not glass-tube neon material response; sink/faucet/metal read default gray plastic — no readable metal response |
| **lighting** | ~3–4 | **NO** | **NO** | Flat gray stage ground — no cool night-street bounce/edge fill; pink-magenta interior wash (strip+noren) reads mystical soup before night kiosk; magenta fill + hero distance erase grain/food detail vs counter close-ups |
| **read** | ~5–6 | **NO** | **NO** | Neon dim LED-dot marquee, not glass-tube hierarchy; brand mass OK at distance; surface detail below bar under magenta wash |
| **placement** | ~5–6 | **NO** | **NO** | Library present (18 stills); hero distance still not selling photographed kiosk density vs jesse; not critic-cleared under product gate |
| **chrome** | ~5–6 | **NO** | **NO** | Pack present; ticket/menu aim night-shop; dense panel + mobile empty stage; cohesion not ≥8 |
| **camux** | ~5 | **NO** | **NO** | Hero distance + magenta fill erase grain/food detail vs counter close-ups; FOV/damping not disproven; mobile white-void + label stack hurt UX; ground still gray stage not street fill |
| **Aggregate** | **≪ 8** | **0/6** | **0/6** | Fail ship bar (need avg ≥ 8, no score &lt; 7; unanimous ship) |

## Verdict

**DO NOT SHIP.** Gate **OPEN**. prefer_ours = false (0/6). ship_votes = 0/6.

Captures are **evidence-valid** (`capture_ok=true`; full product pack beauty+placement+**chrome**) but **craft still below jesse-class product**. Ramen empty shell + rim (not broth/toppings under warm key), flat pink plastic noren/back panels, stool/counter toy clearcoat blobs, dim LED-dot neon (not glass-tube), gray-plastic sink/faucet/metal, pink-magenta interior wash before night kiosk, flat gray stage ground with no cool night-street bounce/edge fill, and hero distance + magenta fill erasing grain/food detail keep hobby-WebGL. Blind pick remains **jesse-zhou**.

## Critic residuals (carry to `LOOP-RESIDUALS.md`)

1. **Ramen** — empty shell + rim, not broth/topping materials under warm key **(C)**  
2. **Noren/back panels** — flat pink plastic planes; wash midtones into mush **(C)** · **(A)**  
3. **Stool/counter varnish** — hot specular blobs, toy clearcoat not shop wood **(C)**  
4. **Neon** — dim LED-dot marquee, not glass-tube neon material response **(C)** · **(read)**  
5. **Sink/faucet/metal** — default gray plastic; no readable metal response **(C)**  
6. **Hero / camux** — hero distance + magenta fill erases grain/food detail vs counter close-ups **(E)** · **(A)**  
7. **Lighting** — pink-magenta interior wash (strip+noren) reads mystical soup before night kiosk **(A)**  
8. **Lighting** — flat gray stage ground — no cool night-street bounce/edge fill **(A)**  
9. **Chrome cohesion** — pack present; dense panel + mobile empty stage not ship-clear **(D)**  
10. **Placement** — library present; hero density not unanimous-cleared **(B)**

## Loop contract check

1. Capture `loop-r23` product pack (beauty + placement + chrome) — **done, OK** (`capture_ok=true`)  
2. Independent harsh critics (6 usable dims) — **done**  
3. Unanimous ship — **failed (0)**  
4. Prefer ours blind — **failed (0)**  
5. Record this file + refresh residuals + PROMPT-TRUTH — **this pass**
