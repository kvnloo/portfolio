let meta = #{
    name: "7dps-product-ready",
    description: "Ship 7dps production-ready: features (drone+presets), full smoke+browser e2e, dual review until ship",
    when_to_use: "When 7dps must be fully working with proof (not OSS packaging only)",
    phases: [
        #{ title: "Inventory", detail: "what is missing vs production bar" },
        #{ title: "Implement", detail: "features + tests until green" },
        #{ title: "Prove", detail: "npm test + npm run e2e with evidence" },
        #{ title: "Ship gate", detail: "dual adversarial review" },
    ],
};

let inv_schema = #{
    "type": "object",
    "required": ["gaps", "summary"],
    "properties": #{
        "gaps": #{ "type": "array", "maxItems": 20, "items": #{ "type": "string" } },
        "summary": #{ "type": "string" },
    },
};

let impl_schema = #{
    "type": "object",
    "required": ["changed", "files", "notes"],
    "properties": #{
        "changed": #{ "type": "boolean" },
        "files": #{ "type": "array", "maxItems": 40, "items": #{ "type": "string" } },
        "notes": #{ "type": "string" },
    },
};

let prove_schema = #{
    "type": "object",
    "required": ["smoke_ok", "e2e_ok", "evidence", "failures"],
    "properties": #{
        "smoke_ok": #{ "type": "boolean" },
        "e2e_ok": #{ "type": "boolean" },
        "evidence": #{ "type": "array", "maxItems": 20, "items": #{ "type": "string" } },
        "failures": #{ "type": "array", "maxItems": 20, "items": #{ "type": "string" } },
    },
};

let review_schema = #{
    "type": "object",
    "required": ["ship", "reasons", "must_fix"],
    "properties": #{
        "ship": #{ "type": "boolean" },
        "reasons": #{ "type": "array", "maxItems": 12, "items": #{ "type": "string" } },
        "must_fix": #{ "type": "array", "maxItems": 12, "items": #{ "type": "string" } },
    },
};

let root = if args == () { () } else { args.root };
if root == () {
    root = "/home/kvn/workspace/zer0/products/7dps";
}

// Production bar (explicit — no soft packing-only gate)
// 1. CLI: plan, run, presets, drone-path, encode-4d, encode-drone, grid, view 3d/4d
// 2. npm test green (includes 4d HTTP + presets + drone)
// 3. npm run e2e green — Chromium opens PSV 3d AND 4d, canvas present, not black
// 4. fixtures sample still + sample mp4 shipped
// 5. skill + README document full product
// 6. dual review ship votes 2/2

phase("Inventory");
log("7dps product-ready inventory at " + root);

let inv_p = "";
inv_p += "Audit PRODUCTION readiness of 7dps at " + root + ".\n";
inv_p += "Use read_file, list_dir, grep, run_terminal_command.\n";
inv_p += "Bar: drone flythrough + quality presets + browser e2e 3d+4d + smoke.\n";
inv_p += "List concrete gaps (missing files/commands/tests). summary in one paragraph.\n";
inv_p += "Do not claim ready without checking package.json scripts test:full / e2e.\n";

let inv = agent(inv_p, #{
    label: "inventory",
    capability_mode: "execute",
    output_schema: inv_schema,
});
if inv == () || !inv.success || inv.output == () {
    pause("verification", "Inventory agent failed");
}
let gaps = if inv.output.gaps == () { [] } else { inv.output.gaps };
let inv_sum = if inv.output.summary == () { "" } else { inv.output.summary };
log(inv_sum);

phase("Implement");
let impl_p = "";
impl_p += "Make 7dps PRODUCTION READY at " + root + ".\n";
impl_p += "Gaps: " + json_encode(gaps) + "\n\n";
impl_p += "Required features:\n";
impl_p += "- Quality presets draft/social/print/archive under presets/\n";
impl_p += "- drone-path (orbit|flyover|spiral|pushin) + encode-drone\n";
impl_p += "- 4d encode + view with Photo Sphere Viewer\n";
impl_p += "- Full import map for three + @photo-sphere-viewer/*\n";
impl_p += "- scripts/smoke.mjs covers presets, drone, 4d HTTP\n";
impl_p += "- scripts/e2e-browser.mjs opens Chromium, waits for canvas, screenshots 3d+4d, fails if black\n";
impl_p += "- fixtures/sample-equirect.png + sample-equirect.mp4\n";
impl_p += "- SKILL.md + README accurate\n\n";
impl_p += "After edits: cd " + root + " && npm test && npm run e2e\n";
impl_p += "Fix until BOTH pass. Keep code minimal and clear.\n";
impl_p += "Return changed, files, notes.\n";

let impl = agent(impl_p, #{
    label: "implement",
    capability_mode: "all",
    output_schema: impl_schema,
});
if impl != () && impl.success && impl.output != () && impl.output.notes != () {
    log(impl.output.notes);
}

