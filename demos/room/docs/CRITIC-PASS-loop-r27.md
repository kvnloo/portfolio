# Critic pass — loop-r27 (harsh, jesse-zhou blind bar)

**Date:** 2026-07-30  
**Capture label:** `loop-r27`  
**capture_ok:** **true** (beauty multi-angle + placement library + chrome pack; non-black frames)  
**Rubric:** `docs/VISUAL-BAR.md` (dims materials · lighting · read · place · **chrome** · **camux**)  
**Ship gate:** unanimous ship required among usable critics  
**Reference:** `shots/ref-jesse-zhou-02.png` (primary)  
**Our shots:**  
- Beauty: `shots/loop-r27/` (`01-beauty-hero.png` … `06-beauty-overhead.png`)  
- Placement: `shots/loop-r27-placement/` (18 stills)  
- Chrome: `shots/loop-r27-chrome/` (`01-chrome-hero` … `05-chrome-mobile`)

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
| **materials** | ~3–4 | **NO** | **NO** | Ramen: no broth/liquid clearcoat/toppings; noodles read as brown sticks; ceramic glaze only exterior shell, interior washed/empty; boba: opaque purple mug + white drip blobs—no cup transmission/condensation/pearls; neon still emissive mesh, not glass-tube material hierarchy |
| **lighting** | ~3–4 | **NO** | **NO** | Underlit midtones + flat gray stage vs night-market bounce; weak cool street edge; interior reads hollow booth not kiosk; strip + noren kill food readability at beauty distance |
| **read** | ~4–5 | **NO** | **NO** | Hero food unreadable at beauty distance under strip + noren; noren flat teal panels clip and bury counter food materials; neon emissive mesh not glass-tube hierarchy; brand mass may hold at distance but craft fails close |
| **placement** | ~4–5 | **NO** | **NO** | Library present; noren flat teal panels clip and bury counter food; hero food density/contact not critic-cleared under strip occlusion |
| **chrome** | ~5–6 | **NO** | **NO** | Pack present; ticket/menu aim night-shop; dense panel + mobile empty stage; cohesion not ≥8 |
| **camux** | ~4–5 | **NO** | **NO** | Hero food unreadable at beauty distance; hollow-booth framing vs kiosk; weak cool street edge + flat gray stage; FOV/damping not disproven; mobile sheet stack hurts UX |
| **Aggregate** | **≪ 8** | **0/6** | **0/6** | Fail ship bar (need avg ≥ 8, no score &lt; 7; unanimous ship) |

## Verdict

**DO NOT SHIP.** Gate **OPEN**. prefer_ours = false (0/6). ship_votes = 0/6.

Captures are **evidence-valid** (`capture_ok=true`; full product pack beauty+placement+**chrome**) but **craft still below jesse-class product**. Ramen: no broth/liquid clearcoat/toppings; noodles brown sticks; ceramic glaze exterior-only with washed empty interior. Boba: opaque purple mug + white drip blobs; no transmission/condensation/pearls. Noren: flat teal panels clip and bury counter food. Hero food unreadable at beauty distance under strip + noren. Neon still emissive mesh, not glass-tube hierarchy. Underlit midtones + flat gray stage vs night-market bounce; weak cool street edge; interior hollow booth not kiosk. Blind pick remains **jesse-zhou**.

## Critic residuals (carry to `LOOP-RESIDUALS.md`)

1. **Ramen** — no broth/liquid clearcoat/toppings; noodles read as brown sticks **(C)**  
2. **Ramen ceramic** — glaze only exterior shell; interior washed/empty **(C)**  
3. **Boba** — opaque purple mug + white drip blobs; no cup transmission/condensation/pearls **(C)**  
4. **Noren** — flat teal panels clip and bury counter food materials **(A)** · **(B)** · **(C)**  
5. **Hero food read** — unreadable at beauty distance under strip + noren **(A)** · **(E)** · **(read)**  
6. **Neon** — still emissive mesh, not glass-tube material hierarchy **(C)** · **(read)**  
7. **Lighting** — underlit midtones + flat gray stage vs night-market bounce **(A)**  
8. **Lighting / shell** — weak cool street edge; interior reads hollow booth not kiosk **(A)**  
9. **Chrome cohesion** — pack present; dense panel + mobile empty stage not ship-clear **(D)**  
10. **Camux** — beauty-distance food fail + hollow-booth framing; hero framing not ≥8 **(E)**

## Loop contract check

1. Capture `loop-r27` product pack (beauty + placement + chrome) — **done, OK** (`capture_ok=true`)  
2. Independent harsh critics (6 usable dims) — **done**  
3. Unanimous ship — **failed (0)**  
4. Prefer ours blind — **failed (0)**  
5. Record this file + refresh residuals + PROMPT-TRUTH — **this pass**
