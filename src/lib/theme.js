export const themes = {
  dark: {
    name: 'Dark',
    bg: 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950',
    bgSecondary: 'bg-gray-800/90',
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
    bg: 'bg-gradient-to-br from-gray-100 via-white to-gray-200',
    bgSecondary: 'bg-white/90',
    bgTertiary: 'bg-gray-200',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-300',
    borderAccent: 'border-blue-500',
    accent: 'bg-blue-600 hover:bg-blue-700',
    ring: 'ring-blue-500',
    glow: 'shadow-blue-500/20'
  },

  // MTG Mana Color Themes - Vibrant Multi-Color Gradients
  red: {
    name: 'Mountain',
    bg: 'bg-gradient-to-br from-red-950 via-orange-900 to-amber-950',
    bgSecondary: 'bg-gradient-to-br from-red-900/90 to-orange-900/80',
    bgTertiary: 'bg-red-800/80',
    text: 'text-orange-100',
    textSecondary: 'text-orange-300',
    border: 'border-red-700/60',
    borderAccent: 'border-orange-400',
    accent: 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-500 hover:via-orange-400 hover:to-amber-400',
    ring: 'ring-orange-400',
    glow: 'shadow-orange-500/40'
  },
  blue: {
    name: 'Island',
    bg: 'bg-gradient-to-br from-blue-950 via-indigo-900 to-cyan-950',
    bgSecondary: 'bg-gradient-to-br from-blue-900/90 to-indigo-900/80',
    bgTertiary: 'bg-blue-800/80',
    text: 'text-cyan-100',
    textSecondary: 'text-cyan-300',
    border: 'border-blue-700/60',
    borderAccent: 'border-cyan-400',
    accent: 'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 hover:from-blue-500 hover:via-indigo-400 hover:to-cyan-400',
    ring: 'ring-cyan-400',
    glow: 'shadow-cyan-500/40'
  },
  green: {
    name: 'Forest',
    bg: 'bg-gradient-to-br from-green-950 via-emerald-900 to-teal-950',
    bgSecondary: 'bg-gradient-to-br from-green-900/90 to-emerald-900/80',
    bgTertiary: 'bg-green-800/80',
    text: 'text-emerald-100',
    textSecondary: 'text-emerald-300',
    border: 'border-green-700/60',
    borderAccent: 'border-emerald-400',
    accent: 'bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 hover:from-green-500 hover:via-emerald-400 hover:to-teal-400',
    ring: 'ring-emerald-400',
    glow: 'shadow-emerald-500/40'
  },
  black: {
    name: 'Swamp',
    bg: 'bg-gradient-to-br from-zinc-950 via-neutral-900 to-purple-950',
    bgSecondary: 'bg-gradient-to-br from-zinc-900/90 to-neutral-900/80',
    bgTertiary: 'bg-zinc-800/80',
    text: 'text-purple-100',
    textSecondary: 'text-purple-300',
    border: 'border-zinc-700/60',
    borderAccent: 'border-purple-500',
    accent: 'bg-gradient-to-r from-purple-700 via-violet-600 to-fuchsia-600 hover:from-purple-600 hover:via-violet-500 hover:to-fuchsia-500',
    ring: 'ring-purple-500',
    glow: 'shadow-purple-500/40'
  },
  white: {
    name: 'Plains',
    bg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
    bgSecondary: 'bg-gradient-to-br from-white/95 to-amber-50/90',
    bgTertiary: 'bg-amber-100/80',
    text: 'text-amber-950',
    textSecondary: 'text-amber-700',
    border: 'border-amber-300/60',
    borderAccent: 'border-yellow-500',
    accent: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-400 hover:from-amber-400 hover:via-yellow-300 hover:to-orange-300',
    ring: 'ring-yellow-500',
    glow: 'shadow-yellow-500/40'
  },

  // Special Multi-Color Themes
  boros: {
    name: 'Boros (RW)',
    bg: 'bg-gradient-to-br from-red-950 via-orange-900 to-amber-800',
    bgSecondary: 'bg-gradient-to-br from-red-900/80 to-amber-900/70',
    bgTertiary: 'bg-orange-800/70',
    text: 'text-amber-100',
    textSecondary: 'text-orange-200',
    border: 'border-orange-600/50',
    borderAccent: 'border-yellow-400',
    accent: 'bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 hover:from-red-400 hover:via-orange-300 hover:to-yellow-300',
    ring: 'ring-yellow-400',
    glow: 'shadow-orange-500/50'
  },
  dimir: {
    name: 'Dimir (UB)',
    bg: 'bg-gradient-to-br from-blue-950 via-indigo-950 to-zinc-950',
    bgSecondary: 'bg-gradient-to-br from-blue-900/80 to-zinc-900/70',
    bgTertiary: 'bg-indigo-900/70',
    text: 'text-blue-100',
    textSecondary: 'text-indigo-300',
    border: 'border-indigo-700/50',
    borderAccent: 'border-blue-400',
    accent: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500',
    ring: 'ring-indigo-400',
    glow: 'shadow-indigo-500/50'
  },
  simic: {
    name: 'Simic (GU)',
    bg: 'bg-gradient-to-br from-green-950 via-teal-900 to-cyan-950',
    bgSecondary: 'bg-gradient-to-br from-green-900/80 to-cyan-900/70',
    bgTertiary: 'bg-teal-800/70',
    text: 'text-cyan-100',
    textSecondary: 'text-teal-300',
    border: 'border-teal-600/50',
    borderAccent: 'border-cyan-400',
    accent: 'bg-gradient-to-r from-green-500 via-teal-400 to-cyan-400 hover:from-green-400 hover:via-teal-300 hover:to-cyan-300',
    ring: 'ring-cyan-400',
    glow: 'shadow-teal-500/50'
  },
  rakdos: {
    name: 'Rakdos (BR)',
    bg: 'bg-gradient-to-br from-red-950 via-rose-950 to-zinc-950',
    bgSecondary: 'bg-gradient-to-br from-red-900/80 to-zinc-900/70',
    bgTertiary: 'bg-rose-900/70',
    text: 'text-rose-100',
    textSecondary: 'text-red-300',
    border: 'border-rose-700/50',
    borderAccent: 'border-red-400',
    accent: 'bg-gradient-to-r from-red-600 via-rose-500 to-pink-500 hover:from-red-500 hover:via-rose-400 hover:to-pink-400',
    ring: 'ring-rose-400',
    glow: 'shadow-rose-500/50'
  },
  golgari: {
    name: 'Golgari (BG)',
    bg: 'bg-gradient-to-br from-green-950 via-lime-950 to-zinc-950',
    bgSecondary: 'bg-gradient-to-br from-green-900/80 to-zinc-900/70',
    bgTertiary: 'bg-lime-900/70',
    text: 'text-lime-100',
    textSecondary: 'text-green-300',
    border: 'border-lime-700/50',
    borderAccent: 'border-lime-400',
    accent: 'bg-gradient-to-r from-green-600 via-lime-500 to-emerald-500 hover:from-green-500 hover:via-lime-400 hover:to-emerald-400',
    ring: 'ring-lime-400',
    glow: 'shadow-lime-500/50'
  },

  // Special/Mythical Themes
  mystical: {
    name: 'Mystical',
    bg: 'bg-gradient-to-br from-purple-950 via-fuchsia-950 to-pink-950',
    bgSecondary: 'bg-gradient-to-br from-purple-900/80 to-fuchsia-900/70',
    bgTertiary: 'bg-fuchsia-800/70',
    text: 'text-pink-100',
    textSecondary: 'text-fuchsia-300',
    border: 'border-fuchsia-700/50',
    borderAccent: 'border-pink-400',
    accent: 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:from-purple-400 hover:via-fuchsia-400 hover:to-pink-400',
    ring: 'ring-pink-400',
    glow: 'shadow-fuchsia-500/50'
  },
  artifact: {
    name: 'Artifact',
    bg: 'bg-gradient-to-br from-slate-900 via-zinc-800 to-stone-900',
    bgSecondary: 'bg-gradient-to-br from-slate-800/90 to-zinc-800/80',
    bgTertiary: 'bg-slate-700/80',
    text: 'text-amber-100',
    textSecondary: 'text-amber-300',
    border: 'border-amber-700/50',
    borderAccent: 'border-amber-400',
    accent: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-400 hover:from-amber-400 hover:via-yellow-300 hover:to-orange-300',
    ring: 'ring-amber-400',
    glow: 'shadow-amber-500/50'
  },
  phyrexian: {
    name: 'Phyrexian',
    bg: 'bg-gradient-to-br from-neutral-950 via-gray-900 to-emerald-950',
    bgSecondary: 'bg-gradient-to-br from-neutral-900/90 to-gray-900/80',
    bgTertiary: 'bg-neutral-800/80',
    text: 'text-emerald-100',
    textSecondary: 'text-emerald-400',
    border: 'border-emerald-800/60',
    borderAccent: 'border-emerald-500',
    accent: 'bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 hover:from-emerald-500 hover:via-green-400 hover:to-teal-400',
    ring: 'ring-emerald-500',
    glow: 'shadow-emerald-500/50'
  },
  eldrazi: {
    name: 'Eldrazi',
    bg: 'bg-gradient-to-br from-purple-950 via-violet-950 to-slate-950',
    bgSecondary: 'bg-gradient-to-br from-purple-900/80 to-violet-950/70',
    bgTertiary: 'bg-violet-900/70',
    text: 'text-violet-100',
    textSecondary: 'text-purple-300',
    border: 'border-violet-700/50',
    borderAccent: 'border-violet-400',
    accent: 'bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 hover:from-violet-500 hover:via-purple-400 hover:to-fuchsia-400',
    ring: 'ring-violet-400',
    glow: 'shadow-violet-500/50'
  },
  multicolor: {
    name: '5-Color',
    bg: 'bg-gradient-to-br from-amber-900 via-orange-900 to-yellow-950',
    bgSecondary: 'bg-gradient-to-br from-amber-800/80 to-orange-900/70',
    bgTertiary: 'bg-orange-800/70',
    text: 'text-amber-100',
    textSecondary: 'text-yellow-300',
    border: 'border-yellow-600/50',
    borderAccent: 'border-yellow-400',
    accent: 'bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400 hover:from-amber-400 hover:via-orange-300 hover:to-yellow-300',
    ring: 'ring-yellow-400',
    glow: 'shadow-yellow-500/50'
  },

  // Bone/Rustic Theme from deck30
  bone: {
    name: 'Bone',
    bg: 'bg-gradient-to-br from-stone-950 via-amber-950 to-stone-900',
    bgSecondary: 'bg-gradient-to-br from-stone-900/90 to-amber-900/70',
    bgTertiary: 'bg-stone-800/80',
    text: 'text-amber-100',
    textSecondary: 'text-stone-400',
    border: 'border-stone-600/50',
    borderAccent: 'border-amber-600',
    accent: 'bg-gradient-to-r from-amber-700 via-stone-600 to-amber-600 hover:from-amber-600 hover:via-stone-500 hover:to-amber-500',
    ring: 'ring-amber-600',
    glow: 'shadow-amber-700/40'
  },

  // ===== SPECIAL ANIMATED THEMES =====

  dragon: {
    name: '🐉 Dragon Fire',
    bg: 'bg-gradient-to-br from-red-950 via-orange-950 to-yellow-950 animate-gradient',
    bgSecondary: 'bg-gradient-to-br from-red-900/90 to-orange-900/80',
    bgTertiary: 'bg-red-800/80',
    text: 'text-orange-100',
    textSecondary: 'text-yellow-300',
    border: 'border-orange-600/60',
    borderAccent: 'border-orange-400',
    accent: 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 hover:from-red-500 hover:via-orange-400 hover:to-yellow-400',
    ring: 'ring-orange-400',
    glow: 'shadow-orange-500/60',
    special: 'dragon'
  },

  planeswalker: {
    name: '✨ Planeswalker',
    bg: 'bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-950 animate-gradient',
    bgSecondary: 'bg-gradient-to-br from-violet-900/90 to-purple-900/80',
    bgTertiary: 'bg-purple-800/80',
    text: 'text-fuchsia-100',
    textSecondary: 'text-violet-300',
    border: 'border-purple-500/60',
    borderAccent: 'border-fuchsia-400',
    accent: 'bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 hover:from-violet-500 hover:via-purple-400 hover:to-fuchsia-400',
    ring: 'ring-fuchsia-400',
    glow: 'shadow-fuchsia-500/60',
    special: 'sparks'
  },

  neon: {
    name: '💜 Neon Cyberpunk',
    bg: 'bg-gradient-to-br from-slate-950 via-purple-950 to-cyan-950',
    bgSecondary: 'bg-black/80',
    bgTertiary: 'bg-slate-900/90',
    text: 'text-cyan-100',
    textSecondary: 'text-purple-400',
    border: 'border-cyan-500/60',
    borderAccent: 'border-pink-400',
    accent: 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400',
    ring: 'ring-pink-400',
    glow: 'shadow-pink-500/60',
    special: 'neon'
  },

  cosmic: {
    name: '🌌 Cosmic Void',
    bg: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950',
    bgSecondary: 'bg-black/70',
    bgTertiary: 'bg-indigo-950/80',
    text: 'text-indigo-100',
    textSecondary: 'text-violet-300',
    border: 'border-indigo-600/50',
    borderAccent: 'border-violet-400',
    accent: 'bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-500 hover:from-indigo-500 hover:via-violet-400 hover:to-purple-400',
    ring: 'ring-violet-400',
    glow: 'shadow-violet-500/50',
    special: 'stars'
  },

  goldMythic: {
    name: '🏆 Mythic Gold',
    bg: 'bg-gradient-to-br from-amber-950 via-yellow-900 to-orange-950 animate-gradient',
    bgSecondary: 'bg-gradient-to-br from-amber-900/90 to-yellow-900/80',
    bgTertiary: 'bg-yellow-800/80',
    text: 'text-yellow-100',
    textSecondary: 'text-amber-300',
    border: 'border-yellow-500/60',
    borderAccent: 'border-yellow-400',
    accent: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-400 hover:from-amber-400 hover:via-yellow-300 hover:to-orange-300',
    ring: 'ring-yellow-400',
    glow: 'shadow-yellow-500/60',
    special: 'mythic'
  },

  iceStorm: {
    name: '❄️ Ice Storm',
    bg: 'bg-gradient-to-br from-cyan-950 via-blue-900 to-slate-950',
    bgSecondary: 'bg-gradient-to-br from-cyan-900/90 to-blue-900/80',
    bgTertiary: 'bg-blue-800/80',
    text: 'text-cyan-100',
    textSecondary: 'text-blue-300',
    border: 'border-cyan-500/60',
    borderAccent: 'border-cyan-400',
    accent: 'bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-500 hover:from-cyan-500 hover:via-blue-400 hover:to-indigo-400',
    ring: 'ring-cyan-400',
    glow: 'shadow-cyan-500/60',
    special: 'snow'
  },

  bloodMoon: {
    name: '🌙 Blood Moon',
    bg: 'bg-gradient-to-br from-red-950 via-rose-950 to-neutral-950',
    bgSecondary: 'bg-gradient-to-br from-red-950/90 to-rose-950/80',
    bgTertiary: 'bg-rose-900/80',
    text: 'text-rose-100',
    textSecondary: 'text-red-400',
    border: 'border-red-700/60',
    borderAccent: 'border-red-500',
    accent: 'bg-gradient-to-r from-red-700 via-rose-600 to-pink-600 hover:from-red-600 hover:via-rose-500 hover:to-pink-500',
    ring: 'ring-red-500',
    glow: 'shadow-red-500/60',
    special: 'blood'
  },

  zendikar: {
    name: '🏔️ Zendikar',
    bg: 'bg-gradient-to-br from-orange-950 via-amber-900 to-stone-950',
    bgSecondary: 'bg-gradient-to-br from-orange-900/90 to-amber-900/80',
    bgTertiary: 'bg-amber-800/80',
    text: 'text-amber-100',
    textSecondary: 'text-orange-300',
    border: 'border-amber-600/60',
    borderAccent: 'border-orange-400',
    accent: 'bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 hover:from-orange-500 hover:via-amber-400 hover:to-yellow-400',
    ring: 'ring-orange-400',
    glow: 'shadow-orange-500/50'
  },

  innistrad: {
    name: '🦇 Innistrad',
    bg: 'bg-gradient-to-br from-slate-950 via-zinc-900 to-violet-950',
    bgSecondary: 'bg-gradient-to-br from-slate-900/90 to-zinc-900/80',
    bgTertiary: 'bg-zinc-800/80',
    text: 'text-slate-100',
    textSecondary: 'text-violet-300',
    border: 'border-violet-700/60',
    borderAccent: 'border-violet-500',
    accent: 'bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 hover:from-violet-600 hover:via-purple-500 hover:to-fuchsia-500',
    ring: 'ring-violet-500',
    glow: 'shadow-violet-500/50'
  },

  kamigawa: {
    name: '🌸 Kamigawa',
    bg: 'bg-gradient-to-br from-pink-950 via-rose-900 to-red-950',
    bgSecondary: 'bg-gradient-to-br from-pink-900/90 to-rose-900/80',
    bgTertiary: 'bg-rose-800/80',
    text: 'text-pink-100',
    textSecondary: 'text-rose-300',
    border: 'border-pink-600/60',
    borderAccent: 'border-pink-400',
    accent: 'bg-gradient-to-r from-pink-600 via-rose-500 to-red-500 hover:from-pink-500 hover:via-rose-400 hover:to-red-400',
    ring: 'ring-pink-400',
    glow: 'shadow-pink-500/50'
  }
}

export function saveTheme(themeName) {
  localStorage.setItem('mtg-theme', themeName)
}

export function loadTheme() {
  return localStorage.getItem('mtg-theme') || 'dark'
}
