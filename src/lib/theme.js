export const themes = {
  dark: {
    name: 'Dark',
    bg: 'bg-gray-900',
    bgSecondary: 'bg-gray-800',
    bgTertiary: 'bg-gray-700',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    border: 'border-gray-700',
    accent: 'bg-blue-600 hover:bg-blue-700'
  },
  light: {
    name: 'Light',
    bg: 'bg-gray-100',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-gray-200',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-300',
    accent: 'bg-blue-600 hover:bg-blue-700'
  },
  // MTG Color Themes
  red: {
    name: 'Red Mana',
    bg: 'bg-red-950',
    bgSecondary: 'bg-red-900',
    bgTertiary: 'bg-red-800',
    text: 'text-white',
    textSecondary: 'text-red-300',
    border: 'border-red-800',
    accent: 'bg-red-600 hover:bg-red-500'
  },
  blue: {
    name: 'Blue Mana',
    bg: 'bg-blue-950',
    bgSecondary: 'bg-blue-900',
    bgTertiary: 'bg-blue-800',
    text: 'text-white',
    textSecondary: 'text-blue-300',
    border: 'border-blue-800',
    accent: 'bg-blue-600 hover:bg-blue-500'
  },
  green: {
    name: 'Green Mana',
    bg: 'bg-green-950',
    bgSecondary: 'bg-green-900',
    bgTertiary: 'bg-green-800',
    text: 'text-white',
    textSecondary: 'text-green-300',
    border: 'border-green-800',
    accent: 'bg-green-600 hover:bg-green-500'
  },
  black: {
    name: 'Black Mana',
    bg: 'bg-zinc-950',
    bgSecondary: 'bg-zinc-900',
    bgTertiary: 'bg-zinc-800',
    text: 'text-gray-100',
    textSecondary: 'text-zinc-400',
    border: 'border-zinc-700',
    accent: 'bg-violet-700 hover:bg-violet-600'
  },
  white: {
    name: 'White Mana',
    bg: 'bg-amber-50',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-amber-100',
    text: 'text-amber-950',
    textSecondary: 'text-amber-700',
    border: 'border-amber-200',
    accent: 'bg-amber-600 hover:bg-amber-500'
  },
  // Inspired by deck30.html mystical theme
  mystical: {
    name: 'Mystical',
    bg: 'bg-stone-950',
    bgSecondary: 'bg-stone-900',
    bgTertiary: 'bg-stone-800',
    text: 'text-amber-100',
    textSecondary: 'text-amber-200/70',
    border: 'border-amber-900/50',
    accent: 'bg-amber-700 hover:bg-amber-600'
  },
  // Gold/Artifact theme
  artifact: {
    name: 'Artifact',
    bg: 'bg-slate-900',
    bgSecondary: 'bg-slate-800',
    bgTertiary: 'bg-slate-700',
    text: 'text-amber-100',
    textSecondary: 'text-slate-400',
    border: 'border-amber-700/40',
    accent: 'bg-amber-600 hover:bg-amber-500'
  },
  // Phyrexian-inspired
  phyrexian: {
    name: 'Phyrexian',
    bg: 'bg-neutral-950',
    bgSecondary: 'bg-neutral-900',
    bgTertiary: 'bg-neutral-800',
    text: 'text-gray-100',
    textSecondary: 'text-emerald-400/70',
    border: 'border-emerald-900/50',
    accent: 'bg-emerald-700 hover:bg-emerald-600'
  },
  // Eldrazi-inspired void theme
  eldrazi: {
    name: 'Eldrazi',
    bg: 'bg-purple-950',
    bgSecondary: 'bg-purple-950/80',
    bgTertiary: 'bg-purple-900',
    text: 'text-purple-100',
    textSecondary: 'text-purple-300',
    border: 'border-purple-800/50',
    accent: 'bg-purple-600 hover:bg-purple-500'
  },
  // Multicolor/Gold theme
  multicolor: {
    name: 'Multicolor',
    bg: 'bg-gradient-to-br from-amber-950 via-stone-900 to-amber-950',
    bgSecondary: 'bg-amber-900/50',
    bgTertiary: 'bg-amber-800/50',
    text: 'text-amber-100',
    textSecondary: 'text-amber-300/80',
    border: 'border-amber-600/30',
    accent: 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400'
  }
}

export function saveTheme(themeName) {
  localStorage.setItem('mtg-theme', themeName)
}

export function loadTheme() {
  return localStorage.getItem('mtg-theme') || 'dark'
}
