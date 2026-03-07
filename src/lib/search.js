// All available search filters with descriptions
export const SEARCH_FILTERS = [
  { prefix: 'c:', name: 'Color', description: 'Card colors', examples: ['c:red', 'c:blue', 'c:white', 'c:black', 'c:green', 'c:colorless'] },
  { prefix: 'id:', name: 'Color Identity', description: 'Commander color identity', examples: ['id:wubrg', 'id:bg', 'id:rg', 'id:mono'] },
  { prefix: 't:', name: 'Type', description: 'Card type', examples: ['t:creature', 't:instant', 't:sorcery', 't:enchantment', 't:artifact', 't:land', 't:planeswalker'] },
  { prefix: 'cmc', name: 'Mana Value', description: 'Converted mana cost', examples: ['cmc=3', 'cmc<2', 'cmc>=5', 'cmc<=4'] },
  { prefix: 'pow', name: 'Power', description: 'Creature power', examples: ['pow=4', 'pow>=5', 'pow<2'] },
  { prefix: 'tou', name: 'Toughness', description: 'Creature toughness', examples: ['tou=5', 'tou>=4', 'tou<=2'] },
  { prefix: 'loy', name: 'Loyalty', description: 'Planeswalker loyalty', examples: ['loy=4', 'loy>=5', 'loy<3'] },
  { prefix: 'r:', name: 'Rarity', description: 'Card rarity', examples: ['r:mythic', 'r:rare', 'r:uncommon', 'r:common'] },
  { prefix: 's:', name: 'Set', description: 'Set code', examples: ['s:neo', 's:mom', 's:lci', 's:mkm', 's:dsk'] },
  { prefix: 'o:', name: 'Oracle Text', description: 'Rules text', examples: ['o:draw', 'o:destroy', 'o:"enters the battlefield"', 'o:trample'] },
  { prefix: 'a:', name: 'Artist', description: 'Card artist', examples: ['a:magali', 'a:nielsen', 'a:guay'] },
  { prefix: 'k:', name: 'Keyword', description: 'Keyword abilities', examples: ['k:flying', 'k:deathtouch', 'k:lifelink', 'k:haste'] },
  { prefix: 'f:', name: 'Format', description: 'Format legality', examples: ['f:standard', 'f:modern', 'f:commander', 'f:pioneer', 'f:legacy', 'f:vintage', 'f:pauper'] },
  { prefix: 'usd', name: 'Price', description: 'USD price', examples: ['usd>10', 'usd<1', 'usd>=5', 'usd<=20'] },
  { prefix: 'produces:', name: 'Produces Mana', description: 'Mana production', examples: ['produces:g', 'produces:any', 'produces:wu'] },
  { prefix: 'year', name: 'Year', description: 'Release year', examples: ['year=2024', 'year>=2020', 'year<2010'] },
  { prefix: 'is:', name: 'Properties', description: 'Special properties', examples: ['is:commander', 'is:dfc', 'is:reserved', 'is:spell', 'is:permanent'] },
  { prefix: 'edhrec', name: 'EDHREC Rank', description: 'Commander popularity', examples: ['edhrec<100', 'edhrec<=500', 'edhrec<1000'] }
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
  'Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Land', 'Planeswalker', 'Battle', 'Legendary'
]

// Rarity options for toggle UI
export const RARITY_OPTIONS = [
  { code: 'mythic', name: 'Mythic' },
  { code: 'rare', name: 'Rare' },
  { code: 'uncommon', name: 'Uncommon' },
  { code: 'common', name: 'Common' }
]

// Format options for toggle UI
export const FORMAT_OPTIONS = [
  { code: 'standard', name: 'Standard' },
  { code: 'pioneer', name: 'Pioneer' },
  { code: 'modern', name: 'Modern' },
  { code: 'legacy', name: 'Legacy' },
  { code: 'vintage', name: 'Vintage' },
  { code: 'commander', name: 'Commander' },
  { code: 'pauper', name: 'Pauper' },
  { code: 'historic', name: 'Historic' },
  { code: 'brawl', name: 'Brawl' }
]

