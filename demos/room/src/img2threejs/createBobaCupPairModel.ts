/**
 * img2threejs form/material pass — BobaCupPair (v35: cold PET shell + tea volume + wet beads).
 * Reference: public/assets/boba.jpg
 *
 * LOOP residual #8 (loop-r31 counter still): weak liquid transmission/condensation; stack reads toy, not plastic+pearl.
 *
 * Root cause (r31 stills after v34):
 * (1) taro cream hemisphere + pink body band = cake stack, not liquid-in-cup;
 * (2) dairy still too close to wall at counter FOV → no clear PET shell ring;
 * (3) condensate lenses too sparse/small vs ref-plate cold-cup water density;
 * (4) multi-band opaque spheres (taro_top/cream) kill continuous tea depth + dome headspace.
 *
 * v35 ONE coherent fix (residual #8 — transmission / tea / condensate / straw, not glowing cylinders):
 *   • Deeper dairy inset → thick clear PET shell ring at silhouette (open T path)
 *   • Continuous wet tea body; thin cream film only (kill cake-stack hemispheres)
 *   • Dense wall-hug water lenses (specular cold-cup, no alpha film frost)
 *   • Bottom-third pearl mass silhouettes through PET; paper straw T≡0. Emissive ≡ 0.
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
    // Residual #4/#8: always lock after spread — never contribute to bloom as self-glow
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0,
  })
}

function seeded(i: number, salt = 0) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Condensation roughness map — v35: sparse wet beads ON clear PET (open T path).
 * r14 fail: continuous lower-band frost → cloudy jars.
 * r20 fail: dense white runoff trails + high film opacity → chalk paint drips on cups.
 * r24–r27: freckle/teardrop alpha films → white chalk on purple toy / drip paint.
 * r28–r29: outer alpha film mesh frosts PET into opaque potion jar (kills T path).
 * r30–r31: clearcoatRoughnessMap / soft damp islands frost jar — kill damp sheet;
 *      keep only discrete spherical bead roughness so tea/pearls read through wall.
 * Geometric lenses (below) carry cold-cup water density; map is micro-rough only.
 */
let _condenseRough: THREE.CanvasTexture | null = null
function getCondensationRoughnessMap() {
  if (_condenseRough) return _condenseRough
  const size = 256
  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = size
  roughCanvas.height = size
  const rc = roughCanvas.getContext('2d')!
  // Base: pure dry PET (black = roughness floor — open transmission to tea)
  rc.fillStyle = '#000000'
  rc.fillRect(0, 0, size, size)
  // Discrete spherical wet beads only (no soft damp islands — those frosted the jar)
  for (let i = 0; i < 36; i++) {
    const x = seeded(i, 120) * size
    const y = size * (0.1 + seeded(i, 121) * 0.72)
    const r = 1.2 + seeded(i, 122) * 2.2
    const a = 0.42 + seeded(i, 123) * 0.4
    rc.fillStyle = `rgba(255,255,255,${a})`
    rc.beginPath()
    rc.ellipse(x, y, r * 0.98, r * (0.9 + seeded(i, 124) * 0.14), 0, 0, Math.PI * 2)
    rc.fill()
  }
  // Focal beads (near-spherical — never tall paint drips)
  for (let i = 0; i < 14; i++) {
    const x = seeded(i, 125) * size
    const y = size * (0.16 + seeded(i, 126) * 0.58)
    const r = 2.2 + seeded(i, 127) * 2.6
    rc.fillStyle = `rgba(255,255,255,${0.55 + seeded(i, 129) * 0.35})`
    rc.beginPath()
    rc.ellipse(x, y, r, r * 1.05, 0, 0, Math.PI * 2)
    rc.fill()
  }

  const roughness = new THREE.CanvasTexture(roughCanvas)
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping
  roughness.repeat.set(2.2, 1.85)
  roughness.colorSpace = THREE.NoColorSpace
  roughness.needsUpdate = true

  _condenseRough = roughness
  return _condenseRough
}

/**
 * Flared PET cup wall — slight belly + rolled lip (premium takeout, not generic cylinder).
 * @param inset radial inward offset for inner shell (wall thickness ≈ 0.009–0.011).
 */
function latheCupWall(inset = 0): THREE.LatheGeometry {
  // x = radius, y = height — outer profile; inset shrinks radii for double-wall shell
  const d = Math.max(0, inset)
  const pts = [
    new THREE.Vector2(0.146 - d, 0.02 + d * 0.4),
    new THREE.Vector2(0.152 - d, 0.055),
    new THREE.Vector2(0.151 - d, 0.1),
    new THREE.Vector2(0.147 - d, 0.18),
    new THREE.Vector2(0.14 - d, 0.28),
    new THREE.Vector2(0.132 - d, 0.37),
    new THREE.Vector2(0.126 - d, 0.43),
    // Soft shoulder into open lip
    new THREE.Vector2(0.128 - d, 0.455),
    new THREE.Vector2(0.134 - d * 0.85, 0.465),
  ]
  return new THREE.LatheGeometry(pts, 40)
}

/** Wall thickness — thick geometric double-wall so rim edge reads without any transmission. */
const PET_WALL = 0.016

