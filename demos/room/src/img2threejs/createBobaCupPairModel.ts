/**
 * img2threejs form/material pass for BobaCupPair.
 * Reference: public/assets/boba.jpg (brown sugar + taro).
 * Skill: https://github.com/img2threejs/img2threejs
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

  const plastic = phys(0xe8f4ff, {
    roughness: 0.25,
    transmission: 0.55,
    thickness: 0.15,
    transparent: true,
    opacity: 0.55,
    ior: 1.4,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
  }, w)

  // Cup body (slight taper)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 0.42, 32, 1, true),
    plastic,
  )
  body.position.y = 0.21
  body.castShadow = cast
  g.add(body)

  // Bottom
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.16, 32), plastic)
  bottom.rotation.x = Math.PI / 2
  bottom.position.y = 0.01
  g.add(bottom)

  // Dome lid
  const lid = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    phys(0xf0f8ff, {
      roughness: 0.2,
      transmission: 0.4,
      transparent: true,
      opacity: 0.65,
      clearcoat: 0.9,
    }, w),
  )
  lid.position.y = 0.42
  lid.castShadow = cast
  g.add(lid)

  // Straw
  const strawColor = variant === 'brown-sugar' ? 0x1a1a1a : 0x9b6bff
  const straw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.55, 12),
    phys(strawColor, { roughness: 0.4 }, w),
  )
  straw.position.set(0.04, 0.55, 0)
  straw.rotation.z = 0.12
  straw.castShadow = cast
  g.add(straw)

  // Stripe on straw
  if (variant === 'taro') {
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.019, 0.55, 12),
      phys(0xffffff, { roughness: 0.5 }, w),
    )
    stripe.position.copy(straw.position)
    stripe.rotation.copy(straw.rotation)
    stripe.scale.set(1, 1, 0.15)
    g.add(stripe)
  }

  // Liquid
  const liquidColor = variant === 'brown-sugar' ? 0xc4783a : 0xb88ad4
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.15, 0.32, 32),
    phys(liquidColor, {
      roughness: 0.2,
      transmission: 0.25,
      transparent: true,
      opacity: 0.92,
      thickness: 0.5,
    }, w),
  )
  liquid.position.y = 0.18
  g.add(liquid)

  // Cream layer (taro)
  if (variant === 'taro') {
    const cream = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.08, 32),
      phys(0xfff8f0, { roughness: 0.55 }, w),
    )
    cream.position.y = 0.36
    g.add(cream)
  }

  // Brown sugar syrup streaks
  if (variant === 'brown-sugar') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      const streak = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.28, 0.008),
        phys(0x3a1808, { roughness: 0.35, transparent: true, opacity: 0.85 }, w),
      )
      streak.position.set(Math.cos(a) * 0.13, 0.22, Math.sin(a) * 0.13)
      streak.lookAt(0, 0.22, 0)
      g.add(streak)
    }
  }

  // Tapioca pearls
  const pearlMat = phys(0x1a0f0a, { roughness: 0.45, clearcoat: 0.3 }, w)
  for (let i = 0; i < 28; i++) {
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), pearlMat)
    const ang = Math.random() * Math.PI * 2
    const r = Math.random() * 0.1
    pearl.position.set(
      Math.cos(ang) * r,
      0.05 + Math.random() * 0.2,
      Math.sin(ang) * r,
    )
    pearl.castShadow = cast
    g.add(pearl)
  }

  // Condensation droplets
  const dropMat = phys(0xaaccff, {
    roughness: 0.1,
    transmission: 0.9,
    transparent: true,
    opacity: 0.35,
    thickness: 0.05,
  }, w)
  for (let i = 0; i < 12; i++) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), dropMat)
    const ang = Math.random() * Math.PI * 2
    drop.position.set(Math.cos(ang) * 0.155, 0.1 + Math.random() * 0.28, Math.sin(ang) * 0.155)
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
    pass: 'form+material',
  }

  const brown = makeCup(options, 'brown-sugar')
  brown.position.x = -0.22
  const taro = makeCup(options, 'taro')
  taro.position.x = 0.22
  root.add(brown, taro)

  const sockets: Record<string, THREE.Object3D> = {}
  const sBrown = new THREE.Object3D()
  sBrown.position.set(-0.22, 0.7, 0)
  root.add(sBrown)
  sockets.brownSugar = sBrown
  const sTaro = new THREE.Object3D()
  sTaro.position.set(0.22, 0.7, 0)
  root.add(sTaro)
  sockets.taro = sTaro

  root.userData.sculptRuntime = {
    nodes: { root, brown, taro },
    meshes: {},
    sockets,
    colliders: { root: { type: 'box', scale: [0.6, 0.8, 0.35] } },
    destructionGroups: { cups: [brown, taro] },
  } satisfies ProceduralModelRuntime

  root.userData.tick = (t: number) => {
    brown.rotation.y = Math.sin(t * 0.2) * 0.04
    taro.rotation.y = Math.sin(t * 0.2 + 1) * 0.04
  }

  return root
}
