import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { createRamenBowlModel } from '../img2threejs/createRamenBowlModel'
import { createBobaCupPairModel } from '../img2threejs/createBobaCupPairModel'
import type { Project } from '../types'

type Props = {
  projects: Project[]
  selectedId: string | null
  onSelect: (id: string) => void
}

/** Call tick only on model root — never traverse every child every frame. */
function useModelTick(model: THREE.Object3D | null) {
  useFrame(({ clock }) => {
    if (!model) return
    const tick = model.userData?.tick as ((t: number) => void) | undefined
    if (typeof tick === 'function') tick(clock.elapsedTime)
  })
}

/**
 * Residual (B)/(E) loop-r27: floor rings MUST NOT wash oak contact/specular.
 * r26 still read as cyan/stage discs under laptop/boba — pin floor ink to pure
 * kiosk amber (hue locked, hard sat/luma caps). Project cool accents stay on
 * HTML tickets via warmChromeAccent / panel dots — never on the counter face.
 */
function warmFloorAccent(_hex: string): string {
  // Fixed ticket-edge amber — ignore project cyan/mint/violet entirely for floor
  // Slight dark amber so grain + contact shadow stay readable under night key
  return '#8a5a2e'
}

/**
 * Residual (B)/(E)/(D) r27: HTML ticket --portal-accent for night-shop chrome.
 * Soft-warm cool project hues so box-shadow/left-edge don't cyan-glow the stall;
 * panel menu dots keep full project color for match.
 */
function warmChromeAccent(hex: string): string {
  const c = new THREE.Color(hex)
  const warm = new THREE.Color('#e8a060')
  const coolness = Math.max(0, c.b - c.r * 0.7 + Math.max(0, c.g - c.r) * 0.35)
  c.lerp(warm, THREE.MathUtils.clamp(0.38 + coolness * 0.52, 0.38, 0.88))
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  c.setHSL(hsl.h, Math.min(hsl.s, 0.52), Math.min(hsl.l, 0.58))
  return `#${c.getHexString()}`
}

/**
 * Firm multi-lobe contact occlusion — residual (B)/(E) r32:
 * denser foot mass under ordered props; tight penumbra so oak grain wins
 * (rings stay hairline accents — never stage discs / cyan wash).
 */
function ContactRest({
  radius = 0.28,
  opacity = 0.48,
  /** Ordered prop: denser footprint so select reads as counter mass (B/E) */
  firm = false,
}: {
  radius?: number
  opacity?: number
  firm?: boolean
}) {
  // r32: denser core + tighter penumbra — ordered prop = kiosk mass on oak
  const core = firm ? 3.05 : 2.4
  const mid = firm ? 1.6 : 1.25
  const outer = firm ? 0.58 : 0.46
  const far = firm ? 0.15 : 0.12
  // Lift + polygonOffset so contact discs don't z-fight oak counter on orbit
  const decal = {
    depthWrite: false as const,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  }
  return (
    <group position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Dense core under feet / base — sells prop weight on oak */}
      <mesh renderOrder={-3}>
        <circleGeometry args={[radius * (firm ? 0.56 : 0.46), 32]} />
        <meshBasicMaterial
          color="#020104"
          transparent
          opacity={Math.min(0.99, opacity * core)}
          {...decal}
        />
      </mesh>
      {/* Mid soft body shadow */}
      <mesh renderOrder={-2}>
        <circleGeometry args={[radius * (firm ? 0.74 : 0.68), 32]} />
        <meshBasicMaterial color="#050208" transparent opacity={opacity * mid} {...decal} />
      </mesh>
      {/* Outer penumbra — tight so wood grain + specular survive */}
      <mesh renderOrder={-1}>
        <ringGeometry args={[radius * 0.5, radius * (firm ? 0.94 : 0.88), 36]} />
        <meshBasicMaterial color="#0a050c" transparent opacity={opacity * outer} {...decal} />
      </mesh>
      {/* Far falloff — thinner; no large dark disc wash under props */}
      <mesh renderOrder={-1}>
        <ringGeometry args={[radius * 0.88, radius * (firm ? 1.05 : 1.0), 36]} />
        <meshBasicMaterial color="#060308" transparent opacity={opacity * far} {...decal} />
      </mesh>
    </group>
  )
}

