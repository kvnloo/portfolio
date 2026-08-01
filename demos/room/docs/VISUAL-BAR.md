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

1. **Material fidelity** — wood grain / varnish variation, ceramic glaze + clearcoat, liquid translucency, condensation, fabric sheen, neon glass, plastic cup transmission. Flat plastic shaders fail. Materials must remain **legible under the lighting** (not blown out / neon-washed into pink mush).
2. **Lighting (realism first)** — clear **warm key** + **cool window fill** + modest lantern accents; contact shadows; readable midtones. Fail if: uniform magenta/violet mush, blown bloom, emissive props acting as light bulbs, or “glowing forest / magic cave” instead of a **night street kiosk**.
3. **Style discipline** — playful mysticism is **a spice, not the meal**. Target: jesse-zhou night-market craft (readable shop, food, wood, neon glass) — not synthwave fog, not enchanted woods. If the still looks “magical” before it looks “ramen shop,” **fail**.
4. **Neon / brand readability** — channel lettering and sign face must be **legible at hero + front + three-quarter**. Fail if tubes are illegible, drowned in bloom, or the sign is a glowing blob. Exterior marquee placement still required (see Placement).
5. **Detail visibility** — ramen, boba, counter grain, stools, menu, portals must resolve as shapes. Fail if bloom/fog/emissives hide form (user can’t “see the details”).
6. **Atmosphere** — light steam + depth fog only if they **don’t** erase mid-ground props. Prefer restrained falloff over heavy purple haze.
7. **Composition** — readable shop story in one glance; hero subject not lost; orbit constrained so the room stays framed.
8. **Brand** — “Kevin’s Ramen & Boba” neon + chalkboard readable; visitor-facing tagline (not pipeline debug copy). Neon marquee on **exterior** street face.
9. **Not toy-like** — no raw untextured boxes as hero; no default three.js look; UI chrome matches warm night shop.
10. **Interaction clarity** — hotspots discoverable (hover ring + label); selected project panel matches the zone; mobile panel stacks below canvas.
11. **Placement** — placement library stills: no interpenetration, no float without contact, scale coherent, brand fully exterior-readable.
12. **Chrome / brand cohesion** — With UI visible (`shots/<id>-chrome/`), overlays feel like the **same night shop** (menu board / ticket / warm paper+ink), not a generic dark SaaS panel. Palette/type/radius support the kiosk; 3D remains hero. Fail if chrome fights neon or looks like a separate product.
13. **Camera / motion UX** — Default framing shows the full shop; orbit damping calm; FOV sensible; no void/nausea; select/hotspot feedback clear. Optional soft settle OK; no heavy cutscene scope.
14. **Environment / plaza** — City square surround (`CitySquareEnv`) reads as a night Japanese street/plaza that fits the kiosk: greenery, neighbor buildings, street furniture. Env density showcases game-env craft without burying the shop or reintroducing mystical mush. Photosphere (`capture:photosphere`) should show continuous surround, not a kiosk floating in void.

### Chrome fail examples (auto NO on chrome pack)

| Fail | Looks like… |
|------|----------------|
| SaaS panel | Flat admin dashboard beside a handmade kiosk |
| Brand split | Cool gray UI vs warm wood/neon 3D with no shared tokens |
| Hierarchy fail | Giant chrome drowns the shop canvas |
| UX break | Menu click does not match detail; mobile unusable |

### Lighting / style fail examples (auto NO)

| Fail | Looks like… |
|------|----------------|
| Over-bloom | White/pink halos; neon letters unreadable |
| Emissive soup | Everything glows; no dark negatives; “glowing forest” |
| Unrealistic fill | Flat magic ambient; no warm key / cool window story |
| Detail loss | Counter food / wood grain / props dissolve into haze |
| Mysticism overload | Style reads fantasy portal before street food stall |

**Pass target:** night market kiosk you could photograph — warm interior, cool street edge, **readable neon**, **visible food and wood**.

## jesse-zhou checklist (parity intent)

| Criterion | Pass when… |
|-----------|------------|
| Room enclosure | Walls/floor/ceiling close the space; camera cannot look into void |
| Prop storytelling | Each project maps to a menu object with scale/glow selection |
| Night mood | Cool window + warm interior; fog matches background |
| Premium UI | Loading until first frame; serif shop name; muted pipeline tone |
| Performance | Smooth orbit; shadows + env maps without hitch on mid GPU |

## Verification loop (cod-style)

1. `npm run build`
2. **Product pack:** `npm run capture:product -- --label <id>`  
   (= beauty + placement + chrome → `shots/<id>/`, `*-placement/`, `*-chrome/`)
3. Critics open **all three** packs + this rubric + jesse ref.
4. Score lighting/style, neon/readability, placement, **chrome/brand**, **camera/ux** as first-class.
5. Fix residuals by priority A→E — do not polish trash.
6. Loop until unanimous prefer-ours on the full product gate.

See root `prompt.md` for ship gate + harness catalog.

## Asset pipeline

- **Procedural hero props:** `createRamenBowlModel` / `createBobaCupPairModel` (img2threejs form+material pass).
- **Room shell:** code-only R3F (`ShopShell`) with Physical/Standard materials + roughness variation.
- **Reference plates:** Imagine stills in `public/assets/` for panel imagery.
- Optional later: baked lightmaps / textured UV wood only if they **beat** current look-dev in blind compare.
