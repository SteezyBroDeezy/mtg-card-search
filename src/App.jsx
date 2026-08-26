import { useState, useEffect, useMemo, useRef } from 'react'
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
import { hasCards, getDbInfo, db, openDatabase } from './lib/db'
import { downloadCards, syncNewCards, autoSyncNewCards } from './lib/scryfall'
import { parseSearch, matchesFilters, normalizeQuotes, toScryfallQuery } from './lib/search'
import { onAuthChange, logOut } from './lib/firebase'
import { themes, loadTheme } from './lib/theme'
import {
  loadEffectLayers, saveEffectLayers, loadIntensity, saveIntensity
} from './lib/effects'
import { syncLists, hasUnsyncedChanges, getLastSyncTime } from './lib/listSync'
import {
  syncSearchHistory, clearRemoteHistory, loadLocalHistory, saveLocalHistory,
  getLastHistorySync, HISTORY_LIMIT
} from './lib/historySync'
import { sortCards, SORT_OPTIONS, DEFAULT_SORT } from './lib/cardSort'
import { useSwipeToClose } from './lib/useSwipeToClose'
import SwipeHandle from './components/SwipeHandle'
import {
  initPriceOracleCache,
  clearPriceOracleCache,
  fullSync as syncPriceOracle,
  hasPendingChanges as hasPriceOraclePending
} from './lib/priceOracleCache'
import { useRegisterSW } from 'virtual:pwa-register/react'

// True when the app is running as an installed PWA (standalone display mode).
// iOS Safari sets navigator.standalone; everyone else uses the matchMedia check.
function isStandalonePWA() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  if (window.navigator.standalone === true) return true
  return false
}

