import { useState, useEffect } from 'react'

function SetsBrowser({ theme, onClose, onSetClick }) {
  const [sets, setSets] = useState([])
  const [filteredSets, setFilteredSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [displayCount, setDisplayCount] = useState(50)

  // Set types to filter by
  const setTypes = [
    { value: 'all', label: 'All Sets' },
    { value: 'expansion', label: 'Expansions' },
    { value: 'core', label: 'Core Sets' },
    { value: 'masters', label: 'Masters' },
    { value: 'draft_innovation', label: 'Draft Innovation' },
    { value: 'commander', label: 'Commander' },
    { value: 'starter', label: 'Starter' },
    { value: 'promo', label: 'Promos' },
    { value: 'funny', label: 'Funny (Un-sets)' }
  ]

  useEffect(() => {
    loadSets()
  }, [])

  useEffect(() => {
    filterSets()
  }, [sets, searchQuery, typeFilter])

  async function loadSets() {
    try {
      setLoading(true)
      const response = await fetch('https://api.scryfall.com/sets')
      const data = await response.json()

      // Sort by release date (newest first) and filter out digital-only sets
      const sortedSets = data.data
        .filter(s => !s.digital && s.card_count > 0)
        .sort((a, b) => new Date(b.released_at) - new Date(a.released_at))

      setSets(sortedSets)
      setFilteredSets(sortedSets)
    } catch (e) {
      setError('Failed to load sets')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function filterSets() {
    let filtered = sets

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(s => s.set_type === typeFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query)
      )
    }

    setFilteredSets(filtered)
    setDisplayCount(50) // Reset display count when filtering
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'TBA'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  function getSetTypeLabel(type) {
    const labels = {
      'expansion': 'Expansion',
      'core': 'Core Set',
      'masters': 'Masters',
      'draft_innovation': 'Draft',
      'commander': 'Commander',
      'starter': 'Starter',
      'promo': 'Promo',
      'funny': 'Un-Set',
      'memorabilia': 'Memorabilia',
      'arsenal': 'Arsenal',
      'from_the_vault': 'From the Vault',
      'spellbook': 'Spellbook',
      'premium_deck': 'Premium Deck',
      'duel_deck': 'Duel Deck',
      'box': 'Box Set',
      'archenemy': 'Archenemy',
      'planechase': 'Planechase',
      'vanguard': 'Vanguard',
      'treasure_chest': 'Treasure Chest',
      'masterpiece': 'Masterpiece',
      'token': 'Tokens',
      'alchemy': 'Alchemy',
      'minigame': 'Minigame'
    }
    return labels[type] || type
  }

  function getSetTypeColor(type) {
    const colors = {
      'expansion': 'bg-blue-500/20 text-blue-300',
      'core': 'bg-purple-500/20 text-purple-300',
      'masters': 'bg-yellow-500/20 text-yellow-300',
      'draft_innovation': 'bg-green-500/20 text-green-300',
      'commander': 'bg-red-500/20 text-red-300',
      'starter': 'bg-cyan-500/20 text-cyan-300',
      'promo': 'bg-pink-500/20 text-pink-300',
      'funny': 'bg-orange-500/20 text-orange-300'
    }
    return colors[type] || 'bg-gray-500/20 text-gray-300'
  }

  const displayedSets = filteredSets.slice(0, displayCount)
  const hasMore = filteredSets.length > displayCount

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className={`${theme.bgSecondary} border-b ${theme.border} p-4`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`p-2 ${theme.bgTertiary} rounded-lg hover:opacity-80`}
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold">Browse Sets</h2>
            <span className={`text-sm ${theme.textSecondary}`}>
              {filteredSets.length} sets
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-6xl mx-auto mt-4 flex flex-wrap gap-3">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sets..."
            className={`flex-1 min-w-[200px] px-4 py-2 ${theme.bgTertiary} rounded-lg border ${theme.border} focus:outline-none focus:ring-2 ${theme.ring}`}
          />

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-4 py-2 ${theme.bgTertiary} rounded-lg border ${theme.border} focus:outline-none`}
          >
            {setTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sets List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className={theme.textSecondary}>Loading sets...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadSets}
                className={`px-4 py-2 ${theme.accent} rounded-lg`}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="grid gap-2">
                {displayedSets.map(set => (
                  <button
                    key={set.id}
                    onClick={() => onSetClick(set)}
                    className={`${theme.bgSecondary} hover:${theme.bgTertiary} rounded-lg p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.01] border ${theme.border} hover:border-purple-500`}
                  >
                    {/* Set Icon */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      {set.icon_svg_uri ? (
                        <img
                          src={set.icon_svg_uri}
                          alt={set.name}
                          className="w-10 h-10 object-contain"
                          style={{ filter: 'brightness(0) invert(1)' }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center text-xs">
                          {set.code.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Set Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{set.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${getSetTypeColor(set.set_type)}`}>
                          {getSetTypeLabel(set.set_type)}
                        </span>
                      </div>
                      <div className={`text-sm ${theme.textSecondary} flex items-center gap-3 mt-1`}>
                        <span className="uppercase font-mono">{set.code}</span>
                        <span>•</span>
                        <span>{set.card_count} cards</span>
                        <span>•</span>
                        <span>{formatDate(set.released_at)}</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className={`${theme.textSecondary} text-xl`}>→</div>
                  </button>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center py-6">
                  <button
                    onClick={() => setDisplayCount(prev => prev + 50)}
                    className={`px-6 py-3 ${theme.accent} rounded-lg font-medium`}
                  >
                    Load More ({filteredSets.length - displayCount} remaining)
                  </button>
                </div>
              )}

              {filteredSets.length === 0 && (
                <div className="text-center py-12">
                  <p className={theme.textSecondary}>No sets found matching your filters</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SetsBrowser
