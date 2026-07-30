# Visual Bar — Kevin's Ramen & Boba

Reference bar: **jesse-zhou.com** (immersive interactive shop) and cinematic
food/interior stills — **not** hobby WebGL primitives floating on a plane.

## Target fidelity

The experience must read as a **full room you can inhabit**:

- Floor, walls, ceiling, beams — closed volume with night fog.
- L-shaped counter + stools, booth seat + table, chalkboard menu.
- Night window with cool emissive bounce; paper lanterns; neon brand sign.
- Steam rising from the counter; warm key + cool fill lighting.
- Contact shadows under props; ACES filmic tone mapping.
- Project hotspots are **menu objects** (ramen, boba, laptop, headphones), not abstract markers.

Score each shot 0–10. **Ship only if average ≥ 8 and no score < 7.**

## Rubric (harsh critic)

1. **Material fidelity** — wood grain / varnish variation, ceramic glaze + clearcoat, liquid translucency, condensation, fabric sheen, neon glass, plastic cup transmission. Flat plastic shaders fail.
2. **Lighting** — clear warm key + cool night window bounce + lantern points; contact shadows; no uniform ambient mush.
3. **Atmosphere** — steam, fog falloff, depth layering (near counter / mid booth / far window).
4. **Composition** — readable shop story in one glance; hero subject not lost; orbit constrained so the room stays framed.
5. **Brand** — “Kevin’s Ramen & Boba” neon + chalkboard readable; visitor-facing tagline (not pipeline debug copy).
6. **Not toy-like** — no raw untextured boxes as hero; no default three.js look; UI chrome matches warm night shop.
7. **Interaction clarity** — hotspots discoverable (hover ring + label); selected project panel matches the zone; mobile panel stacks below canvas.

## jesse-zhou checklist (parity intent)

| Criterion | Pass when… |
|-----------|------------|
| Room enclosure | Walls/floor/ceiling close the space; camera cannot look into void |
| Prop storytelling | Each project maps to a menu object with scale/glow selection |
| Night mood | Cool window + warm interior; fog matches background |
| Premium UI | Loading until first frame; serif shop name; muted pipeline tone |
| Performance | Smooth orbit; shadows + env maps without hitch on mid GPU |

## Verification loop (cod-style)

1. `npm run build && npm run capture` → `shots/<label>/`
2. Critic agent (or human) opens shots + this rubric next to jesse-zhou-class reference.
3. If any tell from “hobby project” list fails → rework geometry/materials/lighting — **do not polish trash**.
4. Re-capture. Loop until critic would pick this over a generic Tailwind portfolio.

## Asset pipeline

- **Procedural hero props:** `createRamenBowlModel` / `createBobaCupPairModel` (img2threejs form+material pass).
- **Room shell:** code-only R3F (`ShopShell`) with Physical/Standard materials + roughness variation.
- **Reference plates:** Imagine stills in `public/assets/` for panel imagery.
- Optional later: baked lightmaps / textured UV wood only if they **beat** current look-dev in blind compare.
