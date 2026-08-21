import { useMemo } from 'react'
import { themes } from '../lib/theme'
import { intensityConfig } from '../lib/effects'

// Ambient background layers. Every layer is a fixed, non-interactive sheet
// behind the app (z-0, pointer-events-none) built from CSS animations only —
// no timers, no rAF loops, nothing that touches React state per frame.
//
// Randomness is computed once per layer in a useMemo, never during render:
// doing it inline made particles teleport on every re-render.

const LAYER_BASE = 'fixed inset-0 pointer-events-none overflow-hidden z-0'

function rand(min, max) {
  return min + Math.random() * (max - min)
}

/** Build `count` particles, scaled by the chosen intensity. */
function useParticles(count, intensity, build) {
  const { multiplier } = intensityConfig(intensity)
  const total = Math.max(1, Math.round(count * multiplier))
  // The particle set only needs rebuilding when the count changes; `build` is
  // a fresh closure every render and would thrash it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => Array.from({ length: total }, (_, id) => ({ id, ...build() })), [total])
}

// ---------------------------------------------------------------- starfield

function StarfieldLayer({ intensity }) {
  const { opacity } = intensityConfig(intensity)
  const stars = useParticles(70, intensity, () => ({
    left: rand(0, 100),
    top: rand(0, 100),
    size: rand(1, 3.2),
    delay: rand(0, 8),
    twinkle: rand(1.5, 5.5),
    alpha: rand(0.25, 0.95),
  }))

  return (
    <div className={LAYER_BASE}>
      <div className="nebula-wash" />
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: Math.min(1, s.alpha * opacity),
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.twinkle}s`,
            boxShadow: s.size > 2.4 ? '0 0 6px 1px rgba(191,219,254,0.7)' : undefined,
          }}
        />
      ))}
      {[0, 1, 2].map(i => (
        <div
          key={`shoot-${i}`}
          className="shooting-star"
          style={{ top: `${8 + i * 22}%`, left: `${10 + i * 25}%`, animationDelay: `${6 + i * 9}s` }}
        />
      ))}
    </div>
  )
}

// ------------------------------------------------------------------ planets

// Each planet is a gradient-lit disc: a light source on one side, a dark limb
// on the other, some with a ring. They cross over several minutes, so the
// movement reads as drift rather than animation.
const PLANET_PRESETS = [
  { size: 150, fill: 'radial-gradient(circle at 32% 28%, #93c5fd, #2563eb 45%, #0b1f4b 78%)', ring: false, top: 12, duration: 240, delay: 0 },
  { size: 88, fill: 'radial-gradient(circle at 35% 30%, #fdba74, #c2410c 50%, #3b1206 80%)', ring: true, top: 58, duration: 320, delay: 40 },
  { size: 52, fill: 'radial-gradient(circle at 38% 32%, #d9f99d, #4d7c0f 52%, #14210a 82%)', ring: false, top: 78, duration: 400, delay: 120 },
  { size: 200, fill: 'radial-gradient(circle at 30% 26%, #e9d5ff, #7e22ce 48%, #2a0a45 80%)', ring: false, top: 32, duration: 520, delay: 200 },
]

function PlanetsLayer({ intensity }) {
  const { multiplier, opacity } = intensityConfig(intensity)
  const planets = PLANET_PRESETS.slice(0, Math.min(4, Math.max(1, Math.round(2 * multiplier))))

  return (
    <div className={LAYER_BASE}>
      {planets.map((p, i) => (
        <div
          key={i}
          className="planet-orbit"
          style={{
            top: `${p.top}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `-${p.delay}s`,
          }}
        >
          <div
            className="planet-body"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.fill,
              opacity: Math.min(0.85, 0.5 * opacity),
            }}
          >
            {p.ring && <div className="planet-ring" />}
          </div>
        </div>
      ))}
    </div>
  )
}

// ------------------------------------------------------------------- debris

