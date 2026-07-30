# The prompt

This is the entire prompt that produced this repository.

```
I want you to build an interactive personal portfolio website at the level of jesse-zhou.com (Jesse's Ramen / the 3D room portfolio). It should be utterly perfect, visually beautiful, with every single thing done at that fidelity—from materials and lighting to interaction, camera, and atmosphere. Brand it as Kevin's Ramen & Boba (Kevin Rajan / kvnloo): a ramen + boba shop that showcases real projects as menu items and clickable props, not a generic resume page.

The reference bar is jesse-zhou.com. Study it, capture it, and match its craft: immersive 3D (or equivalent high-fidelity presentation), premium materials, readable interaction, and a shop that feels like a place—not a hobby WebGL demo or flat Tailwind card grid.

Use Grok Imagine (image_gen / image_edit) for high-fidelity reference plates, textures, and look-dev stills. Use img2threejs (https://github.com/img2threejs/img2threejs) for reconstruction-by-code: reference image → forge pipeline → form/material passes → animation-ready Three.js factories. Do not ship untextured primitives or unreviewed blockouts. Prefer code-only procedural Three.js models grounded in Imagine references over downloaded art packs.

Fan out sub-agents and have sub-agents tackle each system individually so the portfolio is utterly perfect—shop shell, lighting, ramen props, boba props, menu/UI, project portals, loading, mobile, capture harness. You should /loop on each item and have a separate sub-agent check it visually to ensure it hits jesse-zhou-class quality. That separate sub-agent should be a really harsh critic, and if it doesn't look that good, it should keep going.

Don't stop until each sub-agent is utterly wowed with the quality when compared with jesse-zhou.com (and your Imagine reference plates). It should literally compare them side by side blind and say which one looks better. Do this in Three.js (React Three Fiber is fine). /loop until it's utterly perfect. Fan out sub-agents and ultracode.

Ship under demos/room (and demos/spline if needed), with npm run capture / visual verification, docs/VISUAL-BAR.md style rubric, and project portals to real work (Evolve, ACE, .files, tmux-agent-fleet, AudioEngine, Monument). The whole build is driven by this prompt.md—do not invent a lower bar.
```
