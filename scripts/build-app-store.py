#!/usr/bin/env python3
"""Build a public-only catalog from fetched registry + public GitHub metadata.
Inputs live outside the repo; private work reports are never copied into the site.
"""
import json
import os
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
INPUT = Path(os.environ['TMPDIR'])
public = {r['name'].lower(): r for r in json.loads((INPUT / 'store-public-all.json').read_text()) if not r.get('private')}
components = yaml.safe_load((INPUT / 'store-components.yaml').read_text())['components']
suite = yaml.safe_load((INPUT / 'store-suite.yaml').read_text())['repositories']
# Editorial overrides: source-grounded scope, not upstream merge or readiness claims.
featured = [
 ('dash','Dash','Agents & interfaces','Phone UI for laptop coding agents.','Original product',['Multi-harness conversations','Phone-to-agent bridge','Voice and roadmap experiments']),
 ('hermes-tern','Hermes × Tern','Agents & interfaces','A native terminal surface for Hermes conversations.','Downstream development',['Native transcript and tool surfaces','Composer and keyboard interaction','Media and preview experiments']),
 ('gods-eye-view',"God’s Eye View",'Spatial & creative','Explore live spatial intelligence on a 3D globe.','Open-source collaboration',['Geospatial and disaster-awareness work','Realtime controls','Attention-aware UX']),
 ('oh-my-pi','Oh My Pi','Agents & interfaces','A coding agent designed around the terminal.','Open-source collaboration',['TUI performance and ergonomics','Context and tool workflows','Live and voice interaction experiments']),
 ('cua','CUA','Agents & interfaces','Tools for agents to work with real computer interfaces.','Open-source collaboration',['Semantic computer-use work','Native control and latency studies','Execution safety and verification']),
 ('fframestudio','fframestudio','Spatial & creative','A film studio with an agent in the editing workflow.','Original product',['Film editing workflows','ACP assistant integration','Preview and delivery experiments']),
 ('ephemeral-ui','Ephemeral UI','Agents & interfaces','Small, interactive app cards for agent hosts.','Public showcase',['Interactive card catalog','Host-agnostic surfaces','Public built site; source is private']),
 ('ace','ACE','Spatial & creative','A racquet-sports campus and digital-twin pretotype.','Original product',['3D campus exploration','Facility planning','Human-flourishing campus concept']),
 ('quackles','Quackles','Spatial & creative','A Microduck product study in materials, light, and detail.','Original product',['Product-page exploration','Blender look development','Deep-zoom visual studies']),
 ('garden-room','Garden Room','Life & learning','A 3D planner for plants and the spaces they live in.','Original product',['Room and plant planning','Voice interaction','WebXR measurement experiments']),
 ('noop','NOOP','Life & learning','An offline companion for wearable data.','Downstream development',['On-device experience','Cross-platform work','Privacy-conscious interaction']),
 ('kvn','/kvn','Agents & interfaces','A living public knowledge base of my tools, workflows, and voice.','Original product',['Public-source ledger','Evidence-grounded answers','Installable agent skill']),
 ('hermes-maintainer','Hermes Maintainer','Infrastructure & research','A backlog graph that organizes problems, candidate fixes, and evidence.','Original product',['Problem-family graphs','Survivor and donor relationships','Audit-seed public snapshot, not a live scan']),
 ('gh-contrib-archive','Contribution Archive','Infrastructure & research','A public-safe explorer of GitHub contributions.','Original product',['Issues, PRs and discussion history','Public contribution visualization','Private source material stays out']),
 ('boplog','Boplog','Infrastructure & research','A build-in-public log with source-linked project activity.','Original product',['Project activity feed','Contribution ledger','Agent-readable interfaces']),
 ('noctalia','Noctalia','Desktop & tools','A customizable Wayland desktop shell.','Open-source collaboration',['Accessibility and layout work','Media and network interaction','Desktop-shell polish']),
 ('t3code','T3 Code','Desktop & tools','A workspace for agent-assisted software development.','Open-source collaboration',['Agent workflow integration','Interface and interaction work','Downstream experiments']),
 ('o8','o8','Desktop & tools','Multi-agent desktop workflows.','Open-source collaboration',['Responsive interfaces','Hermes integration','Mobile voice experiments']),
 ('.files','Flow / .files','Desktop & tools','A Linux workspace built to protect flow.','Original product',['Workspace and terminal configuration','Audio DSP environment','Desktop interaction experiments']),
 ('z0live','z0live','Agents & interfaces','Realtime voice interaction for agent workflows.','Original product',['Voice interaction experiments','Portable runtime','Agent handoff']),
 ('openpaw','OpenPaw','Life & learning','An early evidence-first approach to canine wellbeing.','Original product',['Behavior observation','Wellbeing-oriented design','Early exploration']),
 ('humanity-vault','Humanity Vault','Life & learning','A mobile-first learning interface for a research knowledge base.','Original product',['Encode and retrieve','Learning workflows','Measurement and pruning']),
 ('smartcity','Smartcity','Spatial & creative','A nested city digital-twin exploration.','Original product',['Spatial visualization','Simulation exploration','Digital-twin look development']),
 ('elemental-ui','Elemental UI','Spatial & creative','Interface explorations for expressive software.','Original product',['UI studies','Visual language','Interaction exploration']),
 ('img2threejs','img2threejs','Spatial & creative','Reference images to procedural, quality-gated 3D models.','Downstream development',['Reconstruction evidence','Renderer validation','Procedural model experiments']),
 ('dream-loop','Dream Loop','Spatial & creative','Evidence-driven visual iteration for agents.','Downstream development',['Reference-led iteration','Visual review gates','Discovery history']),
 ('detent','Detent','Desktop & tools','An Android launcher with an edge-of-screen app dial.','Downstream development',['Launcher fork work','Theme exploration','Dial interaction']),
 ('omalauncher','oMaLauncher','Desktop & tools','An agentic Android launcher for apps and widgets.','Open-source collaboration',['Agentic launcher workflows','Widget exploration','Android interaction']),
]
# Only owner-owned Pages addresses are launch targets; upstream homepages are not our demos.
demos = {
 'ace': 'https://kvnloo.github.io/ace/',
 'ephemeral-ui': 'https://kvnloo.github.io/ephemeral-ui/',
 'quackles': 'https://kvnloo.github.io/quackles-nightly/',
 'aodl': 'https://kvnloo.github.io/aodl/',
 'gh-contrib-archive': 'https://kvnloo.github.io/gh-contrib-archive/',
 'hermes-maintainer': 'https://kvnloo.github.io/hermes-maintainer/',
 'z0evals': 'https://kvnloo.github.io/z0evals/',
 'humanity-vault': 'https://kvnloo.github.io/humanity-vault/',
 'smartcity': 'https://kvnloo.github.io/smartcity/',
}
entries = []
seen = set()
for slug, name, category, summary, role, features in featured:
    r = public.get(slug.lower())
    if not r:
        continue
    seen.add(slug.lower())
    entries.append(dict(id=slug, name=name, category=category, summary=summary, role=role,
        features=features, repo=r['html_url'], source=r['html_url'], demo=demos.get(slug),
        availability='Public preview' if slug in demos else 'Source available',
        caveat='Downstream work and proposals are not claims of upstream adoption.' if role != 'Original product' else 'A project page is not a production-readiness guarantee.',
        sourceDate='2026-11-04', fork=r['fork']))