// Small irregular rocks that tumble as they cross, plus comets on a much
// longer cycle.
function DebrisLayer({ intensity }) {
  const { opacity } = intensityConfig(intensity)
  const rocks = useParticles(14, intensity, () => ({
    top: rand(0, 100),
    size: rand(4, 14),
    duration: rand(45, 130),
    delay: rand(0, 90),
    spin: rand(6, 22),
    reverse: Math.random() > 0.5,
    alpha: rand(0.2, 0.55),
    radius: `${rand(35, 60)}% ${rand(40, 65)}% ${rand(35, 60)}% ${rand(40, 65)}%`,
  }))

  return (
    <div className={LAYER_BASE}>
      {rocks.map(r => (
        <div
          key={r.id}
          className={r.reverse ? 'debris-track debris-track-reverse' : 'debris-track'}
          style={{
            top: `${r.top}%`,
            animationDuration: `${r.duration}s`,
            animationDelay: `-${r.delay}s`,
          }}
        >
          <div
            className="debris-rock"
            style={{
              width: `${r.size}px`,
              height: `${r.size * 0.8}px`,
              borderRadius: r.radius,
              opacity: Math.min(0.8, r.alpha * opacity),
              animationDuration: `${r.spin}s`,
              animationDirection: r.reverse ? 'reverse' : 'normal',
            }}
          />
        </div>
      ))}
      {[0, 1].map(i => (
        <div
          key={`comet-${i}`}
          className="comet"
          style={{ top: `${20 + i * 40}%`, animationDelay: `${18 + i * 26}s` }}
        />
      ))}
    </div>
  )
}

// -------------------------------------------------------- simple CSS layers

function NebulaLayer() {
  return (
    <div className={LAYER_BASE}>
      <div className="nebula-cloud nebula-cloud-1" />
      <div className="nebula-cloud nebula-cloud-2" />
      <div className="nebula-cloud nebula-cloud-3" />
    </div>
  )
}

function AuroraLayer() {
  return (
    <div className={LAYER_BASE}>
      <div className="aurora-band aurora-band-1" />
      <div className="aurora-band aurora-band-2" />
    </div>
  )
}

