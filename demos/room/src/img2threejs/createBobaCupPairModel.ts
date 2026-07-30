/**
 * img2threejs form/material pass — BobaCupPair (v9 clear wet PET, kill frosted-jar).
 * Reference: public/assets/boba.jpg
 *
 * ONE thin clear PET wall (transmission-correct Physical), liquid color punches through,
 * sparse condensate beads/streaks (NOT milky frost veil), capillary meniscus,
 * contact-settled pearls, striped plastic straws, brown-sugar syrup + taro foam.
 * LOOP residual #2 (loop-r5): cups still read as frosted jars — film opacity 0.72 + dense
 * frost maps milked out liquid color. v9: clear glass first, wet accents second.
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
 * Sparse condensation maps (roughness + alpha) — wet accents on CLEAR PET, not frost jar.
 * loop-r5: dense frost + base haze milked cups white. v9: mostly transparent; beads + runoff only.
 */
let _condenseMaps: { roughness: THREE.CanvasTexture; alpha: THREE.CanvasTexture } | null = null
function getCondensationMaps() {
  if (_condenseMaps) return _condenseMaps
  const size = 256
  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = size
  roughCanvas.height = size
  const rc = roughCanvas.getContext('2d')!
  // Base: clear PET (low roughness = dark in map) — stays clear almost everywhere
  rc.fillStyle = '#040404'
  rc.fillRect(0, 0, size, size)
  // Sparse soft damp patches (NOT full-wall frost)
  for (let i = 0; i < 18; i++) {
    const x = seeded(i, 100) * size
    const y = seeded(i, 101) * size
    const r = 8 + seeded(i, 102) * 22
    const g = rc.createRadialGradient(x, y, 0, x, y, r)
    const a = 0.22 + seeded(i, 103) * 0.28
    g.addColorStop(0, `rgba(200,200,200,${a})`)
    g.addColorStop(0.55, `rgba(140,140,140,${a * 0.35})`)
    g.addColorStop(1, 'rgba(4,4,4,0)')
    rc.fillStyle = g
    rc.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // Vertical runoff streaks — few, thin (wet trail not milky sheet)
  for (let i = 0; i < 14; i++) {
    const x = seeded(i, 110) * size
    const w = 1.0 + seeded(i, 111) * 2.4
    const y0 = seeded(i, 112) * size * 0.35
    const h = size * (0.28 + seeded(i, 113) * 0.4)
    const grad = rc.createLinearGradient(x, y0, x, y0 + h)
    grad.addColorStop(0, 'rgba(180,180,180,0.1)')
    grad.addColorStop(0.35, `rgba(230,230,230,${0.35 + seeded(i, 114) * 0.3})`)
    grad.addColorStop(1, 'rgba(80,80,80,0.06)')
    rc.fillStyle = grad
    rc.fillRect(x - w * 0.5, y0, w, h)
  }
  // Micro droplet roughness beads (sparse)
  for (let i = 0; i < 70; i++) {
    const x = seeded(i, 120) * size
    const y = seeded(i, 121) * size
    const r = 0.5 + seeded(i, 122) * 2.2
    rc.fillStyle = `rgba(255,255,255,${0.4 + seeded(i, 123) * 0.45})`
    rc.beginPath()
    rc.ellipse(x, y, r * 0.75, r * (1.15 + seeded(i, 124) * 0.9), 0, 0, Math.PI * 2)
    rc.fill()
  }

  const alphaCanvas = document.createElement('canvas')
  alphaCanvas.width = size
  alphaCanvas.height = size
  const ac = alphaCanvas.getContext('2d')!
  // Fully clear base — NO full-wall haze veil (that was the frosted-jar culprit)
  ac.fillStyle = '#000000'
  ac.fillRect(0, 0, size, size)
  // Sparse damp patches only
  for (let i = 0; i < 16; i++) {
    const x = seeded(i, 130) * size
    const y = seeded(i, 131) * size
    const r = 6 + seeded(i, 132) * 20
    const g = ac.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(255,255,255,${0.14 + seeded(i, 133) * 0.16})`)
    g.addColorStop(0.55, `rgba(255,255,255,${0.04 + seeded(i, 134) * 0.06})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ac.fillStyle = g
    ac.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // Bead alphas
  for (let i = 0; i < 55; i++) {
    const x = seeded(i, 140) * size
    const y = seeded(i, 141) * size
    const r = 0.7 + seeded(i, 142) * 2.6
    ac.fillStyle = `rgba(255,255,255,${0.35 + seeded(i, 143) * 0.45})`
    ac.beginPath()
    ac.ellipse(x, y, r * 0.7, r * (1.2 + seeded(i, 144)), 0, 0, Math.PI * 2)
    ac.fill()
  }
  // Thin runoff trails
  for (let i = 0; i < 12; i++) {
    const x = seeded(i, 150) * size
    const w = 0.9 + seeded(i, 151) * 2.0
    const y0 = seeded(i, 152) * size * 0.35
    const h = size * (0.25 + seeded(i, 153) * 0.4)
    ac.fillStyle = `rgba(255,255,255,${0.1 + seeded(i, 154) * 0.14})`
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
    // Opaque hard plastic — high stripe contrast so straw reads through clear PET at beauty FOV
    const isDark = i % 2 === 0
    const mat = phys(isDark ? colors[0] : colors[1], {
      roughness: isDark ? 0.22 : 0.12,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      sheen: 0.12,
      sheenColor: new THREE.Color(0xffffff),
      sheenRoughness: 0.35,
      // Longitudinal highlight band (plastic extrusion grain)
      anisotropy: 0.92,
      anisotropyRotation: 0,
      specularIntensity: 1.2,
      envMapIntensity: 1.25,
      // No transmission — solid polypropylene/PP straw, not frosted tube
      metalness: 0,
    }, w)
    // Slight taper toward top for plastic-straw read
    const rTop = radius * (1 - i * 0.006)
    const rBot = radius * (1 - (i + 1) * 0.006)
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBot, segH * 1.02, 16),
      mat,
    )
    seg.position.y = -length / 2 + segH * 0.5 + i * segH
    g.add(seg)
  }
  // Hollow bore — darker inner tube (plastic wall thickness cue)
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.48, radius * 0.48, length * 0.98, 12, 1, true),
    phys(0x121218, {
      roughness: 0.62,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    }, w),
  )
  g.add(inner)
  // Top cut rim (plastic edge)
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.7, radius * 0.22, 8, 20),
    phys(colors[0], {
      roughness: 0.18,
      clearcoat: 0.7,
      anisotropy: 0.55,
      envMapIntensity: 1.2,
    }, w),
  )
  rim.rotation.x = Math.PI / 2
  rim.position.y = length / 2
  g.add(rim)
  // Tiny end cap highlight (open mouth)
  const mouth = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.4, radius * 0.76, 16),
    phys(0x0a0a0c, { roughness: 0.55, side: THREE.DoubleSide }, w),
  )
  mouth.rotation.x = -Math.PI / 2
  mouth.position.y = length / 2 + 0.001
  g.add(mouth)
  return g
}

