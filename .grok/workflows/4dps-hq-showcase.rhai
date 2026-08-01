let meta = #{
    name: "4dps-hq-showcase",
    description: "Raise 4dps photosphere quality above live WebGL: fix stitch, HQ 3D/4D capture, skill, demo prove shop visible",
    when_to_use: "When 4dps demo is low-res, mis-stitched, black, or not better than real-time shop view",
    phases: [
        #{ title: "Inspect", detail: "skill, demo, stitch, sample assets, host adapter" },
        #{ title: "Fix 4dps", detail: "skill doctrine + demo + encode/view quality gates in this repo" },
        #{ title: "Fix host capture", detail: "room photosphere API + CDP/high-res path if needed" },
        #{ title: "Capture + prove", detail: "HQ equirect + multi-frame 4D + PSV browser proof" },
    ],
};

let inspect_schema = #{
    "type": "object",
    "required": ["problems", "priority_fixes", "summary"],
    "properties": #{
        "problems": #{ "type": "array", "maxItems": 20, "items": #{ "type": "string" } },
        "priority_fixes": #{ "type": "array", "maxItems": 15, "items": #{ "type": "string" } },
        "summary": #{ "type": "string" },
    },
};

let work_schema = #{
    "type": "object",
    "required": ["changed", "files", "notes"],
    "properties": #{
        "changed": #{ "type": "boolean" },
        "files": #{ "type": "array", "maxItems": 50, "items": #{ "type": "string" } },
        "notes": #{ "type": "string" },
    },
};

let capture_schema = #{
    "type": "object",
    "required": ["ok", "equirect_path", "mp4_path", "metrics", "notes"],
    "properties": #{
        "ok": #{ "type": "boolean" },
        "equirect_path": #{ "type": "string" },
        "mp4_path": #{ "type": "string" },
        "metrics": #{ "type": "string" },
        "notes": #{ "type": "string" },
    },
};

let prove_schema = #{
    "type": "object",
    "required": ["pass", "demo_url", "evidence", "failures"],
    "properties": #{
        "pass": #{ "type": "boolean" },
        "demo_url": #{ "type": "string" },
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

// Primary repo for this workflow
let dps = if args == () { () } else { args.dps_root };
if dps == () { dps = "/workspace/zer0/products/4dps"; }
// Host scene (capture lives here; 4dps still owns skill/demo/view)
let room = if args == () { () } else { args.room_root };
if room == () { room = "/workspace/portfolio/demos/room"; }
let face_size = if args == () { () } else { args.face_size };
if face_size == () { face_size = 1024; }

// PRODUCT BAR — showcase quality > live WebGL
// 1) Equirect shows Kevin's kiosk + neon (not void/black)
// 2) Continuous stitch (no cube seams, flipped faces, wrong up)
// 3) Res: equirect width >= 2*face_size (e.g. 2048x1024+)
// 4) Capture supersampled (dpr>=2 or larger RT then optional downscale for AA)
// 5) 4D: >=12 yaw steps of real equirect frames → mp4 (not 1 still looped)
// 6) Skill documents HQ showcase path + reject-black gates
// 7) demo npm run demo serves assets; browser prove shows shop
// 8) Prefer CDP per-face or CubeCamera if canvas/RT path fails on SwiftShader

phase("Inspect");
log("4dps-hq-showcase inspect dps=" + dps + " room=" + room);

let insp = "";
insp += "Inspect 4dps + host photosphere for HQ showcase failure.\n";
insp += "Work primarily under: " + dps + "\n";
insp += "Host capture (must read/fix if needed): " + room + "\n\n";
insp += "Read with tools:\n";
insp += "- " + dps + "/skills/7dps/SKILL.md, README.md, package.json\n";
insp += "- " + dps + "/demo/index.html, scripts/demo.mjs, lib/view.mjs, lib/encode.mjs\n";
insp += "- " + dps + "/adapters/portfolio-room.json\n";
insp += "- " + room + "/src/ShopCanvas.tsx (__shopCapturePhotosphere, CUBE_FACES, equirect UV)\n";
insp += "- " + room + "/tools/capture-photosphere.mjs\n";
insp += "- Assets: " + room + "/shots/ramen-demo-photosphere/* and " + dps + "/demo/assets/*\n";
insp += "Use identify mean/std; open PNGs with read_file.\n";
insp += "Known failures historically: black WebGLRenderTarget, wrong cube up, bad stitch UV, low 768 faces, static fake 4D, eye too close.\n";
insp += "Return problems[], priority_fixes[] ordered, summary.\n";

let inspected = agent(insp, #{
    label: "inspect",
    capability_mode: "all",
    output_schema: inspect_schema,
});
if inspected == () || !inspected.success || inspected.output == () {
    pause("verification", "Inspect failed");
}
let problems = if inspected.output.problems == () { [] } else { inspected.output.problems };
let fixes = if inspected.output.priority_fixes == () { [] } else { inspected.output.priority_fixes };
let isum = if inspected.output.summary == () { "" } else { inspected.output.summary };
log(isum);

