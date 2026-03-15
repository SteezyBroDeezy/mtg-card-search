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

    // Generate particles based on theme type
    const newParticles = []
    const count = special === 'stars' ? 50 : special === 'snow' ? 30 : 20

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 10 + Math.random() * 20,
        size: special === 'stars' ? 1 + Math.random() * 2 : 4 + Math.random() * 8
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
              top: `${Math.random() * 100}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${1 + Math.random() * 3}s`
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
