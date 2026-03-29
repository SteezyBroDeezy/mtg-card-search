import { useState, useRef, useEffect } from 'react'
import {
  SEARCH_FILTERS,
  COLOR_OPTIONS,
  TYPE_OPTIONS,
  RARITY_OPTIONS,
  KEYWORD_OPTIONS,
  FORMAT_OPTIONS,
  PROPERTY_OPTIONS
} from '../lib/search'
import { db } from '../lib/db'

function SearchBar({ onSearch, theme, searchHistory = [], onHistorySelect, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery)
  const [showHelper, setShowHelper] = useState(false)
  const [activeTab, setActiveTab] = useState('colors')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const historyRef = useRef(null)

  // Sync query with initialQuery when it changes (e.g. PWA restore or history click)
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery)
    }
  }, [initialQuery])

  // Selected filters for toggle UI
  const [selectedColors, setSelectedColors] = useState([])
  const [exactColors, setExactColors] = useState(false) // Exact color match toggle
  const [selectedIdentity, setSelectedIdentity] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedRarities, setSelectedRarities] = useState([])
  const [selectedKeywords, setSelectedKeywords] = useState([])
  const [selectedFormats, setSelectedFormats] = useState([])
  const [selectedProperties, setSelectedProperties] = useState([])

  // Numeric filters
  const [cmcValue, setCmcValue] = useState('')
  const [cmcOperator, setCmcOperator] = useState('=')
  const [powerValue, setPowerValue] = useState('')
  const [powerOperator, setPowerOperator] = useState('=')
  const [toughnessValue, setToughnessValue] = useState('')
  const [toughnessOperator, setToughnessOperator] = useState('=')
  const [loyaltyValue, setLoyaltyValue] = useState('')
  const [loyaltyOperator, setLoyaltyOperator] = useState('=')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [yearValue, setYearValue] = useState('')
  const [yearOperator, setYearOperator] = useState('=')
  const [edhrecValue, setEdhrecValue] = useState('')

  // Text filters
  const [artistValue, setArtistValue] = useState('')
  const [oracleValue, setOracleValue] = useState('')
  const [setCode, setSetCode] = useState('')

  // Close history dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (historyRef.current && !historyRef.current.contains(e.target)) {
        setShowHistoryDropdown(false)
      }
    }
    if (showHistoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showHistoryDropdown])

  function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  // Normalize text for fuzzy matching (remove accents, apostrophes, etc.)
  function normalizeText(text) {
    return text
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
      .replace(/[''`]/g, '') // Remove apostrophes
      .replace(/[æ]/gi, 'ae')
      .replace(/[œ]/gi, 'oe')
      .toLowerCase()
  }

  // Fetch card name suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      // Only suggest if typing a plain name (no filter syntax)
      const trimmed = query.trim()
      if (!trimmed || trimmed.includes(':') || trimmed.includes('=') || trimmed.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      try {
        const normalizedQuery = normalizeText(trimmed)
        const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0)

        // Run both searches in parallel for better results
        const [startsWithResults, containsResults] = await Promise.all([
          // Exact prefix match (fast, indexed)
          db.cards
            .where('name')
            .startsWithIgnoreCase(trimmed)
            .limit(15)
            .toArray(),
          // Contains search - matches any word in the name
          db.cards
            .filter(card => {
              const normalizedName = normalizeText(card.name)
              // Check if ALL query words appear somewhere in the name
              return queryWords.every(word => normalizedName.includes(word))
            })
            .limit(30)
            .toArray()
        ])

        // Combine and deduplicate, prioritizing startsWith matches
        const seenNames = new Set()
        const combined = []

        // Add startsWith matches first (higher priority)
        for (const card of startsWithResults) {
          if (!seenNames.has(card.name)) {
            seenNames.add(card.name)
            combined.push({ name: card.name, priority: 1 })
          }
        }

        // Add contains matches (these include reprints and partial matches)
        for (const card of containsResults) {
          if (!seenNames.has(card.name)) {
            seenNames.add(card.name)
            // Higher priority if query appears as a word boundary (not mid-word)
            const nameLower = card.name.toLowerCase()
            const queryLower = trimmed.toLowerCase()
            const wordBoundary = nameLower.includes(' ' + queryLower) ||
                                 nameLower.includes(queryLower + ' ') ||
                                 nameLower.startsWith(queryLower)
            combined.push({ name: card.name, priority: wordBoundary ? 2 : 3 })
          }
        }

        // Sort by priority, then alphabetically
        combined.sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority
          return a.name.localeCompare(b.name)
        })

        // Get top 12 suggestions
        const uniqueNames = combined.slice(0, 12).map(c => c.name)
        setSuggestions(uniqueNames)
        setShowSuggestions(uniqueNames.length > 0)
        setSelectedSuggestionIndex(-1)
      } catch (err) {
        console.error('Suggestion error:', err)
        setSuggestions([])
      }
    }

    const debounce = setTimeout(fetchSuggestions, 150)
    return () => clearTimeout(debounce)
  }, [query])

  function handleSuggestionClick(name) {
    setQuery(name)
    setShowSuggestions(false)
    onSearch(name)
  }

  function handleKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault()
      handleSuggestionClick(suggestions[selectedSuggestionIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    setShowSuggestions(false)
    onSearch(query)
  }

  function insertFilter(filterText) {
    const newQuery = query ? `${query} ${filterText}` : filterText
    setQuery(newQuery)
    inputRef.current?.focus()
  }

  function toggleArray(arr, setArr, value) {
    setArr(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }

  // Build and apply query from toggles
  function applyFilters() {
    const parts = []

    // Colors - use c= for exact match, c: for contains
    if (selectedColors.length > 0) {
      const names = { W: 'white', U: 'blue', B: 'black', R: 'red', G: 'green', C: 'colorless' }
      if (exactColors) {
        // Exact match: card colors must be exactly these colors
        const colorStr = selectedColors.map(c => names[c]).join('')
        parts.push(`c=${colorStr}`)
      } else {
        // Contains: card must have each of these colors (but can have more)
        selectedColors.forEach(c => {
          parts.push(`c:${names[c]}`)
        })
      }
    }

    // Color Identity
    if (selectedIdentity.length > 0) {
      const identityStr = selectedIdentity.map(c => c.toLowerCase()).join('')
      parts.push(`id:${identityStr}`)
    }

    // Types
    selectedTypes.forEach(t => parts.push(`t:${t.toLowerCase()}`))

    // Rarities
    selectedRarities.forEach(r => parts.push(`r:${r}`))

    // Formats
    selectedFormats.forEach(f => parts.push(`f:${f}`))

    // Keywords
    selectedKeywords.forEach(k => parts.push(`k:${k.toLowerCase()}`))

    // Properties
    selectedProperties.forEach(p => parts.push(`is:${p}`))

    // Numeric filters
    if (cmcValue) parts.push(`cmc${cmcOperator}${cmcValue}`)
    if (powerValue) parts.push(`pow${powerOperator}${powerValue}`)
    if (toughnessValue) parts.push(`tou${toughnessOperator}${toughnessValue}`)
    if (loyaltyValue) parts.push(`loy${loyaltyOperator}${loyaltyValue}`)
    if (priceMin) parts.push(`usd>=${priceMin}`)
    if (priceMax) parts.push(`usd<=${priceMax}`)
    if (yearValue) parts.push(`year${yearOperator}${yearValue}`)
    if (edhrecValue) parts.push(`edhrec<=${edhrecValue}`)

    // Text filters
    if (artistValue) parts.push(`a:${artistValue}`)
    if (setCode) parts.push(`s:${setCode}`)

    // Extract oracle text filters from existing query (preserve phrases like o:"draw a card")
    const existingOracleMatches = query.match(/o:"[^"]+"/g) || []

    // Add oracleValue from the input field if set
    if (oracleValue) {
      parts.push(`o:"${oracleValue}"`)
    }

    // Add any existing oracle text filters from the query
    existingOracleMatches.forEach(match => {
      // Don't duplicate if it's the same as oracleValue
      const matchValue = match.match(/o:"([^"]+)"/)?.[1]
      if (matchValue && matchValue !== oracleValue) {
        parts.push(match)
      }
    })

    const filterQuery = parts.join(' ')

    // Keep any name search from original query
    // First, remove all filter syntax and quoted oracle text to get just the card name
    let nameQuery = query
      // Remove oracle text filters (including quoted phrases)
      .replace(/o:"[^"]+"/g, '')
      // Remove other filter prefixes
      .replace(/[a-z]+[:=][^\s]+/gi, '')
      // Remove numeric filters
      .replace(/(cmc|pow|tou|loy|usd|year|edhrec)[<>=]+\d+(\.\d+)?/gi, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim()

    const newQuery = nameQuery ? `${nameQuery} ${filterQuery}` : filterQuery
    setQuery(newQuery.trim())
    onSearch(newQuery.trim())
    setShowHelper(false) // Close filter panel after applying
  }

  function clearFilters() {
    setSelectedColors([])
    setExactColors(false)
    setSelectedIdentity([])
    setSelectedTypes([])
    setSelectedRarities([])
    setSelectedKeywords([])
    setSelectedFormats([])
    setSelectedProperties([])
    setCmcValue('')
    setPowerValue('')
    setToughnessValue('')
    setLoyaltyValue('')
    setPriceMin('')
    setPriceMax('')
    setYearValue('')
    setEdhrecValue('')
    setArtistValue('')
    setOracleValue('')
    setSetCode('')
    setQuery('')
    localStorage.removeItem('mtg-last-query')
    onSearch('')
  }

  const tabs = [
    { id: 'colors', label: 'Colors' },
    { id: 'types', label: 'Types' },
    { id: 'stats', label: 'Stats' },
    { id: 'formats', label: 'Formats' },
    { id: 'price', label: 'Price' },
    { id: 'keywords', label: 'Keywords' },
    { id: 'phrases', label: 'Phrases' },
    { id: 'more', label: 'More' },
    { id: 'syntax', label: 'Syntax' }
  ]

  // Common Oracle text phrases organized by category
  const commonPhrases = {
    'Card Draw': [
      'draw a card',
      'draw two cards',
      'draw cards equal to',
      'whenever you draw',
      'draws a card'
    ],
    'Land & Mana': [
      'play an additional land',
      'search your library for a basic land',
      'search your library for a land',
      'add one mana of any color',
      'add {G}',
      'whenever a land enters',
      'lands you control',
      'tap target land'
    ],
    'ETB Effects': [
      'enters the battlefield',
      'enters the battlefield tapped',
      'when ~ enters the battlefield',
      'whenever a creature enters',
      'whenever another creature enters',
      'enters the battlefield under your control'
    ],
    'Destroy & Remove': [
      'destroy target creature',
      'destroy target permanent',
      'destroy target artifact',
      'destroy target enchantment',
      'destroy all creatures',
      'exile target creature',
      'exile target permanent',
      'destroy target nonland permanent'
    ],
    'Damage': [
      'deals damage equal to',
      'deals 1 damage',
      'deals 2 damage',
      'deals 3 damage',
      'damage to any target',
      'damage to each opponent',
      'whenever ~ deals combat damage'
    ],
    'Combat': [
      'attacks or blocks',
      'whenever ~ attacks',
      'whenever you attack',
      'can\'t be blocked',
      'must be blocked',
      'doesn\'t untap',
      'attacks each combat if able',
      'double strike'
    ],
    'Life': [
      'you gain life',
      'gain 1 life',
      'gain 2 life',
      'gain life equal to',
      'whenever you gain life',
      'lose life equal to',
      'pay life'
    ],
    'Counters': [
      '+1/+1 counter',
      '-1/-1 counter',
      'put a counter',
      'remove a counter',
      'double the number of counters',
      'whenever a counter is put'
    ],
    'Graveyard': [
      'return target creature card from your graveyard',
      'from your graveyard to your hand',
      'from your graveyard to the battlefield',
      'cards in your graveyard',
      'mill',
      'whenever a creature dies',
      'when ~ dies'
    ],
    'Control & Steal': [
      'gain control of target',
      'tap target creature',
      'target creature gets',
      'counter target spell',
      'can\'t cast spells',
      'can\'t attack'
    ],
    'Tokens': [
      'create a token',
      'create a 1/1',
      'create a 2/2',
      'creature tokens',
      'token copy',
      'create X tokens'
    ],
    'Tutors & Search': [
      'search your library',
      'reveal cards from the top',
      'look at the top',
      'scry',
      'put into your hand'
    ]
  }

  // Quick phrases for mobile - most popular
  const quickPhrases = [
    { label: 'ETB', phrase: 'enters the battlefield' },
    { label: '+Land', phrase: 'play an additional land' },
    { label: 'Draw', phrase: 'draw a card' },
    { label: 'Destroy', phrase: 'destroy target' },
    { label: 'Counter', phrase: 'counter target spell' },
    { label: '+1/+1', phrase: '+1/+1 counter' },
    { label: 'Token', phrase: 'create a token' },
    { label: 'Tutor', phrase: 'search your library' },
  ]

  return (
    <div className="relative space-y-2">
      {/* Search Input - Full Width */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search cards..."
            className={`w-full px-4 py-3 ${query ? 'pr-32' : 'pr-24'} ${theme.bgSecondary} border-2 ${theme.borderAccent || theme.border} rounded-lg focus:outline-none focus:ring-2 ${theme.ring || 'focus:ring-blue-500'} shadow-lg ${theme.glow || ''}`}
          />

          {/* Clear button - shows when there's text */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSuggestions([])
                setShowSuggestions(false)
                inputRef.current?.focus()
              }}
              className={`absolute right-20 top-1/2 -translate-y-1/2 p-1.5 ${theme.textSecondary} hover:text-white rounded-full hover:bg-gray-600 transition-colors`}
              title="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              className={`absolute top-full left-0 right-0 mt-1 ${theme.bgSecondary} border ${theme.border} rounded-lg shadow-xl z-50 overflow-hidden`}
            >
              {suggestions.map((name, idx) => (
                <div
                  key={name}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSuggestionClick(name)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSuggestionClick(name)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-600/30 active:bg-blue-600/50 transition-colors cursor-pointer ${
                    idx === selectedSuggestionIndex ? 'bg-blue-600/40' : ''
                  } ${theme.text}`}
                >
                  {name}
                </div>
              ))}
            </div>
          )}

          {/* Search button inside input on right */}
          <button
            type="submit"
            className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 ${theme.accent} text-white rounded-lg font-medium text-sm`}
          >
            Search
          </button>
        </div>

        {/* Quick Actions Row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHelper(!showHelper)}
            className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium ${
              showHelper ? 'bg-blue-600 text-white' : theme.bgTertiary
            } rounded-lg hover:opacity-90 transition-colors flex items-center gap-1`}
          >
            <span>⚙️</span>
            <span>Filters</span>
          </button>

          {query && (
            <button
              type="button"
              onClick={clearFilters}
              className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium text-red-400 ${theme.bgTertiary} rounded-lg hover:opacity-90 transition-colors`}
            >
              ✕ Clear
            </button>
          )}

          {/* Search History Button */}
          <div className="relative" ref={historyRef}>
            <button
              type="button"
              onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
              className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium ${
                showHistoryDropdown ? 'bg-blue-600 text-white' : theme.bgTertiary
              } rounded-lg hover:opacity-90 transition-colors flex items-center gap-1`}
            >
              <span>🕒</span>
              <span className="hidden sm:inline">History</span>
            </button>

            {/* History Dropdown */}
            {showHistoryDropdown && searchHistory.length > 0 && (
              <div className={`absolute top-full left-0 mt-1 ${theme.bgSecondary} border ${theme.border} rounded-lg shadow-xl z-50 w-72 max-h-64 overflow-y-auto`}>
                {searchHistory.slice(0, 10).map((entry, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setShowHistoryDropdown(false)
                      setQuery(entry.query)
                      if (onHistorySelect) {
                        onHistorySelect(entry.query)
                      } else {
                        onSearch(entry.query)
                      }
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-blue-600/30 transition-colors flex justify-between items-center gap-2 border-b ${theme.border} last:border-b-0`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`${theme.text} text-sm truncate font-medium`}>{entry.query}</p>
                      <p className={`${theme.textSecondary} text-xs`}>
                        {entry.resultCount} result{entry.resultCount !== 1 ? 's' : ''} · {formatTimeAgo(entry.timestamp)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showHistoryDropdown && searchHistory.length === 0 && (
              <div className={`absolute top-full left-0 mt-1 ${theme.bgSecondary} border ${theme.border} rounded-lg shadow-xl z-50 w-56 p-4 text-center`}>
                <p className={`${theme.textSecondary} text-sm`}>No search history yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Current query display */}
        {query && (
          <div className={`${theme.textSecondary} text-xs px-1`}>
            Query: <code className="text-blue-400">{query}</code>
          </div>
        )}
      </form>

      {showHelper && (
        <div className={`mt-2 ${theme.bgSecondary} border ${theme.border} rounded-lg overflow-hidden shadow-xl`}>
          {/* Tabs with scroll indicator */}
          <div className="relative">
            <div className={`flex border-b ${theme.border} overflow-x-auto scrollbar-hide`}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : `${theme.textSecondary} hover:opacity-80`
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Scroll fade hint on right */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-800 to-transparent pointer-events-none sm:hidden" />
          </div>

          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {/* Colors Tab */}
            {activeTab === 'colors' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`font-medium`}>Card Colors</p>
                    <label className={`flex items-center gap-2 text-sm cursor-pointer`}>
                      <span className={exactColors ? theme.text : theme.textSecondary}>
                        Exact colors only
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={exactColors}
                          onChange={(e) => setExactColors(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-gray-600 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </div>
                    </label>
                  </div>
                  <p className={`${theme.textSecondary} text-xs mb-3`}>
                    {exactColors
                      ? 'Cards that are EXACTLY these colors (no more, no less)'
                      : 'Cards that CONTAIN these colors (may have additional colors)'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color.code}
                        onClick={() => toggleArray(selectedColors, setSelectedColors, color.code)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          selectedColors.includes(color.code)
                            ? 'ring-2 ring-blue-400 scale-105'
                            : ''
                        } ${
                          color.code === 'W' ? 'bg-amber-100 text-amber-900' :
                          color.code === 'U' ? 'bg-blue-600 text-white' :
                          color.code === 'B' ? 'bg-gray-900 text-gray-100 border border-gray-600' :
                          color.code === 'R' ? 'bg-red-600 text-white' :
                          color.code === 'G' ? 'bg-green-600 text-white' :
                          'bg-gray-400 text-gray-900'
                        }`}
                      >
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className={`font-medium mb-2`}>Color Identity (Commander)</p>
                  <p className={`${theme.textSecondary} text-xs mb-3`}>Cards that fit WITHIN these colors</p>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.filter(c => c.code !== 'C').map(color => (
                      <button
                        key={'id-' + color.code}
                        onClick={() => toggleArray(selectedIdentity, setSelectedIdentity, color.code)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          selectedIdentity.includes(color.code)
                            ? 'ring-2 ring-yellow-400 scale-105'
                            : 'opacity-60'
                        } ${
                          color.code === 'W' ? 'bg-amber-100 text-amber-900' :
                          color.code === 'U' ? 'bg-blue-600 text-white' :
                          color.code === 'B' ? 'bg-gray-900 text-gray-100 border border-gray-600' :
                          color.code === 'R' ? 'bg-red-600 text-white' :
                          'bg-green-600 text-white'
                        }`}
                      >
                        {color.name}
                      </button>
                    ))}
                  </div>
                  <p className={`${theme.textSecondary} text-xs mt-2`}>
                    Tip: Select your commander's colors to find cards that fit your deck.
                  </p>
                </div>
              </div>
            )}

            {/* Types Tab */}
            {activeTab === 'types' && (
              <div>
                <p className={`${theme.textSecondary} text-sm mb-3`}>Select card types:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {TYPE_OPTIONS.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleArray(selectedTypes, setSelectedTypes, type)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedTypes.includes(type)
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                          : theme.bgTertiary
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <p className={`${theme.textSecondary} text-sm mb-2`}>Rarity:</p>
                  <div className="flex flex-wrap gap-2">
                    {RARITY_OPTIONS.map(rarity => (
                      <button
                        key={rarity.code}
                        onClick={() => toggleArray(selectedRarities, setSelectedRarities, rarity.code)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          selectedRarities.includes(rarity.code)
                            ? 'ring-2 ring-blue-400 scale-105'
                            : ''
                        } ${
                          rarity.code === 'mythic' ? 'bg-orange-600 text-white' :
                          rarity.code === 'rare' ? 'bg-yellow-500 text-yellow-900' :
                          rarity.code === 'uncommon' ? 'bg-gray-400 text-gray-900' :
                          'bg-gray-600 text-white'
                        }`}
                      >
                        {rarity.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className={`${theme.textSecondary} text-sm mb-2`}>Set Code (e.g., MKM, LCI, DSK):</p>
                  <input
                    type="text"
                    value={setCode}
                    onChange={(e) => setSetCode(e.target.value.toLowerCase())}
                    placeholder="Enter 3-letter set code"
                    maxLength={5}
                    className={`w-32 px-3 py-2 ${theme.bgTertiary} rounded-lg uppercase`}
                  />
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CMC */}
                <div className={`p-3 ${theme.bgTertiary} rounded-lg`}>
                  <label className={`block text-sm font-medium mb-2`}>Mana Value</label>
                  <div className="flex gap-2">
                    <select
                      value={cmcOperator}
                      onChange={(e) => setCmcOperator(e.target.value)}
                      className={`px-2 py-2 ${theme.bgSecondary} rounded-lg`}
                    >
                      <option value="=">=</option>
                      <option value="<">&lt;</option>
                      <option value="<=">&le;</option>
                      <option value=">">&gt;</option>
                      <option value=">=">&ge;</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={cmcValue}
                      onChange={(e) => setCmcValue(e.target.value)}
                      placeholder="0"
                      className={`w-20 px-3 py-2 ${theme.bgSecondary} rounded-lg`}
                    />
                  </div>
                </div>

                {/* Power */}
                <div className={`p-3 ${theme.bgTertiary} rounded-lg`}>
                  <label className={`block text-sm font-medium mb-2`}>Power</label>
                  <div className="flex gap-2">
                    <select
                      value={powerOperator}
                      onChange={(e) => setPowerOperator(e.target.value)}
                      className={`px-2 py-2 ${theme.bgSecondary} rounded-lg`}
                    >
                      <option value="=">=</option>
                      <option value="<">&lt;</option>
                      <option value="<=">&le;</option>
                      <option value=">">&gt;</option>
                      <option value=">=">&ge;</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={powerValue}
                      onChange={(e) => setPowerValue(e.target.value)}
                      placeholder="0"
                      className={`w-20 px-3 py-2 ${theme.bgSecondary} rounded-lg`}
                    />
                  </div>
                </div>

                {/* Toughness */}
                <div className={`p-3 ${theme.bgTertiary} rounded-lg`}>
                  <label className={`block text-sm font-medium mb-2`}>Toughness</label>
                  <div className="flex gap-2">
                    <select
                      value={toughnessOperator}
                      onChange={(e) => setToughnessOperator(e.target.value)}
                      className={`px-2 py-2 ${theme.bgSecondary} rounded-lg`}
                    >
                      <option value="=">=</option>
                      <option value="<">&lt;</option>
                      <option value="<=">&le;</option>
                      <option value=">">&gt;</option>
                      <option value=">=">&ge;</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={toughnessValue}
                      onChange={(e) => setToughnessValue(e.target.value)}
                      placeholder="0"
                      className={`w-20 px-3 py-2 ${theme.bgSecondary} rounded-lg`}
                    />
                  </div>
                </div>

                {/* Loyalty */}
                <div className={`p-3 ${theme.bgTertiary} rounded-lg`}>
                  <label className={`block text-sm font-medium mb-2`}>Loyalty (Planeswalkers)</label>
                  <div className="flex gap-2">
                    <select
                      value={loyaltyOperator}
                      onChange={(e) => setLoyaltyOperator(e.target.value)}
                      className={`px-2 py-2 ${theme.bgSecondary} rounded-lg`}
                    >
                      <option value="=">=</option>
                      <option value="<">&lt;</option>
                      <option value="<=">&le;</option>
                      <option value=">">&gt;</option>
                      <option value=">=">&ge;</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={loyaltyValue}
                      onChange={(e) => setLoyaltyValue(e.target.value)}
                      placeholder="0"
                      className={`w-20 px-3 py-2 ${theme.bgSecondary} rounded-lg`}
                    />
                  </div>
                </div>

                {/* Year */}
                <div className={`p-3 ${theme.bgTertiary} rounded-lg`}>
                  <label className={`block text-sm font-medium mb-2`}>Release Year</label>
                  <div className="flex gap-2">
                    <select
                      value={yearOperator}
                      onChange={(e) => setYearOperator(e.target.value)}
                      className={`px-2 py-2 ${theme.bgSecondary} rounded-lg`}
                    >
                      <option value="=">=</option>
                      <option value="<">&lt;</option>
                      <option value="<=">&le;</option>
                      <option value=">">&gt;</option>
                      <option value=">=">&ge;</option>
                    </select>
                    <input
                      type="number"
                      min="1993"
                      max="2030"
                      value={yearValue}
                      onChange={(e) => setYearValue(e.target.value)}
                      placeholder="2024"
                      className={`w-24 px-3 py-2 ${theme.bgSecondary} rounded-lg`}
                    />
                  </div>
                </div>

                {/* Artist */}
                <div className={`p-3 ${theme.bgTertiary} rounded-lg`}>
                  <label className={`block text-sm font-medium mb-2`}>Artist Name</label>
                  <input
                    type="text"
                    value={artistValue}
                    onChange={(e) => setArtistValue(e.target.value)}
                    placeholder="e.g. magali"
                    className={`w-full px-3 py-2 ${theme.bgSecondary} rounded-lg`}
                  />
                </div>
              </div>
            )}

            {/* Formats Tab */}
            {activeTab === 'formats' && (
              <div>
                <p className={`${theme.textSecondary} text-sm mb-3`}>Legal in format:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FORMAT_OPTIONS.map(format => (
                    <button
                      key={format.code}
                      onClick={() => toggleArray(selectedFormats, setSelectedFormats, format.code)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        selectedFormats.includes(format.code)
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                          : theme.bgTertiary
                      }`}
                    >
                      {format.name}
                    </button>
                  ))}
                </div>
                <p className={`${theme.textSecondary} text-xs mt-4`}>
                  Select multiple formats to find cards legal in ALL of them.
                </p>
              </div>
            )}

            {/* Price Tab */}
            {activeTab === 'price' && (
              <div className="space-y-4">
                <div>
                  <p className={`font-medium mb-2`}>Price Range (USD)</p>
                  <div className="flex items-center gap-3">
                    <div>
                      <label className={`block ${theme.textSecondary} text-xs mb-1`}>Min</label>
                      <div className="flex items-center">
                        <span className={theme.textSecondary}>$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={priceMin}
                          onChange={(e) => setPriceMin(e.target.value)}
                          placeholder="0"
                          className={`w-24 px-3 py-2 ${theme.bgTertiary} rounded-lg ml-1`}
                        />
                      </div>
                    </div>
                    <span className={`${theme.textSecondary} mt-5`}>to</span>
                    <div>
                      <label className={`block ${theme.textSecondary} text-xs mb-1`}>Max</label>
                      <div className="flex items-center">
                        <span className={theme.textSecondary}>$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={priceMax}
                          onChange={(e) => setPriceMax(e.target.value)}
                          placeholder="100"
                          className={`w-24 px-3 py-2 ${theme.bgTertiary} rounded-lg ml-1`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setPriceMin(''); setPriceMax('1'); }} className={`px-3 py-1 ${theme.bgTertiary} rounded text-sm`}>Under $1</button>
                  <button onClick={() => { setPriceMin(''); setPriceMax('5'); }} className={`px-3 py-1 ${theme.bgTertiary} rounded text-sm`}>Under $5</button>
                  <button onClick={() => { setPriceMin('10'); setPriceMax(''); }} className={`px-3 py-1 ${theme.bgTertiary} rounded text-sm`}>$10+</button>
                  <button onClick={() => { setPriceMin('50'); setPriceMax(''); }} className={`px-3 py-1 ${theme.bgTertiary} rounded text-sm`}>$50+</button>
                  <button onClick={() => { setPriceMin('100'); setPriceMax(''); }} className={`px-3 py-1 ${theme.bgTertiary} rounded text-sm`}>$100+</button>
                </div>

                <div className={`p-3 ${theme.bgTertiary} rounded-lg mt-4`}>
                  <p className={`font-medium mb-2`}>EDHREC Popularity</p>
                  <p className={`${theme.textSecondary} text-xs mb-2`}>Top ranked commander cards (lower = more popular)</p>
                  <div className="flex items-center gap-2">
                    <span className={theme.textSecondary}>Top</span>
                    <input
                      type="number"
                      min="1"
                      value={edhrecValue}
                      onChange={(e) => setEdhrecValue(e.target.value)}
                      placeholder="1000"
                      className={`w-24 px-3 py-2 ${theme.bgSecondary} rounded-lg`}
                    />
                    <span className={theme.textSecondary}>cards</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button onClick={() => setEdhrecValue('100')} className={`px-3 py-1 ${theme.bgSecondary} rounded text-sm`}>Top 100</button>
                    <button onClick={() => setEdhrecValue('500')} className={`px-3 py-1 ${theme.bgSecondary} rounded text-sm`}>Top 500</button>
                    <button onClick={() => setEdhrecValue('1000')} className={`px-3 py-1 ${theme.bgSecondary} rounded text-sm`}>Top 1000</button>
                  </div>
                </div>
              </div>
            )}

            {/* Keywords Tab */}
            {activeTab === 'keywords' && (
              <div>
                <p className={`${theme.textSecondary} text-sm mb-3`}>Select keyword abilities:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {KEYWORD_OPTIONS.map(keyword => (
                    <button
                      key={keyword}
                      onClick={() => toggleArray(selectedKeywords, setSelectedKeywords, keyword)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedKeywords.includes(keyword)
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                          : theme.bgTertiary
                      }`}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <p className={`${theme.textSecondary} text-sm mb-2`}>Search card text:</p>
                  <input
                    type="text"
                    value={oracleValue}
                    onChange={(e) => setOracleValue(e.target.value)}
                    placeholder='e.g. "draw a card", "destroy target"'
                    className={`w-full px-3 py-2 ${theme.bgTertiary} rounded-lg`}
                  />
                </div>
              </div>
            )}

            {/* Phrases Tab - Common Oracle Text */}
            {activeTab === 'phrases' && (
              <div className="space-y-4">
                <div className={`p-3 ${theme.bgTertiary} rounded-lg`}>
                  <p className={`${theme.text} font-medium mb-1`}>Click any phrase to add it to your search</p>
                  <p className={`${theme.textSecondary} text-xs`}>
                    These are common text patterns found on Magic cards. You can combine them with other filters!
                  </p>
                </div>

                <div className="max-h-[50vh] overflow-y-auto space-y-4">
                  {Object.entries(commonPhrases).map(([category, phrases]) => (
                    <div key={category}>
                      <p className={`${theme.text} font-semibold text-sm mb-2`}>{category}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {phrases.map(phrase => (
                          <button
                            key={phrase}
                            onClick={() => insertFilter(`o:"${phrase}"`)}
                            className={`px-2.5 py-1 text-xs ${theme.bgTertiary} hover:bg-blue-600 hover:text-white rounded transition-colors`}
                          >
                            {phrase}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`p-3 ${theme.bgTertiary} rounded-lg mt-4`}>
                  <p className={`${theme.text} font-medium mb-2`}>Search Tips</p>
                  <ul className={`${theme.textSecondary} text-xs space-y-1`}>
                    <li>• <strong>Order doesn't matter:</strong> <code className="text-blue-400">c:red t:creature</code> = <code className="text-blue-400">t:creature c:red</code></li>
                    <li>• <strong>Use quotes for phrases:</strong> <code className="text-blue-400">o:"draw a card"</code> not <code className="text-red-400">o:draw a card</code></li>
                    <li>• <strong>Partial matches work:</strong> <code className="text-blue-400">o:"enters the"</code> finds all ETB cards</li>
                    <li>• <strong>Combine filters freely:</strong> <code className="text-blue-400">c:green o:"draw" t:creature</code></li>
                    <li>• <strong>Case doesn't matter:</strong> <code className="text-blue-400">o:"Draw"</code> = <code className="text-blue-400">o:"draw"</code></li>
                  </ul>
                </div>
              </div>
            )}

            {/* More Tab */}
            {activeTab === 'more' && (
              <div>
                <p className={`${theme.textSecondary} text-sm mb-3`}>Special properties:</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {PROPERTY_OPTIONS.map(prop => (
                    <button
                      key={prop.code}
                      onClick={() => toggleArray(selectedProperties, setSelectedProperties, prop.code)}
                      className={`px-4 py-3 rounded-lg text-left transition-all ${
                        selectedProperties.includes(prop.code)
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                          : theme.bgTertiary
                      }`}
                    >
                      <div className="font-medium">{prop.name}</div>
                      <div className={`text-xs ${selectedProperties.includes(prop.code) ? 'text-blue-100' : theme.textSecondary}`}>
                        {prop.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Syntax Guide Tab */}
            {activeTab === 'syntax' && (
              <div className="space-y-3">
                <p className={`${theme.textSecondary} text-sm`}>
                  Type these directly in the search box. Click examples to add them.
                </p>
                <div className="grid gap-2 max-h-80 overflow-y-auto">
                  {SEARCH_FILTERS.map(filter => (
                    <div key={filter.prefix} className={`p-3 ${theme.bgTertiary} rounded-lg`}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <code className="text-blue-400 font-bold text-sm">{filter.prefix}</code>
                        <span className="font-medium text-sm">{filter.name}</span>
                        <span className={`${theme.textSecondary} text-xs`}>- {filter.description}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {filter.examples.slice(0, 6).map(ex => (
                          <button
                            key={ex}
                            onClick={() => insertFilter(ex)}
                            className={`px-2 py-0.5 text-xs ${theme.bgSecondary} rounded hover:ring-1 hover:ring-blue-500`}
                          >
                            {ex}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={`flex flex-wrap gap-2 mt-4 pt-4 border-t ${theme.border}`}>
              <button
                onClick={applyFilters}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className={`px-4 py-2 ${theme.bgTertiary} rounded-lg`}
              >
                Clear All
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setShowHelper(false)}
                className={`px-4 py-2 ${theme.textSecondary}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar
