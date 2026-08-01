<!-- generated: 2026-07-31 | source: ss_dir -->

# Mobile improvement plan — demos/room

## 1. Executive summary

**Intent:** On a phone, Kevin's Ramen & Boba should feel like a night-market stall: 3D shop as hero, slim chalk ledge under the counter, board/ticket as order UI, frontal orbit, dish-framed camera on select.

**Pages reality (Chrome stills):** Stage is a thin band under browser chrome; a dense six-row vertical specials list owns ~half the viewport; giant mid-frame Html pills clip words and cover food; free yaw lands on black cardboard rear + purple pad; hero framing makes bowls pinpricks; click-a-dish / dual SaaS brand stack fight the neon.

**Codebase truth:** `styles.css` `@media (max-width: 960px)` already sketches residual-D r32 (`.panel` max-height ~3.15rem + safe-area, horizontal `.menu-list`, `.panel.has-order` receipt strip, `.pipeline-badge { display: none }`, `.stage-dock { display: none }`). `ProjectHotspots` has `stackChrome` at `matchMedia('(max-width: 960px)')` and suppresses selected Html. **Remaining gaps:** `OrbitControls` still allow full ±π yaw with no select-to-frame; mobile hides idle # stubs (`showIdleStub` false under `stackChrome`); no collapse handle / reset-view; materials, flank lighting, and side shell unfinished; live Pages may not match source until rebuild/redeploy.

---

## 2. Issue catalog

| id | severity | area | title |
|----|----------|------|-------|
| M1-01 | P0 | layout | Menu sheet steals ~half the phone viewport |
| M1-02 | P0 | labels | Giant selected dish pill occludes food and clips mid-word |
| M1-03 | P0 | camera | Free yaw orbit delivers black kiosk back and empty void |
| M1-04 | P1 | camera | Zoom/orbit too-close crops empty counter; dish unreadable |
| M1-05 | P1 | camera | Default hero framing makes food pinprick touch targets |
| M1-06 | P2 | menu | Desktop click-a-dish copy on pure touch UI |
| M1-07 | P1 | materials | Ramen material reads as soft white blob / yellow mush |
| M1-08 | P1 | lighting | Flank lighting crushed black; street lamp blown to white ball |
| M1-09 | P1 | labels | Ordered label floats in void when shop leaves frame |
| M1-10 | P1 | brand | SaaS chrome stack fights night-market 3D brand |
| M1-11 | P2 | materials | Neon shop sign mushy/unreadable on mobile GPU |
| M1-12 | P1 | layout | Header + label + browser chrome leave almost no clear stage |
| M2-01 | P0 | layout | Bottom sheet has no collapse/drag handle |
| M2-02 | P0 | menu | Selecting a dish has no ticket/CTA payoff on mobile |
| M2-03 | P1 | menu | Six menu specials, one readable bowl on the counter |
| M2-04 | P1 | materials | Ground reads as purple cyclorama pad, not night street |
| M2-05 | P1 | lighting | Counter wood washes to featureless cream bloom slab |
| M2-06 | P2 | lighting | Cyan under-counter LED blooms into pure neon streak |
| M2-07 | P1 | layout | Last specials rows collide with Chrome bottom toolbar |
| M2-08 | P2 | brand | Tech codenames under dishes kill the food metaphor |
| M2-09 | P2 | labels | Street signpost blades are illegible multicolor confetti |
| M2-10 | P1 | camera | Boba cups clip off the stage edge on angle/zoom |
| M2-11 | P0 | camera | Dish select never reframes camera onto the food |
| M2-12 | P2 | brand | Pull-up-a-stool promises interaction stools never deliver |
| M3-01 | P1 | materials | Boba cups read as empty frosted jars |
| M3-02 | P1 | labels | Selected ramen pill floats over boba framing with no leader |
| M3-03 | P2 | labels | OPEN LATE A-frame chalkboard is illegible black slab |
| M3-04 | P1 | menu | Counter food has zero idle tap affordance |
| M3-05 | P3 | brand | Orphan cyan roof glyph floats above kiosk |
| M3-06 | P2 | materials | Noren curtains read as flat plastic color cards |
| M3-07 | P2 | layout | Orbit/hint dock chip collides with stool and cyan LED |
| M3-08 | P2 | menu | Specials rows are text+color-dots only |
| M3-09 | P1 | lighting | Counter pendant lamps blow out to white orbs |
| M3-10 | P1 | camera | Close orbit hard-cuts half the frame to black void |
| M3-11 | P2 | labels | Interior hang-board is a blank green placard |
| M3-12 | P2 | materials | Stools read as stick-figure discs on purple pad |
| M4-01 | P1 | lighting | City-square surround fails — kiosk island in void |
| M4-02 | P1 | materials | Kiosk side/rear shell is untextured black cardboard |
| M4-03 | P2 | brand | Airborne confetti cubes clutter brand silhouette |
| M4-04 | P1 | lighting | Warm amber monochrome wash kills dish color identity |
| M4-05 | P1 | menu | Menu select never lights the matching 3D prop |
| M4-06 | P1 | labels | Selection pill collides with HTML header title stack |
| M4-07 | P2 | brand | Specials dish names are resume puns, not food |
| M4-08 | P2 | brand | Hollow cookline — empty interior, no tools/steam |
| M4-09 | P2 | menu | Sticky selection with no clear/dismiss control |
| M4-10 | P2 | brand | Signpost + dual lamps occlude storefront |
| M4-11 | P2 | brand | Shop name tripled — H1, neon, and dock chip |
| M4-12 | P2 | menu | Specials rows omit #/price |
| M5-01 | P1 | camera | No camera-reset control after free orbit |
| M5-02 | P1 | materials | Open kiosk interior reads as hollow black cavity |
| M5-03 | P1 | lighting | Twin street-lamp globes out-bright the neon brand |
| M5-04 | P1 | menu | Menu color dots never appear on 3D dishes |
| M5-05 | P1 | materials | Left service-ledge prop is a blank beige placard |
| M5-06 | P1 | materials | Bowl and boba levitate — contact shadow unreadable |
| M5-07 | P2 | menu | Specials list has no prices or cost theater |
| M5-08 | P2 | labels | Mid-canvas selection pill has no dismiss control |
| M5-09 | P2 | brand | Signpost blades are portfolio IA not market streets |
| M5-10 | P2 | brand | UI H1 duplicates neon shop wordmark |
| M5-11 | P2 | lighting | Fog dissolves kiosk mass at rear three-quarter |
| M5-12 | P2 | materials | Boba straw and lid are cartoon stick + featureless dome |

