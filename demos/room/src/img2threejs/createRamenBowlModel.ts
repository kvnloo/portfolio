/**
 * img2threejs form/material pass — RamenBowl (v3 appetite fidelity).
 * Reference: public/assets/ramen.jpg
 *
 * Mesh-first: ceramic clearcoat + rim thickness, broth meniscus volume,
 * egg/nori/chopsticks/chashu/sesame/scallion readable without DOM photo.
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
    new THREE.Vector2(0.16, 0.0),
    new THREE.Vector2(0.2, 0.02),
    new THREE.Vector2(0.24, 0.045),
    new THREE.Vector2(0.3, 0.09),
    new THREE.Vector2(0.36, 0.16),
    new THREE.Vector2(0.4, 0.24),
    new THREE.Vector2(0.415, 0.3),
    new THREE.Vector2(0.42, 0.325),
    // Rim lip — thickness reads in profile
    new THREE.Vector2(0.435, 0.335),
    new THREE.Vector2(0.43, 0.342),
    new THREE.Vector2(0.4, 0.338),
  ]
  return new THREE.LatheGeometry(pts, 32)
}

/** Inner cavity (glazed). */
function latheInnerBowl(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.14, 0.035),
    new THREE.Vector2(0.22, 0.06),
    new THREE.Vector2(0.3, 0.12),
    new THREE.Vector2(0.35, 0.2),
    new THREE.Vector2(0.375, 0.28),
    new THREE.Vector2(0.385, 0.32),
    new THREE.Vector2(0.39, 0.332),
  ]
  return new THREE.LatheGeometry(pts, 32)
}

