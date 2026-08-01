# Critic pass — loop-r7 (harsh, jesse-zhou blind bar)

**Date:** 2026-07-30  
**Capture label:** `loop-r7`  
**capture_ok:** **true** (multi-angle beauty; non-black frames)  
**Rubric:** `docs/VISUAL-BAR.md`  
**Ship gate:** unanimous ship required among usable critics  
**Reference:** `shots/ref-jesse-zhou-02.png` (primary)  
**Our shots:** `shots/loop-r7/` (`01-beauty-hero.png` … `06-beauty-overhead.png`)

## Scores / ship / prefer

| Field | Value |
|-------|------:|
| usable_critics | 3 |
| ship_votes | 0 |
| prefer_votes | 0 |
| ship | **false** |
| prefer_ours | **false** |
| Unanimous ship | **required → not met** |
| Gate | **OPEN** |
| Blind pick | **jesse-zhou** |

| Criterion (VISUAL-BAR) | Score (≈) | Notes |
|------------------------|----------:|-------|
| Material fidelity | ~3–4 | Boba = glowing emissive cylinders (not plastic transmission + tea + condensate); ramen weak ceramic clearcoat, broth/noodles plastic + overexposed; counter top plastic-flat vs apron wood; noren flat color cards; laptop/bottles/faucet default three.js prims |
| Lighting / night mood | ~4–5 | Present; emissive boba + overexposed food break cohesion |
| Atmosphere | ~3–4 | No fabric sheen/weave/fold; incomplete varnish/wear hierarchy |
| Composition | ~4–5 | Shop mass readable; craft fails food + fabric + secondary props |
| Brand | ~5–6 | Readable; material stack below jesse ceramic / wood varnish / neon glass |
| Not toy-like | ~3–4 | Emissive cups, plastic food, flat curtains, default primitives |
| Interaction clarity | n/a stills | Not ship driver this round |
| **Average** | **≪ 8** | Fail ship bar (need avg ≥ 8, no score &lt; 7) |

## Verdict

**DO NOT SHIP.** Gate **OPEN**. prefer_ours = false (0/3). ship_votes = 0/3.

Captures are **evidence-valid** (`capture_ok=true`) but **fail the material / not-toy bar hard**. Material hierarchy still below jesse-zhou ceramic bowls / wood varnish / neon glass. Blind pick remains **jesse-zhou**.

## Critic residuals (carry to `LOOP-RESIDUALS.md`)

1. **Boba** — glowing **emissive cylinders**, not **plastic cup transmission + tea liquid + condensation**  
2. **Ramen** — **weak ceramic clearcoat**; broth/noodles **plastic + overexposed**, not **liquid/food PBR**  
3. **Counter top** — still **plastic-flat** vs **apron wood**; **varnish/wear hierarchy incomplete**  
4. **Noren / curtains** — **flat color cards** (no fabric sheen, weave, or fold response)  
5. **Secondary props** (laptop, bottles, faucet) — **default three.js primitives**  
6. **Material hierarchy** — still below jesse-zhou **ceramic bowls / wood varnish / neon glass**

## Loop contract check

1. Capture `loop-r7` — **done, OK**  
2. Independent harsh critics (3 usable) — **done**  
3. Unanimous ship — **failed (0)**  
4. Prefer ours blind — **failed (0)**  
5. Record this file + refresh residuals + PROMPT-TRUTH — **this pass**
