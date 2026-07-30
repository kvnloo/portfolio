# The prompt

This is the entire prompt that produced this repository — **plus** Grok-native
activation instructions. The creative bar is unchanged; the orchestration section
exists because **Claude Code “ultracode” is not a Grok feature**. Saying
`ultracode` in this chat does nothing special on Grok.

---

## Creative brief (unchanged bar)

```
I want you to build an interactive personal portfolio website at the level of
jesse-zhou.com (Jesse's Ramen / the 3D room portfolio). It should be utterly
perfect, visually beautiful, with every single thing done at that fidelity—from
materials and lighting to interaction, camera, and atmosphere. Brand it as
Kevin's Ramen & Boba (Kevin Rajan / kvnloo): a ramen + boba shop that showcases
real projects as menu items and clickable props, not a generic resume page.

The reference bar is jesse-zhou.com. Study it, capture it, and match its craft:
immersive 3D (or equivalent high-fidelity presentation), premium materials,
readable interaction, and a shop that feels like a place—not a hobby WebGL demo
or flat Tailwind card grid.

Use Grok Imagine (image_gen / image_edit) for high-fidelity reference plates,
textures, and look-dev stills. Use img2threejs
(https://github.com/img2threejs/img2threejs) for reconstruction-by-code:
reference image → forge pipeline → form/material passes → animation-ready
Three.js factories. Do not ship untextured primitives or unreviewed blockouts.
Prefer code-only procedural Three.js models grounded in Imagine references over
downloaded art packs.

Fan out sub-agents and have sub-agents tackle each system individually so the
portfolio is utterly perfect—shop shell, lighting, ramen props, boba props,
menu/UI, project portals, loading, mobile, capture harness. You should loop on
each item and have a separate sub-agent check it visually to ensure it hits
jesse-zhou-class quality. That separate sub-agent should be a really harsh
critic, and if it doesn't look that good, it should keep going.

Don't stop until each sub-agent is utterly wowed with the quality when compared
with jesse-zhou.com (and your Imagine reference plates). It should literally
compare them side by side blind and say which one looks better. Do this in
Three.js (React Three Fiber is fine). Loop until it's utterly perfect. Fan out
sub-agents and run Grok's full multi-agent harness (see "How to run this on
Grok" below)—not Claude's ultracode keyword.

Ship under demos/room (and demos/spline if needed), with npm run capture /
visual verification, docs/VISUAL-BAR.md style rubric, and project portals to
real work (Evolve, ACE, .files, tmux-agent-fleet, AudioEngine, Monument). The
whole build is driven by this prompt.md—do not invent a lower bar.
```

### Ship gate (non-negotiable)

Work is **not done** until:

1. Multi-angle `npm run capture` (incl. beauty hero) produces usable PNGs.
2. Harsh critic subagents score against `demos/room/docs/VISUAL-BAR.md`.
3. Blind compare vs jesse-zhou.com (and Imagine plates): critics **prefer ours**.
4. Verdict is ship / YES — not “good enough for overnight,” not soft-stop.

Until then: implement → capture → critic → fix → repeat. Partial polish while
critics say NO is failure mode, not progress theater.

Live code lives in `demos/room/`. Rubric: `demos/room/docs/VISUAL-BAR.md`.
Honesty log: `demos/room/docs/PROMPT-TRUTH.md`.

---

## Claude “ultracode” vs Grok harness (read this)

### What ultracode actually is (Claude Code, 2026)

On Claude Code, **ultracode is not a model**. It is a **session orchestration
mode**:

| Claude mechanism | What it does |
|------------------|--------------|
| `/effort ultracode` | Sets reasoning to **xhigh** *and* turns on **automatic dynamic workflows** for every substantive task in the session. |
| Keyword `ultracode` in a human prompt | Opt-in for that one task: Claude writes an orchestration script and fans out tens of subagents (trigger was renamed from `workflow` → `ultracode`). |
| Dynamic workflows | Host-owned background orchestration: plan → parallel subagents → adversarial verify; progress in `/workflows`. |

So when you “switch effort to ultracode,” Claude **automatically** spins the
optimal multi-agent pipeline. You do **not** get that from the word alone on
Grok.

### What Grok has that maps (approximate)

| Intent (Claude) | Grok equivalent | Notes |
|-----------------|-----------------|--------|
| Max reasoning | `/effort high` | Effort only — **does not** auto-orchestrate. On **grok-4.5** the menu is only `low` / `medium` / `high` (no `xhigh`/`max`/`ultracode`). |
| Auto multi-agent for hard tasks | **No 1:1 ultracode.** Closest: project **workflow** (`.grok/workflows/*.rhai`) + main agent using `spawn_subagent` / `workflow` tool. |
| Dynamic workflow engine | `workflow` tool + Rhai scripts; slash `/workflow <name>`; dashboard `/workflows` | Deterministic orchestration: `agent()`, `parallel()`, `phase()`, `complete()`. Default **128** agent-call budget (raise with `agent_budget` up to 1024). |
| Continuous until done | `/goal <objective>` | Host rounds + **adversarial completion verification**. Stays active until evidence review passes. Token budget via `--budget`. |
| Periodic re-prompt | `/loop [interval] <prompt>` | Interval scheduler (min 60s) — **not** “until critic YES.” Use for heartbeat checks, not as the main build loop. |
| Fan-out implementers + critics | `spawn_subagent` (types: `general-purpose`, `explore`, `plan`) | Main agent must **choose** to spawn; nothing auto-fires from a magic word. Worktree isolation optional. |
| Skills / agents | `.grok/skills`, `.grok/agents`, personas | Behavioral overlays; not auto ultracode. |
| Imagine assets | `image_gen` / `image_edit` (+ imagine skill) | Same creative intent as in the brief. |

