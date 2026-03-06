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
        const text = lower.slice(2)
        filters.push({ type: 'oracle', value: text })
      }
      // Otherwise it's a name search
      else {
        if (nameSearch) nameSearch += ' '
        nameSearch += part.replace(/"/g, '')
      }
    }

    return { filters, nameSearch }
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
            if (!card.colors || !card.colors.includes(filter.value)) return
  false
          }
          break

        case 'type':
          if (!card.type_line.toLowerCase().includes(filter.value)) return
  false
          break

        case 'cmc':
          const cmc = card.cmc || 0
          switch (filter.operator) {
            case '<': if (!(cmc < filter.value)) return false; break
            case '<=': if (!(cmc <= filter.value)) return false; break
            case '>': if (!(cmc > filter.value)) return false; break
            case '>=': if (!(cmc >= filter.value)) return false; break
            default: if (cmc !== filter.value) return false
          }
          break

        case 'rarity':
          if (card.rarity !== filter.value) return false
          break

        case 'set':
          if (card.set.toLowerCase() !== filter.value) return false
          break

        case 'oracle':
          if (!card.oracle_text.toLowerCase().includes(filter.value)) return
   false
          break
      }
    }

    return true
  }