 import { useState, useEffect } from 'react'
  import SearchBar from './components/SearchBar'
  import CardDetail from './components/CardDetail'
  import AuthModal from './components/AuthModal'
  import MyLists from './components/MyLists'
  import Settings from './components/Settings'
  import { hasCards, getDbInfo } from './lib/db'
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
    const [showAuth, setShowAuth] = useState(false)
    const [user, setUser] = useState(null)
    const [showLists, setShowLists] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [currentTheme, setCurrentTheme] = useState(loadTheme())

    const theme = themes[currentTheme]

     useEffect(() => {
      checkDatabase()
      requestPersistentStorage()
      const unsubscribe = onAuthChange((user) => {
        setUser(user)
      })
      return () => unsubscribe()
    }, [])

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

    async function handleSearch(query) {
      if (!query.trim()) {
        setSearchResults([])
        return
      }
      const { db } = await import('./lib/db')
      const { filters, nameSearch } = parseSearch(query)

      if (filters.length === 0 && nameSearch) {
        const results = await db.cards
          .filter(card =>
  card.name.toLowerCase().includes(nameSearch.toLowerCase()))
          .limit(50)
          .toArray()
        setSearchResults(results)
        return
      }

      const results = await db.cards
        .filter(card => matchesFilters(card, filters, nameSearch))
        .limit(50)
        .toArray()
      setSearchResults(results)
    }

    async function handleLogout() {
      await logOut()
    }

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
        <header className={`border-b ${theme.border} p-4`}>
          <div className="max-w-6xl mx-auto flex justify-between
  items-center">
            <h1 className="text-2xl font-bold">MTG Card Search</h1>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className={`px-3 py-2 ${theme.bgTertiary} rounded-lg`}
              >
                Settings
              </button>

              {user ? (
                <>
                  <button
                    onClick={() => setShowLists(true)}
                    className={`px-3 py-2 ${theme.bgTertiary} rounded-lg`}
                  >
                    My Lists
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`px-3 py-2 ${theme.textSecondary}`}
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className={`px-4 py-2 ${theme.accent} text-white
  rounded-lg font-medium`}
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
                className={`px-6 py-3 ${theme.accent} text-white rounded-lg
  font-medium`}
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
              <h2 className="text-xl font-semibold mb-2">Download
  Failed</h2>
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-red-600 text-white rounded-lg
  font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {dbStatus === 'ready' && (
            <>
              <div className="mb-6">
                <SearchBar onSearch={handleSearch} theme={theme} />
                <p className={`${theme.textSecondary} text-sm mt-2`}>
                  {cardCount.toLocaleString()} cards
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4
   lg:grid-cols-5 gap-4">
                {searchResults.map(card => (
                  <div
                    key={card.id}
                    className="group cursor-pointer"
                    onClick={() => setSelectedCard(card)}
                  >
                    {card.image_small ? (
                      <img
                        src={card.image_small}
                        alt={card.name}
                        className="w-full rounded-lg shadow-lg
  group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className={`w-full aspect-[488/680]
  ${theme.bgSecondary} rounded-lg flex items-center justify-center`}>
                        <span className={`${theme.textSecondary} text-sm
  text-center p-2`}>{card.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {searchResults.length === 0 && (
                <p className={`${theme.textSecondary} text-center
  mt-8`}>Search for cards above</p>
              )}
            </>
          )}
        </main>

        {selectedCard && (
          <CardDetail card={selectedCard} onClose={() =>
  setSelectedCard(null)} user={user} />
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
          />
        )}
      </div>
    )
  }

  export default App