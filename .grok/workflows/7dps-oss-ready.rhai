let meta = #{
    name: "7dps-oss-ready",
    description: "Harden 7dps skill/CLI for open source: audit, code polish, docs, smoke, optional E2E",
    when_to_use: "When preparing 7dps for public release or after major skill changes",
    phases: [
        #{ title: "Audit", detail: "inventory gaps vs OSS bar" },
        #{ title: "Polish", detail: "minimal code + docs + license" },
        #{ title: "Verify", detail: "smoke + adversarial review" },
        #{ title: "Ship gate", detail: "checklist verdict" },
    ],
};

let audit_schema = #{
    "type": "object",
    "required": ["ready_score", "blockers", "nits", "summary"],
    "properties": #{
        "ready_score": #{ "type": "integer", "minimum": 0, "maximum": 10 },
        "blockers": #{ "type": "array", "maxItems": 12, "items": #{ "type": "string" } },
        "nits": #{ "type": "array", "maxItems": 12, "items": #{ "type": "string" } },
        "summary": #{ "type": "string" },
    },
};

let polish_schema = #{
    "type": "object",
    "required": ["changed", "files", "notes"],
    "properties": #{
        "changed": #{ "type": "boolean" },
        "files": #{ "type": "array", "maxItems": 40, "items": #{ "type": "string" } },
        "notes": #{ "type": "string" },
    },
};

let smoke_schema = #{
    "type": "object",
    "required": ["passed", "log_tail", "failures"],
    "properties": #{
        "passed": #{ "type": "boolean" },
        "log_tail": #{ "type": "string" },
        "failures": #{ "type": "array", "maxItems": 20, "items": #{ "type": "string" } },
    },
};

let review_schema = #{
    "type": "object",
    "required": ["ship", "reasons", "must_fix"],
    "properties": #{
        "ship": #{ "type": "boolean" },
        "reasons": #{ "type": "array", "maxItems": 10, "items": #{ "type": "string" } },
        "must_fix": #{ "type": "array", "maxItems": 10, "items": #{ "type": "string" } },
    },
};

// args.root: path to 7dps package (default monorepo product path)
let root = if args == () { () } else { args.root };
if root == () {
    root = "/home/kvn/workspace/zer0/products/7dps";
}
let do_e2e = if args == () { false } else if args.e2e == () { false } else { args.e2e == true };
let e2e_note = if do_e2e { "true" } else { "false" };

// ─── Phase: Audit ───────────────────────────────────────────────
phase("Audit");
log("Auditing 7dps at " + root);

let audit_prompt = "";
audit_prompt += "You are auditing the 7dps open-source package for release readiness.\n";
audit_prompt += "Package root: " + root + "\n\n";
audit_prompt += "Use list_dir, read_file, grep, run_terminal_command (read-only style: cat/ls/node --check).\n";
audit_prompt += "Inspect: package.json, LICENSE, README.md, bin/, lib/, adapters/, viewers/, skills/, scripts/smoke.mjs.\n\n";
audit_prompt += "OSS bar (all required):\n";
audit_prompt += "1. MIT (or clear) LICENSE present\n";
audit_prompt += "2. package.json not private; files whitelist; bin entry; engines\n";
audit_prompt += "3. CLI modular, minimal, no hardcoded machine paths without ${ENV:-default}\n";
audit_prompt += "4. example adapter + at least one real adapter with portable paths\n";
audit_prompt += "5. SKILL.md portable doctrine (plan → capture host → grid/view)\n";
audit_prompt += "6. viewers use Photo Sphere Viewer only (no custom sphere)\n";
audit_prompt += "7. smoke tests exist and are documented (npm test)\n";
audit_prompt += "8. README install/CLI/adapter/philosophy clear in < 3 min read\n";
audit_prompt += "9. No secrets, no huge tracked assets, .gitignore sane\n";
audit_prompt += "10. Code easy to read: small modules, no dead empty dirs\n\n";
audit_prompt += "Return ready_score 0-10, blockers (release-stopping), nits, summary.\n";
audit_prompt += "Be harsh. Score ≥8 only if a stranger could npm install and use plan/grid/view today.\n";

