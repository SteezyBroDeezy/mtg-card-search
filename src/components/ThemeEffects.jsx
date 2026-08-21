import { useEffect, useState } from 'react'
import { themes } from '../lib/theme'

function ThemeEffects({ themeName }) {
  const [particles, setParticles] = useState([])
  const theme = themes[themeName]
  const special = theme?.special

  useEffect(() => {
    if (!special) {
      setParticles([])
      return
    }

    const newParticles = []
    // Generate particles based on theme type. Every random value a particle
    // needs is baked in here — computing them during render made the stars
    // teleport on each state change.
    const COUNTS = {
      stars: 50, starfield: 70, snow: 30, fireflies: 22, dust: 26, rain: 40,
    }
    const count = COUNTS[special] ?? 20

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 10 + Math.random() * 20,
        twinkle: 1.5 + Math.random() * 4,
        drift: -20 + Math.random() * 40,
        opacity: 0.25 + Math.random() * 0.6,
        size: special === 'stars' || special === 'starfield'
          ? 1 + Math.random() * 2.2
          : 4 + Math.random() * 8
      })
    }

    setParticles(newParticles)
  }, [special])

  if (!special) return null

  // Stars effect
  if (special === 'stars') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="star"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.twinkle}s`
            }}
          />
        ))}
      </div>
    )
  }

  // Deep space: layered twinkling starfield, a slow nebula wash and the
  // occasional shooting star. The heaviest of the new effects, still only
  // CSS animations on ~70 absolutely positioned dots.
  if (special === 'starfield') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="nebula-wash" />
        {particles.map(p => (
          <div
            key={p.id}
            className="star"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.twinkle}s`,
              boxShadow: p.size > 2.4 ? '0 0 6px 1px rgba(191,219,254,0.7)' : undefined
            }}
          />
        ))}
        {[0, 1, 2].map(i => (
          <div
            key={`shoot-${i}`}
            className="shooting-star"
            style={{
              top: `${8 + i * 22}%`,
              left: `${10 + i * 25}%`,
              animationDelay: `${6 + i * 9}s`
            }}
          />
        ))}
      </div>
    )
  }

  // Nebula: slow drifting clouds of colour, no particles at all.
  if (special === 'nebula') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="nebula-cloud nebula-cloud-1" />
        <div className="nebula-cloud nebula-cloud-2" />
        <div className="nebula-cloud nebula-cloud-3" />
      </div>
    )
  }

  // Aurora: two ribbons of light sliding across the top of the page.
  if (special === 'aurora') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="aurora-band aurora-band-1" />
        <div className="aurora-band aurora-band-2" />
      </div>
    )
  }

  // Fireflies: soft motes that drift up and fade in and out.
  if (special === 'fireflies') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="firefly"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${8 + p.duration * 0.6}s`,
              '--drift': `${p.drift}px`
            }}
          />
        ))}
      </div>
    )
  }

  // Dust: barely-there motes for a quiet, papery background.
  if (special === 'dust') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="dust-mote"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size * 0.5}px`,
              height: `${p.size * 0.5}px`,
              opacity: p.opacity * 0.5,
              animationDelay: `${p.delay}s`,
              animationDuration: `${14 + p.duration}s`,
              '--drift': `${p.drift}px`
            }}
          />
        ))}
      </div>
    )
  }

  // Rain: thin streaks plus a faint storm flicker.
  if (special === 'rain') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="raindrop"
            style={{
              left: `${p.left}%`,
              opacity: p.opacity * 0.5,
              animationDelay: `${p.delay * 0.15}s`,
              animationDuration: `${0.6 + (p.duration % 5) * 0.12}s`
            }}
          />
        ))}
      </div>
    )
  }

  // Snow/Ice effect
  if (special === 'snow') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle text-cyan-200"
            style={{
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`
            }}
          >
            *
          </div>
        ))}
      </div>
    )
  }

  // Sparks effect (Planeswalker)
  if (special === 'sparks') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle text-fuchsia-300"
            style={{
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`
            }}
          >
            +
          </div>
        ))}
      </div>
    )
  }

  // Dragon fire embers
  if (special === 'dragon') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle text-orange-400"
            style={{
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`
            }}
          >
            .
          </div>
        ))}
      </div>
    )
  }

  // Mythic gold shimmer
  if (special === 'mythic') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle text-yellow-300"
            style={{
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`
            }}
          >
            *
          </div>
        ))}
      </div>
    )
  }

  // Blood moon effect
  if (special === 'blood') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Red moon glow in corner */}
        <div
          className="absolute top-10 right-10 w-20 h-20 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, #dc2626 0%, transparent 70%)',
            filter: 'blur(10px)'
          }}
        />
        {particles.slice(0, 10).map(p => (
          <div
            key={p.id}
            className="particle text-red-400"
            style={{
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`
            }}
          >
            .
          </div>
        ))}
      </div>
    )
  }

  // Neon effect
  if (special === 'neon') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Neon grid lines */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(to right, #06b6d4 1px, transparent 1px),
              linear-gradient(to bottom, #06b6d4 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>
    )
  }

  return null
}

export default ThemeEffects
