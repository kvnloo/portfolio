# The Workshop — personal app store

Open `demos/store/` through an HTTP server. No bundler or install is needed. The existing Pages workflow copies `demos/` for both production and `/dev/`, so this additive route requires no changes to the ramen shop or deployment workflow.

## What is included

- 50 deduplicated, public-source product records, each with a deep-linkable product page (`#/app/<id>`).
- Search across names, descriptions, categories, roles and features; category filters; preview-only filter.
- Ten preview/prototype targets, distinct from repository links.
- The existing Ramen & Boba prototype plus one existing, recorded orbit video. No fabricated product films or faux screenshots.
- Original products, downstream development and open-source collaborations labelled separately. No contribution-count, merge, production-readiness or deployment claims.
- Keyboard focus, Escape close, native modal focus containment, reduced-motion support, and mobile layout.

## Inventory and provenance

Catalog built 2026-11-04 from the public GitHub profile README, `kvnloo/z0` components and suite registries, and a 600-repository public GitHub metadata snapshot. The recent cross-project work report was used for discovery only; private report text, metrics, paths, device information, and application material were not copied into the storefront. Every record has a public source link and date.

`catalog.json` is the reviewed static source used by the page. `scripts/build-app-store.py` is the repeatable inventory compiler; it requires fetched public metadata and registry inputs in `$TMPDIR`, plus Python/PyYAML. The web page itself has zero runtime dependencies beyond optional Google Fonts, and does not call any model.

## Coverage limits

This is a first broad catalog, not a claim to have read every conversation or every repository. The scope is the public z0 registry plus selected product/interface projects grounded in the profile, report, and public repo metadata. Private-only apps (including jobapp and merch material) are intentionally excluded. Some public projects outside the fetched metadata window remain unlisted. Garden Room, Dash, fframestudio and many others have source pages but no verified hosted prototype in this catalog. The next content pass should attach real product-specific captures and existing films after source/privacy review, not manufacture demos.

The Ramen screenshot comes from the existing tracked portfolio screenshot; the film is copied from an existing local orbit capture. Both show the virtual shop, not private room photography. The original assets remain unchanged.

## Verification and publication

The MBP fleet verification submission returned exit 75 before staging because its queue is held. No local build/test fallback is used. Browser verification is recorded separately in the task receipt. No push, merge, or public deployment is performed by this implementation.
