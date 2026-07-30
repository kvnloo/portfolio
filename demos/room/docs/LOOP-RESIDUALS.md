# Loop residuals — Kevin's Ramen & Boba

**Date:** 2026-07-30  
**Bar:** harsh blind compare vs **jesse-zhou.com** (`prompt.md` ship gate)  
**Rubric:** `docs/VISUAL-BAR.md`  
**Honesty:** `docs/PROMPT-TRUTH.md` · latest critic `docs/CRITIC-PASS-loop-r1.md`  
**Ship gate:** **OPEN** — not met; continue loop

| Field (loop-r1 critic) | Value |
|------------------------|------:|
| capture_label | `loop-r1` |
| capture_ok | **true** |
| usable_critics | 3 |
| ship_votes | 0 |
| prefer_votes | 0 |
| ship | **false** |
| prefer_ours | **false** |
| Unanimous ship | required → **failed** |

Systems: `shell` | `lighting` | `ramen` | `boba` | `ui` | `portals` | `capture`

This file is the residual backlog for the quality loop.  
**Do not treat as done.** Implement → capture → independent critic → only then retire an item.

---

## Best existing shot paths

| Role | Path | Notes |
|------|------|--------|
| **Best beauty still (R3F)** | `demos/room/shots/loop-r1/01-beauty-hero.png` | Valid non-black; craft still fails bar |
| **Front brand check** | `demos/room/shots/loop-r1/03-beauty-front.png` | Brand readable; neon face still flat graphic |
| **Counter crop** | `demos/room/shots/loop-r1/04-beauty-counter.png` | Wood / ramen / boba residuals most visible |
| **Prior beauty** | `demos/room/shots/critic-v3/01-beauty-hero.png` | Keep for regression |
| **Best overnight + UI** | `demos/room/shots/overnight-03b/01-hero.png` | Full chrome + project panel |
| **Jesse ref (stall)** | `demos/room/shots/ref-jesse-zhou-02.png` | Primary blind target — neon night-market diorama |
| **Jesse ref (intro)** | `demos/room/shots/ref-jesse-zhou-01.png` | START screen only — not craft bar |
| **Imagine appetite plate** | `demos/room/shots/imagine-v2/01-hero.png` | Material/food upper bound (still, not live 3D) |
| **Discard / weak** | `shots/overnight-03/` (too early), `shots/loop-proper-01/` (black frame) | Do not score |

**Primary blind pair for next critic:**  
`loop-r1/01-beauty-hero.png` **vs** `ref-jesse-zhou-02.png`  
(secondary: `loop-r1/04-beauty-counter.png` for material residuals)

---

## Current state (one line)

**loop-r1 critic (3 usable, 0 ship, 0 prefer):** captures valid (`capture_ok=true`) but materials fail hard — lanterns/awnings read **solid candy plastic**, wood is **uniform brown without grain/varnish**, boba **meniscus/condense weak**, ramen **glaze soft + toy toppings**, menu boards / ceiling floats = **untextured albedo planes**, neon sign face = **flat emissive graphic** not glass tubing. Blind pick still **jesse-zhou**; nowhere near average ≥ 8.

Key code: `src/shop/ShopShell.tsx`, `src/ShopCanvas.tsx`, `src/shop/ProjectHotspots.tsx`, `src/img2threejs/createRamenBowlModel.ts`, `src/img2threejs/createBobaCupPairModel.ts`, `tools/capture.mjs`.

---

## Top residuals (by blind-compare impact) — refreshed after loop-r1 critic

### 1. Lanterns + awnings — paper / fabric, not candy plastic — `lighting` · `shell` — **OPEN**
- **Why (critic):** Lanterns/awnings = solid candy plastic; **zero paper translucency or fabric sheen**.
- **Do:** Lanterns → paper-like **transmission** or thin **emissive shell with falloff** (not solid matte pink Standard orbs). Awnings/noren → fabric **roughness + sheen/alpha / fold normal** — kill scallop candy mass.
- **Where:** `PaperLantern`, `ScallopedAwning`, noren block in `ShopShell.tsx`.
- **Prove:** warm glow with soft paper edge; fabric reads cloth not plastic; Lighting / Not-toy ≥ 8.