let audit = agent(audit_prompt, #{
    label: "oss-audit",
    capability_mode: "execute",
    output_schema: audit_schema,
});

if audit == () || !audit.success || audit.output == () {
    pause("verification", "Audit agent failed — resume after fixing infra, or re-run workflow.");
}

let audit_score = if audit.output.ready_score == () { 0 } else { audit.output.ready_score };
let audit_summary = if audit.output.summary == () { "(no summary)" } else { audit.output.summary };
let audit_blockers = if audit.output.blockers == () { [] } else { audit.output.blockers };
let audit_nits = if audit.output.nits == () { [] } else { audit.output.nits };
log("Audit score: " + audit_score.to_string() + "/10");
log(audit_summary);

// ─── Phase: Polish ──────────────────────────────────────────────
phase("Polish");

let polish_prompt = "";
polish_prompt += "Harden 7dps for open source. Package root: " + root + "\n\n";
polish_prompt += "Prior audit blockers (JSON):\n";
polish_prompt += json_encode(audit_blockers) + "\n";
polish_prompt += "Nits:\n" + json_encode(audit_nits) + "\n\n";
polish_prompt += "Rules — keep it MINIMAL and easy to understand:\n";
polish_prompt += "- Prefer editing existing lib/*.mjs over adding frameworks\n";
polish_prompt += "- No capture reimplementation; host tools only\n";
polish_prompt += "- Portable paths: relative or ${ENV:-default} only\n";
polish_prompt += "- SKILL.md + README must stay short and accurate\n";
polish_prompt += "- Do not commit node_modules or large mp4/png packs\n";
polish_prompt += "- After edits: run `node --check` on bin + lib; run `npm test` (scripts/smoke.mjs)\n";
polish_prompt += "- If smoke fails, fix until pass\n\n";
polish_prompt += "Return changed, files touched, notes. If already perfect, changed=false and say why.\n";

let polish = agent(polish_prompt, #{
    label: "oss-polish",
    capability_mode: "all",
    output_schema: polish_schema,
});

if polish == () || !polish.success {
    log("Polish agent failed or empty — continuing to verify current tree");
} else if polish.output != () && polish.output.notes != () {
    log("Polish: " + polish.output.notes);
} else {
    log("Polish: done (no notes)");
}

// ─── Phase: Verify ──────────────────────────────────────────────
phase("Verify");

let smoke_prompt = "";
smoke_prompt += "Run offline smoke for 7dps and report results.\n";
smoke_prompt += "cd " + root + " && npm test\n";
smoke_prompt += "Also: node --check bin/7dps.mjs and each lib/*.mjs\n";
smoke_prompt += "Optional: node bin/7dps.mjs plan --adapter example\n";
smoke_prompt += "If e2e requested (" + e2e_note + "): only if PORTFOLIO_ROOM or demos/room exists, run plan --adapter portfolio-room; do NOT run full multi-hour capture unless explicitly safe and fast.\n";
smoke_prompt += "Return passed=true only if smoke exits 0 and syntax checks pass.\n";

let smoke = agent(smoke_prompt, #{
    label: "oss-smoke",
    capability_mode: "all",
    output_schema: smoke_schema,
});

if smoke == () || !smoke.success || smoke.output == () {
    pause("verification", "Smoke agent failed — fix package then resume.");
}

let smoke_passed = smoke.output.passed == true;
let smoke_tail = if smoke.output.log_tail == () { "" } else { smoke.output.log_tail };
let smoke_failures = if smoke.output.failures == () { [] } else { smoke.output.failures };