---

## 3. Phased plan

### Phase 0 — Quick wins / deploy CSS truth

**Goals:** Live Pages matches residual-D r32 mobile CSS: canvas ≥~70% of 100dvh, chalk ledge ~3rem, no dense vertical admin list, no double Kevin dock, touch-safe copy.

**Issues:** M1-01, M1-06, M1-10 (partial), M1-12 (partial), M2-02 (CSS path), M2-07, M2-08, M3-07, M4-11, M2-12

**File touches:**
- `demos/room/src/styles.css` — Verify `@media (max-width: 960px)` / `480px`: `.panel` max-height `calc(3.15rem + env(safe-area-inset-bottom))`; idle `.menu-list` row + horizontal scroll; `.panel.has-order` receipt strip + # ticks (`.menu-name { display: none }`); `.pipeline-badge` and `.stage-dock` `display: none`; `.menu-item small` hidden (codenames). Ensure safe-area padding so last row clears Chrome toolbar (M2-07).
- `demos/room/src/App.tsx` — Tagline already Tap a bowl or cup; stage-dock orbit · pick a bowl (CSS-hidden on mobile). Do not reintroduce vertical dense list on narrow viewports.
- `demos/room/src/ShopCanvas.tsx` — Delete or retarget `.pipeline-badge` string (still says click a dish) so CSS regression cannot reintroduce desktop copy (M1-06).
- Deploy — `npm run build` + Pages redeploy so live matches source (stills look pre-r32).

**Acceptance:** 390×844 idle: `grid-template-rows: 1fr auto`, panel ≤~3.2rem + safe-area, horizontal dishes; ordered: paper `.detail` + # ticks + CTAs; no bottom SaaS caption; chrome pack canvas is primary.

**Estimate:** S

---

### Phase 1 — Framing & layout

**Goals:** Front-arc orbit; select eases to food presets; hero food readable; collapsible ledge; reset view.

**Issues:** M1-03, M1-04, M1-05, M2-01, M2-10, M2-11, M3-10, M5-01, M2-03, M4-10

**File touches:**
- `demos/room/src/ShopCanvas.tsx` — OrbitControls: clamp min/maxAzimuthAngle to frontal arc (~±0.85–1.1 rad; kill ±π rear). Free-zoom minDistance high enough to avoid mid-counter black slab (~2.6–3.2 free min; select via preset may go closer); maxDistance ~11–12 not 15.5; tighten maxPolarAngle. Select-to-frame: useEffect on selectedId → damped lerp to CAMERA_PRESETS (evolve/audio→counterRamen, ace/monument→counterBoba, files/fleet→counterLaptop if added); clear→mobile-hero. Mobile hero: FOV 40–42, closer Z, lower target Y via matchMedia max-width 960px. Reset view control or double-tap → __shopSetCamera mobile-hero (M5-01).
- `demos/room/src/shop/ProjectHotspots.tsx` — Inset boba X if letterbox clips; scale laptop ledge for hero readability.
- `demos/room/src/App.tsx` + `styles.css` — panelOpen + .panel-grabber; collapsed slim ledge; expanded only for ticket CTAs (~5–6rem max-height) (M2-01).
- `demos/room/src/shop/ShopShell.tsx` — SignPost further street-left (M4-10/M5-03).

**Acceptance:** Yaw cannot park on pure rear void; select frames dish ≥~25% stage width in 0.5–0.8s; zoom cannot bury into cream slab; collapse restores ≥85% dvh stage; reset recovers from bad orbit.

**Estimate:** M–L

---

### Phase 2 — Labels & menu↔3D mapping

**Goals:** Panel owns ordered name on stack; no giant mid-void pills; idle discovery; select lights prop; dismiss; accent parity.

**Issues:** M1-02, M1-09, M2-02, M3-02, M3-04, M4-05, M4-06, M4-09, M5-04, M5-08, M3-08 (optional), M4-12, M5-07

**File touches:**
- `ProjectHotspots.tsx` — Keep showHtmlLabel = showLabel && !(selected && stackChrome). Fix M3-04: allow idle # stubs on stack OR enlarge hairline rings + accent crown pip from project.accent (M5-04). ringBoost when selected+stack so prop lights without Html (M4-05). No nowrap full-width billboard on mobile.
- `styles.css` — Confirm .r3f-label / .selected mobile max-width + hide name when selected; stage-chrome vs label bands separate (M4-06).
- `App.tsx` — Ticket sole name owner; visible × clear → setSelectedId(null) (M4-09/M5-08); optional chalk price from projects.json (M4-12/M5-07).
- Optional menu thumbs 40–48px (M3-08) only if mapping still fails.

**Acceptance:** Ordered 390×844 has no giant -AGENT RAMEN pill; ticket shows full menuName; rings mark prop; idle #/rings visible; clear returns idle+hero; accent on prop edge.

**Estimate:** M

---

### Phase 3 — Lighting & materials (mobile FOV)

**Goals:** Wet ceramic + broth + boba tea/pearls; flanks have volume; night asphalt ground; lamps/neon don't blow; side shell not cardboard.

**Issues:** M1-07, M1-08, M1-11, M2-04, M2-05, M2-06, M3-01, M3-09, M4-01, M4-02, M4-04, M5-02, M5-03, M5-06, M5-11, M5-12, M3-06, M3-12

