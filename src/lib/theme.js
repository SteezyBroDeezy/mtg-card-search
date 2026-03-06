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
    red: {
      name: 'Red',
      bg: 'bg-red-950',
      bgSecondary: 'bg-red-900',
      bgTertiary: 'bg-red-800',
      text: 'text-white',
      textSecondary: 'text-red-300',
      border: 'border-red-800',
      accent: 'bg-red-600 hover:bg-red-500'
    },
    blue: {
      name: 'Blue',
      bg: 'bg-blue-950',
      bgSecondary: 'bg-blue-900',
      bgTertiary: 'bg-blue-800',
      text: 'text-white',
      textSecondary: 'text-blue-300',
      border: 'border-blue-800',
      accent: 'bg-blue-600 hover:bg-blue-500'
    },
    green: {
      name: 'Green',
      bg: 'bg-green-950',
      bgSecondary: 'bg-green-900',
      bgTertiary: 'bg-green-800',
      text: 'text-white',
      textSecondary: 'text-green-300',
      border: 'border-green-800',
      accent: 'bg-green-600 hover:bg-green-500'
    },
    purple: {
      name: 'Purple',
      bg: 'bg-purple-950',
      bgSecondary: 'bg-purple-900',
      bgTertiary: 'bg-purple-800',
      text: 'text-white',
      textSecondary: 'text-purple-300',
      border: 'border-purple-800',
      accent: 'bg-purple-600 hover:bg-purple-500'
    }
  }

  export function saveTheme(themeName) {
    localStorage.setItem('mtg-theme', themeName)
  }

  export function loadTheme() {
    return localStorage.getItem('mtg-theme') || 'dark'
  }