phase("Fix 4dps");
let f4 = "";
f4 += "Improve the 4dps REPO itself for HQ showcase (still PSV-only for view).\n";
f4 += "Root: " + dps + "\n";
f4 += "Problems: " + json_encode(problems) + "\n";
f4 += "Priority: " + json_encode(fixes) + "\n\n";
f4 += "Do ALL that apply inside " + dps + ":\n";
f4 += "1. Update skills/7dps/SKILL.md: HQ showcase bar (better-than-realtime), reject-black, stitch validation, multi-frame 4D, face_size defaults archive/print.\n";
f4 += "2. presets: raise photosphere/4d sizes for print+archive; document capture dpr.\n";
f4 += "3. demo: ensure index is PSV-only; demo.mjs prefers ramen-hq then ramen-demo assets; clear README how to run demo.\n";
f4 += "4. adapters/portfolio-room.json: photosphere origin + scripts + quality social/print for showcase.\n";
f4 += "5. Optional: scripts/capture-hq-check.mjs that validates equirect mean/std and min file size.\n";
f4 += "6. Do NOT reimplement a custom sphere viewer.\n";
f4 += "Return changed, files, notes.\n";

let fix_dps = agent(f4, #{
    label: "fix-4dps-repo",
    capability_mode: "all",
    output_schema: work_schema,
});
if fix_dps != () && fix_dps.success && fix_dps.output != () && fix_dps.output.notes != () {
    log(fix_dps.output.notes);
}

phase("Fix host capture");
let fh = "";
fh += "Fix HOST photosphere capture so output is showcase-grade.\n";
fh += "ROOM: " + room + "\n4DPS: " + dps + "\nface_size=" + face_size.to_string() + "\n";
fh += "Problems: " + json_encode(problems) + "\n\n";
fh += "Implement:\n";
fh += "1. Fix CUBE_FACES up vectors + equirect UV to match Three.js / PSV conventions (no flipped shop).\n";
fh += "2. Capture path that works on software GL: prefer CDP screenshot per 90° face after __shopSetCamera, OR fixed CubeCamera reading that is non-black.\n";
fh += "3. Origin plaza in front of kiosk (~[0.2,1.85,6.0]); exposure high enough for night but not washed.\n";
fh += "4. face size " + face_size.to_string() + "+ ; supersample if needed.\n";
fh += "5. Multi-frame 4D: >=12 yaws, each full equirect or cube-stitch, encode with 4dps encode-4d / ffmpeg.\n";
fh += "6. Label shots/ramen-hq-photosphere/\n";
fh += "7. Build room, run capture, verify identify std>0.05 and shop readable on faces.\n";
fh += "Edit ShopCanvas.tsx and capture-photosphere.mjs as needed.\n";
fh += "Return work_schema.\n";

let fix_host = agent(fh, #{
    label: "fix-host-capture",
    capability_mode: "all",
    output_schema: work_schema,
});
if fix_host != () && fix_host.success && fix_host.output != () && fix_host.output.notes != () {
    log(fix_host.output.notes);
}

phase("Capture + prove");
let cap = "";
cap += "Capture HQ assets and prove demo.\n";
cap += "ROOM=" + room + " DPS=" + dps + " face_size=" + face_size.to_string() + "\n\n";
cap += "1. cd ROOM; build; node tools/capture-photosphere.mjs --label ramen-hq --size " + face_size.to_string() + "\n";
cap += "2. Build multi-frame 4D mp4 into shots/ramen-hq-photosphere/equirect.mp4 (or 4d/)\n";
cap += "3. Copy equirect.png + mp4 to " + dps + "/demo/assets/ramen-equirect.png|.mp4\n";
cap += "4. identify metrics string (mean, std, WxH, bytes)\n";
cap += "5. ok=true only if std>0.05 and files large enough (equirect >> 100kB at 1024 faces)\n";
cap += "Return capture_schema with absolute paths.\n";

let captured = agent(cap, #{
    label: "capture-hq",
    capability_mode: "all",
    output_schema: capture_schema,
});
if captured == () || !captured.success || captured.output == () {
    pause("verification", "Capture step failed");
}
let cap_ok = captured.output.ok == true;
let equirect = if captured.output.equirect_path == () { "" } else { captured.output.equirect_path };
let mp4 = if captured.output.mp4_path == () { "" } else { captured.output.mp4_path };
let metrics = if captured.output.metrics == () { "" } else { captured.output.metrics };
log(metrics);