**File touches:**
- `src/img2threejs/createRamenBowlModel.ts` — clearcoat ceramic, translucent broth, toppings at counterRamen (M1-07).
- `src/img2threejs/createBobaCupPairModel.ts` — tea column + pearls (transmission/IOR); straw/lid craft (M3-01, M5-12).
- `ShopCanvas.tsx` — Soften warm wraps on mobile path (M4-04/M2-05); fog near further / lower density (M5-11); ground warmer asphalt, kill magenta (M2-04); keep Bloom near-off.
- `shop/CitySquareEnv.tsx` — StreetLamp lower emissiveIntensity (1.4→softer), toneMapped true, softer pointLight (M1-08/M5-03); lift building midtones (M4-01).
- `shop/ShopShell.tsx` — side/rear siding (M4-02); under-counter cyan clamp (M2-06); pendant shades (M3-09); neon glass-tube mobile (M1-11); interior shelves (M5-02); noren/stools/contact/laptop ledge (M3-06/M3-12/M5-06/M5-05).

**Acceptance:** Counter crop: distinct dish hues, visible contact; lamps not brighter than neon; flank/3Q kiosk+street not purple island; neon legible at mobile-hero.

**Estimate:** L

---

### Phase 4 — Brand polish & verify

**Goals:** One brand owner per region; food-first names; market signpost; capture gate.

**Issues:** M2-09, M3-03, M3-05, M3-11, M4-03, M4-07, M4-08, M5-09, M5-10 + residual checks

**File touches:**
- App.tsx / styles.css — mobile idle whisper/drop H1 so NeonBrandSign owns name (M5-10).
- public/data/projects.json + src/data/projects.json — real food menuNames; puns in blurb; optional price (M4-07).
- ShopShell.tsx — market street blades (M5-09); simplify mobile signpost (M2-09); A-frame chalk (M3-03); interior board or remove blank green (M3-11); kill roof glyph/confetti cubes (M3-05/M4-03).
- tools/capture.mjs — extend 390×844 pack: idle, selected, yaw-max, zoom-min, collapse, reset.

**Acceptance:** Chrome mobile pack passes stall-first blind read; no triple brand tax; specials read as menu not admin list.

**Estimate:** M

---

## 4. Phase estimates rollup

| Phase | Title | Estimate | Primary files |
|-------|--------|----------|---------------|
| 0 | Quick wins / deploy CSS truth | S | styles.css, App.tsx, ShopCanvas.tsx, deploy |
| 1 | Framing & layout | M–L | ShopCanvas.tsx, ProjectHotspots.tsx, App.tsx, styles.css |
| 2 | Labels & menu↔3D map | M | ProjectHotspots.tsx, styles.css, App.tsx |
| 3 | Lighting & materials mobile | L | models, ShopCanvas, ShopShell, CitySquareEnv |
| 4 | Brand polish + verify | M | projects.json, ShopShell, capture |

**Order:** Phase 0 → 1 → 2 → 3 → 4. **P0 must-ship:** M1-01, M1-02, M1-03, M2-01, M2-02, M2-11.

---

## 5. Out of scope

- Desktop-only chrome refinements (wide side panel already ticket/wood).
- Full 4K/8K Behance photosphere HQ / beauty multi-angle loop unless needed to unblock mobile framing (use CAMERA_PRESETS + __shopSetCamera for repro).
- New sit-on-stool gameplay (M2-12: copy only unless real hit targets).
- Desktop dual-portal hover alt Html (already gated !stackChrome).
- Full jesse-zhou materials bar for every prop — Phase 3 targets mobile FOV readability.
- GitNexus symbol renames for layout-only CSS.

---

## 6. Suggested capture / verify (390×844)

```bash
cd demos/room
npm run build
npm run capture:chrome -- --label mobile-m1
# tools/capture.mjs already: setViewportSize({ width: 390, height: 844 }) → 05-chrome-mobile.png
```

| Shot | State | Pass if |
|------|--------|--------|
| idle-hero | no order | Stage ≥~70% dvh; slim ledge; food silhouettes; no vertical 6-row sheet |
| idle-stubs | no order | # chips or rings on bowl/cups |
| select-miso | order evolve | Ticket + CTAs; no giant Html pill; camera on bowl |
| select-boba | order ace | Cups framed; not half-clipped |
| orbit-yaw-max | free orbit | No stable pure-black rear void |
| zoom-min | minDistance | Dish readable; not cream-slab abstract |
| flank-3q | max azimuth | Siding volume, not cardboard only |
| collapse | grabber | Full-screen stage |
| reset | after bad orbit | Returns to mobile-hero |
| safe-area | Android Chrome | Ticket/rows above URL bar + home indicator |

Baseline fail: shots/loop-r32-chrome/05-chrome-mobile.png (canvas crushed).

---

## 7. Key code anchors (current)

- ShopCanvas.tsx OrbitControls: full ±π yaw, minDistance=4.8, maxDistance=15.5 — no select-to-frame on selectedId.
- styles.css @media (max-width: 960px) / 480px: slim .panel ledge + horizontal .menu-list + .has-order receipt strip (must match live deploy).
- ProjectHotspots.tsx: stackChrome @ 960px; showHtmlLabel off when selected+stack; showIdleStub also off on stack (hurts M3-04).
- CAMERA_PRESETS.hero / counterRamen / counterBoba already authored — wire to selection.
- CitySquareEnv StreetLamp: emissiveIntensity=1.4, toneMapped=false.
- App.tsx: tagline already Tap a bowl or cup; ticket + toggle deselect exist; need visible × and optional panelOpen.


---

## Raw issue dump

- **M1-01** [P0] (layout) Menu sheet steals ~half the phone viewport
  - evidence: Screenshot_20260731_210607_Chrome.png / 210641: six full-height menu rows (Miso…Taro) fill the bottom half; 3D stage is a short strip under header + browser chrome. Shop is not the hero.
  - fix_hint: demos/room/src/styles.css @media (max-width:960px) .panel — enforce slim chalk ledge (max-height ~3rem + safe-area), horizontal # ticks when ordered; rebuild/redeploy so live Pages matches. App.tsx panel must not render dense vertical .menu-item list on narrow viewports.

