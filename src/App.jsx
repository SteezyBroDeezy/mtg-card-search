import { useState, useEffect } from 'react'
import SearchBar from './components/SearchBar'
import CardDetail from './components/CardDetail'
import AuthModal from './components/AuthModal'
import MyLists from './components/MyLists'
import Settings from './components/Settings'
import PriceOracle from './components/PriceOracle'
import { hasCards, getDbInfo, db } from './lib/db'
import { downloadCards } from './lib/scryfall'
import { parseSearch, matchesFilters } from './lib/search'
import { onAuthChange, logOut } from './lib/firebase'
import { themes, loadTheme } from './lib/theme'

function App() {
  const [dbStatus, setDbStatus] = useState('checking')
  const [cardCount, setCardCount] = useState(0)
  const [downloadProgress, setDownloadProgress] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [allResults, setAllResults] = useState([])
  const [displayCount, setDisplayCount] = useState(50)
  const [lastQuery, setLastQuery] = useState('')
  const [searchError, setSearchError] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [allPrintings, setAllPrintings] = useState([])
  const [showAuth, setShowAuth] = useState(false)
  const [user, setUser] = useState(null)
  const [showLists, setShowLists] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPriceOracle, setShowPriceOracle] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(loadTheme())
  const [searchHistory, setSearchHistory] = useState(() => {
    // Load from localStorage for non-logged-in users
    const saved = localStorage.getItem('mtg-search-history')
    return saved ? JSON.parse(saved) : []
  })
  const [showHistory, setShowHistory] = useState(false)
  const [groupByName, setGroupByName] = useState(() => {
    const saved = localStorage.getItem('mtg-group-by-name')
    return saved !== null ? saved === 'true' : true // default to true
  })

  const theme = themes[currentTheme]

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

  useEffect(() => {
    checkDatabase()
    requestPersistentStorage()
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    localStorage.setItem('mtg-group-by-name', groupByName.toString())
  }, [groupByName])

  // Save search history to localStorage
  useEffect(() => {
    localStorage.setItem('mtg-search-history', JSON.stringify(searchHistory.slice(0, 20)))
  }, [searchHistory])

  function addToHistory(query, resultCount) {
    if (!query.trim()) return
    const entry = {
      query,
      resultCount,
      timestamp: Date.now()
    }
    setSearchHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(h => h.query !== query)
      return [entry, ...filtered].slice(0, 20)
    })
  }

  function clearHistory() {
    setSearchHistory([])
    localStorage.removeItem('mtg-search-history')
  }

  function rerunSearch(query) {
    setShowHistory(false)
    handleSearch(query)
  }

  async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist()
      console.log('Persistent storage:', isPersisted)
    }
  }

  async function checkDatabase() {
    const exists = await hasCards()
    if (exists) {
      const info = await getDbInfo()
      setCardCount(info.cardCount)
      setDbStatus('ready')
    } else {
      setDbStatus('empty')
    }
  }

  async function handleDownload() {
    setDbStatus('downloading')
    try {
      const count = await downloadCards((progress) => {
        setDownloadProgress(progress)
      })
      setCardCount(count)
      setDbStatus('ready')
      setDownloadProgress(null)
    } catch (error) {
      console.error('Download failed:', error)
      setDbStatus('error')
    }
  }

  async function handleSync() {
    setShowSettings(false)
    await handleDownload()
  }

  // Helper to get best price from a card
  function getCardPrice(card) {
    if (card.prices?.usd) return parseFloat(card.prices.usd)
    if (card.prices?.usd_foil) return parseFloat(card.prices.usd_foil)
    if (card.prices?.eur) return parseFloat(card.prices.eur)
    return Infinity // No price = sort last
  }

  // Group cards by name and pick the best representative
  function groupCardsByName(cards) {
    const groups = new Map()

    for (const card of cards) {
      const name = card.name
      if (!groups.has(name)) {
        groups.set(name, [])
      }
      groups.get(name).push(card)
    }

    // For each group, pick the card with the lowest price as representative
    const grouped = []
    for (const [name, printings] of groups) {
      // Sort by price (cheapest first), then by release date (newest first)
      printings.sort((a, b) => {
        const priceA = getCardPrice(a)
        const priceB = getCardPrice(b)
        if (priceA !== priceB) return priceA - priceB
        // If same price, prefer newer
        return (b.released_at || '').localeCompare(a.released_at || '')
      })

      const representative = printings[0]
      representative._printingCount = printings.length
      representative._allPrintings = printings
      grouped.push(representative)
    }

    return grouped
  }

  async function handleSearch(query) {
    setLastQuery(query)
    setSearchError(null)

    if (!query.trim()) {
      setSearchResults([])
      setAllResults([])
      setDisplayCount(50)
      return
    }

    const { filters, nameSearch } = parseSearch(query)

    let results
    try {
      if (filters.length === 0 && nameSearch) {
        results = await db.cards
          .filter(card => card.name.toLowerCase().includes(nameSearch.toLowerCase()))
          .limit(500)
          .toArray()
      } else {
        results = await db.cards
          .filter(card => matchesFilters(card, filters, nameSearch))
          .limit(500)
          .toArray()
      }
    } catch (err) {
      console.error('Search error:', err)
      setSearchError({
        type: 'error',
        message: 'Search failed',
        suggestion: 'Try a simpler search or check your syntax.'
      })
      setSearchResults([])
      setAllResults([])
      return
    }

    let finalResults
    if (groupByName) {
      finalResults = groupCardsByName(results)
    } else {
      finalResults = results
    }

    // Generate helpful feedback if no results
    if (finalResults.length === 0) {
      const errorInfo = getSearchHelpMessage(query, filters, nameSearch)
      setSearchError(errorInfo)
    }

    // Add to search history
    addToHistory(query, finalResults.length)

    setAllResults(finalResults)
    setSearchResults(finalResults.slice(0, 50))
    setDisplayCount(50)
  }

  // Generate helpful error messages based on the search
  function getSearchHelpMessage(query, filters, nameSearch) {
    // Check for common issues
    const issues = []
    const suggestions = []

    // Check for unquoted phrases in oracle text
    if (query.includes('o:') && !query.includes('"') && query.split(' ').length > 2) {
      issues.push('Oracle text with multiple words needs quotes')
      suggestions.push('Try: o:"enters the battlefield"')
    }

    // Check for exact color match with no results
    if (query.includes('c=') && filters.some(f => f.type === 'color_exact')) {
      issues.push('Exact color match (c=) is very specific')
      suggestions.push('Try using c: instead of c= for broader results')
    }

    // Check for possibly misspelled card name
    if (!query.includes(':') && nameSearch && nameSearch.length > 3) {
      suggestions.push(`Make sure "${nameSearch}" is spelled correctly`)
      suggestions.push('Try typing fewer letters to see suggestions')
    }

    // Check for format legality issues
    if (filters.some(f => f.type === 'format')) {
      issues.push('Format restrictions limit results significantly')
      suggestions.push('Try removing the format filter to see more cards')
    }

    // Check for price filters
    if (filters.some(f => f.type === 'price')) {
      issues.push('Not all cards have pricing data')
      suggestions.push('Try removing the price filter')
    }

    // General suggestions
    if (suggestions.length === 0) {
      suggestions.push('Try using fewer filters')
      suggestions.push('Check spelling of card names')
      suggestions.push('Use the Filters button for guided search')
    }

    return {
      type: 'no_results',
      message: `No cards found for "${query}"`,
      issues,
      suggestions
    }
  }

  function loadMoreResults() {
    const newCount = displayCount + 50
    setSearchResults(allResults.slice(0, newCount))
    setDisplayCount(newCount)
  }

  async function handleCardClick(card) {
    // If grouped, we already have all printings
    if (card._allPrintings) {
      setAllPrintings(card._allPrintings)
      setSelectedCard(card)
    } else {
      // Fetch all printings of this card
      const printings = await db.cards
        .filter(c => c.name === card.name)
        .toArray()

      // Sort by price
      printings.sort((a, b) => getCardPrice(a) - getCardPrice(b))
      setAllPrintings(printings)
      setSelectedCard(card)
    }
  }

  async function handleLogout() {
    await logOut()
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
      {/* Sites Navigation Bar */}
      <div className={`${theme.bgSecondary} border-b border-gray-700 px-4 py-1.5 flex items-center justify-between text-sm`}>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider hidden sm:inline">My Apps:</span>
          <span className="text-yellow-400 font-semibold">🔍 Card Search</span>
          <a href="https://steezybrodeezy.github.io/mtgpricetracker/" className="text-gray-400 hover:text-yellow-400 transition-colors font-medium">📊 Price Oracle</a>
          <a href="https://steezybrodeezy.github.io/mtgdecklist/" className="text-gray-400 hover:text-yellow-400 transition-colors font-medium">💀 Deck Skeleton</a>
          <a href="https://steezybrodeezy.github.io/skull-games/" className="text-gray-400 hover:text-yellow-400 transition-colors font-medium">🎮 Skull Games</a>
        </div>
        <span className="text-gray-500 text-xs hidden md:inline">✨ One account syncs across all!</span>
      </div>

      <header className={`border-b-2 ${theme.borderAccent || theme.border} p-4 shadow-lg ${theme.glow || ''}`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Clickable title to go back to search */}
            <h1
              onClick={() => setShowPriceOracle(false)}
              className={`text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity ${showPriceOracle ? theme.textSecondary : ''}`}
            >
              MTG Card Search
            </h1>
            {showPriceOracle && (
              <span className={`${theme.textSecondary}`}>›</span>
            )}
            {showPriceOracle && (
              <span className="text-yellow-400 font-semibold">Price Oracle</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-3 py-2 ${showHistory ? theme.accent + ' text-white' : theme.bgTertiary} rounded-lg border ${theme.borderAccent || theme.border} hover:opacity-90 transition-opacity flex items-center gap-1`}
              title="Search History"
            >
              🕒
              {searchHistory.length > 0 && (
                <span className="text-xs">{searchHistory.length}</span>
              )}
            </button>

            <button
              onClick={() => setShowPriceOracle(!showPriceOracle)}
              className={`px-3 py-2 ${showPriceOracle ? theme.accent + ' text-white' : theme.bgTertiary} rounded-lg border ${theme.borderAccent || theme.border} hover:opacity-90 transition-opacity flex items-center gap-1`}
            >
              <span className="text-yellow-400">◆</span>
              <span className="hidden sm:inline">Price Oracle</span>
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className={`px-3 py-2 ${theme.bgTertiary} rounded-lg border ${theme.borderAccent || theme.border} hover:opacity-90 transition-opacity`}
            >
              Settings
            </button>

            {user ? (
              <>
                <button
                  onClick={() => setShowLists(true)}
                  className={`px-3 py-2 ${theme.bgTertiary} rounded-lg border ${theme.borderAccent || theme.border} hover:opacity-90 transition-opacity`}
                >
                  My Lists
                </button>
                <button
                  onClick={handleLogout}
                  className={`px-3 py-2 ${theme.textSecondary} hover:opacity-70 transition-opacity`}
                >
                  Log Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className={`px-4 py-2 ${theme.accent} text-white rounded-lg font-medium shadow-lg ${theme.glow || ''}`}
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {/* Price Oracle View */}
        {showPriceOracle && (
          <PriceOracle
            user={user}
            theme={theme}
            onCardClick={(card) => {
              setShowPriceOracle(false)
              handleCardClick(card)
            }}
          />
        )}

        {/* Regular Search View */}
        {!showPriceOracle && dbStatus === 'checking' && (
          <div className={theme.textSecondary}>Checking database...</div>
        )}

        {!showPriceOracle && dbStatus === 'empty' && (
          <div className={`${theme.bgSecondary} rounded-lg p-6 mb-6`}>
            <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
            <p className={`${theme.textSecondary} mb-4`}>
              Download the card database to get started.
            </p>
            <button
              onClick={handleDownload}
              className={`px-6 py-3 ${theme.accent} text-white rounded-lg font-medium`}
            >
              Download Card Database
            </button>
          </div>
        )}

        {!showPriceOracle && dbStatus === 'downloading' && downloadProgress && (
          <div className={`${theme.bgSecondary} rounded-lg p-6 mb-6`}>
            <h2 className="text-xl font-semibold mb-2">Downloading...</h2>
            <p className={`${theme.textSecondary} mb-2`}>{downloadProgress.step}</p>
            {downloadProgress.detail && (
              <p className={`${theme.textSecondary} text-sm mb-4`}>{downloadProgress.detail}</p>
            )}
            <div className={`w-full ${theme.bgTertiary} rounded-full h-4 overflow-hidden`}>
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: downloadProgress.percent + '%' }}
              ></div>
            </div>
            <p className={`${theme.textSecondary} text-sm mt-2 text-right`}>
              {downloadProgress.percent}%
            </p>
          </div>
        )}

        {!showPriceOracle && dbStatus === 'error' && (
          <div className="bg-red-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">Download Failed</h2>
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {!showPriceOracle && dbStatus === 'ready' && (
          <>
            <div className="mb-6">
              <SearchBar onSearch={handleSearch} theme={theme} />
              <div className="flex items-center justify-between mt-2">
                <p className={`${theme.textSecondary} text-sm`}>
                  {cardCount.toLocaleString()} cards in database
                </p>
                <label className={`flex items-center gap-2 text-sm ${theme.textSecondary}`}>
                  <input
                    type="checkbox"
                    checked={groupByName}
                    onChange={(e) => setGroupByName(e.target.checked)}
                    className="rounded"
                  />
                  Group by name
                </label>
              </div>
            </div>

            {/* Results count */}
            {allResults.length > 0 && (
              <p className={`${theme.textSecondary} text-sm mb-4`}>
                Showing {searchResults.length} of {allResults.length} results
                {allResults.length >= 500 && ' (limit reached)'}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.map(card => (
                <div
                  key={card.id}
                  className="group cursor-pointer relative"
                  onClick={() => handleCardClick(card)}
                >
                  {(card.image_normal || card.image_small) ? (
                    <img
                      src={card.image_normal || card.image_small}
                      alt={card.name}
                      className="w-full rounded-lg shadow-lg group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className={`w-full aspect-[488/680] ${theme.bgSecondary} rounded-lg flex items-center justify-center`}>
                      <span className={`${theme.textSecondary} text-sm text-center p-2`}>{card.name}</span>
                    </div>
                  )}

                  {/* Price badge with versions count */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                    {card.prices?.usd && (
                      <div className="bg-black/80 text-green-400 text-xs px-2 py-1 rounded">
                        ${card.prices.usd}
                      </div>
                    )}
                    {card._printingCount > 1 && (
                      <div className="bg-black/70 text-gray-300 text-[10px] px-1.5 py-0.5 rounded">
                        {card._printingCount}v
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More button */}
            {searchResults.length > 0 && searchResults.length < allResults.length && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMoreResults}
                  className={`px-8 py-3 ${theme.accent} text-white rounded-lg font-medium shadow-lg ${theme.glow || ''}`}
                >
                  Load More ({allResults.length - searchResults.length} remaining)
                </button>
              </div>
            )}

            {searchResults.length === 0 && !searchError && !lastQuery && (
              <div className={`text-center mt-8 space-y-4`}>
                <p className={`${theme.textSecondary} text-lg`}>Start typing to search for cards</p>
                <div className={`${theme.bgSecondary} rounded-lg p-4 max-w-md mx-auto text-left`}>
                  <p className={`${theme.text} font-medium mb-2`}>Quick Tips:</p>
                  <ul className={`${theme.textSecondary} text-sm space-y-1`}>
                    <li>• Type a card name to see suggestions</li>
                    <li>• Use <code className="text-blue-400">c:red</code> for red cards</li>
                    <li>• Use <code className="text-blue-400">t:creature</code> for creatures</li>
                    <li>• Click <span className="font-medium">Filters</span> for guided search</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Search Error / No Results Help */}
            {searchError && (
              <div className={`${theme.bgSecondary} rounded-lg p-6 mt-4 max-w-2xl mx-auto`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔍</span>
                  <div className="flex-1">
                    <p className={`${theme.text} font-semibold text-lg mb-2`}>
                      {searchError.message}
                    </p>

                    {searchError.issues && searchError.issues.length > 0 && (
                      <div className="mb-3">
                        <p className={`${theme.textSecondary} text-sm font-medium mb-1`}>Possible issues:</p>
                        <ul className="text-yellow-400 text-sm space-y-1">
                          {searchError.issues.map((issue, i) => (
                            <li key={i}>⚠️ {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {searchError.suggestions && searchError.suggestions.length > 0 && (
                      <div>
                        <p className={`${theme.textSecondary} text-sm font-medium mb-1`}>Suggestions:</p>
                        <ul className={`${theme.textSecondary} text-sm space-y-1`}>
                          {searchError.suggestions.map((suggestion, i) => (
                            <li key={i}>💡 {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className={`mt-4 pt-3 border-t ${theme.border}`}>
                      <p className={`${theme.textSecondary} text-xs`}>
                        Need help? Click the <span className="font-medium">Filters</span> button for guided search, or try the <span className="font-medium">Syntax</span> tab for all search options.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {selectedCard && (
        <CardDetail
          card={selectedCard}
          allPrintings={allPrintings}
          onClose={() => {
            setSelectedCard(null)
            setAllPrintings([])
          }}
          onSelectPrinting={(card) => setSelectedCard(card)}
          user={user}
        />
      )}

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}

      {showLists && user && (
        <MyLists userId={user.uid} onClose={() => setShowLists(false)} />
      )}

      {showSettings && (
        <Settings
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme}
          onClose={() => setShowSettings(false)}
          cardCount={cardCount}
          onSync={handleSync}
          groupByName={groupByName}
          onGroupByNameChange={setGroupByName}
        />
      )}

      {/* Search History Modal */}
      {showHistory && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setShowHistory(false)}
        >
          <div
            className={`${theme.bgSecondary} rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className={`text-lg font-bold ${theme.text}`}>Search History</h2>
              <div className="flex gap-2">
                {searchHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-red-400 text-sm hover:text-red-300"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {searchHistory.length === 0 ? (
                <div className={`p-8 text-center ${theme.textSecondary}`}>
                  <div className="text-4xl mb-3 opacity-50">🕒</div>
                  <p>No search history yet</p>
                  <p className="text-sm mt-1">Your recent searches will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {searchHistory.map((entry, index) => (
                    <button
                      key={index}
                      onClick={() => rerunSearch(entry.query)}
                      className={`w-full p-3 text-left hover:${theme.bgTertiary} transition-colors flex justify-between items-center gap-3`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`${theme.text} truncate font-medium`}>{entry.query}</p>
                        <p className={`${theme.textSecondary} text-xs`}>
                          {entry.resultCount} result{entry.resultCount !== 1 ? 's' : ''} • {formatTimeAgo(entry.timestamp)}
                        </p>
                      </div>
                      <span className={`${theme.textSecondary} text-lg`}>→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
