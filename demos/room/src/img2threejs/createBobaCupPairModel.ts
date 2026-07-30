/**
 * img2threejs form/material pass — BobaCupPair (v5 wet-glass residual #3).
 * Reference: public/assets/boba.jpg
 *
 * PET cup IOR/transmission/thickness, liquid attenuation + meniscus ring,
 * condensation roughness film + beads, pearl pile, striped anisotropic straws,
 * brown-sugar syrup streaks + taro foam.
 * LOOP residual #3: meniscus / condensation / transmission at beauty FOV.
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

/**
 * Shared condensation film maps (roughness + alpha) — frosted PET exterior.
 * Procedural canvas: micro-beads + vertical runoff streaks for beauty-distance read.
 */
let _condenseMaps: { roughness: THREE.CanvasTexture; alpha: THREE.CanvasTexture } | null = null
function getCondensationMaps() {
  if (_condenseMaps) return _condenseMaps
  const size = 256
  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = size
  roughCanvas.height = size
  const rc = roughCanvas.getContext('2d')!
  // Base: mostly clear PET with soft frost veil
  rc.fillStyle = '#1a1a1a'
  rc.fillRect(0, 0, size, size)
  // Soft fog patches (mid roughness)
  for (let i = 0; i < 48; i++) {
    const x = seeded(i, 100) * size
    const y = seeded(i, 101) * size
    const r = 12 + seeded(i, 102) * 36
    const g = rc.createRadialGradient(x, y, 0, x, y, r)
    const a = 0.25 + seeded(i, 103) * 0.45
    g.addColorStop(0, `rgba(210,210,210,${a})`)
    g.addColorStop(1, 'rgba(26,26,26,0)')
    rc.fillStyle = g
    rc.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // Vertical runoff streaks (higher roughness = matte wet film)
  for (let i = 0; i < 28; i++) {
    const x = seeded(i, 110) * size
    const w = 1.5 + seeded(i, 111) * 3.5
    const y0 = seeded(i, 112) * size * 0.35
    const h = size * (0.35 + seeded(i, 113) * 0.55)
    const grad = rc.createLinearGradient(x, y0, x, y0 + h)
    grad.addColorStop(0, 'rgba(180,180,180,0.15)')
    grad.addColorStop(0.4, `rgba(220,220,220,${0.45 + seeded(i, 114) * 0.35})`)
    grad.addColorStop(1, 'rgba(160,160,160,0.1)')
    rc.fillStyle = grad
    rc.fillRect(x - w * 0.5, y0, w, h)
  }
  // Micro droplet roughness beads
  for (let i = 0; i < 120; i++) {
    const x = seeded(i, 120) * size
    const y = seeded(i, 121) * size
    const r = 0.6 + seeded(i, 122) * 2.2
    rc.fillStyle = `rgba(240,240,240,${0.35 + seeded(i, 123) * 0.5})`
    rc.beginPath()
    rc.ellipse(x, y, r * 0.85, r * (1.1 + seeded(i, 124) * 0.9), 0, 0, Math.PI * 2)
    rc.fill()
  }

  const alphaCanvas = document.createElement('canvas')
  alphaCanvas.width = size
  alphaCanvas.height = size
  const ac = alphaCanvas.getContext('2d')!
  ac.fillStyle = '#000000'
  ac.fillRect(0, 0, size, size)
  // Semi-opaque frost veil + bead silhouettes for outer film mesh
  for (let i = 0; i < 40; i++) {
    const x = seeded(i, 130) * size
    const y = seeded(i, 131) * size
    const r = 10 + seeded(i, 132) * 40
    const g = ac.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(255,255,255,${0.12 + seeded(i, 133) * 0.2})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ac.fillStyle = g
    ac.fillRect(x - r, y - r, r * 2, r * 2)
  }
  for (let i = 0; i < 90; i++) {
    const x = seeded(i, 140) * size
    const y = seeded(i, 141) * size
    const r = 0.8 + seeded(i, 142) * 2.8
    ac.fillStyle = `rgba(255,255,255,${0.25 + seeded(i, 143) * 0.55})`
    ac.beginPath()
    ac.ellipse(x, y, r * 0.8, r * (1.2 + seeded(i, 144)), 0, 0, Math.PI * 2)
    ac.fill()
  }
  for (let i = 0; i < 18; i++) {
    const x = seeded(i, 150) * size
    const w = 1.2 + seeded(i, 151) * 2.5
    const y0 = seeded(i, 152) * size * 0.4
    const h = size * (0.3 + seeded(i, 153) * 0.5)
    ac.fillStyle = `rgba(255,255,255,${0.08 + seeded(i, 154) * 0.12})`
    ac.fillRect(x - w * 0.5, y0, w, h)
  }

  const roughness = new THREE.CanvasTexture(roughCanvas)
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping
  roughness.repeat.set(2.2, 1.6)
  roughness.colorSpace = THREE.NoColorSpace
  roughness.needsUpdate = true

  const alpha = new THREE.CanvasTexture(alphaCanvas)
  alpha.wrapS = alpha.wrapT = THREE.RepeatWrapping
  alpha.repeat.set(2.2, 1.6)
  alpha.colorSpace = THREE.NoColorSpace
  alpha.needsUpdate = true

  _condenseMaps = { roughness, alpha }
  return _condenseMaps
}

/** Flared PET cup wall profile (open top). Slightly taller for beauty silhouette. */
function latheCupWall(): THREE.LatheGeometry {
  // x = radius, y = height
  const pts = [
    new THREE.Vector2(0.148, 0.02),
    new THREE.Vector2(0.151, 0.08),
    new THREE.Vector2(0.146, 0.16),
    new THREE.Vector2(0.139, 0.26),
    new THREE.Vector2(0.129, 0.36),
    new THREE.Vector2(0.123, 0.45),
  ]
  return new THREE.LatheGeometry(pts, 32)
}

/** Liquid body with surface meniscus (inward lip + capillary climb). */
function latheLiquid(fillH: number, bottomR: number, topR: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = []
  pts.push(new THREE.Vector2(0.0, 0.02))
  pts.push(new THREE.Vector2(bottomR * 0.85, 0.02))
  pts.push(new THREE.Vector2(bottomR, 0.03))
  const steps = 12
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = 0.03 + t * (fillH - 0.03)
    const r = bottomR + (topR - bottomR) * t
    pts.push(new THREE.Vector2(r, y))
  }
  // Strong capillary meniscus: climb wall then dip center (wet liquid read)
  pts.push(new THREE.Vector2(topR + 0.01, fillH + 0.01))
  pts.push(new THREE.Vector2(topR + 0.004, fillH + 0.02))
  pts.push(new THREE.Vector2(topR - 0.012, fillH + 0.016))
  pts.push(new THREE.Vector2(topR * 0.55, fillH + 0.005))
  pts.push(new THREE.Vector2(topR * 0.22, fillH + 0.001))
  pts.push(new THREE.Vector2(0.0, fillH - 0.002))
  return new THREE.LatheGeometry(pts, 32)
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
    // Plastic straw: anisotropic streak along length + hard clearcoat
    const mat = phys(i % 2 === 0 ? colors[0] : colors[1], {
      roughness: 0.16,
      clearcoat: 0.72,
      clearcoatRoughness: 0.1,
      sheen: 0.18,
      sheenColor: new THREE.Color(0xffffff),
      sheenRoughness: 0.28,
      // Longitudinal highlight band (plastic extrusion grain)
      anisotropy: 0.85,
      anisotropyRotation: 0,
      specularIntensity: 1.1,
      envMapIntensity: 1.15,
    }, w)
    // Slight taper toward top for paper/plastic-straw read
    const rTop = radius * (1 - i * 0.008)
    const rBot = radius * (1 - (i + 1) * 0.008)
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBot, segH * 1.02, 14),
      mat,
    )
    seg.position.y = -length / 2 + segH * 0.5 + i * segH
    g.add(seg)
  }
  // Hollow bore — darker inner tube
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.52, radius * 0.52, length * 0.98, 10, 1, true),
    phys(0x1a1a20, {
      roughness: 0.55,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    }, w),
  )
  g.add(inner)
  // Top cut rim (plastic edge)
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.72, radius * 0.2, 8, 18),
    phys(colors[0], {
      roughness: 0.2,
      clearcoat: 0.55,
      anisotropy: 0.5,
    }, w),
  )
  rim.rotation.x = Math.PI / 2
  rim.position.y = length / 2
  g.add(rim)
  // Tiny end cap highlight (open mouth)
  const mouth = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.42, radius * 0.78, 16),
    phys(0x0a0a0c, { roughness: 0.6, side: THREE.DoubleSide }, w),
  )
  mouth.rotation.x = -Math.PI / 2
  mouth.position.y = length / 2 + 0.001
  g.add(mouth)
  return g
}