function HotspotRoot({
  selected,
  hovered,
  onSelect,
  onHover,
  children,
  label,
  // Residual (B)/(E): prop-crown anchor — ticket sits on dish rim, not mid-void
  labelY = 0.3,
  glowColor = '#ffb56b',
  contactRadius = 0.3,
  contactOpacity = 0.48,
  cycleHint,
  /** Menu-board item number (01…) for portal↔panel cohesion */
  menuNo,
  /** Second number for dual-project props (idle stub #02/06) — residual 1c */
  menuNoAlt,
  /** Kitchen zone (matches panel menu-zone) — residual 1b/1c ticket cohesion */
  zone,
  /** Dual-project prop (boba / laptop) — idle stub shows swap affordance */
  dualPortal = false,
  /**
   * Residual (E): any board item is ordered — hide idle #stubs on other props
   * so mobile/chrome stills show one kitchen ticket (matches panel selection).
   */
  anyOrdered = false,
  /**
   * Residual (E) stack chrome: panel already carries ORDERED when app is stacked
   * (≤960px matches App grid). Suppress mid-void Html so canvas stays stall-first.
   */
  stackChrome = false,
}: {
  selected: boolean
  hovered: boolean
  onSelect: () => void
  onHover: (v: boolean) => void
  children: ReactNode
  label?: string
  labelY?: number
  glowColor?: string
  contactRadius?: number
  contactOpacity?: number
  /** Dual-project portal: subtle "tap again" chip under primary label */
  cycleHint?: string
  menuNo?: string
  menuNoAlt?: string
  zone?: string
  dualPortal?: boolean
  anyOrdered?: boolean
  stackChrome?: boolean
}) {
  const ref = useRef<THREE.Group>(null)
  const idleRing = useRef<THREE.MeshBasicMaterial>(null)
  const selectPulse = useRef<THREE.MeshBasicMaterial>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  /**
   * Residual (E)/(D) r32: one kitchen ticket when ordered — matches panel's single
   * ORDERED stamp. Hovering other props uses ring/lift only so chrome + mobile
   * stills never stack multiple HTML pills over the shop (overlapping labels).
   * Browse (no selection): hover may still open a preview ticket.
   * Stack chrome + ordered: Html ticket off (panel owns stamp); ring/beacon stay.
   * Idle #stubs are prop-rim chalk only — never mid-void SaaS badge soup (D).
   */
  const showLabel = selected || (hovered && !anyOrdered)
  // Prop-crown ticket only when it won't invade neon/void under stacked panel
  const showHtmlLabel = showLabel && !(selected && stackChrome)
  const active = selected || hovered
  // Browse mode = no order yet → show all #stubs; ordered mode = one ticket focus
  // Stack: hide idle #stubs too — discovery via rings + board (no floating pill soup)
  const showIdleStub = Boolean(menuNo) && !showLabel && !anyOrdered && !stackChrome
  // Soften idle discovery rings when another prop is ordered (select clarity)
  const idleDim = anyOrdered && !active
  // Ordered + hover non-selected: stronger ring so discovery survives without a second pill
  const hoverPeek = anyOrdered && hovered && !selected
  // Stack + ordered: ring/beacon must carry select (no Html) — residual E mobile
  const ringBoost = selected && stackChrome
  /**
   * Residual (B)/(E) r27: floor rings = pure kiosk amber ink (never cyan discs).
   * Labels use warmChromeAccent so cool project hues don't cyan-glow the stall.
   */
  const floorAccent = useMemo(() => warmFloorAccent(glowColor), [glowColor])
  const chromeAccent = useMemo(() => warmChromeAccent(glowColor), [glowColor])
  // Ring radii — residual (B) r32: still hairline ticket edge under prop feet (no stage disc)
  const r = contactRadius
  const rOuter = r * (ringBoost ? 0.98 : 0.9)
  const rMid = r * (ringBoost ? 0.8 : 0.74)
  const rInner = r * (ringBoost ? 0.5 : 0.44)
  const rCore = r * (ringBoost ? 0.28 : 0.24)
  const tmpScale = useMemo(() => new THREE.Vector3(1, 1, 1), [])

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    // Select feedback (E) r32: calm lift + scale matches hang-board ORDERED —
    // ordered prop pops as counter mass; hoverPeek softer so ring ≠ second ticket
    const bob = selected ? Math.sin(clock.elapsedTime * 1.7) * 0.0035 : 0
    const target = selected ? 1.1 : hoverPeek ? 1.03 : hovered ? 1.045 : 1
    const yTarget =
      (selected ? 0.036 : hoverPeek ? 0.008 : hovered ? 0.012 : 0) + bob
    if (!active && Math.abs(g.scale.x - 1) < 0.001 && Math.abs(g.position.y) < 0.001) {
      if (g.scale.x !== 1) g.scale.set(1, 1, 1)
      if (g.position.y !== 0) g.position.y = 0
    } else {
      tmpScale.set(target, target, target)
      g.scale.lerp(tmpScale, selected ? 0.3 : 0.18)
      g.position.y = THREE.MathUtils.lerp(g.position.y, yTarget, selected ? 0.28 : 0.18)
    }
    // Soft idle discovery pulse — r32 whisper hairline (B: contact >> ring wash)
    if (idleRing.current && !active) {
      const base = idleDim ? 0.01 : 0.022
      const amp = idleDim ? 0.003 : 0.008
      idleRing.current.opacity = base + Math.sin(clock.elapsedTime * 1.0) * amp
    }
    // Selected order-ring breath — thin ticket edge twin of panel ORDERED (E)
    if (selectPulse.current && selected) {
      const base = ringBoost ? 0.09 : 0.055
      const amp = ringBoost ? 0.02 : 0.014
      selectPulse.current.opacity = base + Math.sin(clock.elapsedTime * 1.65) * amp
    }
    // Shop-lamp: select readable; restrained so oak specular survives (no wash disc)
    if (lightRef.current) {
      const want = selected ? (ringBoost ? 0.16 : 0.09) : hoverPeek ? 0.04 : hovered ? 0.03 : 0
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, want, 0.18)
    }
  })

  return (
    <group
      ref={ref}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        onHover(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {/* Local select lamp — warm ink, short reach (residual B/E r32 no oak wash) */}
      <pointLight
        ref={lightRef}
        position={[0.04, 0.28, 0.08]}
        color={floorAccent}
        intensity={0}
        distance={0.42}
        decay={2.9}
      />
      {/* Always-on contact darkening so props sit on the counter/shelf */}
      <ContactRest radius={contactRadius} opacity={contactOpacity} firm={selected} />
      {children}
      {/* Idle discoverability — residual (B)/(E) r32: hairline amber ink, never floor neon */}
      {!active && (
        <group position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Single mid ring only — drop outer wash lobe */}
          <mesh renderOrder={-1}>
            <ringGeometry args={[rInner, rMid, 36]} />
            <meshBasicMaterial
              ref={idleRing}
              color={floorAccent}
              transparent
              opacity={idleDim ? 0.012 : 0.026}
              depthWrite={false}
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={-5}
              polygonOffsetUnits={-5}
            />
          </mesh>
          {/* Hairline inner tick — discovery certainty without glowing disc */}
          <mesh renderOrder={-1}>
            <ringGeometry args={[rCore, rCore + r * 0.014, 32]} />
            <meshBasicMaterial
              color="#e8d4b8"
              transparent
              opacity={idleDim ? 0.014 : 0.034}
              depthWrite={false}
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={-5}
              polygonOffsetUnits={-5}
            />
          </mesh>
        </group>
      )}
      {active && (
        <group position={[0, 0.013, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {/*
            Residual (B)/(E) r32: hairline dual ink only (narrow annuli).
            Contact + lift carry mass; no wide cream disc over oak grain.
          */}
          <mesh>
            <ringGeometry args={[rMid, rOuter, 40]} />
            <meshBasicMaterial
              color={floorAccent}
              transparent
              opacity={selected ? (ringBoost ? 0.095 : 0.058) : hoverPeek ? 0.038 : 0.032}
              depthWrite={false}
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={-5}
              polygonOffsetUnits={-5}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[rInner, rMid * 0.94, 36]} />
            <meshBasicMaterial
              color={floorAccent}
              transparent
              opacity={selected ? (ringBoost ? 0.13 : 0.08) : hoverPeek ? 0.05 : 0.04}
              depthWrite={false}
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={-5}
              polygonOffsetUnits={-5}
            />
          </mesh>
          {/* Crisp ticket-edge tick — select certainty, low luma */}
          <mesh>
            <ringGeometry args={[rCore * 0.94, rCore * 1.04, 28]} />
            <meshBasicMaterial
              color="#e8d4b8"
              transparent
              opacity={selected ? (ringBoost ? 0.3 : 0.22) : hoverPeek ? 0.1 : 0.085}
              depthWrite={false}
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={-5}
              polygonOffsetUnits={-5}
            />
          </mesh>
          {/* Selected: hairline breathing order ring — panel ORDERED twin (E) */}
          {selected && (
            <mesh>
              <ringGeometry args={[rOuter * 0.98, rOuter * (ringBoost ? 1.03 : 1.018), 40]} />
              <meshBasicMaterial
                ref={selectPulse}
                color="#d8c098"
                transparent
                opacity={ringBoost ? 0.07 : 0.042}
                depthWrite={false}
                side={THREE.DoubleSide}
                polygonOffset
                polygonOffsetFactor={-5}
                polygonOffsetUnits={-5}
              />
            </mesh>
          )}
        </group>
      )}
      {/* Order beacon — short prop-crown pin (residual E: no mid-void neon stack) */}
      {selected && (
        <group>
          <mesh position={[0, labelY * 0.12, 0]} renderOrder={2}>
            <cylinderGeometry args={[0.004, 0.006, labelY * 0.16, 8]} />
            <meshBasicMaterial
              color={floorAccent}
              transparent
              opacity={ringBoost ? 0.18 : 0.1}
              depthWrite={false}
            />
          </mesh>
          {/* Soft halo at prop crown — select certainty without neon soup */}
          <mesh position={[0, labelY * 0.2, 0]} renderOrder={2}>
            <sphereGeometry args={[ringBoost ? 0.009 : 0.0065, 10, 8]} />
            <meshBasicMaterial
              color="#fff4e0"
              transparent
              opacity={ringBoost ? 0.12 : 0.075}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, labelY * 0.2, 0]} renderOrder={2}>
            <sphereGeometry args={[ringBoost ? 0.0045 : 0.0032, 8, 6]} />
            <meshBasicMaterial
              color={chromeAccent}
              transparent
              opacity={ringBoost ? 0.36 : 0.26}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
      {/*
        Residual (E)/(D) r32: idle #stubs only in browse mode (no board selection).
        Once any item is ordered, suppress other stubs so mobile/chrome stills
        read as one kitchen ticket matching the panel — no stacked SaaS pills.
        Stubs are tiny prop-rim chalk chips (hang-board # language), never large
        mid-void SaaS badges that fight neon + food (chrome pack residual D).
        Dual: primary # + ↻ only on idle — alt # lives on hover ticket / board.
      */}
      {showIdleStub && (
        <Html
          // Front rim of dish — residual B/D/E r32: prop-anchored, not mid-void float
          position={[0, labelY * 0.06, 0.05]}
          center
          /*
            Higher distanceFactor = smaller screen footprint so chrome packs keep
            3D hero primary. Stack path rarely shows stubs (stackChrome gates).
          */
          {...(stackChrome
            ? {}
            : { distanceFactor: 38 })}
          style={{ pointerEvents: 'none' }}
          zIndexRange={[40, 0]}
        >
          <div
            className={`r3f-menu-no hotspot${dualPortal ? ' dual' : ''}${hovered ? ' hot' : ''}${stackChrome ? ' stack' : ''}`}
            style={{ ['--portal-accent' as string]: chromeAccent }}
            title={
              dualPortal && menuNoAlt ? `#${menuNo} · #${menuNoAlt} cycle` : menuNo ? `#${menuNo}` : undefined
            }
            aria-hidden
          >
            <span className="r3f-menu-no-hash">#</span>
            {menuNo}
            {dualPortal && menuNoAlt ? (
              <>
                <span className="r3f-menu-no-sep">·</span>
                <span className="r3f-menu-no-alt">{menuNoAlt}</span>
                <span className="r3f-menu-no-swap" title="cycle">
                  ↻
                </span>
              </>
            ) : dualPortal ? (
              <span className="r3f-menu-no-swap" title="cycle">
                ↻
              </span>
            ) : null}
          </div>
        </Html>
      )}
      {showHtmlLabel && label && (
        <Html
          // Prop-rim kitchen ticket — residual (B)/(D)/(E) r32: crown of dish, hang-board twin
          // Selected: micro # + ORDERED whisper; hover browse: compact name ticket
          position={[
            0,
            labelY * (selected ? 0.22 : 0.18) + (selected ? 0.001 : 0.001),
            selected ? 0.02 : 0.04,
          ]}
          center
          // Fixed size on stack/mobile; desktop distanceFactor high so chips stay chalk-scale
          {...(stackChrome
            ? {}
            : { distanceFactor: selected ? 34 : 30 })}
          style={{ pointerEvents: 'none' }}
          zIndexRange={[100, 0]}
        >
          {/*
            Compact order ticket mirrors panel .menu-item.active row:
            #no + name + ORDERED stamp; zone chip only; accent left edge matches board.
            Residual (E)/(D) r32: hang-board owns dense ticket; prop chip whispers # + ORDERED
            when selected so chrome stills keep stall free of mid-void paper stacks.
            Dual alt chips live outside HotspotRoot and only on pre-order hover.
            Stack + ordered: showHtmlLabel false — panel owns ORDERED stamp.
            .hotspot class: capture harness chrome interaction still.
          */}
          <div
            className={`r3f-label hotspot${selected ? ' selected' : ''}${dualPortal || cycleHint ? ' dual' : ''}${hovered && !selected ? ' hover' : ''}`}
            style={{ ['--portal-accent' as string]: chromeAccent }}
            data-ordered={selected ? 'true' : undefined}
            data-menu-no={menuNo}
          >
            <span className="r3f-label-row">
              {menuNo ? <span className="r3f-label-no">#{menuNo}</span> : null}
              <span className="r3f-label-name">{label}</span>
              {selected ? <span className="r3f-label-stamp">ORDERED</span> : null}
            </span>
            {/* Zone + dual ↻ only — panel detail owns "kitchen ticket" copy (E de-stack) */}
            {(zone || cycleHint) && (
              <span className="r3f-label-meta">
                {zone ? <span className="r3f-label-zone">{zone}</span> : null}
                {cycleHint ? <span className="r3f-label-cycle">{cycleHint}</span> : null}
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

/** Authored laptop — residual #5/#8 portal (brushed anodized + glass IOR, not box prim). */
function DetailedLaptop({ selected }: { selected: boolean }) {
  // Restrained LCD emissive — residual #8 / avoid bloom soup
  const screenGlow = selected ? 0.62 : 0.22
  const chassis = '#1c1e24'
  const chassisHi = '#343a48'
  const keycap = '#262a34'
  const plasticRough = 0.42
  const metalRough = 0.22
  // Brushed-aluminum lobe (residual #5 anisotropy — not soft plastic sheen)
  const brushed = {
    anisotropy: 0.72,
    anisotropyRotation: Math.PI * 0.5,
    metalness: 0.9,
    clearcoat: 0.38,
    clearcoatRoughness: 0.28,
  } as const

  return (
    <group>
      {/* Leather desk mat — grain + edge wear (grounds as menu-object) */}
      <mesh position={[0, 0.001, 0.02]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.58, 0.42]} />
        <meshStandardMaterial color="#1a1210" roughness={0.9} metalness={0.03} />
      </mesh>
      <mesh position={[0, 0.002, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.54, 0.38]} />
        <meshPhysicalMaterial
          color="#241814"
          roughness={0.84}
          metalness={0.05}
          sheen={0.35}
          sheenRoughness={0.75}
          sheenColor="#3a2418"
        />
      </mesh>
      {/* Mat edge stitch line — micro-spec break */}
      <mesh position={[0, 0.0025, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.268, 40]} />
        <meshBasicMaterial
          color="#0a0605"
          transparent
          opacity={0.45}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/*
        Residual (B)/(E) r26: no cyan floor spill disc — portal select ring +
        ContactRest carry feedback; cool wash was killing oak specular read.
      */}

      {/* Per-foot contact dots + rubber feet (grounded tell) */}
      {(
        [
          [-0.16, 0.006, 0.1],
          [0.16, 0.006, 0.1],
          [-0.16, 0.006, -0.1],
          [0.16, 0.006, -0.1],
        ] as const
      ).map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, -0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
            <circleGeometry args={[0.024, 12]} />
            <meshBasicMaterial
              color="#020104"
              transparent
              opacity={0.62}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh castShadow>
            <cylinderGeometry args={[0.012, 0.014, 0.01, 10]} />
            <meshStandardMaterial color="#0a0a0c" roughness={0.94} metalness={0.02} />
          </mesh>
        </group>
      ))}

      {/* Base chassis — multi-layer brushed anodized (residual #5/#8) */}
      <mesh position={[0, 0.018, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.01, 0.3]} />
        <meshPhysicalMaterial
          color={chassis}
          roughness={metalRough}
          {...brushed}
        />
      </mesh>
      <mesh position={[0, 0.026, 0]} castShadow>
        <boxGeometry args={[0.436, 0.008, 0.296]} />
        <meshPhysicalMaterial
          color="#22252e"
          roughness={0.2}
          {...brushed}
          clearcoat={0.32}
          clearcoatRoughness={0.32}
        />
      </mesh>
      {/* Top deck plate — lateral brush direction (orthogonal lobe) */}
      <mesh position={[0, 0.032, 0]} castShadow>
        <boxGeometry args={[0.438, 0.004, 0.298]} />
        <meshPhysicalMaterial
          color={chassisHi}
          roughness={0.18}
          anisotropy={0.78}
          anisotropyRotation={0}
          metalness={0.92}
          clearcoat={0.42}
          clearcoatRoughness={0.22}
        />
      </mesh>
      {/* Micro-spec edge highlight strip (front chin) */}
      <mesh position={[0, 0.0335, 0.148]}>
        <boxGeometry args={[0.42, 0.0012, 0.003]} />
        <meshPhysicalMaterial
          color="#6a7080"
          roughness={0.12}
          metalness={0.95}
          anisotropy={0.55}
          anisotropyRotation={0}
        />
      </mesh>
      {/* Rounded corner caps — kill hard box silhouette */}
      {(
        [
          [-0.2, 0.022, 0.13],
          [0.2, 0.022, 0.13],
          [-0.2, 0.022, -0.13],
          [0.2, 0.022, -0.13],
        ] as const
      ).map((p, i) => (
        <mesh key={`c${i}`} position={p} castShadow>
          <sphereGeometry args={[0.014, 10, 8]} />
          <meshPhysicalMaterial
            color={chassis}
            roughness={metalRough}
            {...brushed}
            clearcoat={0.35}
          />
        </mesh>
      ))}
      {/* Front chin port row recess */}
      <mesh position={[0, 0.026, 0.148]} castShadow>
        <boxGeometry args={[0.22, 0.006, 0.008]} />
        <meshStandardMaterial color="#080a0e" roughness={0.5} metalness={0.55} />
      </mesh>

      {/* Keyboard deck recess — matte soft-touch */}
      <mesh position={[0, 0.036, 0.035]} castShadow>
        <boxGeometry args={[0.4, 0.006, 0.18]} />
        <meshStandardMaterial color="#0a0c10" roughness={0.78} metalness={0.08} />
      </mesh>

      {/* Keycap rows (ABS + slight height variety) */}
      {([-0.055, 0, 0.055] as const).map((z, row) =>
        ([-0.15, -0.075, 0, 0.075, 0.15] as const).map((x, col) => (
          <mesh key={`k${row}${col}`} position={[x, 0.042 + (row === 0 ? 0.001 : 0), z + 0.035]} castShadow>
            <boxGeometry args={[0.06, 0.008, 0.04]} />
            <meshPhysicalMaterial
              color={keycap}
              roughness={plasticRough}
              metalness={0.06}
              clearcoat={0.28}
              clearcoatRoughness={0.4}
              emissive={selected && row === 1 && col === 2 ? '#4a9eff' : '#000000'}
              emissiveIntensity={selected && row === 1 && col === 2 ? 0.55 : 0}
            />
          </mesh>
        )),
      )}

      {/* Space bar */}
      <mesh position={[0, 0.042, 0.095]} castShadow>
        <boxGeometry args={[0.2, 0.007, 0.028]} />
        <meshPhysicalMaterial
          color="#323640"
          roughness={0.52}
          metalness={0.06}
          clearcoat={0.2}
          clearcoatRoughness={0.48}
        />
      </mesh>

      {/* Trackpad glass inset + brushed chrome rim */}
      <mesh position={[0, 0.038, -0.085]} castShadow>
        <boxGeometry args={[0.145, 0.004, 0.085]} />
        <meshPhysicalMaterial
          color="#161a22"
          roughness={0.34}
          metalness={0.58}
          anisotropy={0.45}
          clearcoat={0.28}
          clearcoatRoughness={0.24}
        />
      </mesh>
      <mesh position={[0, 0.041, -0.085]}>
        <boxGeometry args={[0.12, 0.002, 0.065]} />
        <meshPhysicalMaterial
          color="#2a3240"
          roughness={0.1}
          metalness={0.45}
          clearcoat={0.82}
          clearcoatRoughness={0.06}
          transmission={0.08}
          thickness={0.008}
          ior={1.45}
        />
      </mesh>

      {/* Side ports (USB-C / headphone / HDMI) */}
      <mesh position={[0.221, 0.024, 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.01, 0.005, 0.022]} />
        <meshStandardMaterial color="#06080c" roughness={0.45} metalness={0.65} />
      </mesh>
      <mesh position={[0.221, 0.024, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.01, 0.005, 0.022]} />
        <meshStandardMaterial color="#06080c" roughness={0.45} metalness={0.65} />
      </mesh>
      <mesh position={[0.221, 0.024, -0.025]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.0055, 0.0055, 0.008, 8]} />
        <meshStandardMaterial color="#0c1018" roughness={0.35} metalness={0.78} />
      </mesh>
      <mesh position={[0.221, 0.024, -0.06]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.014, 0.006, 0.03]} />
        <meshStandardMaterial color="#080a0e" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Hinge barrel — brushed steel cylinder (axial brush) */}
      <mesh position={[0, 0.04, -0.14]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.42, 14]} />
        <meshPhysicalMaterial
          color="#12141a"
          roughness={0.18}
          metalness={0.94}
          anisotropy={0.85}
          anisotropyRotation={0}
          clearcoat={0.35}
          clearcoatRoughness={0.22}
        />
      </mesh>
      {/* Hinge end caps — chrome lobe */}
      {([-0.21, 0.21] as const).map((x) => (
        <mesh key={x} position={[x, 0.04, -0.14]} castShadow>
          <sphereGeometry args={[0.013, 10, 8]} />
          <meshPhysicalMaterial
            color="#1a1c24"
            roughness={0.16}
            metalness={0.9}
            clearcoat={0.55}
            clearcoatRoughness={0.12}
            anisotropy={0.4}
          />
        </mesh>
      ))}

      {/* Lid + screen */}
      <group position={[0, 0.048, -0.14]} rotation={[-0.42, 0, 0]}>
        <mesh position={[0, 0.145, -0.004]} castShadow>
          <boxGeometry args={[0.44, 0.29, 0.01]} />
          <meshPhysicalMaterial
            color={chassis}
            roughness={0.2}
            {...brushed}
            clearcoat={0.35}
            clearcoatRoughness={0.26}
          />
        </mesh>
        {/* Lid edge lip (thin bright rim) */}
        <mesh position={[0, 0.145, 0.001]}>
          <boxGeometry args={[0.442, 0.292, 0.002]} />
          <meshPhysicalMaterial
            color={chassisHi}
            roughness={0.14}
            metalness={0.92}
            anisotropy={0.65}
            anisotropyRotation={Math.PI * 0.5}
            clearcoat={0.4}
            clearcoatRoughness={0.18}
          />
        </mesh>
        {/* Lid back logo glow */}
        <mesh position={[0, 0.145, -0.01]}>
          <circleGeometry args={[0.028, 16]} />
          <meshStandardMaterial
            color="#0a0c10"
            emissive={selected ? '#6ec6ff' : '#2a3a50'}
            emissiveIntensity={selected ? 0.7 : 0.14}
            roughness={0.22}
            metalness={0.52}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Bezel — soft-touch plastic */}
        <mesh position={[0, 0.145, 0.002]} castShadow>
          <boxGeometry args={[0.41, 0.26, 0.004]} />
          <meshStandardMaterial color="#080a0e" roughness={0.72} metalness={0.1} />
        </mesh>
        {/* Screen LCD + controlled emissive (not blown flat) */}
        <mesh position={[0, 0.145, 0.005]}>
          <planeGeometry args={[0.385, 0.235]} />
          <meshPhysicalMaterial
            color="#030810"
            emissive="#2f78c4"
            emissiveIntensity={screenGlow}
            roughness={0.1}
            metalness={0.06}
            clearcoat={0.88}
            clearcoatRoughness={0.06}
          />
        </mesh>
        {/* Glass sheet — physical IOR stack (residual #8 non-toy portal) */}
        <mesh position={[0, 0.145, 0.0062]}>
          <planeGeometry args={[0.388, 0.238]} />
          <meshPhysicalMaterial
            color="#d0e4f5"
            transparent
            opacity={0.13}
            roughness={0.03}
            metalness={0.02}
            transmission={0.18}
            thickness={0.012}
            ior={1.5}
            clearcoat={1}
            clearcoatRoughness={0.03}
            depthWrite={false}
          />
        </mesh>
        {/* Dual glass highlight strips */}
        <mesh position={[-0.06, 0.17, 0.0065]} rotation={[0, 0, -0.35]}>
          <planeGeometry args={[0.08, 0.2]} />
          <meshBasicMaterial color="#e8f4ff" transparent opacity={selected ? 0.12 : 0.06} depthWrite={false} />
        </mesh>
        <mesh position={[0.1, 0.12, 0.0066]} rotation={[0, 0, 0.5]}>
          <planeGeometry args={[0.04, 0.12]} />
          <meshBasicMaterial color="#d0e8ff" transparent opacity={selected ? 0.08 : 0.04} depthWrite={false} />
        </mesh>
        {/* denser UI chrome — editor / dashboard (menu-object tell) */}
        {/* sidebar */}
        <mesh position={[-0.145, 0.145, 0.0068]}>
          <planeGeometry args={[0.07, 0.22]} />
          <meshBasicMaterial color="#0c1520" transparent opacity={selected ? 0.75 : 0.45} depthWrite={false} />
        </mesh>
        {(
          [
            [-0.145, 0.22, 0.05, 0.014, '#7dd3fc'],
            [-0.145, 0.16, 0.048, 0.01, '#38bdf8'],
            [-0.145, 0.1, 0.042, 0.01, '#64748b'],
            [-0.145, 0.04, 0.045, 0.01, '#64748b'],
            [0.05, 0.22, 0.2, 0.016, '#7dd3fc'],
            [0.02, 0.14, 0.22, 0.01, '#94a3b8'],
            [0.04, 0.08, 0.18, 0.01, '#64748b'],
            [0.0, 0.02, 0.24, 0.01, '#38bdf8'],
            [0.06, -0.04, 0.14, 0.01, '#94a3b8'],
            [-0.02, -0.1, 0.2, 0.01, '#475569'],
            [0.1, -0.16, 0.1, 0.01, '#22d3ee'],
          ] as const
        ).map(([x, y, w, h, col], i) => (
          <mesh key={i} position={[x, 0.145 + y * 0.5, 0.0069]}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial
              color={col}
              transparent
              opacity={selected ? 0.68 : 0.36}
              depthWrite={false}
            />
          </mesh>
        ))}
        {/* Cursor caret */}
        <mesh position={[0.12, 0.145 + 0.02 * 0.5, 0.007]}>
          <planeGeometry args={[0.008, 0.014]} />
          <meshBasicMaterial
            color="#f8fafc"
            transparent
            opacity={selected ? 0.9 : 0.35}
            depthWrite={false}
          />
        </mesh>
        {/* Webcam pill */}
        <mesh position={[0, 0.268, 0.004]}>
          <capsuleGeometry args={[0.004, 0.018, 4, 8]} />
          <meshStandardMaterial color="#12151c" roughness={0.38} metalness={0.55} />
        </mesh>
        <mesh position={[0, 0.268, 0.007]}>
          <circleGeometry args={[0.003, 8]} />
          <meshStandardMaterial
            color="#1a2030"
            emissive="#88aaff"
            emissiveIntensity={selected ? 0.55 : 0.14}
          />
        </mesh>
      </group>
    </group>
  )
}

