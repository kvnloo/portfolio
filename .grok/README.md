# Grok harness for this portfolio

Project-local Grok Build orchestration. **Reusable:** clone the repo, open it in
Grok, run the commands below — you do not need the original chat.

Master product bar + ship gate: **[`/prompt.md`](../prompt.md)** (repo root).

## Quick start

```text
/effort high
/workflow ramen-boba-loop {"rounds":12,"start_round":1}
```

Watch progress: `/workflows`  
Stop: `/workflow stop ramen-boba-loop` (or `ramen-boba-loop-2`, etc.)

If the run ends with **ship gate OPEN** (critics NO), **relaunch** with a higher
`start_round` — the host does not auto-chain Rhai runs:

```text
/workflow ramen-boba-loop {"start_round":7,"rounds":16}
```

## Layout

```
.grok/
  README.md                 ← this file
  workflows/
    ramen-boba-loop.rhai    ← quality loop (prompt.md ship gate)
  personas/
    cheap-critic.toml       ← low-effort critic overlay
    cheap-explore.toml      ← low-effort explore overlay
    focused-impl.toml       ← medium-effort implementer overlay
```

| Name | File | When to use |
|------|------|-------------|
| `ramen-boba-loop` | `workflows/ramen-boba-loop.rhai` | Product loop: scene + chrome UI + camera/UX + placement until ship |

## What the quality loop does (v4)

Each round (while `start_round … rounds`):

1. **Bootstrap** — residuals tags **A–E** (lighting · placement · materials · chrome · camera/ux).
2. **Parallel implementers** — shell | lighting+camera | ramen | boba, then **ui** | portals.
3. **Product capture** — `npm run capture:product` → beauty + placement + **chrome** packs.
4. **Six critics** — materials · lighting/style · neon/read · placement · **chrome/brand** · **camera/ux** (unanimous).
5. **Persist** — critic pass + LOOP-RESIDUALS + PROMPT-TRUTH.
6. Gate OPEN → continue / relaunch (host does not auto-chain).

**Stack law:** continue existing React 19 + R3F room — never rewrite the app.

## Args

| Arg | Default | Meaning |
|-----|---------|---------|
| `start_round` | 1 | First label index (`loop-rN`) |
| `rounds` | 8 (cap 16) | **How many** rounds to run (not an end index) |

Examples:

```text
/workflow ramen-boba-loop {"rounds":8}
/workflow ramen-boba-loop {"start_round":17,"rounds":8}   # → loop-r17 … loop-r24
```

Agent budget (when launching via tool): **384–512** recommended (~15 agent slots/round with chrome).

## Personas

Defined under `personas/` for low/medium reasoning effort. Workflow agents primarily
use `agent_type: explore` (critics/bootstrap) vs `general-purpose` (implementers)
plus TOKEN-MIN prompts — personas document the intended thrift policy for future
agent definitions.

## GitNexus

```bash
npx gitnexus analyze .    # from repo root
npx gitnexus status
npx gitnexus query "ShopShell neon brand"
npx gitnexus impact NeonBrandSign
```

Prefer CLI over MCP for token cost. See root `AGENTS.md` / `CLAUDE.md` GitNexus blocks.

## Related room tooling

| Command | Purpose |
|---------|---------|
| `cd demos/room && npm run capture -- --label X --beauty` | Multi-angle beauty PNGs |
| `cd demos/room && npm run capture:placement -- --label X` | Placement / exterior angle library |
| `node scripts/sync-shop-from-boplog.mjs` | Pull boplog public project data → shop menu + shop-manifest |
| `demos/room/docs/VISUAL-BAR.md` | Rubric |
| `demos/room/docs/PROMPT-TRUTH.md` | Gate honesty |

### Parallel data surface (boplog)

[boplog](https://github.com/kvnloo/boplog) is the SSOT. The shop **live-fetches** boplog on page load and falls back to a baked snapshot (stale-while-revalidate).

```bash
# optional: refresh baked snapshot from sibling data/
export BOPLOG_DATA_DIR=~/workspace/boplog/data
node scripts/sync-shop-from-boplog.mjs
```

CI deploy checks out `kvnloo/boplog` sparse `data/` and sets `BOPLOG_DATA_DIR` before building the room.

## Extending

1. Add `workflows/<name>.rhai` with pure-literal `let meta = #{ name: "...", ... }`.
2. Keep `meta.name` aligned with filename.
3. Smoke-check: ask the agent to `workflow` tool with `validate_only: true`.
4. Document the new entry in **this README** and in root **`prompt.md`** harness catalog.

Do not rely on Claude’s `ultracode` keyword — it does nothing in Grok.
