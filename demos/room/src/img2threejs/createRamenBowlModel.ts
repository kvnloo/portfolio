/**
 * img2threejs form/material pass — RamenBowl (v2 fidelity).
 * Reference: public/assets/ramen.jpg
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

function latheBowl(outer = true): THREE.LatheGeometry {
  // Profile: foot → body flare → rim (matches ceramic bowl silhouette)
  const pts = outer
    ? [
        new THREE.Vector2(0.18, 0.0),
        new THREE.Vector2(0.22, 0.03),
        new THREE.Vector2(0.28, 0.06),
        new THREE.Vector2(0.34, 0.12),
        new THREE.Vector2(0.38, 0.2),
        new THREE.Vector2(0.4, 0.28),
        new THREE.Vector2(0.41, 0.32),
        new THREE.Vector2(0.39, 0.33),
      ]
    : [
        new THREE.Vector2(0.16, 0.04),
        new THREE.Vector2(0.26, 0.08),
        new THREE.Vector2(0.32, 0.14),
        new THREE.Vector2(0.35, 0.22),
        new THREE.Vector2(0.36, 0.3),
      ]
  return new THREE.LatheGeometry(pts, 48)
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
    pass: 'form+material-v2',
  }

  const nodes: Record<string, THREE.Object3D> = { root }
  const meshes: Record<string, THREE.Mesh> = {}
  const sockets: Record<string, THREE.Object3D> = {}
  const colliders: Record<string, unknown> = {}
  const destructionGroups: Record<string, THREE.Object3D[]> = {}

  const ceramic = phys(0xf4ede4, {
    roughness: 0.22,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    sheen: 0.25,
    sheenColor: new THREE.Color(0xf0e6d8),
    metalness: 0.02,
  }, w)
  const ceramicBlue = phys(0x5a7a98, {
    roughness: 0.35,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
  }, w)
  const broth = phys(0xf2e6c4, {
    roughness: 0.08,
    metalness: 0.1,
    transmission: 0.28,
    thickness: 0.6,
    transparent: true,
    opacity: 0.93,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
    ior: 1.35,
    attenuationColor: new THREE.Color(0xe8c060),
    attenuationDistance: 0.35,
  }, w)
  const noodle = phys(0xf8e8b0, { roughness: 0.55, sheen: 0.15 }, w)
  const eggWhite = phys(0xfffaf2, { roughness: 0.4, clearcoat: 0.2 }, w)
  const eggYolk = phys(0xf0a018, {
    roughness: 0.28,
    emissive: 0x442200,
    emissiveIntensity: 0.08,
    clearcoat: 0.35,
  }, w)
  const nori = phys(0x152818, { roughness: 0.7 }, w)
  const onion = phys(0x4ec85a, { roughness: 0.45 }, w)
  const chashu = phys(0xc47850, { roughness: 0.5, clearcoat: 0.15 }, w)
  const wood = phys(0x3a2418, { roughness: 0.5 }, w)
  const woodTip = phys(0xb84a3a, { roughness: 0.4 }, w)

  // Outer bowl (lathe)
  const outer = new THREE.Mesh(latheBowl(true), ceramic)
  outer.name = 'bowl_outer'
  outer.castShadow = cast
  outer.receiveShadow = recv
  root.add(outer)
  meshes.bowl_outer = outer

  // Inner glaze
  const inner = new THREE.Mesh(latheBowl(false), ceramic)
  inner.name = 'bowl_inner'
  inner.scale.x = -1
  root.add(inner)

  // Blue ring
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.01, 10, 48), ceramicBlue)
  band.rotation.x = Math.PI / 2
  band.position.y = 0.1
  root.add(band)

  // Broth
  const brothMesh = new THREE.Mesh(new THREE.CircleGeometry(0.33, 48), broth)
  brothMesh.rotation.x = -Math.PI / 2
  brothMesh.position.y = 0.26
  brothMesh.receiveShadow = recv
  root.add(brothMesh)
  meshes.broth = brothMesh

  // Oil sheen disc
  const oil = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 24),
    phys(0xe8d080, {
      roughness: 0.05,
      metalness: 0.15,
      transparent: true,
      opacity: 0.45,
      clearcoat: 1,
    }, w),
  )
  oil.rotation.x = -Math.PI / 2
  oil.position.set(0.08, 0.262, -0.05)
  root.add(oil)

  // Noodles — denser tubes
  const noodleGroup = new THREE.Group()
  noodleGroup.name = 'noodles'
  for (let i = 0; i < 22; i++) {
    const a0 = (i / 22) * Math.PI * 2
    const r = 0.08 + (i % 4) * 0.035
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a0) * r * 0.6, 0.27, Math.sin(a0) * r * 0.6),
      new THREE.Vector3(Math.cos(a0 + 0.9) * r, 0.28 + (i % 3) * 0.012, Math.sin(a0 + 0.9) * r * 0.9),
      new THREE.Vector3(Math.cos(a0 + 1.8) * r * 0.7, 0.275, Math.sin(a0 + 1.8) * r),
      new THREE.Vector3(Math.cos(a0 + 2.7) * r * 0.85, 0.285, Math.sin(a0 + 2.7) * r * 0.5),
    ])
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.01 + (i % 3) * 0.002, 6, false), noodle)
    tube.castShadow = cast
    noodleGroup.add(tube)
  }
  root.add(noodleGroup)
  nodes.noodles = noodleGroup

  // Chashu slices
  for (let i = 0; i < 3; i++) {
    const slice = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.018, 20),
      chashu,
    )
    slice.position.set(-0.05 + i * 0.04, 0.275 + i * 0.012, -0.12 + i * 0.03)
    slice.rotation.set(0.2, 0.3 + i * 0.2, 0.4)
    slice.castShadow = cast
    root.add(slice)
  }

  // Soft egg
  const egg = new THREE.Group()
  egg.name = 'egg'
  egg.position.set(-0.14, 0.28, 0.1)
  egg.rotation.z = 0.4
  const white = new THREE.Mesh(new THREE.SphereGeometry(0.085, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), eggWhite)
  white.scale.set(1.05, 0.5, 1.15)
  white.castShadow = cast
  egg.add(white)
  const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.042, 18, 14), eggYolk)
  yolk.position.set(0.01, 0.025, 0)
  egg.add(yolk)
  root.add(egg)
  nodes.egg = egg

  // Nori
  const noriMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.17, 0.006), nori)
  noriMesh.position.set(0.2, 0.34, -0.04)
  noriMesh.rotation.set(-0.2, 0.45, 0.12)
  noriMesh.castShadow = cast
  root.add(noriMesh)

  // Green onion rings
  for (let i = 0; i < 12; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.005, 6, 14), onion)
    ring.position.set(
      0.02 + (i % 4) * 0.025 - 0.03,
      0.272 + (i % 3) * 0.008,
      0.04 + Math.floor(i / 4) * 0.025,
    )
    ring.rotation.set(Math.random() * 1.5, Math.random(), Math.random())
    root.add(ring)
  }

  // Sesame seeds
  const seedMat = phys(0xf5f0e0, { roughness: 0.6 }, w)
  for (let i = 0; i < 20; i++) {
    const seed = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 4), seedMat)
    const a = Math.random() * Math.PI * 2
    const r = Math.random() * 0.22
    seed.position.set(Math.cos(a) * r, 0.268, Math.sin(a) * r)
    root.add(seed)
  }

  // Chopsticks
  const sticks = new THREE.Group()
  sticks.name = 'chopsticks'
  for (let i = 0; i < 2; i++) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.01, 0.58, 8), wood)
    stick.position.set(0.14 + i * 0.022, 0.48, 0.02)
    stick.rotation.z = -0.52
    stick.rotation.y = 0.12 + i * 0.04
    stick.castShadow = cast
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.07, 8), woodTip)
    tip.position.y = 0.26
    stick.add(tip)
    sticks.add(stick)
  }
  root.add(sticks)
  nodes.chopsticks = sticks

  const socket = new THREE.Object3D()
  socket.name = 'socket_project'
  socket.position.set(0, 0.4, 0)
  root.add(socket)
  sockets.project = socket

  colliders.root = { type: 'sphere', radius: 0.42, offset: [0, 0.18, 0] }
  destructionGroups.ceramic = [outer]
  destructionGroups.toppings = [egg, noriMesh, noodleGroup]

  root.userData.sculptRuntime = { nodes, meshes, sockets, colliders, destructionGroups } satisfies ProceduralModelRuntime
  root.userData.tick = (t: number) => {
    noodleGroup.rotation.y = Math.sin(t * 0.12) * 0.03
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