/** Liquid body with surface meniscus (inward lip + capillary climb). Full bottom fill — no empty PET skirt. */
function latheLiquid(fillH: number, bottomR: number, topR: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = []
  // Seat liquid on cup floor so PET never shows empty clear skirt (r26 residual)
  pts.push(new THREE.Vector2(0.0, 0.018))
  pts.push(new THREE.Vector2(bottomR * 0.92, 0.018))
  pts.push(new THREE.Vector2(bottomR, 0.022))
  const steps = 12
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = 0.022 + t * (fillH - 0.022)
    const r = bottomR + (topR - bottomR) * t
    pts.push(new THREE.Vector2(r, y))
  }
  // Strong capillary meniscus: climb wall then dip center (wet liquid read)
  pts.push(new THREE.Vector2(topR + 0.008, fillH + 0.008))
  pts.push(new THREE.Vector2(topR + 0.003, fillH + 0.016))
  pts.push(new THREE.Vector2(topR - 0.01, fillH + 0.012))
  pts.push(new THREE.Vector2(topR * 0.55, fillH + 0.004))
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
    // Opaque hard PP thin paper tube — bold stripe contrast (r26: invisible straw → faucet = pipe)
    const isDark = i % 2 === 0
    const mat = phys(isDark ? colors[0] : colors[1], {
      roughness: isDark ? 0.28 : 0.14,
      clearcoat: isDark ? 0.45 : 0.75,
      clearcoatRoughness: 0.1,
      sheen: 0.06,
      sheenColor: new THREE.Color(0xffffff),
      sheenRoughness: 0.4,
      // Longitudinal highlight band (plastic extrusion grain)
      anisotropy: 0.8,
      anisotropyRotation: 0,
      specularIntensity: isDark ? 0.4 : 0.72,
      envMapIntensity: isDark ? 0.18 : 0.42, // light stripes pop under night key
      // No transmission — solid polypropylene wall, not frosted/glow cylinder
      metalness: 0,
      transmission: 0.0,
      transparent: false,
      opacity: 1,
    }, w)
    // Slight taper toward top for thin plastic-tube read
    const rTop = radius * (1 - i * 0.0035)
    const rBot = radius * (1 - (i + 1) * 0.0035)
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBot, segH * 1.02, 12),
      mat,
    )
    seg.position.y = -length / 2 + segH * 0.5 + i * segH
    g.add(seg)
  }
  // Hollow bore — thin wall so tube (not garden hose) reads at counter FOV
  const boreR = radius * 0.52
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(boreR, boreR, length * 0.98, 10, 1, true),
    phys(0x08080e, {
      roughness: 0.7,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      envMapIntensity: 0.12,
      transmission: 0.0,
    }, w),
  )
  g.add(inner)
  // Top cut rim (thin plastic edge — not fat hose bead)
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.7, radius * 0.11, 6, 14),
    phys(colors[0], {
      roughness: 0.18,
      clearcoat: 0.65,
      anisotropy: 0.45,
      envMapIntensity: 0.35,
      specularIntensity: 0.7,
      transmission: 0.0,
    }, w),
  )
  rim.rotation.x = Math.PI / 2
  rim.position.y = length / 2
  g.add(rim)
  // Open mouth ring (bore visible at tip — thin-tube cue)
  const mouth = new THREE.Mesh(
    new THREE.RingGeometry(boreR * 0.88, radius * 0.9, 14),
    phys(0x06060a, { roughness: 0.5, side: THREE.DoubleSide, envMapIntensity: 0.18, transmission: 0.0 }, w),
  )
  mouth.rotation.x = -Math.PI / 2
  mouth.position.y = length / 2 + 0.001
  g.add(mouth)
  // Bottom tip (under liquid) — slight bevel so submerged end reads
  const tip = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.92, radius * 0.78, radius * 0.45, 10),
    phys(colors[0], { roughness: 0.28, clearcoat: 0.45, envMapIntensity: 0.28, transmission: 0.0 }, w),
  )
  tip.position.y = -length / 2 + radius * 0.16
  g.add(tip)
  return g
}

/** Shared pearl geo — smooth wet spheres at beauty FOV. Condensate is map-only (no DROP/TRAIL greeble). */
const PEARL_GEO = new THREE.SphereGeometry(1, 14, 12)
/** Flat wall-hugging water lens (authored condensate focal beads — not sphere greeble pile). */
const LENS_GEO = new THREE.SphereGeometry(1, 10, 8)

