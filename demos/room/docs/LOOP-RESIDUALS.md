# Loop residuals — Kevin's Ramen & Boba

**Date:** 2026-07-30  
**Bar:** harsh blind compare vs **jesse-zhou.com** (`prompt.md` ship gate)  
**Rubric:** `docs/VISUAL-BAR.md`  
**Honesty:** `docs/PROMPT-TRUTH.md` · latest critic `docs/CRITIC-PASS-loop-r6.md`  
**Ship gate:** **OPEN** — not met; continue loop

| Field (loop-r6 critic) | Value |
|------------------------|------:|
| capture_label | `loop-r6` |
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
| **Best beauty still (R3F)** | `demos/room/shots/loop-r6/01-beauty-hero.png` | Valid non-black; craft still fails bar |
| **Front brand check** | `demos/room/shots/loop-r6/03-beauty-front.png` | Brand/noren residual check |
| **Counter crop** | `demos/room/shots/loop-r6/04-beauty-counter.png` | Countertop / ramen / boba residuals most visible |
| **Prior beauty (loop-r5)** | `demos/room/shots/loop-r5/01-beauty-hero.png` | Keep for regression |
| **Prior beauty (loop-r4)** | `demos/room/shots/loop-r4/01-beauty-hero.png` | Keep for regression |
| **Prior beauty (loop-r3)** | `demos/room/shots/loop-r3/01-beauty-hero.png` | Keep for regression |
| **Prior beauty (loop-r2)** | `demos/room/shots/loop-r2/01-beauty-hero.png` | Keep for regression |
| **Prior beauty (loop-r1)** | `demos/room/shots/loop-r1/01-beauty-hero.png` | Keep for regression |
| **Prior beauty (critic-v3)** | `demos/room/shots/critic-v3/01-beauty-hero.png` | Keep for regression |
| **Best overnight + UI** | `demos/room/shots/overnight-03b/01-hero.png` | Full chrome + project panel |
| **Jesse ref (stall)** | `demos/room/shots/ref-jesse-zhou-02.png` | Primary blind target — neon night-market diorama |
| **Jesse ref (intro)** | `demos/room/shots/ref-jesse-zhou-01.png` | START screen only — not craft bar |
| **Imagine appetite plate** | `demos/room/shots/imagine-v2/01-hero.png` | Material/food upper bound (still, not live 3D) |
| **Discard / weak** | `shots/overnight-03/` (too early), `shots/loop-proper-01/` (black frame) | Do not score |

**Primary blind pair for next critic:**  
`loop-r6/01-beauty-hero.png` **vs** `ref-jesse-zhou-02.png`  
(secondary: `loop-r6/04-beauty-counter.png` for material residuals)

---

## Current state (one line)

**loop-r6 critic (3 usable, 0 ship, 0 prefer):** captures valid (`capture_ok=true`) but materials fail hard — **ramen** ceramic lacks clearcoat/glaze ring; broth + noodles read soft/plastic not liquid/food; **boba** weak pearl volume, no condensation, generic cylinder transmission vs premium plastic/glass; **noren/menu** flat color slabs (no fabric weave, chalk, micro-roughness); **floor / stool legs / shell walls** default matte plastic primitives; **faucet/sink/metal rail** lack metalness/anisotropy — chrome missing; **counter wood grain/varnish is the only surface that approaches bar** — props do not match it. Blind pick still **jesse-zhou**; nowhere near average ≥ 8.

Key code: `src/shop/ShopShell.tsx`, `src/ShopCanvas.tsx`, `src/shop/ProjectHotspots.tsx`, `src/img2threejs/createRamenBowlModel.ts`, `src/img2threejs/createBobaCupPairModel.ts`, `tools/capture.mjs`.

---

## Top residuals (by blind-compare impact) — refreshed after loop-r6 critic

### 1. Ramen bowl — ceramic clearcoat / glaze ring; broth + noodles as liquid/food — `ramen` — **OPEN**
- **Why (critic):** Ceramic lacks clearcoat/glaze ring; broth + noodles read **soft/plastic**, not liquid/food surface.
- **Do:** Bowl **ceramic glaze + clearcoat + glaze ring**; broth as **liquid surface** (spec/roughness/translucency); noodles as **food form** (kill soft plastic mass).
- **Where:** `createRamenBowlModel.ts`; counter deco in `ShopShell`.
- **Prove:** beauty/counter crop; Material / Not-toy ≥ 8 on food.