phase("Prove");
let prove_p = "";
prove_p += "PROVE 7dps works at " + root + ".\n";
prove_p += "1. cd " + root + " && npm test\n";
prove_p += "2. cd " + root + " && npm run e2e\n";
prove_p += "3. Confirm fixtures/e2e-out/e2e-3d.png and e2e-4d.png exist and report.json ok:true\n";
prove_p += "4. List evidence paths and mean luma if present\n";
prove_p += "smoke_ok and e2e_ok true ONLY if commands exit 0.\n";
prove_p += "If fail, fix once and re-run. Put remaining failures in failures[].\n";

let prove = agent(prove_p, #{
    label: "prove",
    capability_mode: "all",
    output_schema: prove_schema,
});
if prove == () || !prove.success || prove.output == () {
    pause("verification", "Prove agent failed");
}

let smoke_ok = prove.output.smoke_ok == true;
let e2e_ok = prove.output.e2e_ok == true;
let evidence = if prove.output.evidence == () { [] } else { prove.output.evidence };
let failures = if prove.output.failures == () { [] } else { prove.output.failures };

if !smoke_ok || !e2e_ok {
    log("Prove failed — repair pass");
    let fix_p = "";
    fix_p += "7dps prove FAILED at " + root + ".\n";
    fix_p += "failures: " + json_encode(failures) + "\n";
    fix_p += "Fix code, re-run npm test && npm run e2e until both pass. Return prove schema.\n";
    let prove2 = agent(fix_p, #{
        label: "prove-repair",
        capability_mode: "all",
        output_schema: prove_schema,
    });
    if prove2 != () && prove2.success && prove2.output != () {
        prove = prove2;
        smoke_ok = prove.output.smoke_ok == true;
        e2e_ok = prove.output.e2e_ok == true;
        evidence = if prove.output.evidence == () { [] } else { prove.output.evidence };
        failures = if prove.output.failures == () { [] } else { prove.output.failures };
    }
}

if !smoke_ok || !e2e_ok {
    complete(#{
        ship: false,
        summary: "7dps not production-ready — tests still failing",
        smoke_ok: smoke_ok,
        e2e_ok: e2e_ok,
        failures: failures,
    });
}

phase("Ship gate");
let rj = [];
rj.push(#{
    prompt: "Adversarial PRODUCTION review of 7dps at " + root + ". "
        + "Read package.json, README, SKILL, bin, lib (view import map, drone, presets), scripts/smoke + e2e, fixtures. "
        + "Evidence of green e2e may include fixtures/e2e-out/report.json. "
        + "ship=true ONLY if: presets exist, drone path+encode exist, smoke+e2e scripts exist and recent evidence shows pass, "
        + "PSV import map covers @photo-sphere-viewer/* and three, sample 3d+4d fixtures exist. "
        + "must_fix for any gap.",
    label: "review-a",
    capability_mode: "read-only",
    output_schema: review_schema,
});
rj.push(#{
    prompt: "Second independent PRODUCTION review of 7dps at " + root + ". "
        + "Focus: can a stranger clone, npm install, npm test, npm run e2e, and view 3d+4d samples? "
        + "Is drone + quality presets real code not just docs? ship=true only with file evidence. must_fix otherwise.",
    label: "review-b",
    capability_mode: "read-only",
    output_schema: review_schema,
});
let reviews = parallel(rj);

let ship_votes = 0;
let must = [];
let reasons = [];
for rev in reviews {
    if rev != () && rev.success && rev.output != () {
        if rev.output.ship == true { ship_votes += 1; }
        if rev.output.must_fix != () {
            for m in rev.output.must_fix { must.push(m); }
        }
        if rev.output.reasons != () {
            for r in rev.output.reasons { reasons.push(r); }
        }
    }
}

let ship = ship_votes >= 2 && smoke_ok && e2e_ok;

let report = "";
report += "# 7dps product-ready\n\n";
report += "- root: `" + root + "`\n";
report += "- smoke: " + if smoke_ok { "PASS" } else { "FAIL" } + "\n";
report += "- e2e browser 3d+4d: " + if e2e_ok { "PASS" } else { "FAIL" } + "\n";
report += "- ship votes: " + ship_votes.to_string() + "/2\n";
report += "- **ship: " + if ship { "YES" } else { "NO" } + "**\n\n";
report += "## Evidence\n";
for e in evidence { report += "- " + e + "\n"; }
if must.len() > 0 {
    report += "\n## Must fix\n";
    for m in must { report += "- " + m + "\n"; }
}
if reasons.len() > 0 {
    report += "\n## Review notes\n";
    let i = 0;
    for r in reasons {
        if i < 12 { report += "- " + r + "\n"; }
        i += 1;
    }
}
report += "\n## Commands\n```bash\ncd " + root + "\nnpm test && npm run e2e\n7dps view 3d fixtures/sample-equirect.png\n7dps view 4d fixtures/sample-equirect.mp4\n```\n";

let path = write_scratch_file("7dps-product-ready.md", report);
if ship {
    log("PRODUCT SHIP GATE: YES");
} else {
    log("PRODUCT SHIP GATE: NO");
}

complete(#{
    ship: ship,
    summary: if ship { "7dps production-ready (smoke+e2e+features+dual review)" } else { "7dps not ready — see must_fix" },
    report_path: path,
    smoke_ok: smoke_ok,
    e2e_ok: e2e_ok,
    ship_votes: ship_votes,
    must_fix: must,
    evidence: evidence,
});
