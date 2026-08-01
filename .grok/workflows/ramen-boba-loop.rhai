// Kevin's Ramen & Boba — product quality loop (scene + chrome + camera/UX)
// One ship gate. Tracks: scene craft | lighting/style | placement | chrome/brand | camera/ux
//
// Launch:
//   /workflow ramen-boba-loop {"start_round":9,"rounds":16}
//   agent_budget: 384–512 recommended
//
// Watch: /workflows

let meta = #{
    name: "ramen-boba-loop",
    description: "Product loop: scene + chrome UI + camera/UX + placement + harsh critics until ship",
    when_to_use: "Complete portfolio/prompt.md for demos/room — 3D shop AND overlays as one product",
    phases: [
        #{ title: "Bootstrap", detail: "residuals A–E + gitnexus; no rewrite" },
        #{ title: "Round", detail: "parallel impl → product capture → multi-critic" },
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
        "evidence_paths": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 10 },
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
    "required": ["capture_label", "capture_ok", "beauty_ok", "placement_ok", "chrome_ok", "build_ok", "shot_paths"],
    "properties": #{
        "capture_label": #{ "type": "string" },
        "capture_ok": #{ "type": "boolean" },
        "beauty_ok": #{ "type": "boolean" },
        "placement_ok": #{ "type": "boolean" },
        "chrome_ok": #{ "type": "boolean" },
        "build_ok": #{ "type": "boolean" },
        "shot_paths": #{ "type": "array", "items": #{ "type": "string" }, "maxItems": 40 },
    },
};

// Args:
//   start_round — first loop-rN label (default 1)
//   rounds      — HOW MANY rounds to run (default 8), NOT an end index
// Example continuation after loop-r16:
//   {"start_round":17,"rounds":8}  → labels loop-r17 … loop-r24
let round_count = 8;
let start_round = 1;
if args != () {
    if args.rounds != () { round_count = args.rounds; }
    if args.start_round != () { start_round = args.start_round; }
}
if round_count < 1 { round_count = 1; }
if round_count > 16 { round_count = 16; }
if start_round < 1 { start_round = 1; }
let end_round = start_round + round_count - 1;

let stack_law = "";
stack_law += "STACK LAW (non-negotiable):\n";
stack_law += "- CONTINUE demos/room only: React 19 + R3F + drei + three + postprocessing + Vite + Playwright.\n";
stack_law += "- NEVER rewrite app / swap engines. Build on ShopShell, ShopCanvas, ProjectHotspots, img2threejs, App, styles, capture.\n";
stack_law += "- GitNexus from /workspace/portfolio: npx gitnexus query|context|impact before big edits.\n";
stack_law += "- MIN tokens: tools > talk; schema at end.\n";
stack_law += "- Bar: prompt.md ship gate + VISUAL-BAR.md (scene AND chrome AND camera).\n";
stack_law += "- LIGHTING/STYLE: night kiosk not glowing forest; readable neon; details visible.\n";
stack_law += "- CHROME/BRAND: UI must feel night-shop menu (warm, cohesive) not generic SaaS dashboard. 3D is hero.\n";
stack_law += "- CAMERA/UX: calm orbit, framed shop, select feedback; no nauseous motion.\n";
stack_law += "- ENVIRONMENT: CitySquareEnv (Japan night plaza) — greenery, buildings, street props. "
  + "Iterate density/fidelity without burying the kiosk hero. system=environment owns CitySquareEnv.tsx.\n";
stack_law += "- Exterior neon placement + product capture (beauty+placement+chrome) every round.\n";
stack_law += "- Optional env proof: npm run capture:photosphere; plazaWide/plazaLeft presets.\n";
stack_law += "- Gate OPEN until critics YES on craft+lighting+placement+chrome+camera. Never soft-stop.\n";

phase("Bootstrap");
log("ramen-boba-loop v4: product gate; start_round=" + start_round.to_string()
    + " count=" + round_count.to_string() + " end_round=" + end_round.to_string());