- **M1-02** [P0] (labels) Giant selected dish pill occludes food and clips mid-word
  - evidence: Screenshot_20260731_210616_Chrome.png: label reads "-AGENT RAMEN" (left-clipped). 210624: "ISO MULTI-AGENT RAMEN" spans full width over bowl. 210607: black/gold pill covers bowl + counter center.
  - fix_hint: demos/room/src/shop/ProjectHotspots.tsx Html + stackChrome gate (showHtmlLabel = false when stack+selected); styles.css .r3f-label max-width/white-space/font-size for mobile; never allow nowrap billboard across portrait width — panel ticket owns the name.

- **M1-03** [P0] (camera) Free yaw orbit delivers black kiosk back and empty void
  - evidence: Screenshot_20260731_210648_Chrome.png: rear silhouette of stall in pure black/purple void, only floating "MISO MULTI-AGENT RAMEN" label. 210638: side mass is crushed black with blown street lamp. 210644: three-quarter flank nearly unreadable.
  - fix_hint: demos/room/src/ShopCanvas.tsx OrbitControls: clamp minAzimuthAngle/maxAzimuthAngle to frontal arc (kill full ±π rear), lower maxDistance so plaza-wide black sky doesn't dominate; optional spring-back to hero target when user releases past flanks.

- **M1-04** [P1] (camera) Zoom/orbit too-close crops empty counter; dish unreadable
  - evidence: Screenshot_20260731_210624_Chrome.png: extreme close on soft white bowl rim + counter edge; neon sign becomes a glowing bar across the top. No full dish or shop context.
  - fix_hint: ShopCanvas.tsx OrbitControls minDistance (raise for mobile FOV) + select-to-frame camera preset (counterRamen/counterBoba already in CAMERA_PRESETS); on order, ease camera to dish-framed pose instead of free zoom mush.

- **M1-05** [P1] (camera) Default hero framing makes food pinprick touch targets
  - evidence: Screenshot_20260731_210607_Chrome.png: full kiosk at distance; bowls/cups are tiny counter dots. "click a dish" is fiction — fingers cannot target props under chrome overlays.
  - fix_hint: ShopCanvas.tsx default camera / hero preset: mobile aspect-aware closer counter pose or higher FOV with lower target Y; ProjectHotspots.tsx enlarge hit meshes/ring on stackChrome; menu list as primary select path until props are readable.

- **M1-06** [P2] (menu) Desktop "click a dish" copy on pure touch UI
  - evidence: All Chrome shop shots: bottom caption "Kevin's Ramen & Boba · orbit · click a dish". Tagline also says "projects on the menu · pull up a stool" — no tap language.
  - fix_hint: ShopCanvas.tsx pipeline-badge string (or keep display:none in styles.css); App.tsx stage-dock / tagline — use "tap a bowl or cup" / "orbit · pick a dish"; ensure hide rules win on mobile so copy doesn't stack with menu.

- **M1-07** [P1] (materials) Ramen material reads as soft white blob / yellow mush
  - evidence: Screenshot_20260731_210624_Chrome.png and 210616: bowl is milky ceramic blob; broth is featureless yellow/orange smear; no egg, nori, green onion, or clearcoat wetness under the warm key.
  - fix_hint: demos/room/src/img2threejs/createRamenBowlModel.ts — ceramic clearcoat/roughness, translucent broth, readable toppings scale; ProjectHotspots ramen prop scale/placement so close framing shows craft not mush.

- **M1-08** [P1] (lighting) Flank lighting crushed black; street lamp blown to white ball
  - evidence: Screenshot_20260731_210638_Chrome.png: lamp globe is pure white emissive sphere with no falloff; kiosk body is near-black silhouette. 210648/210644: midtones gone, purple fog ground disk.
  - fix_hint: CitySquareEnv.tsx StreetLamp: lower emissiveIntensity, toneMapped material, softer pointLight; ShopCanvas.tsx exposure/fog + cool rim fill so flanks keep volume; avoid pure #000104 background reading as empty when orbiting.

- **M1-09** [P1] (labels) Ordered label floats in void when shop leaves frame
  - evidence: Screenshot_20260731_210648_Chrome.png and 210638: "MISO MULTI-AGENT RAMEN" pill hovers in empty space with no food or counter under it; selection state is chrome-only, 3D context lost.
  - fix_hint: ProjectHotspots.tsx stackChrome: suppress Html when selected on narrow viewports; panel owns ORDERED name; optionally hide/dim label when prop NDC is off-screen or camera azimuth past flank threshold.

- **M1-10** [P1] (brand) SaaS chrome stack fights night-market 3D brand
  - evidence: Screenshot_20260731_210607_Chrome.png: "PORTFOLIO · INTERACTIVE SHOP" + serif title + frosted dark "Portfolio" pill + bottom SaaS caption + dense admin menu list — all over a neon kiosk. Two products glued together.
  - fix_hint: App.tsx stage-chrome / chrome-actions; styles.css .stage-chrome, .ghost (ticket paper exits), .panel hang-board tokens — ship ticket/wood chrome, kill frosted dark pills and dual marquee; one brand owner per region (neon=3D, chalk=menu).

- **M1-11** [P2] (materials) Neon shop sign mushy/unreadable on mobile GPU
  - evidence: Screenshot_20260731_210607_Chrome.png: "KEVIN'S RAMEN & BOBA" is pink bloom mush, glyphs barely legible. 210641 better but still soft; brand mark fails at the one distance phone users start at.
  - fix_hint: ShopShell.tsx neon tubes/emissive mesh → glass-tube look, lower bloom in ShopCanvas EffectComposer on mobile (AdaptiveDpr path); ensure sign has readable emissive texture at hero distance.

- **M1-12** [P1] (layout) Header + label + browser chrome leave almost no clear stage
  - evidence: Screenshot_20260731_210616_Chrome.png: status bar + stage title/Portfolio + giant mid-label + bottom orbit caption + Chrome URL bar + home indicator + half-height menu — remaining 3D is a thin band of counter lip.
  - fix_hint: styles.css mobile: shrink/hide .stage-chrome when .has-order; kill pipeline-badge; panel strip only; safe-area padding; ProjectHotspots hide giant Html so stage remains ≥~70% of dvh for orbit.

