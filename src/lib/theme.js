export const themes = {
  dark: {
    name: 'Dark',
    bg: 'bg-gray-900',
    bgSecondary: 'bg-gray-800',
    bgTertiary: 'bg-gray-700',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    border: 'border-gray-700',
    borderAccent: 'border-blue-500',
    accent: 'bg-blue-600 hover:bg-blue-700',
    ring: 'ring-blue-500',
    glow: 'shadow-blue-500/20'
  },
  light: {
    name: 'Light',
    bg: 'bg-gray-100',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-gray-200',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-300',
    borderAccent: 'border-blue-500',
    accent: 'bg-blue-600 hover:bg-blue-700',
    ring: 'ring-blue-500',
    glow: 'shadow-blue-500/20'
  },
  // MTG Color Themes - more vibrant!
  red: {
    name: 'Red Mana',
    bg: 'bg-gradient-to-b from-red-950 to-orange-950',
    bgSecondary: 'bg-red-900/90',
    bgTertiary: 'bg-red-800',
    text: 'text-white',
    textSecondary: 'text-orange-300',
    border: 'border-red-700',
    borderAccent: 'border-orange-500',
    accent: 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400',
    ring: 'ring-orange-500',
    glow: 'shadow-orange-500/30'
  },
  blue: {
    name: 'Blue Mana',
    bg: 'bg-gradient-to-b from-blue-950 to-cyan-950',
    bgSecondary: 'bg-blue-900/90',
    bgTertiary: 'bg-blue-800',
    text: 'text-white',
    textSecondary: 'text-cyan-300',
    border: 'border-blue-700',
    borderAccent: 'border-cyan-400',
    accent: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400',
    ring: 'ring-cyan-400',
    glow: 'shadow-cyan-500/30'
  },
  green: {
    name: 'Green Mana',
    bg: 'bg-gradient-to-b from-green-950 to-emerald-950',
    bgSecondary: 'bg-green-900/90',
    bgTertiary: 'bg-green-800',
    text: 'text-white',
    textSecondary: 'text-emerald-300',
    border: 'border-green-700',
    borderAccent: 'border-emerald-400',
    accent: 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400',
    ring: 'ring-emerald-400',
    glow: 'shadow-emerald-500/30'
  },
  black: {
    name: 'Black Mana',
    bg: 'bg-gradient-to-b from-zinc-950 to-neutral-950',
    bgSecondary: 'bg-zinc-900/90',
    bgTertiary: 'bg-zinc-800',
    text: 'text-gray-100',
    textSecondary: 'text-violet-300',
    border: 'border-zinc-700',
    borderAccent: 'border-violet-500',
    accent: 'bg-gradient-to-r from-violet-700 to-purple-600 hover:from-violet-600 hover:to-purple-500',
    ring: 'ring-violet-500',
    glow: 'shadow-violet-500/30'
  },
  white: {
    name: 'White Mana',
    bg: 'bg-gradient-to-b from-amber-50 to-yellow-50',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-amber-100',
    text: 'text-amber-950',
    textSecondary: 'text-amber-700',
    border: 'border-amber-300',
    borderAccent: 'border-yellow-500',
    accent: 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300',
    ring: 'ring-yellow-500',
    glow: 'shadow-yellow-500/30'
  },
  // Mystical arcane theme
  mystical: {
    name: 'Mystical',
    bg: 'bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-950',
    bgSecondary: 'bg-indigo-900/80',
    bgTertiary: 'bg-purple-900/80',
    text: 'text-purple-100',
    textSecondary: 'text-pink-300',
    border: 'border-purple-700',
    borderAccent: 'border-pink-500',
    accent: 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400',
    ring: 'ring-pink-500',
    glow: 'shadow-pink-500/40'
  },
  // Gold/Artifact theme
  artifact: {
    name: 'Artifact',
    bg: 'bg-gradient-to-b from-slate-900 to-zinc-900',
    bgSecondary: 'bg-slate-800/90',
    bgTertiary: 'bg-slate-700',
    text: 'text-amber-100',
    textSecondary: 'text-amber-300',
    border: 'border-amber-700/60',
    borderAccent: 'border-amber-400',
    accent: 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300',
    ring: 'ring-amber-400',
    glow: 'shadow-amber-500/40'
  },
  // Phyrexian-inspired
  phyrexian: {
    name: 'Phyrexian',
    bg: 'bg-gradient-to-b from-neutral-950 to-gray-950',
    bgSecondary: 'bg-neutral-900/90',
    bgTertiary: 'bg-neutral-800',
    text: 'text-gray-100',
    textSecondary: 'text-emerald-400',
    border: 'border-emerald-900/70',
    borderAccent: 'border-emerald-500',
    accent: 'bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-600 hover:to-teal-500',
    ring: 'ring-emerald-500',
    glow: 'shadow-emerald-500/40'
  },
  // Eldrazi-inspired void theme
  eldrazi: {
    name: 'Eldrazi',
    bg: 'bg-gradient-to-b from-purple-950 via-fuchsia-950 to-purple-950',
    bgSecondary: 'bg-purple-950/80',
    bgTertiary: 'bg-fuchsia-900/60',
    text: 'text-purple-100',
    textSecondary: 'text-fuchsia-300',
    border: 'border-fuchsia-800/60',
    borderAccent: 'border-fuchsia-400',
    accent: 'bg-gradient-to-r from-fuchsia-600 to-purple-500 hover:from-fuchsia-500 hover:to-purple-400',
    ring: 'ring-fuchsia-400',
    glow: 'shadow-fuchsia-500/40'
  },
  // Multicolor/Gold theme
  multicolor: {
    name: 'Multicolor',
    bg: 'bg-gradient-to-br from-amber-950 via-orange-950 to-yellow-950',
    bgSecondary: 'bg-amber-900/70',
    bgTertiary: 'bg-orange-900/60',
    text: 'text-amber-100',
    textSecondary: 'text-yellow-300',
    border: 'border-yellow-700/50',
    borderAccent: 'border-yellow-400',
    accent: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 hover:from-amber-400 hover:via-orange-400 hover:to-yellow-300',
    ring: 'ring-yellow-400',
    glow: 'shadow-yellow-500/40'
  }
}

export function saveTheme(themeName) {
  localStorage.setItem('mtg-theme', themeName)
}

export function loadTheme() {
  return localStorage.getItem('mtg-theme') || 'dark'
}