/** Broth volume: flat-ish bottom with raised meniscus at bowl wall. */
function latheBrothVolume(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.0, 0.22),
    new THREE.Vector2(0.12, 0.22),
    new THREE.Vector2(0.22, 0.225),
    new THREE.Vector2(0.3, 0.24),
    new THREE.Vector2(0.34, 0.255),
    // Meniscus climb against ceramic
    new THREE.Vector2(0.355, 0.268),
    new THREE.Vector2(0.36, 0.275),
    new THREE.Vector2(0.355, 0.278),
    new THREE.Vector2(0.34, 0.272),
    new THREE.Vector2(0.28, 0.262),
    new THREE.Vector2(0.18, 0.255),
    new THREE.Vector2(0.08, 0.252),
    new THREE.Vector2(0.0, 0.25),
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
    skill: 'img2threejs@1.4.x',
    source: 'demos/room/public/assets/ramen.jpg',
    pass: 'form+material-v3-appetite',
  }

  const nodes: Record<string, THREE.Object3D> = { root }
  const meshes: Record<string, THREE.Mesh> = {}
  const sockets: Record<string, THREE.Object3D> = {}
  const colliders: Record<string, unknown> = {}
  const destructionGroups: Record<string, THREE.Object3D[]> = {}

  // --- Materials (food-forward physical) ---
  const ceramic = phys(0xf2ebe2, {
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    sheen: 0.35,
    sheenRoughness: 0.4,
    sheenColor: new THREE.Color(0xf8f0e4),
    metalness: 0.0,
    specularIntensity: 0.85,
  }, w)

  const ceramicInner = phys(0xfaf6f0, {
    roughness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    sheen: 0.2,
    sheenColor: new THREE.Color(0xfff8ee),
  }, w)

  const ceramicBlue = phys(0x4a6d8c, {
    roughness: 0.28,
    clearcoat: 0.65,
    clearcoatRoughness: 0.15,
    metalness: 0.05,
  }, w)

  // Creamy tonkotsu: pale, fatty, slight transmission + strong clearcoat sheen
  const broth = phys(0xf0e4c4, {
    roughness: 0.06,
    metalness: 0.05,
    transmission: 0.22,
    thickness: 0.85,
    transparent: true,
    opacity: 0.96,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    ior: 1.36,
    attenuationColor: new THREE.Color(0xe8c878),
    attenuationDistance: 0.28,
    sheen: 0.4,
    sheenColor: new THREE.Color(0xffe8a0),
    sheenRoughness: 0.25,
  }, w)

  const oilFilm = phys(0xe8d070, {
    roughness: 0.03,
    metalness: 0.12,
    transparent: true,
    opacity: 0.38,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    transmission: 0.4,
    thickness: 0.05,
    ior: 1.4,
  }, w)

  const noodle = phys(0xf6e8a8, {
    roughness: 0.48,
    sheen: 0.25,
    sheenColor: new THREE.Color(0xfff0c0),
    sheenRoughness: 0.55,
    clearcoat: 0.15,
    clearcoatRoughness: 0.4,
  }, w)

  const eggWhite = phys(0xfffaf4, {
    roughness: 0.32,
    clearcoat: 0.45,
    clearcoatRoughness: 0.25,
    sheen: 0.15,
    sheenColor: new THREE.Color(0xffffff),
  }, w)

  const eggYolk = phys(0xef9810, {
    roughness: 0.22,
    emissive: 0x553300,
    emissiveIntensity: 0.12,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    sheen: 0.35,
    sheenColor: new THREE.Color(0xffc040),
  }, w)

  const nori = phys(0x0e1c12, {
    roughness: 0.62,
    metalness: 0.04,
    sheen: 0.2,
    sheenColor: new THREE.Color(0x2a4a30),
    clearcoat: 0.12,
  }, w)

  const onion = phys(0x3db84a, {
    roughness: 0.38,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
    sheen: 0.2,
    sheenColor: new THREE.Color(0xa8f0a0),
  }, w)

  const onionWhite = phys(0xe8f0e0, {
    roughness: 0.42,
    clearcoat: 0.15,
  }, w)

  // Chashu: fatty pork with glazed surface + pink meat undertone
  const chashuFat = phys(0xd4a078, {
    roughness: 0.35,
    clearcoat: 0.4,
    clearcoatRoughness: 0.25,
    sheen: 0.3,
    sheenColor: new THREE.Color(0xffd0a0),
  }, w)

  const chashuMeat = phys(0xb06048, {
    roughness: 0.55,
    clearcoat: 0.2,
  }, w)

  const wood = phys(0x4a2e1c, {
    roughness: 0.55,
    clearcoat: 0.08,
  }, w)

  const woodTip = phys(0xc4503a, {
    roughness: 0.38,
    clearcoat: 0.15,
  }, w)

  const seedWhite = phys(0xf8f4e8, { roughness: 0.55 }, w)
  const seedBlack = phys(0x1a1410, { roughness: 0.65 }, w)

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

  // Rim bead — reads thickness when viewed from above
  const rimBead = new THREE.Mesh(
    new THREE.TorusGeometry(0.412, 0.011, 12, 64),
    ceramic,
  )
  rimBead.name = 'rim_bead'
  rimBead.rotation.x = Math.PI / 2
  rimBead.position.y = 0.336
  rimBead.castShadow = cast
  root.add(rimBead)
  meshes.rim_bead = rimBead

  // Blue decorative band near mid-body
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.375, 0.008, 10, 56),
    ceramicBlue,
  )
  band.name = 'band_blue'
  band.rotation.x = Math.PI / 2
  band.position.y = 0.105
  root.add(band)

  // Second thin blue line near rim (matches ref ceramic)
  const bandRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.405, 0.005, 8, 56),
    ceramicBlue,
  )
  bandRim.rotation.x = Math.PI / 2
  bandRim.position.y = 0.3
  root.add(bandRim)

  // Speckle flecks on outer ceramic
  const fleckMat = phys(0xb8a890, { roughness: 0.7 }, w)
  for (let i = 0; i < 28; i++) {
    const fleck = new THREE.Mesh(new THREE.SphereGeometry(0.004 + seeded(i) * 0.004, 4, 3), fleckMat)
    const a = seeded(i, 1) * Math.PI * 2
    const y = 0.06 + seeded(i, 2) * 0.22
    const r = 0.28 + seeded(i, 3) * 0.12
    fleck.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
    fleck.scale.set(1, 0.5, 1.4)
    root.add(fleck)
  }

  // --- Broth volume + meniscus (not a flat disc) ---
  const brothMesh = new THREE.Mesh(latheBrothVolume(), broth)
  brothMesh.name = 'broth'
  brothMesh.castShadow = false
  brothMesh.receiveShadow = recv
  root.add(brothMesh)
  meshes.broth = brothMesh

  // Surface meniscus ring (highlight catch)
  const meniscus = new THREE.Mesh(
    new THREE.TorusGeometry(0.345, 0.012, 10, 48),
    phys(0xf4ecc8, {
      roughness: 0.05,
      transparent: true,
      opacity: 0.55,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      transmission: 0.3,
      thickness: 0.08,
      ior: 1.35,
    }, w),
  )
  meniscus.name = 'meniscus'
  meniscus.rotation.x = Math.PI / 2
  meniscus.position.y = 0.272
  root.add(meniscus)
  meshes.meniscus = meniscus

  // Oil sheen patches (tonkotsu fat)
  for (let i = 0; i < 5; i++) {
    const rr = 0.06 + seeded(i, 4) * 0.08
    const oil = new THREE.Mesh(new THREE.CircleGeometry(rr, 20), oilFilm)
    oil.rotation.x = -Math.PI / 2
    const a = seeded(i, 5) * Math.PI * 2
    const d = 0.04 + seeded(i, 6) * 0.16
    oil.position.set(Math.cos(a) * d, 0.276 + i * 0.0004, Math.sin(a) * d)
    oil.scale.set(1 + seeded(i, 7) * 0.4, 1, 0.7 + seeded(i, 8) * 0.5)
    root.add(oil)
  }

  // --- Noodles (thicker, denser nest) ---
  const noodleGroup = new THREE.Group()
  noodleGroup.name = 'noodles'
  for (let i = 0; i < 18; i++) {
    const a0 = (i / 32) * Math.PI * 2 + seeded(i, 9) * 0.4
    const r = 0.06 + (i % 5) * 0.032 + seeded(i, 10) * 0.02
    const lift = 0.255 + (i % 4) * 0.01
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a0) * r * 0.55, lift, Math.sin(a0) * r * 0.55),
      new THREE.Vector3(
        Math.cos(a0 + 0.7) * r,
        lift + 0.012 + seeded(i, 11) * 0.02,
        Math.sin(a0 + 0.7) * r * 0.95,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 1.5) * r * 0.75,
        lift + 0.008,
        Math.sin(a0 + 1.5) * r * 1.05,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 2.4) * r * 0.9,
        lift + 0.018 + (i % 3) * 0.006,
        Math.sin(a0 + 2.4) * r * 0.55,
      ),
      new THREE.Vector3(
        Math.cos(a0 + 3.2) * r * 0.5,
        lift + 0.01,
        Math.sin(a0 + 3.2) * r * 0.7,
      ),
    ])
    const radius = 0.009 + (i % 4) * 0.0025
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 16, radius, 5, false),
      noodle,
    )
    tube.castShadow = false
    noodleGroup.add(tube)
  }
  root.add(noodleGroup)
  nodes.noodles = noodleGroup

  // --- Chashu slices (layered fat/meat discs, folded) ---
  const chashuGroup = new THREE.Group()
  chashuGroup.name = 'chashu'
  for (let i = 0; i < 3; i++) {
    const slice = new THREE.Group()
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.068, 0.014, 24),
      chashuFat,
    )
    body.castShadow = cast
    slice.add(body)
    // Meat ring underside
    const meat = new THREE.Mesh(
      new THREE.TorusGeometry(0.04, 0.012, 8, 20),
      chashuMeat,
    )
    meat.rotation.x = Math.PI / 2
    meat.position.y = -0.004
    meat.scale.set(1, 1, 0.55)
    slice.add(meat)
    // Fat swirl center
    const swirl = new THREE.Mesh(
      new THREE.TorusGeometry(0.02, 0.008, 6, 16),
      phys(0xe8c8a8, { roughness: 0.3, clearcoat: 0.35 }, w),
    )
    swirl.rotation.x = Math.PI / 2
    swirl.position.y = 0.006
    slice.add(swirl)

    slice.position.set(-0.06 + i * 0.045, 0.278 + i * 0.014, -0.13 + i * 0.028)
    slice.rotation.set(0.35 + i * 0.08, 0.25 + i * 0.35, 0.55 + i * 0.1)
    chashuGroup.add(slice)
  }
  root.add(chashuGroup)
  nodes.chashu = chashuGroup

  // --- Soft-boiled egg (halved, yolk readable) ---
  const egg = new THREE.Group()
  egg.name = 'egg'
  egg.position.set(-0.15, 0.285, 0.1)
  egg.rotation.set(0.15, 0.3, 0.55)

  // Outer white half-dome
  const white = new THREE.Mesh(
    new THREE.SphereGeometry(0.078, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    eggWhite,
  )
  white.scale.set(1.1, 0.55, 1.2)
  white.castShadow = cast
  egg.add(white)

  // Cut face disc (glossy white)
  const cutFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.072, 28),
    phys(0xfff8f0, {
      roughness: 0.28,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
    }, w),
  )
  cutFace.rotation.x = -Math.PI / 2
  cutFace.position.y = 0.01
  cutFace.scale.set(1.05, 1.1, 1)
  egg.add(cutFace)

  // Yolk dome on cut face
  const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 10), eggYolk)
  yolk.position.set(0.008, 0.028, 0.002)
  yolk.scale.set(1.05, 0.7, 1.05)
  yolk.castShadow = cast
  egg.add(yolk)

  // Yolk highlight
  const yolkHilite = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 10, 8),
    phys(0xffe080, {
      roughness: 0.1,
      transparent: true,
      opacity: 0.55,
      emissive: 0xaa6600,
      emissiveIntensity: 0.15,
    }, w),
  )
  yolkHilite.position.set(0.015, 0.042, 0.01)
  egg.add(yolkHilite)

  root.add(egg)
  nodes.egg = egg

  // --- Nori sheet (slight curl, dark seaweed) ---
  const noriGroup = new THREE.Group()
  noriGroup.name = 'nori'
  // Slightly curved sheet via thin box + second layer
  const noriMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.005), nori)
  noriMesh.castShadow = cast
  noriGroup.add(noriMesh)
  // Subtle glossy edge
  const noriEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.142, 0.01, 0.006),
    phys(0x1a3020, { roughness: 0.4, clearcoat: 0.3 }, w),
  )
  noriEdge.position.y = 0.085
  noriGroup.add(noriEdge)
  noriGroup.position.set(0.2, 0.35, -0.05)
  noriGroup.rotation.set(-0.25, 0.5, 0.1)
  root.add(noriGroup)
  nodes.nori = noriGroup

  // --- Green onion rings (scallion pile) ---
  const onionGroup = new THREE.Group()
  onionGroup.name = 'scallions'
  for (let i = 0; i < 16; i++) {
    const isWhite = i % 5 === 0
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.014 + seeded(i, 12) * 0.008, 0.0045, 6, 16),
      isWhite ? onionWhite : onion,
    )
    ring.position.set(
      0.01 + (i % 5) * 0.022 - 0.04,
      0.278 + (i % 4) * 0.007 + seeded(i, 13) * 0.004,
      0.02 + Math.floor(i / 5) * 0.022 + seeded(i, 14) * 0.01,
    )
    ring.rotation.set(seeded(i, 15) * 1.8, seeded(i, 16) * 2, seeded(i, 17) * 1.5)
    ring.castShadow = cast
    onionGroup.add(ring)
  }
  root.add(onionGroup)
  nodes.scallions = onionGroup

  // --- Sesame seeds (white + black mix) ---
  const sesameGroup = new THREE.Group()
  sesameGroup.name = 'sesame'
  for (let i = 0; i < 18; i++) {
    const black = i % 4 === 0
    const seed = new THREE.Mesh(
      new THREE.SphereGeometry(0.0045 + seeded(i, 18) * 0.0025, 6, 5),
      black ? seedBlack : seedWhite,
    )
    seed.scale.set(1.4, 0.55, 0.9)
    const a = seeded(i, 19) * Math.PI * 2
    const r = Math.sqrt(seeded(i, 20)) * 0.24
    seed.position.set(Math.cos(a) * r, 0.274 + seeded(i, 21) * 0.006, Math.sin(a) * r)
    seed.rotation.set(seeded(i, 22), seeded(i, 23), seeded(i, 24))
    sesameGroup.add(seed)
  }
  root.add(sesameGroup)
  nodes.sesame = sesameGroup

  // --- Chopsticks (tapered wood + red lacquer tip) ---
  const sticks = new THREE.Group()
  sticks.name = 'chopsticks'
  for (let i = 0; i < 2; i++) {
    const stick = new THREE.Group()
    // Main shaft taper
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0095, 0.52, 10),
      wood,
    )
    shaft.castShadow = cast
    stick.add(shaft)
    // Red-stained tip (upper third toward handle in ref is red text; tip is plain — use red band near top as branding)
    const brand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0062, 0.007, 0.08, 10),
      woodTip,
    )
    brand.position.y = 0.18
    stick.add(brand)
    // Tip point
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.0055, 0.035, 8),
      wood,
    )
    tip.position.y = -0.275
    tip.rotation.x = Math.PI
    stick.add(tip)

    stick.position.set(0.13 + i * 0.024, 0.5, 0.015 + i * 0.008)
    stick.rotation.z = -0.55
    stick.rotation.y = 0.1 + i * 0.05
    stick.rotation.x = 0.08 * i
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
    noodleGroup.rotation.y = Math.sin(t * 0.12) * 0.03
    // Subtle oil shimmer via meniscus opacity pulse
    const m = meniscus.material as THREE.MeshPhysicalMaterial
    if (m && 'opacity' in m) {
      m.opacity = 0.48 + Math.sin(t * 1.8) * 0.08
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