let boot = agent(
    "TOKEN-MIN explore. Repo /workspace/portfolio.\n"
        + "1) npx gitnexus status; npx gitnexus query \"ShopCanvas App styles chrome neon lighting\"\n"
        + "2) Read prompt.md ship gate + VISUAL-BAR (incl. chrome/camera dims).\n"
        + "3) Read LOOP-RESIDUALS.md + PROMPT-TRUTH.md (short).\n"
        + "4) Write LOOP-RESIDUALS.md top residuals tagged "
        + "(A)lighting/style (B)placement (C)materials (D)chrome/brand (E)camera/ux "
        + "plus systems shell|lighting|ramen|boba|ui|camera|portals|capture.\n"
        + "Priority: A then D if overlays clash, then B/E/C. Gate OPEN. No implement.",
    #{
        label: "bootstrap",
        capability_mode: "read-write",
        agent_type: "explore",
    }
);

let residual_hint = "PRIORITY A: lighting/style (readable neon, no mystical mush). D: chrome brand fit (panel=menu not SaaS). E: camera calm/framed. B: placement. C: materials.";
if boot != () && boot.success {
    residual_hint = "Follow LOOP-RESIDUALS.md tags A–E. Highest impact first. CONTINUE stack.";
}

let round = start_round;
let any_ship = false;
let last_summary = "no rounds completed";
let last_label = "none";