function App() {
  const [dbStatus, setDbStatus] = useState('checking')
  const [cardCount, setCardCount] = useState(0)
  const [downloadProgress, setDownloadProgress] = useState(null)
  // When the card DB was last refreshed, and a transient banner describing
  // the result of the most recent update.
  const [lastDbSync, setLastDbSync] = useState(null)
  const [dbError, setDbError] = useState(null)
  const [checkingSlow, setCheckingSlow] = useState(false)
  const [syncNotice, setSyncNotice] = useState(null)
  // 'online' = query Scryfall API live, no DB needed.
  // 'offline' = use local IndexedDB. PWA defaults to offline; web defaults to online.
  const [appMode, setAppMode] = useState(() => {
    const saved = localStorage.getItem('mtg-app-mode')
    if (saved === 'online' || saved === 'offline') return saved
    return isStandalonePWA() ? 'offline' : 'online'
  })
  const [allResults, setAllResults] = useState([])
  const [displayCount, setDisplayCount] = useState(50)
  const [lastQuery, setLastQuery] = useState('')
  const [searchError, setSearchError] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [cardLoading, setCardLoading] = useState(false)
  const [allPrintings, setAllPrintings] = useState([])
  const [showAuth, setShowAuth] = useState(false)
  const [user, setUser] = useState(null)
  const [showLists, setShowLists] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPriceOracle, setShowPriceOracle] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(loadTheme())
  // Background effects are independent of the theme: 'auto' follows whatever
  // the theme ships with, 'custom' stacks the chosen layers over any theme.
  const [effectConfig, setEffectConfig] = useState(loadEffectLayers)
  const [effectIntensity, setEffectIntensity] = useState(loadIntensity)
  // History lives in localStorage so it works signed-out and offline; the
  // sync button merges it with the account copy across devices.
  const [searchHistory, setSearchHistory] = useState(loadLocalHistory)
  const [historySyncing, setHistorySyncing] = useState(false)
  const [historySyncNote, setHistorySyncNote] = useState(null)
  const [lastHistorySync, setLastHistorySync] = useState(getLastHistorySync)
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
  const [searchSource, setSearchSource] = useState(null) // 'local' or 'scryfall' - shows which was used
  const [isSearching, setIsSearching] = useState(false)
  const [showSetsBrowser, setShowSetsBrowser] = useState(false)
  const [currentBrowsingSet, setCurrentBrowsingSet] = useState(null) // Track which set we're browsing
  const [flippedCards, setFlippedCards] = useState({}) // Track flipped state for DFCs on main grid
  // Results come back most expensive first unless you pick something else.
  const [sortBy, setSortBy] = useState(DEFAULT_SORT)
  const [typeFilter, setTypeFilter] = useState([]) // subset of CARD_TYPES; empty = no filter
  const [showSortBar, setShowSortBar] = useState(false) // collapsed until asked for
  const [funSearchNote, setFunSearchNote] = useState(null) // blurb for a curated search

  // PWA update handling. registerType is 'prompt', so needRefresh flips to
  // true when a newer build has downloaded and is waiting; nothing reloads
  // until the ribbon's Update button calls updateServiceWorker(true).
  const swRegistrationRef = useRef(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [applyingUpdate, setApplyingUpdate] = useState(false)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      swRegistrationRef.current = r || null
      if (!r) return
      // A service worker only looks for a new build on page load. An
      // installed PWA can stay open (or suspended) for days, so poll hourly
      // as well — that's what makes the ribbon show up on its own.
      setInterval(() => { r.update().catch(() => {}) }, 60 * 60 * 1000)
    },
    onRegisterError(error) {
      console.log('SW registration error:', error)
    },
  })

  // Mirror needRefresh into a ref so async callbacks can read it fresh.
  const needRefreshRef = useRef(false)
  useEffect(() => { needRefreshRef.current = needRefresh }, [needRefresh])

  // Also check whenever the app comes back to the foreground or regains a
  // connection — the common case on a phone.
  useEffect(() => {
    function checkForUpdate() {
      if (document.visibilityState !== 'visible') return
      swRegistrationRef.current?.update().catch(() => {})
    }
    document.addEventListener('visibilitychange', checkForUpdate)
    window.addEventListener('focus', checkForUpdate)
    window.addEventListener('online', checkForUpdate)
    return () => {
      document.removeEventListener('visibilitychange', checkForUpdate)
      window.removeEventListener('focus', checkForUpdate)
      window.removeEventListener('online', checkForUpdate)
    }
  }, [])

  // Manual "Check for updates" from Settings. If a new build is waiting the
  // ribbon appears; otherwise we say so explicitly.
  async function handleCheckForUpdate() {
    setShowSettings(false)
    setCheckingUpdate(true)
    try {
      await swRegistrationRef.current?.update()
      // The hook flips needRefresh asynchronously once the new worker
      // installs; give it a moment before declaring us up to date.
      setTimeout(() => {
        if (!needRefreshRef.current) showSyncNotice('App is up to date')
      }, 2000)
    } catch (error) {
      console.error('Update check failed:', error)
      showSyncNotice('Could not check for updates — are you online?')
    } finally {
      setCheckingUpdate(false)
    }
  }

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

  // Pull-down-to-dismiss for the search history sheet.
  const historySwipe = useSwipeToClose(() => setShowHistory(false), { enabled: showHistory })

  // How many result-level controls are active, shown on the collapsed toggle
  // so a filter can never be silently hiding cards.
  const activeResultFilterCount =
    (sortBy !== DEFAULT_SORT ? 1 : 0) + typeFilter.length

  // Result-list post-processing: sort + type filter applied after search.
  // The query DSL filters happen earlier in handleSearch; these are display-time controls.
  const processedResults = useMemo(() => {
    if (allResults.length === 0) return allResults

    const cardHasType = (card, type) => {
      const tl = (card.type_line || '').toLowerCase()
      return tl.includes(type.toLowerCase())
    }

    let working = allResults
    if (typeFilter.length > 0) {
      working = working.filter(c => typeFilter.some(t => cardHasType(c, t)))
    }
    return sortCards(working, sortBy)
  }, [allResults, sortBy, typeFilter])

  const displayedResults = useMemo(
    () => processedResults.slice(0, displayCount),
    [processedResults, displayCount]
  )

  // Reset to first page whenever sort/filter changes so the user sees the top
  // of the newly-ordered list (not page N of a different ordering).
  useEffect(() => {
    setDisplayCount(50)
  }, [sortBy, typeFilter])

  function toggleTypeFilter(type) {
    setTypeFilter(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  function resetResultFilters() {
    setSortBy(DEFAULT_SORT)
    setTypeFilter([])
  }

  const CARD_TYPES = ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land', 'Battle']

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
      const [listResult, priceResult, historyResult] = await Promise.all([
        syncLists(user.uid),
        syncPriceOracle(user.uid),
        syncSearchHistory(user.uid, searchHistory)
      ])

      if (historyResult.success) {
        setSearchHistory(historyResult.history)
        setLastHistorySync(getLastHistorySync())
      }

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

  useEffect(() => {
    localStorage.setItem('mtg-app-mode', appMode)
  }, [appMode])

  // Save search history to localStorage
  useEffect(() => {
    saveLocalHistory(searchHistory)
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
      return [entry, ...filtered].slice(0, HISTORY_LIMIT)
    })
  }

  function clearHistory() {
    setSearchHistory([])
    saveLocalHistory([])
    // Without this the next sync would pull the cleared entries right back.
    if (user) clearRemoteHistory(user.uid)
    setHistorySyncNote(null)
  }

  async function handleHistorySync() {
    if (!user || historySyncing) return
    setHistorySyncing(true)
    setHistorySyncNote(null)
    try {
      const result = await syncSearchHistory(user.uid, searchHistory)
      if (result.success) {
        setSearchHistory(result.history)
        setLastHistorySync(getLastHistorySync())
        setHistorySyncNote(
          result.added > 0
            ? `Pulled in ${result.added} search${result.added === 1 ? '' : 'es'} from your other devices`
            : 'Already up to date on every device'
        )
      } else {
        setHistorySyncNote('Sync failed: ' + result.error)
      }
    } finally {
      setHistorySyncing(false)
    }
  }

  function rerunSearch(query) {
    setShowHistory(false)
    setShowPriceOracle(false) // Navigate to search view
    handleSearch(query)
  }

  async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist()
      console.log('Persistent storage:', isPersisted)
    }
  }

  async function checkDatabase() {
    // Opening can hang: an IndexedDB upgrade waits on every other connection
    // to close, so a second tab left open blocks it indefinitely. Fail into a
    // state the user can act on rather than sitting on "Checking database".
    try {
      await openDatabase()
    } catch (error) {
      console.error('Database open failed:', error)
      setDbError(
        error.code === 'blocked'
          ? 'Another tab or window has the app open, which blocks the database upgrade. Close the others, then retry.'
          : 'The local database did not open. You can retry, or use online mode.'
      )
      setDbStatus('error')
      return
    }

    setDbError(null)
    const exists = await hasCards()
    if (exists) {
      const info = await getDbInfo()
      setCardCount(info.cardCount)
      setLastDbSync(info.lastSync)
      setDbStatus('ready')
      // Incremental auto-sync once a day on an unmetered connection.
      autoSyncNewCards().then(async (result) => {
        if (!result) return
        setCardCount(result.total)
        const fresh = await getDbInfo()
        setLastDbSync(fresh.lastSync)
        if (result.added > 0) {
          showSyncNotice(`Added ${result.added.toLocaleString()} new card${result.added === 1 ? '' : 's'}`)
        }
      })
      // Don't call handleSearch here — its closure would still see
      // dbStatus='checking' and misroute the restored query to Scryfall.
      // The restore happens in the useEffect below, keyed on dbStatus.
    } else {
      setDbStatus('empty')
      // Installed PWA must work offline — kick off the download immediately.
      // Browser users stay in online mode unless they explicitly opt in.
      if (isStandalonePWA()) {
        handleDownload()
      }
    }
  }

  // If checking drags on, explain why and offer a way past it.
  useEffect(() => {
    if (dbStatus !== 'checking') {
      setCheckingSlow(false)
      return
    }
    const timer = setTimeout(() => setCheckingSlow(true), 6000)
    return () => clearTimeout(timer)
  }, [dbStatus])

  // Restore the last search once we know the DB and mode are settled.
  // Runs once on first transition into a usable state.
  const [didRestoreQuery, setDidRestoreQuery] = useState(false)
  useEffect(() => {
    if (didRestoreQuery) return
    if (dbStatus !== 'ready' && appMode !== 'online') return
    const savedQuery = localStorage.getItem('mtg-last-query')
    if (savedQuery) {
      handleSearch(savedQuery)
    }
    setDidRestoreQuery(true)
  }, [dbStatus, appMode, didRestoreQuery])

  // Show a short-lived banner about the last database update.
  const syncNoticeTimer = useRef(null)
  function showSyncNotice(message) {
    setSyncNotice(message)
    clearTimeout(syncNoticeTimer.current)
    syncNoticeTimer.current = setTimeout(() => setSyncNotice(null), 6000)
  }

  async function handleDownload() {
    setDbStatus('downloading')
    try {
      const result = await downloadCards((progress) => {
        setDownloadProgress(progress)
      })
      setCardCount(result.total)
      const info = await getDbInfo()
      setLastDbSync(info.lastSync)
      setDbStatus('ready')
      setDownloadProgress(null)
      showSyncNotice(`Downloaded ${result.total.toLocaleString()} cards`)
    } catch (error) {
      console.error('Download failed:', error)
      setDbStatus('error')
    }
  }

  async function handleSync() {
    setShowSettings(false)
    if (!navigator.onLine) {
      showSyncNotice('No internet connection — connect and try again')
      return
    }
    // Incremental sync: only fetches cards released since last sync.
    // Falls back to a full download if there's no prior sync state.
    const before = cardCount
    setDbStatus('downloading')
    try {
      const result = await syncNewCards((progress) => {
        setDownloadProgress(progress)
      })
      setCardCount(result.total)
      const info = await getDbInfo()
      setLastDbSync(info.lastSync)
      setDbStatus('ready')
      setDownloadProgress(null)
      const added = result.fullDownload ? Math.max(0, result.total - before) : result.added
      showSyncNotice(
        added > 0
          ? `Added ${added.toLocaleString()} new card${added === 1 ? '' : 's'} — ${result.total.toLocaleString()} total`
          : `Already up to date — ${result.total.toLocaleString()} cards`
      )
    } catch (error) {
      console.error('Sync failed:', error)
      setDbStatus('error')
      showSyncNotice('Update failed — check your connection and try again')
    }
  }

  // "3 days ago" style label for the card database's last refresh.
  function formatDbSync(iso) {
    if (!iso) return 'never updated'
    const ms = Date.now() - new Date(iso).getTime()
    if (Number.isNaN(ms)) return 'never updated'
    const mins = Math.floor(ms / 60000)
    if (mins < 1) return 'updated just now'
    if (mins < 60) return `updated ${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `updated ${hours}h ago`
    const days = Math.floor(hours / 24)
    return `updated ${days}d ago`
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
  // Same ceiling the local database search uses, so both modes return the
  // same amount of a large result set.
  const SEARCH_RESULT_LIMIT = 500

  async function searchScryfall(query) {
    const SCRYFALL_API = 'https://api.scryfall.com'

    const shapeCard = (card) => ({
      ...card,
      image_small: card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small,
      image_normal: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
      image_large: card.image_uris?.large || card.card_faces?.[0]?.image_uris?.large,
      image_art_crop: card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop
    })

    try {
      // k: is our shorthand; Scryfall 400s on it and wants kw:.
      const apiQuery = toScryfallQuery(query)
      let url = `${SCRYFALL_API}/cards/search?q=${encodeURIComponent(apiQuery)}&unique=cards`
      const results = []

      // Scryfall pages at 175 cards. Reading only the first page meant a
      // broad search silently stopped there — t:elf has 706 matches, so
      // cards like Prowess of the Fair never appeared online while the
      // local database (limit 500) found them fine.
      while (url && results.length < SEARCH_RESULT_LIMIT) {
        const response = await fetch(url)
        const data = await response.json()

        if (data.object === 'error') {
          // A 404 on the first page just means nothing matched.
          if (results.length === 0) console.error('Scryfall error:', data.details)
          break
        }

        if (Array.isArray(data.data)) results.push(...data.data.map(shapeCard))

        url = data.has_more && data.next_page ? data.next_page : null
        // Scryfall asks for 50-100ms between requests.
        if (url) await new Promise(resolve => setTimeout(resolve, 100))
      }

      return results.slice(0, SEARCH_RESULT_LIMIT)
    } catch (err) {
      console.error('Scryfall API error:', err)
      return []
    }
  }

  async function handleSearch(rawQuery, options = {}) {
    if (!options.keepFunNote) setFunSearchNote(null)
    // Mobile keyboards produce curly quotes; fold them so phrase filters
    // like o:"whenever you gain life" work the same on phone and desktop.
    const query = normalizeQuotes(rawQuery)
    setLastQuery(query)
    setSearchError(null)
    setSearchSource(null)

    // Persist the query so PWA restores it on reopen
    if (query.trim()) {
      localStorage.setItem('mtg-last-query', query)
    } else {
      localStorage.removeItem('mtg-last-query')
    }

    if (!query.trim()) {
      setAllResults([])
      setDisplayCount(50)
      return
    }

    setIsSearching(true)
    try {
      const { filters, nameSearch, requiresScryfall } = parseSearch(query)
      // Online mode (or no local DB available) → always go through Scryfall.
      const useScryfall = requiresScryfall || appMode === 'online' || dbStatus !== 'ready'

      // A few filters can only run against Scryfall's API. If we're offline
      // and the query needs one, say so instead of silently returning
      // nothing — everything else still works from the local database.
      if (useScryfall && !navigator.onLine) {
        setAllResults([])
        setDisplayCount(50)
        setSearchError({
          message: 'This search needs an internet connection',
          issues: requiresScryfall
            ? ['Your query uses a filter the offline database can\'t run (things like mv>=, is:reprint, order:, lang: or date>=).']
            : ['The app is in online mode, which sends every search to Scryfall.'],
          suggestions: requiresScryfall
            ? [
                'Offline-capable filters: name, t:, o:"...", c:, id:, cmc, pow, tou, r:, s:, f:, usd, year, a:, k:, is:, produces:',
                'Example: t:creature o:"whenever you gain life" c:white',
              ]
            : ['Switch to offline mode in Settings to search your downloaded card database.'],
        })
        return
      }

      let results
      try {
        if (useScryfall) {
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
      setDisplayCount(50)
    } finally {
      setIsSearching(false)
    }
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
    setDisplayCount(c => c + 50)
  }

  function handleCardClick(card) {
    // Go directly to full card detail view (skip quick view)
    handleViewFullDetails(card)
  }

  async function handleViewFullDetails(card) {
    // Close quick view and open full details
    setQuickViewCard(null)
    setCardLoading(true)

    // If grouped, we already have all printings (sorted by price)
    if (card._allPrintings) {
      setAllPrintings(card._allPrintings)
      // Select the cheapest version (first in the sorted array)
      setSelectedCard(card._allPrintings[0])
      setCardLoading(false)
      return
    }

    let printings = []
    try {
      if (dbStatus === 'ready') {
        // Fetch all printings using indexed query (much faster than filter)
        printings = await db.cards
          .where('name')
          .equals(card.name)
          .toArray()
      } else if (card.prints_search_uri) {
        // Online mode — Scryfall gives us a ready-made URL for every printing.
        const res = await fetch(card.prints_search_uri)
        const data = await res.json()
        if (data.data) {
          printings = data.data.map(c => ({
            ...c,
            image_small: c.image_uris?.small || c.card_faces?.[0]?.image_uris?.small,
            image_normal: c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal,
            image_large: c.image_uris?.large || c.card_faces?.[0]?.image_uris?.large,
            image_art_crop: c.image_uris?.art_crop || c.card_faces?.[0]?.image_uris?.art_crop
          }))
        }
      }
    } catch (err) {
      console.error('Printings fetch failed:', err)
    }

    if (printings.length === 0) {
      // Fallback: at least show the card the user clicked.
      printings = [card]
    }

    // Sort by price (cheapest first)
    printings.sort((a, b) => getCardPrice(a) - getCardPrice(b))
    setAllPrintings(printings)
    setSelectedCard(printings[0])
    setCardLoading(false)
  }

  // Cards stored on lists carry only minimal fields (id, name, images, note).
  // To open the same CardDetail modal that search results use, hydrate to a
  // full Scryfall record first — local DB if it has it, otherwise the API.
  async function handleListCardClick(listCard) {
    if (!listCard?.cardId) return
    setCardLoading(true)
    let fullCard = null
    try {
      fullCard = await db.cards.get(listCard.cardId)
      if (!fullCard) {
        const res = await fetch(`https://api.scryfall.com/cards/${listCard.cardId}`)
        if (res.ok) {
          const c = await res.json()
          fullCard = {
            ...c,
            image_small: c.image_uris?.small || c.card_faces?.[0]?.image_uris?.small,
            image_normal: c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal,
            image_large: c.image_uris?.large || c.card_faces?.[0]?.image_uris?.large,
            image_art_crop: c.image_uris?.art_crop || c.card_faces?.[0]?.image_uris?.art_crop
          }
        }
      }
    } catch (err) {
      console.error('Failed to hydrate list card:', err)
    }
    if (!fullCard) {
      setCardLoading(false)
      alert('Could not load card details. You may be offline.')
      return
    }
    await handleViewFullDetails(fullCard)
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
      <ThemeEffects
        themeName={currentTheme}
        effectMode={effectConfig.mode}
        effectLayers={effectConfig.layers}
        intensity={effectIntensity}
      />

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
                      ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
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
                    {syncing ? 'Syncing...' : hasUnsynced ? 'Sync Lists' : 'Lists Synced'}
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
          <div className={`${theme.bgSecondary} rounded-lg p-4 mb-6`}>
            <p className={theme.text}>Checking database...</p>
            {checkingSlow && (
              <>
                <p className={`${theme.textSecondary} text-sm mt-2`}>
                  Still working. A version upgrade rewrites the card index once,
                  which can take a minute on a phone. If the app was open in
                  another tab or window, close it — that blocks the upgrade.
                </p>
                <button
                  onClick={() => setAppMode('online')}
                  className={`mt-3 px-4 py-2 ${theme.bgTertiary} ${theme.text} rounded-lg text-sm font-medium`}
                >
                  Use online mode instead
                </button>
              </>
            )}
          </div>
        )}

        {/* Offline-mode-only welcome / download / error screens.
            In online mode the search view renders immediately and any
            background download surfaces as a smaller status pill below. */}
        {!showPriceOracle && appMode === 'offline' && dbStatus === 'empty' && (
          <div className={`${theme.bgSecondary} rounded-lg p-6 mb-6`}>
            <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
            <p className={`${theme.textSecondary} mb-4`}>
              {isStandalonePWA()
                ? 'Setting up offline mode — the card database is downloading.'
                : 'Download the card database to use this app offline.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownload}
                className={`px-6 py-3 ${theme.accent} text-white rounded-lg font-medium`}
              >
                Download Card Database
              </button>
              {!isStandalonePWA() && (
                <button
                  onClick={() => setAppMode('online')}
                  className={`px-6 py-3 ${theme.bgTertiary} rounded-lg font-medium`}
                >
                  Use online instead
                </button>
              )}
            </div>
          </div>
        )}

        {!showPriceOracle && appMode === 'offline' && dbStatus === 'downloading' && downloadProgress && (
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

        {!showPriceOracle && appMode === 'offline' && dbStatus === 'error' && (
          <div className="bg-red-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {dbError ? 'Database Unavailable' : 'Download Failed'}
            </h2>
            {dbError && <p className="text-red-100 text-sm mb-4">{dbError}</p>}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setDbStatus('checking'); checkDatabase() }}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium"
              >
                Retry
              </button>
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-red-700 text-white rounded-lg font-medium"
              >
                Re-download Database
              </button>
              <button
                onClick={() => setAppMode('online')}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium"
              >
                Use Online Mode
              </button>
            </div>
          </div>
        )}

        {syncNotice && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${theme.bgSecondary} border ${theme.border} flex items-center justify-between gap-3`}>
            <span className={theme.text}>{syncNotice}</span>
            <button
              onClick={() => setSyncNotice(null)}
              className={`${theme.textSecondary} text-lg leading-none px-1`}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {!showPriceOracle && (appMode === 'online' || dbStatus === 'ready') && (
          <>
            <div className="mb-6">
              <SearchBar
                onSearch={(q, opts) => { setCurrentBrowsingSet(null); handleSearch(q, opts); }}
                theme={theme}
                searchHistory={searchHistory}
                onHistorySelect={rerunSearch}
                initialQuery={lastQuery}
                isSearching={isSearching}
                useScryfallAutocomplete={appMode === 'online' || dbStatus !== 'ready'}
                offlineOnly={appMode === 'offline' && dbStatus === 'ready'}
                onFunSearch={(entry) => setFunSearchNote(entry)}
              />
              <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {appMode === 'online' ? (
                    <>
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                        Live via Scryfall
                      </span>
                      {dbStatus === 'ready' ? (
                        <button
                          onClick={() => setAppMode('offline')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${theme.bgTertiary} hover:opacity-80`}
                          title={`${cardCount.toLocaleString()} cards cached locally`}
                        >
                          ✓ Offline ready — switch to offline
                        </button>
                      ) : dbStatus === 'downloading' && downloadProgress ? (
                        <span className={`px-3 py-1 rounded-lg text-xs ${theme.bgTertiary}`}>
                          Downloading offline DB… {downloadProgress.percent}%
                        </span>
                      ) : (
                        <button
                          onClick={handleDownload}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${theme.bgTertiary} hover:opacity-80 border ${theme.border}`}
                        >
                          ⬇ Download for offline use
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <p className={`${theme.textSecondary} text-sm`}>
                        {cardCount.toLocaleString()} cards in database
                        <span className="opacity-70"> · {formatDbSync(lastDbSync)}</span>
                      </p>
                      <button
                        onClick={handleSync}
                        disabled={dbStatus === 'downloading'}
                        className={`px-3 py-1.5 ${theme.bgSecondary} border ${theme.border} rounded-lg text-sm font-medium hover:border-green-500 transition-colors flex items-center gap-2 disabled:opacity-60`}
                        title="Fetch cards released since the last update"
                      >
                        <span>⟳</span>
                        {dbStatus === 'downloading' ? 'Updating…' : 'Update Cards'}
                      </button>
                      <button
                        onClick={() => setShowSetsBrowser(true)}
                        className={`px-3 py-1.5 ${theme.bgSecondary} border ${theme.border} rounded-lg text-sm font-medium hover:border-purple-500 transition-colors flex items-center gap-2`}
                      >
                        <span>📦</span>
                        Browse Sets
                      </button>
                    </>
                  )}
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
                    setAllResults([])
                    setLastQuery('')
                  }}
                  className={`px-3 py-1.5 ${theme.bgTertiary} rounded-lg text-sm hover:opacity-80`}
                >
                  ✕ Clear
                </button>
              </div>
            )}

            {funSearchNote && (
              <div className={`${theme.bgSecondary} border ${theme.border} rounded-lg p-3 mb-4 flex items-start gap-3`}>
                <span className="text-xl leading-none">🎲</span>
                <div className="flex-1 min-w-0">
                  <p className={`${theme.text} font-medium text-sm`}>{funSearchNote.label}</p>
                  <p className={`${theme.textSecondary} text-xs mt-0.5`}>{funSearchNote.blurb}</p>
                </div>
                <button
                  onClick={() => setFunSearchNote(null)}
                  className={`${theme.textSecondary} text-lg leading-none px-1`}
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}

            {/* Results count */}
            {allResults.length > 0 && (
              <p className={`${theme.textSecondary} text-sm mb-4 flex items-center gap-2 flex-wrap`}>
                <span>
                  Showing {displayedResults.length} of {processedResults.length} results
                  {typeFilter.length > 0 && processedResults.length !== allResults.length && (
                    <span className={`${theme.textSecondary}`}> (filtered from {allResults.length})</span>
                  )}
                </span>
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

            {/* Sort + type filter bar — collapsed by default so results start
                right below the search box; the toggle mirrors Syntax Help. */}
            {allResults.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowSortBar(!showSortBar)}
                  className={`w-full flex items-center justify-between px-3 py-2 ${theme.bgSecondary} border ${theme.border} rounded-lg text-sm font-medium ${theme.text}`}
                >
                  <span className="flex items-center gap-2">
                    <span>⇅</span>
                    Sort &amp; Filter
                    {activeResultFilterCount > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${theme.accent} text-white`}>
                        {activeResultFilterCount}
                      </span>
                    )}
                  </span>
                  <span className={theme.textSecondary}>{showSortBar ? '▲' : '▼'}</span>
                </button>
              </div>
            )}

            {allResults.length > 0 && showSortBar && (
              <div className={`${theme.bgSecondary} rounded-lg p-3 mb-4 border ${theme.border} space-y-3`}>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className={`${theme.textSecondary} text-sm font-medium`}>Sort:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`${theme.bgTertiary} ${theme.text} text-sm rounded px-2 py-1 border ${theme.border} focus:outline-none`}
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {(sortBy !== DEFAULT_SORT || typeFilter.length > 0) && (
                    <button
                      onClick={resetResultFilters}
                      className={`px-2 py-1 ${theme.bgTertiary} text-xs rounded hover:opacity-80`}
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`${theme.textSecondary} text-sm font-medium mr-1`}>Types:</span>
                  {CARD_TYPES.map(t => {
                    const active = typeFilter.includes(t)
                    return (
                      <button
                        key={t}
                        onClick={() => toggleTypeFilter(t)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                          active
                            ? `${theme.accent} text-white border-transparent`
                            : `${theme.bgTertiary} ${theme.textSecondary} ${theme.border} hover:opacity-80`
                        }`}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayedResults.map(card => {
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
                        className={`w-full rounded-lg shadow-lg group-hover:scale-105 transition-transform card-image-saveable ${isFlipped ? 'scale-x-100' : ''}`}
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
            {displayedResults.length > 0 && displayedResults.length < processedResults.length && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMoreResults}
                  className={`px-8 py-3 ${theme.accent} text-white rounded-lg font-medium shadow-lg ${theme.glow || ''}`}
                >
                  Load More ({processedResults.length - displayedResults.length} remaining)
                </button>
              </div>
            )}

            {allResults.length === 0 && !searchError && !lastQuery && (
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

      {/* PWA update ribbon — appears on its own when a newer build has
          downloaded. Tapping Update swaps in the new service worker and
          reloads; nothing is lost, lists and the card DB are untouched. */}
      {needRefresh && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[100] p-3 pointer-events-none"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <div className="pointer-events-auto mx-auto max-w-md bg-blue-600 text-white p-4 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">New version available</p>
                <p className="text-sm text-blue-100">
                  {applyingUpdate ? 'Updating…' : 'Your lists and card database are kept'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setNeedRefresh(false)}
                  disabled={applyingUpdate}
                  className="px-3 py-2 text-sm text-blue-100 underline disabled:opacity-50"
                >
                  Later
                </button>
                <button
                  onClick={() => {
                    setApplyingUpdate(true)
                    updateServiceWorker(true)
                  }}
                  disabled={applyingUpdate}
                  className="px-4 py-3 min-h-[44px] bg-white text-blue-600 rounded-lg font-bold text-sm whitespace-nowrap disabled:opacity-70"
                >
                  {applyingUpdate ? 'Updating…' : 'Update Now'}
                </button>
              </div>
            </div>
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
          syncing={syncing}
          hasUnsynced={hasUnsynced}
          onSyncLists={handleListSync}
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
          user={user}
          syncing={syncing}
          hasUnsynced={hasUnsynced}
          onSyncLists={handleListSync}
        />
      )}

      {cardLoading && !selectedCard && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center">
          <div className={`${theme.bgSecondary} rounded-xl p-8 text-center shadow-2xl`}>
            <div className="text-5xl animate-bounce mb-4">🧙</div>
            <p className={`${theme.textSecondary}`}>Summoning card details...</p>
          </div>
        </div>
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
          syncing={syncing}
          hasUnsynced={hasUnsynced}
          onSyncLists={handleListSync}
        />
      )}

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}

      {showLists && user && (
        <MyLists
          userId={user.uid}
          onClose={() => { setShowLists(false); checkSyncStatus(); }}
          onCardClick={handleListCardClick}
        />
      )}

      {showSettings && (
        <Settings
          currentTheme={currentTheme}
          effectConfig={effectConfig}
          onEffectConfigChange={(next) => { saveEffectLayers(next); setEffectConfig(next) }}
          effectIntensity={effectIntensity}
          onEffectIntensityChange={(next) => { saveIntensity(next); setEffectIntensity(next) }}
          onThemeChange={setCurrentTheme}
          onClose={() => setShowSettings(false)}
          cardCount={cardCount}
          onSync={handleSync}
          groupByName={groupByName}
          onGroupByNameChange={setGroupByName}
          appMode={appMode}
          onAppModeChange={setAppMode}
          dbStatus={dbStatus}
          onDownload={handleDownload}
          lastDbSyncLabel={formatDbSync(lastDbSync)}
          onCheckForUpdate={handleCheckForUpdate}
          checkingUpdate={checkingUpdate}
          buildTime={import.meta.env.VITE_BUILD_TIME}
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
            style={historySwipe.swipeStyle}
            {...historySwipe.swipeHandlers}
          >
            <SwipeHandle />
            {/* Close sits alone on the right; Clear All lives down in the
                footer so a mis-tap can't wipe the history. */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <div className="min-w-0">
                <h2 className={`text-lg font-bold ${theme.text}`}>Search History</h2>
                <p className={`${theme.textSecondary} text-xs mt-0.5`}>
                  {user
                    ? `Synced ${lastHistorySync ? formatTimeAgo(new Date(lastHistorySync).getTime()) : 'never'}`
                    : 'On this device only'}
                </p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className={`w-11 h-11 flex items-center justify-center rounded-full ${theme.bgTertiary} ${theme.textSecondary} hover:text-white text-2xl leading-none`}
                aria-label="Close search history"
              >
                &times;
              </button>
            </div>

            <div className="p-3 border-b border-gray-700 space-y-2">
              {user ? (
                <button
                  onClick={handleHistorySync}
                  disabled={historySyncing}
                  className={`w-full py-3 rounded-lg text-sm font-medium ${theme.accent} text-white disabled:opacity-60 flex items-center justify-center gap-2`}
                >
                  <span className={historySyncing ? 'animate-spin' : ''}>⟳</span>
                  {historySyncing ? 'Syncing…' : 'Sync History Across Devices'}
                </button>
              ) : (
                <button
                  onClick={() => { setShowHistory(false); setShowAuth(true) }}
                  className={`w-full py-3 rounded-lg text-sm font-medium ${theme.bgTertiary} ${theme.text}`}
                >
                  Sign in to sync history across devices
                </button>
              )}
              {historySyncNote && (
                <p className={`${theme.textSecondary} text-xs text-center`}>{historySyncNote}</p>
              )}
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

            {searchHistory.length > 0 && (
              <div className="border-t border-gray-700 p-3">
                <button
                  onClick={clearHistory}
                  className="w-full py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Clear All History
                </button>
              </div>
            )}
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
