/**
 * img2threejs form/material pass — BobaCupPair (v3 appetite fidelity).
 * Reference: public/assets/boba.jpg
 *
 * PET cup IOR/transmission, liquid meniscus, tapioca spheres,
 * condensation, striped straws, brown-sugar syrup streaks + taro foam.
 */
import * as THREE from 'three'
import type { ProceduralModelOptions, ProceduralModelRuntime } from './createRamenBowlModel'

function phys(
  color: number,
  opts: Partial<THREE.MeshPhysicalMaterialParameters> = {},
  wireframe?: boolean,
) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.35,
    metalness: 0,
    wireframe: !!wireframe,
    ...opts,
  })
}

function seeded(i: number, salt = 0) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** Flared PET cup wall profile (open top). */
function latheCupWall(): THREE.LatheGeometry {
  // x = radius, y = height
  const pts = [
    new THREE.Vector2(0.148, 0.02),
    new THREE.Vector2(0.15, 0.08),
    new THREE.Vector2(0.145, 0.16),
    new THREE.Vector2(0.138, 0.26),
    new THREE.Vector2(0.128, 0.36),
    new THREE.Vector2(0.122, 0.44),
  ]
  return new THREE.LatheGeometry(pts, 48)
}

/** Liquid body with surface meniscus. */
function latheLiquid(fillH: number, bottomR: number, topR: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = []
  // Bottom center up outer wall then meniscus inward
  pts.push(new THREE.Vector2(0.0, 0.02))
  pts.push(new THREE.Vector2(bottomR * 0.85, 0.02))
  pts.push(new THREE.Vector2(bottomR, 0.03))
  const steps = 8
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = 0.03 + t * (fillH - 0.03)
    const r = bottomR + (topR - bottomR) * t
    pts.push(new THREE.Vector2(r, y))
  }
  // Meniscus lip
  pts.push(new THREE.Vector2(topR + 0.004, fillH + 0.006))
  pts.push(new THREE.Vector2(topR - 0.01, fillH + 0.01))
  pts.push(new THREE.Vector2(topR * 0.55, fillH + 0.004))
  pts.push(new THREE.Vector2(0.0, fillH))
  return new THREE.LatheGeometry(pts, 40)
}

function makeStripedStraw(
  colors: [number, number],
  segments: number,
  length: number,
  radius: number,
  w?: boolean,
): THREE.Group {
  const g = new THREE.Group()
  g.name = 'straw'
  const segH = length / segments
  for (let i = 0; i < segments; i++) {
    const mat = phys(i % 2 === 0 ? colors[0] : colors[1], {
      roughness: 0.32,
      clearcoat: 0.35,
      clearcoatRoughness: 0.2,
    }, w)
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, segH * 1.02, 12), mat)
    seg.position.y = -length / 2 + segH * 0.5 + i * segH
    g.add(seg)
  }
  // Hollow hint — inner darker tube
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, length * 0.98, 10, 1, true),
    phys(0x222228, { roughness: 0.5, transparent: true, opacity: 0.35, side: THREE.DoubleSide }, w),
  )
  g.add(inner)
  // Top rim
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.78, radius * 0.18, 8, 16),
    phys(colors[0], { roughness: 0.3 }, w),
  )
  rim.rotation.x = Math.PI / 2
  rim.position.y = length / 2
  g.add(rim)
  return g
}

