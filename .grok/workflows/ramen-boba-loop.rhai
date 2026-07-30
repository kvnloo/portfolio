// Kevin's Ramen & Boba — max-concurrency quality loop (prompt.md ship gate)
// CONTINUES existing demos/room R3F stack. GitNexus for cheap navigation.
// Parallel implementers (file-owned) + parallel critics + capture verification.
//
// Launch:
//   /workflow ramen-boba-loop {"rounds":6}
//   agent_budget: 256–512 recommended
//
// Watch: /workflows

let meta = #{
    name: "ramen-boba-loop",
    description: "Max-parallel demos/room quality loop: GitNexus + continue stack + capture + harsh critics until ship",
    when_to_use: "Complete portfolio/prompt.md on existing R3F room without rewrite; token-thrifty fan-out",
    phases: [
        #{ title: "Bootstrap", detail: "residuals + gitnexus status; no rewrite" },
        #{ title: "Round", detail: "parallel system impl → build/capture → parallel critics" },
        #{ title: "Report", detail: "ship gate evidence" },
    ],
};

let critic_schema = #{
    "type": "object",
    "required": ["prefer_ours", "overall_score", "ship", "top_residuals", "evidence_paths", "summary"],
    "properties": #{
        "prefer_ours": #{ "type": "boolean" },
        "overall_score": #{ "type": "number" },
        "ship": #{ "type": "boolean" },
        "top_residuals": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 6 },
        "evidence_paths": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 8 },
        "summary": #{ "type": "string" },
    },
};

let system_schema = #{
    "type": "object",
    "required": ["system", "changed_files", "did_work", "notes"],
    "properties": #{
        "system": #{ "type": "string" },
        "changed_files": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 20 },
        "did_work": #{ "type": "boolean" },
        "notes": #{ "type": "string" },
    },
};

let capture_schema = #{
    "type": "object",
    "required": ["capture_label", "capture_ok", "shot_paths", "build_ok"],
    "properties": #{
        "capture_label": #{ "type": "string" },
        "capture_ok": #{ "type": "boolean" },
        "build_ok": #{ "type": "boolean" },
        "shot_paths": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 16 },
    },
};

// --- args ---
let max_rounds = 6;
let start_round = 1;
if args != () {
    if args.rounds != () { max_rounds = args.rounds; }
    if args.start_round != () { start_round = args.start_round; }
}
if max_rounds < 1 { max_rounds = 1; }
if max_rounds > 12 { max_rounds = 12; }

// Shared hard constraints injected into every implementer (token-cheap, no stack rewrite)
let stack_law = "";
stack_law += "STACK LAW (non-negotiable):\n";
stack_law += "- CONTINUE existing demos/room only. Tech: React 19 + R3F + drei + three + postprocessing + Vite + Playwright capture.\n";
stack_law += "- NEVER rewrite app from scratch, NEVER switch to Babylong/raw canvas-only/new framework, NEVER delete working portals/shell.\n";
stack_law += "- Build on ShopShell, ShopCanvas, ProjectHotspots, img2threejs factories, tools/capture.mjs, existing shots.\n";
stack_law += "- GitNexus CLI from /workspace/portfolio: `npx gitnexus query|context|impact|status` before big edits (cheaper than full-file reads).\n";
stack_law += "- Before editing a named function/component: `npx gitnexus impact <SymbolName>` and heed HIGH/CRITICAL.\n";
stack_law += "- MIN tokens: no essays; tool use > talk; schema output only at end.\n";
stack_law += "- Scope: demos/room only. Bar: jesse-zhou.com + VISUAL-BAR.md. Gate open until critics prefer ours.\n";

phase("Bootstrap");
log("ramen-boba-loop v2: parallel systems + gitnexus + continue-stack; rounds=" + max_rounds.to_string());

// explore agent = cheaper (medium/low role effort). Read residuals only.
let boot = agent(
    "TOKEN-MIN explore. Repo /workspace/portfolio (GitNexus indexed).\n"
        + "1) Run: npx gitnexus status\n"
        + "2) Run: npx gitnexus query \"ShopCanvas ShopShell lighting ramen boba capture\"\n"
        + "3) Read ONLY: demos/room/docs/LOOP-RESIDUALS.md, VISUAL-BAR.md, PROMPT-TRUTH.md (short).\n"
        + "4) Write demos/room/docs/LOOP-RESIDUALS.md: top 8 residuals mapped to systems "
        + "(shell|lighting|ramen|boba|ui|portals|capture). Keep best shot paths. Gate OPEN.\n"
        + "Do NOT implement. Do NOT rewrite code.",
    #{
        label: "bootstrap",
        capability_mode: "read-write",
        agent_type: "explore",
    }
);

