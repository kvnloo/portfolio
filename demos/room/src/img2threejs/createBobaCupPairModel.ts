/**
 * img2threejs form/material pass — BobaCupPair (v2 fidelity).
 * Reference: public/assets/boba.jpg
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

function makeCup(
  options: ProceduralModelOptions,
  variant: 'brown-sugar' | 'taro',
): THREE.Group {
  const cast = options.castShadow ?? true
  const w = options.wireframe
  const g = new THREE.Group()
  g.name = variant === 'brown-sugar' ? 'BrownSugarBoba' : 'TaroBoba'

  const plastic = phys(0xe8f6ff, {
    roughness: 0.12,
    transmission: 0.72,
    thickness: 0.12,
    transparent: true,
    opacity: 0.42,
    ior: 1.49,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  }, w)

  // Flared cup body (lathe-ish via cylinder segments)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.155, 0.44, 36, 1, true),
    plastic,
  )
  body.position.y = 0.22
  body.castShadow = cast
  g.add(body)

  // Bottom disc
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.155, 32), plastic)
  bottom.rotation.x = Math.PI / 2
  bottom.position.y = 0.005
  g.add(bottom)

  // Ridge rings
  for (const y of [0.12, 0.22, 0.32]) {
    const ridge = new THREE.Mesh(
      new THREE.TorusGeometry(0.14 + (y - 0.22) * 0.05, 0.004, 6, 32),
      plastic,
    )
    ridge.rotation.x = Math.PI / 2
    ridge.position.y = y
    g.add(ridge)
  }

  // Dome lid
  const lid = new THREE.Mesh(
    new THREE.SphereGeometry(0.145, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    phys(0xf2f8ff, {
      roughness: 0.1,
      transmission: 0.55,
      transparent: true,
      opacity: 0.55,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      ior: 1.5,
    }, w),
  )
  lid.position.y = 0.44
  lid.castShadow = cast
  g.add(lid)

  // Lid seal ring
  const seal = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.012, 8, 32),
    phys(0x1a1a1e, { roughness: 0.5 }, w),
  )
  seal.rotation.x = Math.PI / 2
  seal.position.y = 0.44
  g.add(seal)

  // Straw
  const isBrown = variant === 'brown-sugar'
  const strawGroup = new THREE.Group()
  strawGroup.position.set(0.035, 0.58, 0)
  strawGroup.rotation.z = 0.1
  if (isBrown) {
    // black/white spiral approx via segments
    for (let i = 0; i < 14; i++) {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.04, 10),
        phys(i % 2 === 0 ? 0x111111 : 0xf0f0f0, { roughness: 0.4 }, w),
      )
      seg.position.y = -0.28 + i * 0.04
      strawGroup.add(seg)
    }
  } else {
    const straw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.58, 12),
      phys(0x9b6bff, { roughness: 0.35 }, w),
    )
    strawGroup.add(straw)
    // purple/white stripes
    for (let i = 0; i < 8; i++) {
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.017, 0.017, 0.035, 10),
        phys(0xffffff, { roughness: 0.4 }, w),
      )
      band.position.y = -0.25 + i * 0.07
      strawGroup.add(band)
    }
  }
  strawGroup.castShadow = cast
  g.add(strawGroup)

  // Liquid
  const liquidColor = isBrown ? 0xc47830 : 0xb48ad8
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.145, 0.34, 32),
    phys(liquidColor, {
      roughness: 0.12,
      transmission: 0.35,
      transparent: true,
      opacity: 0.9,
      thickness: 0.55,
      ior: 1.38,
      attenuationColor: new THREE.Color(liquidColor),
      attenuationDistance: 0.25,
      clearcoat: 0.6,
    }, w),
  )
  liquid.position.y = 0.19
  g.add(liquid)

  if (isBrown) {
    // Layered gradient suggestion (milk tea bottom)
    const milk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.14, 32),
      phys(0xf0d8a8, {
        roughness: 0.2,
        transmission: 0.2,
        transparent: true,
        opacity: 0.85,
      }, w),
    )
    milk.position.y = 0.12
    g.add(milk)
    // Syrup streaks
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      const streak = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.3, 0.006),
        phys(0x2a1008, { roughness: 0.3, transparent: true, opacity: 0.8 }, w),
      )
      streak.position.set(Math.cos(a) * 0.128, 0.24, Math.sin(a) * 0.128)
      streak.lookAt(0, 0.24, 0)
      g.add(streak)
    }
  } else {
    // Cream foam top
    const cream = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.09, 32),
      phys(0xfff8f2, { roughness: 0.55, sheen: 0.3 }, w),
    )
    cream.position.y = 0.38
    g.add(cream)
    // Foam bumps
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      const bump = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 10, 8),
        phys(0xfff8f2, { roughness: 0.55 }, w),
      )
      bump.position.set(Math.cos(a) * 0.06, 0.43, Math.sin(a) * 0.06)
      g.add(bump)
    }
  }

  // Pearls
  const pearlMat = phys(0x120a08, {
    roughness: 0.35,
    clearcoat: 0.45,
    clearcoatRoughness: 0.2,
  }, w)
  for (let i = 0; i < 36; i++) {
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.02 + Math.random() * 0.006, 12, 10), pearlMat)
    const ang = Math.random() * Math.PI * 2
    const r = Math.random() * 0.09
    pearl.position.set(
      Math.cos(ang) * r,
      0.04 + Math.random() * 0.22,
      Math.sin(ang) * r,
    )
    pearl.castShadow = cast
    g.add(pearl)
  }

  // Condensation
  const dropMat = phys(0xb8d8ff, {
    roughness: 0.05,
    transmission: 0.95,
    transparent: true,
    opacity: 0.4,
    thickness: 0.04,
    ior: 1.33,
  }, w)
  for (let i = 0; i < 18; i++) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.007 + Math.random() * 0.004, 8, 6), dropMat)
    const ang = Math.random() * Math.PI * 2
    drop.position.set(
      Math.cos(ang) * 0.15,
      0.08 + Math.random() * 0.32,
      Math.sin(ang) * 0.15,
    )
    g.add(drop)
  }

  return g
}

export function createBobaCupPairModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group()
  root.name = 'BobaCupPair'
  root.userData.img2threejs = {
    skill: 'img2threejs@1.4.x',
    source: 'demos/room/public/assets/boba.jpg',
    pass: 'form+material-v2',
  }

  const brown = makeCup(options, 'brown-sugar')
  brown.position.x = -0.2
  const taro = makeCup(options, 'taro')
  taro.position.x = 0.2
  root.add(brown, taro)

  const sockets: Record<string, THREE.Object3D> = {}
  const sBrown = new THREE.Object3D()
  sBrown.position.set(-0.2, 0.75, 0)
  root.add(sBrown)
  sockets.brownSugar = sBrown
  const sTaro = new THREE.Object3D()
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
