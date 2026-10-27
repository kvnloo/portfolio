# PC room vertical slice acceptance contract

Status: frozen builder contract. `acceptanceClaim: false`.

## Exact scope

Room shell, desk, desktop tower, one primary display, restrained lighting, a guided entrance, controlled orbit/zoom, and one tower details interaction. No chair, secondary display, peripherals, cables, animated RGB, ingest system, or whole-room traversal.

## Mechanical gates

- Route: `/portfolio/demos/room/?setup=1`.
- Entrance settles into an overview without a black frame. Reduced-motion starts at overview.
- Orbit is clamped, pan is disabled, and camera near/far and distance limits prevent geometry traversal.
- Pointer and keyboard controls expose the same overview and tower-detail states.
- Mobile keeps controls and details readable without horizontal overflow.
- WebGL failure renders a textual static fallback.
- Desktop budget: p95 frame <= 16.7 ms, <= 120k triangles, <= 80 calls, transfer <= 20 MB.
- Mobile budget: p95 frame <= 33.3 ms, <= 60k triangles, <= 45 calls, transfer <= 8 MB.
- No private source bytes, metadata, filenames, host/network identifiers, serials, or manufacturer imagery in source, dist, or evidence.

## Visual rubric

Composition and authored presentation; geometric plausibility; material and lighting behavior; interaction legibility; rendering artifacts; mobile framing; and the established authored-room quality bar. Labels-hidden overview plus labeled interaction views are both required and uncropped.

## Blind critique protocol

One identical privacy-reviewed desktop/mobile packet from the exact commit and settings. Strip filenames and model provenance; randomize candidate labels before ballots. Independent low-fanout critics: exact Sol 5.6 visual route, exact Grok 4.6 visual route, and at least one verified installed local SVLM. Optional verified OpenRouter vision critics may be added without relabeling. Critics receive only the packet and frozen rubric, never builder rationale, previous votes, candidate identity, private sources, or other ballots.

Raw prompt, ballot bytes, exact model/provider/revision, timestamp, image hashes, randomized mapping, and disagreements are sealed before identities are revealed. Consensus rule: at least three valid pixel-grounded ballots, strict majority promote, and zero geometric, privacy, runtime, or accessibility oracle failures. Tie or disagreement triggers one bounded revision and new evidence round. Builder cannot certify.