**Bottom line:** On Grok you must **explicitly** activate workflows, goals, or
subagent fan-out. Raising effort alone only thinks harder on one agent.

---

## How to run this on Grok (preferred order)

### Option A — Project workflow (closest to Claude dynamic workflows)

```text
/effort high
/workflow ramen-boba-loop {"rounds":6,"agent_budget":256}
```

Or ask the main agent:

```text
Run the ramen-boba-loop workflow from .grok/workflows/ with high agent_budget.
Do not stop until critics prefer ours vs jesse-zhou (or budget is exhausted with
an honest NO report).
```

Definition file: `.grok/workflows/ramen-boba-loop.rhai` (v2: max parallel systems + GitNexus + continue-stack)  
Watch progress: `/workflows`

**v2 harness rules (baked into the workflow):**

- **Continue, don’t rewrite** — React 19 + R3F + drei + three + postprocessing + Vite + Playwright only.
- **Max concurrency** — each round `parallel()`: shell | lighting | ramen | boba, then capture, then 3 critics.
- **Token thrift** — critics/bootstrap/persist use `explore` (cheaper role); tight “TOKEN-MIN” prompts; schema-only outputs.
- **GitNexus** — portfolio indexed; implementers must `npx gitnexus query|context|impact` before big edits (CLI, not MCP).
- **Visual verification** — every round: `npm run build` + `npm run capture -- --label loop-rN` + harsh PNG critics.

### Option B — Goal mode (autonomous until verified)

```text
/effort high
/goal Execute portfolio/prompt.md for demos/room until harsh critics prefer
  Kevin's Ramen & Boba over jesse-zhou.com in blind PNG compare. Evidence must
  include capture shots + critic reports. Do not soft-stop. --budget 2000000
```

Use when you want host-driven rounds with completion gates. Check: `/goal status`.

### Option C — Main-session ultracode-style (manual, what the agent should do)

Paste or `@prompt.md` and require the harness:

```text
@prompt.md — activate full Grok multi-agent harness (not Claude ultracode):
1. /effort high on this session (max for grok-4.5; there is no xhigh)
2. Spawn parallel general-purpose subagents per system (shell, lighting, ramen,
   boba, UI, portals, capture, mobile)
3. After each meaningful change: build + capture in demos/room
4. Spawn independent harsh critic subagents (read-only) that open PNGs +
   VISUAL-BAR + jesse reference and return ship=YES/NO only with scores
5. If any critic NO → fix only residual failures → recapture → re-critic
6. Repeat until YES or you write an honest blocked report with evidence paths
```

The main agent must use `spawn_subagent` / `workflow` tools. If it only edits
files solo, it is **not** running this prompt.

### Option D — Heartbeat (optional, not the core loop)

```text
/loop 15m Read demos/room/docs/PROMPT-TRUTH.md and shots/; if critics still NO,
continue the highest-priority residual from VISUAL-BAR; recapture; update truth doc.
```

### What does **not** work

- Typing `ultracode` alone in a Grok prompt (no keyword trigger).
- `/effort high` alone without subagents/workflow/goal.
- `/effort xhigh` on grok-4.5 (unknown level — use `high`).
- Claiming done without PNG evidence + critic YES.
- Soft-stopping after “performance pass” while critics still prefer jesse.

---

## Per-round contract (for agents and workflows)

Each quality round must:

1. **Implement** one residual from critic reports / VISUAL-BAR (not random polish).
2. **Build** `cd demos/room && npm run build`.
3. **Capture** `npm run capture -- --label <round> --beauty` (or project capture flags).
4. **Critic** (separate agent, prefer read-only): open shots; score rubric; blind prefer ours vs jesse? YES/NO only.
5. **Record** paths to shots + critic markdown under `demos/room/docs/` or `/tmp`.
6. **Stop only** on ship gate (above) or hard blocker with evidence.

Systems to fan out (parallel when independent):

| System | Primary paths |
|--------|----------------|
| Shop shell | `demos/room/src/ShopShell.tsx` (or equivalent) |
| Lighting / post | `ShopCanvas.tsx`, bloom, env, fog |
| Ramen props | img2threejs factories / ramen models |
| Boba props | boba cup factories |
| Menu / UI chrome | shell UI, loading, brand |
| Project portals | hotspots, project data |
| Capture harness | `tools/capture.mjs`, CameraBridge |
| Mobile | layout, touch, panel stack |

Tools: Grok Imagine for plates; img2threejs for code reconstruction; Playwright
capture for proof. Prefer procedural R3F grounded in Imagine refs.

---

## Repo layout (this prompt)

| Path | Role |
|------|------|
| `prompt.md` | This file — bar + Grok activation |
| `demos/room/` | Primary R3F shop |
| `demos/room/docs/VISUAL-BAR.md` | Scoring rubric |
| `demos/room/docs/PROMPT-TRUTH.md` | Did we actually meet the gate? |
| `demos/room/tools/capture.mjs` | PNG evidence |
| `.grok/workflows/ramen-boba-loop.rhai` | Multi-agent quality loop |
| `demos/spline/` | Optional second demo track |

---

## One-liner for a new Grok session

```text
/effort high
@prompt.md — run Option A (ramen-boba-loop workflow) or Option B (/goal).
Orchestrate like Claude ultracode would: fan-out + capture + harsh critics
until YES. Do not invent a lower bar.
```
