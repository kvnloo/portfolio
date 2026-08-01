#!/usr/bin/env node
/**
 * Generate demos/room shop data from boplog (same project information, visual surface).
 *
 * Data sources (first hit wins for projects):
 *   1. BOPLOG_DATA_DIR env (path to boplog/data)
 *   2. Sibling ~/workspace/boplog/data or ../../boplog/data
 *   3. Live fetch https://kvnloo.github.io/boplog/data/manifest.json + year files
 *
 * Writes:
 *   demos/room/src/data/projects.json      — R3F shop menu shape
 *   demos/room/src/data/shop-manifest.json — boplog-parallel manifest + scene artifacts
 *
 * Usage:
 *   node scripts/sync-shop-from-boplog.mjs
 *   BOPLOG_DATA_DIR=/path/to/boplog/data node scripts/sync-shop-from-boplog.mjs
 */
import { readFile, writeFile, access, mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ROOM = path.join(ROOT, 'demos', 'room')
const SCENE_MAP_PATH = path.join(ROOM, 'src', 'data', 'scene-map.json')
const OUT_PROJECTS = path.join(ROOM, 'src', 'data', 'projects.json')
const OUT_MANIFEST = path.join(ROOM, 'src', 'data', 'shop-manifest.json')
/** Public URL path after Vite build: /portfolio/demos/room/data/shop-manifest.json */
const OUT_PUBLIC_MANIFEST = path.join(ROOM, 'public', 'data', 'shop-manifest.json')
const OUT_PUBLIC_PROJECTS = path.join(ROOM, 'public', 'data', 'projects.json')
const LIVE_BOPLOG = 'https://kvnloo.github.io/boplog/data'

function log(...args) {
  console.log('[sync-shop-from-boplog]', ...args)
}

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function resolveBoplogDataDir() {
  const candidates = [
    process.env.BOPLOG_DATA_DIR,
    path.join(ROOT, '..', 'boplog', 'data'),
    path.join(homedir(), 'workspace', 'boplog', 'data'),
    '/home/kvn/workspace/boplog/data',
  ].filter(Boolean)

  for (const c of candidates) {
    const abs = path.resolve(c)
    if (await exists(path.join(abs, 'manifest.json'))) {
      return abs
    }
  }
  return null
}

async function loadFromDir(dataDir) {
  const manifest = JSON.parse(await readFile(path.join(dataDir, 'manifest.json'), 'utf8'))
  const files = manifest.files || []
  const chunks = await Promise.all(
    files.map(async (f) => JSON.parse(await readFile(path.join(dataDir, f), 'utf8'))),
  )
  let hierarchy = null
  if (manifest.hierarchy) {
    try {
      hierarchy = JSON.parse(await readFile(path.join(dataDir, manifest.hierarchy), 'utf8'))
    } catch {
      /* optional */
    }
  }
  const projects = chunks.flatMap((c) => c.projects || [])
  return { manifest, projects, hierarchy, source: `local:${dataDir}` }
}

async function loadFromLive() {
  const manifestRes = await fetch(`${LIVE_BOPLOG}/manifest.json`, { cache: 'no-store' })
  if (!manifestRes.ok) throw new Error(`live manifest ${manifestRes.status}`)
  const manifest = await manifestRes.json()
  const dataVersion = manifest.generatedAt || 'live'
  const files = manifest.files || []
  const chunks = await Promise.all(
    files.map(async (f) => {
      const url = new URL(`${LIVE_BOPLOG}/${f}`)
      url.searchParams.set('v', dataVersion)
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) throw new Error(`${f}: ${r.status}`)
      return r.json()
    }),
  )
  let hierarchy = null
  if (manifest.hierarchy) {
    try {
      const r = await fetch(`${LIVE_BOPLOG}/${manifest.hierarchy}`, { cache: 'no-store' })
      if (r.ok) hierarchy = await r.json()
    } catch {
      /* optional */
    }
  }
  const projects = chunks.flatMap((c) => c.projects || [])
  return { manifest, projects, hierarchy, source: `live:${LIVE_BOPLOG}` }
}

function githubUrl(p) {
  const gh = (p.links || []).find((l) => /github/i.test(l.label) || /github\.com/.test(l.url || ''))
  if (gh?.url) return gh.url
  if (p.url?.includes('github.com')) return p.url
  return `https://github.com/kvnloo/${p.name || p.id}`
}

function demoUrl(p) {
  const docs = (p.links || []).find((l) => /docs|demo|pages|site/i.test(l.label))
  if (docs?.url) return docs.url
  if (p.url && !p.url.includes('github.com')) return p.url
  return githubUrl(p)
}

function tagsFrom(p) {
  const tags = []
  for (const c of p.categories || []) tags.push(String(c))
  for (const t of p.types || []) {
    if (t !== 'public' && t !== 'fork') tags.push(String(t))
  }
  if (p.language) tags.push(p.language)
  if (p.portfolioName) tags.push(p.portfolioName)
  // unique, max 5
  return [...new Set(tags)].slice(0, 5)
}

