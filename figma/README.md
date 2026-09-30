# Figma portfolio version

A separate version of the portfolio based on the original white-canvas Figma design. Open `figma/index.html`, or serve the checkout locally:

```sh
npm ci
node tests/figma-server.cjs
```

Then visit `http://127.0.0.1:4178/portfolio/dev/figma/`.

## Included

- Original desktop navigation, Inter typography, source-exported employer artwork, and selected-employer states
- About, Contact, Professional Experience, Services, and Resources sections
- Historical experience at Synchrony Financial, AWS/Fargate, and BlueCross BlueShield
- Direct hash links, Back/Forward restoration, keyboard navigation, reduced motion, and mobile layouts
- Existing Work/Lab/OSS companion pages and their source-backed project snapshot

The original Figma body panels were blank. Body copy/layouts and mobile behavior are new implementation decisions. The fourth employer mark is preserved without guessing its identity.

## Remaining design gaps

The original BCBS logo and Resources artwork exports are unavailable, and their slots are explicitly marked pending. The fourth mark's identity needs confirmation. Historical career summaries are selected experience, not a complete current career history.

Source/functional checks pass, but browser rendering and visual comparison could not execute in the build environment. The desktop/mobile/narrow Playwright cases are provided for a browser-capable environment; no pixel-perfect claim is made.

```sh
npm run check
npm run test:figma:e2e
```

This feature branch does not trigger the repository's main/dev Pages deployment workflow. It has not been merged or deployed.
