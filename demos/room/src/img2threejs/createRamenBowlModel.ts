/**
 * img2threejs form/material pass — RamenBowl (v9 glaze+liquid+noodle microform).
 * Reference: public/assets/ramen.jpg + imagine-v2 appetite plate
 *
 * Residual #1 (loop-r5/r6): still yellow blobs — not ceramic + liquid + noodle form.
 * v9: cooler stoneware clearcoat glaze (not cream plastic); true milky tonkotsu with
 * transmission/attenuation (not gold fill); thin wheat strand microform nest that
 * silhouettes against cream broth; toppings (egg/scallion/chashu) contrast-first.
 * Perf: lathe ≤32, tubes 10×5, noodles 36+14 loops, no noodle/sesame shadows.
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
 * Broth volume: high fill + concave meniscus climb at wall
 * (ref: creamy tonkotsu pools high against ceramic — bowl must look filled).
 */
function latheBrothVolume(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.0, 0.228),
    new THREE.Vector2(0.1, 0.229),
    new THREE.Vector2(0.2, 0.234),
    new THREE.Vector2(0.28, 0.246),
    new THREE.Vector2(0.33, 0.262),
    // Meniscus climb against ceramic
    new THREE.Vector2(0.355, 0.278),
    new THREE.Vector2(0.368, 0.29),
    new THREE.Vector2(0.372, 0.298),
    new THREE.Vector2(0.364, 0.302),
    new THREE.Vector2(0.34, 0.294),
    new THREE.Vector2(0.28, 0.282),
    new THREE.Vector2(0.18, 0.272),
    new THREE.Vector2(0.08, 0.266),
    new THREE.Vector2(0.0, 0.264),
  ]
  return new THREE.LatheGeometry(pts, 28)
}