### 2. Boba — pearl volume, condensation, premium cup transmission — `boba` — **OPEN**
- **Why (critic):** Weak **pearl volume**, **no condensation**, **generic cylinder transmission** vs premium plastic/glass.
- **Do:** **Pearl sphere volume** + depth; exterior **condensation**; cup as **premium plastic/glass transmission** (not generic frosted cylinder).
- **Where:** `createBobaCupPairModel.ts`.
- **Prove:** beauty/counter crop — pearls + condensate + premium cup; Not-toy ≥ 8.

### 3. Noren / menu tiles — fabric weave, chalk, micro-roughness — `shell` · `ui` — **OPEN**
- **Why (critic):** Noren/menu tiles are **flat color slabs** — no fabric weave, chalk, or micro-roughness.
- **Do:** Noren **fabric weave + sheen/opacity**; menu **chalk / board micro-roughness** (not flat slabs).
- **Where:** noren + menu meshes in `ShopShell.tsx` / related UI props.
- **Prove:** front/hero stills read cloth weave + chalk board; Not-toy ≥ 8.

### 4. Floor / stool legs / shell walls — leave default matte plastic primitives — `shell` — **OPEN**
- **Why (critic):** Floor, stool legs, shell walls still **default matte plastic primitives**.
- **Do:** Authored **albedo + roughness** (floor tile/wood, stool metal/wood legs, wall plaster/paint) — kill default Standard plastic look.
- **Where:** floor / stool / wall meshes in `ShopShell.tsx`.
- **Prove:** hero/overhead stills read material variety; Not-toy ≥ 8.

### 5. Faucet / sink / metal rail — metalness / anisotropy / chrome — `shell` — **OPEN**
- **Why (critic):** Faucet/sink/metal rail **lack metalness/anisotropy**; **chrome is missing**.
- **Do:** **metalness high**, **low roughness**, optional **anisotropy** on rails; true **chrome** read under env light.
- **Where:** faucet / sink / rail meshes in `ShopShell.tsx`.
- **Prove:** counter/hero stills show chrome metals vs wood; Material ≥ 8.

### 6. Material parity — props must match counter wood bar — `shell` · `ramen` · `boba` — **OPEN**
- **Why (critic):** Counter wood grain/varnish is the **only** surface that approaches bar; props do not match it.
- **Do:** Lift residuals #1–#5 to the **same craft level as counter wood** (grain/varnish standard); no single “hero” material while everything else is plastic.
- **Where:** all prop materials above; compare against counter in `ShopShell.tsx`.
- **Prove:** beauty/counter crop — food, cups, fabric, metals, floor read as one cohesive set matching counter wood quality; Material / Not-toy ≥ 8.

---

## Explicit non-goals this round

- Lowering the jesse bar or declaring ship on portfolio utility alone.
- Claiming ship while any of residuals #1–#6 still fail critic stills.
- Random polish outside this list while critics still prefer jesse.
- Replacing live R3F with Imagine stills only (plates are reference upper bound).
- Perf re-bloat: any light/prop adds must stay within `docs/PERFORMANCE.md` spirit.

---

## Loop contract (reminder)

1. Pick **one** residual (prefer ramen #1, boba #2, metals #5, parity #6 — highest critic pain).  
2. `cd demos/room && npm run build && npm run capture -- --label <round> --beauty`  
3. Independent harsh critic: open PNGs + this list + `VISUAL-BAR` + `ref-jesse-zhou-02.png` → ship YES/NO only. **Unanimous ship required.**  
4. Record critic md under `docs/`; update `PROMPT-TRUTH.md`.  
5. Stop only on **prefer ours blind** or hard blocker with evidence.

**Status:** Gate **OPEN**. loop-r6 = `capture_ok=true`, **0/3 ship**, **0/3 prefer ours**. Ramen no glaze/clearcoat ring + soft plastic food; boba weak pearls/no condensate/generic transmission; noren/menu flat slabs; floor/stools/walls matte plastic; faucet/sink/rail missing chrome; only counter wood approaches bar. No ship without harsh critic YES.
