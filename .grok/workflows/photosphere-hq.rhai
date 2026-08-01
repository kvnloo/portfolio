// Mirror entry — same script as 4dps product workflow (room + 4dps monorepo paths).
// Prefer running from 4dps; this copy is for portfolio-session discovery.

let meta = #{
    name: "photosphere-hq",
    description: "Fix ramen photosphere capture + 4dps demo so 3D/4D showcase beats real-time and clearly shows the shop",
    when_to_use: "When 4dps demo is black, low-res, mis-stitched, or does not show the ramen shop",
    phases: [
        #{ title: "Diagnose", detail: "why capture/stitch/demo are trash vs real-time" },
        #{ title: "Fix capture", detail: "high-quality cube→equirect + multi-frame 4D in host room" },
        #{ title: "Wire demo", detail: "4dps demo serves HQ assets via PSV only" },
        #{ title: "Prove", detail: "browser screenshots must show kiosk/neon/shop" },
    ],
};

let diag_schema = #{
    "type": "object",
    "required": ["root_causes", "fix_plan", "summary"],
    "properties": #{
        "root_causes": #{ "type": "array", "maxItems": 12, "items": #{ "type": "string" } },
        "fix_plan": #{ "type": "array", "maxItems": 12, "items": #{ "type": "string" } },
        "summary": #{ "type": "string" },
    },
};

let fix_schema = #{
    "type": "object",
    "required": ["changed", "files", "notes", "equirect_path", "mp4_path"],
    "properties": #{
        "changed": #{ "type": "boolean" },
        "files": #{ "type": "array", "maxItems": 40, "items": #{ "type": "string" } },
        "notes": #{ "type": "string" },
        "equirect_path": #{ "type": "string" },
        "mp4_path": #{ "type": "string" },
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

let dps = if args == () { () } else { args.dps_root };
if dps == () { dps = "/workspace/zer0/products/4dps"; }
let room = if args == () { () } else { args.room_root };
if room == () { room = "/workspace/portfolio/demos/room"; }
let size = if args == () { () } else { args.face_size };
if size == () { size = 1024; }

phase("Diagnose");
log("Diagnosing photosphere HQ failure: room=" + room + " dps=" + dps);

let diag_p = "";
diag_p += "You are diagnosing why the 4dps ramen photosphere demo is trash vs the live shop.\n";
diag_p += "ROOM: " + room + "\n";
diag_p += "4DPS: " + dps + "\n\n";
diag_p += "Read with tools (do not invent):\n";
diag_p += "- " + room + "/src/ShopCanvas.tsx  (__shopCapturePhotosphere, CUBE_FACES, stitch math)\n";
diag_p += "- " + room + "/tools/capture-photosphere.mjs\n";
diag_p += "- " + dps + "/demo/index.html and scripts/demo.mjs\n";
diag_p += "- Latest faces under " + room + "/shots/ramen-demo-photosphere/ (identify mean/std, open images)\n";
diag_p += "- Compare to a good beauty still e.g. " + room + "/shots/loop-r32/01-beauty-hero.png\n\n";
diag_p += "Known product intent: HQ offline photosphere/4D showcase BETTER than real-time for weak hardware.\n";
diag_p += "List concrete root_causes and ordered fix_plan. summary in one paragraph.\n";

let diag = agent(diag_p, #{
    label: "diagnose",
    capability_mode: "all",
    output_schema: diag_schema,
});
if diag == () || !diag.success || diag.output == () {
    pause("verification", "Diagnose agent failed — resume after infra ok");
}
let causes = if diag.output.root_causes == () { [] } else { diag.output.root_causes };
let plan = if diag.output.fix_plan == () { [] } else { diag.output.fix_plan };
let dsum = if diag.output.summary == () { "" } else { diag.output.summary };
log(dsum);

phase("Fix capture");
let fix_p = "";
fix_p += "FIX high-quality photosphere capture for Kevin's Ramen room.\n";
fix_p += "ROOM: " + room + "\n4DPS: " + dps + "\n";
fix_p += "Root causes: " + json_encode(causes) + "\n";
fix_p += "Plan: " + json_encode(plan) + "\n\n";
fix_p += "Requirements:\n";
fix_p += "1. Fix __shopCapturePhotosphere so cube faces show the shop (neon/kiosk readable).\n";
fix_p += "2. Cube face dirs/up + equirect UV must match standard OpenGL cube→equirect (or use THREE.CubeCamera).\n";
fix_p += "3. Capture at face size " + size.to_string() + " or higher; supersample for AA.\n";
fix_p += "4. Eye origin in OPEN PLAZA in front of kiosk (~[0.2,1.85,6]).\n";
fix_p += "5. Prefer CDP Page.captureScreenshot per face if canvas path is soft/black on SwiftShader.\n";
fix_p += "6. Rebuild room, run capture-photosphere.mjs --label ramen-hq --size " + size.to_string() + "\n";
fix_p += "7. Multi-frame 4D: ≥12 yaw steps → equirect frames → ffmpeg mp4 (not static 1-still fake).\n";
fix_p += "8. Write equirect_path and mp4_path absolute.\n";
fix_p += "9. Reject face std≈0 or mean≈0.25 solid black.\n";
fix_p += "Use tools to edit, build, capture. Return fix_schema.\n";