while round <= end_round {
    phase("Round");
    let label = "loop-r" + round.to_string();
    last_label = label;
    // Even rounds emphasize chrome+camera; odd emphasize scene — both still run every round
    let chrome_focus = (round % 2) == 0;
    log("label " + label + " (" + round.to_string() + ".." + end_round.to_string()
        + ") chrome_focus=" + chrome_focus.to_string());

    let impl_common = "";
    impl_common += stack_law;
    impl_common += "ROUND " + label + ". " + residual_hint + "\n";
    impl_common += "Read LOOP-RESIDUALS.md. ONE coherent fix in YOUR system. No full capture (capture agent does it).\n";
    impl_common += "did_work=false if nothing applies.\n";

    // Scene parallel panel
    let jobs = [];
    jobs.push(#{
        prompt: impl_common
            + "SYSTEM=shell OWNER: demos/room/src/shop/ShopShell.tsx\n"
            + "Exterior NeonBrandSign; wood/materials; enclosure. CONTINUE meshes.\n"
            + "system=\"shell\".",
        label: "impl-shell:" + label,
        capability_mode: "all",
        agent_type: "general-purpose",
        output_schema: system_schema,
    });
    jobs.push(#{
        prompt: impl_common
            + "SYSTEM=lighting+camera OWNER: demos/room/src/ShopCanvas.tsx only.\n"
            + "LIGHTING: night kiosk realism; tame bloom; warm key+cool fill; kill emissive soup; midtones for food/wood.\n"
            + "CAMERA/UX: OrbitControls damping/min-max distance/polar; FOV; default pose frames whole shop; "
            + "CAMERA_PRESETS coherent; optional smoother select-ready framing. No cinematic scope creep.\n"
            + "system=\"lighting\".",
        label: "impl-litcam:" + label,
        capability_mode: "all",
        agent_type: "general-purpose",
        output_schema: system_schema,
    });
    jobs.push(#{
        prompt: impl_common
            + "SYSTEM=ramen OWNER: demos/room/src/img2threejs/createRamenBowlModel.ts\n"
            + "Food PBR: glaze, broth, noodles — not plastic blobs.\n"
            + "system=\"ramen\".",
        label: "impl-ramen:" + label,
        capability_mode: "all",
        agent_type: "general-purpose",
        output_schema: system_schema,
    });
    jobs.push(#{
        prompt: impl_common
            + "SYSTEM=boba OWNER: demos/room/src/img2threejs/createBobaCupPairModel.ts\n"
            + "Transmission, tea, condensate, straw — not glowing cylinders.\n"
            + "system=\"boba\".",
        label: "impl-boba:" + label,
        capability_mode: "all",
        agent_type: "general-purpose",
        output_schema: system_schema,
    });
    let impl_results = parallel(jobs);

    // UI + portals panel (always UI; portals if needed)
    let uijobs = [];
    uijobs.push(#{
        prompt: impl_common
            + "SYSTEM=ui OWNER: demos/room/src/App.tsx + demos/room/src/styles.css ONLY.\n"
            + "Brand cohesion: chrome must feel Kevin's Ramen & Boba night-shop (menu board / order ticket), "
            + "NOT generic dark SaaS. Align palette with warm wood/broth/neon accents; typography hierarchy "
            + "(serif shop moments OK); stage header + side panel support the 3D hero; loading card on-brand; "
            + "mobile stack readable. Kill visual clash with kiosk.\n"
            + "system=\"ui\".",
        label: "impl-ui:" + label,
        capability_mode: "all",
        agent_type: "general-purpose",
        output_schema: system_schema,
    });
    uijobs.push(#{
        prompt: impl_common
            + "SYSTEM=portals OWNER: demos/room/src/shop/ProjectHotspots.tsx\n"
            + "Hotspot labels/hover/select feedback; contact; match panel selection. "
            + "HTML labels should share chrome brand language when possible.\n"
            + "did_work=false if residuals are only ui/lighting this round.\n"
            + "system=\"portals\".",
        label: "impl-portals:" + label,
        capability_mode: "all",
        agent_type: "general-purpose",
        output_schema: system_schema,
    });
    uijobs.push(#{
        prompt: impl_common
            + "SYSTEM=environment OWNER: demos/room/src/shop/CitySquareEnv.tsx ONLY.\n"
            + "Japan night city square surround: greenery density, building facades, street furniture. "
            + "Must support the kiosk (not overpower). High-fidelity game-env craft: shrubs, trees, planters, "
            + "lamps, plaza read. Keep instancing/perf sane. Photosphere-friendly silhouettes.\n"
            + "did_work=false if residual list has no environment items this round.\n"
            + "system=\"environment\".",
        label: "impl-env:" + label,
        capability_mode: "all",
        agent_type: "general-purpose",
        output_schema: system_schema,
    });
    let ui_results = parallel(uijobs);

    // Product capture: beauty + placement + chrome
    let cap_prompt = "";
    cap_prompt += stack_law;
    cap_prompt += "CAPTURE AGENT " + label + ".\n";
    cap_prompt += "1) cd /workspace/portfolio/demos/room && npm run build\n";
    cap_prompt += "2) PRODUCT pack: npm run capture:product -- --label " + label + "\n";
    cap_prompt += "   (= --beauty --placement --chrome). If script missing, run three flags on tools/capture.mjs.\n";
    cap_prompt += "3) Expect dirs: shots/" + label + "/ , shots/" + label + "-placement/ , shots/" + label + "-chrome/\n";
    cap_prompt += "4) beauty_ok / placement_ok / chrome_ok = non-black usable PNGs in each. "
        + "capture_ok = all three true. Fix harness only if black frames.\n";
    cap_prompt += "5) List shot_paths from all three packs.\n";

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

    let shot_glob = "demos/room/shots/" + capture_label;
    let place_glob = "demos/room/shots/" + capture_label + "-placement";
    let chrome_glob = "demos/room/shots/" + capture_label + "-chrome";

    let cbase = "";
    cbase += "TOKEN-MIN HARSH CRITIC. Fail closed. Read VISUAL-BAR.md (all dims incl. chrome/camera).\n";
    cbase += "Open PNGs: Beauty " + shot_glob + " | Placement " + place_glob + " | Chrome " + chrome_glob + "\n";
    cbase += "Ref: demos/room/shots/ref-jesse-zhou-02.png if present.\n";
    cbase += "GLOBAL FAIL ⇒ prefer_ours=false ship=false: unreadable neon; glowing-forest mush; "
        + "chrome looks generic SaaS vs shop; missing chrome/placement packs; sign buried; details washed out.\n";
    cbase += "prefer_ours only if scene craft + lighting/style + chrome brand fit + camera/ux + placement clear.\n";
    cbase += "ship only if prefer_ours and scores high. Schema only; short summary.\n";

    let cjobs = [];
    cjobs.push(#{
        prompt: cbase + "Dimension: MATERIALS under current lighting (beauty/counter stills).",
        label: "critic-mat:" + label,
        capability_mode: "read-only",
        agent_type: "explore",
        output_schema: critic_schema,
    });
    cjobs.push(#{
        prompt: cbase + "Dimension: LIGHTING+STYLE (beauty). Night kiosk vs mystical mush; bloom restraint.",
        label: "critic-lit:" + label,
        capability_mode: "read-only",
        agent_type: "explore",
        output_schema: critic_schema,
    });
    cjobs.push(#{
        prompt: cbase + "Dimension: NEON+DETAIL READABILITY (beauty front/leftNeon + placement exteriorSign*).",
        label: "critic-read:" + label,
        capability_mode: "read-only",
        agent_type: "explore",
        output_schema: critic_schema,
    });
    cjobs.push(#{
        prompt: cbase + "Dimension: PLACEMENT (placement library). Exterior marquee; props grounded.",
        label: "critic-place:" + label,
        capability_mode: "read-only",
        agent_type: "explore",
        output_schema: critic_schema,
    });
    cjobs.push(#{
        prompt: cbase + "Dimension: CHROME/BRAND/UI (chrome library ONLY — 01-chrome-hero, menu, panel, mobile).\n"
            + "Does overlay feel like the same shop as the 3D kiosk? Fail generic portfolio panel. "
            + "Score cohesion, hierarchy (3D hero), menu/panel craft, mobile. Residuals → App.tsx/styles.css.",
        label: "critic-chrome:" + label,
        capability_mode: "read-only",
        agent_type: "explore",
        output_schema: critic_schema,
    });
    cjobs.push(#{
        prompt: cbase + "Dimension: CAMERA+UX FEEL (beauty angles + chrome interaction stills).\n"
            + "Default framing of full shop? Calm? Select/hotspot feedback clear? Mobile usable? "
            + "Residuals → ShopCanvas OrbitControls / presets / hotspots.",
        label: "critic-camux:" + label,
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
                    if residuals.len() < 14 { residuals.push(r); }
                }
            }
        }
    }

    // Unanimous among 6 critics + full product capture
    let round_ship = usable >= 6 && ships >= 6 && prefers >= 6 && capture_ok;
    log("round " + round.to_string()
        + " capture_ok=" + capture_ok.to_string()
        + " critics=" + usable.to_string()
        + " ship_votes=" + ships.to_string()
        + " prefer_votes=" + prefers.to_string());

    let persist = "TOKEN-MIN. Write demos/room/docs/CRITIC-PASS-" + label + ".md "
        + "(table: 6 critics materials/lighting/read/placement/chrome/camux + ship/prefer). ";
    persist += "Refresh LOOP-RESIDUALS with tags A–E. capture_ok=" + capture_ok.to_string() + ". ";
    persist += "PROMPT-TRUTH honest; gate OPEN unless unanimous. Residuals:";
    let ri = 0;
    for r in residuals {
        if ri < 8 { persist += " | " + r; }
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

    residual_hint = "Critics NO on " + label + ". Fix LOOP-RESIDUALS A–E. CONTINUE; full product recapture next round.";
    round += 1;
}

