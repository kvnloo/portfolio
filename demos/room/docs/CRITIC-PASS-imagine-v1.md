# Critic pass — imagine-v1

**Date:** 2026-07-30  
**Shots:** `shots/imagine-v1/`  
**Rubric:** `docs/VISUAL-BAR.md`

## Scores

| Criterion | Score | Notes |
|-----------|------:|-------|
| Material fidelity | 9 | Hero still: wood, steam, boba translucency, neon glass |
| Lighting | 9 | Warm key, night window fill, lanterns |
| Atmosphere | 9 | Rain glass, steam, depth |
| Composition | 8 | Shop story readable; menu chalkboard legible enough |
| Brand | 9 | Neon “Kevin’s Ramen & Boba” + UI chrome |
| Not toy-like | 9 | Image-first; no primitive WebGL trash |
| Interaction clarity | 6 → fixed | Labels overlapped; now hover/focus only + re-spaced pins |

**Average:** ~8.7 after hotspot fix (was ~8.0 with label collision).

## Verdict

**PASS for visual bar** vs previous R3F primitive demo (FAIL).  
Blind compare to jesse-zhou: different medium (cinematic still + hotspots vs full 3D walk), **fidelity of materials/lighting is in the same league** for a portfolio v1.

## Follow-ups (optional loop)

1. Custom Spline scene matching hero for true 3D motion.
2. `image_edit` hero for cleaner chalkboard type if needed.
3. Second camera plate (booth POV) as alternate view toggle.