// Keyword options for toggle UI
export const KEYWORD_OPTIONS = [
  'Flying', 'Trample', 'Haste', 'Vigilance', 'Deathtouch', 'Lifelink',
  'First Strike', 'Double Strike', 'Menace', 'Reach', 'Flash', 'Hexproof',
  'Indestructible', 'Ward', 'Defender', 'Prowess', 'Convoke', 'Toxic'
]

// Property options for toggle UI
export const PROPERTY_OPTIONS = [
  { code: 'commander', name: 'Commander', description: 'Can be a commander' },
  { code: 'dfc', name: 'Double-Faced', description: 'Transform/Modal cards' },
  { code: 'reserved', name: 'Reserved List', description: 'On the reserved list' },
  { code: 'spell', name: 'Spell', description: 'Non-land cards' },
  { code: 'permanent', name: 'Permanent', description: 'Stays on battlefield' }
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
    // Color identity filter: id:wubrg, id:bg, etc.
    else if (lower.startsWith('id:')) {
      const identity = lower.slice(3)
      filters.push({ type: 'color_identity', value: identity })
    }
    // Type filter: t:creature, t:instant, etc.
    else if (lower.startsWith('t:')) {
      const type = lower.slice(2)
      filters.push({ type: 'type', value: type })
    }
    // CMC filter: cmc:3, cmc<=2, cmc>=4
    else if (lower.startsWith('cmc')) {
      const match = lower.match(/cmc([<>=!]*)(\d+)/)
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
      const match = lower.match(/pow([<>=!]*)(\d+|\*)/)
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
      const match = lower.match(/tou([<>=!]*)(\d+|\*)/)
      if (match) {
        filters.push({
          type: 'toughness',
          operator: match[1] || '=',
          value: match[2]
        })
      }
    }
    // Loyalty filter: loy=4, loy>=5
    else if (lower.startsWith('loy')) {
      const match = lower.match(/loy([<>=!]*)(\d+)/)
      if (match) {
        filters.push({
          type: 'loyalty',
          operator: match[1] || '=',
          value: match[2]
        })
      }
    }
    // Price filter: usd>10, usd<1, usd>=5
    else if (lower.startsWith('usd')) {
      const match = lower.match(/usd([<>=!]*)(\d+\.?\d*)/)
      if (match) {
        filters.push({
          type: 'price',
          operator: match[1] || '=',
          value: parseFloat(match[2])
        })
      }
    }
    // EDHREC rank filter: edhrec<100, edhrec<=500
    else if (lower.startsWith('edhrec')) {
      const match = lower.match(/edhrec([<>=!]*)(\d+)/)
      if (match) {
        filters.push({
          type: 'edhrec',
          operator: match[1] || '<=',
          value: parseInt(match[2])
        })
      }
    }
    // Year filter: year=2024, year>=2020
    else if (lower.startsWith('year')) {
      const match = lower.match(/year([<>=!]*)(\d{4})/)
      if (match) {
        filters.push({
          type: 'year',
          operator: match[1] || '=',
          value: parseInt(match[2])
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
    // Format filter: f:modern, f:commander, etc.
    else if (lower.startsWith('f:') || lower.startsWith('format:')) {
      const format = lower.includes(':') ? lower.split(':')[1] : ''
      filters.push({ type: 'format', value: format })
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
    // Produces mana filter: produces:g, produces:any
    else if (lower.startsWith('produces:')) {
      const mana = lower.slice(9)
      filters.push({ type: 'produces', value: mana })
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

  const num = parseFloat(actual)
  if (isNaN(num)) return false

  const targetNum = parseFloat(target)
  if (isNaN(targetNum)) return false

  switch (operator) {
    case '<': return num < targetNum
    case '<=': return num <= targetNum
    case '>': return num > targetNum
    case '>=': return num >= targetNum
    case '!=': return num !== targetNum
    default: return num === targetNum
  }
}

function parseColorIdentity(input) {
  // Handle special cases
  if (input === 'mono') return { type: 'mono' }
  if (input === 'colorless' || input === 'c') return { type: 'exact', colors: [] }

  // Parse color codes like 'wubrg', 'bg', 'rg'
  const colorMap = { 'w': 'W', 'u': 'U', 'b': 'B', 'r': 'R', 'g': 'G' }
  const colors = []
  for (const char of input.toLowerCase()) {
    if (colorMap[char]) {
      colors.push(colorMap[char])
    }
  }
  return { type: 'within', colors }
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

      case 'color_identity':
        const idSpec = parseColorIdentity(filter.value)
        if (idSpec.type === 'mono') {
          // Mono-colored: exactly 1 color in identity
          if (!card.color_identity || card.color_identity.length !== 1) return false
        } else if (idSpec.type === 'exact') {
          // Colorless: no colors in identity
          if (card.color_identity && card.color_identity.length > 0) return false
        } else {
          // Within these colors (for commander deck building)
          if (card.color_identity) {
            for (const c of card.color_identity) {
              if (!idSpec.colors.includes(c)) return false
            }
          }
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

      case 'loyalty':
        if (!card.loyalty) return false
        if (!compareValue(card.loyalty, filter.operator, filter.value)) return false
        break

      case 'price':
        const price = parseFloat(card.prices?.usd || 0)
        if (!compareValue(price.toString(), filter.operator, filter.value.toString())) return false
        break

      case 'edhrec':
        if (!card.edhrec_rank) return false
        if (!compareValue(card.edhrec_rank.toString(), filter.operator, filter.value.toString())) return false
        break

      case 'year':
        if (!card.released_at) return false
        const cardYear = parseInt(card.released_at.substring(0, 4))
        if (!compareValue(cardYear.toString(), filter.operator, filter.value.toString())) return false
        break

      case 'rarity':
        if (card.rarity !== filter.value) return false
        break

      case 'set':
        if (card.set.toLowerCase() !== filter.value) return false
        break

      case 'format':
        if (!card.legalities || card.legalities[filter.value] !== 'legal') return false
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

      case 'produces':
        if (!card.produced_mana || card.produced_mana.length === 0) return false
        if (filter.value === 'any') {
          // Just needs to produce something
          if (card.produced_mana.length === 0) return false
        } else {
          // Check specific colors
          const colorMap = { 'w': 'W', 'u': 'U', 'b': 'B', 'r': 'R', 'g': 'G', 'c': 'C' }
          for (const char of filter.value.toLowerCase()) {
            const color = colorMap[char]
            if (color && !card.produced_mana.includes(color)) return false
          }
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
        } else if (filter.value === 'reserved') {
          if (!card.reserved) return false
        } else if (filter.value === 'spell') {
          if (card.type_line.toLowerCase().includes('land')) return false
        } else if (filter.value === 'permanent') {
          const isInstant = card.type_line.toLowerCase().includes('instant')
          const isSorcery = card.type_line.toLowerCase().includes('sorcery')
          if (isInstant || isSorcery) return false
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
      case 'color_identity':
        parts.push(`id:${filter.value}`)
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
      case 'loyalty':
        parts.push(`loy${filter.operator}${filter.value}`)
        break
      case 'price':
        parts.push(`usd${filter.operator}${filter.value}`)
        break
      case 'edhrec':
        parts.push(`edhrec${filter.operator}${filter.value}`)
        break
      case 'year':
        parts.push(`year${filter.operator}${filter.value}`)
        break
      case 'rarity':
        parts.push(`r:${filter.value}`)
        break
      case 'set':
        parts.push(`s:${filter.value}`)
        break
      case 'format':
        parts.push(`f:${filter.value}`)
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
      case 'produces':
        parts.push(`produces:${filter.value}`)
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
