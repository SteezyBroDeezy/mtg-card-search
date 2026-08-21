// Background effect layers.
//
// Effects used to be welded to a theme (each theme had one `special`), so the
// only way to get stars was to also take the Cosmic Void palette. They're now
// independent: pick any theme, then stack any effects on top of it. 'auto'
// keeps the old behaviour — whatever effect the current theme ships with.

export const EFFECT_LAYERS = [
  { value: 'starfield', label: '🌠 Starfield', description: 'Twinkling stars, nebula wash, shooting stars' },
  { value: 'planets', label: '🪐 Planets', description: 'Distant worlds drifting slowly across' },
  { value: 'debris', label: '☄️ Space debris', description: 'Tumbling rocks and passing comets' },
  { value: 'nebula', label: '🌫️ Nebula clouds', description: 'Slow drifting colour' },
  { value: 'aurora', label: '🌌 Aurora', description: 'Ribbons of light overhead' },
  { value: 'fireflies', label: '✨ Fireflies', description: 'Soft motes drifting upward' },
  { value: 'dust', label: '🌾 Dust motes', description: 'Barely-there specks' },
  { value: 'rain', label: '🌧️ Rain', description: 'Thin falling streaks' },
  { value: 'snow', label: '❄️ Snow', description: 'Gentle falling flakes' },
  { value: 'stars', label: '⭐ Classic stars', description: 'The original simple twinkle' },
]

export const INTENSITY_OPTIONS = [
  { value: 'subtle', label: 'Subtle', multiplier: 0.5, opacity: 0.6 },
  { value: 'normal', label: 'Normal', multiplier: 1, opacity: 1 },
  { value: 'bold', label: 'Bold', multiplier: 1.8, opacity: 1.25 },
]

const LAYERS_KEY = 'mtg-effect-layers'
const INTENSITY_KEY = 'mtg-effect-intensity'

const VALID = new Set(EFFECT_LAYERS.map(l => l.value))

/**
 * Returns { mode, layers }.
 *   mode 'auto'   — follow the theme's own effect (layers is ignored)
 *   mode 'custom' — render exactly `layers` (an empty array means none)
 */
export function loadEffectLayers() {
  try {
    const raw = localStorage.getItem(LAYERS_KEY)
    if (raw == null) return { mode: 'auto', layers: [] }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return { mode: 'auto', layers: [] }
    return { mode: 'custom', layers: parsed.filter(l => VALID.has(l)) }
  } catch {
    return { mode: 'auto', layers: [] }
  }
}

export function saveEffectLayers({ mode, layers }) {
  try {
    if (mode === 'auto') localStorage.removeItem(LAYERS_KEY)
    else localStorage.setItem(LAYERS_KEY, JSON.stringify(layers))
  } catch {
    // Private browsing / storage disabled — the choice just won't persist.
  }
}

export function loadIntensity() {
  try {
    const raw = localStorage.getItem(INTENSITY_KEY)
    return INTENSITY_OPTIONS.some(o => o.value === raw) ? raw : 'normal'
  } catch {
    return 'normal'
  }
}

export function saveIntensity(value) {
  try {
    localStorage.setItem(INTENSITY_KEY, value)
  } catch {
    // ignore
  }
}

export function intensityConfig(value) {
  return INTENSITY_OPTIONS.find(o => o.value === value) || INTENSITY_OPTIONS[1]
}
