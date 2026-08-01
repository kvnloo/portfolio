/**
 * img2threejs form/material pass — RamenBowl (v36 food-PBR: film not lacquer).
 * Reference: public/assets/ramen.jpg + imagine-v2 appetite plate
 *
 * Residual #7 (loop-r31 critic OPEN): broth/egg/noodles glossy plastic mush under
 * warm key — not glaze+food. r35 open milk plate stayed; clearcoat soup → plastic.
 * v36 ONE coherent fix — FOOD FILM ≠ LACQUER (still open milk plate geometry):
 *  - Glaze: ceramic clearcoat only on rim/inner ware (wet rim ≫ dry body)
 *  - Broth: sheen-led milk protein film + fat oil; clearcoat thin (not glass pool)
 *  - Noodles: wet starch sheen + mid roughness (not clearcoat plastic tubes)
 *  - Egg/toppings: membrane sheen, kill glass clearcoat marble under warm key
 * Perf: lathe ≤32, tubes ≤16×5, sparse underlay+nest+arch, no noodle shadows.
 */
import * as THREE from 'three'

export type ProceduralModelOptions = {
  wireframe?: boolean
  castShadow?: boolean
  receiveShadow?: boolean
}

export type ProceduralModelRuntime = {
  nodes: Record<string, THREE.Object3D>
  meshes: Record<string, THREE.Mesh>
  sockets: Record<string, THREE.Object3D>
  colliders: Record<string, unknown>
  destructionGroups: Record<string, THREE.Object3D[]>
}

function phys(
  color: string | number,
  opts: Partial<THREE.MeshPhysicalMaterialParameters> = {},
  wireframe?: boolean,
) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.5,
    metalness: 0,
    wireframe: !!wireframe,
    ...opts,
  })
}

/** Outer ceramic profile: foot → belly flare → thick rim lip. */
function latheOuterBowl(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.15, 0.0),
    new THREE.Vector2(0.19, 0.015),
    new THREE.Vector2(0.23, 0.04),
    new THREE.Vector2(0.3, 0.085),
    new THREE.Vector2(0.365, 0.155),
    new THREE.Vector2(0.405, 0.235),
    new THREE.Vector2(0.418, 0.295),
    new THREE.Vector2(0.422, 0.322),
    // Rim lip — thickness reads in profile
    new THREE.Vector2(0.438, 0.332),
    new THREE.Vector2(0.432, 0.34),
    new THREE.Vector2(0.4, 0.336),
  ]
  return new THREE.LatheGeometry(pts, 32)
}

/** Inner cavity (glazed). */
function latheInnerBowl(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.13, 0.03),
    new THREE.Vector2(0.21, 0.055),
    new THREE.Vector2(0.3, 0.115),
    new THREE.Vector2(0.35, 0.195),
    new THREE.Vector2(0.375, 0.275),
    new THREE.Vector2(0.385, 0.318),
    new THREE.Vector2(0.392, 0.33),
  ]
  return new THREE.LatheGeometry(pts, 32)
}

/**
 * Broth volume: FLUSH milky fill + steep meniscus at glazed wall.
 * v36: pool top ~0.336–0.352 — flush with rim so FOV sees open milk crown + oil
 * (geometry kept; materials = protein film not glass lacquer). Residual #7 food-PBR.
 */
function latheBrothVolume(): THREE.LatheGeometry {
  // v35: surface at rim lip — meniscus beads over inner glaze as milk crown
  const pts = [
    new THREE.Vector2(0.0, 0.292),
    new THREE.Vector2(0.1, 0.294),
    new THREE.Vector2(0.2, 0.3),
    new THREE.Vector2(0.28, 0.312),
    new THREE.Vector2(0.33, 0.328),
    // Meniscus climb against glazed ceramic wall (liquid contact silhouette)
    new THREE.Vector2(0.356, 0.34),
    new THREE.Vector2(0.372, 0.348),
    new THREE.Vector2(0.39, 0.352),
    new THREE.Vector2(0.384, 0.354),
    new THREE.Vector2(0.364, 0.35),
    new THREE.Vector2(0.34, 0.342),
    new THREE.Vector2(0.26, 0.336),
    new THREE.Vector2(0.16, 0.332),
    new THREE.Vector2(0.06, 0.33),
    new THREE.Vector2(0.0, 0.329),
  ]
  return new THREE.LatheGeometry(pts, 28)
}

function seeded(i: number, salt = 0) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Food-PBR canvas maps — wet food under night-kiosk warm key + low IBL (v36).
 * Ceramic: cooler stoneware + iron flecks + wet/dry clearcoat (rim ≫ belly).
 * Broth: cream tonkotsu milk FILM + hard dark fat oil (open pool, not lacquer).
 * Noodle: pale wet starch bands (broth-soaked wheat, mid-rough film not glass).
 */
type FoodPbrMaps = {
  ceramicAlbedo: THREE.CanvasTexture
  ceramicRough: THREE.CanvasTexture
  ceramicClearcoatRough: THREE.CanvasTexture
  brothOilAlbedo: THREE.CanvasTexture
  brothOilRough: THREE.CanvasTexture
  noodleAlbedo: THREE.CanvasTexture
  noodleRough: THREE.CanvasTexture
}

let _foodPbrMaps: FoodPbrMaps | null = null

function makeTex(canvas: HTMLCanvasElement, colorSpace: THREE.ColorSpace, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  tex.colorSpace = colorSpace
  tex.needsUpdate = true
  return tex
}