for key, v in {**components, **suite}.items():
    repo = v.get('repo', '').split('/')[-1]
    if repo.lower() in seen or repo.lower() not in public:
        continue
    r = public[repo.lower()]
    seen.add(repo.lower())
    summary = ' '.join(str(v.get('summary', r.get('description') or 'Public project in the z0 ecosystem.')).split())
    entries.append(dict(id=repo.lower(), name=v.get('name',repo), category='Infrastructure & research',
        summary=summary, role='Downstream development' if r['fork'] else 'Original product',
        features=['Read the project source and documentation','Explore the linked architecture and evidence'],
        repo=r['html_url'], source='https://github.com/kvnloo/z0/blob/main/registry/' + ('components.yaml' if key in components else 'suite.yaml'),
        demo=demos.get(repo.lower()), availability='Public preview' if repo.lower() in demos else 'Source available',
        caveat='Registry status is not a runtime or deployment verification.', sourceDate='2026-11-04', fork=r['fork']))
entries.insert(0,dict(id='ramen-shop',name='Ramen & Boba',category='Spatial & creative',
    summary='Step inside an interactive 3D portfolio — the original shop, still here.',
    role='Original product',features=['Explore the 3D shop','Discover projects inside the room','Watch an existing orbit capture'],
    repo='https://github.com/kvnloo/portfolio',source='https://github.com/kvnloo/portfolio/tree/dev/demos/room',
    demo='../room/',availability='Interactive prototype',sourceDate='2026-11-04',fork=False,
    image='media/ramen.png',video='media/ramen.mp4',caveat='The video is a recorded orbit, not a live interaction.'))
ids=[e['id'] for e in entries]
assert len(ids)==len(set(ids))
output=ROOT/'demos/store/catalog.json'
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(dict(updated='2026-11-04',products=entries),indent=2)+'\n')
print(f'{len(entries)} unique public product pages; {sum(bool(x.get("demo")) for x in entries)} preview links')
