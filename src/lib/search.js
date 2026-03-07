// All available search filters with descriptions
export const SEARCH_FILTERS = [
  { prefix: 'c:', name: 'Color', description: 'Card colors', examples: ['c:red', 'c:blue', 'c:white', 'c:black', 'c:green', 'c:colorless'] },
  { prefix: 't:', name: 'Type', description: 'Card type', examples: ['t:creature', 't:instant', 't:sorcery', 't:enchantment', 't:artifact', 't:land', 't:planeswalker'] },
  { prefix: 'cmc', name: 'Mana Value', description: 'Converted mana cost', examples: ['cmc=3', 'cmc<2', 'cmc>=5', 'cmc<=4'] },
  { prefix: 'r:', name: 'Rarity', description: 'Card rarity', examples: ['r:mythic', 'r:rare', 'r:uncommon', 'r:common'] },
  { prefix: 's:', name: 'Set', description: 'Set code', examples: ['s:neo', 's:mom', 's:lci', 's:mkm'] },
  { prefix: 'o:', name: 'Oracle Text', description: 'Rules text', examples: ['o:draw', 'o:destroy', 'o:flying', 'o:trample'] },
  { prefix: 'pow', name: 'Power', description: 'Creature power', examples: ['pow=4', 'pow>=5', 'pow<2'] },
  { prefix: 'tou', name: 'Toughness', description: 'Creature toughness', examples: ['tou=5', 'tou>=4', 'tou<=2'] },
  { prefix: 'a:', name: 'Artist', description: 'Card artist', examples: ['a:magali', 'a:nielsen', 'a:guay'] },
  { prefix: 'k:', name: 'Keyword', description: 'Keyword abilities', examples: ['k:flying', 'k:deathtouch', 'k:lifelink', 'k:haste'] },
  { prefix: 'is:', name: 'Card Properties', description: 'Special properties', examples: ['is:commander', 'is:dfc', 'is:spell'] }
]

// Color options for toggle UI
export const COLOR_OPTIONS = [
  { code: 'W', name: 'White', symbol: 'W' },
  { code: 'U', name: 'Blue', symbol: 'U' },
  { code: 'B', name: 'Black', symbol: 'B' },
  { code: 'R', name: 'Red', symbol: 'R' },
  { code: 'G', name: 'Green', symbol: 'G' },
  { code: 'C', name: 'Colorless', symbol: 'C' }
]

// Type options for toggle UI
export const TYPE_OPTIONS = [
  'Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Land', 'Planeswalker', 'Battle'
]

// Rarity options for toggle UI
export const RARITY_OPTIONS = [
  { code: 'mythic', name: 'Mythic' },
  { code: 'rare', name: 'Rare' },
  { code: 'uncommon', name: 'Uncommon' },
  { code: 'common', name: 'Common' }
]

// Keyword options for toggle UI
export const KEYWORD_OPTIONS = [
  'Flying', 'Trample', 'Haste', 'Vigilance', 'Deathtouch', 'Lifelink',
  'First Strike', 'Double Strike', 'Menace', 'Reach', 'Flash', 'Hexproof',
  'Indestructible', 'Ward', 'Defender'
]