### 2. Counter / stools / desk wood — grain + varnish — `shell` — **OPEN**
- **Why (critic):** Wood lacks **grain + varnish variation** vs jesse warm timber.
- **Do:** Wood **albedo + roughness** maps (or strong procedural grain); **edge varnish** strip; **contact darkening** under props — kill uniform brown Standard.
- **Where:** counter / stool / desk meshes in `ShopShell.tsx` (`tex-wood.jpg` or better authored maps).
- **Prove:** counter crop shows grain + edge sheen + contact; Material ≥ 8.

### 3. Boba cups — meniscus / condensation / transmission — `boba` — **OPEN**
- **Why (critic):** Weak liquid **meniscus/condensation**; **transmission only middling**.
- **Do:** Cup **transmission / thickness / IOR**; liquid **attenuationColor + thickness** + visible **meniscus ring**; exterior **roughness noise** for condensation; **straw anisotropy**.
- **Where:** `createBobaCupPairModel.ts`.
- **Prove:** beauty/counter crop; liquid reads wet glass; Not-toy ≥ 8 on cups.

### 4. Ramen ceramic glaze + food toppings — `ramen` — **OPEN**
- **Why (critic):** Ceramic glaze **soft**; toppings read **toy prims**, not food materials.
- **Do:** Bowl `MeshPhysicalMaterial` with **clearcoat + clearcoatRoughness + envMap**; layered broth with slight **transmission/roughness**; egg/nori/chashu as **distinct food materials**, not solid colored spheres/boxes.
- **Where:** `createRamenBowlModel.ts`; counter deco in `ShopShell`.
- **Prove:** beauty/counter crop; Material / Not-toy ≥ 8 on food.

### 5. Menu boards + ceiling floats — textured surfaces — `shell` · `ui` — **OPEN**
- **Why (critic):** Menu boards + ceiling floats = **untextured albedo planes** (hobby fail).
- **Do:** Authored **albedo + roughness** (chalkboard grain, paper, metal trim); kill raw colored planes as hero mass; ceiling floaters need thickness/trim or remove.
- **Where:** menu board block + ceiling prop meshes in `ShopShell.tsx`.
- **Prove:** front/hero stills no flat-plane hobby tell; Not-toy ≥ 8.

### 6. Neon sign face — glass tubing, not flat graphic — `shell` — **OPEN**
- **Why (critic):** Neon sign face is a **flat emissive graphic**, not **neon-glass tubing**.
- **Do:** Prefer **tube letter / logo mark** geometry (glass Physical + emissive core + halo) over a single emissive image plane; if plate kept, push channel depth + real tube border that reads as glass at beauty distance.
- **Where:** `NeonBrandSign` / `NeonRamenGlyph` in `ShopShell.tsx`; `public/assets/neon-sign.jpg`.
- **Prove:** Brand ≥ 8 **and** tubes readable vs flat plate; prefer-ours not claimed until critic says so.

---

## Explicit non-goals this round

- Lowering the jesse bar or declaring ship on portfolio utility alone.
- Claiming ship while any of residuals #1–#6 still fail critic stills.
- Random polish outside this list while critics still prefer jesse.
- Replacing live R3F with Imagine stills only (plates are reference upper bound).
- Perf re-bloat: any light/prop adds must stay within `docs/PERFORMANCE.md` spirit.

---

## Loop contract (reminder)

1. Pick **one** residual (prefer materials #1–#4 or boards #5 — highest critic pain).  
2. `cd demos/room && npm run build && npm run capture -- --label <round> --beauty`  
3. Independent harsh critic: open PNGs + this list + `VISUAL-BAR` + `ref-jesse-zhou-02.png` → ship YES/NO only. **Unanimous ship required.**  
4. Record critic md under `docs/`; update `PROMPT-TRUTH.md`.  
5. Stop only on **prefer ours blind** or hard blocker with evidence.

**Status:** Gate **OPEN**. loop-r1 = `capture_ok=true`, **0/3 ship**, **0/3 prefer ours**. Materials + neon tubing + untextured boards fail bar hard. No ship without harsh critic YES.
