/**
 * img2threejs form/material pass for RamenBowl.
 * Pipeline: Imagine ref → forge probe/DI/assessment/spec → generate_threejs_factory (blockout)
 * → this file (agent form+material refinement against public/assets/ramen.jpg).
 * Skill: https://github.com/img2threejs/img2threejs
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

function mat(
  color: string | number,
  opts: Partial<THREE.MeshPhysicalMaterialParameters> = {},
  wireframe?: boolean,
) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.55,
    metalness: 0,
    wireframe: wireframe ?? false,
    ...opts,
  })
}

/** Rebuild reference ramen bowl as animation-ready THREE.Group (code-only). */
export function createRamenBowlModel(options: ProceduralModelOptions = {}): THREE.Group {
  const cast = options.castShadow ?? true
  const recv = options.receiveShadow ?? true
  const w = options.wireframe

  const root = new THREE.Group()
  root.name = 'RamenBowl'
  root.userData.img2threejs = {
    skill: 'img2threejs@1.4.x',
    source: 'demos/room/public/assets/ramen.jpg',
    pass: 'form+material',
    note: 'Single-view reconstruction; rear of bowl inferred by radial symmetry.',
  }

  const nodes: Record<string, THREE.Object3D> = { root }
  const meshes: Record<string, THREE.Mesh> = {}
  const sockets: Record<string, THREE.Object3D> = {}
  const colliders: Record<string, unknown> = {}
  const destructionGroups: Record<string, THREE.Object3D[]> = {}

  const ceramic = mat(0xf2ebe0, {
    roughness: 0.42,
    clearcoat: 0.35,
    clearcoatRoughness: 0.35,
    sheen: 0.15,
    sheenColor: new THREE.Color(0xe8dcc8),
  }, w)
  const ceramicBlue = mat(0x6a8aa8, { roughness: 0.5, metalness: 0.05 }, w)
  const broth = mat(0xf0e4c8, {
    roughness: 0.18,
    metalness: 0.05,
    transmission: 0.12,
    thickness: 0.4,
    transparent: true,
    opacity: 0.96,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
  }, w)
  const noodle = mat(0xf5e6b8, { roughness: 0.65 }, w)
  const eggWhite = mat(0xfff8ee, { roughness: 0.45 }, w)
  const eggYolk = mat(0xf0a020, { roughness: 0.35, emissive: 0x331100, emissiveIntensity: 0.05 }, w)
  const nori = mat(0x1a2a18, { roughness: 0.75 }, w)
  const onion = mat(0x5ec45a, { roughness: 0.55 }, w)
  const wood = mat(0x3a2418, { roughness: 0.55 }, w)
  const woodTip = mat(0xc45a4a, { roughness: 0.45 }, w)

  // Bowl exterior (flared cylinder)
  const bowlOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.32, 0.28, 48, 1, true),
    ceramic,
  )
  bowlOuter.name = 'bowl_outer'
  bowlOuter.position.y = 0.14
  bowlOuter.castShadow = cast
  bowlOuter.receiveShadow = recv
  root.add(bowlOuter)
  meshes.bowl_outer = bowlOuter

  // Bowl interior
  const bowlInner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.29, 0.26, 48, 1, true),
    ceramic,
  )
  bowlInner.name = 'bowl_inner'
  bowlInner.position.y = 0.145
  bowlInner.scale.x = -1
  root.add(bowlInner)

  // Rim ring
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.022, 12, 48), ceramic)
  rim.name = 'rim'
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.28
  rim.castShadow = cast
  root.add(rim)
  meshes.rim = rim

  // Blue underglaze band
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.008, 8, 48),
    ceramicBlue,
  )
  band.rotation.x = Math.PI / 2
  band.position.y = 0.08
  root.add(band)

  // Base foot
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.04, 32), ceramic)
  foot.position.y = 0.02
  foot.receiveShadow = recv
  root.add(foot)

  // Broth surface
  const brothMesh = new THREE.Mesh(new THREE.CircleGeometry(0.34, 48), broth)
  brothMesh.name = 'broth'
  brothMesh.rotation.x = -Math.PI / 2
  brothMesh.position.y = 0.22
  brothMesh.receiveShadow = recv
  root.add(brothMesh)
  meshes.broth = brothMesh

  // Noodle coils (tubes)
  const noodleGroup = new THREE.Group()
  noodleGroup.name = 'noodles'
  for (let i = 0; i < 14; i++) {
    const a0 = (i / 14) * Math.PI * 2
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a0) * 0.12, 0.23, Math.sin(a0) * 0.12),
      new THREE.Vector3(Math.cos(a0 + 0.8) * 0.22, 0.24 + (i % 3) * 0.01, Math.sin(a0 + 0.8) * 0.18),
      new THREE.Vector3(Math.cos(a0 + 1.6) * 0.1, 0.23, Math.sin(a0 + 1.6) * 0.2),
      new THREE.Vector3(Math.cos(a0 + 2.4) * 0.2, 0.245, Math.sin(a0 + 2.4) * 0.08),
    ])
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 24, 0.012, 6, false),
      noodle,
    )
    tube.castShadow = cast
    noodleGroup.add(tube)
  }
  root.add(noodleGroup)
  nodes.noodles = noodleGroup

  // Soft-boiled egg half
  const egg = new THREE.Group()
  egg.name = 'egg'
  egg.position.set(-0.14, 0.24, 0.08)
  egg.rotation.z = 0.35
  const white = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2), eggWhite)
  white.scale.set(1, 0.55, 1.1)
  white.castShadow = cast
  egg.add(white)
  const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), eggYolk)
  yolk.position.set(0.01, 0.02, 0)
  egg.add(yolk)
  root.add(egg)
  nodes.egg = egg
  meshes.egg_yolk = yolk

  // Nori sheet
  const noriMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.008), nori)
  noriMesh.name = 'nori'
  noriMesh.position.set(0.18, 0.3, -0.05)
  noriMesh.rotation.set(-0.15, 0.4, 0.1)
  noriMesh.castShadow = cast
  root.add(noriMesh)
  meshes.nori = noriMesh

  // Green onion rings
  for (let i = 0; i < 8; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.018, 0.006, 6, 12),
      onion,
    )
    ring.position.set(
      0.02 + (i % 3) * 0.03,
      0.235 + (i % 2) * 0.01,
      0.05 + Math.floor(i / 3) * 0.03,
    )
    ring.rotation.set(Math.random(), Math.random(), Math.random())
    root.add(ring)
  }

  // Chopsticks
  const sticks = new THREE.Group()
  sticks.name = 'chopsticks'
  for (let i = 0; i < 2; i++) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.55, 8), wood)
    stick.position.set(0.12 + i * 0.025, 0.42, 0.02)
    stick.rotation.z = -0.55
    stick.rotation.y = 0.15 + i * 0.05
    stick.castShadow = cast
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8), woodTip)
    tip.position.y = 0.25
    stick.add(tip)
    sticks.add(stick)
  }
  root.add(sticks)
  nodes.chopsticks = sticks

  // Sockets for interaction / project portals
  const socketBowl = new THREE.Object3D()
  socketBowl.name = 'socket_project'
  socketBowl.position.set(0, 0.35, 0)
  root.add(socketBowl)
  sockets.project = socketBowl

  colliders.root = { type: 'sphere', radius: 0.45, offset: [0, 0.15, 0] }
  destructionGroups.ceramic = [bowlOuter, rim, foot]
  destructionGroups.toppings = [egg, noriMesh, noodleGroup]

  root.userData.sculptRuntime = {
    nodes,
    meshes,
    sockets,
    colliders,
    destructionGroups,
  } satisfies ProceduralModelRuntime

  // Subtle idle steam-ready tick
  root.userData.tick = (t: number) => {
    noodleGroup.rotation.y = Math.sin(t * 0.15) * 0.02
  }

  return root
}

export function createRamenBowlLookDevLights(
  mode: 'neutral' | 'grazing' | 'reference' = 'reference',
): THREE.Group {
  const lights = new THREE.Group()
  lights.name = 'RamenBowl_lookDev'
  lights.add(new THREE.HemisphereLight(0xfff0d6, 0x2a2018, mode === 'grazing' ? 0.3 : 0.7))
  const key = new THREE.DirectionalLight(0xffcf8a, mode === 'grazing' ? 3.5 : 2.4)
  key.position.set(mode === 'grazing' ? 6 : -3, mode === 'grazing' ? 1.2 : 6, 4)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  lights.add(key)
  const fill = new THREE.DirectionalLight(0x88aadd, 0.55)
  fill.position.set(3, 2, -2)
  lights.add(fill)
  const rim = new THREE.PointLight(0xff8844, 1.2, 8)
  rim.position.set(0, 1.5, -1.5)
  lights.add(rim)
  return lights
}