let fix = agent(fix_p, #{
    label: "fix-capture",
    capability_mode: "all",
    output_schema: fix_schema,
});
if fix == () || !fix.success || fix.output == () {
    pause("verification", "Fix capture agent failed");
}
let equirect = if fix.output.equirect_path == () { "" } else { fix.output.equirect_path };
let mp4 = if fix.output.mp4_path == () { "" } else { fix.output.mp4_path };
let fnotes = if fix.output.notes == () { "" } else { fix.output.notes };
log(fnotes);

phase("Wire demo");
let wire_p = "";
wire_p += "Wire 4dps demo to HQ ramen assets.\n";
wire_p += "4DPS: " + dps + "\n equirect: " + equirect + "\n mp4: " + mp4 + "\n";
wire_p += "Copy into demo/assets, update demo.mjs preferences, restart DEMO_PORT=5177.\n";
wire_p += "Return fix_schema with demo asset paths.\n";

let wire = agent(wire_p, #{
    label: "wire-demo",
    capability_mode: "all",
    output_schema: fix_schema,
});
if wire != () && wire.success && wire.output != () {
    if wire.output.equirect_path != () { equirect = wire.output.equirect_path; }
    if wire.output.mp4_path != () { mp4 = wire.output.mp4_path; }
    if wire.output.notes != () { log(wire.output.notes); }
}

phase("Prove");
let prove_p = "";
prove_p += "PROVE photosphere showcase shows ramen shop. dps=" + dps + " room=" + room + "\n";
prove_p += "identify equirect; browser http://127.0.0.1:5177/; screenshots prove-3d/4d.png;\n";
prove_p += "pass=true only if kiosk/neon visible. Return prove_schema.\n";

let prove = agent(prove_p, #{
    label: "prove",
    capability_mode: "all",
    output_schema: prove_schema,
});
if prove == () || !prove.success || prove.output == () {
    pause("verification", "Prove agent failed");
}

let ok = prove.output.pass == true;
let demo_url = if prove.output.demo_url == () { "http://127.0.0.1:5177/" } else { prove.output.demo_url };
let evidence = if prove.output.evidence == () { [] } else { prove.output.evidence };
let failures = if prove.output.failures == () { [] } else { prove.output.failures };

if !ok {
    let rep = "";
    rep += "Prove FAILED: " + json_encode(failures) + ". Fix, recapture, restart demo, re-screenshot. prove_schema.\n";
    let prove2 = agent(rep, #{
        label: "prove-repair",
        capability_mode: "all",
        output_schema: prove_schema,
    });
    if prove2 != () && prove2.success && prove2.output != () {
        prove = prove2;
        ok = prove.output.pass == true;
        demo_url = if prove.output.demo_url == () { demo_url } else { prove.output.demo_url };
        evidence = if prove.output.evidence == () { [] } else { prove.output.evidence };
        failures = if prove.output.failures == () { [] } else { prove.output.failures };
    }
}

let ship_votes = 0;
let must = [];
if ok {
    let rj = [];
    rj.push(#{
        prompt: "Review photosphere HQ. dps=" + dps + " room=" + room + ". ship=true only if shop visible and stitch ok.",
        label: "review-a",
        capability_mode: "read-only",
        output_schema: review_schema,
    });
    rj.push(#{
        prompt: "Second review showcase quality vs realtime. dps=" + dps + ". ship=true with evidence only.",
        label: "review-b",
        capability_mode: "read-only",
        output_schema: review_schema,
    });
    let reviews = parallel(rj);
    for rev in reviews {
        if rev != () && rev.success && rev.output != () {
            if rev.output.ship == true { ship_votes += 1; }
            if rev.output.must_fix != () {
                for m in rev.output.must_fix { must.push(m); }
            }
        }
    }
}

let ship = ok && ship_votes >= 2;
let report = "# Photosphere HQ\n\nship=" + if ship { "YES" } else { "NO" } + " demo=" + demo_url + "\n";
let path = write_scratch_file("photosphere-hq-report.md", report);
log(if ship { "PHOTOSPHERE HQ SHIP YES" } else { "PHOTOSPHERE HQ SHIP NO" });

complete(#{
    ship: ship,
    summary: if ship { "HQ photosphere showcase ready" } else { "not ready" },
    report_path: path,
    demo_url: demo_url,
    prove_pass: ok,
    ship_votes: ship_votes,
    equirect_path: equirect,
    mp4_path: mp4,
    must_fix: must,
    failures: failures,
    evidence: evidence,
});
