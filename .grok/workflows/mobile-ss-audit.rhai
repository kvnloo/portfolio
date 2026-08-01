let meta = #{
    name: "mobile-ss-audit",
    description: "Iteratively audit phone screenshots of demos/room; extract mobile issues; emit improvement plan",
    when_to_use: "When user drops phone screenshots of the shop and wants a full mobile UX/visual issue list + plan",
    phases: [
        #{ title: "Inventory", detail: "list screenshot set" },
        #{ title: "Mine issues", detail: "iterative multi-pass issue extraction until dry" },
        #{ title: "Plan", detail: "prioritized improvement plan from issues" },
    ],
};

let inv_schema = #{
    "type": "object",
    "required": ["files", "count", "notes"],
    "properties": #{
        "files": #{ "type": "array", "maxItems": 40, "items": #{ "type": "string" } },
        "count": #{ "type": "integer" },
        "notes": #{ "type": "string" },
    },
};

let issues_schema = #{
    "type": "object",
    "required": ["issues", "new_count", "done"],
    "properties": #{
        "issues": #{
            "type": "array",
            "maxItems": 25,
            "items": #{
                "type": "object",
                "required": ["id", "title", "severity", "area", "evidence", "fix_hint"],
                "properties": #{
                    "id": #{ "type": "string" },
                    "title": #{ "type": "string" },
                    "severity": #{ "type": "string" },
                    "area": #{ "type": "string" },
                    "evidence": #{ "type": "string" },
                    "fix_hint": #{ "type": "string" },
                },
            },
        },
        "new_count": #{ "type": "integer" },
        "done": #{ "type": "boolean" },
        "notes": #{ "type": "string" },
    },
};

let plan_schema = #{
    "type": "object",
    "required": ["plan_markdown", "phases", "summary"],
    "properties": #{
        "plan_markdown": #{ "type": "string" },
        "phases": #{ "type": "array", "maxItems": 8, "items": #{ "type": "string" } },
        "summary": #{ "type": "string" },
    },
};

// Defaults: Recvd folder with phone Chrome shots of Pages room
let ss_dir = if args == () { () } else { args.ss_dir };
if ss_dir == () { ss_dir = "/mnt/zer0models/Recvd"; }
let room = if args == () { () } else { args.room_root };
if room == () { room = "/workspace/portfolio/demos/room"; }
let max_rounds = if args == () { () } else { args.max_rounds };
if max_rounds == () { max_rounds = 5; }

// ── Inventory ──────────────────────────────────────────────────
phase("Inventory");
log("Scanning screenshots in " + ss_dir);

let inv_p = "";
inv_p += "List ALL screenshot/image files in " + ss_dir + " relevant to the mobile shop review.\n";
inv_p += "Prefer Chrome screenshots of kvnloo.github.io/portfolio/demos/room (names like Screenshot_*_Chrome.png).\n";
inv_p += "Use list_dir / run_terminal_command. Return absolute paths in files[], count, short notes.\n";
inv_p += "Do not skip newer 20260731 Chrome shots.\n";

let inv = agent(inv_p, #{
    label: "inventory",
    capability_mode: "execute",
    output_schema: inv_schema,
});
if inv == () || !inv.success || inv.output == () {
    pause("verification", "Inventory failed — check ss_dir path");
}
let files = if inv.output.files == () { [] } else { inv.output.files };
if files.len() == 0 {
    complete(#{
        ship: false,
        summary: "No screenshots found in " + ss_dir,
        issues: [],
        plan_path: "",
    });
}
log("Found " + files.len().to_string() + " files");

// ── Iterative mine ─────────────────────────────────────────────
phase("Mine issues");
let all_issues = [];
let seen_titles = [];
let round = 0;
let dry_streak = 0;

while round < max_rounds {
    round += 1;
    log("Issue mine round " + round.to_string());

    let known = "";
    let ki = 0;
    for t in seen_titles {
        if ki < 40 {
            known += "- " + t + "\n";
        }
        ki += 1;
    }

    let mine_p = "";
    mine_p += "You are a harsh mobile product critic for Kevin's Ramen & Boba (R3F shop).\n";
    mine_p += "ROOM code root (for fix_hint only): " + room + "\n";
    mine_p += "Screenshot files (read each with read_file / open as image):\n";
    let fi = 0;
    for f in files {
        if fi < 20 {
            mine_p += f + "\n";
        }
        fi += 1;
    }
    mine_p += "\nAlready recorded issue titles (DO NOT repeat; find NEW only):\n";
    mine_p += known;
    mine_p += "\nFocus areas for mobile (phone Chrome on GitHub Pages):\n";
    mine_p += "- Layout: canvas height vs menu board, hierarchy, safe areas\n";
    mine_p += "- Framing: default camera, orbit flanks black, too-close crops\n";
    mine_p += "- Labels/hotspots covering food, giant pills\n";
    mine_p += "- Lighting/exposure on mobile GPU, crushed blacks\n";
    mine_p += "- Materials soft/blob, neon readability\n";
    mine_p += "- Menu UX, selection, touch targets\n";
    mine_p += "- Performance feel (if visible: lag, blank frames)\n";
    mine_p += "- Brand/chrome vs 3D cohesion\n\n";
    mine_p += "For EACH new issue: id like M" + round.to_string() + "-01, title, severity P0|P1|P2|P3,\n";
    mine_p += "area (layout|camera|labels|lighting|materials|menu|perf|brand), evidence (filename + what you see), fix_hint (file/CSS/camera).\n";
    mine_p += "new_count = number of NEW issues this round.\n";
    mine_p += "done=true if you cannot find more distinct issues after carefully viewing the images.\n";
    mine_p += "Max 12 new issues per round. Prefer concrete over vague.\n";

    let mined = agent(mine_p, #{
        label: "mine-r" + round.to_string(),
        capability_mode: "all",
        output_schema: issues_schema,
    });

    if mined == () || !mined.success || mined.output == () {
        log("Mine round failed — stop iteration");
        break;
    }

    let batch = if mined.output.issues == () { [] } else { mined.output.issues };
    let added = 0;
    for iss in batch {
        if iss != () && iss.title != () {
            let t = iss.title;
            let dup = false;
            for st in seen_titles {
                if st == t { dup = true; }
            }
            if !dup {
                seen_titles.push(t);
                all_issues.push(iss);
                added += 1;
            }
        }
    }
    log("Round " + round.to_string() + " added " + added.to_string() + " issues (total " + all_issues.len().to_string() + ")");

    let round_done = mined.output.done == true;
    if added == 0 || round_done {
        dry_streak += 1;
    } else {
        dry_streak = 0;
    }
    if dry_streak >= 2 {
        log("Two dry rounds — stopping mine");
        break;
    }
}

