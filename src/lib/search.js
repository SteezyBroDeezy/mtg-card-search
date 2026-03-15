// All available search filters with descriptions
// Prefix with - to negate any filter (e.g., -c:green excludes green cards)
export const SEARCH_FILTERS = [
  { prefix: 'c:', name: 'Color', description: 'Card colors (c: contains, c= exact). Use -c: to exclude.', examples: ['c:red', 'c:blue', 'c=redgreen', 'c=mono', 'c:colorless', '-c:green'] },
  { prefix: 'id:', name: 'Color Identity', description: 'Commander color identity', examples: ['id:wubrg', 'id:bg', 'id:rg', 'id:mono'] },
  { prefix: 't:', name: 'Type', description: 'Card type. Use -t: to exclude.', examples: ['t:creature', 't:instant', 't:sorcery', '-t:land', '-t:creature'] },
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
  { prefix: 'edhrec', name: 'EDHREC Rank', description: 'Commander popularity', examples: ['edhrec<100', 'edhrec<=500', 'edhrec<1000'] },
  { prefix: 'otag:', name: 'Oracle Tags', description: 'Scryfall oracle tags (requires API)', examples: ['otag:ramp', 'otag:burn', 'otag:draw', 'otag:removal', 'otag:token-producer'] }
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

// Patterns that require Scryfall API (not supported in local DB)
const SCRYFALL_ONLY_PATTERNS = [
  /^otag:/i,           // Oracle tags
  /^art:/i,            // Art tags
  /^atag:/i,           // Art tags (alt)
  /^function:/i,       // Function tags
  /^oracletag:/i,      // Full oracle tag
  /^c[<>=]+\d/i,       // Color count (c>=2, c<3)
  /^colors[<>=]/i,     // Colors count
  /^ci[<>=]/i,         // Color identity count
  /^devotion:/i,       // Devotion
  /^manavalue[<>=]/i,  // Alternate CMC syntax
  /^mv[<>=]/i,         // Alternate CMC syntax
  /^in:/i,             // In collection
  /^cube:/i,           // In cube
  /^game:/i,           // Game format
  /^lang:/i,           // Language
  /^new:/i,            // New cards
  /^order:/i,          // Ordering
  /^prefer:/i,         // Preferences
  /^unique:/i,         // Unique modes
  /^include:/i,        // Include extras
  /^border:/i,         // Border type
  /^frame:/i,          // Frame type
  /^stamp:/i,          // Security stamp
  /^watermark:/i,      // Watermark
  /^illustration:/i,   // Illustration ID
  /^flavor:/i,         // Flavor text
  /^lore:/i,           // Lore text
  /^is:reprint/i,      // Is reprint
  /^is:booster/i,      // In boosters
  /^is:promo/i,        // Promo cards
  /^is:digital/i,      // Digital only
  /^is:firstprint/i,   // First printing
  /^is:funny/i,        // Un-cards
  /^is:token$/i,       // Tokens
  /^is:fetchland/i,    // Fetchlands
  /^is:dual/i,         // Dual lands
  /^is:shockland/i,    // Shocklands
  /^not:/i,            // Not filter
  /^date[<>=]/i,       // Date filter
  /^usd_foil/i,        // Foil price
  /^eur[<>=]/i,        // EUR price
  /^tix[<>=]/i,        // MTGO tickets
]

export function parseSearch(query) {
  const filters = []
  let nameSearch = ''
  let requiresScryfall = false

  // Check if entire query contains Scryfall-only patterns
  for (const pattern of SCRYFALL_ONLY_PATTERNS) {
    if (pattern.test(query)) {
      requiresScryfall = true
      break
    }
  }

  // Split by spaces, but keep quoted strings together
  const parts = query.match(/(?:[^\s"]+|"[^"]*")+/g) || []

  for (const part of parts) {
    // Check for negation prefix
    const isNegated = part.startsWith('-')
    const cleanPart = isNegated ? part.slice(1) : part
    const lower = cleanPart.toLowerCase()

    // Oracle tag filter: otag:burn, otag:ramp - requires Scryfall API
    if (lower.startsWith('otag:')) {
      const tag = lower.slice(5)
      filters.push({ type: 'otag', value: tag, negated: isNegated })
      requiresScryfall = true
    }
    // Color filter: c:red (contains), c=red (exact), c=redgreen (exact multicolor)
    else if (lower.startsWith('c:') || lower.startsWith('c=')) {
      const isExact = lower.startsWith('c=')
      const colorStr = lower.slice(2)
      const colorMap = {
        'white': 'W', 'w': 'W',
        'blue': 'U', 'u': 'U',
        'black': 'B', 'b': 'B',
        'red': 'R', 'r': 'R',
        'green': 'G', 'g': 'G',
        'colorless': 'C', 'c': 'C'
      }

      if (isExact) {
        // Parse exact colors - could be "redgreen", "mono", or single color names
        if (colorStr === 'mono') {
          filters.push({ type: 'color_exact', value: 'mono', negated: isNegated })
        } else if (colorStr === 'colorless') {
          filters.push({ type: 'color_exact', value: [], negated: isNegated })
        } else {
          // Parse combined color string like "redgreen" or "whiteblue"
          const colors = []
          let remaining = colorStr

          // Try to match full color names first
          const colorNames = ['white', 'blue', 'black', 'red', 'green', 'colorless']
          for (const name of colorNames) {
            while (remaining.includes(name)) {
              remaining = remaining.replace(name, '')
              if (colorMap[name]) colors.push(colorMap[name])
            }
          }

          // Then match single letters
          for (const char of remaining) {
            if (colorMap[char] && !colors.includes(colorMap[char])) {
              colors.push(colorMap[char])
            }
          }

          filters.push({ type: 'color_exact', value: colors, negated: isNegated })
        }
      } else {
        // Contains color
        if (colorMap[colorStr]) {
          filters.push({ type: 'color', value: colorMap[colorStr], negated: isNegated })
        }
      }
    }
    // Color identity filter: id:wubrg, id:bg, etc.
    else if (lower.startsWith('id:')) {
      const identity = lower.slice(3)
      filters.push({ type: 'color_identity', value: identity, negated: isNegated })
    }
    // Type filter: t:creature, t:instant, etc.
    else if (lower.startsWith('t:')) {
      const type = lower.slice(2)
      filters.push({ type: 'type', value: type, negated: isNegated })
    }
    // CMC filter: cmc:3, cmc<=2, cmc>=4
    else if (lower.startsWith('cmc')) {
      const match = lower.match(/cmc([<>=!]*)(\d+)/)
      if (match) {
        filters.push({
          type: 'cmc',
          operator: match[1] || '=',
          value: parseInt(match[2]),
          negated: isNegated
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
          value: match[2],
          negated: isNegated
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
          value: match[2],
          negated: isNegated
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
          value: match[2],
          negated: isNegated
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
          value: parseFloat(match[2]),
          negated: isNegated
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
          value: parseInt(match[2]),
          negated: isNegated
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
          value: parseInt(match[2]),
          negated: isNegated
        })
      }
    }
    // Rarity filter: r:mythic, r:rare, etc.
    else if (lower.startsWith('r:')) {
      const rarity = lower.slice(2)
      filters.push({ type: 'rarity', value: rarity, negated: isNegated })
    }
    // Set filter: s:dom, s:neo, etc.
    else if (lower.startsWith('s:')) {
      const set = lower.slice(2)
      filters.push({ type: 'set', value: set, negated: isNegated })
    }
    // Format filter: f:modern, f:commander, etc.
    else if (lower.startsWith('f:') || lower.startsWith('format:')) {
      const format = lower.includes(':') ? lower.split(':')[1] : ''
      filters.push({ type: 'format', value: format, negated: isNegated })
    }
    // Oracle text filter: o:draw, o:destroy, etc.
    else if (lower.startsWith('o:')) {
      const text = lower.slice(2).replace(/"/g, '')
      filters.push({ type: 'oracle', value: text, negated: isNegated })
    }
    // Artist filter: a:magali, a:nielsen, etc.
    else if (lower.startsWith('a:')) {
      const artist = lower.slice(2).replace(/"/g, '')
      filters.push({ type: 'artist', value: artist, negated: isNegated })
    }
    // Keyword filter: k:flying, k:deathtouch, etc.
    else if (lower.startsWith('k:')) {
      const keyword = lower.slice(2).replace(/"/g, '')
      filters.push({ type: 'keyword', value: keyword, negated: isNegated })
    }
    // Produces mana filter: produces:g, produces:any
    else if (lower.startsWith('produces:')) {
      const mana = lower.slice(9)
      filters.push({ type: 'produces', value: mana, negated: isNegated })
    }
    // Special properties: is:commander, is:dfc, etc.
    else if (lower.startsWith('is:')) {
      const prop = lower.slice(3)
      filters.push({ type: 'is', value: prop, negated: isNegated })
    }
    // Otherwise it's a name search (negation doesn't apply to name search)
    else {
      if (nameSearch) nameSearch += ' '
      nameSearch += cleanPart.replace(/"/g, '')
    }
  }

  return { filters, nameSearch, requiresScryfall }
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

// Helper to check a single filter condition (returns true if card matches)
function checkFilterCondition(card, filter) {
  switch (filter.type) {
    case 'color':
      if (filter.value === 'C') {
        // Colorless: no colors
        return !(card.colors && card.colors.length > 0)
      } else {
        // Has specific color
        return card.colors && card.colors.includes(filter.value)
      }

    case 'color_exact':
      // Exact color match
      if (filter.value === 'mono') {
        // Mono-colored: exactly 1 color
        return card.colors && card.colors.length === 1
      } else if (Array.isArray(filter.value)) {
        if (filter.value.length === 0) {
          // Colorless: no colors
          return !(card.colors && card.colors.length > 0)
        } else {
          // Exact color match: card must have exactly these colors
          const cardColors = card.colors || []
          if (cardColors.length !== filter.value.length) return false
          // Check all required colors are present
          for (const c of filter.value) {
            if (!cardColors.includes(c)) return false
          }
          // Check no extra colors
          for (const c of cardColors) {
            if (!filter.value.includes(c)) return false
          }
          return true
        }
      }
      return false

    case 'color_identity':
      const idSpec = parseColorIdentity(filter.value)
      if (idSpec.type === 'mono') {
        // Mono-colored: exactly 1 color in identity
        return card.color_identity && card.color_identity.length === 1
      } else if (idSpec.type === 'exact') {
        // Colorless: no colors in identity
        return !(card.color_identity && card.color_identity.length > 0)
      } else {
        // Within these colors (for commander deck building)
        if (card.color_identity) {
          for (const c of card.color_identity) {
            if (!idSpec.colors.includes(c)) return false
          }
        }
        return true
      }

    case 'type':
      return card.type_line && card.type_line.toLowerCase().includes(filter.value)

    case 'cmc':
      const cmc = card.cmc || 0
      return compareValue(cmc.toString(), filter.operator, filter.value.toString())

    case 'power':
      if (!card.power) return false
      return compareValue(card.power, filter.operator, filter.value)

    case 'toughness':
      if (!card.toughness) return false
      return compareValue(card.toughness, filter.operator, filter.value)

    case 'loyalty':
      if (!card.loyalty) return false
      return compareValue(card.loyalty, filter.operator, filter.value)

    case 'price':
      const price = parseFloat(card.prices?.usd || 0)
      return compareValue(price.toString(), filter.operator, filter.value.toString())

    case 'edhrec':
      if (!card.edhrec_rank) return false
      return compareValue(card.edhrec_rank.toString(), filter.operator, filter.value.toString())

    case 'year':
      if (!card.released_at) return false
      const cardYear = parseInt(card.released_at.substring(0, 4))
      return compareValue(cardYear.toString(), filter.operator, filter.value.toString())

    case 'rarity':
      return card.rarity === filter.value

    case 'set':
      return card.set && card.set.toLowerCase() === filter.value

    case 'format':
      return card.legalities && card.legalities[filter.value] === 'legal'

    case 'oracle':
      return card.oracle_text && card.oracle_text.toLowerCase().includes(filter.value)

    case 'artist':
      return card.artist && card.artist.toLowerCase().includes(filter.value)

    case 'keyword':
      if (card.keywords && card.keywords.some(k => k.toLowerCase().includes(filter.value))) {
        return true
      }
      // Also check oracle text for keyword
      return card.oracle_text && card.oracle_text.toLowerCase().includes(filter.value)

    case 'produces':
      if (!card.produced_mana || card.produced_mana.length === 0) return false
      if (filter.value === 'any') {
        // Just needs to produce something
        return card.produced_mana.length > 0
      } else {
        // Check specific colors
        const colorMap = { 'w': 'W', 'u': 'U', 'b': 'B', 'r': 'R', 'g': 'G', 'c': 'C' }
        for (const char of filter.value.toLowerCase()) {
          const color = colorMap[char]
          if (color && !card.produced_mana.includes(color)) return false
        }
        return true
      }

    case 'is':
      if (filter.value === 'dfc') {
        return !!card.card_faces
      } else if (filter.value === 'commander') {
        // Check if legendary creature or has "can be your commander"
        const isLegendaryCreature = card.type_line?.toLowerCase().includes('legendary') &&
                                     card.type_line?.toLowerCase().includes('creature')
        const canBeCommander = card.oracle_text?.toLowerCase().includes('can be your commander')
        return isLegendaryCreature || canBeCommander
      } else if (filter.value === 'reserved') {
        return !!card.reserved
      } else if (filter.value === 'spell') {
        return !card.type_line?.toLowerCase().includes('land')
      } else if (filter.value === 'permanent') {
        const isInstant = card.type_line?.toLowerCase().includes('instant')
        const isSorcery = card.type_line?.toLowerCase().includes('sorcery')
        return !(isInstant || isSorcery)
      }
      return true

    case 'otag':
      // otag filters can't be processed locally - they require Scryfall API
      // This function is for local filtering only, so we skip otag
      return true

    default:
      return true
  }
}

export function matchesFilters(card, filters, nameSearch) {
  // Check name
  if (nameSearch) {
    if (!card.name.toLowerCase().includes(nameSearch.toLowerCase())) {
      return false
    }
  }

  // Check each filter, respecting negation
  for (const filter of filters) {
    const matches = checkFilterCondition(card, filter)
    // If negated, we want the opposite result
    const finalResult = filter.negated ? !matches : matches
    if (!finalResult) return false
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
