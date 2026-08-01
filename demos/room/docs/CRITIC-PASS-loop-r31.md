# Critic pass — loop-r31 (harsh, jesse-zhou blind bar)

**Date:** 2026-07-31  
**Capture label:** `loop-r31`  
**capture_ok:** **true** (beauty multi-angle + placement library + chrome pack; non-black frames)  
**Rubric:** `docs/VISUAL-BAR.md` (dims materials · lighting · read · place · **chrome** · **camux**)  
**Ship gate:** unanimous ship required among usable critics  
**Reference:** `shots/ref-jesse-zhou-02.png` (primary)  
**Our shots:**  
- Beauty: `shots/loop-r31/` (`01-beauty-hero.png` … `06-beauty-overhead.png`)  
- Placement: `shots/loop-r31-placement/` (18 stills)  
- Chrome: `shots/loop-r31-chrome/` (`01-chrome-hero` … `05-chrome-mobile`)

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
| **materials** | ~3–4 | **NO** | **NO** | Ramen interior under warm key: broth/egg/noodles glossy plastic mush, not glaze+food; boba cups: weak liquid transmission/condensation — stack reads toy, not plastic+pearl; noren/fabric: flat teal slabs, no weave or sheen under strip light; back-bar bottles/faucet: washed gray primitives, metal/clearcoat illegible; wood grain OK at counter but varnish uniform specular sheet, not variation; neon: readable but soft extruded plastic, not glass-tube material response |
| **lighting** | ~3–4 | **NO** | **NO** | Weak warm-key/cool-fill; blue ground mush; 3Q yellow orbs steal key; strip light flattens noren/fabric with no sheen response |
| **read** | ~3–4 | **NO** | **NO** | Faceted green trees + pink lantern balls = toy/mystical not kiosk; yellow orbs steal key at 3Q; neon soft extruded plastic undercuts brand glass-tube read; noren flat teal slabs mute front brand |
| **placement** | ~4–5 | **NO** | **NO** | Library present; faceted green trees + pink lantern balls + 3Q yellow orbs clutter/occlude shop read; density/contact not critic-cleared under style/env mush |
| **chrome** | ~4–5 | **NO** | **NO** | Pack present; warm SaaS panels/pills, not ticket/menu-board shop craft; cohesion not ≥8 |
| **camux** | ~3–4 | **NO** | **NO** | STYLE/FRAME: faceted green trees + pink lantern balls read toy/mystical not kiosk; 3Q yellow orbs steal key; FOV/damping not disproven; mobile sheet stack still hurts UX |
| **Aggregate** | **≪ 8** | **0/6** | **0/6** | Fail ship bar (need avg ≥ 8, no score &lt; 7; unanimous ship) |

## Verdict

**DO NOT SHIP.** Gate **OPEN**. prefer_ours = false (0/6). ship_votes = 0/6.

Captures are **evidence-valid** (`capture_ok=true`; full product pack beauty+placement+**chrome**) but **craft still below jesse-class product**. Ramen interior under warm key: broth/egg/noodles read glossy plastic mush, not glaze+food. Boba cups: weak liquid transmission/condensation; stack reads toy, not plastic+pearl. Noren/fabric: flat teal slabs, no weave or sheen under strip light. Back-bar bottles/faucet: washed gray primitives; metal/clearcoat illegible. Wood grain OK at counter but varnish is uniform specular sheet, not variation. Neon: readable but soft extruded plastic, not glass-tube material response. Lighting: weak warm-key/cool-fill; blue ground mush; 3Q yellow orbs steal key. Style/env: faceted green trees + pink lantern balls = toy/mystical not kiosk. Chrome: warm SaaS panels/pills, not ticket/menu-board shop craft. Blind pick remains **jesse-zhou**.

## Critic residuals (carry to `LOOP-RESIDUALS.md`)

1. **Ramen** — interior under warm key: broth/egg/noodles glossy plastic mush, not glaze+food **(C)**  
2. **Boba** — weak liquid transmission/condensation; stack reads toy, not plastic+pearl **(C)**  
3. **Noren/fabric** — flat teal slabs, no weave or sheen under strip light **(A)** · **(B)** · **(C)**  
4. **Back-bar bottles/faucet** — washed gray primitives; metal/clearcoat illegible **(C)**  
5. **Counter wood** — grain OK but varnish uniform specular sheet, not variation **(C)**  
6. **Neon** — readable but soft extruded plastic, not glass-tube material response **(C)** · **(A)**  
7. **Lighting** — weak warm-key/cool-fill; blue ground mush; 3Q yellow orbs steal key **(A)**  
8. **Style/env** — faceted green trees + pink lantern balls = toy/mystical not kiosk **(A)** · **(E)** · **read**  
9. **Chrome** — warm SaaS panels/pills, not ticket/menu-board shop craft **(D)**  
10. **Placement / camux** — green trees + pink lanterns + yellow orbs clutter/occlude shop; density + framing not ship-clear **(B)** · **(E)**

## Loop contract check

1. Capture `loop-r31` product pack (beauty + placement + chrome) — **done, OK** (`capture_ok=true`)  
2. Independent harsh critics (6 usable dims) — **done**  
3. Unanimous ship — **failed (0)**  
4. Prefer ours blind — **failed (0)**  
5. Record this file + refresh residuals + PROMPT-TRUTH — **this pass**