let residual_hint = "Top residuals from LOOP-RESIDUALS.md: emissive bounce, material thickness, prop density, atmosphere, neon lettering. CONTINUE existing files.";
if boot != () && boot.success {
    residual_hint = "Use demos/room/docs/LOOP-RESIDUALS.md systems map. Fix highest impact residual per system. CONTINUE stack.";
}

let round = start_round;
let any_ship = false;
let last_summary = "no rounds completed";
let last_label = "none";

while round <= max_rounds {
    phase("Round");
    let label = "loop-r" + round.to_string();
    last_label = label;
    log("round " + round.to_string() + "/" + max_rounds.to_string() + " PARALLEL implementers");

    // --- MAX CONCURRENCY: 4 file-owned implementers in one parallel panel ---
    // Non-overlapping primary files to avoid thrash (shared law still applies).
    let impl_common = "";
    impl_common += stack_law;
    impl_common += "ROUND " + label + ". " + residual_hint + "\n";
    impl_common += "Read LOOP-RESIDUALS.md first. Implement ONE coherent improvement in YOUR system only.\n";
    impl_common += "Do not run full npm capture (capture agent does that). You MAY run tsc/build if needed.\n";
    impl_common += "did_work=false if nothing in your residual list applies this round.\n";

    let jobs = [];
    jobs.push(#{
        prompt: impl_common
            + "SYSTEM=shell OWNER files: demos/room/src/shop/ShopShell.tsx (+ tiny related only).\n"
            + "Improve room enclosure, wood/material thickness, counter/booth density, neon tube readability — CONTINUE existing meshes.\n"
            + "system field must be \"shell\".",
        label: "impl-shell:" + label,
        capability_mode: "all",
        agent_type: "general-purpose",
        output_schema: system_schema,
    });
    jobs.push(#{
        prompt: impl_common
            + "SYSTEM=lighting OWNER files: demos/room/src/ShopCanvas.tsx (+ postprocessing only if already used).\n"
            + "Improve warm key + cool window bounce, emissive actually lighting neighbors, fog/steam/bloom — no quality gutting.\n"
            + "system field must be \"lighting\".",
        label: "impl-lighting:" + label,
        capability_mode: "all",
        agent_type: "general-purpose",
        output_schema: system_schema,
    });
    jobs.push(#{
        prompt: impl_common
            + "SYSTEM=ramen OWNER files: demos/room/src/img2threejs/createRamenBowlModel.ts and ramen-related only.\n"
            + "img2threejs form+material pass: broth, noodles, toppings, ceramic glaze — grounded in Imagine/ref plates if present.\n"
            + "system field must be \"ramen\".",
        label: "impl-ramen:" + label,
        capability_mode: "all",
        agent_type: "general-purpose",
        output_schema: system_schema,
    });
    jobs.push(#{
        prompt: impl_common
            + "SYSTEM=boba OWNER files: demos/room/src/img2threejs/createBobaCupPairModel.ts and boba-related only.\n"
            + "Cup transmission, pearls, condensation, straw — CONTINUE factory, not a new pipeline.\n"
            + "system field must be \"boba\".",
        label: "impl-boba:" + label,
        capability_mode: "all",
        agent_type: "general-purpose",
        output_schema: system_schema,
    });

    let impl_results = parallel(jobs);

    // Optional 5th/6th systems if budget allows later rounds — portals+ui sequential thin agent
    let aux = agent(
        stack_law
            + "ROUND " + label + ". TOKEN-MIN. Optionally improve portals OR UI chrome if residual list demands it.\n"
            + "OWNER: demos/room/src/shop/ProjectHotspots.tsx and demos/room/src styles/App only if needed.\n"
            + "Skip if shell/lighting/ramen/boba are the only residuals. Short notes only.\n"
            + "system field \"portals\" or \"ui\".",
        #{
            label: "impl-aux:" + label,
            capability_mode: "all",
            agent_type: "general-purpose",
            output_schema: system_schema,
        }
    );

    // --- Capture / visual verification harness (single agent owns build+capture) ---
    let cap_prompt = "";
    cap_prompt += stack_law;
    cap_prompt += "CAPTURE AGENT for round " + label + ".\n";
    cap_prompt += "1) cd /workspace/portfolio/demos/room && npm run build (fix TS errors without stack rewrite).\n";
    cap_prompt += "2) npm run capture -- --label " + label + " (add --beauty if supported). Non-black PNGs required.\n";
    cap_prompt += "3) Fix capture harness ONLY if black/empty (CameraBridge, beauty wait) — keep Playwright stack.\n";
    cap_prompt += "4) List shot_paths under demos/room/shots/" + label + ".\n";
    cap_prompt += "capture_ok=true only if usable non-black PNGs exist. build_ok for tsc/vite success.\n";

    let cap = agent(cap_prompt, #{
        label: "capture:" + label,
        capability_mode: "all",
        agent_type: "general-purpose",
        output_schema: capture_schema,
    });

    let capture_label = label;
    let capture_ok = false;
    if cap != () && cap.success && cap.output != () {
        if cap.output.capture_label != () && cap.output.capture_label != "" {
            capture_label = cap.output.capture_label;
        }
        if cap.output.capture_ok == true { capture_ok = true; }
    }

    // --- PARALLEL harsh critics (explore = cheaper; read-only) ---
    let shot_glob = "demos/room/shots/" + capture_label;
    let cbase = "";
    cbase += "TOKEN-MIN HARSH CRITIC. Fail closed. Read VISUAL-BAR.md + open PNGs with read_file.\n";
    cbase += "Shots: " + shot_glob + " and compare to demos/room/shots/ref-jesse-zhou-02.png and critic-v3/01-beauty-hero.png if present.\n";
    cbase += "prefer_ours=true ONLY if blind craft beats jesse-zhou class. ship=true only if prefer_ours and bar high.\n";
    cbase += "If black/missing shots: ship=false prefer_ours=false. Schema only; 2-sentence summary max.\n";

    let cjobs = [];
    cjobs.push(#{
        prompt: cbase + "Dimension: MATERIALS/props surface.",
        label: "critic-mat:" + label,
        capability_mode: "read-only",
        agent_type: "explore",
        output_schema: critic_schema,
    });
    cjobs.push(#{
        prompt: cbase + "Dimension: LIGHTING/atmosphere/bloom/fog.",
        label: "critic-lit:" + label,
        capability_mode: "read-only",
        agent_type: "explore",
        output_schema: critic_schema,
    });
    cjobs.push(#{
        prompt: cbase + "Dimension: COMPOSITION/enclosure/brand/not-toy.",
        label: "critic-comp:" + label,
        capability_mode: "read-only",
        agent_type: "explore",
        output_schema: critic_schema,
    });

    let verdicts = parallel(cjobs);

    let ships = 0;
    let prefers = 0;
    let usable = 0;
    let residuals = [];
    for v in verdicts {
        if v != () && v.success && v.output != () {
            usable += 1;
            if v.output.ship == true { ships += 1; }
            if v.output.prefer_ours == true { prefers += 1; }
            if v.output.summary != () { last_summary = v.output.summary; }
            if v.output.top_residuals != () {
                for r in v.output.top_residuals {
                    if residuals.len() < 10 { residuals.push(r); }
                }
            }
        }
    }

    // Unanimous ship+prefer among 3 usable critics
    let round_ship = usable >= 3 && ships >= 3 && prefers >= 3 && capture_ok;
    log("round " + round.to_string()
        + " capture_ok=" + capture_ok.to_string()
        + " critics=" + usable.to_string()
        + " ship_votes=" + ships.to_string()
        + " prefer_votes=" + prefers.to_string());

    // Cheap persist (explore write)
    let persist = "TOKEN-MIN. Write demos/room/docs/CRITIC-PASS-" + label + ".md (short table: scores/ship/prefer). ";
    persist += "Refresh LOOP-RESIDUALS.md from critic residuals. capture_ok=" + capture_ok.to_string() + ". ";
    persist += "Update PROMPT-TRUTH.md honestly — gate OPEN unless unanimous ship. Residuals:";
    let ri = 0;
    for r in residuals {
        if ri < 6 { persist += " | " + r; }
        ri += 1;
    }

    agent(persist, #{
        label: "persist:" + label,
        capability_mode: "read-write",
        agent_type: "explore",
    });

    if round_ship {
        any_ship = true;
        log("SHIP GATE MET at " + label);
        break;
    }

    residual_hint = "Critics NO on " + label + ". Fix LOOP-RESIDUALS.md items. CONTINUE stack; recapture next round.";
    round += 1;
}

phase("Report");
let report = "# ramen-boba-loop v2 final\n\n";
report += "- ship_gate_met: " + any_ship.to_string() + "\n";
report += "- rounds: " + max_rounds.to_string() + "\n";
report += "- last_label: " + last_label + "\n";
report += "- last_summary: " + last_summary + "\n";
report += "- stack: existing demos/room R3F (continued)\n";
report += "- concurrency: parallel shell|lighting|ramen|boba + parallel 3 critics\n";
report += "- gitnexus: required in implementer prompts\n";
if !any_ship {
    report += "\nGate OPEN. Resume with more rounds / higher agent_budget.\n";
}
let path = write_scratch_file("ramen-boba-loop-report.md", report);

agent(
    "TOKEN-MIN. Final PROMPT-TRUTH.md update: ship_gate_met=" + any_ship.to_string()
        + " last=" + last_label + ". Never invent YES.",
    #{
        label: "final-truth",
        capability_mode: "read-write",
        agent_type: "explore",
    }
);

complete(#{
    summary: if any_ship { "Ship gate MET" } else { "Ship gate OPEN — continue loop" },
    ship: any_ship,
    report_path: path,
    rounds: max_rounds,
    last_label: last_label,
});
