# Overnight status — prompt.md execution

**When:** 2026-07-30 night  
**Prompt:** `/workspace/portfolio/prompt.md`  
**Reference:** jesse-zhou.com (`shots/ref-jesse-zhou-02.png`)

## What shipped

Autonomous loops ran without user input:

| Pass | Focus | Shots |
|------|--------|-------|
| prompt-loop-01/02/03 | Immersive shell, open-front fix | `shots/prompt-loop-*` |
| overnight-01 | Neon stall diorama rewrite + prop v2 | `shots/overnight-01` |
| overnight-02 | Wider framing, roof clutter, noren | `shots/overnight-02` |
| overnight-03 | (black frame — capture too early) | discard |
| overnight-03b | Exposure + capture wait fix | `shots/overnight-03b` **(best)** |

### Systems in place
- **ShopShell:** compact neon stall (not empty props-on-plane), awning, neon Kevin’s sign, signpost, chalkboard, bottles, roof clutter, lanterns, steam, Imagine wood/wall maps
- **Props (img2threejs form v2):** lathe ramen bowl + denser toppings; dual boba with transmission/pearls/condensation
- **Portals:** evolve/ace/monument/files/fleet/audio clickable
- **Stage:** black void + magenta/cyan ground wash (jesse language)
- **Capture:** `npm run capture` / `npm run verify`
- **UI:** loading overlay, menu panel, live/github links

### Preview
```bash
cd ~/workspace/portfolio/demos/room && npm run dev
# /portfolio/demos/room/
```

## Harsh critic (morning)

Compared **overnight-03** vs **jesse-zhou-02** blind:

| Criterion | Score /10 | Note |
|-----------|----------:|------|
| Stage presentation | 8 | Black void + neon floor — same language |
| Stall silhouette / density | 6.5 | Better; still thinner than jesse art-directed clutter |
| Neon craft | 7 | Sign + tubes + signpost present |
| Prop fidelity | 6 | Improved; still short of hand-authored showcase models |
| Color grade punch | 7.5 | Exposure/stage boost helped |
| Portfolio utility | 9 | Clear project portals + panel |
| **Overall vs jesse** | **~7.2** | Same *genre*; not equal craft yet |

**Verdict:** Closest pass so far. **Not** “utterly wowed / prefer ours blind.” Continue loops when awake:

1. More micro-prop density (stickers, cables, hanging characters, particle glitter)
2. Custom neon logo mark (Imagine → plane texture) for “Kevin’s” like jesse’s logo treatment  
3. Another form pass on bowls/cups with comparison sheets  
4. Optional: entrance loading animation like jesse “Cooking Your Ramen…”

## Commits expected on `dev`
See git log for overnight commits after this file is committed.