function seeded(i: number, salt = 0) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export function createRamenBowlModel(options: ProceduralModelOptions = {}): THREE.Group {
  const cast = options.castShadow ?? true
  const recv = options.receiveShadow ?? true
  const w = options.wireframe

  const root = new THREE.Group()
  root.name = 'RamenBowl'
  root.userData.img2threejs = {
    skill: 'img2threejs@1.5.x',
    source: 'demos/room/public/assets/ramen.jpg',
    pass: 'form+material-v9-glaze-liquid-microform',
  }

  const nodes: Record<string, THREE.Object3D> = { root }
  const meshes: Record<string, THREE.Mesh> = {}
  const sockets: Record<string, THREE.Object3D> = {}
  const colliders: Record<string, unknown> = {}
  const destructionGroups: Record<string, THREE.Object3D[]> = {}

  // --- Materials (residual #1: ceramic glaze + milky liquid + noodle microform) ---
  // Cooler stoneware — gray-beige undertone so night env doesn't blow yellow plastic
  const ceramic = phys(0xb6a890, {
    roughness: 0.11,
    clearcoat: 1.0,
    clearcoatRoughness: 0.045,
    envMapIntensity: 1.55,
    sheen: 0.38,
    sheenRoughness: 0.4,
    sheenColor: new THREE.Color(0xe8dcc4),
    metalness: 0.0,
    specularIntensity: 0.9,
    specularColor: new THREE.Color(0xfff5e8),
  }, w)

  // Rim lip — wetter glaze catch (brighter, cooler than body)
  const ceramicRim = phys(0xd6cbb4, {
    roughness: 0.06,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.75,
    sheen: 0.35,
    sheenColor: new THREE.Color(0xfff8ec),
    metalness: 0.0,
    specularIntensity: 1.0,
  }, w)

  // Inner cavity: wet glaze (broth reflections + meniscus catch)
  const ceramicInner = phys(0xccc0a8, {
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.028,
    envMapIntensity: 1.6,
    sheen: 0.22,
    sheenColor: new THREE.Color(0xf4ead4),
    specularIntensity: 0.95,
    metalness: 0.0,
  }, w)

  // Cobalt rim bands (ref dual blue lines — saturated for mid FOV)
  const ceramicBlue = phys(0x0e2c4a, {
    roughness: 0.16,
    clearcoat: 0.98,
    clearcoatRoughness: 0.08,
    metalness: 0.08,
    envMapIntensity: 1.35,
    sheen: 0.3,
    sheenColor: new THREE.Color(0x4a7a98),
    specularIntensity: 0.8,
  }, w)

  // Creamy tonkotsu LIQUID — milky cream (ref), NOT gold-yellow blob fill.
  // Transmission + attenuation = liquid volume; zero metalness.
  const broth = phys(0xe6dcc8, {
    roughness: 0.14,
    metalness: 0.0,
    transmission: 0.32,
    thickness: 0.62,
    transparent: true,
    opacity: 0.86,
    clearcoat: 0.78,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.85,
    ior: 1.36,
    attenuationColor: new THREE.Color(0xd4c4a4),
    attenuationDistance: 0.18,
    sheen: 0.28,
    sheenColor: new THREE.Color(0xf0e4cc),
    sheenRoughness: 0.32,
    specularIntensity: 0.65,
  }, w)

  // Tonkotsu fat oil — thin warm film (specular sheen, not solid yellow discs)
  const oilFilm = phys(0xc8a848, {
    roughness: 0.04,
    metalness: 0.08,
    transparent: true,
    opacity: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    transmission: 0.5,
    thickness: 0.025,
    ior: 1.44,
    envMapIntensity: 1.25,
    specularIntensity: 0.9,
    sheen: 0.2,
    sheenColor: new THREE.Color(0xe0c060),
  }, w)

  // Wet wheat noodles — warmer/darker than milky broth so strands SEPARATE (microform)
  const noodle = phys(0xd8bc78, {
    roughness: 0.32,
    sheen: 0.45,
    sheenColor: new THREE.Color(0xecd890),
    sheenRoughness: 0.38,
    clearcoat: 0.48,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.9,
    metalness: 0.0,
    specularIntensity: 0.6,
  }, w)
  const noodleDeep = phys(0xb09048, {
    roughness: 0.4,
    sheen: 0.32,
    sheenColor: new THREE.Color(0xc8a858),
    clearcoat: 0.35,
    clearcoatRoughness: 0.26,
    envMapIntensity: 0.75,
    metalness: 0.0,
  }, w)
  // Broth-soaked strand — wetter, still darker than cream liquid
  const noodleWet = phys(0xc8a858, {
    roughness: 0.22,
    clearcoat: 0.68,
    clearcoatRoughness: 0.14,
    sheen: 0.5,
    sheenColor: new THREE.Color(0xe0c870),
    envMapIntensity: 1.0,
    metalness: 0.0,
  }, w)

  // Ajitsuke egg white — soy-marinated ivory (no emissive)
  const eggWhite = phys(0xe4d6c0, {
    roughness: 0.3,
    clearcoat: 0.5,
    clearcoatRoughness: 0.18,
    sheen: 0.22,
    sheenColor: new THREE.Color(0xf4e8d8),
    envMapIntensity: 0.9,
    metalness: 0.0,
  }, w)

  // Soft yolk — saturated amber via BASE COLOR only (kill emissive soft-blob)
  const eggYolk = phys(0xe06008, {
    roughness: 0.12,
    clearcoat: 0.94,
    clearcoatRoughness: 0.07,
    sheen: 0.6,
    sheenColor: new THREE.Color(0xf09818),
    sheenRoughness: 0.18,
    envMapIntensity: 1.2,
    metalness: 0.0,
    specularIntensity: 0.95,
  }, w)

  // Roasted nori — matte paper with green sheen (not shiny black plastic)
  const nori = phys(0x08140e, {
    roughness: 0.88,
    metalness: 0.0,
    sheen: 0.48,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0x3a6848),
    clearcoat: 0.02,
    clearcoatRoughness: 0.75,
  }, w)

  // Fresh scallion — wet cut face green (identity pop at mid FOV)
  const onion = phys(0x189028, {
    roughness: 0.26,
    clearcoat: 0.58,
    clearcoatRoughness: 0.14,
    sheen: 0.48,
    sheenColor: new THREE.Color(0x78d050),
    envMapIntensity: 1.0,
  }, w)

  const onionWhite = phys(0xe8f0e4, {
    roughness: 0.32,
    clearcoat: 0.35,
    clearcoatRoughness: 0.22,
  }, w)

  // Chashu: glazed fatty pork (distinct fat vs meat — still-life readable)
  const chashuFat = phys(0xe0a888, {
    roughness: 0.14,
    clearcoat: 0.82,
    clearcoatRoughness: 0.09,
    sheen: 0.52,
    sheenColor: new THREE.Color(0xf0d0b0),
    envMapIntensity: 1.15,
    metalness: 0.0,
  }, w)

  const chashuMeat = phys(0x6a2818, {
    roughness: 0.42,
    clearcoat: 0.35,
    clearcoatRoughness: 0.28,
    sheen: 0.22,
    sheenColor: new THREE.Color(0xb04830),
    envMapIntensity: 0.85,
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

  // Chili oil flecks — saturated red, NO emissive
  const chili = phys(0xb0140c, {
    roughness: 0.32,
    clearcoat: 0.48,
    envMapIntensity: 0.9,
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

  // Rim bead — thickness from above (glazed lip)
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

  // Undercut rim shadow — kills pure-white silhouette at beauty FOV
  const rimShadow = new THREE.Mesh(
    new THREE.TorusGeometry(0.41, 0.008, 8, 48),
    phys(0x8a7860, {
      roughness: 0.65,
      clearcoat: 0.15,
      clearcoatRoughness: 0.42,
      envMapIntensity: 0.5,
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

  // Foot ring
  const foot = new THREE.Mesh(
    new THREE.TorusGeometry(0.175, 0.012, 8, 40),
    phys(0xb8b0a0, {
      roughness: 0.22,
      clearcoat: 0.65,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.4,
    }, w),
  )
  foot.name = 'foot_ring'
  foot.rotation.x = Math.PI / 2
  foot.position.y = 0.012
  root.add(foot)

  // Iron speckles — glaze character (ref stoneware flecks); contrast for mid FOV
  const fleckMat = phys(0x6a5a42, { roughness: 0.74, clearcoat: 0.14 }, w)
  const fleckMatDark = phys(0x2e2418, { roughness: 0.82 }, w)
  for (let i = 0; i < 58; i++) {
    const fleck = new THREE.Mesh(
      new THREE.SphereGeometry(0.005 + seeded(i) * 0.0075, 4, 3),
      i % 3 === 0 ? fleckMatDark : fleckMat,
    )
    const a = seeded(i, 1) * Math.PI * 2
    const y = 0.03 + seeded(i, 2) * 0.28
    // Place ON outer surface: r grows with height (foot→rim flare)
    const r = 0.235 + y * 0.56 + seeded(i, 3) * 0.018
    fleck.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
    fleck.scale.set(1.4, 0.32, 1.8)
    root.add(fleck)
  }

  // --- Broth volume + meniscus ---
  const brothMesh = new THREE.Mesh(latheBrothVolume(), broth)
  brothMesh.name = 'broth'
  brothMesh.castShadow = false
  brothMesh.receiveShadow = recv
  root.add(brothMesh)
  meshes.broth = brothMesh

  // Specular surface disc — translucent liquid plane (noodles read through/on top)
  const surfaceDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.35, 40),
    phys(0xe2d8c4, {
      roughness: 0.1,
      metalness: 0.0,
      transparent: true,
      opacity: 0.42,
      clearcoat: 0.88,
      clearcoatRoughness: 0.07,
      transmission: 0.38,
      thickness: 0.06,
      ior: 1.34,
      envMapIntensity: 0.95,
      sheen: 0.22,
      sheenColor: new THREE.Color(0xf0e8d4),
      sheenRoughness: 0.25,
      specularIntensity: 0.7,
    }, w),
  )
  surfaceDisc.name = 'broth_surface'
  surfaceDisc.rotation.x = -Math.PI / 2
  surfaceDisc.position.y = 0.276
  root.add(surfaceDisc)
  meshes.broth_surface = surfaceDisc

  // Surface meniscus ring (wet climb at ceramic wall — cream, not white halo)
  const meniscus = new THREE.Mesh(
    new THREE.TorusGeometry(0.362, 0.016, 10, 48),
    phys(0xe8dcc8, {
      roughness: 0.06,
      metalness: 0.0,
      transparent: true,
      opacity: 0.48,
      clearcoat: 0.95,
      clearcoatRoughness: 0.04,
      transmission: 0.35,
      thickness: 0.07,
      ior: 1.34,
      envMapIntensity: 1.0,
      sheen: 0.25,
      sheenColor: new THREE.Color(0xf4ead8),
    }, w),
  )
  meniscus.name = 'meniscus'
  meniscus.rotation.x = Math.PI / 2
  meniscus.position.y = 0.294
  root.add(meniscus)
  meshes.meniscus = meniscus

  // Oil sheen patches (thin fat blooms — specular films, not solid yellow blobs)
  for (let i = 0; i < 9; i++) {
    const rr = 0.022 + seeded(i, 4) * 0.065
    const oil = new THREE.Mesh(new THREE.CircleGeometry(rr, 12), oilFilm)
    oil.rotation.x = -Math.PI / 2
    const a = seeded(i, 5) * Math.PI * 2
    const d = 0.05 + seeded(i, 6) * 0.17
    oil.position.set(Math.cos(a) * d, 0.2778 + i * 0.0002, Math.sin(a) * d)
    oil.scale.set(1 + seeded(i, 7) * 0.5, 1, 0.45 + seeded(i, 8) * 0.65)
    root.add(oil)
  }

  // Subtle fat swirl (thin specular ring, low opacity)
  const oilSwirl = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.009, 6, 24),
    phys(0xb89830, {
      roughness: 0.05,
      metalness: 0.08,
      transparent: true,
      opacity: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.15,
    }, w),
  )
  oilSwirl.name = 'oil_swirl'
  oilSwirl.rotation.x = Math.PI / 2
  oilSwirl.position.set(0.05, 0.278, -0.02)
  oilSwirl.scale.set(1.25, 1, 0.72)
  root.add(oilSwirl)

  // --- Noodles: thin wheat MICROFORM nest that BREAKS milky broth plane ---
  // Contrast rule: noodles warmer/darker wheat; broth milky cream — never same hue family.
  const noodleGroup = new THREE.Group()
  noodleGroup.name = 'noodles'
  const noodleMat = (i: number) =>
    i % 4 === 0 ? noodleDeep : i % 3 === 0 ? noodleWet : noodle
  // 36 thin strands — microform density; nest survives beauty/counter FOV without yellow blob mass
  for (let i = 0; i < 36; i++) {
    // Bias toward right-front quadrant where ref shows the nest
    const a0 = (i / 36) * Math.PI * 1.95 + 0.05 + seeded(i, 9) * 0.28
    const r = 0.05 + (i % 9) * 0.02 + seeded(i, 10) * 0.014
    // Lift nest above broth so strands silhouette as food, not submerged paste
    const base = 0.286 + (i % 6) * 0.007 + seeded(i, 11) * 0.007
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(
        Math.cos(a0) * r * 0.3,
        base - 0.003,
        Math.sin(a0) * r * 0.3,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 0.5) * r,
        base + 0.012 + seeded(i, 12) * 0.016,
        Math.sin(a0 + 0.5) * r * 0.95,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 1.15) * r * 0.92,
        base + 0.032 + (i % 5) * 0.009,
        Math.sin(a0 + 1.15) * r * 1.08,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 1.95) * r * 1.05,
        base + 0.018 + seeded(i, 13) * 0.01,
        Math.sin(a0 + 1.95) * r * 0.78,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 2.75) * r * 0.48,
        base + 0.004,
        Math.sin(a0 + 2.75) * r * 0.48,
      ),
    ])
    // Thin microform strands (0.0045–0.008) — individual wheat, not toy worms
    const radius = 0.0045 + (i % 6) * 0.00055
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 12, radius, 5, false),
      noodleMat(i),
    )
    tube.castShadow = false
    noodleGroup.add(tube)
  }
  // Secondary loops — nest density + peaks that clear broth plane
  for (let i = 0; i < 14; i++) {
    const a0 = seeded(i, 30) * Math.PI * 2
    const r = 0.06 + seeded(i, 31) * 0.15
    const lift = 0.29 + seeded(i, 32) * 0.024
    const loop = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a0) * r, lift, Math.sin(a0) * r),
      new THREE.Vector3(
        Math.cos(a0 + 0.9) * (r * 0.5),
        lift + 0.028 + (i % 3) * 0.006,
        Math.sin(a0 + 0.9) * (r * 0.5),
      ),
      new THREE.Vector3(
        Math.cos(a0 + 1.85) * r * 0.92,
        lift + 0.008,
        Math.sin(a0 + 1.85) * r * 0.92,
      ),
    ])
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(loop, 9, 0.005 + (i % 4) * 0.0006, 5, false),
      noodleMat(i + 5),
    )
    tube.castShadow = false
    noodleGroup.add(tube)
  }
  // Tight center coil — fills nest core so it doesn't read as empty yellow disc
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2 + 0.2
    const r = 0.035 + seeded(i, 70) * 0.03
    const lift = 0.292 + seeded(i, 71) * 0.012
    const coil = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a0) * r, lift, Math.sin(a0) * r),
      new THREE.Vector3(
        Math.cos(a0 + 1.1) * r * 0.7,
        lift + 0.02,
        Math.sin(a0 + 1.1) * r * 0.7,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 2.2) * r * 1.05,
        lift + 0.006,
        Math.sin(a0 + 2.2) * r,
      ),
    ])
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(coil, 8, 0.0048, 4, false),
      noodleMat(i + 2),
    )
    tube.castShadow = false
    noodleGroup.add(tube)
  }
  root.add(noodleGroup)
  nodes.noodles = noodleGroup

  // --- Chashu slices (rolled fat marble, glazed — still-life readable at FOV) ---
  const chashuGroup = new THREE.Group()
  chashuGroup.name = 'chashu'
  for (let i = 0; i < 3; i++) {
    const slice = new THREE.Group()
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.088, 18, 12),
      chashuFat,
    )
    body.scale.set(1.1 + seeded(i, 60) * 0.12, 0.16 + i * 0.01, 0.98 + seeded(i, 61) * 0.08)
    body.castShadow = cast
    slice.add(body)
    // Meat spiral rings (distinct dark vs fat)
    const meat = new THREE.Mesh(
      new THREE.TorusGeometry(0.058, 0.018, 8, 18),
      chashuMeat,
    )
    meat.rotation.x = Math.PI / 2
    meat.position.y = -0.005
    meat.scale.set(1.1, 1, 0.52)
    slice.add(meat)
    const meat2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.038, 0.012, 6, 14),
      phys(0x9a4030, {
        roughness: 0.3,
        clearcoat: 0.5,
        clearcoatRoughness: 0.18,
        sheen: 0.28,
        sheenColor: new THREE.Color(0xd06040),
      }, w),
    )
    meat2.rotation.x = Math.PI / 2
    meat2.position.y = 0.002
    meat2.scale.set(1.05, 1, 0.7)
    slice.add(meat2)
    const swirl = new THREE.Mesh(
      new THREE.TorusGeometry(0.026, 0.011, 6, 14),
      phys(0xf6e0c4, {
        roughness: 0.1,
        clearcoat: 0.85,
        clearcoatRoughness: 0.08,
        sheen: 0.5,
        sheenColor: new THREE.Color(0xffead4),
        envMapIntensity: 1.4,
      }, w),
    )
    swirl.rotation.x = Math.PI / 2
    swirl.position.y = 0.01
    swirl.scale.set(1.15, 1, 0.85)
    slice.add(swirl)
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 10, 8),
      phys(0xfcead4, {
        roughness: 0.08,
        clearcoat: 0.88,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.35,
      }, w),
    )
    core.scale.set(1.3, 0.42, 1.2)
    core.position.y = 0.011
    slice.add(core)
    // Soy glaze sheen on top face
    const glaze = new THREE.Mesh(
      new THREE.CircleGeometry(0.068, 16),
      phys(0xe8a870, {
        roughness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        transparent: true,
        opacity: 0.55,
        metalness: 0.08,
        envMapIntensity: 1.7,
        sheen: 0.4,
        sheenColor: new THREE.Color(0xffd0a0),
      }, w),
    )
    glaze.rotation.x = -Math.PI / 2
    glaze.position.y = 0.014
    slice.add(glaze)

    // Stack left-front so pork peeks under egg from beauty/counter FOV
    slice.position.set(-0.11 + i * 0.052, 0.292 + i * 0.015, -0.055 + i * 0.032)
    slice.rotation.set(0.35 + i * 0.08, 0.25 + i * 0.35, 0.45 + i * 0.1)
    chashuGroup.add(slice)
  }
  root.add(chashuGroup)
  nodes.chashu = chashuGroup

  // --- Soft-boiled egg (halved, yolk dominant — primary food identity) ---
  const egg = new THREE.Group()
  egg.name = 'egg'
  // Lifted + forward-left so yolk sells above rim from beauty/counter FOV
  egg.position.set(-0.11, 0.324, 0.11)
  egg.rotation.set(0.02, 0.12, 0.32)
  egg.scale.setScalar(1.28)

  const white = new THREE.Mesh(
    new THREE.SphereGeometry(0.092, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    eggWhite,
  )
  white.scale.set(1.22, 0.5, 1.28)
  white.castShadow = cast
  egg.add(white)

  // Cut face — moist white with soft specular
  const cutFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.084, 28),
    phys(0xf2e4d2, {
      roughness: 0.1,
      clearcoat: 0.88,
      clearcoatRoughness: 0.08,
      sheen: 0.35,
      sheenColor: new THREE.Color(0xfff6ee),
      envMapIntensity: 1.45,
      metalness: 0.0,
    }, w),
  )
  cutFace.rotation.x = -Math.PI / 2
  cutFace.position.y = 0.012
  cutFace.scale.set(1.14, 1.18, 1)
  egg.add(cutFace)

  // Soy-marinated edge ring (warm brown — ajitsuke identity)
  const eggRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.009, 6, 24),
    phys(0xa87840, {
      roughness: 0.28,
      clearcoat: 0.42,
      clearcoatRoughness: 0.18,
      sheen: 0.2,
      sheenColor: new THREE.Color(0xd0a060),
    }, w),
  )
  eggRim.rotation.x = Math.PI / 2
  eggRim.position.y = 0.013
  egg.add(eggRim)

  // Yolk dome — oversized saturated amber (identity pop at mid FOV)
  const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.058, 16, 12), eggYolk)
  yolk.position.set(0.006, 0.042, 0.002)
  yolk.scale.set(1.2, 0.72, 1.2)
  yolk.castShadow = cast
  egg.add(yolk)

  // Wet yolk membrane hilite — specular catch only (NO emissive blob)
  const yolkHilite = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 10, 8),
    phys(0xf0c860, {
      roughness: 0.06,
      transparent: true,
      opacity: 0.4,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      metalness: 0.0,
      envMapIntensity: 1.15,
    }, w),
  )
  yolkHilite.position.set(0.02, 0.062, 0.016)
  egg.add(yolkHilite)

  // Soft yolk sheen disc (runny center via clearcoat, not glow)
  const yolkSheen = new THREE.Mesh(
    new THREE.CircleGeometry(0.038, 14),
    phys(0xd05810, {
      roughness: 0.1,
      transparent: true,
      opacity: 0.32,
      clearcoat: 0.95,
      clearcoatRoughness: 0.06,
      metalness: 0.0,
      envMapIntensity: 1.0,
    }, w),
  )
  yolkSheen.rotation.x = -Math.PI / 2
  yolkSheen.position.set(0.006, 0.05, 0.002)
  egg.add(yolkSheen)

  root.add(egg)
  nodes.egg = egg

  // --- Nori sheet (dark paper curl — silhouette must read at beauty FOV) ---
  const noriGroup = new THREE.Group()
  noriGroup.name = 'nori'
  const noriMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.13, 0.26, 14, 1, true, -0.12, Math.PI * 0.72),
    nori,
  )
  noriMesh.castShadow = cast
  noriMesh.receiveShadow = recv
  noriGroup.add(noriMesh)
  const noriInner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.122, 0.127, 0.255, 12, 1, true, -0.1, Math.PI * 0.68),
    phys(0x14281a, {
      roughness: 0.72,
      sheen: 0.6,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color(0x4a7858),
      side: THREE.BackSide,
    }, w),
  )
  noriGroup.add(noriInner)
  // Top edge — slightly lighter paper catch
  const noriEdge = new THREE.Mesh(
    new THREE.TorusGeometry(0.127, 0.006, 5, 20, Math.PI * 0.72),
    phys(0x1c3a26, {
      roughness: 0.42,
      clearcoat: 0.22,
      sheen: 0.4,
      sheenColor: new THREE.Color(0x5a8868),
    }, w),
  )
  noriEdge.rotation.y = -0.12
  noriEdge.position.y = 0.128
  noriGroup.add(noriEdge)
  // Bottom dip into broth
  const noriDip = new THREE.Mesh(
    new THREE.TorusGeometry(0.126, 0.005, 4, 16, Math.PI * 0.5),
    phys(0x06100c, { roughness: 0.9 }, w),
  )
  noriDip.rotation.y = 0.1
  noriDip.position.y = -0.12
  noriGroup.add(noriDip)
  for (let i = 0; i < 10; i++) {
    const speck = new THREE.Mesh(
      new THREE.SphereGeometry(0.0045, 4, 3),
      phys(i % 2 === 0 ? 0x2a4a32 : 0x1a3024, { roughness: 0.6 }, w),
    )
    const sa = -0.08 + seeded(i, 40) * 0.65
    const sy = -0.1 + seeded(i, 41) * 0.2
    speck.position.set(Math.sin(sa) * 0.126, sy, Math.cos(sa) * 0.126)
    noriGroup.add(speck)
  }
  // Upright back-right, tall enough to clear rim from side FOV
  noriGroup.position.set(0.14, 0.4, -0.13)
  noriGroup.rotation.set(-0.1, 0.95, 0.03)
  root.add(noriGroup)
  nodes.nori = noriGroup

  // --- Green onion rings (dense central scallion pile — ref identity) ---
  const onionGroup = new THREE.Group()
  onionGroup.name = 'scallions'
  for (let i = 0; i < 34; i++) {
    const isWhite = i % 5 === 0
    const ringR = 0.011 + seeded(i, 12) * 0.012
    const tube = 0.0038 + seeded(i, 13) * 0.0028
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringR, tube, 5, 12),
      isWhite ? onionWhite : onion,
    )
    const ox = 0.02 + (seeded(i, 14) - 0.5) * 0.07
    const oz = 0.035 + (seeded(i, 15) - 0.5) * 0.06
    const oy = 0.298 + seeded(i, 16) * 0.034 + (i % 5) * 0.005
    ring.position.set(ox, oy, oz)
    ring.rotation.set(
      seeded(i, 17) * 1.8,
      seeded(i, 18) * 2.2,
      seeded(i, 19) * 1.6,
    )
    ring.castShadow = false
    onionGroup.add(ring)
    if (i % 3 === 0) {
      const face = new THREE.Mesh(
        new THREE.CircleGeometry(tube * 1.8, 8),
        phys(isWhite ? 0xf4faf0 : 0x88dc70, {
          roughness: 0.14,
          clearcoat: 0.68,
          clearcoatRoughness: 0.12,
        }, w),
      )
      face.position.copy(ring.position)
      face.position.y += 0.0035
      face.rotation.set(ring.rotation.x, ring.rotation.y, ring.rotation.z)
      onionGroup.add(face)
    }
  }
  root.add(onionGroup)
  nodes.scallions = onionGroup

  // --- Chili oil flecks (rest on broth surface) ---
  const chiliGroup = new THREE.Group()
  chiliGroup.name = 'chili'
  for (let i = 0; i < 14; i++) {
    const flake = new THREE.Mesh(
      new THREE.SphereGeometry(0.0045 + seeded(i, 50) * 0.0035, 5, 4),
      chili,
    )
    flake.scale.set(1.35, 0.32, 1.15)
    const a = seeded(i, 51) * Math.PI * 2
    const r = 0.05 + seeded(i, 52) * 0.2
    flake.position.set(Math.cos(a) * r, 0.28 + seeded(i, 53) * 0.004, Math.sin(a) * r)
    chiliGroup.add(flake)
  }
  root.add(chiliGroup)
  nodes.chili = chiliGroup

  // --- Sesame seeds (on broth + noodles) ---
  const sesameGroup = new THREE.Group()
  sesameGroup.name = 'sesame'
  for (let i = 0; i < 22; i++) {
    const black = i % 4 === 0
    const seed = new THREE.Mesh(
      new THREE.SphereGeometry(0.004 + seeded(i, 18) * 0.0026, 5, 4),
      black ? seedBlack : seedWhite,
    )
    seed.scale.set(1.55, 0.45, 0.9)
    const a = seeded(i, 19) * Math.PI * 2
    const r = Math.sqrt(seeded(i, 20)) * 0.26
    seed.position.set(Math.cos(a) * r, 0.282 + seeded(i, 21) * 0.006, Math.sin(a) * r)
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
      new THREE.CylinderGeometry(0.006, 0.01, 0.54, 10),
      wood,
    )
    shaft.castShadow = cast
    stick.add(shaft)
    const brand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0068, 0.0075, 0.1, 10),
      woodTip,
    )
    brand.position.y = 0.18
    stick.add(brand)
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.006, 0.034, 8),
      wood,
    )
    tip.position.y = -0.285
    tip.rotation.x = Math.PI
    stick.add(tip)

    stick.position.set(0.13 + i * 0.024, 0.5, 0.015 + i * 0.012)
    stick.rotation.z = -0.5
    stick.rotation.y = 0.14 + i * 0.07
    stick.rotation.x = 0.1 * i
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
    noodleGroup.rotation.y = Math.sin(t * 0.1) * 0.018
    // Subtle oil shimmer — keep opacity low so noodles/egg stay readable
    const m = meniscus.material as THREE.MeshPhysicalMaterial
    if (m && 'opacity' in m) {
      m.opacity = 0.44 + Math.sin(t * 1.5) * 0.05
    }
    const s = surfaceDisc.material as THREE.MeshPhysicalMaterial
    if (s && 'opacity' in s) {
      s.opacity = 0.38 + Math.sin(t * 1.2 + 0.5) * 0.05
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
