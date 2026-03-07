import { useState, useRef } from 'react'
import {
  SEARCH_FILTERS,
  COLOR_OPTIONS,
  TYPE_OPTIONS,
  RARITY_OPTIONS,
  KEYWORD_OPTIONS,
  FORMAT_OPTIONS,
  PROPERTY_OPTIONS
} from '../lib/search'

function SearchBar({ onSearch, theme }) {
  const [query, setQuery] = useState('')
  const [showHelper, setShowHelper] = useState(false)
  const [activeTab, setActiveTab] = useState('colors')
  const inputRef = useRef(null)

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

  function handleSubmit(e) {
    e.preventDefault()
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
    if (oracleValue) parts.push(`o:"${oracleValue}"`)
    if (setCode) parts.push(`s:${setCode}`)

    const filterQuery = parts.join(' ')

    // Keep any name search from original query (filter out all filter syntax)
    const nameQuery = query.split(' ').filter(p =>
      !p.includes(':') &&
      !p.includes('=') &&
      !p.match(/^(cmc|pow|tou|loy|usd|year|edhrec|c[=:])/)
    ).join(' ')

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
  }

  const tabs = [
    { id: 'colors', label: 'Colors' },
    { id: 'types', label: 'Types' },
    { id: 'stats', label: 'Stats' },
    { id: 'formats', label: 'Formats' },
    { id: 'price', label: 'Price' },
    { id: 'keywords', label: 'Keywords' },
    { id: 'more', label: 'More' },
    { id: 'syntax', label: 'Syntax' }
  ]

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cards... (click Filters for easy mode or type syntax)"
            className={`w-full px-4 py-3 ${theme.bgSecondary} border-2 ${theme.borderAccent || theme.border} rounded-lg focus:outline-none focus:ring-2 ${theme.ring || 'focus:ring-blue-500'} shadow-lg ${theme.glow || ''}`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button
              type="button"
              onClick={() => { setActiveTab('syntax'); setShowHelper(true) }}
              className={`px-2 py-1 text-xs font-medium ${theme.textSecondary} hover:${theme.text} transition-colors`}
              title="Syntax Help"
            >
              ?
            </button>
            <button
              type="button"
              onClick={() => setShowHelper(!showHelper)}
              className={`px-3 py-1 text-sm font-medium ${
                showHelper ? 'bg-blue-600 text-white' : theme.bgTertiary
              } rounded-full hover:opacity-90 transition-colors`}
            >
              {showHelper ? 'Close' : 'Filters'}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className={`px-6 py-3 ${theme.accent} text-white rounded-lg font-medium shadow-lg ${theme.glow || ''}`}
        >
          Search
        </button>
      </form>

      {showHelper && (
        <div className={`mt-2 ${theme.bgSecondary} border ${theme.border} rounded-lg overflow-hidden shadow-xl`}>
          {/* Tabs */}
          <div className={`flex border-b ${theme.border} overflow-x-auto`}>
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
