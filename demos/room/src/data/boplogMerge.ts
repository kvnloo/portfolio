/**
 * Pure merge: boplog project rows + local scene-map → shop menu data.
 * Used at runtime (live fetch) and kept in lockstep with scripts/sync-shop-from-boplog.mjs.
 */
import type { Project, ShopData } from '../types'

export type SceneArtifact = {
  boplogId: string
  shopId: string
  menuName: string
  zone: string
  accent: string
  plate?: string
  role?: string
}

export type SceneMap = {
  shop: {
    shopName: string
    tagline: string
    attribution: string
    contact: ShopData['contact']
    boplogUrl: string
    boplogRepo?: string
    interactiveUrl?: string
  }
  artifacts: SceneArtifact[]
}

export type BoplogProject = {
  id: string
  name?: string
  displayName?: string
  description?: string
  date?: string
  url?: string
  types?: string[]
  formats?: string[]
  categories?: string[]
  links?: { label: string; url: string }[]
  language?: string
  company?: string
  companyName?: string
  portfolio?: string
  portfolioName?: string
  product?: string
  productName?: string
  featured?: boolean
  featuredRank?: number
}

function githubUrl(p: BoplogProject): string {
  const gh = (p.links || []).find(
    (l) => /github/i.test(l.label) || /github\.com/.test(l.url || ''),
  )
  if (gh?.url) return gh.url
  if (p.url?.includes('github.com')) return p.url
  return `https://github.com/kvnloo/${p.name || p.id}`
}

function demoUrl(p: BoplogProject): string {
  const docs = (p.links || []).find((l) => /docs|demo|pages|site/i.test(l.label))
  if (docs?.url) return docs.url
  if (p.url && !p.url.includes('github.com')) return p.url
  return githubUrl(p)
}

function tagsFrom(p: BoplogProject): string[] {
  const tags: string[] = []
  for (const c of p.categories || []) tags.push(String(c))
  for (const t of p.types || []) {
    if (t !== 'public' && t !== 'fork') tags.push(String(t))
  }
  if (p.language) tags.push(p.language)
  if (p.portfolioName) tags.push(p.portfolioName)
  return [...new Set(tags)].slice(0, 5)
}

/** Build ShopData from boplog rows + scene map (presentation-only fields stay local). */
export function buildShopFromBoplog(
  sceneMap: SceneMap,
  boplogProjects: BoplogProject[],
): { shop: ShopData; missing: string[]; plates: Record<string, string> } {
  const byId = new Map(boplogProjects.map((p) => [p.id, p]))
  const byName = new Map(
    boplogProjects.map((p) => [String(p.name || '').toLowerCase(), p]),
  )

  const projects: Project[] = []
  const missing: string[] = []
  const plates: Record<string, string> = {}

  for (const art of sceneMap.artifacts) {
    if (art.plate) plates[art.shopId] = art.plate

    const bp =
      byId.get(art.boplogId) ||
      byName.get(String(art.boplogId).toLowerCase()) ||
      byId.get(art.shopId)

    if (!bp) {
      missing.push(art.boplogId)
      projects.push({
        id: art.shopId,
        title: art.shopId,
        menuName: art.menuName,
        zone: art.zone,
        blurb: `Public project ${art.boplogId} (boplog row unavailable).`,
        tags: [art.zone],
        demoUrl: sceneMap.shop.boplogUrl,
        repoUrl: `https://github.com/kvnloo/${art.boplogId}`,
        accent: art.accent,
        boplogId: art.boplogId,
      })
      continue
    }

    projects.push({
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
    })
  }

  return {
    shop: {
      shopName: sceneMap.shop.shopName,
      tagline: sceneMap.shop.tagline,
      attribution: sceneMap.shop.attribution,
      contact: sceneMap.shop.contact,
      boplogUrl: sceneMap.shop.boplogUrl,
      projects,
    },
    missing,
    plates,
  }
}