/** Shared pearl sphere (low-seg, no shadows) for InstancedMesh. */
const PEARL_GEO = new THREE.SphereGeometry(1, 8, 6)
const DROP_GEO = new THREE.SphereGeometry(1, 6, 5)
const TRAIL_GEO = new THREE.CapsuleGeometry(1, 1, 4, 6)

function wallRadiusAt(y: number): number {
  // Matches latheCupWall outer flare + slight offset for exterior droplets
  return 0.151 - Math.max(0, y - 0.08) * 0.072 + 0.01
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

  // PET plastic — thin-shell IOR ~1.55, high transmission, low opacity (v5 residual #3)
  const plastic = phys(0xeef8ff, {
    roughness: 0.028,
    metalness: 0,
    transmission: 0.97,
    thickness: 0.022,
    transparent: true,
    opacity: 0.14,
    ior: 1.55,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    specularIntensity: 1.25,
    envMapIntensity: 1.55,
    attenuationColor: new THREE.Color(0xd8eef8),
    attenuationDistance: 0.55,
  }, w)

  const plasticOpaqueBottom = phys(0xc8e0f0, {
    roughness: 0.06,
    transmission: 0.55,
    thickness: 0.12,
    transparent: true,
    opacity: 0.55,
    ior: 1.54,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    attenuationColor: new THREE.Color(0xa8c8e0),
    attenuationDistance: 0.25,
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
  outerShell.scale.set(1.028, 1, 1.028)
  outerShell.position.y = 0
  g.add(outerShell)

  // Condensation film shell — roughness noise + soft alpha veil (beauty FOV wet PET)
  const condenseMaps = getCondensationMaps()
  const filmMat = phys(0xd8ecf8, {
    roughness: 0.55,
    roughnessMap: condenseMaps.roughness,
    metalness: 0,
    transparent: true,
    opacity: 0.42,
    alphaMap: condenseMaps.alpha,
    depthWrite: false,
    side: THREE.FrontSide,
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
    transmission: 0.15,
    thickness: 0.008,
    ior: 1.33,
    envMapIntensity: 0.85,
  }, w)
  const film = new THREE.Mesh(latheCupWall(), filmMat)
  film.name = 'condensation_film'
  film.scale.set(1.038, 1.0, 1.038)
  film.position.y = 0.002
  film.castShadow = false
  film.receiveShadow = false
  g.add(film)

  // Bottom disc + slight dome
  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.149, 0.146, 0.02, 36),
    plasticOpaqueBottom,
  )
  bottom.position.y = 0.012
  bottom.castShadow = cast
  g.add(bottom)

  // Stacking ring ridges (readable PET mold lines)
  for (const y of [0.1, 0.2, 0.3, 0.39]) {
    const r = 0.151 - (y - 0.1) * 0.038
    const ridge = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.0038, 6, 40),
      phys(0xd0e8f5, {
        roughness: 0.1,
        transmission: 0.65,
        transparent: true,
        opacity: 0.5,
        clearcoat: 0.85,
        ior: 1.52,
        thickness: 0.02,
      }, w),
    )
    ridge.rotation.x = Math.PI / 2
    ridge.position.y = y
    g.add(ridge)
  }

  // Dome lid — thicker PET, slight frost, holographic sheen hint
  const lidMat = phys(0xf4f9ff, {
    roughness: 0.06,
    transmission: 0.78,
    thickness: 0.11,
    transparent: true,
    opacity: 0.38,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    ior: 1.52,
    envMapIntensity: 1.4,
  }, w)
  const lid = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    lidMat,
  )
  lid.name = 'lid'
  lid.position.y = 0.45
  lid.castShadow = cast
  g.add(lid)

  // Lid flange / seal (black gasket)
  const seal = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.015, 10, 40),
    phys(0x14141a, {
      roughness: 0.42,
      clearcoat: 0.25,
    }, w),
  )
  seal.rotation.x = Math.PI / 2
  seal.position.y = 0.445
  g.add(seal)

  // Lid snap rim
  const lidRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.134, 0.131, 0.022, 36, 1, true),
    plastic,
  )
  lidRim.position.y = 0.44
  g.add(lidRim)

  // Straw hole plug ring on dome
  const hole = new THREE.Mesh(
    new THREE.TorusGeometry(0.022, 0.0045, 8, 16),
    phys(0xc0d8e8, { roughness: 0.18, clearcoat: 0.55 }, w),
  )
  hole.rotation.x = Math.PI / 2
  hole.position.set(0.032, 0.575, 0)
  g.add(hole)

  // --- Straw ---
  const strawLen = 0.64
  const straw = isBrown
    ? makeStripedStraw([0x0e0e12, 0xf4f4f6], 18, strawLen, 0.016, w)
    : makeStripedStraw([0x7c3aed, 0xf5f0ff], 16, strawLen, 0.016, w)
  straw.position.set(0.032, 0.59, 0)
  straw.rotation.z = 0.09
  straw.rotation.x = -0.05
  straw.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = cast
    }
  })
  g.add(straw)

  // --- Liquid volumes ---
  if (isBrown) {
    // Milk tea lower layer (amber golden)
    const milk = new THREE.Mesh(
      latheLiquid(0.2, 0.146, 0.129),
      phys(0xecc878, {
        roughness: 0.1,
        transmission: 0.32,
        transparent: true,
        opacity: 0.93,
        thickness: 0.55,
        ior: 1.38,
        attenuationColor: new THREE.Color(0xd4a040),
        attenuationDistance: 0.18,
        clearcoat: 0.7,
        clearcoatRoughness: 0.08,
      }, w),
    )
    milk.name = 'milk_tea'
    milk.position.y = 0
    g.add(milk)

    // Darker tea / caramel upper band
    const tea = new THREE.Mesh(
      new THREE.CylinderGeometry(0.127, 0.136, 0.125, 36),
      phys(0xa06020, {
        roughness: 0.08,
        transmission: 0.38,
        transparent: true,
        opacity: 0.9,
        thickness: 0.45,
        ior: 1.4,
        attenuationColor: new THREE.Color(0x5a2808),
        attenuationDistance: 0.15,
        clearcoat: 0.8,
        clearcoatRoughness: 0.06,
      }, w),
    )
    tea.position.y = 0.265
    g.add(tea)

    // Liquid surface disc — specular meniscus plane (beauty FOV read)
    const surfaceDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.118, 36),
      phys(0xd08840, {
        roughness: 0.04,
        metalness: 0.02,
        transparent: true,
        opacity: 0.55,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        transmission: 0.35,
        thickness: 0.04,
        ior: 1.4,
        side: THREE.DoubleSide,
      }, w),
    )
    surfaceDisc.rotation.x = -Math.PI / 2
    surfaceDisc.position.y = 0.328
    g.add(surfaceDisc)

    // Meniscus ring on liquid surface
    const meniscus = new THREE.Mesh(
      new THREE.TorusGeometry(0.122, 0.009, 8, 40),
      phys(0xc88840, {
        roughness: 0.04,
        transparent: true,
        opacity: 0.65,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        transmission: 0.3,
        thickness: 0.06,
        ior: 1.4,
      }, w),
    )
    meniscus.rotation.x = Math.PI / 2
    meniscus.position.y = 0.33
    g.add(meniscus)

    // Brown sugar syrup streaks (viscous drips along inner wall — ref identity)
    const syrupMat = phys(0x140804, {
      roughness: 0.18,
      clearcoat: 0.75,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.94,
      transmission: 0.06,
      thickness: 0.14,
      ior: 1.48,
      sheen: 0.35,
      sheenColor: new THREE.Color(0x6a3010),
      sheenRoughness: 0.4,
    }, w)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + seeded(i, 1) * 0.35
      const h = 0.24 + seeded(i, 2) * 0.14
      const thick = 0.012 + seeded(i, 3) * 0.01
      const streak = new THREE.Mesh(
        new THREE.CapsuleGeometry(thick, h, 4, 8),
        syrupMat,
      )
      const r = 0.116 + seeded(i, 4) * 0.014
      streak.position.set(Math.cos(a) * r, 0.1 + h * 0.38, Math.sin(a) * r)
      streak.lookAt(0, streak.position.y, 0)
      streak.rotateX(Math.PI / 2)
      // Flatten against wall + slight taper via scale
      streak.scale.set(1, 1, 0.45 + seeded(i, 5) * 0.35)
      g.add(streak)
    }
    // Extra short drips near top of syrup zone (ref has clumpy tops)
    for (let i = 0; i < 6; i++) {
      const a = seeded(i, 30) * Math.PI * 2
      const blob = new THREE.Mesh(
        new THREE.SphereGeometry(0.014 + seeded(i, 31) * 0.01, 8, 6),
        syrupMat,
      )
      const r = 0.12 + seeded(i, 32) * 0.01
      blob.position.set(Math.cos(a) * r, 0.28 + seeded(i, 33) * 0.04, Math.sin(a) * r)
      blob.scale.set(1, 1.6, 0.7)
      g.add(blob)
    }

    // Thick syrup pool at bottom
    const pool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.132, 0.142, 0.045, 32),
      phys(0x0e0604, {
        roughness: 0.22,
        clearcoat: 0.55,
        transparent: true,
        opacity: 0.92,
        transmission: 0.04,
        thickness: 0.22,
      }, w),
    )
    pool.position.y = 0.04
    g.add(pool)
  } else {
    // Taro purple body
    const taro = new THREE.Mesh(
      latheLiquid(0.33, 0.146, 0.123),
      phys(0xb48ad8, {
        roughness: 0.12,
        transmission: 0.36,
        transparent: true,
        opacity: 0.94,
        thickness: 0.58,
        ior: 1.39,
        attenuationColor: new THREE.Color(0x7a48b0),
        attenuationDistance: 0.17,
        clearcoat: 0.65,
        clearcoatRoughness: 0.1,
        sheen: 0.25,
        sheenColor: new THREE.Color(0xe0c0ff),
      }, w),
    )
    taro.name = 'taro_liquid'
    g.add(taro)

    // Cream / foam head
    const creamMat = phys(0xfff8f2, {
      roughness: 0.58,
      sheen: 0.65,
      sheenColor: new THREE.Color(0xffe8d8),
      sheenRoughness: 0.65,
      clearcoat: 0.18,
      clearcoatRoughness: 0.45,
    }, w)
    const cream = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.122, 0.075, 36), creamMat)
    cream.position.y = 0.365
    g.add(cream)

    // Foam micro-bumps (irregular head surface)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const bump = new THREE.Mesh(
        new THREE.SphereGeometry(0.016 + seeded(i, 6) * 0.014, 10, 8),
        creamMat,
      )
      bump.position.set(
        Math.cos(a) * (0.035 + seeded(i, 7) * 0.045),
        0.4 + seeded(i, 8) * 0.022,
        Math.sin(a) * (0.035 + seeded(i, 7) * 0.045),
      )
      bump.scale.set(1, 0.6, 1)
      g.add(bump)
    }

    // Purple speckles in foam
    const speckMat = phys(0x7a4aaa, { roughness: 0.48 }, w)
    for (let i = 0; i < 18; i++) {
      const sp = new THREE.Mesh(
        new THREE.SphereGeometry(0.0035 + seeded(i, 9) * 0.0035, 6, 5),
        speckMat,
      )
      const a = seeded(i, 10) * Math.PI * 2
      const r = seeded(i, 11) * 0.095
      sp.position.set(Math.cos(a) * r, 0.395 + seeded(i, 12) * 0.018, Math.sin(a) * r)
      g.add(sp)
    }

    // Meniscus under foam + surface sheen disc
    const surfaceDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.112, 32),
      phys(0xc8a0e8, {
        roughness: 0.06,
        transparent: true,
        opacity: 0.4,
        clearcoat: 0.95,
        transmission: 0.25,
        thickness: 0.03,
        ior: 1.38,
        side: THREE.DoubleSide,
      }, w),
    )
    surfaceDisc.rotation.x = -Math.PI / 2
    surfaceDisc.position.y = 0.328
    g.add(surfaceDisc)

    const meniscus = new THREE.Mesh(
      new THREE.TorusGeometry(0.116, 0.008, 8, 36),
      phys(0xc8a0e8, {
        roughness: 0.06,
        transparent: true,
        opacity: 0.5,
        clearcoat: 0.95,
        transmission: 0.22,
        thickness: 0.045,
        ior: 1.38,
      }, w),
    )
    meniscus.rotation.x = Math.PI / 2
    meniscus.position.y = 0.33
    g.add(meniscus)
  }

  // --- Tapioca pearls (InstancedMesh — denser bottom pile, 1 draw call) ---
  // Wet tapioca: dark body + glossy clearcoat; larger avg size for beauty distance
  const pearlMat = phys(0x0c0806, {
    roughness: 0.22,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    metalness: 0.04,
    sheen: 0.2,
    sheenColor: new THREE.Color(0x4a2818),
    sheenRoughness: 0.35,
  }, w)

  // PERFORMANCE.md: pearls without shadows; instancing batches draw calls.
  // Counts: brown denser (ref bottom heap), taro fewer suspended.
  const pearlCount = isBrown ? 42 : 30
  const pearlMesh = new THREE.InstancedMesh(PEARL_GEO, pearlMat, pearlCount)
  pearlMesh.name = 'pearls'
  pearlMesh.castShadow = false
  pearlMesh.receiveShadow = false
  pearlMesh.frustumCulled = true
  const dummy = new THREE.Object3D()
  for (let i = 0; i < pearlCount; i++) {
    const rad = 0.015 + seeded(i, 13) * 0.012
    const ang = seeded(i, 14) * Math.PI * 2
    // Density higher near bottom — sqrt for disc packing
    const layer = seeded(i, 15)
    // Brown: tight bottom heap + mid suspension; taro: more mid-height
    const rMax = isBrown ? 0.055 + layer * 0.065 : 0.05 + layer * 0.06
    const r = Math.sqrt(seeded(i, 16)) * rMax
    const y = isBrown
      ? 0.032 + layer * layer * 0.22 + seeded(i, 17) * 0.035
      : 0.04 + layer * 0.26 + seeded(i, 17) * 0.03
    dummy.position.set(Math.cos(ang) * r, y, Math.sin(ang) * r)
    dummy.scale.set(
      rad,
      rad * (0.9 + seeded(i, 18) * 0.14),
      rad,
    )
    dummy.rotation.set(
      seeded(i, 40) * 0.4,
      seeded(i, 41) * Math.PI,
      seeded(i, 42) * 0.4,
    )
    dummy.updateMatrix()
    pearlMesh.setMatrixAt(i, dummy.matrix)
  }
  pearlMesh.instanceMatrix.needsUpdate = true
  g.add(pearlMesh)

  // Pearls under dome for brown sugar (ref: pile visible through clear lid)
  if (isBrown) {
    const lidPearlCount = 14
    const lidPearls = new THREE.InstancedMesh(PEARL_GEO, pearlMat, lidPearlCount)
    lidPearls.name = 'lid_pearls'
    lidPearls.castShadow = false
    for (let i = 0; i < lidPearlCount; i++) {
      const rad = 0.016 + seeded(i, 19) * 0.01
      const a = (i / lidPearlCount) * Math.PI * 2 + seeded(i, 43) * 0.2
      const r = 0.04 + seeded(i, 44) * 0.055
      dummy.position.set(
        Math.cos(a) * r,
        0.48 + seeded(i, 20) * 0.05,
        Math.sin(a) * r,
      )
      dummy.scale.set(rad, rad * 0.95, rad)
      dummy.rotation.set(0, seeded(i, 45) * Math.PI, 0)
      dummy.updateMatrix()
      lidPearls.setMatrixAt(i, dummy.matrix)
    }
    lidPearls.instanceMatrix.needsUpdate = true
    g.add(lidPearls)
  }

  // --- Condensation droplets on exterior (dense field matching ref) ---
  const dropMat = phys(0xc8e4ff, {
    roughness: 0.015,
    transmission: 0.96,
    transparent: true,
    opacity: 0.62,
    thickness: 0.04,
    ior: 1.33,
    clearcoat: 1,
    clearcoatRoughness: 0.015,
    envMapIntensity: 1.5,
  }, w)

  // Micro + mid droplets (instanced)
  const dropCount = 32
  const drops = new THREE.InstancedMesh(DROP_GEO, dropMat, dropCount)
  drops.name = 'condensation_drops'
  drops.castShadow = false
  for (let i = 0; i < dropCount; i++) {
    // Mix of micro mist and larger focal beads
    const s = i % 5 === 0
      ? 0.01 + seeded(i, 21) * 0.008
      : 0.004 + seeded(i, 21) * 0.006
    const ang = seeded(i, 22) * Math.PI * 2
    const y = 0.05 + seeded(i, 23) * 0.36
    const wallR = wallRadiusAt(y)
    dummy.position.set(Math.cos(ang) * wallR, y, Math.sin(ang) * wallR)
    // Gravity stretch + slight wall flattening
    dummy.scale.set(s * 0.9, s * (1.3 + seeded(i, 24) * 0.9), s * 0.85)
    dummy.rotation.set(0, ang, 0)
    dummy.updateMatrix()
    drops.setMatrixAt(i, dummy.matrix)
  }
  drops.instanceMatrix.needsUpdate = true
  g.add(drops)

  // Streaky condensation trails (running beads)
  for (let i = 0; i < 12; i++) {
    const tw = 0.0035 + seeded(i, 25) * 0.003
    const th = 0.035 + seeded(i, 46) * 0.055
    const trail = new THREE.Mesh(TRAIL_GEO, dropMat)
    const ang = seeded(i, 26) * Math.PI * 2
    const y = 0.1 + seeded(i, 27) * 0.28
    const wallR = wallRadiusAt(y)
    trail.position.set(Math.cos(ang) * wallR, y, Math.sin(ang) * wallR)
    trail.scale.set(tw, th, tw * 0.85)
    // Align slightly with gravity (already capsule vertical)
    g.add(trail)
  }

  // Focal large beads near lower third (catch bloom / beauty still)
  for (let i = 0; i < 6; i++) {
    const s = 0.012 + seeded(i, 47) * 0.008
    const bead = new THREE.Mesh(DROP_GEO, dropMat)
    const ang = (i / 6) * Math.PI * 2 + seeded(i, 48) * 0.4
    const y = 0.08 + seeded(i, 49) * 0.12
    const wallR = wallRadiusAt(y)
    bead.position.set(Math.cos(ang) * wallR, y, Math.sin(ang) * wallR)
    bead.scale.set(s, s * 1.5, s * 0.9)
    g.add(bead)
  }

  return g
}