- **M2-01** [P0] (layout) Bottom sheet has no collapse/drag handle — 3D never full-screens
  - evidence: Screenshot_20260731_210607_Chrome.png: ~50% of the phone is a permanent dark menu stack with no chevron, grabber, or dismiss; canvas is permanently caged.
  - fix_hint: demos/room/src/styles.css @media (max-width:960px) .panel — add collapsible sheet (max-height idle vs expanded) + drag handle; demos/room/src/App.tsx panel state for open/closed.

- **M2-02** [P0] (menu) Selecting a dish has no ticket/CTA payoff on mobile
  - evidence: Screenshot_20260731_210616_Chrome.png & 210624: Miso is active (gold card + mid-air pill) but all 6 rows still fill the sheet — no kitchen ticket, no Taste live / Kitchen / boplog buttons, no blurb.
  - fix_hint: demos/room/src/App.tsx detail block must win vertical space on select (scroll ticket into view / replace list); demos/room/src/styles.css .panel.has-order mobile rules already sketch a receipt strip — ensure deploy ships that path.

- **M2-03** [P1] (menu) Six menu specials, one readable bowl on the counter
  - evidence: Screenshot_20260731_210607_Chrome.png: full board lists Boba/Laptop/Pickles/Nitro/Taro while the 3D stage only shows one distant white bowl; menu→scene mapping fails for 5 SKUs.
  - fix_hint: demos/room/src/shop/ProjectHotspots.tsx prop placement + scale; demos/room/src/ShopCanvas.tsx hero camera preset must keep multi-dish props above readable size, or dim/omit unstaged menu rows.

- **M2-04** [P1] (materials) Ground reads as purple cyclorama pad, not night street
  - evidence: Screenshot_20260731_210638_Chrome.png / 210644 / 210648: large magenta–purple gradient floor under the kiosk with no asphalt, curb, or plaza read — unfinished studio void.
  - fix_hint: demos/room/src/ShopCanvas.tsx ground stack + fog colors; demos/room/src/shop/ShopShell.tsx night asphalt / CitySquareEnv.tsx plaza materials — warmer dark asphalt, kill cool magenta fill.

- **M2-05** [P1] (lighting) Counter wood washes to featureless cream bloom slab
  - evidence: Screenshot_20260731_210616_Chrome.png & 210624: countertop is a blown cream/orange plane; grain, edge, and dish contact shadow gone under warm keys.
  - fix_hint: demos/room/src/ShopCanvas.tsx warm pointLights (positions ~counter, intensity 4.x) + toneMappingExposure; ShopShell counter material roughness/map contrast.

- **M2-06** [P2] (lighting) Cyan under-counter LED blooms into pure neon streak
  - evidence: Screenshot_20260731_210624_Chrome.png: cyan strip under counter edge is a pure overexposed bar that steals focus from the bowl.
  - fix_hint: demos/room/src/shop/ShopShell.tsx under-counter emissive mesh — lower emissiveIntensity, clamp bloom/exposure on mobile path in ShopCanvas.

- **M2-07** [P1] (layout) Last specials rows collide with Chrome bottom toolbar
  - evidence: Screenshot_20260731_210607_Chrome.png: Taro Monument Float sits flush against the Android Chrome URL bar; no safe-area pad — last row is easy to miss-tap.
  - fix_hint: demos/room/src/styles.css .panel padding-bottom: max(…, env(safe-area-inset-bottom)); account for browser chrome (~56px) on mobile grid-template-rows.

- **M2-08** [P2] (brand) Tech codenames under dishes kill the food metaphor
  - evidence: Screenshot_20260731_210607_Chrome.png: subtitles show Evolve Framework, LawnTech ACE, .files, tmux-agent-fleet, AudioEngine — reads as admin inventory, not a night-market menu.
  - fix_hint: demos/room/src/App.tsx menu rows + demos/room/src/styles.css .menu-item small (already display:none in r32 — ship it); keep codenames only on kitchen ticket.

- **M2-09** [P2] (labels) Street signpost blades are illegible multicolor confetti
  - evidence: Screenshot_20260731_210641_Chrome.png: directional blades left of kiosk show smeared yellow/green/blue tags; articles/about/credits unreadable at phone scale.
  - fix_hint: demos/room/src/shop/ShopShell.tsx Signpost / directional blades — larger type atlas, fewer words, or hide blades under mobile DPR; fix twin lamp intensity separately if still blown.

- **M2-10** [P1] (camera) Boba cups clip off the stage edge on angle/zoom
  - evidence: Screenshot_20260731_210616_Chrome.png: right-side boba cup is half cut by the canvas/chrome boundary while the giant pill still owns center stage.
  - fix_hint: demos/room/src/ShopCanvas.tsx OrbitControls minDistance/target + select-to-focus framing; ProjectHotspots boba placement inset from counter ends so props stay inside mobile stage letterbox.

- **M2-11** [P0] (camera) Dish select never reframes camera onto the food
  - evidence: Screenshot_20260731_210607 → 210616 sequence: choosing Miso only spawns a pill; camera stays far/hero or free-orbit — no dolly/focus to the ordered prop.
  - fix_hint: demos/room/src/ShopCanvas.tsx CAMERA_PRESETS + useEffect on selectedId to ease OrbitControls target/distance to dish hotspot (ProjectHotspots positions); clamp mobile FOV.

- **M2-12** [P2] (brand) “Pull up a stool” promises interaction stools never deliver
  - evidence: Screenshot_20260731_210607_Chrome.png: header tagline “pull up a stool” while three empty stools are dead props with no sit/select affordance; copy oversells the 3D.
  - fix_hint: demos/room/src/App.tsx tagline → “Tap a bowl or the board”; optional stool hit targets only if implemented in ProjectHotspots, else don’t market them.

- **M3-01** [P1] (materials) Boba cups read as empty frosted jars — no tea, pearls, or cold-cup read
  - evidence: Screenshot_20260731_210616_Chrome.png — close counter: twin cups are clear/milky empty shells with candy straws; no liquid column, pearl mass, or condensation craft under warm key (distinct from ramen white-blob issue).
  - fix_hint: /workspace/portfolio/demos/room/src/img2threejs/createBobaCupPairModel.ts — restore continuous tea body + bottom-third pearl silhouette through PET (transmission/IOR), kill frosted-jar opacity; verify under ShopCanvas pointLights + Bloom.

