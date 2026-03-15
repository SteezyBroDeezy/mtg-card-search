import { useState, useEffect } from 'react'
import SearchBar from './components/SearchBar'
import CardDetail from './components/CardDetail'
import QuickCardView from './components/QuickCardView'
import SaveToListModal from './components/SaveToListModal'
import AuthModal from './components/AuthModal'
import MyLists from './components/MyLists'
import Settings from './components/Settings'
import PriceOracle from './components/PriceOracle'
import SyntaxHelp from './components/SyntaxHelp'
import ThemeEffects from './components/ThemeEffects'
import SetsBrowser from './components/SetsBrowser'
import { hasCards, getDbInfo, db } from './lib/db'
import { downloadCards } from './lib/scryfall'
import { parseSearch, matchesFilters } from './lib/search'
import { onAuthChange, logOut } from './lib/firebase'
import { themes, loadTheme } from './lib/theme'
import { syncLists, hasUnsyncedChanges, getLastSyncTime } from './lib/listSync'
import {
  initPriceOracleCache,
  clearPriceOracleCache,
  fullSync as syncPriceOracle,
  hasPendingChanges as hasPriceOraclePending
} from './lib/priceOracleCache'
import { useRegisterSW } from 'virtual:pwa-register/react'

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
  const [syncing, setSyncing] = useState(false)
  const [hasUnsynced, setHasUnsynced] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [quickViewCard, setQuickViewCard] = useState(null)
  const [showQuickSaveModal, setShowQuickSaveModal] = useState(false)
  const [useScryfall, setUseScryfall] = useState(() => {
    const saved = localStorage.getItem('mtg-use-scryfall')
    return saved === 'true'
  })
  const [searchSource, setSearchSource] = useState(null) // 'local' or 'scryfall' - shows which was used
  const [showSetsBrowser, setShowSetsBrowser] = useState(false)
  const [currentBrowsingSet, setCurrentBrowsingSet] = useState(null) // Track which set we're browsing
  const [flippedCards, setFlippedCards] = useState({}) // Track flipped state for DFCs on main grid

  // PWA Update handling
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.log('SW registration error:', error)
    },
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
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user)
      if (user) {
        // Initialize price oracle cache ONCE on login (saves tons of Firebase reads)
        await initPriceOracleCache(user.uid)
        checkSyncStatus()
      } else {
        // Clear cache on logout
        clearPriceOracleCache()
      }
    })
    return () => unsubscribe()
  }, [])

  async function checkSyncStatus() {
    const listUnsynced = await hasUnsyncedChanges()
    const priceOracleUnsynced = hasPriceOraclePending()
    setHasUnsynced(listUnsynced || priceOracleUnsynced)
    const syncTime = await getLastSyncTime()
    setLastSyncTime(syncTime)
  }

  async function handleListSync() {
    if (!user) return
    setSyncing(true)
    try {
      // Sync both lists AND price oracle data
      const [listResult, priceResult] = await Promise.all([
        syncLists(user.uid),
        syncPriceOracle(user.uid)
      ])

      if (listResult.success && priceResult.success) {
        await checkSyncStatus()
      } else {
        const errors = []
        if (!listResult.success) errors.push('Lists: ' + listResult.error)
        if (!priceResult.success) errors.push('Price Oracle: ' + priceResult.error)
        alert('Sync issues: ' + errors.join(', '))
      }
    } catch (err) {
      console.error('Sync failed:', err)
      alert('Sync failed: ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  function formatSyncTime(isoString) {
    if (!isoString) return 'Never'
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

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

  // Helper to check if card is a DFC and get image for current face
  function isDoubleFaced(card) {
    return card.card_faces && card.card_faces.length > 1 && card.card_faces[0]?.image_uris
  }

  function getCardImage(card, isFlipped) {
    if (isDoubleFaced(card)) {
      const faceIndex = isFlipped ? 1 : 0
      return card.card_faces[faceIndex]?.image_uris?.normal || card.card_faces[faceIndex]?.image_uris?.small
    }
    return card.image_normal || card.image_small || card.image_uris?.normal || card.image_uris?.small
  }

  function toggleCardFlip(cardId, e) {
    e.stopPropagation()
    setFlippedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }))
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

  // Search Scryfall API directly (for otag: and other API-only features)
  async function searchScryfall(query) {
    const SCRYFALL_API = 'https://api.scryfall.com'
    try {
      const response = await fetch(
        `${SCRYFALL_API}/cards/search?q=${encodeURIComponent(query)}&unique=cards`
      )
      const data = await response.json()
      if (data.object === 'error') {
        console.error('Scryfall error:', data.details)
        return []
      }
      if (data.data) {
        // Transform Scryfall results to match our local card format
        return data.data.map(card => ({
          ...card,
          image_small: card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small,
          image_normal: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
          image_large: card.image_uris?.large || card.card_faces?.[0]?.image_uris?.large,
          image_art_crop: card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop
        }))
      }
      return []
    } catch (err) {
      console.error('Scryfall API error:', err)
      return []
    }
  }

  async function handleSearch(query) {
    setLastQuery(query)
    setSearchError(null)
    setSearchSource(null)

    if (!query.trim()) {
      setSearchResults([])
      setAllResults([])
      setDisplayCount(50)
      return
    }

    const { filters, nameSearch, requiresScryfall } = parseSearch(query)

    // Determine if we should use Scryfall API
    const shouldUseScryfall = useScryfall || requiresScryfall

    let results
    try {
      // Use Scryfall API if toggle is on or query requires it
      if (shouldUseScryfall) {
        setSearchSource('scryfall')
        results = await searchScryfall(query)
      } else {
        setSearchSource('local')
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

  function handleCardClick(card) {
    // Go directly to full card detail view (skip quick view)
    handleViewFullDetails(card)
  }

  async function handleViewFullDetails(card) {
    // Close quick view and open full details
    setQuickViewCard(null)

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

  function handleSetClick(set) {
    // Search for all cards in this set
    setShowSetsBrowser(false)
    setCurrentBrowsingSet(set) // Remember which set we're browsing
    handleSearch(`s:${set.code}`)
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} relative overflow-hidden`}>
      {/* Theme particle effects */}
      <ThemeEffects themeName={currentTheme} />

      {/* Sites Navigation Bar - scrollable on mobile */}
      <div className={`${theme.bgSecondary} border-b border-gray-700 px-2 sm:px-4 py-1.5 overflow-x-auto`}>
        <div className="flex items-center gap-3 sm:gap-4 min-w-max text-sm">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider hidden sm:inline">My Apps:</span>
          <span className="text-yellow-400 font-semibold whitespace-nowrap">🔍 Cards</span>
          <a href="https://steezybrodeezy.github.io/mtgpricetracker/" className="text-gray-400 hover:text-yellow-400 transition-colors font-medium whitespace-nowrap">📊 Prices</a>
          <a href="https://steezybrodeezy.github.io/mtgdecklist/" className="text-gray-400 hover:text-yellow-400 transition-colors font-medium whitespace-nowrap">💀 Decks</a>
          <a href="https://steezybrodeezy.github.io/skull-games/" className="text-gray-400 hover:text-yellow-400 transition-colors font-medium whitespace-nowrap">🎮 Games</a>
          <span className="text-gray-500 text-xs hidden lg:inline whitespace-nowrap">✨ One account syncs all!</span>
        </div>
      </div>

      <header className={`border-b-2 ${theme.borderAccent || theme.border} p-2 sm:p-4 shadow-lg ${theme.glow || ''}`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Clickable title to go back to search */}
            <h1
              onClick={() => setShowPriceOracle(false)}
              className={`text-lg sm:text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity truncate ${showPriceOracle ? theme.textSecondary : ''}`}
            >
              <span className="hidden sm:inline">MTG Card Search</span>
              <span className="sm:hidden">MTG Search</span>
            </h1>
            {showPriceOracle && (
              <>
                <span className={`${theme.textSecondary} hidden sm:inline`}>›</span>
                <span className="text-yellow-400 font-semibold text-sm sm:text-base">Price Oracle</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Search History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 sm:px-3 sm:py-2 ${showHistory ? theme.accent + ' text-white' : theme.bgTertiary} rounded-lg border ${theme.borderAccent || theme.border} hover:opacity-90 transition-opacity flex items-center gap-1`}
              title="Search History"
            >
              🕒
              {searchHistory.length > 0 && (
                <span className="text-xs hidden sm:inline">{searchHistory.length}</span>
              )}
            </button>

            <button
              onClick={() => setShowPriceOracle(!showPriceOracle)}
              className={`p-2 sm:px-3 sm:py-2 ${showPriceOracle ? theme.accent + ' text-white' : theme.bgTertiary} rounded-lg border ${theme.borderAccent || theme.border} hover:opacity-90 transition-opacity flex items-center gap-1`}
              title="Price Oracle"
            >
              <span className="text-yellow-400">◆</span>
              <span className="hidden md:inline">Prices</span>
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className={`p-2 sm:px-3 sm:py-2 ${theme.bgTertiary} rounded-lg border ${theme.borderAccent || theme.border} hover:opacity-90 transition-opacity`}
              title="Settings"
            >
              <span className="sm:hidden">⚙️</span>
              <span className="hidden sm:inline">Settings</span>
            </button>

            {user ? (
              <>
                {/* Sync Button - Prominent when there are unsynced changes */}
                <button
                  onClick={handleListSync}
                  disabled={syncing}
                  className={`flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    syncing
                      ? 'bg-gray-600 text-gray-400 cursor-wait'
                      : hasUnsynced
                      ? 'bg-yellow-600 hover:bg-yellow-500 text-white animate-pulse'
                      : 'bg-green-700/50 hover:bg-green-600 text-green-300'
                  }`}
                  title={hasUnsynced ? 'Sync pending changes' : `Last synced: ${formatSyncTime(lastSyncTime)}`}
                >
                  <svg
                    className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {syncing ? 'Syncing...' : hasUnsynced ? 'Sync' : 'Synced'}
                  </span>
                </button>
                <button
                  onClick={() => setShowLists(true)}
                  className={`p-2 sm:px-3 sm:py-2 ${theme.bgTertiary} rounded-lg border ${theme.borderAccent || theme.border} hover:opacity-90 transition-opacity`}
                  title="My Lists"
                >
                  <span className="sm:hidden">📋</span>
                  <span className="hidden sm:inline">Lists</span>
                </button>
                <button
                  onClick={handleLogout}
                  className={`p-2 sm:px-3 sm:py-2 ${theme.textSecondary} hover:opacity-70 transition-opacity`}
                  title="Log Out"
                >
                  <span className="sm:hidden">🚪</span>
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className={`px-3 py-2 ${theme.accent} text-white rounded-lg font-medium shadow-lg ${theme.glow || ''} text-sm sm:text-base`}
              >
                <span className="hidden sm:inline">Log In</span>
                <span className="sm:hidden">👤</span>
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
              <SearchBar onSearch={(q) => { setCurrentBrowsingSet(null); handleSearch(q); }} theme={theme} />
              <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <p className={`${theme.textSecondary} text-sm`}>
                    {cardCount.toLocaleString()} cards in database
                  </p>
                  <button
                    onClick={() => setShowSetsBrowser(true)}
                    className={`px-3 py-1.5 ${theme.bgSecondary} border ${theme.border} rounded-lg text-sm font-medium hover:border-purple-500 transition-colors flex items-center gap-2`}
                  >
                    <span>📦</span>
                    Browse Sets
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <label className={`flex items-center gap-2 text-sm ${theme.textSecondary} cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={useScryfall}
                      onChange={(e) => {
                        setUseScryfall(e.target.checked)
                        localStorage.setItem('mtg-use-scryfall', e.target.checked)
                      }}
                      className="rounded accent-purple-500"
                    />
                    <span className="flex items-center gap-1">
                      Use Scryfall API
                      <span className="text-xs text-purple-400">(full syntax)</span>
                    </span>
                  </label>
                  <label className={`flex items-center gap-2 text-sm ${theme.textSecondary} cursor-pointer`}>
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
            </div>

            {/* Collapsible Syntax Help */}
            <SyntaxHelp theme={theme} onSearch={handleSearch} />

            {/* Set Header Banner - shows when browsing a specific set */}
            {currentBrowsingSet && allResults.length > 0 && (
              <div className={`${theme.bgSecondary} rounded-lg p-4 mb-4 flex items-center gap-4 border ${theme.border}`}>
                {currentBrowsingSet.icon_svg_uri && (
                  <img
                    src={currentBrowsingSet.icon_svg_uri}
                    alt={currentBrowsingSet.name}
                    className="w-12 h-12 object-contain"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{currentBrowsingSet.name}</h3>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    {currentBrowsingSet.code.toUpperCase()} • {currentBrowsingSet.card_count} cards • Released {currentBrowsingSet.released_at || 'TBA'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCurrentBrowsingSet(null)
                    setSearchResults([])
                    setAllResults([])
                    setLastQuery('')
                  }}
                  className={`px-3 py-1.5 ${theme.bgTertiary} rounded-lg text-sm hover:opacity-80`}
                >
                  ✕ Clear
                </button>
              </div>
            )}

            {/* Results count */}
            {allResults.length > 0 && (
              <p className={`${theme.textSecondary} text-sm mb-4 flex items-center gap-2`}>
                <span>Showing {searchResults.length} of {allResults.length} results</span>
                {allResults.length >= 500 && <span>(limit reached)</span>}
                {searchSource && (
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    searchSource === 'scryfall'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-gray-600/30 text-gray-400'
                  }`}>
                    via {searchSource === 'scryfall' ? 'Scryfall API' : 'Local DB'}
                  </span>
                )}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.map(card => {
                const isDFC = isDoubleFaced(card)
                const isFlipped = flippedCards[card.id] || false
                const cardImage = getCardImage(card, isFlipped)

                return (
                  <div
                    key={card.id}
                    role="button"
                    tabIndex={0}
                    className="group cursor-pointer relative active:scale-95 transition-transform"
                    onClick={() => handleCardClick(card)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCardClick(card)}
                  >
                    {cardImage ? (
                      <img
                        src={cardImage}
                        alt={card.name}
                        className={`w-full rounded-lg shadow-lg group-hover:scale-105 transition-transform ${isFlipped ? 'scale-x-100' : ''}`}
                        loading="lazy"
                        draggable={false}
                      />
                    ) : (
                      <div className={`w-full aspect-[488/680] ${theme.bgSecondary} rounded-lg flex items-center justify-center`}>
                        <span className={`${theme.textSecondary} text-sm text-center p-2`}>{card.name}</span>
                      </div>
                    )}

                    {/* Flip button for DFCs */}
                    {isDFC && (
                      <button
                        onClick={(e) => toggleCardFlip(card.id, e)}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Flip card"
                      >
                        🔄
                      </button>
                    )}

                    {/* Price and versions badges - bottom center together */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                      {card._printingCount > 1 && (
                        <div className="bg-black/70 text-gray-300 text-[10px] px-1.5 py-0.5 rounded">
                          {card._printingCount}v
                        </div>
                      )}
                      {card.prices?.usd && (
                        <div className="bg-black/80 text-green-400 text-xs px-2 py-1 rounded">
                          ${card.prices.usd}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
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

      {/* PWA Update Banner */}
      {needRefresh && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-blue-600 text-white p-4 rounded-xl shadow-2xl z-[100] animate-bounce">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Update Available!</p>
              <p className="text-sm text-blue-100">Tap to get the latest version</p>
            </div>
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-bold text-sm whitespace-nowrap"
            >
              Update Now
            </button>
          </div>
        </div>
      )}

      {/* Quick Card View - shows immediately when tapping a card */}
      {quickViewCard && (
        <QuickCardView
          card={quickViewCard}
          user={user}
          theme={theme}
          onClose={() => setQuickViewCard(null)}
          onViewDetails={() => handleViewFullDetails(quickViewCard)}
          onSaveToList={() => setShowQuickSaveModal(true)}
        />
      )}

      {/* Save modal from quick view */}
      {showQuickSaveModal && quickViewCard && user && (
        <SaveToListModal
          card={quickViewCard}
          userId={user.uid}
          onClose={() => {
            setShowQuickSaveModal(false)
            checkSyncStatus()
          }}
          theme={theme}
        />
      )}

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
          theme={theme}
          onListUpdated={checkSyncStatus}
        />
      )}

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}

      {showLists && user && (
        <MyLists userId={user.uid} onClose={() => { setShowLists(false); checkSyncStatus(); }} />
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

      {/* Sets Browser */}
      {showSetsBrowser && (
        <SetsBrowser
          theme={theme}
          onClose={() => setShowSetsBrowser(false)}
          onSetClick={handleSetClick}
        />
      )}

    </div>
  )
}

export default App