/** Authored studio cans — residual #8 (sphere cups + leather + brushed + wood rest). */
function Headphones({ selected }: { selected: boolean }) {
  const accent = selected ? 0xb794f6 : 0x3a2a48
  const shell = '#0c0c12'
  const pad = '#1c141a'
  const metal = '#2e3038'
  const chrome = '#5a5e6a'
  const brushedSteel = {
    anisotropy: 0.8,
    anisotropyRotation: Math.PI * 0.25,
    metalness: 0.94,
    clearcoat: 0.32,
    clearcoatRoughness: 0.28,
  } as const

  return (
    <group rotation={[0, 0.45, 0]}>
      {/* Wood rest / coaster — grounds cans as menu object (contact tell) */}
      <mesh position={[0, -0.062, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.155, 28]} />
        <meshPhysicalMaterial
          color="#2a1c12"
          roughness={0.78}
          metalness={0.04}
          clearcoat={0.22}
          clearcoatRoughness={0.55}
        />
      </mesh>
      <mesh position={[0, -0.059, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.132, 0.155, 28]} />
        <meshStandardMaterial color="#1a100a" roughness={0.88} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>
      {/* Grain break arcs on coaster */}
      {([0.04, 0.08, -0.05] as const).map((ox, i) => (
        <mesh key={i} position={[ox, -0.0585, i * 0.02 - 0.02]} rotation={[-Math.PI / 2, 0, 0.2 * i]}>
          <planeGeometry args={[0.09, 0.008]} />
          <meshBasicMaterial color="#120c08" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      ))}

      {/*
        Residual (B)/(E) r26: no violet floor spill — ring ink + contact only.
      */}

      {/* Cup contact shadows on coaster — multi-lobe */}
      {([-0.12, 0.12] as const).map((x) => (
        <group key={x} position={[x, -0.055, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
            <circleGeometry args={[0.048, 16]} />
            <meshBasicMaterial
              color="#010102"
              transparent
              opacity={0.72}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
            <circleGeometry args={[0.072, 16]} />
            <meshBasicMaterial
              color="#020104"
              transparent
              opacity={0.38}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      {/* Headband outer metal arc — brushed steel anisotropy */}
      <mesh castShadow>
        <torusGeometry args={[0.125, 0.011, 10, 32, Math.PI]} />
        <meshPhysicalMaterial
          color={metal}
          roughness={0.22}
          {...brushedSteel}
          emissive={selected ? accent : 0x000000}
          emissiveIntensity={selected ? 0.18 : 0}
        />
      </mesh>
      {/* Chrome edge lip on headband */}
      <mesh>
        <torusGeometry args={[0.132, 0.004, 6, 28, Math.PI]} />
        <meshPhysicalMaterial
          color={chrome}
          roughness={0.1}
          metalness={0.96}
          anisotropy={0.55}
          anisotropyRotation={0}
          clearcoat={0.7}
          clearcoatRoughness={0.08}
        />
      </mesh>
      {/* Soft pad under headband — leather/foam with sheen */}
      <mesh position={[0, 0.01, 0]}>
        <torusGeometry args={[0.118, 0.017, 8, 24, Math.PI]} />
        <meshPhysicalMaterial
          color={pad}
          roughness={0.8}
          metalness={0.03}
          clearcoat={0.14}
          clearcoatRoughness={0.58}
          sheen={0.55}
          sheenRoughness={0.68}
          sheenColor="#4a3040"
        />
      </mesh>
      {/* Brand plate on headband crown */}
      <mesh position={[0, 0.128, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.04, 0.012, 0.006]} />
        <meshPhysicalMaterial
          color={chrome}
          roughness={0.16}
          metalness={0.92}
          anisotropy={0.7}
          anisotropyRotation={0}
          clearcoat={0.45}
          clearcoatRoughness={0.16}
          emissive={selected ? accent : 0x000000}
          emissiveIntensity={selected ? 0.22 : 0}
        />
      </mesh>

      {/* Slider yokes L/R */}
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 0.12, -0.02, 0]} rotation={[0, 0, side * 0.12]}>
          <mesh castShadow position={[0, 0.04, 0]}>
            <boxGeometry args={[0.018, 0.07, 0.012]} />
            <meshPhysicalMaterial
              color={metal}
              roughness={0.2}
              {...brushedSteel}
              anisotropyRotation={Math.PI * 0.5}
            />
          </mesh>
          {/* Slider notch marks */}
          {[0.02, 0.035, 0.05].map((y) => (
            <mesh key={y} position={[side * 0.01, y, 0.007]}>
              <boxGeometry args={[0.004, 0.003, 0.002]} />
              <meshStandardMaterial color="#0a0a0e" roughness={0.6} metalness={0.4} />
            </mesh>
          ))}
          {/* Ear cup shell — satin plastic + micro clearcoat (not chrome blob) */}
          <mesh position={[0, -0.015, 0]} castShadow scale={[1, 1, 0.72]}>
            <sphereGeometry args={[0.058, 22, 18]} />
            <meshPhysicalMaterial
              color={shell}
              roughness={0.28}
              metalness={0.32}
              clearcoat={0.55}
              clearcoatRoughness={0.22}
              anisotropy={0.25}
            />
          </mesh>
          {/* Outer chrome trim ring — bright lobe */}
          <mesh position={[0, -0.015, 0.028]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.048, 0.0045, 8, 24]} />
            <meshPhysicalMaterial
              color={chrome}
              roughness={0.12}
              metalness={0.96}
              anisotropy={0.6}
              anisotropyRotation={0}
              clearcoat={0.62}
              clearcoatRoughness={0.1}
            />
          </mesh>
          {/* Cushion ring — velvet foam + sheen */}
          <mesh position={[0, -0.015, 0.022]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.04, 0.014, 8, 20]} />
            <meshPhysicalMaterial
              color={pad}
              roughness={0.86}
              metalness={0.02}
              sheen={0.55}
              sheenRoughness={0.65}
              sheenColor="#5a3850"
            />
          </mesh>
          {/* Inner cushion fill */}
          <mesh position={[0, -0.015, 0.024]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.032, 16]} />
            <meshStandardMaterial color="#120e14" roughness={0.9} metalness={0.02} />
          </mesh>
          {/* Driver mesh face + accent glow */}
          <mesh position={[0, -0.015, 0.028]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.03, 18]} />
            <meshStandardMaterial
              color="#100c14"
              emissive={accent}
              emissiveIntensity={selected ? 0.38 : 0.08}
              roughness={0.26}
              metalness={0.3}
            />
          </mesh>
          {/* Mesh grille rings (speaker tell) */}
          {[0.012, 0.02, 0.026].map((r) => (
            <mesh key={r} position={[0, -0.015, 0.029]} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[r - 0.002, r, 20]} />
              <meshBasicMaterial
                color={selected ? '#c4b0ff' : '#3a3048'}
                transparent
                opacity={selected ? 0.55 : 0.28}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
          <mesh position={[0, -0.015, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.02, 0.028, 18]} />
            <meshBasicMaterial
              color={selected ? '#d4c4ff' : '#5a4a70'}
              transparent
              opacity={selected ? 0.7 : 0.28}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      {/* Thin cable drape — rubber jacket + strain relief */}
      <mesh position={[0.1, -0.08, 0.02]} rotation={[0.4, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.004, 0.004, 0.12, 6]} />
        <meshStandardMaterial color="#0c0c10" roughness={0.82} metalness={0.06} />
      </mesh>
      <mesh position={[0.12, -0.14, 0.04]} rotation={[0.9, 0.2, 0.1]}>
        <cylinderGeometry args={[0.004, 0.004, 0.08, 6]} />
        <meshStandardMaterial color="#0c0c10" roughness={0.82} metalness={0.06} />
      </mesh>
      <mesh position={[0.095, -0.055, 0.01]}>
        <sphereGeometry args={[0.008, 8, 6]} />
        <meshStandardMaterial color="#14141a" roughness={0.7} metalness={0.15} />
      </mesh>
    </group>
  )
}

export function ProjectHotspots({ projects, selectedId, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  /**
   * Residual (E) loop-r24: match App stack breakpoint (styles.css max-width: 960px).
   * When panel drops under the stall, hang-board already stamps ORDERED — free the
   * 3D canvas from mid-void Html so camux mobile/tablet stills read stall first.
   */
  const [stackChrome, setStackChrome] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(max-width: 960px)')
    const sync = () => setStackChrome(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const ramen = useMemo(() => createRamenBowlModel({ castShadow: true }), [])
  const boba = useMemo(() => createBobaCupPairModel({ castShadow: true }), [])

  useModelTick(ramen)
  useModelTick(boba)

  const byId = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])

  const evolve = byId.get('evolve')
  const ace = byId.get('ace')
  const monument = byId.get('monument')
  const files = byId.get('files')
  const fleet = byId.get('fleet')
  const audio = byId.get('audio')

  const bobaSelected = selectedId === 'ace' || selectedId === 'monument'
  const laptopSelected = selectedId === 'files' || selectedId === 'fleet'
  // Residual (E): ordered mode → one ticket focus (panel + portal stay in sync)
  const anyOrdered = selectedId != null

  return (
    <group name="ProjectHotspots">
      {/*
        Residual (B)/(D)/(E) loop-r32: counter SPECIALS + portal chrome de-clash.
        Food line under hero FOV; contact firm when ordered (kiosk mass, not float).
        y ≈ 1.11 on oak veneer top (~1.136). Clear of shell sink @1.15/-0.85.
        Rings = hairline accents only. Html #stubs = prop-rim chalk matching board
        #nos — never large mid-void SaaS badges fighting neon (chrome residual D).
      */}
      <group position={[-0.2, 1.11, -0.22]} scale={1.48}>
        <HotspotRoot
          selected={selectedId === 'evolve'}
          hovered={hovered === 'evolve'}
          onSelect={() => evolve && onSelect('evolve')}
          onHover={(v) => setHovered(v ? 'evolve' : null)}
          label={evolve?.menuName}
          // Bowl front rim — residual E/D prop-anchor (chalk #, not mid-void)
          labelY={0.2}
          glowColor={evolve?.accent ?? '#e8a54b'}
          // r32: firm foot mass under bowl — oak grain outside feet still reads
          contactRadius={0.28}
          contactOpacity={selectedId === 'evolve' ? 0.9 : 0.74}
          menuNo="01"
          zone={evolve?.zone}
          anyOrdered={anyOrdered}
          stackChrome={stackChrome}
        >
          <primitive object={ramen} />
        </HotspotRoot>
      </group>

      <group position={[0.22, 1.11, -0.24]} scale={1.5}>
        <HotspotRoot
          selected={bobaSelected}
          hovered={hovered === 'boba'}
          onSelect={() => {
            if (selectedId === 'ace' && monument) onSelect('monument')
            else if (selectedId === 'monument' && ace) onSelect('ace')
            else if (ace) onSelect('ace')
          }}
          onHover={(v) => setHovered(v ? 'boba' : null)}
          label={selectedId === 'monument' ? monument?.menuName : ace?.menuName}
          // Cup lids front rim — residual E/D: short local Y; chalk ticket
          labelY={0.24}
          glowColor={
            selectedId === 'monument' ? monument?.accent ?? '#f0a0c0' : ace?.accent ?? '#c47a3a'
          }
          // r32: pair footprint firm, penumbra tight — no stage disc wash
          contactRadius={0.32}
          contactOpacity={bobaSelected ? 0.88 : 0.72}
          dualPortal
          menuNo={selectedId === 'monument' ? '06' : '02'}
          menuNoAlt={selectedId === 'monument' ? '02' : '06'}
          zone={selectedId === 'monument' ? monument?.zone : ace?.zone}
          anyOrdered={anyOrdered}
          stackChrome={stackChrome}
          cycleHint={
            bobaSelected && monument && ace
              ? selectedId === 'monument'
                ? `↻ ${ace.menuName}`
                : `↻ ${monument.menuName}`
              : undefined
          }
        >
          <primitive object={boba} />
        </HotspotRoot>
        {/* Dual alt only on pre-order desktop hover — residual (E)/(D) r32 paper ticket, no soup */}
        {hovered === 'boba' && !bobaSelected && !anyOrdered && !stackChrome && monument && ace && (
          <Html
            position={[0.1, 0.1, 0.06]}
            center
            distanceFactor={32}
            style={{ pointerEvents: 'auto' }}
            zIndexRange={[80, 0]}
          >
            <div
              className="r3f-label r3f-label-alt hotspot"
              style={{
                cursor: 'pointer',
                // Residual B/E/D r32: warm chrome accent — hang-board twin, no cool glow
                ['--portal-accent' as string]: warmChromeAccent(monument.accent ?? '#f0a0c0'),
              }}
              onClick={(e) => {
                e.stopPropagation()
                onSelect('monument')
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onSelect('monument')
                }
              }}
            >
              <span className="r3f-label-row">
                <span className="r3f-label-no">#06</span>
                <span className="r3f-label-name">{monument.menuName}</span>
              </span>
              <span className="r3f-label-meta">
                {monument.zone ? (
                  <span className="r3f-label-zone">{monument.zone}</span>
                ) : null}
                <span className="r3f-label-cycle">also on menu · tap</span>
              </span>
            </div>
          </Html>
        )}
      </group>

      {/* Laptop — residual (B)/(D): mat-local; small #stub match board booth row */}
      <group position={[-1.18, 0.76, 0.78]} rotation={[0, 0.34, 0]} scale={1.4}>
        <HotspotRoot
          selected={laptopSelected}
          hovered={hovered === 'laptop'}
          onSelect={() => {
            if (selectedId === 'files' && fleet) onSelect('fleet')
            else if (selectedId === 'fleet' && files) onSelect('files')
            else if (files) onSelect('files')
          }}
          onHover={(v) => setHovered(v ? 'laptop' : null)}
          label={selectedId === 'fleet' ? fleet?.menuName : files?.menuName}
          // Lid front rim — residual E/D prop-anchor
          labelY={0.16}
          glowColor={
            selectedId === 'fleet' ? fleet?.accent ?? '#7ddea2' : files?.accent ?? '#6ec6ff'
          }
          // r32: mat-local firm contact; hairline rings only (no cool spill)
          contactRadius={0.32}
          contactOpacity={laptopSelected ? 0.9 : 0.74}
          dualPortal
          menuNo={selectedId === 'fleet' ? '04' : '03'}
          menuNoAlt={selectedId === 'fleet' ? '03' : '04'}
          zone={selectedId === 'fleet' ? fleet?.zone : files?.zone}
          anyOrdered={anyOrdered}
          stackChrome={stackChrome}
          cycleHint={
            laptopSelected && fleet && files
              ? selectedId === 'fleet'
                ? `↻ ${files.menuName}`
                : `↻ ${fleet.menuName}`
              : undefined
          }
        >
          <DetailedLaptop selected={laptopSelected} />
        </HotspotRoot>
        {/* Dual alt only on pre-order desktop hover — residual (E)/(D) r32 paper ticket */}
        {hovered === 'laptop' && !laptopSelected && !anyOrdered && !stackChrome && fleet && files && (
          <Html
            position={[0.12, 0.08, 0.05]}
            center
            distanceFactor={32}
            style={{ pointerEvents: 'auto' }}
            zIndexRange={[80, 0]}
          >
            <div
              className="r3f-label r3f-label-alt hotspot"
              style={{
                cursor: 'pointer',
                // Residual B/E/D r32: warm ticket chrome (drop cool mint fleet wash)
                ['--portal-accent' as string]: warmChromeAccent(fleet.accent ?? '#7ddea2'),
              }}
              onClick={(e) => {
                e.stopPropagation()
                onSelect('fleet')
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onSelect('fleet')
                }
              }}
            >
              <span className="r3f-label-row">
                <span className="r3f-label-no">#04</span>
                <span className="r3f-label-name">{fleet.menuName}</span>
              </span>
              <span className="r3f-label-meta">
                {fleet.zone ? (
                  <span className="r3f-label-zone">{fleet.zone}</span>
                ) : null}
                <span className="r3f-label-cycle">also on menu · tap</span>
              </span>
            </div>
          </Html>
        )}
      </group>

      {/* Headphones — residual (B): food-line right cluster; coaster contact */}
      <group position={[0.68, 1.11, -0.16]} scale={1.74}>
        <HotspotRoot
          selected={selectedId === 'audio'}
          hovered={hovered === 'audio'}
          onSelect={() => audio && onSelect('audio')}
          onHover={(v) => setHovered(v ? 'audio' : null)}
          label={audio?.menuName}
          labelY={0.1}
          glowColor={audio?.accent ?? '#b794f6'}
          // r32: coaster-local firm contact; violet spill disc removed
          contactRadius={0.25}
          contactOpacity={selectedId === 'audio' ? 0.86 : 0.7}
          menuNo="05"
          zone={audio?.zone}
          anyOrdered={anyOrdered}
          stackChrome={stackChrome}
        >
          <Headphones selected={selectedId === 'audio'} />
        </HotspotRoot>
      </group>
    </group>
  )
}
