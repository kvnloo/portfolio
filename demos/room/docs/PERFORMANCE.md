# Performance analysis & optimizations (R3F / Three.js)

## Root causes of slowness (before)

| Issue | Why it hurts | Fix applied |
|-------|----------------|-------------|
| **20+ `pointLight`s** | Each light multiplies fragment work for every lit material | Cut to **~6** total (2 stage + 4 shop). Neon tubes use **emissive + bloom only** |
| **Bloom + high DPR (1.85) + 2048 shadows** | Three heavy full-screen/extra passes | DPR **[1, 1.5]** + `AdaptiveDpr`; shadows **1024**; bloom levels 5, higher threshold |
| **`preserveDrawingBuffer: true` always** | Extra GPU copy every frame | Only when `?beauty=1` (capture) |
| **Steam `useFrame` × 48 Standard spheres** | Per-frame material + lighting on many meshes | **18** particles, **MeshBasicMaterial**, 6-seg spheres |
| **`useModelTick` traversed whole trees** | O(n) children every frame for 2 models | Call **`root.userData.tick` only** |
| **Hotspot scale lerp always** | 4 `useFrame`s doing work at rest | Skip when scale ≈ 1 and inactive |
| **Over-tessellation** | Lathe 64, Tube 36×7, 40–48 pearl spheres with shadows | Lathe **28–32**, tubes **16×5**, noodles **18**, pearls **22–28**, **no pearl shadows** |
| **ContactShadows every frame, high res** | Extra render pass | `resolution={512}`, `frames={1}` (bake once) |
| **Environment HDR full intensity** | IBL sample cost | Intensity **0.22** |

## What we did *not* cut (quality-preserving)

- Bloom + vignette (neon look)
- Wood/wall textures
- Full kiosk geometry and project portals
- Physical materials for **broth / PET cups / clearcoat ceramic** (where they matter)

## How to verify

```bash
cd demos/room && npm run dev
# hard-refresh browser
# orbit stall — should feel smoother; neon still blooms
```

Optional: Chrome Performance panel → FPS while orbiting.

## Further free wins (if still heavy on low-end GPUs)

1. `InstancedMesh` for pearls / sesame (batch draw calls)
2. Bake shell into fewer merged meshes
3. `frameloop="demand"` + `invalidate()` on orbit (needs careful steam ticks)
4. Lazy-load boba/ramen models only when near camera