function makeCup(
  options: ProceduralModelOptions,
  variant: 'brown-sugar' | 'taro',
): THREE.Group {
  const cast = options.castShadow ?? true
  const w = options.wireframe
  const g = new THREE.Group()
  g.name = variant === 'brown-sugar' ? 'BrownSugarBoba' : 'TaroBoba'
  const isBrown = variant === 'brown-sugar'

  // PET plastic — high IOR, transmission, thin shell clearcoat
  const plastic = phys(0xeaf6ff, {
    roughness: 0.06,
    metalness: 0,
    transmission: 0.88,
    thickness: 0.045,
    transparent: true,
    opacity: 0.28,
    ior: 1.52,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    specularIntensity: 1,
    envMapIntensity: 1.2,
  }, w)

  const plasticOpaqueBottom = phys(0xdceef8, {
    roughness: 0.1,
    transmission: 0.55,
    thickness: 0.08,
    transparent: true,
    opacity: 0.55,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  }, w)

  // --- Cup body (open cylinder shell) ---
  const body = new THREE.Mesh(latheCupWall(), plastic)
  body.name = 'cup_wall'
  body.castShadow = cast
  body.receiveShadow = true
  // Flip so normals face outward for transmission
  body.scale.x = -1
  g.add(body)

  // Outer thin shell for double-wall thickness read
  const outerShell = new THREE.Mesh(latheCupWall(), plastic)
  outerShell.scale.set(1.025, 1, 1.025)
  outerShell.position.y = 0
  g.add(outerShell)

  // Bottom disc + slight dome
  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.148, 0.145, 0.018, 36),
    plasticOpaqueBottom,
  )
  bottom.position.y = 0.012
  bottom.castShadow = cast
  g.add(bottom)

  // Stacking ring ridges
  for (const y of [0.1, 0.2, 0.3, 0.38]) {
    const r = 0.15 - (y - 0.1) * 0.035
    const ridge = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.0035, 6, 40),
      phys(0xd0e8f5, {
        roughness: 0.12,
        transmission: 0.6,
        transparent: true,
        opacity: 0.45,
        clearcoat: 0.8,
        ior: 1.5,
      }, w),
    )
    ridge.rotation.x = Math.PI / 2
    ridge.position.y = y
    g.add(ridge)
  }

  // Dome lid — thicker PET, slight frost
  const lidMat = phys(0xf0f7ff, {
    roughness: 0.08,
    transmission: 0.7,
    thickness: 0.1,
    transparent: true,
    opacity: 0.42,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    ior: 1.5,
  }, w)
  const lid = new THREE.Mesh(
    new THREE.SphereGeometry(0.138, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.52),
    lidMat,
  )
  lid.name = 'lid'
  lid.position.y = 0.44
  lid.castShadow = cast
  g.add(lid)

  // Lid flange / seal
  const seal = new THREE.Mesh(
    new THREE.TorusGeometry(0.128, 0.014, 10, 40),
    phys(0x1c1c22, {
      roughness: 0.45,
      clearcoat: 0.2,
    }, w),
  )
  seal.rotation.x = Math.PI / 2
  seal.position.y = 0.435
  g.add(seal)

  // Lid snap rim
  const lidRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.132, 0.13, 0.02, 36, 1, true),
    plastic,
  )
  lidRim.position.y = 0.43
  g.add(lidRim)

  // Straw hole plug ring on dome
  const hole = new THREE.Mesh(
    new THREE.TorusGeometry(0.02, 0.004, 8, 16),
    phys(0xc8dce8, { roughness: 0.2, clearcoat: 0.5 }, w),
  )
  hole.rotation.x = Math.PI / 2
  hole.position.set(0.03, 0.565, 0)
  g.add(hole)

  // --- Straw ---
  const strawLen = 0.62
  const straw = isBrown
    ? makeStripedStraw([0x111114, 0xf2f2f4], 16, strawLen, 0.015, w)
    : makeStripedStraw([0x8b5cf6, 0xf5f0ff], 14, strawLen, 0.015, w)
  straw.position.set(0.03, 0.58, 0)
  straw.rotation.z = 0.08
  straw.rotation.x = -0.04
  straw.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = cast
    }
  })
  g.add(straw)

  // --- Liquid volumes ---
  if (isBrown) {
    // Milk tea lower layer
    const milk = new THREE.Mesh(
      latheLiquid(0.2, 0.145, 0.128),
      phys(0xe8c878, {
        roughness: 0.14,
        transmission: 0.28,
        transparent: true,
        opacity: 0.92,
        thickness: 0.5,
        ior: 1.38,
        attenuationColor: new THREE.Color(0xd4a040),
        attenuationDistance: 0.22,
        clearcoat: 0.55,
        clearcoatRoughness: 0.1,
      }, w),
    )
    milk.name = 'milk_tea'
    milk.position.y = 0
    g.add(milk)

    // Darker tea / caramel upper band
    const tea = new THREE.Mesh(
      new THREE.CylinderGeometry(0.126, 0.135, 0.12, 36),
      phys(0xa86828, {
        roughness: 0.1,
        transmission: 0.35,
        transparent: true,
        opacity: 0.88,
        thickness: 0.4,
        ior: 1.4,
        attenuationColor: new THREE.Color(0x6a3010),
        attenuationDistance: 0.18,
        clearcoat: 0.7,
        clearcoatRoughness: 0.08,
      }, w),
    )
    tea.position.y = 0.26
    g.add(tea)

    // Meniscus ring on liquid surface
    const meniscus = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.008, 8, 36),
      phys(0xc88840, {
        roughness: 0.05,
        transparent: true,
        opacity: 0.55,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        transmission: 0.25,
        thickness: 0.05,
        ior: 1.4,
      }, w),
    )
    meniscus.rotation.x = Math.PI / 2
    meniscus.position.y = 0.325
    g.add(meniscus)

    // Brown sugar syrup streaks (viscous drips along inner wall)
    const syrupMat = phys(0x1a0c06, {
      roughness: 0.22,
      clearcoat: 0.65,
      clearcoatRoughness: 0.12,
      transparent: true,
      opacity: 0.92,
      transmission: 0.08,
      thickness: 0.12,
      ior: 1.45,
      sheen: 0.25,
      sheenColor: new THREE.Color(0x6a3010),
    }, w)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + seeded(i, 1) * 0.3
      const h = 0.22 + seeded(i, 2) * 0.12
      const streak = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.01 + seeded(i, 3) * 0.008, h, 4, 8),
        syrupMat,
      )
      const r = 0.118 + seeded(i, 4) * 0.012
      streak.position.set(Math.cos(a) * r, 0.12 + h * 0.35, Math.sin(a) * r)
      // Tilt slightly toward wall
      streak.lookAt(0, streak.position.y, 0)
      streak.rotateX(Math.PI / 2)
      streak.scale.set(1, 1, 0.55 + seeded(i, 5) * 0.3)
      g.add(streak)
    }

    // Thick syrup pool at bottom
    const pool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.14, 0.04, 32),
      phys(0x120806, {
        roughness: 0.25,
        clearcoat: 0.5,
        transparent: true,
        opacity: 0.9,
        transmission: 0.05,
        thickness: 0.2,
      }, w),
    )
    pool.position.y = 0.04
    g.add(pool)
  } else {
    // Taro purple body
    const taro = new THREE.Mesh(
      latheLiquid(0.32, 0.145, 0.122),
      phys(0xb48ad8, {
        roughness: 0.16,
        transmission: 0.32,
        transparent: true,
        opacity: 0.94,
        thickness: 0.55,
        ior: 1.39,
        attenuationColor: new THREE.Color(0x7a48b0),
        attenuationDistance: 0.2,
        clearcoat: 0.55,
        clearcoatRoughness: 0.12,
        sheen: 0.2,
        sheenColor: new THREE.Color(0xe0c0ff),
      }, w),
    )
    taro.name = 'taro_liquid'
    g.add(taro)

    // Cream / foam head
    const creamMat = phys(0xfff6f0, {
      roughness: 0.62,
      sheen: 0.55,
      sheenColor: new THREE.Color(0xffe8d8),
      sheenRoughness: 0.7,
      clearcoat: 0.15,
      clearcoatRoughness: 0.5,
    }, w)
    const cream = new THREE.Mesh(new THREE.CylinderGeometry(0.118, 0.12, 0.07, 36), creamMat)
    cream.position.y = 0.36
    g.add(cream)

    // Foam micro-bumps
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      const bump = new THREE.Mesh(
        new THREE.SphereGeometry(0.018 + seeded(i, 6) * 0.012, 12, 10),
        creamMat,
      )
      bump.position.set(
        Math.cos(a) * (0.04 + seeded(i, 7) * 0.04),
        0.395 + seeded(i, 8) * 0.02,
        Math.sin(a) * (0.04 + seeded(i, 7) * 0.04),
      )
      bump.scale.set(1, 0.65, 1)
      g.add(bump)
    }

    // Purple speckles in foam
    const speckMat = phys(0x7a4aaa, { roughness: 0.5 }, w)
    for (let i = 0; i < 14; i++) {
      const sp = new THREE.Mesh(new THREE.SphereGeometry(0.004 + seeded(i, 9) * 0.003, 6, 5), speckMat)
      const a = seeded(i, 10) * Math.PI * 2
      const r = seeded(i, 11) * 0.09
      sp.position.set(Math.cos(a) * r, 0.39 + seeded(i, 12) * 0.015, Math.sin(a) * r)
      g.add(sp)
    }

    // Meniscus under foam
    const meniscus = new THREE.Mesh(
      new THREE.TorusGeometry(0.115, 0.007, 8, 32),
      phys(0xc8a0e8, {
        roughness: 0.08,
        transparent: true,
        opacity: 0.45,
        clearcoat: 0.9,
        transmission: 0.2,
        thickness: 0.04,
        ior: 1.38,
      }, w),
    )
    meniscus.rotation.x = Math.PI / 2
    meniscus.position.y = 0.325
    g.add(meniscus)
  }

  // --- Tapioca pearls (cluster at bottom + suspended) ---
  const pearlMat = phys(0x100a08, {
    roughness: 0.28,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
    metalness: 0.02,
    sheen: 0.15,
    sheenColor: new THREE.Color(0x3a2010),
  }, w)
  const pearlHilite = phys(0x2a1810, {
    roughness: 0.15,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  }, w)

  const pearlCount = isBrown ? 48 : 40
  for (let i = 0; i < pearlCount; i++) {
    const rad = 0.016 + seeded(i, 13) * 0.01
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(rad, 14, 12), i % 7 === 0 ? pearlHilite : pearlMat)
    const ang = seeded(i, 14) * Math.PI * 2
    // Density higher near bottom
    const layer = seeded(i, 15)
    const r = Math.sqrt(seeded(i, 16)) * (0.05 + layer * 0.07)
    const y = isBrown
      ? 0.035 + layer * 0.2 + seeded(i, 17) * 0.04
      : 0.04 + layer * 0.24 + seeded(i, 17) * 0.03
    pearl.position.set(Math.cos(ang) * r, y, Math.sin(ang) * r)
    pearl.castShadow = cast
    // Slight squash
    pearl.scale.set(1, 0.92 + seeded(i, 18) * 0.12, 1)
    g.add(pearl)
  }

  // Pearls sitting on lid underside for brown sugar (ref has pearls visible under dome)
  if (isBrown) {
    for (let i = 0; i < 12; i++) {
      const pearl = new THREE.Mesh(
        new THREE.SphereGeometry(0.018 + seeded(i, 19) * 0.008, 12, 10),
        pearlMat,
      )
      const a = (i / 12) * Math.PI * 2
      pearl.position.set(Math.cos(a) * 0.07, 0.48 + seeded(i, 20) * 0.04, Math.sin(a) * 0.07)
      pearl.castShadow = cast
      g.add(pearl)
    }
  }

  // --- Condensation droplets on exterior ---
  const dropMat = phys(0xc8e0ff, {
    roughness: 0.02,
    transmission: 0.95,
    transparent: true,
    opacity: 0.55,
    thickness: 0.035,
    ior: 1.33,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
  }, w)

  for (let i = 0; i < 32; i++) {
    const s = 0.005 + seeded(i, 21) * 0.007
    const drop = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), dropMat)
    const ang = seeded(i, 22) * Math.PI * 2
    const y = 0.06 + seeded(i, 23) * 0.34
    // Sit on outer wall radius at height
    const wallR = 0.15 - (y - 0.1) * 0.035 + 0.008
    drop.position.set(Math.cos(ang) * wallR, y, Math.sin(ang) * wallR)
    drop.scale.set(1, 1.4 + seeded(i, 24) * 0.8, 1)
    g.add(drop)
  }

  // Streaky condensation trails
  for (let i = 0; i < 8; i++) {
    const trail = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.004, 0.04 + seeded(i, 25) * 0.05, 4, 6),
      dropMat,
    )
    const ang = seeded(i, 26) * Math.PI * 2
    const y = 0.12 + seeded(i, 27) * 0.25
    const wallR = 0.148 - (y - 0.1) * 0.03 + 0.006
    trail.position.set(Math.cos(ang) * wallR, y, Math.sin(ang) * wallR)
    g.add(trail)
  }

  return g
}

