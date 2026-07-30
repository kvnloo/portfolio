/**
 * img2threejs form/material pass — RamenBowl (v5 glaze+food residual #4).
 * Reference: public/assets/ramen.jpg + imagine-v2 appetite plate
 *
 * Residual #4 (loop-r1): ceramic glaze soft + toppings read toy prims.
 * v5: hard clearcoat/env punch, milky broth layers, distinct food mats
 * (egg yolk, nori paper curl, chashu fat marble, wet scallion cuts).
 * Perf: lathe ≤32, tubes 12×4, noodles 20, no noodle/sesame shadows.
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
 * Broth volume: concave surface + strong meniscus climb at wall
 * (ref: creamy tonkotsu pools high against ceramic).
 */
function latheBrothVolume(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.0, 0.218),
    new THREE.Vector2(0.1, 0.219),
    new THREE.Vector2(0.2, 0.224),
    new THREE.Vector2(0.28, 0.235),
    new THREE.Vector2(0.33, 0.252),
    // Meniscus climb against ceramic
    new THREE.Vector2(0.355, 0.268),
    new THREE.Vector2(0.365, 0.278),
    new THREE.Vector2(0.368, 0.285),
    new THREE.Vector2(0.36, 0.288),
    new THREE.Vector2(0.34, 0.282),
    new THREE.Vector2(0.28, 0.27),
    new THREE.Vector2(0.18, 0.26),
    new THREE.Vector2(0.08, 0.255),
    new THREE.Vector2(0.0, 0.253),
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
    pass: 'form+material-v5-glaze-food',
  }

  const nodes: Record<string, THREE.Object3D> = { root }
  const meshes: Record<string, THREE.Mesh> = {}
  const sockets: Record<string, THREE.Object3D> = {}
  const colliders: Record<string, unknown> = {}
  const destructionGroups: Record<string, THREE.Object3D[]> = {}

  // --- Materials (food-forward physical, grounded in ramen.jpg) ---
  // Speckled warm ceramic — darker base so clearcoat glaze *reads* at beauty FOV
  // (critic: "glaze soft" = pure white matte; need contrast + hard coat)
  const ceramic = phys(0xe6d8c4, {
    roughness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.045,
    envMapIntensity: 1.55,
    sheen: 0.55,
    sheenRoughness: 0.32,
    sheenColor: new THREE.Color(0xfff4e4),
    metalness: 0.0,
    specularIntensity: 1.0,
    specularColor: new THREE.Color(0xfff8ee),
  }, w)

  // Inner cavity: wet glass-like glaze (broth reflections)
  const ceramicInner = phys(0xf8f2e6, {
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.75,
    sheen: 0.3,
    sheenColor: new THREE.Color(0xfffaf0),
    specularIntensity: 1.0,
  }, w)

  // Cobalt rim bands (ref dual blue lines — punchier so they survive mid FOV)
  const ceramicBlue = phys(0x264a68, {
    roughness: 0.2,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    metalness: 0.1,
    envMapIntensity: 1.35,
    sheen: 0.2,
    sheenColor: new THREE.Color(0x6a9ab8),
  }, w)

  // Creamy tonkotsu: milky-white (not yellow), fatty, slight transmission
  const broth = phys(0xf4ecda, {
    roughness: 0.035,
    metalness: 0.05,
    transmission: 0.22,
    thickness: 1.05,
    transparent: true,
    opacity: 0.96,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.4,
    ior: 1.35,
    attenuationColor: new THREE.Color(0xead8a8),
    attenuationDistance: 0.28,
    sheen: 0.65,
    sheenColor: new THREE.Color(0xfff0c0),
    sheenRoughness: 0.16,
  }, w)

  const oilFilm = phys(0xecd878, {
    roughness: 0.015,
    metalness: 0.18,
    transparent: true,
    opacity: 0.48,
    clearcoat: 1,
    clearcoatRoughness: 0.01,
    transmission: 0.5,
    thickness: 0.05,
    ior: 1.43,
    envMapIntensity: 1.5,
  }, w)

  // Wet wheat noodles — clearcoat so tubes catch key light at beauty FOV
  const noodle = phys(0xf0dc8c, {
    roughness: 0.28,
    sheen: 0.45,
    sheenColor: new THREE.Color(0xfff0b0),
    sheenRoughness: 0.35,
    clearcoat: 0.55,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.15,
  }, w)
  // Slightly deeper strand for nest depth (not single flat yellow)
  const noodleDeep = phys(0xe0c868, {
    roughness: 0.34,
    sheen: 0.35,
    sheenColor: new THREE.Color(0xf0d888),
    clearcoat: 0.4,
    clearcoatRoughness: 0.26,
  }, w)

  // Ajitsuke egg white — soy-marinated warm ivory (not pure plastic white)
  const eggWhite = phys(0xf4e8d8, {
    roughness: 0.22,
    clearcoat: 0.65,
    clearcoatRoughness: 0.16,
    sheen: 0.28,
    sheenColor: new THREE.Color(0xfff8f0),
    envMapIntensity: 1.15,
  }, w)

  // Marinated soft yolk — saturated amber, wet membrane, emissive warmth
  const eggYolk = phys(0xf09808, {
    roughness: 0.12,
    emissive: 0x885500,
    emissiveIntensity: 0.28,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
    sheen: 0.55,
    sheenColor: new THREE.Color(0xffc830),
    envMapIntensity: 1.3,
  }, w)

  // Roasted nori — matte paper with green sheen (not shiny black plastic)
  const nori = phys(0x0c1c12, {
    roughness: 0.72,
    metalness: 0.02,
    sheen: 0.45,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color(0x3a6850),
    clearcoat: 0.08,
    clearcoatRoughness: 0.55,
  }, w)

  // Fresh scallion — wet cut face green
  const onion = phys(0x2ea03c, {
    roughness: 0.28,
    clearcoat: 0.55,
    clearcoatRoughness: 0.2,
    sheen: 0.4,
    sheenColor: new THREE.Color(0xa8f090),
    envMapIntensity: 1.1,
  }, w)

  const onionWhite = phys(0xeef6ea, {
    roughness: 0.32,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
  }, w)

  // Chashu: glazed fatty pork (distinct fat vs meat — not single toy disc)
  const chashuFat = phys(0xe0b090, {
    roughness: 0.18,
    clearcoat: 0.75,
    clearcoatRoughness: 0.12,
    sheen: 0.55,
    sheenColor: new THREE.Color(0xffe0c0),
    envMapIntensity: 1.25,
  }, w)

  const chashuMeat = phys(0x9a4838, {
    roughness: 0.42,
    clearcoat: 0.35,
    clearcoatRoughness: 0.28,
    sheen: 0.2,
    sheenColor: new THREE.Color(0xd07050),
  }, w)

  const wood = phys(0xc4a078, {
    roughness: 0.48,
    clearcoat: 0.12,
  }, w)

  const woodTip = phys(0xc44838, {
    roughness: 0.35,
    clearcoat: 0.2,
  }, w)

  const seedWhite = phys(0xf8f4e8, { roughness: 0.55 }, w)
  const seedBlack = phys(0x1a1410, { roughness: 0.65 }, w)

  // Chili oil flecks (ref red dots)
  const chili = phys(0xc02814, {
    roughness: 0.32,
    clearcoat: 0.45,
    emissive: 0x501000,
    emissiveIntensity: 0.12,
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

  // Rim bead — thickness from above
  const rimBead = new THREE.Mesh(
    new THREE.TorusGeometry(0.414, 0.012, 12, 64),
    ceramic,
  )
  rimBead.name = 'rim_bead'
  rimBead.rotation.x = Math.PI / 2
  rimBead.position.y = 0.334
  rimBead.castShadow = cast
  root.add(rimBead)
  meshes.rim_bead = rimBead

  // Dual blue bands on INNER rim (ref identity: two cobalt rings near lip)
  const bandInnerA = new THREE.Mesh(
    new THREE.TorusGeometry(0.378, 0.0045, 8, 56),
    ceramicBlue,
  )
  bandInnerA.name = 'band_blue_inner_a'
  bandInnerA.rotation.x = Math.PI / 2
  bandInnerA.position.y = 0.312
  root.add(bandInnerA)

  const bandInnerB = new THREE.Mesh(
    new THREE.TorusGeometry(0.372, 0.0035, 8, 56),
    ceramicBlue,
  )
  bandInnerB.name = 'band_blue_inner_b'
  bandInnerB.rotation.x = Math.PI / 2
  bandInnerB.position.y = 0.3
  root.add(bandInnerB)

  // Outer mid-body decorative band
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.378, 0.007, 10, 56),
    ceramicBlue,
  )
  band.name = 'band_blue'
  band.rotation.x = Math.PI / 2
  band.position.y = 0.1
  root.add(band)

  // Foot ring (reads silhouette from beauty angle)
  const foot = new THREE.Mesh(
    new THREE.TorusGeometry(0.175, 0.012, 8, 40),
    phys(0xe8e0d4, { roughness: 0.35, clearcoat: 0.4 }, w),
  )
  foot.name = 'foot_ring'
  foot.rotation.x = Math.PI / 2
  foot.position.y = 0.012
  root.add(foot)

  // Speckle flecks on outer ceramic (ref iron-speck glaze)
  const fleckMat = phys(0xa89880, { roughness: 0.72 }, w)
  const fleckMatDark = phys(0x6a5a48, { roughness: 0.75 }, w)
  for (let i = 0; i < 36; i++) {
    const fleck = new THREE.Mesh(
      new THREE.SphereGeometry(0.0035 + seeded(i) * 0.0045, 4, 3),
      i % 3 === 0 ? fleckMatDark : fleckMat,
    )
    const a = seeded(i, 1) * Math.PI * 2
    const y = 0.05 + seeded(i, 2) * 0.24
    const r = 0.27 + seeded(i, 3) * 0.13
    fleck.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
    fleck.scale.set(1, 0.45, 1.5)
    root.add(fleck)
  }

  // --- Broth volume + meniscus ---
  const brothMesh = new THREE.Mesh(latheBrothVolume(), broth)
  brothMesh.name = 'broth'
  brothMesh.castShadow = false
  brothMesh.receiveShadow = recv
  root.add(brothMesh)
  meshes.broth = brothMesh

  // Specular surface disc (oil-smooth plane that catches key light)
  const surfaceDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.33, 40),
    phys(0xf6eed8, {
      roughness: 0.04,
      metalness: 0.08,
      transparent: true,
      opacity: 0.55,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      transmission: 0.25,
      thickness: 0.06,
      ior: 1.34,
      sheen: 0.5,
      sheenColor: new THREE.Color(0xfff0c0),
    }, w),
  )
  surfaceDisc.name = 'broth_surface'
  surfaceDisc.rotation.x = -Math.PI / 2
  surfaceDisc.position.y = 0.262
  root.add(surfaceDisc)
  meshes.broth_surface = surfaceDisc

  // Surface meniscus ring (highlight catch at wall)
  const meniscus = new THREE.Mesh(
    new THREE.TorusGeometry(0.352, 0.014, 10, 48),
    phys(0xf8f0d8, {
      roughness: 0.04,
      transparent: true,
      opacity: 0.62,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      transmission: 0.35,
      thickness: 0.1,
      ior: 1.35,
    }, w),
  )
  meniscus.name = 'meniscus'
  meniscus.rotation.x = Math.PI / 2
  meniscus.position.y = 0.278
  root.add(meniscus)
  meshes.meniscus = meniscus

  // Oil sheen patches (tonkotsu fat blooms)
  for (let i = 0; i < 7; i++) {
    const rr = 0.045 + seeded(i, 4) * 0.09
    const oil = new THREE.Mesh(new THREE.CircleGeometry(rr, 18), oilFilm)
    oil.rotation.x = -Math.PI / 2
    const a = seeded(i, 5) * Math.PI * 2
    const d = 0.03 + seeded(i, 6) * 0.2
    oil.position.set(Math.cos(a) * d, 0.264 + i * 0.00035, Math.sin(a) * d)
    oil.scale.set(1 + seeded(i, 7) * 0.5, 1, 0.65 + seeded(i, 8) * 0.55)
    root.add(oil)
  }

  // --- Noodles (thicker wet nest, right-side pile like ref) ---
  const noodleGroup = new THREE.Group()
  noodleGroup.name = 'noodles'
  // 20 strands — within perf spirit (was 18); slightly thicker, lower radial segs
  for (let i = 0; i < 20; i++) {
    // Bias toward front-right quadrant where ref shows the nest
    const a0 =
      (i / 20) * Math.PI * 1.65 + 0.15 + seeded(i, 9) * 0.35
    const r = 0.07 + (i % 6) * 0.028 + seeded(i, 10) * 0.022
    const lift = 0.258 + (i % 5) * 0.009 + seeded(i, 11) * 0.006
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a0) * r * 0.5, lift, Math.sin(a0) * r * 0.5),
      new THREE.Vector3(
        Math.cos(a0 + 0.65) * r,
        lift + 0.014 + seeded(i, 12) * 0.022,
        Math.sin(a0 + 0.65) * r * 0.95,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 1.4) * r * 0.82,
        lift + 0.022 + (i % 3) * 0.008,
        Math.sin(a0 + 1.4) * r * 1.05,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 2.2) * r * 0.95,
        lift + 0.012,
        Math.sin(a0 + 2.2) * r * 0.7,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 3.0) * r * 0.55,
        lift + 0.008,
        Math.sin(a0 + 3.0) * r * 0.65,
      ),
    ])
    // Thicker strands read at beauty FOV (0.011–0.018)
    const radius = 0.011 + (i % 5) * 0.0016
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 12, radius, 4, false),
      noodle,
    )
    tube.castShadow = false
    noodleGroup.add(tube)
  }
  // Secondary short loops for density without extra long tubes
  for (let i = 0; i < 6; i++) {
    const a0 = seeded(i, 30) * Math.PI * 2
    const r = 0.1 + seeded(i, 31) * 0.1
    const lift = 0.265 + seeded(i, 32) * 0.015
    const loop = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a0) * r, lift, Math.sin(a0) * r),
      new THREE.Vector3(
        Math.cos(a0 + 0.9) * (r * 0.7),
        lift + 0.02,
        Math.sin(a0 + 0.9) * (r * 0.7),
      ),
      new THREE.Vector3(
        Math.cos(a0 + 1.8) * r,
        lift + 0.006,
        Math.sin(a0 + 1.8) * r,
      ),
    ])
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(loop, 8, 0.01, 4, false),
      noodle,
    )
    tube.castShadow = false
    noodleGroup.add(tube)
  }
  root.add(noodleGroup)
  nodes.noodles = noodleGroup

  // --- Chashu slices (folded, partly submerged under egg) ---
  const chashuGroup = new THREE.Group()
  chashuGroup.name = 'chashu'
  for (let i = 0; i < 3; i++) {
    const slice = new THREE.Group()
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.074, 0.013, 22),
      chashuFat,
    )
    body.castShadow = cast
    slice.add(body)
    // Meat ring underside
    const meat = new THREE.Mesh(
      new THREE.TorusGeometry(0.042, 0.013, 8, 18),
      chashuMeat,
    )
    meat.rotation.x = Math.PI / 2
    meat.position.y = -0.004
    meat.scale.set(1, 1, 0.5)
    slice.add(meat)
    // Fat swirl center
    const swirl = new THREE.Mesh(
      new THREE.TorusGeometry(0.022, 0.008, 6, 14),
      phys(0xecd0b0, { roughness: 0.25, clearcoat: 0.45 }, w),
    )
    swirl.rotation.x = Math.PI / 2
    swirl.position.y = 0.006
    slice.add(swirl)
    // Glaze highlight disc
    const glaze = new THREE.Mesh(
      new THREE.CircleGeometry(0.05, 16),
      phys(0xf0c8a0, {
        roughness: 0.12,
        clearcoat: 0.7,
        transparent: true,
        opacity: 0.35,
      }, w),
    )
    glaze.rotation.x = -Math.PI / 2
    glaze.position.y = 0.0075
    slice.add(glaze)

    // Stack left-center under egg (ref: pork peeks through broth)
    slice.position.set(-0.08 + i * 0.048, 0.272 + i * 0.012, -0.1 + i * 0.03)
    slice.rotation.set(0.4 + i * 0.1, 0.3 + i * 0.4, 0.6 + i * 0.12)
    chashuGroup.add(slice)
  }
  root.add(chashuGroup)
  nodes.chashu = chashuGroup

  // --- Soft-boiled egg (halved, yolk dominant at beauty distance) ---
  const egg = new THREE.Group()
  egg.name = 'egg'
  egg.position.set(-0.14, 0.288, 0.08)
  egg.rotation.set(0.12, 0.25, 0.5)

  const white = new THREE.Mesh(
    new THREE.SphereGeometry(0.082, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    eggWhite,
  )
  white.scale.set(1.15, 0.52, 1.22)
  white.castShadow = cast
  egg.add(white)

  // Cut face disc (glossy white + slight soy tint edge)
  const cutFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.076, 28),
    phys(0xfff6ec, {
      roughness: 0.22,
      clearcoat: 0.55,
      clearcoatRoughness: 0.18,
    }, w),
  )
  cutFace.rotation.x = -Math.PI / 2
  cutFace.position.y = 0.01
  cutFace.scale.set(1.08, 1.12, 1)
  egg.add(cutFace)

  // Marinated rim ring
  const eggRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.07, 0.005, 6, 24),
    phys(0xd8b898, { roughness: 0.4, clearcoat: 0.2 }, w),
  )
  eggRim.rotation.x = Math.PI / 2
  eggRim.position.y = 0.011
  egg.add(eggRim)

  // Yolk dome — larger/brighter so it sells at mid distance
  const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 12), eggYolk)
  yolk.position.set(0.006, 0.03, 0.002)
  yolk.scale.set(1.08, 0.72, 1.08)
  yolk.castShadow = cast
  egg.add(yolk)

  // Yolk highlight
  const yolkHilite = new THREE.Mesh(
    new THREE.SphereGeometry(0.014, 10, 8),
    phys(0xffe890, {
      roughness: 0.08,
      transparent: true,
      opacity: 0.6,
      emissive: 0xbb7700,
      emissiveIntensity: 0.22,
    }, w),
  )
  yolkHilite.position.set(0.016, 0.046, 0.012)
  egg.add(yolkHilite)

  root.add(egg)
  nodes.egg = egg

  // --- Nori sheet (slight curl, triangular read, upright at back-right) ---
  const noriGroup = new THREE.Group()
  noriGroup.name = 'nori'
  // Curved sheet via lathe-ish bent plane: thin boxes stacked with angle
  const noriMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.004), nori)
  noriMesh.castShadow = cast
  noriGroup.add(noriMesh)
  // Second panel for fold / thickness
  const noriFold = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.195, 0.0035),
    phys(0x0c1e14, { roughness: 0.5, clearcoat: 0.15 }, w),
  )
  noriFold.position.set(0.07, 0, 0.01)
  noriFold.rotation.y = 0.35
  noriGroup.add(noriFold)
  // Glossy top edge
  const noriEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.162, 0.008, 0.005),
    phys(0x1a3424, { roughness: 0.35, clearcoat: 0.4 }, w),
  )
  noriEdge.position.y = 0.095
  noriGroup.add(noriEdge)
  // Speckle on nori (roasted sheen)
  for (let i = 0; i < 8; i++) {
    const speck = new THREE.Mesh(
      new THREE.SphereGeometry(0.004, 4, 3),
      phys(0x2a4a30, { roughness: 0.5 }, w),
    )
    speck.position.set(
      -0.05 + seeded(i, 40) * 0.1,
      -0.06 + seeded(i, 41) * 0.14,
      0.003,
    )
    noriGroup.add(speck)
  }
  noriGroup.position.set(0.18, 0.36, -0.08)
  noriGroup.rotation.set(-0.3, 0.55, 0.08)
  root.add(noriGroup)
  nodes.nori = noriGroup

  // --- Green onion rings (dense central scallion pile — ref identity) ---
  const onionGroup = new THREE.Group()
  onionGroup.name = 'scallions'
  for (let i = 0; i < 22; i++) {
    const isWhite = i % 5 === 0
    const ringR = 0.012 + seeded(i, 12) * 0.01
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringR, 0.004 + seeded(i, 13) * 0.002, 5, 12),
      isWhite ? onionWhite : onion,
    )
    // Tight mound slightly right of center (ref pile)
    const ox = 0.02 + (seeded(i, 14) - 0.5) * 0.08
    const oz = 0.04 + (seeded(i, 15) - 0.5) * 0.07
    const oy = 0.272 + seeded(i, 16) * 0.028 + (i % 4) * 0.004
    ring.position.set(ox, oy, oz)
    ring.rotation.set(
      seeded(i, 17) * 1.8,
      seeded(i, 18) * 2.2,
      seeded(i, 19) * 1.6,
    )
    ring.castShadow = false
    onionGroup.add(ring)
  }
  root.add(onionGroup)
  nodes.scallions = onionGroup

  // --- Chili oil flecks (tiny red dots on broth) ---
  const chiliGroup = new THREE.Group()
  chiliGroup.name = 'chili'
  for (let i = 0; i < 10; i++) {
    const flake = new THREE.Mesh(
      new THREE.SphereGeometry(0.004 + seeded(i, 50) * 0.003, 5, 4),
      chili,
    )
    flake.scale.set(1.2, 0.4, 1)
    const a = seeded(i, 51) * Math.PI * 2
    const r = 0.05 + seeded(i, 52) * 0.18
    flake.position.set(Math.cos(a) * r, 0.266 + seeded(i, 53) * 0.004, Math.sin(a) * r)
    chiliGroup.add(flake)
  }
  root.add(chiliGroup)
  nodes.chili = chiliGroup

  // --- Sesame seeds (white + black mix) ---
  const sesameGroup = new THREE.Group()
  sesameGroup.name = 'sesame'
  for (let i = 0; i < 20; i++) {
    const black = i % 4 === 0
    const seed = new THREE.Mesh(
      new THREE.SphereGeometry(0.004 + seeded(i, 18) * 0.0025, 5, 4),
      black ? seedBlack : seedWhite,
    )
    seed.scale.set(1.5, 0.5, 0.85)
    const a = seeded(i, 19) * Math.PI * 2
    const r = Math.sqrt(seeded(i, 20)) * 0.26
    seed.position.set(Math.cos(a) * r, 0.268 + seeded(i, 21) * 0.006, Math.sin(a) * r)
    seed.rotation.set(seeded(i, 22), seeded(i, 23), seeded(i, 24))
    sesameGroup.add(seed)
  }
  root.add(sesameGroup)
  nodes.sesame = sesameGroup

  // --- Chopsticks (light wood + red lacquer brand band, rim-resting) ---
  const sticks = new THREE.Group()
  sticks.name = 'chopsticks'
  for (let i = 0; i < 2; i++) {
    const stick = new THREE.Group()
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.009, 0.52, 10),
      wood,
    )
    shaft.castShadow = cast
    stick.add(shaft)
    // Red brand band near handle end
    const brand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0062, 0.007, 0.09, 10),
      woodTip,
    )
    brand.position.y = 0.17
    stick.add(brand)
    // Tip point
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.0055, 0.032, 8),
      wood,
    )
    tip.position.y = -0.275
    tip.rotation.x = Math.PI
    stick.add(tip)

    // Rest on rim at back-right (ref pose)
    stick.position.set(0.12 + i * 0.022, 0.48, 0.02 + i * 0.01)
    stick.rotation.z = -0.52
    stick.rotation.y = 0.12 + i * 0.06
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
    noodleGroup.rotation.y = Math.sin(t * 0.12) * 0.025
    // Subtle oil shimmer via meniscus opacity pulse
    const m = meniscus.material as THREE.MeshPhysicalMaterial
    if (m && 'opacity' in m) {
      m.opacity = 0.55 + Math.sin(t * 1.6) * 0.1
    }
    const s = surfaceDisc.material as THREE.MeshPhysicalMaterial
    if (s && 'opacity' in s) {
      s.opacity = 0.48 + Math.sin(t * 1.3 + 0.5) * 0.08
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
