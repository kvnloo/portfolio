# Visual Bar — Kevin's Ramen & Boba

Reference bar: premium interactive shop portfolios (e.g. jesse-zhou.com) and
cinematic food/interior stills — **not** hobby WebGL primitives.

## Rubric (harsh critic)

Score each shot 0–10. **Ship only if average ≥ 8 and no score < 7.**

1. **Material fidelity** — wood grain, ceramic glaze, liquid translucency, condensation, fabric, neon glass. Flat plastic shaders fail.
2. **Lighting** — clear key + warm fill + cool night window bounce; contact shadows; no uniform ambient mush.
3. **Atmosphere** — steam, rain on glass, depth layering (near/mid/far).
4. **Composition** — readable shop story in one glance; hero subject not lost.
5. **Brand** — “Kevin’s” / shop identity readable without looking like a default template.
6. **Not toy-like** — no raw untextured boxes, no default three.js look, no stock UI chrome clashing with the scene.
7. **Interaction clarity** — hotspots discoverable; selected project panel matches the zone.

## Verification loop (cod-style)

1. `npm run build && npm run capture` → `shots/<label>/`
2. Critic agent (or human) opens shots + this rubric side by side with jesse-zhou-class reference.
3. If any tell from “hobby project” list fails → regenerate assets with Imagine / image_edit or rework UI — **do not polish trash geometry**.
4. Re-capture. Loop until critic would pick this over a generic Tailwind portfolio.

## Asset pipeline

- **Primary:** Imagine `image_gen` / `image_edit` hero + detail plates.
- **Integration:** full-bleed hero + parallax + hotspot portals (2.5D). High fidelity first.
- Optional later: textured 3D only if it **beats** the 2.5D still in blind compare.