/** Shared pearl / drop geos — slightly higher seg so low-poly silhouettes don't read as black faceted orbs. */
const PEARL_GEO = new THREE.SphereGeometry(1, 12, 10)
const DROP_GEO = new THREE.SphereGeometry(1, 10, 8)
const TRAIL_GEO = new THREE.CapsuleGeometry(1, 1, 4, 8)

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

  // Clear wet PET — thin wall, high transmission so liquid color reads through (not frosted jar).
  // loop-r5: film opacity 0.72 milked cups white; v9 PET is nearly water-clear with hard wet specular.
  const plastic = phys(0xf8fcff, {
    roughness: 0.018,
    metalness: 0,
    transmission: 0.985,
    thickness: 0.018,
    transparent: true,
    opacity: 1,
    ior: 1.46, // PET ~1.46, not glass 1.52 — thinner plastic cup feel
    clearcoat: 1.0,
    clearcoatRoughness: 0.015,
    specularIntensity: 1.35,
    envMapIntensity: 1.85,
    // Near-clear attenuation — slight cool cast only at thick path lengths
    attenuationColor: new THREE.Color(0xeef6fc),
    attenuationDistance: 0.85,
    side: THREE.FrontSide, // FrontSide avoids double-wall milk from DoubleSide T
  }, w)

  const plasticOpaqueBottom = phys(0xd0e4f0, {
    roughness: 0.08,
    transmission: 0.62,
    thickness: 0.12,
    transparent: true,
    opacity: 1,
    ior: 1.46,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    attenuationColor: new THREE.Color(0xa8c4d8),
    attenuationDistance: 0.22,
  }, w)

  // --- Cup body: ONE clean lathe wall (thickness from material, not dual meshes) ---
  const body = new THREE.Mesh(latheCupWall(), plastic)
  body.name = 'cup_wall'
  body.castShadow = cast
  body.receiveShadow = true
  g.add(body)

  // Condensation film — SPARSE wet accents only (must not milk the wall)
  // loop-r5 root cause: opacity 0.72 + dense frost = frosted jar silhouette
  const condenseMaps = getCondensationMaps()
  const filmMat = phys(0xf2f8fc, {
    roughness: 0.42,
    roughnessMap: condenseMaps.roughness,
    metalness: 0,
    transparent: true,
    opacity: 0.28,
    alphaMap: condenseMaps.alpha,
    depthWrite: false,
    side: THREE.FrontSide,
    clearcoat: 0.55,
    clearcoatRoughness: 0.28,
    // No transmission on film — beads/streaks only, PET wall does the glass work
    envMapIntensity: 0.85,
    specularIntensity: 1.0,
  }, w)
  const film = new THREE.Mesh(latheCupWall(), filmMat)
  film.name = 'condensation_film'
  film.scale.set(1.012, 1.0, 1.012)
  film.position.y = 0.001
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

  // Two faint mold lines only (subtle PET injection seam, not frosted rings)
  for (const y of [0.14, 0.32]) {
    const r = 0.149 - (y - 0.1) * 0.036
    const ridge = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.0018, 5, 36),
      phys(0xe8f4fc, {
        roughness: 0.08,
        transmission: 0.9,
        transparent: true,
        opacity: 1,
        clearcoat: 0.9,
        ior: 1.46,
        thickness: 0.008,
        envMapIntensity: 1.15,
      }, w),
    )
    ridge.rotation.x = Math.PI / 2
    ridge.position.y = y
    g.add(ridge)
  }

  // Dome lid — clear PET matching body (thin, not frosted dome)
  const lidMat = phys(0xf8fcff, {
    roughness: 0.025,
    transmission: 0.97,
    thickness: 0.028,
    transparent: true,
    opacity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    ior: 1.46,
    envMapIntensity: 1.75,
    attenuationColor: new THREE.Color(0xeef6fc),
    attenuationDistance: 0.7,
    side: THREE.FrontSide,
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

  // --- Straw (opaque plastic, high stripe contrast — must read through clear PET) ---
  const strawLen = 0.66
  const straw = isBrown
    ? makeStripedStraw([0x0a0a0e, 0xfafafc], 14, strawLen, 0.0185, w)
    : makeStripedStraw([0x6d28d9, 0xfaf5ff], 14, strawLen, 0.0185, w)
  straw.position.set(0.032, 0.6, 0)
  straw.rotation.z = 0.09
  straw.rotation.x = -0.05
  straw.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = cast
    }
  })
  g.add(straw)

  // --- Liquid volumes (dense color so tea/taro punch through clear PET) ---
  if (isBrown) {
    // Milk tea lower — saturated amber body, short attenuation (volume color not wash)
    const milk = new THREE.Mesh(
      latheLiquid(0.2, 0.146, 0.129),
      phys(0xd89828, {
        roughness: 0.06,
        transmission: 0.18,
        transparent: true,
        opacity: 0.97,
        thickness: 0.95,
        ior: 1.38,
        attenuationColor: new THREE.Color(0x8a5010),
        attenuationDistance: 0.055,
        clearcoat: 0.95,
        clearcoatRoughness: 0.03,
        envMapIntensity: 1.15,
      }, w),
    )
    milk.name = 'milk_tea'
    milk.position.y = 0
    g.add(milk)

    // Darker tea / caramel upper band — rich brown through clear wall
    const tea = new THREE.Mesh(
      new THREE.CylinderGeometry(0.127, 0.136, 0.125, 36),
      phys(0x7a3a0c, {
        roughness: 0.055,
        transmission: 0.2,
        transparent: true,
        opacity: 0.96,
        thickness: 0.8,
        ior: 1.4,
        attenuationColor: new THREE.Color(0x2e1204),
        attenuationDistance: 0.048,
        clearcoat: 0.95,
        clearcoatRoughness: 0.03,
        envMapIntensity: 1.1,
      }, w),
    )
    tea.position.y = 0.265
    g.add(tea)

    // Liquid surface disc — mirror-wet plane (beauty FOV specular)
    const surfaceDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.118, 40),
      phys(0xe09030, {
        roughness: 0.012,
        metalness: 0.04,
        transparent: true,
        opacity: 0.78,
        clearcoat: 1,
        clearcoatRoughness: 0.012,
        transmission: 0.22,
        thickness: 0.06,
        ior: 1.4,
        side: THREE.DoubleSide,
        envMapIntensity: 1.6,
      }, w),
    )
    surfaceDisc.rotation.x = -Math.PI / 2
    surfaceDisc.position.y = 0.328
    g.add(surfaceDisc)

    // Primary meniscus — fat capillary bright ring against clear PET wall
    const meniscus = new THREE.Mesh(
      new THREE.TorusGeometry(0.124, 0.018, 12, 52),
      phys(0xf0a848, {
        roughness: 0.012,
        transparent: true,
        opacity: 0.92,
        clearcoat: 1,
        clearcoatRoughness: 0.012,
        transmission: 0.18,
        thickness: 0.12,
        ior: 1.42,
        envMapIntensity: 1.65,
        specularIntensity: 1.3,
      }, w),
    )
    meniscus.name = 'meniscus'
    meniscus.rotation.x = Math.PI / 2
    meniscus.position.y = 0.335
    g.add(meniscus)

    // Secondary thin meniscus highlight (wet lip against PET)
    const meniscusHi = new THREE.Mesh(
      new THREE.TorusGeometry(0.131, 0.006, 8, 48),
      phys(0xffe8a8, {
        roughness: 0.008,
        transparent: true,
        opacity: 0.78,
        clearcoat: 1,
        clearcoatRoughness: 0.008,
        transmission: 0.28,
        thickness: 0.04,
        ior: 1.4,
        emissive: new THREE.Color(0x604018),
        emissiveIntensity: 0.14,
        envMapIntensity: 1.5,
      }, w),
    )
    meniscusHi.rotation.x = Math.PI / 2
    meniscusHi.position.y = 0.344
    g.add(meniscusHi)

    // Brown sugar syrup streaks (viscous drips along *inner* wall — keep inside liquid radius)
    const syrupMat = phys(0x180a04, {
      roughness: 0.2,
      clearcoat: 0.7,
      clearcoatRoughness: 0.12,
      transparent: true,
      opacity: 0.92,
      transmission: 0.04,
      thickness: 0.12,
      ior: 1.48,
      sheen: 0.3,
      sheenColor: new THREE.Color(0x6a3010),
      sheenRoughness: 0.42,
    }, w)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + seeded(i, 1) * 0.3
      const h = 0.2 + seeded(i, 2) * 0.12
      const thick = 0.01 + seeded(i, 3) * 0.008
      const streak = new THREE.Mesh(
        new THREE.CapsuleGeometry(thick, h, 4, 8),
        syrupMat,
      )
      // Inside wall — never proud of PET exterior
      const r = 0.105 + seeded(i, 4) * 0.012
      streak.position.set(Math.cos(a) * r, 0.09 + h * 0.38, Math.sin(a) * r)
      streak.lookAt(0, streak.position.y, 0)
      streak.rotateX(Math.PI / 2)
      // Flatten against inner wall
      streak.scale.set(1, 1, 0.35 + seeded(i, 5) * 0.25)
      g.add(streak)
    }
    // Short inner drips near top of syrup zone — elongated capsules only
    for (let i = 0; i < 4; i++) {
      const a = seeded(i, 30) * Math.PI * 2
      const blob = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.006 + seeded(i, 31) * 0.005, 0.024 + seeded(i, 34) * 0.016, 4, 8),
        syrupMat,
      )
      const r = 0.108 + seeded(i, 32) * 0.01
      blob.position.set(Math.cos(a) * r, 0.24 + seeded(i, 33) * 0.035, Math.sin(a) * r)
      blob.lookAt(0, blob.position.y, 0)
      blob.rotateX(Math.PI / 2)
      blob.scale.set(1, 1, 0.4)
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
    // Taro purple body — saturated violet so color reads through clear PET
    const taro = new THREE.Mesh(
      latheLiquid(0.33, 0.146, 0.123),
      phys(0x9a62c8, {
        roughness: 0.08,
        transmission: 0.2,
        transparent: true,
        opacity: 0.97,
        thickness: 0.95,
        ior: 1.39,
        attenuationColor: new THREE.Color(0x4a1e80),
        attenuationDistance: 0.052,
        clearcoat: 0.88,
        clearcoatRoughness: 0.04,
        sheen: 0.4,
        sheenColor: new THREE.Color(0xe8c8ff),
        envMapIntensity: 1.2,
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

    // Foam micro-bumps — flat half-ellipsoids glued to cream head (not free white spheres)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + seeded(i, 6) * 0.2
      const br = 0.014 + seeded(i, 6) * 0.012
      const bump = new THREE.Mesh(
        new THREE.SphereGeometry(br, 10, 8),
        creamMat,
      )
      bump.position.set(
        Math.cos(a) * (0.03 + seeded(i, 7) * 0.05),
        0.395 + seeded(i, 8) * 0.012,
        Math.sin(a) * (0.03 + seeded(i, 7) * 0.05),
      )
      // Heavy Y-squash so they read as foam surface grain, not floating orbs
      bump.scale.set(1.15, 0.32 + seeded(i, 65) * 0.12, 1.15)
      g.add(bump)
    }

    // Purple speckles in foam — flat flecks
    const speckMat = phys(0x7a4aaa, { roughness: 0.48 }, w)
    for (let i = 0; i < 16; i++) {
      const sp = new THREE.Mesh(
        new THREE.SphereGeometry(0.003 + seeded(i, 9) * 0.003, 6, 5),
        speckMat,
      )
      const a = seeded(i, 10) * Math.PI * 2
      const r = seeded(i, 11) * 0.09
      sp.position.set(Math.cos(a) * r, 0.398 + seeded(i, 12) * 0.01, Math.sin(a) * r)
      sp.scale.set(1.2, 0.4, 1.2)
      g.add(sp)
    }

    // Meniscus under foam + surface sheen disc (capillary against clear PET)
    const surfaceDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.112, 36),
      phys(0xc080e0, {
        roughness: 0.015,
        transparent: true,
        opacity: 0.7,
        clearcoat: 1,
        clearcoatRoughness: 0.015,
        transmission: 0.18,
        thickness: 0.05,
        ior: 1.38,
        side: THREE.DoubleSide,
        envMapIntensity: 1.5,
      }, w),
    )
    surfaceDisc.rotation.x = -Math.PI / 2
    surfaceDisc.position.y = 0.328
    g.add(surfaceDisc)

    const meniscus = new THREE.Mesh(
      new THREE.TorusGeometry(0.118, 0.017, 12, 48),
      phys(0xd8a0f0, {
        roughness: 0.012,
        transparent: true,
        opacity: 0.9,
        clearcoat: 1,
        clearcoatRoughness: 0.012,
        transmission: 0.16,
        thickness: 0.1,
        ior: 1.4,
        envMapIntensity: 1.6,
        specularIntensity: 1.25,
      }, w),
    )
    meniscus.name = 'meniscus'
    meniscus.rotation.x = Math.PI / 2
    meniscus.position.y = 0.335
    g.add(meniscus)

    const meniscusHi = new THREE.Mesh(
      new THREE.TorusGeometry(0.126, 0.0055, 8, 44),
      phys(0xf6e4ff, {
        roughness: 0.008,
        transparent: true,
        opacity: 0.72,
        clearcoat: 1,
        transmission: 0.24,
        thickness: 0.03,
        ior: 1.38,
        emissive: new THREE.Color(0x402060),
        emissiveIntensity: 0.12,
        envMapIntensity: 1.45,
      }, w),
    )
    meniscusHi.rotation.x = Math.PI / 2
    meniscusHi.position.y = 0.344
    g.add(meniscusHi)
  }

  // --- Tapioca pearls: contact-settled submerged pile (not free-float mid-air spheres) ---
  // Wet tapioca: dark brown + glossy clearcoat; slight contact squash between beads.
  const pearlMat = phys(0x2a1a10, {
    roughness: 0.32,
    clearcoat: 0.88,
    clearcoatRoughness: 0.16,
    metalness: 0.02,
    sheen: 0.4,
    sheenColor: new THREE.Color(0x6a3a22),
    sheenRoughness: 0.42,
    // Soft fill so pearls never silhouette as pure black against liquid
    emissive: new THREE.Color(0x1c0e08),
    emissiveIntensity: 0.05,
    envMapIntensity: 0.95,
  }, w)

  // PERFORMANCE.md: no pearl shadows; instancing batches draw calls.
  // Hex-ish bottom lattice layers → contact pile, fully inside liquid volume.
  const floorY = 0.032
  const pearlRadBase = isBrown ? 0.016 : 0.015
  // Layer row counts (hex packing); brown denser heap, taro smaller bottom cluster
  const layerRows = isBrown
    ? [7, 6, 5, 3] // ~21 bottom + upper contact rings
    : [6, 5, 3]
  let pearlCount = 0
  for (const n of layerRows) pearlCount += n
  // A few extra contact-jitter pearls nestled in gaps (not free float)
  const gapExtra = isBrown ? 6 : 4
  pearlCount += gapExtra

  const pearlMesh = new THREE.InstancedMesh(PEARL_GEO, pearlMat, pearlCount)
  pearlMesh.name = 'pearls'
  pearlMesh.castShadow = false
  pearlMesh.receiveShadow = false
  pearlMesh.frustumCulled = true
  const dummy = new THREE.Object3D()
  let pi = 0
  for (let layer = 0; layer < layerRows.length; layer++) {
    const n = layerRows[layer]
    // Contact stack: each layer sits ~1.75*rad above previous (slight nest)
    const y = floorY + pearlRadBase * 0.85 + layer * pearlRadBase * 1.72
    const ringR = Math.max(0.012, (isBrown ? 0.095 : 0.088) - layer * 0.014)
    const angOff = layer * 0.35 // hex stagger
    for (let j = 0; j < n; j++) {
      const rad = pearlRadBase * (0.88 + seeded(pi, 13) * 0.22)
      const ang = angOff + (j / n) * Math.PI * 2 + seeded(pi, 14) * 0.12
      // Inner packing: not all on outer ring — fill disk with contact bias
      const rFrac = n <= 3 ? 0.35 + seeded(pi, 16) * 0.45 : 0.25 + Math.sqrt(seeded(pi, 16)) * 0.75
      const r = Math.min(ringR, rFrac * ringR + (n === 1 ? 0 : 0))
      // Single center pearl on lowest layer
      const useR = layer === 0 && j === 0 ? seeded(pi, 70) * 0.02 : r
      dummy.position.set(
        Math.cos(ang) * useR,
        y + seeded(pi, 17) * 0.004,
        Math.sin(ang) * useR,
      )
      // Contact squash (slightly flat Y) + soft horizontal contact
      const squash = 0.88 + seeded(pi, 18) * 0.08
      dummy.scale.set(rad * 1.02, rad * squash, rad * 1.02)
      dummy.rotation.set(
        seeded(pi, 40) * 0.35,
        seeded(pi, 41) * Math.PI,
        seeded(pi, 42) * 0.35,
      )
      dummy.updateMatrix()
      pearlMesh.setMatrixAt(pi, dummy.matrix)
      pi++
    }
  }
  // Gap fillers nestled against floor pile (still contact-correct, low Y)
  for (let i = 0; i < gapExtra; i++) {
    const rad = pearlRadBase * (0.75 + seeded(i, 80) * 0.2)
    const ang = seeded(i, 81) * Math.PI * 2
    const r = 0.02 + seeded(i, 82) * (isBrown ? 0.07 : 0.06)
    const y = floorY + rad * 0.9 + seeded(i, 83) * pearlRadBase * 1.4
    dummy.position.set(Math.cos(ang) * r, Math.min(y, isBrown ? 0.14 : 0.12), Math.sin(ang) * r)
    dummy.scale.set(rad, rad * 0.9, rad)
    dummy.rotation.set(seeded(i, 84) * 0.5, seeded(i, 85) * Math.PI, 0)
    dummy.updateMatrix()
    pearlMesh.setMatrixAt(pi, dummy.matrix)
    pi++
  }
  pearlMesh.instanceMatrix.needsUpdate = true
  g.add(pearlMesh)

  // Brown sugar only: a few pearls just under meniscus — clustered, half-submerged read
  // (not free-float mid-volume orbs). Contact with each other near surface.
  if (isBrown) {
    const topPearlCount = 5
    const topPearls = new THREE.InstancedMesh(PEARL_GEO, pearlMat, topPearlCount)
    topPearls.name = 'surface_pearls'
    topPearls.castShadow = false
    for (let i = 0; i < topPearlCount; i++) {
      const rad = 0.012 + seeded(i, 19) * 0.006
      const a = (i / topPearlCount) * Math.PI * 2 + 0.4
      // Tight cluster near center-front under surface disc (y≈0.328)
      const r = 0.018 + seeded(i, 44) * 0.028
      dummy.position.set(
        Math.cos(a) * r,
        0.3 + seeded(i, 20) * 0.012,
        Math.sin(a) * r,
      )
      dummy.scale.set(rad * 1.05, rad * 0.82, rad * 1.05) // surface-break squash
      dummy.rotation.set(0.2, seeded(i, 45) * Math.PI, 0.15)
      dummy.updateMatrix()
      topPearls.setMatrixAt(i, dummy.matrix)
    }
    topPearls.instanceMatrix.needsUpdate = true
    g.add(topPearls)
  }

  // --- Condensation droplets: wall-glued flattened beads (film is primary wetness) ---
  // Stick slightly proud of condensation_film (scale 1.014).
  const dropWallR = (y: number) => wallRadiusAt(y) * 1.018

  // Wet water beads — clearcoat sparkle, moderate T (not black orbs, not milk blobs).
  const dropMat = phys(0xf4fafc, {
    roughness: 0.08,
    metalness: 0,
    transmission: 0.22,
    transparent: true,
    opacity: 0.7,
    thickness: 0.018,
    ior: 1.33,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.45,
    specularIntensity: 1.25,
    attenuationColor: new THREE.Color(0xe8f4fa),
    attenuationDistance: 0.2,
    depthWrite: false,
    emissive: new THREE.Color(0xd0e8f4),
    emissiveIntensity: 0.04,
  }, w)

  // Flattened mid-size beads hugging exterior only (sparse — film already sparse)
  const dropCount = 18
  const drops = new THREE.InstancedMesh(DROP_GEO, dropMat, dropCount)
  drops.name = 'condensation_drops'
  drops.castShadow = false
  drops.renderOrder = 2
  for (let i = 0; i < dropCount; i++) {
    const s = i % 5 === 0
      ? 0.008 + seeded(i, 21) * 0.005
      : 0.004 + seeded(i, 21) * 0.004
    const ang = seeded(i, 22) * Math.PI * 2
    // Mid/lower band on cup body only (not under lid air gap)
    const y = 0.055 + seeded(i, 23) * 0.28
    const wallR = dropWallR(y)
    dummy.position.set(Math.cos(ang) * wallR, y, Math.sin(ang) * wallR)
    // Heavy radial squash + vertical stretch = runoff bead glued to PET
    // Scale X toward wall normal (local): orient with Y-up, squash Z/X differently via rot
    dummy.scale.set(
      s * 0.45, // thin off-wall
      s * (1.35 + seeded(i, 24) * 0.55), // elongated drip
      s * 0.75, // circumferential
    )
    // Face outward from cup axis so thin axis points radial
    dummy.rotation.set(0, -ang + Math.PI / 2, seeded(i, 50) * 0.08)
    dummy.updateMatrix()
    drops.setMatrixAt(i, dummy.matrix)
  }
  drops.instanceMatrix.needsUpdate = true
  g.add(drops)

  // Running condensation trails — thin wall-stuck streaks
  for (let i = 0; i < 8; i++) {
    const tw = 0.0025 + seeded(i, 25) * 0.002
    const th = 0.045 + seeded(i, 46) * 0.055
    const trail = new THREE.Mesh(TRAIL_GEO, dropMat)
    const ang = seeded(i, 26) * Math.PI * 2
    const y = 0.1 + seeded(i, 27) * 0.24
    const wallR = dropWallR(y)
    trail.position.set(Math.cos(ang) * wallR, y, Math.sin(ang) * wallR)
    trail.scale.set(tw * 0.55, th, tw * 0.4)
    trail.rotation.y = -ang + Math.PI / 2
    trail.renderOrder = 2
    g.add(trail)
  }

  // Larger focal beads lower third — still frosted clearcoat, wall-glued
  for (let i = 0; i < 4; i++) {
    const s = 0.009 + seeded(i, 47) * 0.005
    const bead = new THREE.Mesh(DROP_GEO, dropMat)
    const ang = (i / 4) * Math.PI * 2 + seeded(i, 48) * 0.2
    const y = 0.07 + seeded(i, 49) * 0.09
    const wallR = dropWallR(y)
    bead.position.set(Math.cos(ang) * wallR, y, Math.sin(ang) * wallR)
    bead.scale.set(s * 0.42, s * 1.5, s * 0.7)
    bead.rotation.y = -ang + Math.PI / 2
    bead.renderOrder = 2
    g.add(bead)
  }

  // Lid dome micro-beads — tiny flat, clearcoat only (no high-T black orbs)
  for (let i = 0; i < 4; i++) {
    const s = 0.0035 + seeded(i, 60) * 0.003
    const bead = new THREE.Mesh(DROP_GEO, dropMat)
    const a = seeded(i, 61) * Math.PI * 2
    const polar = 0.4 + seeded(i, 62) * 0.4
    const r = Math.sin(polar) * 0.115
    bead.position.set(
      Math.cos(a) * r,
      0.49 + Math.cos(polar) * 0.075,
      Math.sin(a) * r,
    )
    bead.scale.set(s * 1.1, s * 0.45, s * 1.1)
    bead.renderOrder = 2
    g.add(bead)
  }

  return g
}

export function createBobaCupPairModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group()
  root.name = 'BobaCupPair'
  root.userData.img2threejs = {
    skill: 'img2threejs@1.5.x',
    source: 'demos/room/public/assets/boba.jpg',
    pass: 'form+material-v9-clear-wet-pet-kill-frost-jar',
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