function buildShop(sceneMap, boplogProjects) {
  const byId = new Map(boplogProjects.map((p) => [p.id, p]))
  // also index by name for AudioEngine vs audioengine
  const byName = new Map(boplogProjects.map((p) => [String(p.name || '').toLowerCase(), p]))

  const projects = []
  const artifacts = []
  const missing = []

  for (const art of sceneMap.artifacts) {
    const bp =
      byId.get(art.boplogId) ||
      byName.get(String(art.boplogId).toLowerCase()) ||
      byId.get(art.shopId)

    if (!bp) {
      missing.push(art.boplogId)
      // keep prior-shaped stub so the scene still has a slot
      projects.push({
        id: art.shopId,
        title: art.shopId,
        menuName: art.menuName,
        zone: art.zone,
        blurb: `Public project ${art.boplogId} (boplog row missing — re-run sync after boplog refresh).`,
        tags: [art.zone],
        demoUrl: sceneMap.shop.boplogUrl,
        repoUrl: `https://github.com/kvnloo/${art.boplogId}`,
        accent: art.accent,
        boplogId: art.boplogId,
      })
      continue
    }

    const shopProject = {
      id: art.shopId,
      title: bp.displayName || bp.name || art.shopId,
      menuName: art.menuName,
      zone: art.zone,
      blurb: bp.description || '',
      tags: tagsFrom(bp),
      demoUrl: demoUrl(bp),
      repoUrl: githubUrl(bp),
      accent: art.accent,
      boplogId: bp.id,
      date: bp.date,
      company: bp.company,
      portfolio: bp.portfolio,
      portfolioName: bp.portfolioName,
      product: bp.product,
      productName: bp.productName,
      featured: Boolean(bp.featured),
      featuredRank: bp.featuredRank,
    }
    projects.push(shopProject)

    artifacts.push({
      shopId: art.shopId,
      boplogId: bp.id,
      role: art.role,
      zone: art.zone,
      menuName: art.menuName,
      plate: art.plate,
      accent: art.accent,
      // full boplog-parity fields for machine consumers
      project: {
        id: bp.id,
        name: bp.name,
        description: bp.description,
        date: bp.date,
        url: bp.url,
        types: bp.types,
        formats: bp.formats,
        categories: bp.categories,
        links: bp.links,
        company: bp.company,
        companyName: bp.companyName,
        portfolio: bp.portfolio,
        portfolioName: bp.portfolioName,
        product: bp.product,
        productName: bp.productName,
        featured: bp.featured,
        featuredRank: bp.featuredRank,
      },
    })
  }

  return { projects, artifacts, missing }
}

async function main() {
  const sceneMap = JSON.parse(await readFile(SCENE_MAP_PATH, 'utf8'))
  let pack
  const localDir = await resolveBoplogDataDir()
  if (localDir) {
    log(`loading boplog data from ${localDir}`)
    pack = await loadFromDir(localDir)
  } else {
    log(`local boplog data not found; fetching ${LIVE_BOPLOG}`)
    pack = await loadFromLive()
  }

  const { projects, artifacts, missing } = buildShop(sceneMap, pack.projects)
  if (missing.length) log('warning: missing boplog ids:', missing.join(', '))

  const shopData = {
    shopName: sceneMap.shop.shopName,
    tagline: sceneMap.shop.tagline,
    attribution: sceneMap.shop.attribution,
    contact: sceneMap.shop.contact,
    boplogUrl: sceneMap.shop.boplogUrl,
    projects: projects.map(({ plate, role, ...rest }) => {
      // strip non-shop fields that types may not expect — keep boplog metadata optional
      return rest
    }),
  }

  // R3F Project type is subset — extra fields are fine in JSON for panel use
  await writeFile(OUT_PROJECTS, `${JSON.stringify(shopData, null, 2)}\n`, 'utf8')
  await mkdir(path.dirname(OUT_PUBLIC_PROJECTS), { recursive: true })
  await writeFile(OUT_PUBLIC_PROJECTS, `${JSON.stringify(shopData, null, 2)}\n`, 'utf8')

  const shopManifest = {
    generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    source: pack.source,
    boplogGeneratedAt: pack.manifest?.generatedAt || null,
    user: pack.manifest?.user || 'kvnloo',
    surface: 'interactive-portfolio',
    surfaceLabel: sceneMap.shop.shopName,
    surfaceUrl: sceneMap.shop.interactiveUrl,
    parallelTo: {
      kind: 'boplog',
      manifestUrl: 'https://kvnloo.github.io/boplog/data/manifest.json',
      siteUrl: sceneMap.shop.boplogUrl,
      repo: sceneMap.shop.boplogRepo,
      note: 'Same public project information as boplog; this file is the 3D shop artifact index.',
    },
    shop: {
      name: sceneMap.shop.shopName,
      tagline: sceneMap.shop.tagline,
      projectsFile: 'projects.json',
    },
    artifactCount: artifacts.length,
    artifacts,
    hierarchy: pack.hierarchy
      ? { company: pack.hierarchy.company, note: 'Copied reference from boplog hierarchy.json' }
      : null,
  }

  const manifestJson = `${JSON.stringify(shopManifest, null, 2)}\n`
  await writeFile(OUT_MANIFEST, manifestJson, 'utf8')
  await writeFile(OUT_PUBLIC_MANIFEST, manifestJson, 'utf8')
  log(`wrote ${projects.length} shop projects → ${path.relative(ROOT, OUT_PROJECTS)}`)
  log(`wrote shop-manifest (${artifacts.length} artifacts) → ${path.relative(ROOT, OUT_MANIFEST)}`)
  log(`public copies → ${path.relative(ROOT, OUT_PUBLIC_MANIFEST)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
