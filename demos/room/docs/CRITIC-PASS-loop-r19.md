# Critic pass — loop-r19 (harsh, jesse-zhou blind bar)

**Date:** 2026-07-30  
**Capture label:** `loop-r19`  
**capture_ok:** **true** (beauty multi-angle + placement library + chrome pack; non-black frames)  
**Rubric:** `docs/VISUAL-BAR.md` (dims materials · lighting · read · place · **chrome** · **camux**)  
**Ship gate:** unanimous ship required among usable critics  
**Reference:** `shots/ref-jesse-zhou-02.png` (primary)  
**Our shots:**  
- Beauty: `shots/loop-r19/` (`01-beauty-hero.png` … `06-beauty-overhead.png`)  
- Placement: `shots/loop-r19-placement/` (18 stills)  
- Chrome: `shots/loop-r19-chrome/` (`01-chrome-hero` … `05-chrome-mobile`)

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
| **materials** | ~3–4 | **NO** | **NO** | Countertop: hot specular strip kills wood grain under warm key; ramen ceramic/egg/broth plastic; weak glaze/clearcoat; noren flat unshaded cards—no weave/sheen/wear; boba toy liquid/plastic vs real SSS/IOR/condensation; exterior siding/booth uniform grain, multi-scale wear missing; details hide not sell |
| **lighting** | ~3–4 | **NO** | **NO** | Sparse bounce + black void underexposes exterior/side wood—not night-kiosk bounce; steam/bloom wash flattens counter food + midtones; steam/haze washes counter midtones + chalkboard SPECIALS; underexposure still hides materials instead of selling them |
| **read** | ~5–6 | **NO** | **NO** | Neon channel letters legible on exterior/front placement; chalkboard SPECIALS midtones crushed by steam/haze wash; brand mass readable but surface craft below bar |
| **placement** | ~5–6 | **NO** | **NO** | Library present (18 stills); marquee free of bury on exteriorSign*; stools/props grounded; not critic-cleared for ship—void framing + material/lighting stack still fail product gate |
| **chrome** | ~5–6 | **NO** | **NO** | Pack present; ticket/menu copy + warm serif aim night-shop; side panel still dense admin-adjacent; mobile still shows large empty stage; cohesion not ≥8 vs handmade kiosk |
| **camux** | ~5 | **NO** | **NO** | Default hero frames full shop; FOV/damping not disproven on stills; hotspot pills readable on chrome; mobile stack exists but white-void canvas + overlapping labels hurt UX clarity; exterior void still reads as black stage not street |
| **Aggregate** | **≪ 8** | **0/6** | **0/6** | Fail ship bar (need avg ≥ 8, no score &lt; 7; unanimous ship) |

## Verdict

**DO NOT SHIP.** Gate **OPEN**. prefer_ours = false (0/6). ship_votes = 0/6.

Captures are **evidence-valid** (`capture_ok=true`; full product pack beauty+placement+**chrome**) but **overall craft/atmosphere still below jesse-class product**. Night kiosk massing OK; sparse bounce + black void underexposes exterior/side wood; plastic food/flat fabric/hot counter specular + steam/haze wash keep craft hobby-WebGL. Blind pick remains **jesse-zhou**.

## Critic residuals (carry to `LOOP-RESIDUALS.md`)

1. **Countertop** — hot specular strip kills wood grain under warm key **(C)**  
2. **Ramen ceramic/egg/broth** — plastic; weak glaze/clearcoat **(C)**  
3. **Boba** — toy liquid/plastic vs real SSS/IOR/condensation **(C)**  
4. **Noren** — flat unshaded cards—no weave/sheen/wear **(C)**  
5. **Steam/bloom wash** — flattens counter food + midtones **(A)**  
6. **Exterior siding/booth** — uniform grain; multi-scale wear missing **(C)**  
7. **Lighting** — sparse bounce + black void underexposes exterior/side wood (not night-kiosk bounce) **(A)**  
8. **Steam/haze wash** — washes counter midtones + chalkboard SPECIALS **(A)** · **(read)**  
9. **Chrome cohesion** — pack present; dense panel + mobile empty stage not ship-clear **(D)**  
10. **Placement / camux** — libraries present; not unanimous-cleared under full product gate **(B)** · **(E)**

## Loop contract check

1. Capture `loop-r19` product pack (beauty + placement + chrome) — **done, OK** (`capture_ok=true`)  
2. Independent harsh critics (6 usable dims) — **done**  
3. Unanimous ship — **failed (0)**  
4. Prefer ours blind — **failed (0)**  
5. Record this file + refresh residuals + PROMPT-TRUTH — **this pass**
