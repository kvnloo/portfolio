# Critic pass — loop-r30 (harsh, jesse-zhou blind bar)

**Date:** 2026-07-31  
**Capture label:** `loop-r30`  
**capture_ok:** **true** (beauty multi-angle + placement library + chrome pack; non-black frames)  
**Rubric:** `docs/VISUAL-BAR.md` (dims materials · lighting · read · place · **chrome** · **camux**)  
**Ship gate:** unanimous ship required among usable critics  
**Reference:** `shots/ref-jesse-zhou-02.png` (primary)  
**Our shots:**  
- Beauty: `shots/loop-r30/` (`01-beauty-hero.png` … `06-beauty-overhead.png`)  
- Placement: `shots/loop-r30-placement/` (18 stills)  
- Chrome: `shots/loop-r30-chrome/` (`01-chrome-hero` … `05-chrome-mobile`)

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
| **materials** | ~3–4 | **NO** | **NO** | Ramen: dry noodle mass — no wet glaze, broth meniscus, or liquid volume; boba: opaque potion liquid — no cup transmission/condensation/pearl refraction; counter wood: continuous plastic varnish, weak micro-roughness/wear; stools/booth: flat toy discs / dead matte cushion (not worn wood/fabric); sink/faucet: default grey plastic, no metal specular response; noren/menu planes: untextured flat cards under warm key |
| **lighting** | ~3–4 | **NO** | **NO** | Weak warm-key / cool-fill; yellow lamp orb steals key and muddies three-quarter; underlit muddy midtones vs night-market kiosk |
| **read** | ~3–4 | **NO** | **NO** | Faceted green/pink spheres + lantern mush occlude shop (leftNeon/3Q); yellow lamp orb steals key and buries neon + counter; noren/menu planes read as untextured flat cards, not fabric/menu craft |
| **placement** | ~4–5 | **NO** | **NO** | Library present; faceted green/pink spheres + lantern mush + yellow lamp orb occlude shop/neon/counter at leftNeon/3Q; density/contact not critic-cleared under occlusion |
| **chrome** | ~4–5 | **NO** | **NO** | Pack present; warm SaaS panels/pills, not ticket/menu-board shop craft; cohesion not ≥8 |
| **camux** | ~3–4 | **NO** | **NO** | STYLE/FRAME: faceted green/pink spheres + lantern mush occlude shop (leftNeon/3Q); yellow lamp orb steals key at 3Q; FOV/damping not disproven; mobile sheet stack still hurts UX |
| **Aggregate** | **≪ 8** | **0/6** | **0/6** | Fail ship bar (need avg ≥ 8, no score &lt; 7; unanimous ship) |

## Verdict

**DO NOT SHIP.** Gate **OPEN**. prefer_ours = false (0/6). ship_votes = 0/6.

Captures are **evidence-valid** (`capture_ok=true`; full product pack beauty+placement+**chrome**) but **craft still below jesse-class product**. Ramen: dry noodle mass; no wet glaze, broth meniscus, or liquid volume. Boba: opaque potion liquid; no cup transmission/condensation/pearl refraction. Counter wood: continuous plastic varnish; weak micro-roughness/wear. Stools/booth: flat toy discs / dead matte cushion, not worn wood/fabric. Sink/faucet: default grey plastic; no metal specular response. Noren/menu planes: untextured flat cards under warm key. Lighting: weak warm-key/cool-fill; yellow lamp orb steals key and muddies 3Q. Style/env: faceted green/pink spheres + lantern mush occlude shop (leftNeon/3Q). Chrome: warm SaaS panels/pills, not ticket/menu-board shop craft. Blind pick remains **jesse-zhou**.

## Critic residuals (carry to `LOOP-RESIDUALS.md`)

1. **Ramen** — dry noodle mass; no wet glaze, broth meniscus, or liquid volume **(C)**  
2. **Boba** — opaque potion liquid; no cup transmission/condensation/pearl refraction **(C)**  
3. **Counter wood** — continuous plastic varnish; weak micro-roughness/wear **(C)**  
4. **Stools/booth** — flat toy discs / dead matte cushion, not worn wood/fabric **(C)**  
5. **Sink/faucet** — default grey plastic; no metal specular response **(C)**  
6. **Noren/menu planes** — untextured flat cards under warm key **(A)** · **(B)** · **(C)**  
7. **Lighting** — weak warm-key/cool-fill; yellow lamp orb steals key and muddies 3Q **(A)**  
8. **Style/env** — faceted green/pink spheres + lantern mush occlude shop (leftNeon/3Q) **(A)** · **(E)** · **read**  
9. **Chrome** — warm SaaS panels/pills, not ticket/menu-board shop craft **(D)**  
10. **Placement / camux** — spheres/lantern mush + lamp orb occlude shop at leftNeon/3Q; density + framing not ship-clear **(B)** · **(E)**

## Loop contract check

1. Capture `loop-r30` product pack (beauty + placement + chrome) — **done, OK** (`capture_ok=true`)  
2. Independent harsh critics (6 usable dims) — **done**  
3. Unanimous ship — **failed (0)**  
4. Prefer ours blind — **failed (0)**  
5. Record this file + refresh residuals + PROMPT-TRUTH — **this pass**