function FirefliesLayer({ intensity }) {
  const { opacity } = intensityConfig(intensity)
  const motes = useParticles(22, intensity, () => ({
    left: rand(0, 100),
    top: rand(20, 100),
    delay: rand(0, 12),
    duration: rand(12, 26),
    drift: rand(-30, 30),
  }))

  return (
    <div className={LAYER_BASE} style={{ opacity }}>
      {motes.map(m => (
        <div
          key={m.id}
          className="firefly"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            '--drift': `${m.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

function DustLayer({ intensity }) {
  const { opacity } = intensityConfig(intensity)
  const motes = useParticles(26, intensity, () => ({
    left: rand(0, 100),
    top: rand(0, 100),
    size: rand(2, 5),
    delay: rand(0, 14),
    duration: rand(18, 40),
    drift: rand(-25, 25),
    alpha: rand(0.1, 0.35),
  }))

  return (
    <div className={LAYER_BASE}>
      {motes.map(m => (
        <div
          key={m.id}
          className="dust-mote"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            opacity: m.alpha * opacity,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            '--drift': `${m.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

function RainLayer({ intensity }) {
  const { opacity } = intensityConfig(intensity)
  const drops = useParticles(40, intensity, () => ({
    left: rand(0, 100),
    delay: rand(0, 2),
    duration: rand(0.6, 1.3),
    alpha: rand(0.15, 0.5),
  }))

  return (
    <div className={LAYER_BASE}>
      {drops.map(d => (
        <div
          key={d.id}
          className="raindrop"
          style={{
            left: `${d.left}%`,
            opacity: d.alpha * opacity,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

function SnowLayer({ intensity }) {
  const { opacity } = intensityConfig(intensity)
  const flakes = useParticles(30, intensity, () => ({
    left: rand(0, 100),
    size: rand(4, 12),
    delay: rand(0, 10),
    duration: rand(12, 30),
  }))

  return (
    <div className={LAYER_BASE} style={{ opacity }}>
      {flakes.map(f => (
        <div
          key={f.id}
          className="particle text-cyan-200"
          style={{
            left: `${f.left}%`,
            fontSize: `${f.size}px`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        >
          *
        </div>
      ))}
    </div>
  )
}

function ClassicStarsLayer({ intensity }) {
  const { opacity } = intensityConfig(intensity)
  const stars = useParticles(50, intensity, () => ({
    left: rand(0, 100),
    top: rand(0, 100),
    size: rand(1, 3),
    delay: rand(0, 10),
    twinkle: rand(1.5, 4.5),
  }))

  return (
    <div className={LAYER_BASE} style={{ opacity }}>
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.twinkle}s`,
          }}
        />
      ))}
    </div>
  )
}

// ----------------------------------------------- legacy theme-only effects

function SymbolDriftLayer({ intensity, colorClass, glyph, count = 20 }) {
  const { opacity } = intensityConfig(intensity)
  const bits = useParticles(count, intensity, () => ({
    left: rand(0, 100),
    size: rand(4, 12),
    delay: rand(0, 10),
    duration: rand(10, 30),
  }))

  return (
    <div className={LAYER_BASE} style={{ opacity }}>
      {bits.map(b => (
        <div
          key={b.id}
          className={`particle ${colorClass}`}
          style={{
            left: `${b.left}%`,
            fontSize: `${b.size}px`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        >
          {glyph}
        </div>
      ))}
    </div>
  )
}

function BloodMoonLayer({ intensity }) {
  return (
    <div className={LAYER_BASE}>
      <div
        className="absolute top-10 right-10 w-20 h-20 rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, #dc2626 0%, transparent 70%)', filter: 'blur(10px)' }}
      />
      <SymbolDriftLayer intensity={intensity} colorClass="text-red-400" glyph="." count={10} />
    </div>
  )
}

function NeonGridLayer() {
  return (
    <div className={LAYER_BASE}>
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, #06b6d4 1px, transparent 1px),
            linear-gradient(to bottom, #06b6d4 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  )
}

// ------------------------------------------------------------------ router

function Layer({ effect, intensity }) {
  switch (effect) {
    case 'starfield': return <StarfieldLayer intensity={intensity} />
    case 'planets': return <PlanetsLayer intensity={intensity} />
    case 'debris': return <DebrisLayer intensity={intensity} />
    case 'nebula': return <NebulaLayer />
    case 'aurora': return <AuroraLayer />
    case 'fireflies': return <FirefliesLayer intensity={intensity} />
    case 'dust': return <DustLayer intensity={intensity} />
    case 'rain': return <RainLayer intensity={intensity} />
    case 'snow': return <SnowLayer intensity={intensity} />
    case 'stars': return <ClassicStarsLayer intensity={intensity} />
    // Effects that only ever came from a theme
    case 'sparks': return <SymbolDriftLayer intensity={intensity} colorClass="text-fuchsia-300" glyph="+" />
    case 'dragon': return <SymbolDriftLayer intensity={intensity} colorClass="text-orange-400" glyph="." />
    case 'mythic': return <SymbolDriftLayer intensity={intensity} colorClass="text-yellow-300" glyph="*" />
    case 'blood': return <BloodMoonLayer intensity={intensity} />
    case 'neon': return <NeonGridLayer />
    default: return null
  }
}

/**
 * effectMode 'auto' renders whatever the current theme ships with; 'custom'
 * renders exactly the layers given, stacked in order.
 */
function ThemeEffects({ themeName, effectMode = 'auto', effectLayers = [], intensity = 'normal' }) {
  const themeSpecial = themes[themeName]?.special
  const active = effectMode === 'auto'
    ? (themeSpecial ? [themeSpecial] : [])
    : effectLayers

  if (active.length === 0) return null

  return (
    <>
      {active.map(effect => (
        <Layer key={effect} effect={effect} intensity={intensity} />
      ))}
    </>
  )
}

export default ThemeEffects