export function createBobaCupPairModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group()
  root.name = 'BobaCupPair'
  root.userData.img2threejs = {
    skill: 'img2threejs@1.4.x',
    source: 'demos/room/public/assets/boba.jpg',
    pass: 'form+material-v4-appetite',
  }

  const brown = makeCup(options, 'brown-sugar')
  brown.position.x = -0.2
  const taro = makeCup(options, 'taro')
  taro.position.x = 0.2
  root.add(brown, taro)

  const sockets: Record<string, THREE.Object3D> = {}
  const sBrown = new THREE.Object3D()
  sBrown.name = 'socket_brownSugar'
  sBrown.position.set(-0.2, 0.78, 0)
  root.add(sBrown)
  sockets.brownSugar = sBrown
  const sTaro = new THREE.Object3D()
  sTaro.name = 'socket_taro'
  sTaro.position.set(0.2, 0.78, 0)
  root.add(sTaro)
  sockets.taro = sTaro

  root.userData.sculptRuntime = {
    nodes: { root, brown, taro },
    meshes: {},
    sockets,
    colliders: { root: { type: 'box', scale: [0.55, 0.88, 0.35] } },
    destructionGroups: { cups: [brown, taro] },
  } satisfies ProceduralModelRuntime

  root.userData.tick = (t: number) => {
    brown.rotation.y = Math.sin(t * 0.18) * 0.05
    taro.rotation.y = Math.sin(t * 0.18 + 1.2) * 0.05
  }

  return root
}