function wallRadiusAt(y: number): number {
  // Matches latheCupWall outer belly + taper (v12 profile)
  const t = Math.max(0, Math.min(1, (y - 0.02) / 0.44))
  // approx outer R: 0.152 mid-low → 0.126 shoulder
  return 0.152 - t * 0.026
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

  // Outer PET — CLEAR takeout plastic (v35: SOLE high-T surface; sparse bead roughness only).
  // High T + thin optical shell + deep dairy inset = tea-in-cup, not opaque pink potion (r31).
  // Nested transparent dairy empties T → dairy stays T≡0. NO clearcoatRoughnessMap frost.
  // Condensate roughness is baked here — NO outer alpha film mesh.
  const condenseRough = getCondensationRoughnessMap()
  const plasticOuter = phys(0xfefcf8, {
    roughness: 0.008, // dry PET floor; map raises only discrete wet bead roughness
    roughnessMap: condenseRough,
    metalness: 0,
    transmission: 1.0, // clear PET — open path to layered tea midtones + pearls
    thickness: 0.012, // thin optical shell — wall must not milk-haze tea chroma (r30/r31)
    attenuationColor: new THREE.Color(0xfdfaf6), // near-clear PET edge — never milk/potion haze
    attenuationDistance: 7.0, // stay open so tea + pearls read through wall
    transparent: true,
    opacity: 1,
    ior: 1.52, // PET refractive index (shell edge catch under warm key)
    clearcoat: 1.0,
    clearcoatRoughness: 0.01, // uniform wet plastic — no roughnessMap on clearcoat (frost kill)
    specularIntensity: 1.0,
    envMapIntensity: 1.85, // night-key plastic rim — critical vs opaque potion (r31)
    side: THREE.FrontSide,
    depthWrite: true,
  }, w)

  // Inner PET shell — whisper wall-thickness cue only (never muddy veil over tea)
  const plasticInner = phys(0xc8c0b4, {
    roughness: 0.22,
    metalness: 0,
    transmission: 0.0,
    thickness: 0,
    transparent: true,
    opacity: 0.018, // whisper ring — dairy midtones primary through outer PET
    ior: 1.5,
    clearcoat: 0.12,
    clearcoatRoughness: 0.2,
    specularIntensity: 0.1,
    envMapIntensity: 0.08,
    side: THREE.BackSide,
    depthWrite: false,
  }, w)

  const plasticOpaqueBottom = phys(0x4a3c32, {
    roughness: 0.38,
    transmission: 0.0, // solid base — grounds cup, zero light bloom through floor
    thickness: 0,
    transparent: false,
    opacity: 1,
    ior: 1.49,
    clearcoat: 0.45,
    clearcoatRoughness: 0.24,
    envMapIntensity: 0.18,
  }, w)

  // --- Cup body: geometric DOUBLE-WALL (outer + inner + rim edge) ---
  const body = new THREE.Mesh(latheCupWall(0), plasticOuter)
  body.name = 'cup_wall_outer'
  body.castShadow = cast
  body.receiveShadow = true
  g.add(body)

  const bodyInner = new THREE.Mesh(latheCupWall(PET_WALL), plasticInner)
  bodyInner.name = 'cup_wall_inner'
  bodyInner.castShadow = false
  bodyInner.receiveShadow = true
  g.add(bodyInner)

  // Rim edge annulus — dense PET band sells wall thickness at lip (opaque edge cue)
  const lipOuterR = 0.134
  const lipInnerR = lipOuterR - PET_WALL * 0.95
  const lipEdge = new THREE.Mesh(
    new THREE.RingGeometry(lipInnerR, lipOuterR, 40),
    phys(0xe8e0d6, {
      roughness: 0.12,
      transmission: 0.0,
      transparent: false,
      opacity: 1,
      clearcoat: 0.78,
      clearcoatRoughness: 0.08,
      ior: 1.49,
      thickness: 0,
      envMapIntensity: 0.32,
      specularIntensity: 0.68,
      side: THREE.DoubleSide,
    }, w),
  )
  lipEdge.name = 'cup_lip_edge'
  lipEdge.rotation.x = -Math.PI / 2
  lipEdge.position.y = 0.465
  g.add(lipEdge)

  // v34: NO outer condensation_film mesh — alpha veil frosted PET into opaque potion (r29/r30).
  // Wet bead roughness lives on plasticOuter; geometric lenses below catch specular only.

  // Bottom disc + slight dome
  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.149, 0.146, 0.02, 40),
    plasticOpaqueBottom,
  )
  bottom.position.y = 0.012
  bottom.castShadow = cast
  g.add(bottom)

  // Rolled open-top lip torus — dense PET bead (breaks cylinder silhouette, thickness cue)
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(0.129, 0.011, 10, 42),
    phys(0xe6ddd2, {
      roughness: 0.1,
      transmission: 0.0,
      transparent: false,
      opacity: 1,
      clearcoat: 0.85,
      clearcoatRoughness: 0.07,
      ior: 1.49,
      thickness: 0,
      envMapIntensity: 0.34,
      specularIntensity: 0.7,
    }, w),
  )
  lip.name = 'cup_lip'
  lip.rotation.x = Math.PI / 2
  lip.position.y = 0.462
  g.add(lip)

  // Two faint mold lines only (opaque PET injection seams — zero T, no glow rings)
  for (const y of [0.14, 0.32]) {
    const r = 0.149 - (y - 0.1) * 0.036
    const ridge = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.0018, 5, 36),
      phys(0xa89888, {
        roughness: 0.28,
        transmission: 0.0,
        transparent: false,
        opacity: 1,
        clearcoat: 0.35,
        ior: 1.49,
        envMapIntensity: 0.28,
      }, w),
    )
    ridge.rotation.x = Math.PI / 2
    ridge.position.y = y
    g.add(ridge)
  }

  // Dome lid — clear thin PET matching body (plastic transmission, not frost/lantern)
  // Headspace under lid is critical clear-cup cue (r26–r31 plug / weak dome transmission)
  const lidMat = phys(0xfefcf8, {
    roughness: 0.008,
    roughnessMap: condenseRough, // sparse wet spots on dome only (same map, open T)
    transmission: 1.0,
    thickness: 0.006, // thinner dome = cream/tea refracts through lid (r31)
    attenuationColor: new THREE.Color(0xfdfaf6),
    attenuationDistance: 7.0,
    transparent: true,
    opacity: 1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    ior: 1.52,
    envMapIntensity: 1.75, // dome plastic catch — sells clear headspace over cream
    specularIntensity: 1.0,
    side: THREE.FrontSide,
    depthWrite: true,
  }, w)
  const lid = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    lidMat,
  )
  lid.name = 'lid'
  lid.position.y = 0.46
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
  seal.position.y = 0.458
  g.add(seal)

  // Lid snap rim
  const lidRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.134, 0.131, 0.022, 36, 1, true),
    plasticOuter,
  )
  lidRim.position.y = 0.452
  g.add(lidRim)

  // Straw hole plug ring on dome (fits thin paper tube — matches straw insert)
  const hole = new THREE.Mesh(
    new THREE.TorusGeometry(0.02, 0.004, 8, 16),
    phys(0xa09080, {
      roughness: 0.22,
      clearcoat: 0.45,
      envMapIntensity: 0.28,
      transmission: 0.0,
      specularIntensity: 0.5,
    }, w),
  )
  hole.rotation.x = Math.PI / 2
  hole.position.set(0.028, 0.588, 0.01)
  g.add(hole)

  // --- Straw (visible thin paper tube — residual #10; must beat faucet "pipe" silhouette) ---
  // Ref plate OD ≈ 1/7–1/6 cup diameter → R ≈ 0.017–0.019. Bold stripes + tall above dome.
  // Hollow PP, T≡0, never frosted/glow hose (r29: not glowing cylinder).
  const strawLen = 0.76
  const strawR = 0.019
  const straw = isBrown
    ? makeStripedStraw([0x050508, 0xffffff], 28, strawLen, strawR, w)
    : makeStripedStraw([0x240a50, 0xfaf4fc], 28, strawLen, strawR, w)
  straw.position.set(0.028, 0.64, 0.01)
  straw.rotation.z = 0.08
  straw.rotation.x = -0.045
  straw.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = cast
    }
  })
  g.add(straw)

  // Liquid seats DEEP inside PET wall so thick clear shell refracts tea (r27/r31 residual:
  // liqBotR ≈ outer wall → dairy flush with exterior = solid purple mug, no transmission read).
  // Full bottom fill (no empty clear skirt / no exterior wall-gap air pearls — r26 kill).
  // v35: deeper inset so PET wall thickness + shell-gap syrup + tea depth read through open T.
  const liqBotR = 0.146 - PET_WALL - 0.028 // ~0.102 — thick clear shell over dairy (r31)
  const liqTopR = 0.126 - PET_WALL - 0.026 // ~0.084 — taper with cup; shell ring at silhouette

  // --- Liquid: v35 CONTINUOUS wet milk-tea (must land in open PET transmission buffer) ---
  // Nested transparent/T dairy empties T framebuffer → empty jars (r19/r21). Dairy T≡0 opaque.
  // Depth bands + sheen + clearcoat = wet milk under night key (not opaque potion / cake stack).
  // PET alone owns clear plastic T. Thin cream film only → headspace under dome sells clear cup.
  // Pearls ONLY inside tea volume (silhouette through PET against chroma).
  if (isBrown) {
    // Dark brown-sugar syrup floor — full bottom fill (no empty clear PET skirt)
    const pool = new THREE.Mesh(
      new THREE.CylinderGeometry(liqBotR - 0.002, liqBotR, 0.1, 32),
      phys(0x020100, {
        roughness: 0.06,
        clearcoat: 0.96,
        clearcoatRoughness: 0.035,
        transparent: false,
        opacity: 1,
        transmission: 0.0,
        envMapIntensity: 0.24,
        specularIntensity: 0.86,
        sheen: 0.65,
        sheenColor: new THREE.Color(0x7a2808),
        sheenRoughness: 0.2,
      }, w),
    )
    pool.name = 'syrup_pool'
    pool.position.y = 0.055
    g.add(pool)

    // Mid syrup band — dark caramel transition (layered depth, not flat paint cylinder)
    const midSyrup = new THREE.Mesh(
      new THREE.CylinderGeometry(liqBotR - 0.006, liqBotR - 0.01, 0.07, 32),
      phys(0x280c04, {
        roughness: 0.09,
        clearcoat: 0.9,
        clearcoatRoughness: 0.07,
        transparent: false,
        opacity: 1,
        transmission: 0.0,
        sheen: 0.8,
        sheenColor: new THREE.Color(0xa04012),
        sheenRoughness: 0.18,
        envMapIntensity: 0.24,
        specularIntensity: 0.72,
      }, w),
    )
    midSyrup.name = 'syrup_mid'
    midSyrup.position.y = 0.112
    g.add(midSyrup)

    // SOLID amber milk-tea BODY — ref plate warm amber (wet milk, not matte paint can).
    // transparent:false + T≡0 so PET refracts real tea color through clear wall shell.
    // Fill ~0.24 leaves clear PET headspace under dome (r31 dome transmission sell).
    const milk = new THREE.Mesh(
      latheLiquid(0.24, liqBotR, liqTopR + 0.004),
      phys(0xb85a14, {
        roughness: 0.028, // wet milk surface under night key
        transmission: 0.0, // never nested-T under PET
        transparent: false, // must write into T buffer for PET refraction
        opacity: 1,
        thickness: 0,
        ior: 1.36,
        clearcoat: 1.0,
        clearcoatRoughness: 0.012,
        sheen: 1.0, // milk SSS surrogate (scatter rim under key)
        sheenColor: new THREE.Color(0xe89830),
        sheenRoughness: 0.07,
        envMapIntensity: 0.68, // night-key wet midtones through PET
        specularIntensity: 1.0,
        specularColor: new THREE.Color(0xffd898),
        depthWrite: true,
      }, w),
    )
    milk.name = 'milk_tea'
    milk.position.y = 0
    milk.castShadow = false
    milk.receiveShadow = true
    g.add(milk)

    // Soft lighter amber surface film (continuous tea — NOT a separate cake tier sphere)
    const amberTop = new THREE.Mesh(
      new THREE.SphereGeometry(liqTopR * 0.94, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.36),
      phys(0xd07820, {
        roughness: 0.04,
        transmission: 0.0,
        transparent: false,
        opacity: 1,
        thickness: 0,
        ior: 1.36,
        clearcoat: 0.98,
        clearcoatRoughness: 0.018,
        sheen: 1.0,
        sheenColor: new THREE.Color(0xf0a838),
        sheenRoughness: 0.1,
        envMapIntensity: 0.5,
        specularIntensity: 0.92,
        depthWrite: true,
      }, w),
    )
    amberTop.name = 'amber_top'
    amberTop.scale.set(1, 0.18, 1)
    amberTop.position.y = 0.218
    g.add(amberTop)

    // Wet surface meniscus — clearcoat specular plane (opaque amber, no chalk white ring)
    const surfaceDisc = new THREE.Mesh(
      new THREE.CircleGeometry(liqTopR - 0.006, 40),
      phys(0xc0681c, {
        roughness: 0.012,
        metalness: 0,
        transparent: false,
        opacity: 1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.006,
        transmission: 0.0,
        thickness: 0,
        ior: 1.34,
        side: THREE.DoubleSide,
        envMapIntensity: 0.72,
        specularIntensity: 1.0,
        depthWrite: true,
      }, w),
    )
    surfaceDisc.rotation.x = -Math.PI / 2
    surfaceDisc.position.y = 0.238
    g.add(surfaceDisc)

    const meniscus = new THREE.Mesh(
      new THREE.TorusGeometry(liqTopR - 0.004, 0.007, 10, 48),
      phys(0x9a5014, {
        roughness: 0.012,
        transparent: false,
        opacity: 1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.006,
        transmission: 0.0,
        thickness: 0,
        ior: 1.34,
        envMapIntensity: 0.6,
        specularIntensity: 1.0,
        depthWrite: true,
      }, w),
    )
    meniscus.name = 'meniscus'
    meniscus.rotation.x = Math.PI / 2
    meniscus.position.y = 0.24
    g.add(meniscus)

    // Brown sugar syrup rivulets — sit in CLEAR SHELL GAP (between dairy and PET).
    // r30 fail: streaks buried inside dairy never read through wall. Gap placement + open T
    // = viscous caramel drips on inner wall (ref plate), readable at counter FOV.
    const syrupMat = phys(0x050100, {
      roughness: 0.07,
      clearcoat: 0.96,
      clearcoatRoughness: 0.03,
      transparent: false,
      opacity: 1,
      transmission: 0.0,
      ior: 1.45,
      sheen: 0.75,
      sheenColor: new THREE.Color(0xb04010),
      sheenRoughness: 0.18,
      envMapIntensity: 0.28,
      specularIntensity: 0.88,
    }, w)
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + seeded(i, 1) * 0.28
      const h = 0.22 + seeded(i, 2) * 0.14
      const thick = 0.01 + seeded(i, 3) * 0.011
      const streak = new THREE.Mesh(
        new THREE.CapsuleGeometry(thick, h, 4, 8),
        syrupMat,
      )
      // Shell gap — just outside dairy so rivulets read through clear PET wall
      const r = liqBotR + 0.008 + seeded(i, 4) * 0.01
      streak.position.set(Math.cos(a) * r, 0.036 + h * 0.42, Math.sin(a) * r)
      streak.lookAt(0, streak.position.y, 0)
      streak.rotateX(Math.PI / 2)
      streak.scale.set(1, 1, 0.1 + seeded(i, 5) * 0.16)
      g.add(streak)
    }
    for (let i = 0; i < 10; i++) {
      const a = seeded(i, 30) * Math.PI * 2
      const blob = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.009 + seeded(i, 31) * 0.007, 0.022 + seeded(i, 34) * 0.018, 4, 8),
        syrupMat,
      )
      const r = liqBotR + 0.007 + seeded(i, 32) * 0.009
      blob.position.set(Math.cos(a) * r, 0.095 + seeded(i, 33) * 0.08, Math.sin(a) * r)
      blob.lookAt(0, blob.position.y, 0)
      blob.rotateX(Math.PI / 2)
      blob.scale.set(1, 1, 0.2)
      g.add(blob)
    }
  } else {
    // Taro — v35 CONTINUOUS cool blue-lavender dairy (r31 kill: pink cake stack under warm key).
    // Cooler blue-violet base → continuous lavender body → THIN cream film under clear dome.
    // Kill large cream hemisphere + taro_top sphere tiers (r31 toy stack residual).
    const taroBase = new THREE.Mesh(
      new THREE.CylinderGeometry(liqBotR - 0.002, liqBotR, 0.09, 32),
      phys(0x0a0410, {
        roughness: 0.07,
        clearcoat: 0.78,
        clearcoatRoughness: 0.09,
        transparent: false,
        transmission: 0.0,
        envMapIntensity: 0.24,
        sheen: 0.7,
        sheenColor: new THREE.Color(0x281448),
        sheenRoughness: 0.22,
        specularIntensity: 0.52,
      }, w),
    )
    taroBase.name = 'taro_base'
    taroBase.position.y = 0.05
    g.add(taroBase)

    // Mid band — cooler violet (breaks flat single-hue pink potion)
    const taroMid = new THREE.Mesh(
      new THREE.CylinderGeometry(liqBotR - 0.008, liqBotR - 0.004, 0.072, 32),
      phys(0x3e2858, {
        roughness: 0.07,
        clearcoat: 0.86,
        clearcoatRoughness: 0.07,
        transparent: false,
        transmission: 0.0,
        sheen: 0.88,
        sheenColor: new THREE.Color(0x6a4a88),
        sheenRoughness: 0.16,
        envMapIntensity: 0.34,
        specularIntensity: 0.64,
      }, w),
    )
    taroMid.name = 'taro_mid'
    taroMid.position.y = 0.105
    g.add(taroMid)

    // SOLID milky taro BODY — cool blue-lavender (not magenta-pink cake tier under warm key).
    // sheen SSS rim holds lilac chroma through clear PET shell. T≡0 opaque for PET refraction.
    // Fill ~0.255 continuous body; thin cream film only — kill cake stack (r31 residual).
    const taro = new THREE.Mesh(
      latheLiquid(0.255, liqBotR, liqTopR + 0.003),
      phys(0x7a6a9c, {
        roughness: 0.03, // wet milky dairy not chalk matte paint mug
        transmission: 0.0, // never nested-T under PET
        transparent: false, // must write into T buffer
        opacity: 1,
        thickness: 0,
        ior: 1.36,
        clearcoat: 1.0,
        clearcoatRoughness: 0.014,
        sheen: 1.0, // heavy milk SSS surrogate
        // Cool cream-lilac scatter — counters warm-key pink wash (r31 residual)
        sheenColor: new THREE.Color(0xb8acd4),
        sheenRoughness: 0.09,
        envMapIntensity: 0.58,
        specularIntensity: 0.98,
        specularColor: new THREE.Color(0xe8e0f2),
        depthWrite: true,
      }, w),
    )
    taro.name = 'taro_liquid'
    taro.castShadow = false
    taro.receiveShadow = true
    g.add(taro)

    // Thin cream / foam film only — soft wet disc under clear PET (NOT half-cup white cake dome).
    // Clear headspace + dome transmission read at counter FOV (r31 residual).
    const creamMat = phys(0xf0ecf2, {
      roughness: 0.18,
      sheen: 1.0,
      sheenColor: new THREE.Color(0xfaf8fb),
      sheenRoughness: 0.28,
      clearcoat: 0.88,
      clearcoatRoughness: 0.08,
      envMapIntensity: 0.5,
      specularIntensity: 0.78,
      transmission: 0.0,
      transparent: false,
      opacity: 1,
    }, w)
    // Flat-ish cream cap — thin film, not sphere cake tier
    const cream = new THREE.Mesh(
      new THREE.SphereGeometry(liqTopR * 0.88, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.42),
      creamMat,
    )
    cream.name = 'cream_head'
    cream.scale.set(1, 0.12, 1) // thin film, not cake hemisphere
    cream.position.y = 0.248
    g.add(cream)

    // Foam micro-bumps — soft half-ellipsoids on cream film only
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + seeded(i, 6) * 0.2
      const br = 0.005 + seeded(i, 6) * 0.004
      const bump = new THREE.Mesh(
        new THREE.SphereGeometry(br, 8, 6),
        creamMat,
      )
      bump.position.set(
        Math.cos(a) * (0.012 + seeded(i, 7) * 0.03),
        0.256 + seeded(i, 8) * 0.005,
        Math.sin(a) * (0.012 + seeded(i, 7) * 0.03),
      )
      bump.scale.set(1.1, 0.18 + seeded(i, 65) * 0.08, 1.1)
      g.add(bump)
    }

    // Purple speckles in foam — flat flecks (ref plate)
    const speckMat = phys(0x32145c, { roughness: 0.36, clearcoat: 0.28, transmission: 0.0 }, w)
    for (let i = 0; i < 12; i++) {
      const sp = new THREE.Mesh(
        new THREE.SphereGeometry(0.0018 + seeded(i, 9) * 0.002, 6, 5),
        speckMat,
      )
      const a = seeded(i, 10) * Math.PI * 2
      const r = seeded(i, 11) * 0.05
      sp.position.set(Math.cos(a) * r, 0.254 + seeded(i, 12) * 0.005, Math.sin(a) * r)
      sp.scale.set(1.15, 0.24, 1.15)
      g.add(sp)
    }

    // Wet cream surface — clearcoat film (opaque, no multi-T glow stack)
    const surfaceDisc = new THREE.Mesh(
      new THREE.CircleGeometry(liqTopR - 0.014, 36),
      phys(0xe6e0ec, {
        roughness: 0.02,
        transparent: false,
        opacity: 1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.014,
        transmission: 0.0,
        thickness: 0,
        ior: 1.34,
        side: THREE.DoubleSide,
        envMapIntensity: 0.55,
        specularIntensity: 0.96,
        depthWrite: true,
      }, w),
    )
    surfaceDisc.rotation.x = -Math.PI / 2
    surfaceDisc.position.y = 0.258
    g.add(surfaceDisc)

    const meniscus = new THREE.Mesh(
      new THREE.TorusGeometry(liqTopR - 0.01, 0.006, 10, 44),
      phys(0xc8bcd8, {
        roughness: 0.02,
        transparent: false,
        opacity: 1,
        clearcoat: 0.98,
        clearcoatRoughness: 0.014,
        transmission: 0.0,
        thickness: 0,
        ior: 1.34,
        envMapIntensity: 0.46,
        specularIntensity: 0.88,
        depthWrite: true,
      }, w),
    )
    meniscus.name = 'meniscus'
    meniscus.rotation.x = Math.PI / 2
    meniscus.position.y = 0.26
    g.add(meniscus)
  }

  // --- Tapioca pearls: wet chewy mass fully INSIDE tea (silhouette vs solid dairy) ---
  // Dark wet brown + heavy clearcoat + amber sheen = translucent chewy skin cue without
  // transmission (mid-T beads under bloom read as glow dots — r18 residual).
  // v35: pearls ONLY inside dairy — denser outer ring silhouettes through open PET (r31 volume).
  const pearlMat = phys(0x020100, {
    roughness: 0.015,
    clearcoat: 1.0,
    clearcoatRoughness: 0.002,
    metalness: 0.0,
    sheen: 1.0, // wet translucency cue (chewy tapioca under key)
    sheenColor: new THREE.Color(0xc86820),
    sheenRoughness: 0.05,
    // Wet skin via clearcoat + sheen only — T under bloom = glow dots; never transmit
    transmission: 0.0,
    ior: 1.48,
    transparent: false,
    opacity: 1,
    envMapIntensity: 0.7, // wet specular catch without white hot-dot under bloom
    specularIntensity: 1.0,
    specularColor: new THREE.Color(0xe89858),
  }, w)

  // PERFORMANCE.md: no pearl shadows; instancing batches draw calls.
  // v35: dense bottom heap fully INSIDE dairy — outer ring silhouettes through open PET against tea.
  // NO exterior wall-gap pearls (r26 residual: clear skirt + floating dots).
  const floorY = 0.03
  const pearlRadBase = isBrown ? 0.034 : 0.032
  // Max radial extent so sphere stays INSIDE dairy (never air gap between tea and PET)
  const pearlMaxR = liqBotR - pearlRadBase * 0.96
  // Layer row counts (hex packing); dense bottom-third heap readable through PET
  const layerRows = isBrown
    ? [18, 16, 14, 12, 10, 7, 4]
    : [16, 15, 13, 11, 8, 5]
  let pearlCount = 0
  for (const n of layerRows) pearlCount += n
  // Outer-ring pearls (still inside dairy) + gap fillers — primary silhouette craft
  const wallRingCount = isBrown ? 28 : 22
  const gapExtra = isBrown ? 18 : 16
  pearlCount += wallRingCount + gapExtra

  const pearlMesh = new THREE.InstancedMesh(PEARL_GEO, pearlMat, pearlCount)
  pearlMesh.name = 'pearls'
  pearlMesh.castShadow = false
  pearlMesh.receiveShadow = false
  pearlMesh.frustumCulled = true
  const dummy = new THREE.Object3D()
  let pi = 0
  for (let layer = 0; layer < layerRows.length; layer++) {
    const n = layerRows[layer]
    // Contact stack: nest slightly so spheres kiss
    const y = floorY + pearlRadBase * 0.95 + layer * pearlRadBase * 1.42
    const ringR = Math.max(0.014, Math.min(pearlMaxR, (isBrown ? 0.098 : 0.092) - layer * 0.009))
    const angOff = layer * 0.38
    for (let j = 0; j < n; j++) {
      const rad = pearlRadBase * (0.88 + seeded(pi, 13) * 0.2)
      const ang = angOff + (j / n) * Math.PI * 2 + seeded(pi, 14) * 0.1
      // Bias toward outer ring so pearls silhouette against wall tea through PET
      const rFrac = n <= 3
        ? 0.3 + seeded(pi, 16) * 0.45
        : 0.5 + Math.sqrt(seeded(pi, 16)) * 0.48
      const r = Math.min(ringR, rFrac * ringR, pearlMaxR - rad * 0.2)
      const useR = layer === 0 && j === 0 ? seeded(pi, 70) * 0.016 : r
      dummy.position.set(
        Math.cos(ang) * useR,
        y + seeded(pi, 17) * 0.002,
        Math.sin(ang) * useR,
      )
      // Mild contact squash — keep spherical volume (not flat discs)
      const squash = 0.92 + seeded(pi, 18) * 0.06
      dummy.scale.set(rad * 1.06, rad * squash, rad * 1.06)
      dummy.rotation.set(
        seeded(pi, 40) * 0.3,
        seeded(pi, 41) * Math.PI,
        seeded(pi, 42) * 0.3,
      )
      dummy.updateMatrix()
      pearlMesh.setMatrixAt(pi, dummy.matrix)
      pi++
    }
  }
  // Outer-ring pearls — press to dairy edge so they silhouette through clear PET wall
  for (let i = 0; i < wallRingCount; i++) {
    const rad = pearlRadBase * (0.92 + seeded(i, 90) * 0.14)
    const ang = (i / wallRingCount) * Math.PI * 2 + seeded(i, 91) * 0.08
    const y = floorY + pearlRadBase * 0.95 + seeded(i, 92) * pearlRadBase * 2.8
    const rIn = Math.min(pearlMaxR - rad * 0.04, pearlMaxR * 0.98)
    dummy.position.set(Math.cos(ang) * rIn, Math.min(y, isBrown ? 0.19 : 0.2), Math.sin(ang) * rIn)
    dummy.scale.set(rad * 1.08, rad * 0.94, rad * 1.08)
    dummy.rotation.set(seeded(i, 93) * 0.4, seeded(i, 94) * Math.PI, 0)
    dummy.updateMatrix()
    pearlMesh.setMatrixAt(pi, dummy.matrix)
    pi++
  }
  // Gap fillers nestled in pile (inside dairy)
  for (let i = 0; i < gapExtra; i++) {
    const rad = pearlRadBase * (0.76 + seeded(i, 80) * 0.2)
    const ang = seeded(i, 81) * Math.PI * 2
    const r = Math.min(pearlMaxR - rad, 0.014 + seeded(i, 82) * (isBrown ? 0.06 : 0.05))
    const y = floorY + rad * 0.95 + seeded(i, 83) * pearlRadBase * 1.4
    dummy.position.set(Math.cos(ang) * r, Math.min(y, isBrown ? 0.14 : 0.12), Math.sin(ang) * r)
    dummy.scale.set(rad, rad * 0.92, rad)
    dummy.rotation.set(seeded(i, 84) * 0.5, seeded(i, 85) * Math.PI, 0)
    dummy.updateMatrix()
    pearlMesh.setMatrixAt(pi, dummy.matrix)
    pi++
  }
  pearlMesh.instanceMatrix.needsUpdate = true
  g.add(pearlMesh)

  // Surface-break pearls under meniscus — wet dark spheres near cream/tea surface (inside liquid)
  {
    const topPearlCount = isBrown ? 12 : 8
    const topPearls = new THREE.InstancedMesh(PEARL_GEO, pearlMat, topPearlCount)
    topPearls.name = 'surface_pearls'
    topPearls.castShadow = false
    for (let i = 0; i < topPearlCount; i++) {
      const rad = 0.015 + seeded(i, 19) * 0.01
      const a = (i / topPearlCount) * Math.PI * 2 + 0.35
      const r = Math.min(pearlMaxR * 0.7, 0.012 + seeded(i, 44) * 0.038)
      dummy.position.set(
        Math.cos(a) * r,
        (isBrown ? 0.195 : 0.2) + seeded(i, 20) * 0.012,
        Math.sin(a) * r,
      )
      dummy.scale.set(rad * 1.06, rad * 0.9, rad * 1.06)
      dummy.rotation.set(0.15, seeded(i, 45) * Math.PI, 0.12)
      dummy.updateMatrix()
      topPearls.setMatrixAt(i, dummy.matrix)
    }
    topPearls.instanceMatrix.needsUpdate = true
    g.add(topPearls)
  }

  // --- Authored condensate focal beads (v35): dense cold-cup water on open PET ---
  // r26 fail: opacity 0.22 lenses invisible at night FOV → "no condensation".
  // r27 fail: elongated scale.y 2.6–4.4× teardrops + opacity 0.48 → white drip paint on mug.
  // r28–r29: outer alpha film + dense freckle beads → chalk fog / opaque potion.
  // r30–r31: lenses too small/dim at counter FOV — raise size + count + specular, keep spherical.
  // Clearcoat-only, T≡0 — mid-T beads read as glow orbs under bloom (r18 residual).
  // NO alpha film mesh (r28–r30 frost). Geometric lenses only.
  const dropWallR = (y: number) => wallRadiusAt(y) * 1.016

  const lensMat = phys(0xd0e0ec, {
    roughness: 0.003,
    metalness: 0,
    transmission: 0.0, // clearcoat film only — never mid-T glow orbs
    transparent: true,
    opacity: 0.48, // counter-FOV water catch without freckle chalk sheet (r31)
    thickness: 0,
    ior: 1.33,
    clearcoat: 1.0,
    clearcoatRoughness: 0.001,
    envMapIntensity: 1.55, // warm-key water specular catch under bloom
    specularIntensity: 1.0,
    depthWrite: false,
  }, w)

  // Focal beads — near-spherical wall-hugging water (never tall drip streaks)
  // Bias lower 2/3 (cold-cup condensate density vs ref plate)
  const lensCount = 20
  const lenses = new THREE.InstancedMesh(LENS_GEO, lensMat, lensCount)
  lenses.name = 'condensation_lenses'
  lenses.castShadow = false
  lenses.renderOrder = 2
  for (let i = 0; i < lensCount; i++) {
    const s = 0.018 + seeded(i, 21) * 0.016
    const ang = (i / lensCount) * Math.PI * 2 + seeded(i, 22) * 0.18
    const y = 0.055 + seeded(i, 23) * 0.32
    const wallR = dropWallR(y)
    dummy.position.set(Math.cos(ang) * wallR, y, Math.sin(ang) * wallR)
    // Near-spherical water bead with mild wall flatten — NOT elongated paint drip
    dummy.scale.set(
      s * 0.55,
      s * (0.95 + seeded(i, 24) * 0.18),
      s * 0.95,
    )
    dummy.rotation.set(0, -ang + Math.PI / 2, seeded(i, 50) * 0.03)
    dummy.updateMatrix()
    lenses.setMatrixAt(i, dummy.matrix)
  }
  lenses.instanceMatrix.needsUpdate = true
  g.add(lenses)

  // Secondary micro-beads (discrete water, not frost sheet / chalk wall / drip paint)
  const beadCount = 36
  const beads = new THREE.InstancedMesh(LENS_GEO, lensMat, beadCount)
  beads.name = 'condensation_beads'
  beads.castShadow = false
  beads.renderOrder = 2
  for (let i = 0; i < beadCount; i++) {
    const s = 0.007 + seeded(i, 60) * 0.009
    const ang = seeded(i, 61) * Math.PI * 2
    const y = 0.05 + seeded(i, 62) * 0.38
    const wallR = dropWallR(y)
    dummy.position.set(Math.cos(ang) * wallR, y, Math.sin(ang) * wallR)
    // Flattened sphere beads — water lenses with modest radial bulk
    dummy.scale.set(s * 0.68, s * 0.95, s * 0.68)
    dummy.rotation.set(0, -ang + Math.PI / 2, 0)
    dummy.updateMatrix()
    beads.setMatrixAt(i, dummy.matrix)
  }
  beads.instanceMatrix.needsUpdate = true
  g.add(beads)

  // PET roughness map + geometric lenses own wet craft — no freckle film / no drip paint

  return g
}

export function createBobaCupPairModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group()
  root.name = 'BobaCupPair'
  root.userData.img2threejs = {
    skill: 'img2threejs@1.5.x',
    source: 'demos/room/public/assets/boba.jpg',
    pass: 'form+material-v35-cold-pet-shell-tea-volume-wet-beads',
  }

  // Slightly wider pair spacing so brown-sugar isn't fully occluded by ramen at counter FOV
  const brown = makeCup(options, 'brown-sugar')
  brown.position.x = -0.24
  const taro = makeCup(options, 'taro')
  taro.position.x = 0.24
  root.add(brown, taro)

  const sockets: Record<string, THREE.Object3D> = {}
  const sBrown = new THREE.Object3D()
  sBrown.name = 'socket_brownSugar'
  sBrown.position.set(-0.24, 0.78, 0)
  root.add(sBrown)
  sockets.brownSugar = sBrown
  const sTaro = new THREE.Object3D()
  sTaro.name = 'socket_taro'
  sTaro.position.set(0.24, 0.78, 0)
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