if all_issues.len() == 0 {
    complete(#{
        ship: false,
        summary: "No issues extracted from screenshots",
        issues: [],
        plan_path: "",
    });
}

// ── Plan ───────────────────────────────────────────────────────
phase("Plan");
let issues_json = json_encode(all_issues);

let plan_p = "";
plan_p += "Create a concrete MOBILE improvement plan for demos/room from this issue list.\n";
plan_p += "ROOM: " + room + " (read App.tsx, styles.css mobile media queries, ShopCanvas camera, ProjectHotspots as needed).\n\n";
plan_p += "ISSUES JSON:\n" + issues_json + "\n\n";
plan_p += "Output plan_markdown as a full markdown document with:\n";
plan_p += "1. Executive summary (mobile Pages reality vs intent)\n";
plan_p += "2. Issue catalog table: id | severity | area | title\n";
plan_p += "3. Phased plan (Phase 0 quick wins → Phase 1 framing/layout → Phase 2 labels → Phase 3 lighting/materials mobile → Phase 4 verify)\n";
plan_p += "4. Each phase: goals, concrete file touches, acceptance criteria, estimate (S/M/L)\n";
plan_p += "5. Out of scope (desktop-only, 4dps photosphere HQ unless it unblocks mobile)\n";
plan_p += "6. Suggested capture/verify: mobile chrome pack 390×844\n\n";
plan_p += "phases[] = short phase titles. summary = 2-3 sentences.\n";
plan_p += "Be specific to THIS codebase (class names, breakpoints max-width 960/480).\n";

let planned = agent(plan_p, #{
    label: "write-plan",
    capability_mode: "all",
    output_schema: plan_schema,
});
if planned == () || !planned.success || planned.output == () {
    pause("verification", "Plan agent failed");
}

let md = if planned.output.plan_markdown == () { "# Empty plan\n" } else { planned.output.plan_markdown };
let phases = if planned.output.phases == () { [] } else { planned.output.phases };
let psum = if planned.output.summary == () { "" } else { planned.output.summary };

// Also write durable plan into room docs
let write_p = "";
write_p += "Write the following markdown to " + room + "/docs/MOBILE-IMPROVEMENT-PLAN.md\n";
write_p += "Create/overwrite the file with EXACTLY this content (plus a generated header with date 2026-07-31 and source ss_dir).\n\n";
write_p += md + "\n\n";
write_p += "Also append a section ## Raw issue dump with the issues as a bullet list from this JSON:\n";
write_p += issues_json + "\n";
write_p += "Use the write tool / search_replace. Confirm path exists after write.\n";

let written = agent(write_p, #{
    label: "persist-plan",
    capability_mode: "all",
    output_schema: #{
        "type": "object",
        "required": ["path", "ok"],
        "properties": #{
            "path": #{ "type": "string" },
            "ok": #{ "type": "boolean" },
        },
    },
});

let plan_path = room + "/docs/MOBILE-IMPROVEMENT-PLAN.md";
if written != () && written.success && written.output != () && written.output.path != () {
    plan_path = written.output.path;
}

let report = "";
report += "# Mobile screenshot audit\n\n";
report += "- ss_dir: `" + ss_dir + "`\n";
report += "- screenshots: " + files.len().to_string() + "\n";
report += "- issues found: " + all_issues.len().to_string() + "\n";
report += "- plan: `" + plan_path + "`\n";
report += "- summary: " + psum + "\n\n";
report += "## Phases\n";
for ph in phases {
    report += "- " + ph + "\n";
}
report += "\n## Issues (" + all_issues.len().to_string() + ")\n";
for iss in all_issues {
    if iss != () && iss.title != () {
        let sev = if iss.severity == () { "?" } else { iss.severity };
        let area = if iss.area == () { "?" } else { iss.area };
        let id = if iss.id == () { "?" } else { iss.id };
        report += "- **" + id + "** [" + sev + "/" + area + "] " + iss.title + "\n";
    }
}

let scratch = write_scratch_file("mobile-ss-audit-report.md", report);
log("Mobile audit complete: " + all_issues.len().to_string() + " issues → " + plan_path);

complete(#{
    ship: true,
    summary: "Extracted " + all_issues.len().to_string() + " mobile issues; plan at " + plan_path,
    issue_count: all_issues.len(),
    plan_path: plan_path,
    report_path: scratch,
    phases: phases,
    issues: all_issues,
});
