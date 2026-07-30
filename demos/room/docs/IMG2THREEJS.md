# img2threejs integration

**Skill / repo:** [img2threejs/img2threejs](https://github.com/img2threejs/img2threejs)  
**Local clone:** `~/workspace/img2threejs`  
**What it is:** reconstruction-**by-code** (procedural `THREE.Group` factories), **not** photogrammetry or mesh download.

## Pipeline used for Kevin's Ramen & Boba props

1. **Reference images** — Imagine plates in `public/assets/{ramen,boba}.jpg`.
2. **Forge intake** (from skill root):
   - `probe_image.py` / `check_reference_admission.py` (PNG)
   - `build_detail_inventory.py` → zone crops + DI skeleton
   - `new_pre_spec_assessment.py` + `new_sculpt_spec.py`
   - `generate_threejs_factory.py` → blockout skeleton (`img2threejs/createRamenBowlModel.ts` scaffold)
3. **Agent form + material pass** — rewrite factories to match reference identity features (bowl flare, broth, noodles, egg, nori, chopsticks; dual boba cups, pearls, condensation). Runtime API kept: `create*Model()`, `userData.sculptRuntime`, optional `userData.tick`.
4. **Viewer** — R3F canvas in `ShopCanvas.tsx` mounts factories, look-dev lights, orbit, click → portfolio projects.
5. **Verify** — `npm run capture` side-by-side with reference strip in UI.

Artifacts: `demos/room/img2threejs/*` (forge JSON + PNG refs).

## Honesty

- Single-view: unseen sides are **inferred** (radial symmetry on bowls/cups).
- Environment (full shop room) is **not** v1 img2threejs (roadmap v1.6); we reconstruct **hero objects** on a counter with shop lighting.
- Blockout generators alone look like boxes — **form pass is required** (this is by design of the skill).
