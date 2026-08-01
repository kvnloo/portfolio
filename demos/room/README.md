# Kevin's Ramen & Boba — 3D Room

Interactive R3F shop. Project portals on bowls, cups, laptop, headphones.

**Product bar + ship gate + Grok harness:** repo root [`prompt.md`](../../prompt.md)  
**Workflow:** [`.grok/workflows/ramen-boba-loop.rhai`](../../.grok/workflows/ramen-boba-loop.rhai) · [`.grok/README.md`](../../.grok/README.md)

## Setup

```bash
npm ci
npm run dev
npm run build
```

Pages base: `/portfolio/demos/room/`

## Capture (evidence for critics)

```bash
# Full product pack (preferred for quality loop)
# → shots/<label>/  +  *-placement/  +  *-chrome/
npm run capture:product -- --label loop-r9

# Individual packs
npm run capture -- --label x --beauty          # pure 3D
npm run capture:placement -- --label x         # exterior / objects
npm run capture:chrome -- --label x            # UI overlays (no ?beauty=1)
```

Camera presets: `src/ShopCanvas.tsx` (`CAMERA_PRESETS` / `__shopSetCamera`).

### Photosphere / city square

```bash
# 6 cube faces + equirectangular 360 panorama of plaza + kiosk
npm run capture:photosphere -- --label plaza
# → shots/plaza-photosphere/equirect.png  faces-cross.png  px..nz.png
```

Environment mesh kit: `src/shop/CitySquareEnv.tsx` (workflow system **`environment`**).
## Docs

| Doc | Role |
|-----|------|
| `docs/VISUAL-BAR.md` | Scoring rubric (incl. placement) |
| `docs/PROMPT-TRUTH.md` | Honesty / ship gate |
| `docs/LOOP-RESIDUALS.md` | Next implement backlog |
| `docs/CRITIC-PASS-*.md` | Per-round critic evidence |

## Shop data ↔ boplog (hybrid, no drift)

**boplog is the SSOT** for project facts. The shop is a visual surface.

| Layer | What happens |
|-------|----------------|
| **Runtime (primary)** | Browser fetches live `kvnloo.github.io/boplog/data/*` (cache-bust `?v=generatedAt`), merges with `scene-map.json`. Menu updates when boplog updates — **no portfolio redeploy**. |
| **Baked snapshot (fallback)** | `prebuild` / `npm run sync:boplog` writes `projects.json` from local `BOPLOG_DATA_DIR` or live fetch. Used for instant paint + offline. |
| **Presentation only** | `src/data/scene-map.json` — zone, menuName, accent, prop role |

```bash
# Refresh baked snapshot (optional; runtime already goes live)
export BOPLOG_DATA_DIR=~/workspace/boplog/data   # or omit to hit live Pages
npm run sync:boplog
npm run build   # prebuild runs sync automatically
```

Force baked only (debug): `?boplog=0` on the shop URL.

| File | Role |
|------|------|
| `src/data/scene-map.json` | Local placement map |
| `src/data/projects.json` | Baked snapshot (do not hand-edit) |
| `src/data/loadShopData.ts` | Stale-while-revalidate loader |
| `public/data/shop-manifest.json` | Machine-readable artifact index |

boplog discovers this surface via `data/surfaces.json` → `interactivePortfolio`.

## Grok recreate (short)

```text
/effort high
/workflow ramen-boba-loop {"rounds":12,"start_round":1}
```

If critics say NO, relaunch with higher `start_round` — see root `prompt.md`.
