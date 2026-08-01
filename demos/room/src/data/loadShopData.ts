/**
 * Hybrid shop data loader (stale-while-revalidate):
 *  1. Baked snapshot (build-time from boplog) — instant paint, offline-safe
 *  2. Live boplog manifest + year files — upgrades when boplog publishes newer data
 *
 * boplog is the SSOT for project facts; scene-map.json is presentation only.
 * Cache-bust with ?v=generatedAt (same pattern as boplog/app.js).
 */
import baked from './projects.json'
import sceneMapJson from './scene-map.json'
import type { ShopData } from '../types'
import {
  buildShopFromBoplog,
  type BoplogProject,
  type SceneMap,
} from './boplogMerge'

const LIVE_BOPLOG = 'https://kvnloo.github.io/boplog/data'
const sceneMap = sceneMapJson as SceneMap
export const BAKED_SHOP = baked as ShopData

export type ShopDataSource = 'live' | 'baked'

export type ResolvedShop = {
  data: ShopData
  source: ShopDataSource
  boplogGeneratedAt: string | null
  plates: Record<string, string>
}

function platesFromScene(): Record<string, string> {
  const plates: Record<string, string> = {}
  for (const a of sceneMap.artifacts) {
    if (a.plate) plates[a.shopId] = a.plate
  }
  return plates
}

export function bakedResolved(): ResolvedShop {
  return {
    data: BAKED_SHOP,
    source: 'baked',
    boplogGeneratedAt: null,
    plates: platesFromScene(),
  }
}

/** Force baked only: ?boplog=0 or localStorage shop-boplog=0 */
export function preferBakedOnly(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('boplog') === '0' || sp.get('boplog') === 'baked') return true
    if (window.localStorage.getItem('shop-boplog') === '0') return true
  } catch {
    /* ignore */
  }
  return false
}

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error(`${url}: ${r.status}`)
  return r.json() as Promise<T>
}

/**
 * Load live boplog data and merge with scene-map.
 * Throws on network/parse failure — caller keeps baked snapshot.
 */
export async function fetchLiveShop(): Promise<ResolvedShop> {
  type Manifest = {
    generatedAt?: string
    files?: string[]
    hierarchy?: string
  }
  type YearFile = { projects?: BoplogProject[] }

  const manifest = await fetchJson<Manifest>(`${LIVE_BOPLOG}/manifest.json`)
  const files = manifest.files || []
  if (!files.length) throw new Error('boplog manifest has no files')

  const v = manifest.generatedAt || 'live'
  const chunks = await Promise.all(
    files.map((f) => {
      const url = new URL(`${LIVE_BOPLOG}/${f}`)
      url.searchParams.set('v', v)
      return fetchJson<YearFile>(url.toString())
    }),
  )
  const projects = chunks.flatMap((c) => c.projects || [])
  const { shop, plates } = buildShopFromBoplog(sceneMap, projects)
  return {
    data: shop,
    source: 'live',
    boplogGeneratedAt: manifest.generatedAt || null,
    plates: { ...platesFromScene(), ...plates },
  }
}

/**
 * Hybrid resolve: always returns something.
 * Prefer calling with baked first (SWR), then this for the upgrade attempt.
 */
export async function resolveShopData(): Promise<ResolvedShop> {
  if (preferBakedOnly()) return bakedResolved()
  try {
    return await fetchLiveShop()
  } catch (err) {
    console.warn('[shop] live boplog unavailable, using baked snapshot', err)
    return bakedResolved()
  }
}
