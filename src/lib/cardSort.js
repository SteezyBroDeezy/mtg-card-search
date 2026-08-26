// Shared card-sort utilities used by the main search results and the saved
// lists view. Keep both surfaces in sync by adding new options here.

// What search results are sorted by until you choose otherwise.
export const DEFAULT_SORT = 'price-desc'

export const SORT_OPTIONS = [
  { value: 'default', label: 'Unsorted (as returned)' },
  { value: 'name-asc', label: 'Name A → Z' },
  { value: 'name-desc', label: 'Name Z → A' },
  { value: 'price-desc', label: 'Price (high → low)' },
  { value: 'price-asc', label: 'Price (low → high)' },
  { value: 'cmc-asc', label: 'Mana value (low → high)' },
  { value: 'cmc-desc', label: 'Mana value (high → low)' },
  { value: 'color-wubrg', label: 'Color (WUBRG)' },
  { value: 'rarity', label: 'Rarity (mythic → common)' },
  { value: 'type', label: 'Card type' },
]

// Lists carry an addedAt timestamp that search results don't, so they get
// two extra options on top of the shared set.
export const LIST_SORT_OPTIONS = [
  ...SORT_OPTIONS,
  { value: 'added-desc', label: 'Date added (newest first)' },
  { value: 'added-asc', label: 'Date added (oldest first)' },
]

const RARITY_RANK = { mythic: 0, rare: 1, uncommon: 2, common: 3, special: 4, bonus: 5 }

// Rough "deck list" ordering: the types people group a list by, most
// commonly first. Matched against type_line, so 'Artifact Creature' lands
// under Creature (Creature is checked first).
const TYPE_ORDER = [
  'Creature', 'Planeswalker', 'Instant', 'Sorcery',
  'Artifact', 'Enchantment', 'Battle', 'Land',
]
const COLOR_RANK = { W: 0, U: 1, B: 2, R: 3, G: 4 }

function priceOf(card) {
  const raw = card.prices?.usd ?? card.prices?.usd_foil ?? card.prices?.eur
  const n = raw == null ? NaN : parseFloat(raw)
  return Number.isFinite(n) ? n : null
}

function cmcOf(card) {
  const n = typeof card.cmc === 'number' ? card.cmc : parseFloat(card.cmc)
  return Number.isFinite(n) ? n : null
}

function colorKey(card) {
  const cs = Array.isArray(card.colors) ? card.colors : []
  if (cs.length === 0) return null
  return cs.map(c => COLOR_RANK[c]).filter(r => r !== undefined).sort((a, b) => a - b)
}

const byName = (a, b) => (a.name || '').localeCompare(b.name || '')

function typeRank(card) {
  const tl = (card.type_line || '').toLowerCase()
  const i = TYPE_ORDER.findIndex(t => tl.includes(t.toLowerCase()))
  return i === -1 ? TYPE_ORDER.length : i
}

function addedAtOf(card) {
  const raw = card.addedAt
  const n = typeof raw === 'number' ? raw : Date.parse(raw)
  return Number.isFinite(n) ? n : null
}

/** Return a new array of cards sorted by the given sortBy value. */
export function sortCards(cards, sortBy) {
  if (!sortBy || sortBy === 'default' || cards.length === 0) return cards
  const out = cards.slice()

  switch (sortBy) {
    case 'name-asc':
      out.sort(byName)
      break
    case 'name-desc':
      out.sort((a, b) => -byName(a, b))
      break

    case 'price-desc':
    case 'price-asc': {
      const dir = sortBy === 'price-desc' ? -1 : 1
      out.sort((a, b) => {
        const pa = priceOf(a), pb = priceOf(b)
        if (pa == null && pb == null) return 0
        if (pa == null) return 1
        if (pb == null) return -1
        return dir * (pa - pb)
      })
      break
    }

    case 'cmc-asc':
    case 'cmc-desc': {
      const dir = sortBy === 'cmc-asc' ? 1 : -1
      out.sort((a, b) => {
        const ca = cmcOf(a), cb = cmcOf(b)
        if (ca == null && cb == null) return byName(a, b)
        if (ca == null) return 1
        if (cb == null) return -1
        if (ca === cb) return byName(a, b)
        return dir * (ca - cb)
      })
      break
    }

    case 'color-wubrg':
      // Mono in WUBRG, then multi grouped by count and lex by WUBRG ranks,
      // colorless/lands at the end.
      out.sort((a, b) => {
        const ka = colorKey(a), kb = colorKey(b)
        if (ka == null && kb == null) return byName(a, b)
        if (ka == null) return 1
        if (kb == null) return -1
        if (ka.length !== kb.length) return ka.length - kb.length
        for (let i = 0; i < ka.length; i++) {
          if (ka[i] !== kb[i]) return ka[i] - kb[i]
        }
        return byName(a, b)
      })
      break

    case 'rarity':
      out.sort((a, b) => {
        const ra = RARITY_RANK[a.rarity] ?? 99
        const rb = RARITY_RANK[b.rarity] ?? 99
        if (ra === rb) return byName(a, b)
        return ra - rb
      })
      break

    case 'type':
      out.sort((a, b) => {
        const ta = typeRank(a), tb = typeRank(b)
        if (ta === tb) return byName(a, b)
        return ta - tb
      })
      break

    case 'added-desc':
    case 'added-asc': {
      const dir = sortBy === 'added-desc' ? -1 : 1
      out.sort((a, b) => {
        const aa = addedAtOf(a), ab = addedAtOf(b)
        if (aa == null && ab == null) return byName(a, b)
        if (aa == null) return 1
        if (ab == null) return -1
        if (aa === ab) return byName(a, b)
        return dir * (aa - ab)
      })
      break
    }
  }

  return out
}