export function createBobaCupPairModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group()
  root.name = 'BobaCupPair'
  root.userData.img2threejs = {
    skill: 'img2threejs@1.4.x',
    source: 'demos/room/public/assets/boba.jpg',
    pass: 'form+material-v3-appetite',
  }

  const brown = makeCup(options, 'brown-sugar')
  brown.position.x = -0.2
  const taro = makeCup(options, 'taro')
  taro.position.x = 0.2
  root.add(brown, taro)

  const sockets: Record<string, THREE.Object3D> = {}
  const sBrown = new THREE.Object3D()
  sBrown.name = 'socket_brownSugar'
  sBrown.position.set(-0.2, 0.75, 0)
  root.add(sBrown)
  sockets.brownSugar = sBrown
  const sTaro = new THREE.Object3D()
  sTaro.name = 'socket_taro'
  sTaro.position.set(0.2, 0.75, 0)
  root.add(sTaro)
  sockets.taro = sTaro

  root.userData.sculptRuntime = {
    nodes: { root, brown, taro },
    meshes: {},
    sockets,
    colliders: { root: { type: 'box', scale: [0.55, 0.85, 0.35] } },
    destructionGroups: { cups: [brown, taro] },
  } satisfies ProceduralModelRuntime

  root.userData.tick = (t: number) => {
    brown.rotation.y = Math.sin(t * 0.18) * 0.05
    taro.rotation.y = Math.sin(t * 0.18 + 1.2) * 0.05
  }

  return root
}