- **M3-02** [P1] (labels) Selected ramen pill floats over boba framing with no leader line
  - evidence: Screenshot_20260731_210616_Chrome.png — giant '…-AGENT RAMEN' chip sits center while primary readable props are boba cups right and only a partial bowl left; guest cannot bind label→food.
  - fix_hint: /workspace/portfolio/demos/room/src/shop/ProjectHotspots.tsx (Html label + stem) — add short leader/stem from prop to ticket; clamp label to owning dish world position; pair with camera reframe on select in ShopCanvas.tsx.

- **M3-03** [P2] (labels) OPEN LATE A-frame chalkboard is an illegible black slab at hero
  - evidence: Screenshot_20260731_210607_Chrome.png + Screenshot_20260731_210641_Chrome.png — right-front sandwich board is near-black with no readable chalk type or hours at phone distance.
  - fix_hint: /workspace/portfolio/demos/room/src/shop/ShopShell.tsx AFrameChalkboard — lift board albedo/emissive chalk stroke size for mobile FOV; bias CAMERA_PRESETS hero so board type survives ~hero distance.

- **M3-04** [P1] (menu) Counter food has zero idle tap affordance (# stubs / rings invisible)
  - evidence: Screenshot_20260731_210607_Chrome.png — hero shows pinprick bowl + distant cups with no #01 chip, hotspot ring, or glow; only way to order is the dense text list (size issue already filed; this is missing discovery chrome).
  - fix_hint: /workspace/portfolio/demos/room/src/shop/ProjectHotspots.tsx showIdleStub / r3f-menu-no — enlarge mobile idle menu# tickets and hairline rings at hero; ensure stackChrome does not hide stubs when panel is open.

- **M3-05** [P3] (brand) Orphan cyan roof glyph floats above kiosk with no brand job
  - evidence: Screenshot_20260731_210641_Chrome.png + Screenshot_20260731_210644_Chrome.png — cyan 'W'/glyph scrap hovers above fascia while main neon is already mushy; reads as debug prop not shop craft.
  - fix_hint: /workspace/portfolio/demos/room/src/shop/CitySquareEnv.tsx roofAccent + ShopShell neon glyph — remove or integrate into NeonBrandSign hierarchy; kill free-floating emissive scrap at beauty FOV.

- **M3-06** [P2] (materials) Noren curtains read as flat plastic color cards, not fabric
  - evidence: Screenshot_20260731_210607_Chrome.png — left hang panels are solid red/orange slabs with no weave, stripe print, or cloth drape under strip light.
  - fix_hint: /workspace/portfolio/demos/room/src/shop/ShopShell.tsx noren materials (norenPrint weave maps) — raise warp/weft contrast + stripe/crest that survives mobile hero; add slight translucency/sheen under counter key lights in ShopCanvas.tsx.

- **M3-07** [P2] (layout) Orbit/hint dock chip collides with stool and cyan LED strip
  - evidence: Screenshot_20260731_210624_Chrome.png — 'Kevin's Ramen & Boba · orbit · click a dish' pill sits directly on stool top + under-counter neon when zoomed; HUD paints over 3D stage.
  - fix_hint: /workspace/portfolio/demos/room/src/styles.css .stage-dock / .stage-dock-hint + App.tsx stage-dock — hide dock when selected or camera distance < threshold; on mobile keep display:none as residual CSS intends and kill deployed leftover chip.

- **M3-08** [P2] (menu) Specials rows are text+color-dots only — no dish thumbnails to map 3D
  - evidence: All shop Chrome stills (e.g. Screenshot_20260731_210607_Chrome.png) — six rows with dots + tech subtitles; guest cannot match list item to counter prop without reading codenames.
  - fix_hint: /workspace/portfolio/demos/room/src/App.tsx menu-item + styles.css .menu-item — add 40–48px food/project thumb or icon per special; sync color with ProjectHotspots portal accent, not orphan dots.

- **M3-09** [P1] (lighting) Counter pendant lamps blow out to featureless white orbs
  - evidence: Screenshot_20260731_210616_Chrome.png — hanging fixtures over counter are pure white blown spheres (not glass shade + filament); different fixture set than street-lamp white ball already filed.
  - fix_hint: /workspace/portfolio/demos/room/src/ShopCanvas.tsx pointLights at counter (~intensity 4.15–4.35) + Bloom luminanceThreshold — lower local intensity, add shade mesh in ShopShell, keep emissive off fixtures so bloom does not sphere-wipe form.

- **M3-10** [P1] (camera) Close orbit hard-cuts half the frame to pure black mid-counter void
  - evidence: Screenshot_20260731_210624_Chrome.png — camera scraped along counter; right half is empty black beyond kiosk lip while left is cream wood + cyan streak; dish unreadable and stage feels broken.
  - fix_hint: /workspace/portfolio/demos/room/src/ShopCanvas.tsx OrbitControls minDistance/maxPolarAngle/target + CAMERA_PRESETS — raise minDistance, tighten polar toward food, optional collision/soft clamp so zoom cannot bury into empty counter slab.

- **M3-11** [P2] (labels) Interior hang-board / menu panel is a blank green placard
  - evidence: Screenshot_20260731_210641_Chrome.png — left interior wall shows a featureless greenish rectangle where a readable specials board should live; world menu does zero wayfinding work.
  - fix_hint: /workspace/portfolio/demos/room/src/shop/ShopShell.tsx interior board mesh — paint chalk specials / #01–#06 that match App menu at hero+front presets; or kill placard if unused so it stops reading as broken UI.

- **M3-12** [P2] (materials) Stools read as stick-figure discs floating on the purple pad
  - evidence: Screenshot_20260731_210607_Chrome.png — three stools are thin-legged cream discs with no seat grain, foot ring, or convincing contact shadow; toy furniture on cyclorama.
  - fix_hint: /workspace/portfolio/demos/room/src/shop/ShopShell.tsx Stool — strengthen contact darkening disc, seat varnish/wear maps, leg thickness at hero FOV; ensure ground bounce in ShopCanvas does not crush contact into purple pad mush.

- **M4-01** [P1] (lighting) City-square surround fails to read — kiosk island in pure void
  - evidence: Screenshot_20260731_210638_Chrome.png / 210644 / 210648: orbit flanks show only purple pad + black empty; no plaza buildings, curb, or street depth — shop is a cutout on a studio cyclorama.
  - fix_hint: /workspace/portfolio/demos/room/src/shop/CitySquareEnv.tsx (building/lamp exposure) + ShopCanvas.tsx ambient/env lights — lift night midtones so surround reads on mobile GPU; avoid pure black far plane.

- **M4-02** [P1] (materials) Kiosk side/rear shell is untextured black cardboard
  - evidence: Screenshot_20260731_210644_Chrome.png and 210648: side and back faces are flat black boxes with zero wood, posters, vents, or trim — only the storefront is art-directed.
  - fix_hint: /workspace/portfolio/demos/room/src/shop/ShopShell.tsx — side/rear wall materials (siding, paper bills, metal trim, warm bounce) so full-yaw orbit never reveals an unfinished mesh.

- **M4-03** [P2] (brand) Airborne hard-edged confetti cubes clutter brand silhouette
  - evidence: Screenshot_20260731_210607_Chrome.png (pink cube left of neon) and 210641 (multicolor cubes near lamps) — floating primary-color blocks read as particle junk, not signage.
  - fix_hint: /workspace/portfolio/demos/room/src/shop/ShopShell.tsx / CitySquareEnv.tsx — remove or re-ground stray emissive boxes; keep only intentional signpost blades and marquee.

- **M4-04** [P1] (lighting) Warm amber monochrome wash kills dish color identity
  - evidence: Screenshot_20260731_210616_Chrome.png and 210624: boba, counter, ramen, and pendants all collapse into the same orange soup — no purple/brown tea, chili, or egg white separation.
  - fix_hint: /workspace/portfolio/demos/room/src/ShopCanvas.tsx warm pointLights (intensity/color) + createBobaCupPairModel.ts / createRamenBowlModel.ts albedo; cut warm wrap so cool cup + broth hues survive mobile tone-map.

- **M4-05** [P1] (menu) Menu select never lights the matching 3D prop
  - evidence: All selected frames (e.g. 210607, 210641): Miso row has gold border while the counter bowl has zero emissive ring, scale pulse, or material swap — 2D and 3D feel uncoupled.
  - fix_hint: /workspace/portfolio/demos/room/src/shop/ProjectHotspots.tsx selected state (rim light / stub / scale) wired to selectedId from App.tsx; optional mat boost in createRamenBowlModel.ts.

- **M4-06** [P1] (labels) Selection pill collides with HTML header title stack
  - evidence: Screenshot_20260731_210616_Chrome.png: giant mid-frame "-AGENT RAMEN" pill sits directly under H1/tagline, fighting the same vertical band and leaving almost no clean stage.
  - fix_hint: /workspace/portfolio/demos/room/src/styles.css .r3f-label.selected (mobile max-width, ellipsis) + ProjectHotspots.tsx Html offset; keep stage-chrome and world label on separate bands.

- **M4-07** [P2] (brand) Specials dish names are resume puns, not food
  - evidence: Menu in every shop shot: "Laptop Lunch Set", "Side of Terminal Pickles", "Noise-Meter Nitro" — kills night-market appetite (distinct from tech subtitles under names).
  - fix_hint: /workspace/portfolio/demos/room/public/data/projects.json (and src/data) menuName → real dish names; park repo puns in zone/blurb only.

- **M4-08** [P2] (brand) Hollow cookline — empty interior, no tools/steam/life
  - evidence: Screenshot_20260731_210607_Chrome.png: open bay is vacant orange volume (blank green placard + pendants only) — no shelves, bottles, tickets, cookware, or steam.
  - fix_hint: /workspace/portfolio/demos/room/src/shop/ShopShell.tsx interior density (shelves, bottles, hanging tickets) + light steam/heat cue near ramen prop.

- **M4-09** [P2] (menu) Sticky selection with no clear/dismiss control
  - evidence: Miso stays gold-selected across 210607–210648 with floating label and no × on pill or sheet — deselect is invisible on pure touch.
  - fix_hint: /workspace/portfolio/demos/room/src/App.tsx — visible clear on selected pill/ticket; styles.css dismiss chip; keep toggle-to-deselect but don’t rely on it alone.

- **M4-10** [P2] (camera) Signpost + dual lamps occlude storefront at front-left orbit
  - evidence: Screenshot_20260731_210641_Chrome.png: tall signpost and two blown lamp globes sit between camera and counter food, burying the hero read.
  - fix_hint: /workspace/portfolio/demos/room/src/shop/ShopShell.tsx SignPost position further street-left/out; ShopCanvas.tsx default hero azimuth so props stay edge dressing.

- **M4-11** [P2] (brand) Shop name tripled — H1, neon, and dock chip
  - evidence: Every shop shot: HTML "Kevin's Ramen & Boba" + mushy neon marquee + bottom dock "Kevin's Ramen & Boba · orbit · click a dish" — triple brand tax on a tiny stage.
  - fix_hint: /workspace/portfolio/demos/room/src/ShopCanvas.tsx remove/hide .pipeline-badge; styles.css force display:none on mobile; App.tsx stage-chrome whisper-only when neon is on.

- **M4-12** [P2] (menu) Specials rows omit #/price — settings list, not a menu
  - evidence: Bottom sheet in all frames: color-dot + dish title + codename only — no item numbers, prices, or order grammar, so it reads as an admin list.
  - fix_hint: /workspace/portfolio/demos/room/src/App.tsx menu-item always show #; optional price in projects.json; styles.css chalk menu grammar (not SaaS cards).

- **M5-01** [P1] (camera) No camera-reset control after free orbit lands in black/void frames
  - evidence: Screenshot_20260731_210624_Chrome.png / 210638 / 210648: user is stuck in under-counter LED abstract, pure black rear shell, or kiosk-as-silhouette frames with only the orbit hint chip — no reset/home camera control.
  - fix_hint: ShopCanvas.tsx OrbitControls + CAMERA_PRESETS.hero: add a sticky 'reset view' control (or double-tap canvas) that lerps to hero preset; tighten minDistance / azimuth soft walls so recovery is rarer.

- **M5-02** [P1] (materials) Open kiosk interior reads as hollow black cavity — no kitchen depth
  - evidence: Screenshot_20260731_210607_Chrome.png: looking into the service window, the volume behind the counter is an empty black box (beyond the blank green placard) — no shelves, steam, pans, or back-bar depth.
  - fix_hint: ShopShell.tsx interior: add back-wall shelves/bottles, warm ceiling bounce plane, subtle steam/particle; ShopCanvas.tsx cool night-window fill already notes hollow interior — raise midtones without washing counter.

- **M5-03** [P1] (lighting) Twin street-lamp globes sit in front of shop and out-bright the neon brand
  - evidence: Screenshot_20260731_210641_Chrome.png: two blown white orbs on the signpost cross-arm physically cover the left storefront and read brighter than the neon marquee, stealing brand hierarchy.
  - fix_hint: ShopShell.tsx SignPost twin lanterns: move pole further street-left, shrink emissiveIntensity/sphere radius, park lamps below marquee band; keep fill-only so neon owns key.

- **M5-04** [P1] (menu) Menu color dots are an orphaned legend — never appear on 3D dishes
  - evidence: Screenshot_20260731_210607_Chrome.png: six accent dots (gold/brown/cyan/green/violet/pink) only live on the sheet; counter bowl and boba show no matching accent ring, badge, or prop tint to close the map.
  - fix_hint: ProjectHotspots.tsx: drive select/idle ring + small prop accent from project.accent (already on menu-item --accent); keep floor rings warm but add a tiny crown pip or ticket edge in the dish color so panel↔prop maps.

- **M5-05** [P1] (materials) Left service-ledge prop is a blank beige placard, not a second dish
  - evidence: Screenshot_20260731_210607_Chrome.png: left half-wall ledge shows a featureless white/beige slab (intended Laptop Lunch / plate) with zero food silhouette — menu lists six specials, stage sells one mushy bowl.
  - fix_hint: ProjectHotspots.tsx DetailedLaptop / left ledge placement: scale up laptop lunch prop, add screen glow + tray silhouette; ensure counter layout keeps it readable at hero FOV in CAMERA_PRESETS.

- **M5-06** [P1] (materials) Bowl and boba levitate — contact shadow unreadable on cream counter
  - evidence: Screenshot_20260731_210616_Chrome.png and 210624: cups and bowl sit on blown cream wood with no visible foot mass/penumbra; food reads glued or floating rather than weighted on oak.
  - fix_hint: ProjectHotspots.tsx ContactRest: raise firm opacity / core radius under ordered props; ShopShell counter wood reduce bloom wash so contact disc reads; avoid cyan floor wash.

- **M5-07** [P2] (menu) Specials list has no prices or playful cost theater
  - evidence: All shop Chrome shots (e.g. 210607): each row is only dish name + tech codename — no $ / 'market price' / 'on the house' ticket mark, so it never reads as a night-market menu board.
  - fix_hint: App.tsx menu-item + projects.json: add a chalk price column (even '$0 · open kitchen') using menu-leaders; styles.css menu-list keep ticket craft not SaaS cells.

- **M5-08** [P2] (labels) Mid-canvas selection pill has no dismiss/close control
  - evidence: Screenshot_20260731_210616_Chrome.png / 210638: giant 'MISO MULTI-AGENT RAMEN' / '-AGENT RAMEN' chip stays glued mid-frame through orbit with no X/clear; only re-tapping the menu row can clear it.
  - fix_hint: ProjectHotspots.tsx Html .r3f-label: add a hit target to call onSelect(null) / clear; on stackChrome mobile prefer panel ticket only (hide mid-void pill) so dismiss lives on board.

- **M5-09** [P2] (brand) Signpost blades, when legible, are portfolio IA not market streets
  - evidence: Screenshot_20260731_210641_Chrome.png: yellow/green/blue blades resolve to meta labels (agents/coding/credits-class copy) rather than alley/ramen district names — breaks food-stall immersion once readable.
  - fix_hint: ShopShell.tsx SignPost signs[]: retarget labels to night-market streets (e.g. 'ramen alley', 'boba row') or hide text at mobile distance; keep colors quieter so blades aren't confetti.

- **M5-10** [P2] (brand) UI H1 duplicates neon shop wordmark — two competing brand titles
  - evidence: Screenshot_20260731_210607_Chrome.png: stage-chrome 'Kevin's Ramen & Boba' sits directly above the 3D neon of the same name, so the phone shows two brand titles fighting one marquee.
  - fix_hint: App.tsx stage-chrome + styles.css: on mobile idle, drop H1 or reduce to eyebrow/OPEN LATE only so NeonBrandSign owns the name; keep full title only if neon is off-frame.

- **M5-11** [P2] (lighting) Fog dissolves kiosk mass at rear three-quarter before silhouette reads
  - evidence: Screenshot_20260731_210644_Chrome.png / 210648: shop softens into purple-black mush; edges and roof mass vanish before the structure can be parsed, worse than simple black cardboard sides.
  - fix_hint: ShopCanvas.tsx fog near/far (#010308, 13.2→31): push fog start out, lower density; add cool rim on rear siding in ShopShell so 3/4 silhouette holds without lifting exposure.

- **M5-12** [P2] (materials) Boba straw and lid are cartoon stick + featureless dome
  - evidence: Screenshot_20260731_210616_Chrome.png: cups already read empty; straws are thick opaque rods and lids are smooth frosted domes with no seal ring, logo emboss, or straw-hole craft.
  - fix_hint: createBobaCupPairModel.ts: translucent straw (IOR + slight bend), lid seal ridge + straw grommet, film/bead condensate instead of sphere noise; pair with liquid fill fix.