export function parseSearch(query) {
  const filters = []
  let nameSearch = ''

  // Split by spaces, but keep quoted strings together
  const parts = query.match(/(?:[^\s"]+|"[^"]*")+/g) || []

  for (const part of parts) {
    const lower = part.toLowerCase()

    // Color filter: c:red, c:blue, etc.
    if (lower.startsWith('c:')) {
      const color = lower.slice(2)
      const colorMap = {
        'white': 'W', 'w': 'W',
        'blue': 'U', 'u': 'U',
        'black': 'B', 'b': 'B',
        'red': 'R', 'r': 'R',
        'green': 'G', 'g': 'G',
        'colorless': 'C', 'c': 'C'
      }
      if (colorMap[color]) {
        filters.push({ type: 'color', value: colorMap[color] })
      }
    }
    // Type filter: t:creature, t:instant, etc.
    else if (lower.startsWith('t:')) {
      const type = lower.slice(2)
      filters.push({ type: 'type', value: type })
    }
    // CMC filter: cmc:3, cmc<=2, cmc>=4
    else if (lower.startsWith('cmc')) {
      const match = lower.match(/cmc([<>=]*)(\d+)/)
      if (match) {
        filters.push({
          type: 'cmc',
          operator: match[1] || '=',
          value: parseInt(match[2])
        })
      }
    }
    // Power filter: pow=4, pow>=5, pow<2
    else if (lower.startsWith('pow')) {
      const match = lower.match(/pow([<>=]*)(\d+|\*)/)
      if (match) {
        filters.push({
          type: 'power',
          operator: match[1] || '=',
          value: match[2]
        })
      }
    }
    // Toughness filter: tou=5, tou>=4, tou<=2
    else if (lower.startsWith('tou')) {
      const match = lower.match(/tou([<>=]*)(\d+|\*)/)
      if (match) {
        filters.push({
          type: 'toughness',
          operator: match[1] || '=',
          value: match[2]
        })
      }
    }
    // Rarity filter: r:mythic, r:rare, etc.
    else if (lower.startsWith('r:')) {
      const rarity = lower.slice(2)
      filters.push({ type: 'rarity', value: rarity })
    }
    // Set filter: s:dom, s:neo, etc.
    else if (lower.startsWith('s:')) {
      const set = lower.slice(2)
      filters.push({ type: 'set', value: set })
    }
    // Oracle text filter: o:draw, o:destroy, etc.
    else if (lower.startsWith('o:')) {
      const text = lower.slice(2).replace(/"/g, '')
      filters.push({ type: 'oracle', value: text })
    }
    // Artist filter: a:magali, a:nielsen, etc.
    else if (lower.startsWith('a:')) {
      const artist = lower.slice(2).replace(/"/g, '')
      filters.push({ type: 'artist', value: artist })
    }
    // Keyword filter: k:flying, k:deathtouch, etc.
    else if (lower.startsWith('k:')) {
      const keyword = lower.slice(2).replace(/"/g, '')
      filters.push({ type: 'keyword', value: keyword })
    }
    // Special properties: is:commander, is:dfc, etc.
    else if (lower.startsWith('is:')) {
      const prop = lower.slice(3)
      filters.push({ type: 'is', value: prop })
    }
    // Otherwise it's a name search
    else {
      if (nameSearch) nameSearch += ' '
      nameSearch += part.replace(/"/g, '')
    }
  }

  return { filters, nameSearch }
}

function compareValue(actual, operator, target) {
  // Handle * power/toughness
  if (actual === '*') {
    return target === '*'
  }

  const num = parseInt(actual)
  if (isNaN(num)) return false

  const targetNum = parseInt(target)
  if (isNaN(targetNum)) return false

  switch (operator) {
    case '<': return num < targetNum
    case '<=': return num <= targetNum
    case '>': return num > targetNum
    case '>=': return num >= targetNum
    default: return num === targetNum
  }
}

export function matchesFilters(card, filters, nameSearch) {
  // Check name
  if (nameSearch) {
    if (!card.name.toLowerCase().includes(nameSearch.toLowerCase())) {
      return false
    }
  }

  // Check each filter
  for (const filter of filters) {
    switch (filter.type) {
      case 'color':
        if (filter.value === 'C') {
          // Colorless: no colors
          if (card.colors && card.colors.length > 0) return false
        } else {
          // Has specific color
          if (!card.colors || !card.colors.includes(filter.value)) return false
        }
        break

      case 'type':
        if (!card.type_line.toLowerCase().includes(filter.value)) return false
        break

      case 'cmc':
        const cmc = card.cmc || 0
        if (!compareValue(cmc.toString(), filter.operator, filter.value.toString())) return false
        break

      case 'power':
        if (!card.power) return false
        if (!compareValue(card.power, filter.operator, filter.value)) return false
        break

      case 'toughness':
        if (!card.toughness) return false
        if (!compareValue(card.toughness, filter.operator, filter.value)) return false
        break

      case 'rarity':
        if (card.rarity !== filter.value) return false
        break

      case 'set':
        if (card.set.toLowerCase() !== filter.value) return false
        break

      case 'oracle':
        if (!card.oracle_text.toLowerCase().includes(filter.value)) return false
        break

      case 'artist':
        if (!card.artist || !card.artist.toLowerCase().includes(filter.value)) return false
        break

      case 'keyword':
        if (!card.keywords || !card.keywords.some(k => k.toLowerCase().includes(filter.value))) {
          // Also check oracle text for keyword
          if (!card.oracle_text.toLowerCase().includes(filter.value)) return false
        }
        break

      case 'is':
        if (filter.value === 'dfc') {
          if (!card.card_faces) return false
        } else if (filter.value === 'commander') {
          // Check if legendary creature or has "can be your commander"
          const isLegendaryCreature = card.type_line.toLowerCase().includes('legendary') &&
                                       card.type_line.toLowerCase().includes('creature')
          const canBeCommander = card.oracle_text.toLowerCase().includes('can be your commander')
          if (!isLegendaryCreature && !canBeCommander) return false
        } else if (filter.value === 'spell') {
          if (card.type_line.toLowerCase().includes('land')) return false
        }
        break
    }
  }

  return true
}

// Helper to build a search query from filter objects
export function buildSearchQuery(filters) {
  const parts = []

  for (const filter of filters) {
    switch (filter.type) {
      case 'color':
        const colorNames = { W: 'white', U: 'blue', B: 'black', R: 'red', G: 'green', C: 'colorless' }
        parts.push(`c:${colorNames[filter.value] || filter.value}`)
        break
      case 'type':
        parts.push(`t:${filter.value}`)
        break
      case 'cmc':
        parts.push(`cmc${filter.operator}${filter.value}`)
        break
      case 'power':
        parts.push(`pow${filter.operator}${filter.value}`)
        break
      case 'toughness':
        parts.push(`tou${filter.operator}${filter.value}`)
        break
      case 'rarity':
        parts.push(`r:${filter.value}`)
        break
      case 'set':
        parts.push(`s:${filter.value}`)
        break
      case 'oracle':
        parts.push(`o:${filter.value}`)
        break
      case 'artist':
        parts.push(`a:${filter.value}`)
        break
      case 'keyword':
        parts.push(`k:${filter.value}`)
        break
      case 'is':
        parts.push(`is:${filter.value}`)
        break
      case 'name':
        parts.push(filter.value)
        break
    }
  }

  return parts.join(' ')
}