if !smoke_passed {
    log("Smoke FAILED: " + smoke_tail);
    // one repair pass
    let fix_prompt = "";
    fix_prompt += "Smoke failed for 7dps at " + root + ".\n";
    fix_prompt += "Failures: " + json_encode(smoke_failures) + "\n";
    fix_prompt += "Log: " + smoke_tail + "\n";
    fix_prompt += "Fix code minimally, re-run npm test until pass. Return same smoke schema.\n";
    let smoke2 = agent(fix_prompt, #{
        label: "oss-smoke-repair",
        capability_mode: "all",
        output_schema: smoke_schema,
    });
    if smoke2 != () && smoke2.success && smoke2.output != () {
        smoke = smoke2;
        smoke_passed = smoke.output.passed == true;
        smoke_tail = if smoke.output.log_tail == () { "" } else { smoke.output.log_tail };
        smoke_failures = if smoke.output.failures == () { [] } else { smoke.output.failures };
    }
}

if !smoke_passed {
    complete(#{
        ship: false,
        summary: "7dps not OSS-ready — smoke still failing",
        audit_score: audit_score,
        smoke_passed: false,
        smoke_failures: smoke_failures,
    });
}

// adversarial dual review
let review_jobs = [];
review_jobs.push(#{
    prompt: "Adversarially review 7dps for open-source ship at " + root + ". "
        + "Read package.json, LICENSE, README, bin/7dps.mjs, lib/*.mjs, adapters, skills/7dps/SKILL.md, scripts/smoke.mjs. "
        + "ship=true only if a stranger can install, plan, grid, encode (with magick/ffmpeg), and view docs make sense. "
        + "List must_fix if any. Prefer concrete file:line issues.",
    label: "review-a",
    capability_mode: "read-only",
    output_schema: review_schema,
});
review_jobs.push(#{
    prompt: "Second independent OSS review of 7dps at " + root + ". "
        + "Focus on code clarity, portability (no hardcoded /home paths without env default), "
        + "skill honesty (capture stays in host), and missing tests/docs. "
        + "ship=true only with evidence you inspected files. must_fix for blockers.",
    label: "review-b",
    capability_mode: "read-only",
    output_schema: review_schema,
});
let reviews = parallel(review_jobs);

let ship_votes = 0;
let must = [];
let reasons = [];
let ri = 0;
for rev in reviews {
    if rev != () && rev.success && rev.output != () {
        if rev.output.ship == true {
            ship_votes += 1;
        }
        if rev.output.must_fix != () {
            for m in rev.output.must_fix {
                must.push(m);
            }
        }
        if rev.output.reasons != () {
            for r in rev.output.reasons {
                reasons.push(r);
            }
        }
    }
    ri += 1;
}

let ship = ship_votes >= 2 && smoke_passed;

// ─── Phase: Ship gate ───────────────────────────────────────────
phase("Ship gate");

let report = "";
report += "# 7dps OSS readiness\n\n";
report += "- package: `" + root + "`\n";
report += "- audit score: " + audit_score.to_string() + "/10\n";
report += "- smoke: " + if smoke_passed { "PASS" } else { "FAIL" } + "\n";
report += "- reviewer ship votes: " + ship_votes.to_string() + "/2\n";
report += "- **ship: " + if ship { "YES" } else { "NO" } + "**\n\n";
report += "## Audit summary\n" + audit_summary + "\n\n";
if must.len() > 0 {
    report += "## Must fix\n";
    for m in must {
        report += "- " + m + "\n";
    }
    report += "\n";
}
if reasons.len() > 0 {
    report += "## Review notes\n";
    let cap = 12;
    let i = 0;
    for r in reasons {
        if i < cap {
            report += "- " + r + "\n";
        }
        i += 1;
    }
}
report += "\n## How to use\n";
report += "```bash\ncd " + root + "\nnpm install && npm test\nnode bin/7dps.mjs plan --adapter example\n```\n";

let path = write_scratch_file("7dps-oss-ready.md", report);
if ship {
    log("OSS ship gate: YES");
} else {
    log("OSS ship gate: NO");
}

complete(#{
    ship: ship,
    summary: if ship { "7dps ready to open source (smoke + dual review)" } else { "7dps not ready — see must_fix" },
    report_path: path,
    audit_score: audit_score,
    smoke_passed: smoke_passed,
    ship_votes: ship_votes,
    must_fix: must,
});
