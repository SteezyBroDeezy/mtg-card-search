import { useState, useRef } from 'react'
import {
  SEARCH_FILTERS,
  COLOR_OPTIONS,
  TYPE_OPTIONS,
  RARITY_OPTIONS,
  KEYWORD_OPTIONS
} from '../lib/search'

function SearchBar({ onSearch, theme }) {
  const [query, setQuery] = useState('')
  const [showHelper, setShowHelper] = useState(false)
  const [activeTab, setActiveTab] = useState('colors')
  const inputRef = useRef(null)

  // Selected filters for toggle UI
  const [selectedColors, setSelectedColors] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedRarities, setSelectedRarities] = useState([])
  const [selectedKeywords, setSelectedKeywords] = useState([])
  const [cmcValue, setCmcValue] = useState('')
  const [cmcOperator, setCmcOperator] = useState('=')
  const [powerValue, setPowerValue] = useState('')
  const [powerOperator, setPowerOperator] = useState('=')
  const [toughnessValue, setToughnessValue] = useState('')
  const [toughnessOperator, setToughnessOperator] = useState('=')
  const [artistValue, setArtistValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onSearch(query)
  }

  function insertFilter(filterText) {
    const newQuery = query ? `${query} ${filterText}` : filterText
    setQuery(newQuery)
    inputRef.current?.focus()
  }

  function toggleColor(code) {
    setSelectedColors(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  function toggleType(type) {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  function toggleRarity(rarity) {
    setSelectedRarities(prev =>
      prev.includes(rarity) ? prev.filter(r => r !== rarity) : [...prev, rarity]
    )
  }

  function toggleKeyword(keyword) {
    setSelectedKeywords(prev =>
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    )
  }

  // Build and apply query from toggles
  function applyFilters() {
    const parts = []

    selectedColors.forEach(c => {
      const names = { W: 'white', U: 'blue', B: 'black', R: 'red', G: 'green', C: 'colorless' }
      parts.push(`c:${names[c]}`)
    })

    selectedTypes.forEach(t => parts.push(`t:${t.toLowerCase()}`))
    selectedRarities.forEach(r => parts.push(`r:${r}`))
    selectedKeywords.forEach(k => parts.push(`k:${k.toLowerCase()}`))

    if (cmcValue) parts.push(`cmc${cmcOperator}${cmcValue}`)
    if (powerValue) parts.push(`pow${powerOperator}${powerValue}`)
    if (toughnessValue) parts.push(`tou${toughnessOperator}${toughnessValue}`)
    if (artistValue) parts.push(`a:${artistValue}`)

    const filterQuery = parts.join(' ')
    const nameQuery = query.split(' ').filter(p => !p.includes(':')).join(' ')
    const newQuery = nameQuery ? `${nameQuery} ${filterQuery}` : filterQuery

    setQuery(newQuery.trim())
    onSearch(newQuery.trim())
  }

  function clearFilters() {
    setSelectedColors([])
    setSelectedTypes([])
    setSelectedRarities([])
    setSelectedKeywords([])
    setCmcValue('')
    setPowerValue('')
    setToughnessValue('')
    setArtistValue('')
    setQuery('')
  }

  const tabs = [
    { id: 'colors', label: 'Colors' },
    { id: 'types', label: 'Types' },
    { id: 'stats', label: 'Stats' },
    { id: 'rarity', label: 'Rarity' },
    { id: 'keywords', label: 'Keywords' },
    { id: 'syntax', label: 'Syntax Guide' }
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
            placeholder="Search cards... (e.g. lightning bolt, t:creature c:red cmc<3)"
            className={`w-full px-4 py-3 ${theme.bgSecondary} border ${theme.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <button
            type="button"
            onClick={() => setShowHelper(!showHelper)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-sm ${theme.bgTertiary} rounded hover:opacity-80`}
          >
            {showHelper ? 'Hide' : 'Filters'}
          </button>
        </div>
        <button
          type="submit"
          className={`px-6 py-3 ${theme.accent} text-white rounded-lg font-medium`}
        >
          Search
        </button>
      </form>

      {showHelper && (
        <div className={`mt-2 ${theme.bgSecondary} border ${theme.border} rounded-lg overflow-hidden`}>
          {/* Tabs */}
          <div className={`flex border-b ${theme.border} overflow-x-auto`}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? `${theme.accent} text-white`
                    : `${theme.textSecondary} hover:opacity-80`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* Colors Tab */}
            {activeTab === 'colors' && (
              <div>
                <p className={`${theme.textSecondary} text-sm mb-3`}>Select colors to filter by:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color.code}
                      onClick={() => toggleColor(color.code)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedColors.includes(color.code)
                          ? 'ring-2 ring-blue-500 scale-105'
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
                <p className={`${theme.textSecondary} text-xs`}>
                  Tip: You can also type <code className={theme.bgTertiary + ' px-1 rounded'}>c:red c:blue</code> to search for cards that are both red AND blue.
                </p>
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
                      onClick={() => toggleType(type)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedTypes.includes(type)
                          ? `${theme.accent} text-white ring-2 ring-blue-500`
                          : theme.bgTertiary
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <p className={`${theme.textSecondary} text-xs`}>
                  Tip: Type <code className={theme.bgTertiary + ' px-1 rounded'}>t:legendary t:creature</code> for legendary creatures.
                </p>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-4">
                {/* CMC */}
                <div>
                  <label className={`block ${theme.textSecondary} text-sm mb-2`}>Mana Value (CMC)</label>
                  <div className="flex gap-2">
                    <select
                      value={cmcOperator}
                      onChange={(e) => setCmcOperator(e.target.value)}
                      className={`px-3 py-2 ${theme.bgTertiary} rounded-lg`}
                    >
                      <option value="=">=</option>
                      <option value="<">&lt;</option>
                      <option value="<=">&lt;=</option>
                      <option value=">">&gt;</option>
                      <option value=">=">&gt;=</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={cmcValue}
                      onChange={(e) => setCmcValue(e.target.value)}
                      placeholder="0-20"
                      className={`w-24 px-3 py-2 ${theme.bgTertiary} rounded-lg`}
                    />
                  </div>
                </div>

                {/* Power */}
                <div>
                  <label className={`block ${theme.textSecondary} text-sm mb-2`}>Power</label>
                  <div className="flex gap-2">
                    <select
                      value={powerOperator}
                      onChange={(e) => setPowerOperator(e.target.value)}
                      className={`px-3 py-2 ${theme.bgTertiary} rounded-lg`}
                    >
                      <option value="=">=</option>
                      <option value="<">&lt;</option>
                      <option value="<=">&lt;=</option>
                      <option value=">">&gt;</option>
                      <option value=">=">&gt;=</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={powerValue}
                      onChange={(e) => setPowerValue(e.target.value)}
                      placeholder="0-99"
                      className={`w-24 px-3 py-2 ${theme.bgTertiary} rounded-lg`}
                    />
                  </div>
                </div>

                {/* Toughness */}
                <div>
                  <label className={`block ${theme.textSecondary} text-sm mb-2`}>Toughness</label>
                  <div className="flex gap-2">
                    <select
                      value={toughnessOperator}
                      onChange={(e) => setToughnessOperator(e.target.value)}
                      className={`px-3 py-2 ${theme.bgTertiary} rounded-lg`}
                    >
                      <option value="=">=</option>
                      <option value="<">&lt;</option>
                      <option value="<=">&lt;=</option>
                      <option value=">">&gt;</option>
                      <option value=">=">&gt;=</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={toughnessValue}
                      onChange={(e) => setToughnessValue(e.target.value)}
                      placeholder="0-99"
                      className={`w-24 px-3 py-2 ${theme.bgTertiary} rounded-lg`}
                    />
                  </div>
                </div>

                {/* Artist */}
                <div>
                  <label className={`block ${theme.textSecondary} text-sm mb-2`}>Artist Name</label>
                  <input
                    type="text"
                    value={artistValue}
                    onChange={(e) => setArtistValue(e.target.value)}
                    placeholder="e.g. magali, nielsen"
                    className={`w-full max-w-xs px-3 py-2 ${theme.bgTertiary} rounded-lg`}
                  />
                </div>
              </div>
            )}

            {/* Rarity Tab */}
            {activeTab === 'rarity' && (
              <div>
                <p className={`${theme.textSecondary} text-sm mb-3`}>Select rarities:</p>
                <div className="flex flex-wrap gap-2">
                  {RARITY_OPTIONS.map(rarity => (
                    <button
                      key={rarity.code}
                      onClick={() => toggleRarity(rarity.code)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedRarities.includes(rarity.code)
                          ? 'ring-2 ring-blue-500 scale-105'
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
            )}

            {/* Keywords Tab */}
            {activeTab === 'keywords' && (
              <div>
                <p className={`${theme.textSecondary} text-sm mb-3`}>Select keyword abilities:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {KEYWORD_OPTIONS.map(keyword => (
                    <button
                      key={keyword}
                      onClick={() => toggleKeyword(keyword)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedKeywords.includes(keyword)
                          ? `${theme.accent} text-white ring-2 ring-blue-500`
                          : theme.bgTertiary
                      }`}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
                <p className={`${theme.textSecondary} text-xs`}>
                  Tip: Type <code className={theme.bgTertiary + ' px-1 rounded'}>k:flying</code> or <code className={theme.bgTertiary + ' px-1 rounded'}>o:flying</code> for any keyword.
                </p>
              </div>
            )}

            {/* Syntax Guide Tab */}
            {activeTab === 'syntax' && (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                <p className={`${theme.textSecondary} text-sm`}>
                  Type filters directly in the search box. Click any example to add it to your search.
                </p>
                {SEARCH_FILTERS.map(filter => (
                  <div key={filter.prefix} className={`p-3 ${theme.bgTertiary} rounded-lg`}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <code className="text-blue-400 font-bold">{filter.prefix}</code>
                      <span className="font-medium">{filter.name}</span>
                      <span className={`${theme.textSecondary} text-sm`}>- {filter.description}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filter.examples.map(ex => (
                        <button
                          key={ex}
                          onClick={() => insertFilter(ex)}
                          className={`px-2 py-1 text-xs ${theme.bgSecondary} rounded hover:ring-1 hover:ring-blue-500`}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className={`flex gap-2 mt-4 pt-4 border-t ${theme.border}`}>
              <button
                onClick={applyFilters}
                className={`px-4 py-2 ${theme.accent} text-white rounded-lg font-medium`}
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className={`px-4 py-2 ${theme.bgTertiary} rounded-lg`}
              >
                Clear All
              </button>
              <button
                onClick={() => setShowHelper(false)}
                className={`px-4 py-2 ${theme.textSecondary} ml-auto`}
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
