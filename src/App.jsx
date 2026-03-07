import { useState, useEffect } from 'react'
import SearchBar from './components/SearchBar'
import SearchHelp from './components/SearchHelp'
import CardDetail from './components/CardDetail'
import AuthModal from './components/AuthModal'
import MyLists from './components/MyLists'
import Settings from './components/Settings'
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
  const [selectedCard, setSelectedCard] = useState(null)
  const [allPrintings, setAllPrintings] = useState([])
  const [showAuth, setShowAuth] = useState(false)
  const [user, setUser] = useState(null)
  const [showLists, setShowLists] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(loadTheme())
  const [groupByName, setGroupByName] = useState(() => {
    const saved = localStorage.getItem('mtg-group-by-name')
    return saved !== null ? saved === 'true' : true // default to true
  })

  const theme = themes[currentTheme]

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
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const { filters, nameSearch } = parseSearch(query)

    let results
    if (filters.length === 0 && nameSearch) {
      results = await db.cards
        .filter(card => card.name.toLowerCase().includes(nameSearch.toLowerCase()))
        .limit(200) // Get more to account for grouping
        .toArray()
    } else {
      results = await db.cards
        .filter(card => matchesFilters(card, filters, nameSearch))
        .limit(200)
        .toArray()
    }

    if (groupByName) {
      const grouped = groupCardsByName(results)
      setSearchResults(grouped.slice(0, 50))
    } else {
      setSearchResults(results.slice(0, 50))
    }
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
      <header className={`border-b-2 ${theme.borderAccent || theme.border} p-4 shadow-lg ${theme.glow || ''}`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">MTG Card Search</h1>

          <div className="flex items-center gap-2">
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
        {dbStatus === 'checking' && (
          <div className={theme.textSecondary}>Checking database...</div>
        )}

        {dbStatus === 'empty' && (
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

        {dbStatus === 'downloading' && downloadProgress && (
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

        {dbStatus === 'error' && (
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

        {dbStatus === 'ready' && (
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.map(card => (
                <div
                  key={card.id}
                  className="group cursor-pointer relative"
                  onClick={() => handleCardClick(card)}
                >
                  {card.image_small ? (
                    <img
                      src={card.image_small}
                      alt={card.name}
                      className="w-full rounded-lg shadow-lg group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className={`w-full aspect-[488/680] ${theme.bgSecondary} rounded-lg flex items-center justify-center`}>
                      <span className={`${theme.textSecondary} text-sm text-center p-2`}>{card.name}</span>
                    </div>
                  )}

                  {/* Printing count badge */}
                  {card._printingCount > 1 && (
                    <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full">
                      {card._printingCount} versions
                    </div>
                  )}

                  {/* Price badge */}
                  {card.prices?.usd && (
                    <div className="absolute bottom-2 left-2 bg-black/80 text-green-400 text-xs px-2 py-1 rounded">
                      ${card.prices.usd}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {searchResults.length === 0 && (
              <p className={`${theme.textSecondary} text-center mt-8`}>Search for cards above</p>
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

      {/* Floating Search Help Button */}
      {dbStatus === 'ready' && <SearchHelp theme={theme} />}
    </div>
  )
}

export default App