let prove_p = "";
prove_p += "Prove 4dps HQ showcase. DPS=" + dps + "\n";
prove_p += "equirect=" + equirect + " mp4=" + mp4 + "\n";
prove_p += "1. fuser -k 5177 optional; PORTFOLIO_ROOM=" + room + " DEMO_PORT=5177 DEMO_NO_OPEN=1 npm run demo in " + dps + " (background)\n";
prove_p += "2. Playwright open http://127.0.0.1:5177/ ; screenshot 3D and 4D tabs to demo/assets/prove-3d.png prove-4d.png\n";
prove_p += "3. pass=true ONLY if images show kiosk/neon/shop structure (read_file images). Not black void.\n";
prove_p += "4. Also run npm test in " + dps + " if time (smoke must still pass).\n";
prove_p += "Return prove_schema.\n";

let proved = agent(prove_p, #{
    label: "prove",
    capability_mode: "all",
    output_schema: prove_schema,
});
if proved == () || !proved.success || proved.output == () {
    pause("verification", "Prove failed");
}
let ok = proved.output.pass == true && cap_ok;
let demo_url = if proved.output.demo_url == () { "http://127.0.0.1:5177/" } else { proved.output.demo_url };
let evidence = if proved.output.evidence == () { [] } else { proved.output.evidence };
let failures = if proved.output.failures == () { [] } else { proved.output.failures };

if !ok {
    log("Repair cycle");
    let rep = "";
    rep += "HQ showcase prove FAILED. failures=" + json_encode(failures) + "\n";
    rep += "Fix stitch/capture/demo, recapture, re-prove. Return prove_schema.\n";
    let p2 = agent(rep, #{
        label: "prove-repair",
        capability_mode: "all",
        output_schema: prove_schema,
    });
    if p2 != () && p2.success && p2.output != () {
        proved = p2;
        ok = proved.output.pass == true;
        demo_url = if proved.output.demo_url == () { demo_url } else { proved.output.demo_url };
        evidence = if proved.output.evidence == () { [] } else { proved.output.evidence };
        failures = if proved.output.failures == () { [] } else { proved.output.failures };
    }
}

let ship_votes = 0;
let must = [];
if ok {
    let rj = [];
    rj.push(#{
        prompt: "Adversarial review 4dps HQ showcase. dps=" + dps + " room=" + room + ". "
            + "ship=true only if equirect shows shop, stitch continuous, 4D multi-frame if claimed, skill updated. "
            + "Check demo/assets and prove-*.png.",
        label: "review-a",
        capability_mode: "read-only",
        output_schema: review_schema,
    });
    rj.push(#{
        prompt: "Second review: is quality clearly intended to beat mobile WebGL? dps=" + dps + ". "
            + "ship=true with file evidence only.",
        label: "review-b",
        capability_mode: "read-only",
        output_schema: review_schema,
    });
    let revs = parallel(rj);
    for r in revs {
        if r != () && r.success && r.output != () {
            if r.output.ship == true { ship_votes += 1; }
            if r.output.must_fix != () {
                for m in r.output.must_fix { must.push(m); }
            }
        }
    }
}

let ship = ok && ship_votes >= 2;

let report = "";
report += "# 4dps HQ Showcase\n\n";
report += "- dps: `" + dps + "`\n";
report += "- room: `" + room + "`\n";
report += "- capture_ok: " + if cap_ok { "yes" } else { "no" } + "\n";
report += "- prove: " + if ok { "PASS" } else { "FAIL" } + "\n";
report += "- ship_votes: " + ship_votes.to_string() + "/2\n";
report += "- **ship: " + if ship { "YES" } else { "NO" } + "**\n";
report += "- demo: " + demo_url + "\n";
report += "- metrics: " + metrics + "\n\n";
report += "## Inspect summary\n" + isum + "\n\n";
report += "## Evidence\n";
for e in evidence { report += "- " + e + "\n"; }
if must.len() > 0 {
    report += "\n## Must fix\n";
    for m in must { report += "- " + m + "\n"; }
}
if failures.len() > 0 {
    report += "\n## Failures\n";
    for f in failures { report += "- " + f + "\n"; }
}
report += "\n## Run\n```bash\ncd " + dps + "\nPORTFOLIO_ROOM=" + room + " npm run demo\n```\n";

let path = write_scratch_file("4dps-hq-showcase-report.md", report);
if ship {
    log("4DPS HQ SHIP YES " + demo_url);
} else {
    log("4DPS HQ SHIP NO");
}

complete(#{
    ship: ship,
    summary: if ship {
        "4dps HQ showcase ready — photosphere better path + shop visible"
    } else {
        "4dps HQ showcase not ready"
    },
    report_path: path,
    demo_url: demo_url,
    prove_pass: ok,
    capture_ok: cap_ok,
    ship_votes: ship_votes,
    equirect_path: equirect,
    mp4_path: mp4,
    must_fix: must,
    failures: failures,
    evidence: evidence,
});
