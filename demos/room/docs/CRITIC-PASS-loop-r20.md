# Critic pass — loop-r20 (harsh, jesse-zhou blind bar)

**Date:** 2026-07-30  
**Capture label:** `loop-r20`  
**capture_ok:** **true** (beauty multi-angle + placement library + chrome pack; non-black frames)  
**Rubric:** `docs/VISUAL-BAR.md` (dims materials · lighting · read · place · **chrome** · **camux**)  
**Ship gate:** unanimous ship required among usable critics  
**Reference:** `shots/ref-jesse-zhou-02.png` (primary)  
**Our shots:**  
- Beauty: `shots/loop-r20/` (`01-beauty-hero.png` … `06-beauty-overhead.png`)  
- Placement: `shots/loop-r20-placement/` (18 stills)  
- Chrome: `shots/loop-r20-chrome/` (`01-chrome-hero` … `05-chrome-mobile`)

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
| **materials** | ~3–4 | **NO** | **NO** | Boba chalky opaque cups—no plastic transmission, liquid SSS, condensation; ramen broth/toppings matte plastic; ceramic glaze/clearcoat weak vs bar; noren/curtains flat color cards—no weave, sheen, thickness; stool tops blown specular hotspots = plastic not wood varnish; counter wood OK but floor/rail stretched specular streaks fake under key; neon readable but panel emissive not glass-tube response |
| **lighting** | ~3–4 | **NO** | **NO** | Sparse bounce + black void underexposes exterior/side wood (not night-kiosk fill); warm underglow/specular strip flattens counter grain + stool tops |
| **read** | ~5–6 | **NO** | **NO** | Neon channel letters legible; brand mass OK; craft still panel-emissive vs glass-tube hierarchy; surface detail below bar |
| **placement** | ~5–6 | **NO** | **NO** | Library present (18 stills); marquee/props grounded OK; not critic-cleared—void framing + material/lighting stack fail product gate |
| **chrome** | ~5–6 | **NO** | **NO** | Pack present; ticket/menu aim night-shop; dense panel + mobile empty stage; cohesion not ≥8 |
| **camux** | ~5 | **NO** | **NO** | Hero frames full shop; FOV/damping not disproven; mobile white-void + label stack hurt UX; exterior still black stage not street |
| **Aggregate** | **≪ 8** | **0/6** | **0/6** | Fail ship bar (need avg ≥ 8, no score &lt; 7; unanimous ship) |

## Verdict

**DO NOT SHIP.** Gate **OPEN**. prefer_ours = false (0/6). ship_votes = 0/6.

Captures are **evidence-valid** (`capture_ok=true`; full product pack beauty+placement+**chrome**) but **craft still below jesse-class product**. Counter wood improved (OK) yet plastic food/flat fabric/hot stool+floor specular + sparse bounce void keep hobby-WebGL. Blind pick remains **jesse-zhou**.

## Critic residuals (carry to `LOOP-RESIDUALS.md`)

1. **Boba** — chalky opaque cups; no plastic transmission, liquid SSS, or condensation **(C)**  
2. **Ramen** — broth/toppings matte plastic; ceramic glaze/clearcoat weak vs bar **(C)**  
3. **Noren/curtains** — flat color cards—no weave, sheen, or thickness **(C)**  
4. **Stool tops** — blown specular hotspots read as plastic, not wood varnish **(C)**  
5. **Floor/rail** — stretched specular streaks fake under key (counter wood OK) **(C)**  
6. **Neon** — readable but panel emissive, not glass-tube material response **(C)** · **(read)**  
7. **Lighting** — sparse bounce + black void underexposes exterior/side wood (not night-kiosk fill) **(A)**  
8. **Warm underglow/specular strip** — flattens counter grain and stool tops **(A)** · **(C)**  
9. **Chrome cohesion** — pack present; dense panel + mobile empty stage not ship-clear **(D)**  
10. **Placement / camux** — libraries present; not unanimous-cleared under full product gate **(B)** · **(E)**

## Loop contract check

1. Capture `loop-r20` product pack (beauty + placement + chrome) — **done, OK** (`capture_ok=true`)  
2. Independent harsh critics (6 usable dims) — **done**  
3. Unanimous ship — **failed (0)**  
4. Prefer ours blind — **failed (0)**  
5. Record this file + refresh residuals + PROMPT-TRUTH — **this pass**