phase("Report");
let report = "# ramen-boba-loop v4 final\n\n";
report += "- ship_gate_met: " + any_ship.to_string() + "\n";
report += "- start_round: " + start_round.to_string() + "\n";
report += "- round_count: " + round_count.to_string() + "\n";
report += "- end_round: " + end_round.to_string() + "\n";
report += "- last_label: " + last_label + "\n";
report += "- last_summary: " + last_summary + "\n";
report += "- tracks: scene + chrome + camera/ux + placement\n";
report += "- critics: 6-way unanimous required\n";
if !any_ship {
    report += "\nGate OPEN. Relaunch:\n";
    report += "  /workflow ramen-boba-loop {\"start_round\":" + (end_round + 1).to_string()
        + ",\"rounds\":8} with agent_budget>=384\n";
}
let path = write_scratch_file("ramen-boba-loop-report.md", report);

agent(
    "TOKEN-MIN. PROMPT-TRUTH.md: ship_gate_met=" + any_ship.to_string()
        + " last=" + last_label + ". Note chrome+camera dimensions. Never invent YES.",
    #{
        label: "final-truth",
        capability_mode: "read-write",
        agent_type: "explore",
    }
);

complete(#{
    summary: if any_ship { "Ship gate MET" } else { "Ship gate OPEN — RELAUNCH required" },
    ship: any_ship,
    report_path: path,
    start_round: start_round,
    round_count: round_count,
    end_round: end_round,
    last_label: last_label,
    continue_required: !any_ship,
    next_start_round: end_round + 1,
});