function getFoodPbrMaps(): FoodPbrMaps {
  if (_foodPbrMaps) return _foodPbrMaps
  const size = 256

  // --- Ceramic stoneware: cooler grey-beige clay (ref) + iron flecks + glaze drip ---
  const cA = document.createElement('canvas')
  cA.width = cA.height = size
  const ca = cA.getContext('2d')!
  // Clay body — cooler stoneware grey-beige (ref ramen.jpg), NOT plastic cream
  // v27: slightly cooler/darker base so warm key doesn't blow shell to cream plastic
  ca.fillStyle = '#8a7e6a'
  ca.fillRect(0, 0, size, size)
  // Soft kiln mottling (cooler ash + warmer clay patches) — high contrast for FOV
  for (let i = 0; i < 64; i++) {
    const x = seeded(i, 200) * size
    const y = seeded(i, 201) * size
    const r = 8 + seeded(i, 202) * 32
    const g = ca.createRadialGradient(x, y, 0, x, y, r)
    const cool = seeded(i, 203) > 0.4
    if (cool) {
      g.addColorStop(0, `rgba(${118 + seeded(i, 204) * 28},${112 + seeded(i, 205) * 24},${98},${0.24 + seeded(i, 206) * 0.2})`)
    } else {
      g.addColorStop(0, `rgba(${168 + seeded(i, 207) * 28},${152 + seeded(i, 208) * 22},${120},${0.2 + seeded(i, 209) * 0.18})`)
    }
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ca.fillStyle = g
    ca.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // Iron oxide flecks (dark — ref stoneware identity; denser for counter FOV)
  for (let i = 0; i < 320; i++) {
    const x = seeded(i, 210) * size
    const y = seeded(i, 211) * size
    const s = 0.55 + seeded(i, 212) * 2.8
    const dark = seeded(i, 213) > 0.55
    ca.fillStyle = dark
      ? `rgba(${18 + seeded(i, 214) * 16},${14 + seeded(i, 215) * 12},${10},0.92)`
      : `rgba(${58 + seeded(i, 216) * 26},${48 + seeded(i, 217) * 20},${32},0.64)`
    ca.beginPath()
    ca.ellipse(x, y, s * (1.2 + seeded(i, 218)), s * (0.5 + seeded(i, 219) * 0.6), seeded(i, 220) * 6, 0, Math.PI * 2)
    ca.fill()
  }
  // Pale glaze pool flecks (wet catch micro-breaks near rim UV)
  for (let i = 0; i < 56; i++) {
    const x = seeded(i, 230) * size
    const y = seeded(i, 231) * size
    const r = 1.5 + seeded(i, 232) * 5.5
    ca.fillStyle = `rgba(248,240,226,${0.22 + seeded(i, 233) * 0.32})`
    ca.beginPath()
    ca.arc(x, y, r, 0, Math.PI * 2)
    ca.fill()
  }

  // Roughness: DRY clay body (bright) + tight wet glaze islands (dark) — hierarchy
  const cR = document.createElement('canvas')
  cR.width = cR.height = size
  const cr = cR.getContext('2d')!
  cr.fillStyle = '#c8c8c8' // v27: drier base clay (plastic kill = uniform mid sheen)
  cr.fillRect(0, 0, size, size)
  for (let i = 0; i < 72; i++) {
    const x = seeded(i, 240) * size
    const y = seeded(i, 241) * size
    const r = 4 + seeded(i, 242) * 18
    const wet = seeded(i, 243) > 0.62 // fewer wet patches on body map
    const g = cr.createRadialGradient(x, y, 0, x, y, r)
    // dark = smoother wet glaze; bright = dry clay grit
    g.addColorStop(0, wet ? 'rgba(12,12,12,0.96)' : 'rgba(250,250,250,0.88)')
    g.addColorStop(1, 'rgba(200,200,200,0)')
    cr.fillStyle = g
    cr.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // Micro grit (dry clay identity)
  for (let i = 0; i < 280; i++) {
    cr.fillStyle = `rgba(255,255,255,${0.12 + seeded(i, 250) * 0.32})`
    cr.fillRect(seeded(i, 251) * size, seeded(i, 252) * size, 1 + seeded(i, 253) * 2, 1)
  }

  // Clearcoat roughness: body DRY (bright); wet drip lanes + pools ONLY near rim
  const cC = document.createElement('canvas')
  cC.width = cC.height = size
  const cc = cC.getContext('2d')!
  cc.fillStyle = '#f0f0f0' // body clearcoat mostly absent (v27 clay hierarchy)
  cc.fillRect(0, 0, size, size)
  // Vertical drip / wet lanes (upper UV = near lip) — denser + darker for warm key
  for (let i = 0; i < 32; i++) {
    const x = seeded(i, 260) * size
    const w = 2.5 + seeded(i, 261) * 9
    const y0 = size * (0.4 + seeded(i, 262) * 0.18)
    const h = size * (0.3 + seeded(i, 263) * 0.45)
    const grad = cc.createLinearGradient(x, y0, x, y0 + h)
    grad.addColorStop(0, 'rgba(20,20,20,0.02)')
    grad.addColorStop(0.22, `rgba(4,4,4,${0.78 + seeded(i, 264) * 0.2})`)
    grad.addColorStop(1, 'rgba(30,30,30,0.03)')
    cc.fillStyle = grad
    cc.fillRect(x - w * 0.5, y0, w, h)
  }
  // Wet pool islands (smooth clearcoat — glaze catch under warm point)
  for (let i = 0; i < 48; i++) {
    const x = seeded(i, 270) * size
    const y = size * (0.48 + seeded(i, 271) * 0.5)
    const r = 3 + seeded(i, 272) * 16
    const g = cc.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(2,2,2,${0.74 + seeded(i, 273) * 0.24})`)
    g.addColorStop(1, 'rgba(230,230,230,0)')
    cc.fillStyle = g
    cc.fillRect(x - r, y - r, r * 2, r * 2)
  }

  // --- Broth: cream tonkotsu milk FILM + HARD dark fat oil (v36 open pool) ---
  // r31: clearcoat soup = plastic mush. Ref = creamy pool + oil, protein film not glass.
  const bA = document.createElement('canvas')
  bA.width = bA.height = size
  const ba = bA.getContext('2d')!
  // v36: slightly warmer ivory milk (less blown white plastic under warm key)
  ba.fillStyle = '#ebe2c8'
  ba.fillRect(0, 0, size, size)
  // Soft milk density (cool ivory islands — tonkotsu protein body)
  for (let i = 0; i < 48; i++) {
    const x = seeded(i, 300) * size
    const y = seeded(i, 301) * size
    const r = 18 + seeded(i, 302) * 56
    const g = ba.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(248,242,228,${0.48 + seeded(i, 303) * 0.28})`)
    g.addColorStop(1, 'rgba(220,208,178,0)')
    ba.fillStyle = g
    ba.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // Soft warm depth pockets (subtle — liquid depth, not amber mush)
  for (let i = 0; i < 20; i++) {
    const x = seeded(i, 305) * size
    const y = seeded(i, 306) * size
    const r = 12 + seeded(i, 307) * 40
    const g = ba.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(190,160,100,${0.12 + seeded(i, 308) * 0.14})`)
    g.addColorStop(1, 'rgba(210,190,150,0)')
    ba.fillStyle = g
    ba.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // Fat oil blooms — PRIMARY liquid craft cue (near-black cores vs cream milk)
  // v36: hard fat contrast sells liquid without clearcoat chrome
  for (let i = 0; i < 80; i++) {
    const x = seeded(i, 310) * size
    const y = seeded(i, 311) * size
    const rx = 7 + seeded(i, 312) * 32
    const ry = 3 + seeded(i, 313) * 16
    ba.save()
    ba.translate(x, y)
    ba.rotate(seeded(i, 314) * Math.PI * 2)
    const g = ba.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry))
    const a = 0.82 + seeded(i, 315) * 0.18
    g.addColorStop(0, `rgba(${8 + seeded(i, 316) * 10},${3 + seeded(i, 317) * 5},${0},${a})`)
    g.addColorStop(0.28, `rgba(42,20,2,${a * 0.78})`)
    g.addColorStop(1, 'rgba(180,160,110,0)')
    ba.fillStyle = g
    ba.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry))
    ba.beginPath()
    ba.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2)
    ba.fill()
    ba.restore()
  }
  // Thin oil swirls (readable fat streaks on cream milk — liquid motion cue)
  for (let i = 0; i < 40; i++) {
    const x = seeded(i, 320) * size
    const y = seeded(i, 321) * size
    ba.strokeStyle = `rgba(16,5,0,${0.55 + seeded(i, 322) * 0.38})`
    ba.lineWidth = 2 + seeded(i, 323) * 4
    ba.beginPath()
    ba.ellipse(x, y, 14 + seeded(i, 324) * 36, 4 + seeded(i, 325) * 14, seeded(i, 326) * 6, 0, Math.PI * 1.45)
    ba.stroke()
  }

  // Broth roughness: milk protein FILM (mid) + smoother oil islands only
  // v36: brighter milk body = more grit under warm key (kill uniform plastic sheen)
  const bR = document.createElement('canvas')
  bR.width = bR.height = size
  const br = bR.getContext('2d')!
  br.fillStyle = '#a8a8a8' // protein film mid-rough (not glass-dark liquid chrome)
  br.fillRect(0, 0, size, size)
  for (let i = 0; i < 48; i++) {
    const x = seeded(i, 330) * size
    const y = seeded(i, 331) * size
    const r = 8 + seeded(i, 332) * 28
    const g = br.createRadialGradient(x, y, 0, x, y, r)
    // oil patches smoother (dark) — fat film only, not whole pool chrome
    g.addColorStop(0, `rgba(28,28,28,${0.5 + seeded(i, 333) * 0.35})`)
    g.addColorStop(1, 'rgba(168,168,168,0)')
    br.fillStyle = g
    br.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // Milk micro-rough breaks (protein film grit — kills uniform plastic sheet)
  for (let i = 0; i < 110; i++) {
    br.fillStyle = `rgba(235,235,235,${0.28 + seeded(i, 334) * 0.38})`
    br.fillRect(seeded(i, 335) * size, seeded(i, 336) * size, 2 + seeded(i, 337) * 6, 1 + seeded(i, 338) * 4)
  }

  // --- Noodle wheat: pale WET starch film IN cream milk (v36 mid-rough, not glass) ---
  // r31 plastic mush: low-rough + clearcoat tubes. Ref = soft pale wet coils.
  const nA = document.createElement('canvas')
  nA.width = nA.height = size
  const na = nA.getContext('2d')!
  // v36: milk-stained pale wheat — not dry gold, not blown white plastic
  na.fillStyle = '#e8d8a0'
  na.fillRect(0, 0, size, size)
  // Along-strand color bands — broth-soaked wet vs pale starch (soft, not rope)
  for (let i = 0; i < 96; i++) {
    const y = seeded(i, 350) * size
    const h = 1.4 + seeded(i, 351) * 7
    const wet = seeded(i, 352) > 0.35
    na.fillStyle = wet
      ? `rgba(${190 + seeded(i, 353) * 28},${160 + seeded(i, 354) * 24},${90},${0.18 + seeded(i, 355) * 0.2})`
      : `rgba(248,236,200,${0.35 + seeded(i, 356) * 0.32})`
    na.fillRect(0, y, size, h)
  }
  // Broth soak freckles (cream milk stain — wet food identity)
  for (let i = 0; i < 140; i++) {
    na.fillStyle = `rgba(240,228,190,${0.16 + seeded(i, 360) * 0.26})`
    na.fillRect(seeded(i, 361) * size, seeded(i, 362) * size, 1 + seeded(i, 363) * 2, 1)
  }
  // Soft wet troughs (strand edges soaked in milk — subtle, not dark rope)
  for (let i = 0; i < 24; i++) {
    const y = seeded(i, 364) * size
    na.fillStyle = `rgba(180,148,70,${0.1 + seeded(i, 365) * 0.12})`
    na.fillRect(0, y, size, 1 + seeded(i, 366) * 2)
  }

  const nR = document.createElement('canvas')
  nR.width = nR.height = size
  const nr = nR.getContext('2d')!
  // v36: mid-rough base (brighter) — starch film, not glass-dark clearcoat tube
  nr.fillStyle = '#9a9a9a'
  nr.fillRect(0, 0, size, size)
  // Wet patches along strand (darker = smoother film only, sparse)
  for (let i = 0; i < 40; i++) {
    const y = seeded(i, 370) * size
    const h = 2 + seeded(i, 371) * 12
    nr.fillStyle = `rgba(40,40,40,${0.35 + seeded(i, 372) * 0.3})`
    nr.fillRect(0, y, size, h)
  }
  // Dry starch grit (bright) — breaks plastic uniform sheen under warm key
  for (let i = 0; i < 48; i++) {
    const y = seeded(i, 380) * size
    nr.fillStyle = `rgba(230,230,230,${0.32 + seeded(i, 381) * 0.35})`
    nr.fillRect(0, y, size, 1.5 + seeded(i, 382) * 4)
  }

  _foodPbrMaps = {
    ceramicAlbedo: makeTex(cA, THREE.SRGBColorSpace, 2.4, 1.6),
    ceramicRough: makeTex(cR, THREE.NoColorSpace, 2.4, 1.6),
    ceramicClearcoatRough: makeTex(cC, THREE.NoColorSpace, 2.4, 1.6),
    brothOilAlbedo: makeTex(bA, THREE.SRGBColorSpace, 1.2, 1.2),
    brothOilRough: makeTex(bR, THREE.NoColorSpace, 1.2, 1.2),
    noodleAlbedo: makeTex(nA, THREE.SRGBColorSpace, 1.8, 4.5),
    noodleRough: makeTex(nR, THREE.NoColorSpace, 1.8, 4.5),
  }
  return _foodPbrMaps
}

export function createRamenBowlModel(options: ProceduralModelOptions = {}): THREE.Group {
  const cast = options.castShadow ?? true
  const recv = options.receiveShadow ?? true
  const w = options.wireframe
  const foodMaps = getFoodPbrMaps()

  const root = new THREE.Group()
  root.name = 'RamenBowl'
  root.userData.img2threejs = {
    skill: 'img2threejs@1.5.x',
    source: 'demos/room/public/assets/ramen.jpg',
    pass: 'form+material-v36-food-film-not-lacquer',
  }

  const nodes: Record<string, THREE.Object3D> = { root }
  const meshes: Record<string, THREE.Mesh> = {}
  const sockets: Record<string, THREE.Object3D> = {}
  const colliders: Record<string, unknown> = {}
  const destructionGroups: Record<string, THREE.Object3D[]> = {}

  // --- Materials (residual #7 v36: food FILM not lacquer — glaze + milk + starch) ---
  // CLAY STONEWARE body — cooler grey-beige (ref) + iron flecks + wet/dry clearcoat maps.
  // Clearcoat is CERAMIC only (rim ≫ belly). Food uses sheen/roughness, not glass lacquer.
  // color multiplies map — keep mid so ceramicAlbedo drives stoneware
  const ceramic = phys(0xb8ac98, {
    map: foodMaps.ceramicAlbedo,
    roughness: 0.9,
    roughnessMap: foodMaps.ceramicRough,
    clearcoat: 0.02,
    clearcoatRoughness: 0.82,
    clearcoatRoughnessMap: foodMaps.ceramicClearcoatRough,
    envMapIntensity: 0.1,
    sheen: 0.02,
    sheenRoughness: 0.92,
    sheenColor: new THREE.Color(0x887860),
    metalness: 0.0,
    specularIntensity: 0.05,
    specularColor: new THREE.Color(0xb0a490),
  }, w)

  // Rim lip — wet STONEWARE glaze (clearcoat OK here — ceramic hierarchy).
  // v36: slightly rougher so rim glaze ≠ plastic cream under warm key.
  const ceramicRim = phys(0xa89878, {
    roughness: 0.22,
    clearcoat: 0.72,
    clearcoatRoughness: 0.14,
    envMapIntensity: 0.34,
    sheen: 0.08,
    sheenColor: new THREE.Color(0xb8a888),
    sheenRoughness: 0.3,
    metalness: 0.0,
    specularIntensity: 0.36,
    specularColor: new THREE.Color(0xb8a070),
  }, w)

  // Wet glaze ring crown — soft specular catch (taupe, NOT white albedo ring)
  const ceramicGlazeRing = phys(0xa09070, {
    roughness: 0.18,
    clearcoat: 0.76,
    clearcoatRoughness: 0.12,
    envMapIntensity: 0.36,
    metalness: 0.0,
    specularIntensity: 0.4,
    specularColor: new THREE.Color(0xb09870),
    sheen: 0.06,
    sheenColor: new THREE.Color(0xb0a080),
    sheenRoughness: 0.28,
  }, w)

  // Inner cavity: wet glazed ware under milk (filled ware, not empty shell).
  // Warm dark glaze so milk meniscus edge reads against cream pool.
  const ceramicInner = phys(0x4a3a28, {
    map: foodMaps.ceramicAlbedo,
    roughness: 0.16,
    roughnessMap: foodMaps.ceramicRough,
    clearcoat: 0.78,
    clearcoatRoughness: 0.1,
    clearcoatRoughnessMap: foodMaps.ceramicClearcoatRough,
    envMapIntensity: 0.36,
    sheen: 0.06,
    sheenColor: new THREE.Color(0x6a5a40),
    specularIntensity: 0.48,
    metalness: 0.0,
  }, w)

  // Cobalt rim bands (ref dual blue lines — under-glaze paint, not metal tape)
  const ceramicBlue = phys(0x051018, {
    roughness: 0.18,
    clearcoat: 0.82,
    clearcoatRoughness: 0.08,
    metalness: 0.0,
    envMapIntensity: 0.55,
    sheen: 0.18,
    sheenColor: new THREE.Color(0x2a7090),
    specularIntensity: 0.58,
  }, w)

  // Tonkotsu MILK — OPAQUE cream protein FILM + oil maps (r31 plastic-mush residual).
  // Ref: creamy pool + soft oil. v36: sheen-led milk film, thin clearcoat (not glass lacquer).
  // Warm-key plastic kill: mid roughness + low env + oil map contrast owns liquid read.
  const broth = phys(0xebe2c8, {
    map: foodMaps.brothOilAlbedo,
    roughness: 0.38,
    roughnessMap: foodMaps.brothOilRough,
    metalness: 0.0,
    transparent: false,
    opacity: 1.0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.42,
    envMapIntensity: 0.14,
    sheen: 0.85,
    sheenColor: new THREE.Color(0xf4ead0),
    sheenRoughness: 0.38,
    specularIntensity: 0.28,
    specularColor: new THREE.Color(0xf0e6d0),
  }, w)

  // Tonkotsu fat oil — thin near-black amber film (readable fat blooms on cream milk)
  // ONLY food layer that may keep modest clearcoat (fat sheen) — still not chrome
  const oilFilm = phys(0x160c00, {
    map: foodMaps.brothOilAlbedo,
    roughness: 0.22,
    roughnessMap: foodMaps.brothOilRough,
    metalness: 0.0,
    transparent: true,
    opacity: 0.86,
    clearcoat: 0.22,
    clearcoatRoughness: 0.28,
    envMapIntensity: 0.18,
    specularIntensity: 0.42,
    specularColor: new THREE.Color(0x6a4008),
    sheen: 0.72,
    sheenColor: new THREE.Color(0x5a3004),
    sheenRoughness: 0.28,
  }, w)

  // Wheat noodles — pale WET starch floating IN cream milk (ref soft coils).
  // FOOD PBR v36: mid-rough starch + sheen film; clearcoat near-zero (kill plastic tubes).
  // r31 glossy mush: clearcoat + low rough under warm key. Wet = sheen, not lacquer.
  const noodle = phys(0xe8d8a0, {
    map: foodMaps.noodleAlbedo,
    roughness: 0.42,
    roughnessMap: foodMaps.noodleRough,
    sheen: 0.72,
    sheenColor: new THREE.Color(0xf0e0b0),
    sheenRoughness: 0.4,
    clearcoat: 0.04,
    clearcoatRoughness: 0.55,
    envMapIntensity: 0.12,
    metalness: 0.0,
    specularIntensity: 0.22,
    specularColor: new THREE.Color(0xf0e4b8),
  }, w)
  // Shadowed under-coil — broth-stained deeper wheat (still wet film, not dry stick)
  const noodleDeep = phys(0xc4a858, {
    map: foodMaps.noodleAlbedo,
    roughness: 0.52,
    roughnessMap: foodMaps.noodleRough,
    sheen: 0.48,
    sheenColor: new THREE.Color(0xd0b868),
    sheenRoughness: 0.48,
    clearcoat: 0.02,
    clearcoatRoughness: 0.62,
    envMapIntensity: 0.08,
    metalness: 0.0,
    specularIntensity: 0.14,
  }, w)
  // Broth-soaked strand — wet starch FILM (sheen primary; no glass clearcoat)
  const noodleWet = phys(0xecdcb0, {
    map: foodMaps.noodleAlbedo,
    roughness: 0.32,
    roughnessMap: foodMaps.noodleRough,
    clearcoat: 0.06,
    clearcoatRoughness: 0.48,
    sheen: 0.88,
    sheenColor: new THREE.Color(0xf4e8c0),
    sheenRoughness: 0.32,
    envMapIntensity: 0.14,
    metalness: 0.0,
    specularIntensity: 0.28,
    specularColor: new THREE.Color(0xf2e8c0),
  }, w)

  // Ajitsuke egg white — firm ivory protein (soft food, not tan plastic dome)
  // v36: higher roughness + near-zero clearcoat so egg ≠ glass blob under warm key
  const eggWhite = phys(0xe8dece, {
    roughness: 0.58,
    clearcoat: 0.04,
    clearcoatRoughness: 0.55,
    sheen: 0.32,
    sheenColor: new THREE.Color(0xf0e6d8),
    sheenRoughness: 0.62,
    envMapIntensity: 0.12,
    metalness: 0.0,
    specularIntensity: 0.14,
  }, w)

  // Soft yolk — wet jam membrane (saturated orange, NO glass clearcoat marble)
  // r31 plastic mush: clearcoat 0.48 + low rough = plastic sphere under warm key.
  // v36: food membrane — mid roughness, thin clearcoat, sheen-led wetness.
  const eggYolk = phys(0xe84810, {
    roughness: 0.28,
    clearcoat: 0.14,
    clearcoatRoughness: 0.32,
    sheen: 0.78,
    sheenColor: new THREE.Color(0xf07018),
    sheenRoughness: 0.28,
    envMapIntensity: 0.2,
    metalness: 0.0,
    specularIntensity: 0.32,
    specularColor: new THREE.Color(0xf0a040),
  }, w)

  // Yolk center — deeper jammy core (dual-tone kills single-color toy yolk)
  const eggYolkCore = phys(0x981808, {
    roughness: 0.34,
    clearcoat: 0.1,
    clearcoatRoughness: 0.36,
    sheen: 0.68,
    sheenColor: new THREE.Color(0xc03010),
    sheenRoughness: 0.32,
    envMapIntensity: 0.16,
    specularIntensity: 0.28,
  }, w)

  // Roasted nori — matte dark paper with green sheen (silhouette must clear rim)
  const nori = phys(0x06120e, {
    roughness: 0.8,
    metalness: 0.0,
    sheen: 0.72,
    sheenRoughness: 0.42,
    sheenColor: new THREE.Color(0x3a7850),
    clearcoat: 0.12,
    clearcoatRoughness: 0.55,
    envMapIntensity: 0.38,
    specularIntensity: 0.28,
  }, w)

  // Nori edge — dry paper catch + wet sheen (torn lip, not smooth torus blob)
  const noriEdgeMat = phys(0x1c3e2a, {
    roughness: 0.32,
    clearcoat: 0.48,
    clearcoatRoughness: 0.2,
    sheen: 0.68,
    sheenRoughness: 0.28,
    sheenColor: new THREE.Color(0x5a9870),
    envMapIntensity: 0.55,
    specularIntensity: 0.52,
  }, w)

  // Fresh scallion — natural cut vegetable green (pop vs cream milk, not neon plastic)
  // v36: mid-rough cut veg + sheen film (kill plastic green rings under warm key)
  const onion = phys(0x28a81e, {
    roughness: 0.38,
    clearcoat: 0.08,
    clearcoatRoughness: 0.42,
    sheen: 0.55,
    sheenColor: new THREE.Color(0x3cc030),
    envMapIntensity: 0.16,
    specularIntensity: 0.24,
  }, w)

  const onionWhite = phys(0xe8f0e0, {
    roughness: 0.4,
    clearcoat: 0.06,
    clearcoatRoughness: 0.45,
    sheen: 0.28,
    sheenColor: new THREE.Color(0xf0f6ea),
    specularIntensity: 0.18,
  }, w)

  // Chashu: fatty pork with soy glaze film (v36: food fat film, not glass pink disc)
  // r31 plastic mush: high clearcoat fat under warm key → toy pork.
  const chashuFat = phys(0xd8b090, {
    roughness: 0.32,
    clearcoat: 0.12,
    clearcoatRoughness: 0.36,
    sheen: 0.55,
    sheenColor: new THREE.Color(0xe8c8a8),
    envMapIntensity: 0.18,
    metalness: 0.0,
    specularIntensity: 0.28,
    specularColor: new THREE.Color(0xf0d0b0),
  }, w)

  const chashuMeat = phys(0x3a120e, {
    roughness: 0.52,
    clearcoat: 0.08,
    clearcoatRoughness: 0.42,
    sheen: 0.22,
    sheenColor: new THREE.Color(0x802418),
    envMapIntensity: 0.16,
    specularIntensity: 0.18,
  }, w)

  // Seared chashu crust — caramelized edge ring (food identity)
  const chashuSear = phys(0x2a100c, {
    roughness: 0.62,
    clearcoat: 0.06,
    clearcoatRoughness: 0.48,
    sheen: 0.16,
    sheenColor: new THREE.Color(0x6a2818),
    envMapIntensity: 0.12,
  }, w)

  const wood = phys(0xb89068, {
    roughness: 0.48,
    clearcoat: 0.18,
    sheen: 0.12,
    sheenColor: new THREE.Color(0xd8b888),
  }, w)

  const woodTip = phys(0xb03020, {
    roughness: 0.34,
    clearcoat: 0.28,
    metalness: 0.02,
  }, w)

  const seedWhite = phys(0xf0ece0, { roughness: 0.55, clearcoat: 0.12 }, w)
  const seedBlack = phys(0x1a1410, { roughness: 0.68 }, w)

  // Chili oil flecks — saturated red disc flecks (flat, not sphere blobs), NO emissive
  const chili = phys(0xa8120c, {
    roughness: 0.48,
    clearcoat: 0.08,
    clearcoatRoughness: 0.42,
    envMapIntensity: 0.14,
    sheen: 0.32,
    sheenColor: new THREE.Color(0xd02818),
  }, w)

  // --- Bowl shell ---
  const outer = new THREE.Mesh(latheOuterBowl(), ceramic)
  outer.name = 'bowl_outer'
  outer.castShadow = cast
  outer.receiveShadow = recv
  root.add(outer)
  meshes.bowl_outer = outer

  const inner = new THREE.Mesh(latheInnerBowl(), ceramicInner)
  inner.name = 'bowl_inner'
  inner.scale.x = -1
  inner.receiveShadow = recv
  root.add(inner)
  meshes.bowl_inner = inner

  // Rim bead — thickness from above (wet stoneware lip — primary specular catch)
  // v31: thinner tube so cream lip doesn't fill FOV as empty white shell
  const rimBead = new THREE.Mesh(
    new THREE.TorusGeometry(0.414, 0.014, 12, 64),
    ceramicRim,
  )
  rimBead.name = 'rim_bead'
  rimBead.rotation.x = Math.PI / 2
  rimBead.position.y = 0.334
  rimBead.castShadow = cast
  root.add(rimBead)
  meshes.rim_bead = rimBead

  // Wet glaze ring crown — soft clearcoat catch on lip (stoneware, not white shell)
  const glazeRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.01, 10, 64),
    ceramicGlazeRing,
  )
  glazeRing.name = 'glaze_ring'
  glazeRing.rotation.x = Math.PI / 2
  glazeRing.position.y = 0.341
  root.add(glazeRing)
  meshes.glaze_ring = glazeRing

  // Inner glaze pool — wet ceramic just below lip (specular band vs dry body)
  const glazeInner = new THREE.Mesh(
    new THREE.TorusGeometry(0.388, 0.007, 8, 56),
    ceramicGlazeRing,
  )
  glazeInner.name = 'glaze_inner_band'
  glazeInner.rotation.x = Math.PI / 2
  glazeInner.position.y = 0.328
  root.add(glazeInner)

  // Deep inner wet glaze wall band — filled ware response under milk (r27 #9)
  // Sells interior ceramic clearcoat so bowl is not exterior-only empty shell.
  const glazeInnerWall = new THREE.Mesh(
    new THREE.TorusGeometry(0.37, 0.016, 10, 48),
    phys(0x3a2e20, {
      map: foodMaps.ceramicAlbedo,
      roughness: 0.14,
      roughnessMap: foodMaps.ceramicRough,
      clearcoat: 0.88,
      clearcoatRoughness: 0.08,
      clearcoatRoughnessMap: foodMaps.ceramicClearcoatRough,
      envMapIntensity: 0.48,
      metalness: 0.0,
      specularIntensity: 0.58,
      specularColor: new THREE.Color(0x8a7050),
    }, w),
  )
  glazeInnerWall.name = 'glaze_inner_wall'
  glazeInnerWall.rotation.x = Math.PI / 2
  glazeInnerWall.position.y = 0.3
  root.add(glazeInnerWall)

  // Side-wall glaze sheen strip — wet catch near lip only (not chrome body shell)
  // v31: taupe stoneware glaze so rim stack doesn't own empty-shell white read
  const glazeSide = new THREE.Mesh(
    new THREE.TorusGeometry(0.412, 0.012, 10, 56),
    phys(0xa89878, {
      map: foodMaps.ceramicAlbedo,
      roughness: 0.32,
      roughnessMap: foodMaps.ceramicRough,
      clearcoat: 0.48,
      clearcoatRoughness: 0.24,
      clearcoatRoughnessMap: foodMaps.ceramicClearcoatRough,
      envMapIntensity: 0.28,
      metalness: 0.0,
      specularIntensity: 0.28,
      specularColor: new THREE.Color(0xb0a080),
    }, w),
  )
  glazeSide.name = 'glaze_side'
  glazeSide.rotation.x = Math.PI / 2
  glazeSide.position.y = 0.278
  root.add(glazeSide)

  // Second side glaze band — mid-belly soft catch under warm key (clay-leaning)
  const glazeSideMid = new THREE.Mesh(
    new THREE.TorusGeometry(0.382, 0.01, 10, 48),
    phys(0xc8bca8, {
      map: foodMaps.ceramicAlbedo,
      roughness: 0.62,
      roughnessMap: foodMaps.ceramicRough,
      clearcoat: 0.1,
      clearcoatRoughness: 0.5,
      clearcoatRoughnessMap: foodMaps.ceramicClearcoatRough,
      envMapIntensity: 0.2,
      metalness: 0.0,
      specularIntensity: 0.14,
      specularColor: new THREE.Color(0xffe8d4),
    }, w),
  )
  glazeSideMid.name = 'glaze_side_mid'
  glazeSideMid.rotation.x = Math.PI / 2
  glazeSideMid.position.y = 0.195
  root.add(glazeSideMid)

  // Lower belly glaze arc — drier clay catch (roughness hierarchy vs rim)
  const glazeSideLow = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.009, 8, 48),
    phys(0xb0a490, {
      map: foodMaps.ceramicAlbedo,
      roughness: 0.78,
      roughnessMap: foodMaps.ceramicRough,
      clearcoat: 0.04,
      clearcoatRoughness: 0.65,
      envMapIntensity: 0.12,
      metalness: 0.0,
      specularIntensity: 0.06,
      specularColor: new THREE.Color(0xffe0c8),
    }, w),
  )
  glazeSideLow.name = 'glaze_side_low'
  glazeSideLow.rotation.x = Math.PI / 2
  glazeSideLow.position.y = 0.12
  root.add(glazeSideLow)

  // Specular wet-film patches — thin discs (not sphere greebles = plastic blobs)
  // Bias wetter films toward upper wall; taupe not cream so no white plastic spots
  for (let i = 0; i < 14; i++) {
    const wet = seeded(i, 91)
    const upper = seeded(i, 96) > 0.22
    const spot = new THREE.Mesh(
      new THREE.CircleGeometry(0.01 + seeded(i, 90) * 0.02, 10),
      phys(0xc8b898, {
        roughness: upper ? 0.12 + wet * 0.12 : 0.5 + wet * 0.32,
        clearcoat: upper ? 0.5 + wet * 0.2 : 0.04 + wet * 0.08,
        clearcoatRoughness: upper ? 0.08 + (1 - wet) * 0.1 : 0.36 + (1 - wet) * 0.28,
        transparent: true,
        opacity: upper ? 0.2 + wet * 0.24 : 0.05 + wet * 0.06,
        metalness: 0.0,
        envMapIntensity: upper ? 0.35 + wet * 0.2 : 0.08 + wet * 0.06,
        specularIntensity: upper ? 0.35 + wet * 0.2 : 0.05 + wet * 0.06,
        specularColor: new THREE.Color(0xd0c0a0),
        side: THREE.DoubleSide,
      }, w),
    )
    const a = 0.2 + seeded(i, 92) * 2.5
    const y = upper ? 0.2 + seeded(i, 93) * 0.12 : 0.05 + seeded(i, 93) * 0.14
    const r = 0.235 + y * 0.56
    // Orient disc tangent to outer lathe wall (outward normal)
    spot.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
    spot.lookAt(0, y, 0)
    spot.rotateY(Math.PI)
    spot.scale.set(1.5 + seeded(i, 94) * 0.7, 0.75 + seeded(i, 95) * 0.45, 1)
    root.add(spot)
  }

  // Undercut rim shadow — soft cream shade (not dark gray plastic band)
  const rimShadow = new THREE.Mesh(
    new THREE.TorusGeometry(0.41, 0.009, 8, 48),
    phys(0x8a8072, {
      roughness: 0.62,
      clearcoat: 0.18,
      clearcoatRoughness: 0.42,
      envMapIntensity: 0.28,
    }, w),
  )
  rimShadow.name = 'rim_shadow'
  rimShadow.rotation.x = Math.PI / 2
  rimShadow.position.y = 0.318
  root.add(rimShadow)

  // Dual blue bands on INNER rim (ref identity: two cobalt rings near lip)
  const bandInnerA = new THREE.Mesh(
    new THREE.TorusGeometry(0.378, 0.013, 8, 56),
    ceramicBlue,
  )
  bandInnerA.name = 'band_blue_inner_a'
  bandInnerA.rotation.x = Math.PI / 2
  bandInnerA.position.y = 0.314
  root.add(bandInnerA)

  const bandInnerB = new THREE.Mesh(
    new THREE.TorusGeometry(0.366, 0.011, 8, 56),
    ceramicBlue,
  )
  bandInnerB.name = 'band_blue_inner_b'
  bandInnerB.rotation.x = Math.PI / 2
  bandInnerB.position.y = 0.295
  root.add(bandInnerB)

  // Outer lip band — must hug ceramic (r≈0.425 at y=0.33); thick for side FOV
  const bandOuterLip = new THREE.Mesh(
    new THREE.TorusGeometry(0.432, 0.013, 8, 56),
    ceramicBlue,
  )
  bandOuterLip.name = 'band_blue_outer_lip'
  bandOuterLip.rotation.x = Math.PI / 2
  bandOuterLip.position.y = 0.329
  root.add(bandOuterLip)

  // Outer mid-body band — hug lathe at y≈0.12 (r≈0.335)
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.338, 0.012, 10, 56),
    ceramicBlue,
  )
  band.name = 'band_blue'
  band.rotation.x = Math.PI / 2
  band.position.y = 0.12
  root.add(band)

  // Small body motif fleck (ref brush stroke)
  const motif = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 8, 6),
    ceramicBlue,
  )
  motif.name = 'band_motif'
  motif.scale.set(1.4, 0.35, 0.9)
  motif.position.set(0.34, 0.2, 0.05)
  root.add(motif)

  // Foot ring — drier stoneware foot (material contrast vs wet rim glaze)
  const foot = new THREE.Mesh(
    new THREE.TorusGeometry(0.175, 0.012, 8, 40),
    phys(0xa09080, {
      roughness: 0.68,
      clearcoat: 0.12,
      clearcoatRoughness: 0.48,
      envMapIntensity: 0.28,
    }, w),
  )
  foot.name = 'foot_ring'
  foot.rotation.x = Math.PI / 2
  foot.position.y = 0.012
  root.add(foot)

  // Iron speckles — ref stoneware flecks (break plastic shell albedo under warm key)
  const fleckMat = phys(0x5a5044, { roughness: 0.78, clearcoat: 0.06 }, w)
  const fleckMatDark = phys(0x2a241c, { roughness: 0.9, clearcoat: 0.02 }, w)
  // v31: taupe flecks (not cream-white) so shell doesn't sparkle empty
  const fleckMatLight = phys(0xc8bca8, {
    roughness: 0.32,
    clearcoat: 0.42,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.4,
    specularIntensity: 0.32,
  }, w)
  for (let i = 0; i < 96; i++) {
    const fleck = new THREE.Mesh(
      new THREE.SphereGeometry(0.004 + seeded(i) * 0.008, 4, 3),
      i % 5 === 0 ? fleckMatLight : i % 3 === 0 ? fleckMatDark : fleckMat,
    )
    const a = seeded(i, 1) * Math.PI * 2
    const y = 0.03 + seeded(i, 2) * 0.28
    // Place ON outer surface: r grows with height (foot→rim flare)
    const r = 0.235 + y * 0.56 + seeded(i, 3) * 0.018
    fleck.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
    fleck.scale.set(1.55, 0.26, 1.95)
    root.add(fleck)
  }

  // --- Broth volume + meniscus ---
  const brothMesh = new THREE.Mesh(latheBrothVolume(), broth)
  brothMesh.name = 'broth'
  brothMesh.castShadow = false
  brothMesh.receiveShadow = recv
  root.add(brothMesh)
  meshes.broth = brothMesh

  // Specular liquid plane — cream tonkotsu milk FILM + oil (v36 food film not lacquer).
  // FLUSH with rim so counter FOV sees milk pool crown (not dry noodle mass).
  // Wet protein film: sheen-led + mid roughness (kill glass clearcoat plastic pool).
  const surfaceDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.385, 48),
    phys(0xebe2c8, {
      map: foodMaps.brothOilAlbedo,
      roughness: 0.36,
      roughnessMap: foodMaps.brothOilRough,
      metalness: 0.0,
      transparent: false,
      opacity: 1.0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.45,
      envMapIntensity: 0.14,
      sheen: 0.88,
      sheenColor: new THREE.Color(0xf4ead0),
      sheenRoughness: 0.36,
      specularIntensity: 0.28,
      specularColor: new THREE.Color(0xf0e6d0),
    }, w),
  )
  surfaceDisc.name = 'broth_surface'
  surfaceDisc.rotation.x = -Math.PI / 2
  surfaceDisc.position.y = 0.336
  root.add(surfaceDisc)
  meshes.broth_surface = surfaceDisc

  // Thin oil film veil — secondary fat catch (fat film, not mirror glass)
  const oilSpecFilm = new THREE.Mesh(
    new THREE.CircleGeometry(0.36, 36),
    phys(0x241200, {
      map: foodMaps.brothOilAlbedo,
      roughness: 0.24,
      roughnessMap: foodMaps.brothOilRough,
      metalness: 0.0,
      transparent: true,
      opacity: 0.52,
      clearcoat: 0.18,
      clearcoatRoughness: 0.32,
      envMapIntensity: 0.16,
      sheen: 0.72,
      sheenColor: new THREE.Color(0x5a3004),
      sheenRoughness: 0.28,
      specularIntensity: 0.38,
      specularColor: new THREE.Color(0x6a4008),
      side: THREE.DoubleSide,
    }, w),
  )
  oilSpecFilm.name = 'broth_oil_spec'
  oilSpecFilm.rotation.x = -Math.PI / 2
  oilSpecFilm.position.y = 0.337
  root.add(oilSpecFilm)

  // Surface meniscus ring (wet milk climb at ceramic wall — liquid contact silhouette)
  // v36: protein film meniscus (sheen), not plastic cream glass torus under warm key
  const meniscus = new THREE.Mesh(
    new THREE.TorusGeometry(0.386, 0.04, 12, 48),
    phys(0xe6dcc0, {
      map: foodMaps.brothOilAlbedo,
      roughness: 0.34,
      roughnessMap: foodMaps.brothOilRough,
      metalness: 0.0,
      transparent: true,
      opacity: 0.96,
      clearcoat: 0.1,
      clearcoatRoughness: 0.42,
      envMapIntensity: 0.14,
      sheen: 0.85,
      sheenColor: new THREE.Color(0xf0e6d0),
      sheenRoughness: 0.36,
      specularIntensity: 0.28,
    }, w),
  )
  meniscus.name = 'meniscus'
  meniscus.rotation.x = Math.PI / 2
  meniscus.position.y = 0.344
  root.add(meniscus)
  meshes.meniscus = meniscus

  // Inner meniscus fillet — second ring sells liquid climb against glazed wall
  const meniscusInner = new THREE.Mesh(
    new THREE.TorusGeometry(0.358, 0.028, 10, 40),
    phys(0xe2d8bc, {
      map: foodMaps.brothOilAlbedo,
      roughness: 0.36,
      roughnessMap: foodMaps.brothOilRough,
      transparent: true,
      opacity: 0.94,
      clearcoat: 0.08,
      clearcoatRoughness: 0.45,
      envMapIntensity: 0.12,
      sheen: 0.8,
      sheenColor: new THREE.Color(0xeee4c8),
      specularIntensity: 0.24,
    }, w),
  )
  meniscusInner.name = 'meniscus_inner'
  meniscusInner.rotation.x = Math.PI / 2
  meniscusInner.position.y = 0.34
  root.add(meniscusInner)

  // Outer meniscus lip — third ring tight to ceramic (milk beads over rim)
  const meniscusOuter = new THREE.Mesh(
    new THREE.TorusGeometry(0.4, 0.022, 10, 40),
    phys(0xebe2c8, {
      map: foodMaps.brothOilAlbedo,
      roughness: 0.32,
      roughnessMap: foodMaps.brothOilRough,
      transparent: true,
      opacity: 0.95,
      clearcoat: 0.12,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.14,
      sheen: 0.82,
      sheenColor: new THREE.Color(0xf4ead4),
      specularIntensity: 0.28,
    }, w),
  )
  meniscusOuter.name = 'meniscus_outer'
  meniscusOuter.rotation.x = Math.PI / 2
  meniscusOuter.position.y = 0.348
  root.add(meniscusOuter)

  // Oil sheen patches (near-black fat blooms on cream milk — PRIMARY liquid craft cue)
  // v35: denser fat on OPEN milk so liquid volume reads at counter FOV
  for (let i = 0; i < 48; i++) {
    const rr = 0.028 + seeded(i, 4) * 0.09
    const oil = new THREE.Mesh(new THREE.CircleGeometry(rr, 10), oilFilm)
    oil.rotation.x = -Math.PI / 2
    const a = seeded(i, 5) * Math.PI * 2
    // Bias oil into open milk sectors (avoid full cover under sparse nest)
    const d = 0.05 + seeded(i, 6) * 0.28
    oil.position.set(Math.cos(a) * d, 0.3375 + i * 0.0001, Math.sin(a) * d)
    oil.scale.set(1 + seeded(i, 7) * 1.1, 1, 0.32 + seeded(i, 8) * 0.85)
    root.add(oil)
  }

  // Fat swirl (thin soft oil ring — liquid cue, not chrome plastic)
  const oilSwirl = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.016, 6, 22),
    phys(0x160c00, {
      map: foodMaps.brothOilAlbedo,
      roughness: 0.24,
      metalness: 0.0,
      transparent: true,
      opacity: 0.78,
      clearcoat: 0.16,
      clearcoatRoughness: 0.32,
      envMapIntensity: 0.14,
      sheen: 0.72,
      sheenColor: new THREE.Color(0x5a3004),
      specularIntensity: 0.36,
    }, w),
  )
  oilSwirl.name = 'oil_swirl'
  oilSwirl.rotation.x = Math.PI / 2
  oilSwirl.position.set(0.07, 0.338, -0.05)
  oilSwirl.scale.set(1.55, 1, 0.85)
  root.add(oilSwirl)

  // Open milk patches — cream protein film discs OWN the plate between sparse coils
  // (v36: film not lacquer — mid rough + sheen so warm key doesn't plastic-pool)
  for (let i = 0; i < 14; i++) {
    const milk = new THREE.Mesh(
      new THREE.CircleGeometry(0.05 + seeded(i, 390) * 0.06, 14),
      phys(0xebe2c8, {
        map: foodMaps.brothOilAlbedo,
        roughness: 0.34,
        roughnessMap: foodMaps.brothOilRough,
        clearcoat: 0.1,
        clearcoatRoughness: 0.44,
        sheen: 0.85,
        sheenColor: new THREE.Color(0xf4ead0),
        sheenRoughness: 0.36,
        envMapIntensity: 0.14,
        specularIntensity: 0.28,
        specularColor: new THREE.Color(0xf0e6d0),
        side: THREE.DoubleSide,
      }, w),
    )
    milk.rotation.x = -Math.PI / 2
    // Open sectors around bowl: guest front, sides — milk plate not pasta fill
    const a = (i / 14) * Math.PI * 2 + 0.35
    const d = 0.1 + seeded(i, 391) * 0.2
    milk.position.set(Math.cos(a) * d, 0.3378 + i * 0.00008, Math.sin(a) * d)
    milk.scale.set(1.3 + seeded(i, 392) * 0.55, 1, 0.75 + seeded(i, 393) * 0.55)
    root.add(milk)
  }

  // --- Noodles: SPARSE pale WET wheat IN milk (v35 — open milk plate, not dry mass) ---
  // r30 dry mass: dense pasta pile hid all broth. Ref: soft wet coils floating IN milk.
  // v35: half the strands, large milk windows, lower nest, thinner tubes — liquid plate owns mouth.
  const noodleGroup = new THREE.Group()
  noodleGroup.name = 'noodles'
  // Bias wet materials (majority wet starch film under warm key)
  const noodleMat = (i: number) =>
    i % 5 === 0 ? noodleDeep : i % 2 === 0 ? noodleWet : noodle

  // Sparse underlay — submerged wheat strands (depth UNDER milk body)
  for (let i = 0; i < 14; i++) {
    const a0 = (i / 14) * Math.PI * 2 + 0.18
    const r = 0.05 + seeded(i, 80) * 0.16
    const lift = 0.308 + seeded(i, 81) * 0.01
    const und = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a0) * r * 0.3, lift, Math.sin(a0) * r * 0.3),
      new THREE.Vector3(
        Math.cos(a0 + 0.95) * r * 0.95,
        lift + 0.01,
        Math.sin(a0 + 0.95) * r * 0.95,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 2.0) * r * 1.05,
        lift + 0.008,
        Math.sin(a0 + 2.0) * r * 0.88,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 2.9) * r * 0.5,
        lift + 0.002,
        Math.sin(a0 + 2.9) * r * 0.48,
      ),
    ])
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(und, 12, 0.0058 + (i % 3) * 0.001, 5, false),
      noodleMat(i),
    )
    tube.castShadow = false
    noodleGroup.add(tube)
  }

  // Primary nest — SPARSE thin wet coils IN milk (large windows for cream pool)
  // v35: skip ~45% of angles so milk/oil/meniscus stay visible at counter FOV
  for (let i = 0; i < 32; i++) {
    const a0 = (i / 32) * Math.PI * 2.1 + 0.3 + seeded(i, 9) * 0.4
    // Heavy sector skip → open milk plate (not continuous pasta fill)
    const sectorSkip = seeded(i, 88)
    if (sectorSkip > 0.55) continue
    // Keep guest-front (+Z) more open so counter FOV sees milk crown
    const frontBias = Math.sin(a0)
    if (frontBias > 0.55 && seeded(i, 89) > 0.35) continue
    const r = 0.06 + (i % 6) * 0.028 + seeded(i, 10) * 0.02
    // Sit IN milk — base at/under surface, low undulation (not dry pile)
    const base = 0.322 + (i % 4) * 0.003 + seeded(i, 11) * 0.004
    const und = 0.01 + (i % 3) * 0.004 + seeded(i, 12) * 0.005
    // Slight guest bias but leave milk rim open
    const gz = 0.012
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(
        Math.cos(a0) * r * 0.22 + 0.01,
        base + und * 0.05,
        Math.sin(a0) * r * 0.22 + gz,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 0.5) * r * 0.68 + 0.01,
        base + und * 0.4,
        Math.sin(a0 + 0.5) * r * 0.75 + gz,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 1.1) * r * 0.95 + 0.01,
        base + und * 0.75 + seeded(i, 13) * 0.005,
        Math.sin(a0 + 1.1) * r * 0.92 + gz,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 1.75) * r * 0.82 + 0.01,
        base + und * 0.35,
        Math.sin(a0 + 1.75) * r * 0.65 + gz,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 2.4) * r * 0.48 + 0.01,
        base + und * 0.12,
        Math.sin(a0 + 2.4) * r * 0.42 + gz,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 3.0) * r * 0.22 + 0.01,
        base + 0.001,
        Math.sin(a0 + 3.0) * r * 0.26 + gz,
      ),
    ])
    // Thin wet strand radius — individual wheat coil, not rope blob
    const radius = 0.0056 + (i % 4) * 0.0009 + (i % 7 === 0 ? 0.001 : 0)
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 14, radius, 5, false),
      noodleMat(i),
    )
    tube.castShadow = false
    noodleGroup.add(tube)
  }
  // Mid arch loops — few soft low crests above milk (wet nest, not dry stick forest)
  for (let i = 0; i < 12; i++) {
    const a0 = 0.15 + seeded(i, 30) * Math.PI * 2.0
    // Prefer sides/back so guest front milk plate stays open
    if (Math.sin(a0) > 0.65 && seeded(i, 34) > 0.4) continue
    const r = 0.09 + seeded(i, 31) * 0.15
    const lift = 0.328 + seeded(i, 32) * 0.008
    const arch = 0.016 + (i % 3) * 0.006 + seeded(i, 33) * 0.006
    const loop = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a0) * r + 0.01, lift, Math.sin(a0) * r + 0.012),
      new THREE.Vector3(
        Math.cos(a0 + 0.65) * (r * 0.55) + 0.01,
        lift + arch,
        Math.sin(a0 + 0.65) * (r * 0.55) + 0.012,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 1.35) * r * 0.95 + 0.01,
        lift + arch * 0.4,
        Math.sin(a0 + 1.35) * r * 0.88 + 0.012,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 2.05) * r * 0.65 + 0.01,
        lift + 0.003,
        Math.sin(a0 + 2.05) * r * 0.68 + 0.012,
      ),
    ])
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(loop, 10, 0.0056 + (i % 3) * 0.0009, 5, false),
      noodleMat(i + 5),
    )
    tube.castShadow = false
    noodleGroup.add(tube)
  }
  // Tight center coil under scallions (ref identity nest — sits IN milk, compact)
  for (let i = 0; i < 10; i++) {
    const a0 = (i / 10) * Math.PI * 2 + 0.1
    const r = 0.028 + seeded(i, 70) * 0.07
    const lift = 0.332 + seeded(i, 71) * 0.01
    const coil = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a0) * r + 0.025, lift, Math.sin(a0) * r + 0.03),
      new THREE.Vector3(
        Math.cos(a0 + 0.95) * r * 0.48 + 0.025,
        lift + 0.016,
        Math.sin(a0 + 0.95) * r * 0.48 + 0.03,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 1.95) * r * 0.98 + 0.025,
        lift + 0.008,
        Math.sin(a0 + 1.95) * r * 0.88 + 0.03,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 2.75) * r * 0.62 + 0.025,
        lift + 0.002,
        Math.sin(a0 + 2.75) * r * 0.62 + 0.03,
      ),
    ])
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(coil, 10, 0.0054, 4, false),
      noodleMat(i + 2),
    )
    tube.castShadow = false
    noodleGroup.add(tube)
  }
  // Near-lip coils — few wet wheat strands at rim (sides only — leave guest milk crown)
  for (let i = 0; i < 6; i++) {
    const a0 = -0.9 + seeded(i, 140) * 1.1 + (i % 2 === 0 ? Math.PI * 0.85 : 0)
    const r0 = 0.2 + seeded(i, 141) * 0.1
    const spill = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a0) * r0 * 0.55, 0.328 + seeded(i, 142) * 0.006, Math.sin(a0) * r0 * 0.55),
      new THREE.Vector3(
        Math.cos(a0 + 0.4) * (r0 * 0.88),
        0.336 + seeded(i, 143) * 0.008,
        Math.sin(a0 + 0.4) * (r0 * 0.88),
      ),
      new THREE.Vector3(
        Math.cos(a0 + 0.85) * (r0 * 0.95),
        0.332 + seeded(i, 144) * 0.006,
        Math.sin(a0 + 0.85) * (r0 * 0.95),
      ),
      new THREE.Vector3(
        Math.cos(a0 + 1.25) * (r0 * 0.8),
        0.32 + seeded(i, 145) * 0.005,
        Math.sin(a0 + 1.25) * (r0 * 0.8),
      ),
    ])
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(spill, 10, 0.0056 + (i % 3) * 0.0009, 5, false),
      noodleMat(i + 3),
    )
    tube.castShadow = false
    noodleGroup.add(tube)
  }
  root.add(noodleGroup)
  nodes.noodles = noodleGroup

  // --- Chashu slices (v33: FLAT pork slices + seared crust — not sphere fat blobs) ---
  // r28 blobby toppings: sphere body + high clearcoat = plastic pink discs under key.
  const chashuGroup = new THREE.Group()
  chashuGroup.name = 'chashu'
  for (let i = 0; i < 3; i++) {
    const slice = new THREE.Group()
    // Very flat oval slab — still-life slice thickness (scale.y ≪ 0.06)
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 18, 12),
      chashuFat,
    )
    body.scale.set(
      1.28 + seeded(i, 60) * 0.1,
      0.048 + i * 0.004,
      1.02 + seeded(i, 61) * 0.06,
    )
    body.castShadow = cast
    slice.add(body)

    // Seared crust perimeter (caramelized edge — food identity vs smooth disc)
    const sear = new THREE.Mesh(
      new THREE.TorusGeometry(0.088, 0.009, 6, 22),
      chashuSear,
    )
    sear.rotation.x = Math.PI / 2
    sear.position.y = 0.001
    sear.scale.set(1.14 + seeded(i, 62) * 0.05, 1, 0.94)
    slice.add(sear)

    // Meat spiral rings (dark vs fat — spiral read at beauty FOV)
    const meat = new THREE.Mesh(
      new THREE.TorusGeometry(0.058, 0.014, 6, 20),
      chashuMeat,
    )
    meat.rotation.x = Math.PI / 2
    meat.position.y = -0.0005
    meat.scale.set(1.18, 1, 0.5)
    slice.add(meat)
    const meat2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.038, 0.01, 6, 16),
      phys(0x6a2216, {
        roughness: 0.52,
        clearcoat: 0.06,
        clearcoatRoughness: 0.42,
        sheen: 0.18,
        sheenColor: new THREE.Color(0x902818),
        envMapIntensity: 0.12,
      }, w),
    )
    meat2.rotation.x = Math.PI / 2
    meat2.position.y = 0.002
    meat2.scale.set(1.14, 1, 0.68)
    slice.add(meat2)
    // Fat swirl — flat disc film, not plastic torus blob
    const swirl = new THREE.Mesh(
      new THREE.CircleGeometry(0.028, 14),
      phys(0xdcc4a4, {
        roughness: 0.34,
        clearcoat: 0.1,
        clearcoatRoughness: 0.38,
        sheen: 0.38,
        sheenColor: new THREE.Color(0xe8d8c0),
        envMapIntensity: 0.14,
        side: THREE.DoubleSide,
      }, w),
    )
    swirl.rotation.x = -Math.PI / 2
    swirl.position.y = 0.006
    swirl.scale.set(1.2, 1, 0.9)
    slice.add(swirl)
    const core = new THREE.Mesh(
      new THREE.CircleGeometry(0.014, 10),
      phys(0xe0c8a8, {
        roughness: 0.36,
        clearcoat: 0.08,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.12,
        side: THREE.DoubleSide,
      }, w),
    )
    core.rotation.x = -Math.PI / 2
    core.position.y = 0.007
    slice.add(core)

    // Fat marbling — flat streak discs (not sphere grain blobs)
    for (let g = 0; g < 6; g++) {
      const grain = new THREE.Mesh(
        new THREE.CircleGeometry(0.01 + seeded(i * 10 + g, 63) * 0.008, 6),
        g % 3 === 0
          ? phys(0xc88868, {
              roughness: 0.42,
              clearcoat: 0.08,
              clearcoatRoughness: 0.4,
              envMapIntensity: 0.12,
              side: THREE.DoubleSide,
            }, w)
          : phys(0x4a1810, {
              roughness: 0.55,
              clearcoat: 0.04,
              side: THREE.DoubleSide,
            }, w),
      )
      const ga = seeded(i * 10 + g, 64) * Math.PI * 2
      const gr = 0.018 + seeded(i * 10 + g, 65) * 0.05
      grain.rotation.x = -Math.PI / 2
      grain.position.set(
        Math.cos(ga) * gr,
        0.0055 + seeded(i * 10 + g, 66) * 0.002,
        Math.sin(ga) * gr * 0.7,
      )
      grain.scale.set(1.6 + seeded(i * 10 + g, 67), 1, 0.45 + seeded(i * 10 + g, 68) * 0.35)
      grain.rotation.z = ga
      slice.add(grain)
    }

    // Soy glaze sheen on top face (wet food film, restrained — not glass disc)
    const glaze = new THREE.Mesh(
      new THREE.CircleGeometry(0.072, 18),
      phys(0xa85820, {
        roughness: 0.28,
        clearcoat: 0.14,
        clearcoatRoughness: 0.32,
        transparent: true,
        opacity: 0.42,
        metalness: 0.0,
        envMapIntensity: 0.18,
        sheen: 0.5,
        sheenColor: new THREE.Color(0xc88040),
        specularIntensity: 0.28,
        specularColor: new THREE.Color(0xd89850),
        side: THREE.DoubleSide,
      }, w),
    )
    glaze.rotation.x = -Math.PI / 2
    glaze.position.y = 0.008
    slice.add(glaze)

    // Stack left-center — flat slices IN milk mouth under noren
    // v33: lower + flatter so pork reads as food mass not sphere pile
    slice.position.set(-0.1 + i * 0.05, 0.34 + i * 0.014, 0.02 + i * 0.026)
    slice.rotation.set(0.08 + i * 0.03, 0.28 + i * 0.28, 0.08 + i * 0.04)
    slice.scale.setScalar(1.18)
    chashuGroup.add(slice)
  }
  root.add(chashuGroup)
  nodes.chashu = chashuGroup

  // --- Soft-boiled egg (v33: cut face + membrane yolk — not glass marble dome) ---
  // r28 blobby: high clearcoat yolk + thick white dome = plastic sphere under key.
  // Local +Y = cut normal; tip cut toward +Z (guest/beauty).
  const egg = new THREE.Group()
  egg.name = 'egg'
  // Front-left on milk — cut face tips toward guest (+Z), compact in mouth
  egg.position.set(-0.08, 0.348, 0.115)
  // ~-86° X so cut is guest-facing under counter FOV; slight Y/Z so oval reads
  egg.rotation.set(-1.48, 0.1, 0.08)
  egg.scale.setScalar(1.28)

  // White shell half — flatter under cut (kill dome blob from side FOV)
  const white = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 24, 18, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58),
    eggWhite,
  )
  white.scale.set(1.16, 0.4, 1.18)
  white.position.y = -0.026
  white.castShadow = cast
  egg.add(white)

  // Surface dimples — flatter food irregularity (not sphere greeble blobs)
  for (let d = 0; d < 6; d++) {
    const dimple = new THREE.Mesh(
      new THREE.SphereGeometry(0.009 + seeded(d, 100) * 0.007, 5, 4),
      phys(0xe4d8c8, {
        roughness: 0.52 + seeded(d, 101) * 0.16,
        clearcoat: 0.04,
        clearcoatRoughness: 0.5,
        envMapIntensity: 0.1,
      }, w),
    )
    const da = seeded(d, 102) * Math.PI * 2
    const dp = 0.4 + seeded(d, 103) * 0.65
    dimple.position.set(
      Math.cos(da) * 0.09 * Math.sin(dp),
      -0.028 - Math.cos(dp) * 0.03,
      Math.sin(da) * 0.09 * Math.sin(dp),
    )
    dimple.scale.set(1.4, 0.22, 1.15)
    egg.add(dimple)
  }

  // Soy-tinted belly (volume under cut — ajitsuke brown wash, side FOV cue)
  const whiteBelly = new THREE.Mesh(
    new THREE.SphereGeometry(0.088, 18, 12, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.5),
    phys(0x8a6840, {
      roughness: 0.48,
      clearcoat: 0.1,
      clearcoatRoughness: 0.4,
      sheen: 0.22,
      sheenColor: new THREE.Color(0xb88858),
      envMapIntensity: 0.16,
    }, w),
  )
  whiteBelly.scale.set(1.12, 0.42, 1.14)
  whiteBelly.position.y = -0.035
  egg.add(whiteBelly)

  // Ajitsuke mottling patches on shell exterior (soy spots — not uniform plastic)
  for (let m = 0; m < 10; m++) {
    const blot = new THREE.Mesh(
      new THREE.SphereGeometry(0.013 + seeded(m, 110) * 0.016, 6, 5),
      phys(m % 2 === 0 ? 0x7a5030 : 0x5c3818, {
        roughness: 0.5,
        clearcoat: 0.08,
        clearcoatRoughness: 0.42,
        sheen: 0.14,
        sheenColor: new THREE.Color(0xa86838),
        envMapIntensity: 0.14,
        transparent: true,
        opacity: 0.58 + seeded(m, 111) * 0.28,
      }, w),
    )
    const ma = 0.4 + seeded(m, 112) * 2.4
    const mp = 0.5 + seeded(m, 113) * 0.9
    blot.position.set(
      Math.cos(ma) * 0.09 * Math.sin(mp),
      -0.02 - Math.cos(mp) * 0.03,
      Math.sin(ma) * 0.09 * Math.sin(mp),
    )
    blot.scale.set(1.55, 0.26, 1.35)
    egg.add(blot)
  }

  // Cut face — moist warm ivory disc (PRIMARY half-egg identity at counter FOV)
  // v36: protein film (sheen-led) so egg ≠ glass ceramic disc under warm key
  const cutFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.102, 36),
    phys(0xe8dcc8, {
      roughness: 0.4,
      clearcoat: 0.08,
      clearcoatRoughness: 0.42,
      sheen: 0.45,
      sheenColor: new THREE.Color(0xf0e4d0),
      sheenRoughness: 0.45,
      envMapIntensity: 0.12,
      metalness: 0.0,
      specularIntensity: 0.18,
    }, w),
  )
  cutFace.rotation.x = -Math.PI / 2
  cutFace.position.y = 0.012
  cutFace.scale.set(1.14, 1.16, 1)
  egg.add(cutFace)

  // Concentric albumen rings on cut face (protein layers — not flat plastic disc)
  for (let r = 0; r < 3; r++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.076 - r * 0.015, 0.005, 5, 28),
      phys(r % 2 === 0 ? 0xdcd0b8 : 0xe8dece, {
        roughness: 0.42 + r * 0.06,
        clearcoat: 0.06,
        clearcoatRoughness: 0.45,
        envMapIntensity: 0.12,
        transparent: true,
        opacity: 0.52,
      }, w),
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.0135 + r * 0.0004
    egg.add(ring)
  }

  // Inner cut wet film — soft food moisture on cut white (not chrome disc)
  const cutWet = new THREE.Mesh(
    new THREE.CircleGeometry(0.084, 24),
    phys(0xece2d4, {
      roughness: 0.32,
      clearcoat: 0.08,
      clearcoatRoughness: 0.4,
      transparent: true,
      opacity: 0.22,
      sheen: 0.38,
      sheenColor: new THREE.Color(0xf4eadc),
      envMapIntensity: 0.12,
      specularIntensity: 0.18,
    }, w),
  )
  cutWet.rotation.x = -Math.PI / 2
  cutWet.position.y = 0.0145
  egg.add(cutWet)

  // Soy-marinated edge ring (warm brown — ajitsuke perimeter, thin so yolk owns center)
  const eggRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.012, 6, 32),
    phys(0x6a3c1c, {
      roughness: 0.38,
      clearcoat: 0.14,
      clearcoatRoughness: 0.36,
      sheen: 0.28,
      sheenColor: new THREE.Color(0xa85828),
      envMapIntensity: 0.2,
      specularIntensity: 0.28,
    }, w),
  )
  eggRim.rotation.x = Math.PI / 2
  eggRim.position.y = 0.013
  egg.add(eggRim)

  // Outer soy wash band (shell marination from side FOV)
  const eggSoyBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.098, 0.011, 6, 28),
    phys(0x543018, {
      roughness: 0.48,
      clearcoat: 0.1,
      clearcoatRoughness: 0.4,
      sheen: 0.16,
      sheenColor: new THREE.Color(0x884818),
      envMapIntensity: 0.14,
    }, w),
  )
  eggSoyBand.rotation.x = Math.PI / 2
  eggSoyBand.position.y = -0.012
  eggSoyBand.scale.set(1.05, 1, 0.82)
  egg.add(eggSoyBand)

  // Yolk well ring (white→yolk transition) — protein film, not glass torus
  const yolkWell = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.012, 6, 24),
    phys(0xdcd0b0, {
      roughness: 0.36,
      clearcoat: 0.1,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.14,
      sheen: 0.32,
      sheenColor: new THREE.Color(0xe8dcc0),
    }, w),
  )
  yolkWell.rotation.x = Math.PI / 2
  yolkWell.position.set(0.0, 0.015, 0.0)
  egg.add(yolkWell)

  // Yolk dome — wet jam membrane (NO emissive, NO glass marble) — flatter for FOV
  const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.058, 18, 14), eggYolk)
  yolk.position.set(0.0, 0.038, 0.0)
  yolk.scale.set(1.35, 0.58, 1.35)
  yolk.castShadow = cast
  egg.add(yolk)

  // Jammy yolk core — dual-tone depth (kills single-color toy yolk)
  const yolkCore = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), eggYolkCore)
  yolkCore.position.set(0.0, 0.036, 0.0)
  yolkCore.scale.set(1.22, 0.55, 1.22)
  egg.add(yolkCore)

  // Runny yolk base bleed into white — saturated cut-face disc (must read orange)
  const yolkBase = new THREE.Mesh(
    new THREE.CircleGeometry(0.064, 24),
    phys(0xd8400c, {
      roughness: 0.3,
      clearcoat: 0.12,
      clearcoatRoughness: 0.34,
      transparent: true,
      opacity: 0.92,
      sheen: 0.65,
      sheenColor: new THREE.Color(0xf05810),
      envMapIntensity: 0.16,
      specularIntensity: 0.28,
      specularColor: new THREE.Color(0xe89040),
      side: THREE.DoubleSide,
    }, w),
  )
  yolkBase.rotation.x = -Math.PI / 2
  yolkBase.position.set(0.0, 0.016, 0.0)
  egg.add(yolkBase)

  // Wet yolk membrane — single soft food film over crown (not multi-blob hilites)
  const yolkMembrane = new THREE.Mesh(
    new THREE.SphereGeometry(0.036, 12, 8),
    phys(0xe07818, {
      roughness: 0.3,
      transparent: true,
      opacity: 0.18,
      clearcoat: 0.08,
      clearcoatRoughness: 0.4,
      metalness: 0.0,
      envMapIntensity: 0.12,
      specularIntensity: 0.22,
      specularColor: new THREE.Color(0xe8a848),
    }, w),
  )
  yolkMembrane.position.set(0.004, 0.046, 0.002)
  yolkMembrane.scale.set(1.32, 0.42, 1.28)
  egg.add(yolkMembrane)

  // Soft yolk sheen disc (food moisture on yolk crown — one catch, not multi-blob)
  const yolkSheen = new THREE.Mesh(
    new THREE.CircleGeometry(0.032, 14),
    phys(0xd03808, {
      roughness: 0.32,
      transparent: true,
      opacity: 0.18,
      clearcoat: 0.08,
      clearcoatRoughness: 0.4,
      metalness: 0.0,
      envMapIntensity: 0.12,
      side: THREE.DoubleSide,
    }, w),
  )
  yolkSheen.rotation.x = -Math.PI / 2
  yolkSheen.position.set(0.0, 0.042, 0.0)
  egg.add(yolkSheen)

  root.add(egg)
  nodes.egg = egg

  // --- Nori sheet (v19: torn edge + vertical paper veins — not flat green slab) ---
  const noriGroup = new THREE.Group()
  noriGroup.name = 'nori'
  const noriMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.13, 0.26, 16, 1, true, -0.12, Math.PI * 0.72),
    nori,
  )
  noriMesh.castShadow = cast
  noriMesh.receiveShadow = recv
  noriGroup.add(noriMesh)
  const noriInner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.122, 0.127, 0.255, 14, 1, true, -0.1, Math.PI * 0.68),
    phys(0x14281a, {
      roughness: 0.74,
      sheen: 0.55,
      sheenRoughness: 0.52,
      sheenColor: new THREE.Color(0x4a7858),
      side: THREE.BackSide,
    }, w),
  )
  noriGroup.add(noriInner)

  // Vertical paper veins — roasted grain breaks smooth slab read
  for (let v = 0; v < 12; v++) {
    const vein = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.22, 0.0025),
      phys(v % 3 === 0 ? 0x1a3828 : 0x0c1c12, {
        roughness: 0.78,
        sheen: 0.35,
        sheenColor: new THREE.Color(0x3a6850),
        envMapIntensity: 0.22,
      }, w),
    )
    const va = -0.08 + (v / 12) * Math.PI * 0.68
    vein.position.set(Math.sin(va) * 0.128, 0.0, Math.cos(va) * 0.128)
    vein.rotation.y = va
    vein.scale.set(1, 0.85 + seeded(v, 120) * 0.3, 1)
    noriGroup.add(vein)
  }

  // Torn top edge — irregular paper lip (not smooth torus)
  for (let t = 0; t < 14; t++) {
    const tear = new THREE.Mesh(
      new THREE.SphereGeometry(0.008 + seeded(t, 121) * 0.007, 5, 4),
      noriEdgeMat,
    )
    const ta = -0.12 + (t / 14) * Math.PI * 0.72
    const lift = 0.125 + seeded(t, 122) * 0.018
    tear.position.set(Math.sin(ta) * 0.128, lift, Math.cos(ta) * 0.128)
    tear.scale.set(0.9 + seeded(t, 123) * 0.8, 0.35 + seeded(t, 124) * 0.5, 0.7)
    noriGroup.add(tear)
  }
  // Continuous top edge catch under torn bits
  const noriEdge = new THREE.Mesh(
    new THREE.TorusGeometry(0.127, 0.005, 5, 22, Math.PI * 0.72),
    noriEdgeMat,
  )
  noriEdge.rotation.y = -0.12
  noriEdge.position.y = 0.128
  noriGroup.add(noriEdge)

  // Bottom dip into broth — wetter/darker soak
  const noriDip = new THREE.Mesh(
    new THREE.TorusGeometry(0.126, 0.006, 4, 16, Math.PI * 0.5),
    phys(0x040c08, {
      roughness: 0.55,
      clearcoat: 0.35,
      clearcoatRoughness: 0.25,
      envMapIntensity: 0.35,
    }, w),
  )
  noriDip.rotation.y = 0.1
  noriDip.position.y = -0.12
  noriGroup.add(noriDip)

  // Oil-wet zone near broth (subtle sheen band)
  const noriWet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.126, 0.129, 0.04, 12, 1, true, -0.1, Math.PI * 0.65),
    phys(0x0a1810, {
      roughness: 0.35,
      clearcoat: 0.45,
      clearcoatRoughness: 0.2,
      sheen: 0.4,
      sheenColor: new THREE.Color(0x2a5840),
      envMapIntensity: 0.45,
      transparent: true,
      opacity: 0.7,
    }, w),
  )
  noriWet.position.y = -0.1
  noriGroup.add(noriWet)

  // Surface speckles (roasted paper texture)
  for (let i = 0; i < 14; i++) {
    const speck = new THREE.Mesh(
      new THREE.SphereGeometry(0.004 + seeded(i, 40) * 0.004, 4, 3),
      phys(i % 2 === 0 ? 0x2a4a32 : 0x1a3024, { roughness: 0.62 }, w),
    )
    const sa = -0.08 + seeded(i, 40) * 0.65
    const sy = -0.1 + seeded(i, 41) * 0.2
    speck.position.set(Math.sin(sa) * 0.126, sy, Math.cos(sa) * 0.126)
    noriGroup.add(speck)
  }
  // Upright guest-right triangle silhouette (dark mass in milk mouth)
  // v32: lower + compact so nori edge survives noren clip (r27 toppings missing)
  noriGroup.position.set(0.1, 0.42, 0.04)
  noriGroup.rotation.set(-0.1, 0.72, 0.05)
  noriGroup.scale.setScalar(1.25)
  root.add(noriGroup)
  nodes.nori = noriGroup

  // --- Green onion rings (v33: natural cut rings — not neon plastic pile) ---
  // Ref: dense ring pile center-front on noodles. Face-up hollows, lower under noren.
  const onionGroup = new THREE.Group()
  onionGroup.name = 'scallions'
  for (let i = 0; i < 44; i++) {
    const isWhite = i % 5 === 0
    // Hollow rings — cut vegetable form at counter FOV
    const ringR = 0.014 + seeded(i, 12) * 0.018
    const tube = 0.0042 + seeded(i, 13) * 0.0038
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringR, tube, 5, 12),
      isWhite ? onionWhite : onion,
    )
    // Tight pile center-front on noodle nest (right of egg) — IN milk mouth
    const ox = 0.05 + (seeded(i, 14) - 0.5) * 0.075
    const oz = 0.055 + (seeded(i, 15) - 0.5) * 0.06
    const oy = 0.348 + seeded(i, 16) * 0.024 + (i % 5) * 0.006
    ring.position.set(ox, oy, oz)
    // Prefer face-up rings so cut hollows show (not edge-on green lines)
    ring.rotation.set(
      0.12 + seeded(i, 17) * 0.7,
      seeded(i, 18) * Math.PI * 2,
      seeded(i, 19) * 0.55 - 0.28,
    )
    ring.castShadow = false
    onionGroup.add(ring)
    // Cut face — moist green/white interior (hollow ring identity, not plastic)
    if (i % 2 === 0) {
      const face = new THREE.Mesh(
        new THREE.CircleGeometry(tube * 2.2, 7),
        phys(isWhite ? 0xf0f6e8 : 0x38c028, {
          roughness: 0.22,
          clearcoat: 0.28,
          clearcoatRoughness: 0.18,
          envMapIntensity: 0.28,
          side: THREE.DoubleSide,
        }, w),
      )
      face.position.copy(ring.position)
      face.position.y += 0.003
      face.rotation.set(ring.rotation.x, ring.rotation.y, ring.rotation.z)
      onionGroup.add(face)
      // Hollow core disc (darker inner cut — scallion tube read)
      const hollow = new THREE.Mesh(
        new THREE.CircleGeometry(tube * 1.05, 5),
        phys(isWhite ? 0xd4e0c4 : 0x186810, {
          roughness: 0.36,
          envMapIntensity: 0.2,
          side: THREE.DoubleSide,
        }, w),
      )
      hollow.position.copy(ring.position)
      hollow.position.y += 0.0035
      hollow.rotation.set(ring.rotation.x, ring.rotation.y, ring.rotation.z)
      onionGroup.add(hollow)
    }
  }
  // Extra upright bias rings — height silhouette vs flat fleck pile (still in mouth)
  for (let i = 0; i < 8; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.015 + seeded(i, 130) * 0.01, 0.0042, 5, 10),
      onion,
    )
    ring.position.set(
      0.048 + (seeded(i, 131) - 0.5) * 0.042,
      0.362 + seeded(i, 132) * 0.02,
      0.055 + (seeded(i, 133) - 0.5) * 0.032,
    )
    ring.rotation.set(1.15 + seeded(i, 134) * 0.4, seeded(i, 135) * 2, 0.18)
    ring.castShadow = false
    onionGroup.add(ring)
  }
  root.add(onionGroup)
  nodes.scallions = onionGroup

  // --- Chili oil flecks (flat discs on broth — not sphere blobs) ---
  const chiliGroup = new THREE.Group()
  chiliGroup.name = 'chili'
  for (let i = 0; i < 16; i++) {
    const flake = new THREE.Mesh(
      new THREE.CircleGeometry(0.004 + seeded(i, 50) * 0.005, 6),
      chili,
    )
    flake.rotation.x = -Math.PI / 2
    flake.rotation.z = seeded(i, 54) * Math.PI
    flake.scale.set(1.4 + seeded(i, 55) * 0.8, 0.7 + seeded(i, 56) * 0.5, 1)
    const a = seeded(i, 51) * Math.PI * 2
    const r = 0.05 + seeded(i, 52) * 0.22
    flake.position.set(Math.cos(a) * r, 0.3355 + seeded(i, 53) * 0.003, Math.sin(a) * r)
    chiliGroup.add(flake)
  }
  root.add(chiliGroup)
  nodes.chili = chiliGroup

  // --- Sesame seeds (on broth + noodles) ---
  const sesameGroup = new THREE.Group()
  sesameGroup.name = 'sesame'
  for (let i = 0; i < 28; i++) {
    const black = i % 4 === 0
    const seed = new THREE.Mesh(
      new THREE.SphereGeometry(0.0045 + seeded(i, 18) * 0.003, 5, 4),
      black ? seedBlack : seedWhite,
    )
    seed.scale.set(1.6, 0.48, 0.95)
    const a = seeded(i, 19) * Math.PI * 2
    const r = Math.sqrt(seeded(i, 20)) * 0.28
    seed.position.set(Math.cos(a) * r, 0.337 + seeded(i, 21) * 0.008, Math.sin(a) * r)
    seed.rotation.set(seeded(i, 22), seeded(i, 23), seeded(i, 24))
    sesameGroup.add(seed)
  }
  root.add(sesameGroup)
  nodes.sesame = sesameGroup

  // --- Chopsticks (wood + red lacquer brand band, rim-resting) ---
  const sticks = new THREE.Group()
  sticks.name = 'chopsticks'
  for (let i = 0; i < 2; i++) {
    const stick = new THREE.Group()
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0065, 0.011, 0.56, 10),
      wood,
    )
    shaft.castShadow = cast
    stick.add(shaft)
    const brand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0072, 0.008, 0.1, 10),
      woodTip,
    )
    brand.position.y = 0.18
    stick.add(brand)
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.0065, 0.036, 8),
      wood,
    )
    tip.position.y = -0.295
    tip.rotation.x = Math.PI
    stick.add(tip)

    // v32: rest on rim — wood shafts readable without sky-high stick forest
    stick.position.set(0.08 + i * 0.028, 0.42, 0.1 + i * 0.015)
    stick.rotation.z = -0.55
    stick.rotation.y = 0.2 + i * 0.08
    stick.rotation.x = 0.22 + 0.08 * i
    sticks.add(stick)
  }
  root.add(sticks)
  nodes.chopsticks = sticks

  // Project socket
  const socket = new THREE.Object3D()
  socket.name = 'socket_project'
  socket.position.set(0, 0.42, 0)
  root.add(socket)
  sockets.project = socket

  colliders.root = { type: 'sphere', radius: 0.42, offset: [0, 0.18, 0] }
  destructionGroups.ceramic = [outer, inner, rimBead]
  destructionGroups.toppings = [egg, noriGroup, noodleGroup, chashuGroup]

  root.userData.sculptRuntime = {
    nodes,
    meshes,
    sockets,
    colliders,
    destructionGroups,
  } satisfies ProceduralModelRuntime

  root.userData.tick = (t: number) => {
    noodleGroup.rotation.y = Math.sin(t * 0.1) * 0.01
    // Subtle milk shimmer — soft opacity drift on meniscus/oil only (surface is opaque)
    const m = meniscus.material as THREE.MeshPhysicalMaterial
    if (m && 'opacity' in m) {
      m.opacity = 0.94 + Math.sin(t * 1.5) * 0.015
    }
    const o = oilSpecFilm.material as THREE.MeshPhysicalMaterial
    if (o && 'opacity' in o) {
      o.opacity = 0.44 + Math.sin(t * 1.1 + 0.3) * 0.05
    }
  }

  return root
}

export function createRamenBowlLookDevLights(
  mode: 'neutral' | 'grazing' | 'reference' = 'reference',
): THREE.Group {
  const lights = new THREE.Group()
  lights.add(new THREE.HemisphereLight(0xfff0d6, 0x2a2018, mode === 'grazing' ? 0.3 : 0.65))
  const key = new THREE.DirectionalLight(0xffcf8a, mode === 'grazing' ? 3.2 : 2.2)
  key.position.set(mode === 'grazing' ? 6 : -3, mode === 'grazing' ? 1.2 : 6, 4)
  key.castShadow = true
  lights.add(key)
  lights.add(new THREE.DirectionalLight(0x88aadd, 0.5).translateX(3).translateY(2))
  return lights
}
