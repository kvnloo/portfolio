# Figma portfolio, refined

An editorial evolution of the original white-canvas and hexagonal-employer design. The original implementation remains in commit `1dc001c3933a27f2c62f8cc21dbb255af9d676d8`; this version deliberately improves its hierarchy, mobile layout, and interaction design.

## Run

```sh
npm ci
node tests/figma-server.cjs
```

Open `http://127.0.0.1:4178/portfolio/dev/figma/`.

## Design and behavior

- Inter with a restrained system-serif contrast, ruled story index, and original employer artwork
- Complete career index: nine employers plus a clearly labeled Sabbatical / Ultralearning chapter, each with a direct route
- Detailed current roles at zero, LLC, Outlier / Scale AI, and Slalom Consulting, using the supplied resume’s titles and date ranges
- Earlier roles at Synchrony Financial, AWS/Fargate, BlueCross BlueShield / HCSC, Prenosis, Wipro Consulting, and ByteBros
- Three illustrated case studies retain their source-backed interaction models
- Contribution controls synchronously update a source-backed explanation and an explicitly illustrative model of the work
- Six distinct model states: promotional programs/preferences, operational visibility/capacity response, and employee journeys/technology landscape
- Active Evolve and HackIllinois coverage, plus separately labeled historical ACM and CodePath leadership
- The supplied current resume resolves recent title/date conflicts; corroborated individual dates are retained for earlier roles rather than applying its aggregate prior-experience heading
- Compact named desktop career navigation and a labeled native mobile selector
- Keyboard navigation, direct routes, Back/Forward, skip link, index-row focus/scroll restoration, and reduced-motion alternatives
- No runtime framework, third-party requests, continuous animation, fabricated product screenshots, or raw resume downloads

The BCBS mark is a typographic label, not a claimed logo reconstruction. The unidentified fourth source mark is preserved as an asset but omitted from navigation. Resources is intentionally typographic. The models explain responsibilities and do not reproduce employer interfaces or report measured production values.

## Validate

```sh
npm run check
npm run test:figma:e2e
node --test tests/nightly-overlay.test.mjs tests/nightly-base.test.mjs tests/nightly-pages.test.mjs
python3 tests/nightly-archive.test.py
```

Hosted Chromium runs desktop (1440), mobile (390), and narrow (320) cases, including rapid/repeated selections, history, keyboard operation, reduced motion, viewport bounds, layout stability, and inspectable screenshots. Script and stylesheet budgets are asserted. Source tests cover semantic color contrast, asset integrity, and bounded career claims.

Pushes on the isolated nightly branch run validation only. Deployment requires an explicit workflow input and the GitHub Pages environment's authorization. The site is not live merely because validation passed.
