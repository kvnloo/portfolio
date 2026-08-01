# Critic pass — loop-r28 (harsh, jesse-zhou blind bar)

**Date:** 2026-07-30  
**Capture label:** `loop-r28`  
**capture_ok:** **true** (beauty multi-angle + placement library + chrome pack; non-black frames)  
**Rubric:** `docs/VISUAL-BAR.md` (dims materials · lighting · read · place · **chrome** · **camux**)  
**Ship gate:** unanimous ship required among usable critics  
**Reference:** `shots/ref-jesse-zhou-02.png` (primary)  
**Our shots:**  
- Beauty: `shots/loop-r28/` (`01-beauty-hero.png` … `06-beauty-overhead.png`)  
- Placement: `shots/loop-r28-placement/` (18 stills)  
- Chrome: `shots/loop-r28-chrome/` (`01-chrome-hero` … `05-chrome-mobile`)

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
| **materials** | ~3–4 | **NO** | **NO** | Boba: flat pink liquid, weak dome transmission/condensation; ramen toppings blobby — ceramic OK but food materials fail under key; noren/banners plastic slabs not fabric; neon thin/dim vs channel-letter glass (readable, not premium) |
| **lighting** | ~3–4 | **NO** | **NO** | Underlit midtones + flat gray stage; warm key / cool street bounce weak vs night-market kiosk; hero lamp occludes counter materials + sign read; hollow booth not inhabitable stall |
| **read** | ~3–4 | **NO** | **NO** | Giant yellow lamp clips/buries exterior neon at hero; lamp occludes counter materials + sign; neon thin/dim (readable not premium); food mass lost under lamp/noren at beauty distance |
| **placement** | ~4–5 | **NO** | **NO** | Library present; hero lamp + noren/banner hang occlude counter materials + sign read; density/contact not critic-cleared under occlusion |
| **chrome** | ~4–5 | **NO** | **NO** | Pack present; warm SaaS panels/pills, not ticket/menu-board shop craft; cohesion not ≥8 |
| **camux** | ~3–4 | **NO** | **NO** | STYLE/FRAME: giant yellow lamp clips/buries exterior neon at hero; hollow booth not inhabitable stall; FOV/damping not disproven; mobile sheet stack still hurts UX |
| **Aggregate** | **≪ 8** | **0/6** | **0/6** | Fail ship bar (need avg ≥ 8, no score &lt; 7; unanimous ship) |

## Verdict

**DO NOT SHIP.** Gate **OPEN**. prefer_ours = false (0/6). ship_votes = 0/6.

Captures are **evidence-valid** (`capture_ok=true`; full product pack beauty+placement+**chrome**) but **craft still below jesse-class product**. Boba: flat pink liquid, weak dome transmission/condensation. Ramen: toppings blobby; ceramic OK, food materials fail under key. Noren/banners read as plastic slabs, not fabric. Hero lamp occludes counter materials + sign read. Neon thin/dim vs channel-letter glass (readable, not premium). Chrome: warm SaaS panels/pills, not ticket/menu-board shop craft. Lighting: underlit midtones + flat gray stage; warm key/cool street bounce weak vs night-market kiosk. Style/frame: giant yellow lamp clips/buries exterior neon at hero; hollow booth not inhabitable stall. Blind pick remains **jesse-zhou**.

## Critic residuals (carry to `LOOP-RESIDUALS.md`)

1. **Boba** — flat pink liquid; weak dome transmission/condensation **(C)**  
2. **Ramen** — toppings blobby; ceramic OK, food materials fail under key **(C)**  
3. **Noren/banners** — plastic slabs, not fabric **(A)** · **(B)** · **(C)**  
4. **Hero lamp** — occludes counter materials + sign read **(A)** · **(E)** · **read**  
5. **Neon** — thin/dim vs channel-letter glass (readable, not premium) **(C)** · **read**  
6. **Chrome** — warm SaaS panels/pills, not ticket/menu-board shop craft **(D)**  
7. **Lighting** — underlit midtones + flat gray stage; warm key/cool street bounce weak vs night-market kiosk **(A)**  
8. **Style/frame** — giant yellow lamp clips/buries exterior neon at hero; hollow booth not inhabitable stall **(A)** · **(E)**  
9. **Placement** — lamp + noren/banner hang occlude counter + sign; density not ship-clear **(B)**  
10. **Camux** — lamp bury neon + hollow-booth framing; hero framing not ≥8 **(E)**

## Loop contract check

1. Capture `loop-r28` product pack (beauty + placement + chrome) — **done, OK** (`capture_ok=true`)  
2. Independent harsh critics (6 usable dims) — **done**  
3. Unanimous ship — **failed (0)**  
4. Prefer ours blind — **failed (0)**  
5. Record this file + refresh residuals + PROMPT-TRUTH — **this pass**
