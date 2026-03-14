import { useState, useEffect } from 'react'
import {
  getCachedPriceOracleData,
  removeFromWatchlistCached,
  addAlertCached,
  removeAlertCached,
  toggleAlertCached
} from '../lib/priceOracleCache'

const SCRYFALL_API = 'https://api.scryfall.com'

// Trending categories with Scryfall queries - focused on budget & commander
const trendingCategories = [
  // Budget Categories
  { id: 'super-budget', name: 'Super Budget (<$1)', icon: '🪙', query: 'usd<1 usd>0.25', order: 'edhrec', dir: 'desc', group: 'Budget' },
  { id: 'under-2', name: 'Under $2', icon: '💵', query: 'usd<2 usd>0.5', order: 'edhrec', dir: 'desc', group: 'Budget' },
  { id: 'under-5', name: 'Under $5', icon: '💰', query: 'usd<5 usd>1', order: 'edhrec', dir: 'desc', group: 'Budget' },
  { id: 'under-10', name: 'Under $10', icon: '💸', query: 'usd<10 usd>3', order: 'edhrec', dir: 'desc', group: 'Budget' },
  { id: 'under-20', name: 'Under $20', icon: '💎', query: 'usd<20 usd>5', order: 'edhrec', dir: 'desc', group: 'Budget' },

  // Commander Categories
  { id: 'edh-staples', name: 'EDH Staples', icon: '👑', query: 'f:commander', order: 'edhrec', dir: 'desc', group: 'Commander' },
  { id: 'edh-budget', name: 'EDH Budget (<$5)', icon: '🎯', query: 'f:commander usd<5 usd>0.5', order: 'edhrec', dir: 'desc', group: 'Commander' },
  { id: 'edh-mid', name: 'EDH Mid ($5-$20)', icon: '⚔️', query: 'f:commander usd<20 usd>5', order: 'edhrec', dir: 'desc', group: 'Commander' },
  { id: 'commanders', name: 'Popular Commanders', icon: '🏰', query: 'is:commander', order: 'edhrec', dir: 'desc', group: 'Commander' },
  { id: 'edh-new', name: 'New EDH Cards', icon: '✨', query: 'f:commander year>=2024', order: 'edhrec', dir: 'desc', group: 'Commander' },

  // Recent Sets
  { id: 'new-2025', name: '2025 Releases', icon: '🆕', query: 'year=2025', order: 'released', dir: 'desc', group: 'Sets' },
  { id: 'new-2024', name: '2024 Cards', icon: '📅', query: 'year=2024', order: 'edhrec', dir: 'desc', group: 'Sets' },
  { id: 'new-mythics', name: 'New Mythics', icon: '🌈', query: 'r:mythic year>=2024', order: 'released', dir: 'desc', group: 'Sets' },
  { id: 'new-rares', name: 'New Rares', icon: '🔶', query: 'r:rare year>=2024', order: 'edhrec', dir: 'desc', group: 'Sets' },

  // Card Types (Budget Focus)
  { id: 'creatures-budget', name: 'Creatures (<$5)', icon: '🐉', query: 't:creature usd<5 usd>0.5', order: 'edhrec', dir: 'desc', group: 'Types' },
  { id: 'instants-budget', name: 'Instants (<$5)', icon: '⚡', query: 't:instant usd<5 usd>0.25', order: 'edhrec', dir: 'desc', group: 'Types' },
  { id: 'sorceries-budget', name: 'Sorceries (<$5)', icon: '📜', query: 't:sorcery usd<5 usd>0.25', order: 'edhrec', dir: 'desc', group: 'Types' },
  { id: 'enchantments-budget', name: 'Enchantments (<$5)', icon: '🔮', query: 't:enchantment usd<5 usd>0.5', order: 'edhrec', dir: 'desc', group: 'Types' },
  { id: 'artifacts-budget', name: 'Artifacts (<$5)', icon: '⚙️', query: 't:artifact usd<5 usd>0.5', order: 'edhrec', dir: 'desc', group: 'Types' },
  { id: 'lands-budget', name: 'Lands (<$10)', icon: '🏔️', query: 't:land usd<10 usd>0.5', order: 'edhrec', dir: 'desc', group: 'Types' },

  // Colors (Budget Focus)
  { id: 'white-budget', name: 'White (<$5)', icon: '⬜', query: 'c:white usd<5 usd>0.5', order: 'edhrec', dir: 'desc', group: 'Colors' },
  { id: 'blue-budget', name: 'Blue (<$5)', icon: '🔵', query: 'c:blue usd<5 usd>0.5', order: 'edhrec', dir: 'desc', group: 'Colors' },
  { id: 'black-budget', name: 'Black (<$5)', icon: '⚫', query: 'c:black usd<5 usd>0.5', order: 'edhrec', dir: 'desc', group: 'Colors' },
  { id: 'red-budget', name: 'Red (<$5)', icon: '🔴', query: 'c:red usd<5 usd>0.5', order: 'edhrec', dir: 'desc', group: 'Colors' },
  { id: 'green-budget', name: 'Green (<$5)', icon: '🟢', query: 'c:green usd<5 usd>0.5', order: 'edhrec', dir: 'desc', group: 'Colors' },
  { id: 'multicolor-budget', name: 'Multicolor (<$5)', icon: '🌀', query: 'c>=2 usd<5 usd>0.5', order: 'edhrec', dir: 'desc', group: 'Colors' },
]

// Group categories for display
const categoryGroups = ['Budget', 'Commander', 'Sets', 'Types', 'Colors']

function PriceOracle({ user, theme, onCardClick }) {
  const [activeTab, setActiveTab] = useState('trending')
  const [watchlist, setWatchlist] = useState([])
  const [alerts, setAlerts] = useState([])
  const [trending, setTrending] = useState([])
  const [trendingCategory, setTrendingCategory] = useState('edh-staples')
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [trendingLoadingMore, setTrendingLoadingMore] = useState(false)
  const [nextPageUrl, setNextPageUrl] = useState(null)
  const [totalLoaded, setTotalLoaded] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)

  // Alert form state
  const [alertForm, setAlertForm] = useState({
    name: '',
    type: 'price_below',
    threshold: '',
    cardId: '',
    cardName: ''
  })

  useEffect(() => {
    if (user) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadTrending(trendingCategory)
  }, [])

  useEffect(() => {
    if (activeTab === 'trending') {
      loadTrending(trendingCategory)
    }
  }, [trendingCategory])

  async function loadData() {
    try {
      // Use cached data - NO Firebase call!
      const data = getCachedPriceOracleData()
      setWatchlist(data.watchlist || [])
      setAlerts(data.alerts || [])
    } catch (e) {
      console.error('Error loading Price Oracle data:', e)
    }
    setLoading(false)
  }

  async function loadTrending(categoryId, reset = true) {
    const category = trendingCategories.find(c => c.id === categoryId) || trendingCategories[0]

    if (reset) {
      setTrendingLoading(true)
      setTrending([])
      setNextPageUrl(null)
      setTotalLoaded(0)
    }

    try {
      const response = await fetch(
        `${SCRYFALL_API}/cards/search?q=${encodeURIComponent(category.query)}&order=${category.order}&dir=${category.dir}&unique=cards`
      )
      const data = await response.json()
      if (data.data) {
        setTrending(data.data)
        setTotalLoaded(data.data.length)
        setNextPageUrl(data.has_more ? data.next_page : null)
      } else {
        setTrending([])
        setNextPageUrl(null)
      }
    } catch (e) {
      console.error('Error loading trending:', e)
      setTrending([])
      setNextPageUrl(null)
    }
    setTrendingLoading(false)
  }

  async function loadMoreTrending() {
    if (!nextPageUrl || trendingLoadingMore) return

    setTrendingLoadingMore(true)
    try {
      const response = await fetch(nextPageUrl)
      const data = await response.json()
      if (data.data) {
        setTrending(prev => [...prev, ...data.data])
        setTotalLoaded(prev => prev + data.data.length)
        setNextPageUrl(data.has_more ? data.next_page : null)
      }
    } catch (e) {
      console.error('Error loading more:', e)
    }
    setTrendingLoadingMore(false)
  }

  async function handleRemoveFromWatchlist(cardId) {
    if (!user) return
    await removeFromWatchlistCached(user.uid, cardId)
    setWatchlist(prev => prev.filter(c => c.id !== cardId))
  }

  function openAlertModal(card = null) {
    if (card) {
      setAlertForm({
        name: `Alert: ${card.name}`,
        type: 'price_below',
        threshold: '',
        cardId: card.id,
        cardName: card.name
      })
    } else {
      setAlertForm({
        name: '',
        type: 'price_below',
        threshold: '',
        cardId: '',
        cardName: ''
      })
    }
    setShowAlertModal(true)
  }

  async function handleSaveAlert() {
    if (!user || !alertForm.name) return

    const alert = {
      name: alertForm.name,
      type: alertForm.type,
      threshold: parseFloat(alertForm.threshold) || 0,
      cardId: alertForm.cardId,
      cardName: alertForm.cardName,
      scope: alertForm.cardId ? 'specific' : 'watchlist'
    }

    const newAlertId = await addAlertCached(user.uid, alert)
    // Update local state with the new alert
    setAlerts(prev => [...prev, { ...alert, id: newAlertId, enabled: true, created: new Date().toISOString() }])
    setShowAlertModal(false)
  }

  async function handleToggleAlert(alertId) {
    if (!user) return
    await toggleAlertCached(user.uid, alertId)
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, enabled: !a.enabled } : a
    ))
  }

  async function handleDeleteAlert(alertId) {
    if (!user) return
    await removeAlertCached(user.uid, alertId)
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  function getPrice(card) {
    if (card.prices?.usd) return `$${card.prices.usd}`
    if (card.prices?.usd_foil) return `$${card.prices.usd_foil}`
    if (card.priceStr) return card.priceStr
    return 'N/A'
  }

  function getCardImage(card) {
    return card.image || card.image_small || card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || ''
  }

  const alertTypes = {
    price_above: 'Price above $',
    price_below: 'Price below $',
    pct_up: 'Up by %',
    pct_down: 'Down by %'
  }

  if (loading) {
    return (
      <div className={`p-8 text-center ${theme.textSecondary}`}>
        <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-4"></div>
        Loading Price Oracle...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-yellow-400">◆</span>
          Price Oracle
        </h2>
        {!user && (
          <div className={`px-4 py-2 ${theme.bgSecondary} rounded-lg text-sm ${theme.textSecondary}`}>
            Sign in to save watchlist & alerts
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: 'watchlist', label: 'Watchlist', icon: '👁️', count: watchlist.length },
          { id: 'alerts', label: 'Alerts', icon: '🔔', count: alerts.filter(a => a.enabled).length },
          { id: 'trending', label: 'Trending', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? `${theme.accent} text-white`
                : `${theme.bgSecondary} ${theme.textSecondary} hover:opacity-80`
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Watchlist Tab */}
      {activeTab === 'watchlist' && (
        <div>
          {watchlist.length === 0 ? (
            <div className={`text-center py-12 ${theme.textSecondary}`}>
              <div className="text-5xl mb-4 opacity-50">👁️</div>
              <h3 className="text-lg font-semibold mb-2">No cards in watchlist</h3>
              <p className="text-sm">Search for cards and click "Track Price" to add them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlist.map(card => (
                <div
                  key={card.id}
                  className={`${theme.bgSecondary} rounded-lg p-4 flex gap-4 border border-transparent hover:border-purple-500 transition-colors`}
                >
                  <img
                    src={getCardImage(card)}
                    alt={card.name}
                    className="w-20 h-28 object-cover rounded cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => onCardClick?.(card)}
                  />
                  <div className="flex-1 flex flex-col">
                    <h4 className="font-semibold">{card.name}</h4>
                    <p className={`text-sm ${theme.textSecondary}`}>{card.setName}</p>
                    <p className="text-xl font-bold text-yellow-400 mt-auto">{card.priceStr || 'N/A'}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => openAlertModal(card)}
                        className="px-3 py-1 bg-yellow-500 text-black rounded text-sm font-medium hover:bg-yellow-400"
                      >
                        🔔 Alert
                      </button>
                      <button
                        onClick={() => handleRemoveFromWatchlist(card.id)}
                        className="px-3 py-1 border border-red-500 text-red-400 rounded text-sm hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => openAlertModal()}
              className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400"
            >
              + New Alert
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className={`text-center py-12 ${theme.textSecondary}`}>
              <div className="text-5xl mb-4 opacity-50">🔔</div>
              <h3 className="text-lg font-semibold mb-2">No alerts set</h3>
              <p className="text-sm">Create alerts to track price changes</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`${theme.bgSecondary} rounded-lg p-4 border ${
                    alert.enabled ? 'border-green-500/30' : 'border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{alert.name}</h4>
                    <button
                      onClick={() => handleToggleAlert(alert.id)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        alert.enabled ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        alert.enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 ${theme.bgTertiary} rounded text-xs`}>
                      {alertTypes[alert.type]}{alert.threshold}
                    </span>
                    {alert.cardName && (
                      <span className={`px-2 py-1 ${theme.bgTertiary} rounded text-xs`}>
                        {alert.cardName}
                      </span>
                    )}
                    {alert.scope === 'watchlist' && (
                      <span className={`px-2 py-1 ${theme.bgTertiary} rounded text-xs`}>
                        Watchlist
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="text-red-400 text-sm hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trending Tab */}
      {activeTab === 'trending' && (
        <div>
          {/* Category Selector - Grouped */}
          <div className="mb-6 space-y-4">
            {categoryGroups.map(groupName => (
              <div key={groupName}>
                <p className={`${theme.textSecondary} text-xs uppercase tracking-wide mb-2`}>{groupName}</p>
                <div className="flex flex-wrap gap-2">
                  {trendingCategories.filter(c => c.group === groupName).map(category => (
                    <button
                      key={category.id}
                      onClick={() => setTrendingCategory(category.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        trendingCategory === category.id
                          ? `${theme.accent} text-white scale-105`
                          : `${theme.bgTertiary} ${theme.textSecondary} hover:opacity-80`
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Current Category Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {trendingCategories.find(c => c.id === trendingCategory)?.icon}
              </span>
              <h3 className={`text-lg font-semibold ${theme.text}`}>
                {trendingCategories.find(c => c.id === trendingCategory)?.name}
              </h3>
              {(trendingLoading || trendingLoadingMore) && (
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
              )}
            </div>
            {totalLoaded > 0 && (
              <p className={`${theme.textSecondary} text-sm`}>
                {totalLoaded} cards loaded
              </p>
            )}
          </div>

          {/* Cards Grid */}
          {trendingLoading ? (
            <div className={`py-12 text-center ${theme.textSecondary}`}>
              <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading cards...
            </div>
          ) : trending.length === 0 ? (
            <div className={`py-12 text-center ${theme.textSecondary}`}>
              <div className="text-4xl mb-3 opacity-50">🔍</div>
              <p>No cards found for this category</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {trending.map(card => (
                  <div
                    key={card.id}
                    className="group cursor-pointer"
                    onClick={() => onCardClick?.(card)}
                  >
                    <div className="relative">
                      <img
                        src={card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal}
                        alt={card.name}
                        className="w-full rounded-lg shadow-lg group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/80 text-green-400 text-xs px-2 py-1 rounded font-mono">
                        {getPrice(card)}
                      </div>
                    </div>
                    <p className={`mt-2 text-sm truncate ${theme.textSecondary}`}>{card.name}</p>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {nextPageUrl && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={loadMoreTrending}
                    disabled={trendingLoadingMore}
                    className={`px-8 py-3 ${theme.accent} text-white rounded-lg font-medium shadow-lg ${theme.glow || ''} disabled:opacity-50 flex items-center gap-2`}
                  >
                    {trendingLoadingMore ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Loading...
                      </>
                    ) : (
                      <>Load More Cards</>
                    )}
                  </button>
                </div>
              )}

              {/* End of results message */}
              {!nextPageUrl && totalLoaded > 0 && (
                <p className={`text-center mt-6 ${theme.textSecondary} text-sm`}>
                  All {totalLoaded} cards loaded
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setShowAlertModal(false)}
        >
          <div
            className={`${theme.bgSecondary} rounded-xl max-w-md w-full p-6`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">
              {alertForm.cardName ? `Alert: ${alertForm.cardName}` : 'New Alert'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm ${theme.textSecondary} mb-1`}>Alert Name</label>
                <input
                  type="text"
                  value={alertForm.name}
                  onChange={e => setAlertForm({ ...alertForm, name: e.target.value })}
                  className={`w-full px-4 py-2 ${theme.bgTertiary} border border-gray-600 rounded-lg focus:border-purple-500 outline-none`}
                  placeholder="e.g., Cheap Mythics Watch"
                />
              </div>

              <div>
                <label className={`block text-sm ${theme.textSecondary} mb-1`}>Alert When</label>
                <select
                  value={alertForm.type}
                  onChange={e => setAlertForm({ ...alertForm, type: e.target.value })}
                  className={`w-full px-4 py-2 ${theme.bgTertiary} border border-gray-600 rounded-lg focus:border-purple-500 outline-none`}
                >
                  <option value="price_above">Price goes above $X</option>
                  <option value="price_below">Price drops below $X</option>
                  <option value="pct_up">Increases by X%</option>
                  <option value="pct_down">Decreases by X%</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm ${theme.textSecondary} mb-1`}>
                  {alertForm.type.includes('pct') ? 'Percentage' : 'Price ($)'}
                </label>
                <input
                  type="number"
                  value={alertForm.threshold}
                  onChange={e => setAlertForm({ ...alertForm, threshold: e.target.value })}
                  className={`w-full px-4 py-2 ${theme.bgTertiary} border border-gray-600 rounded-lg focus:border-purple-500 outline-none`}
                  placeholder={alertForm.type.includes('pct') ? '20' : '10.00'}
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAlertModal(false)}
                className={`flex-1 py-2 ${theme.bgTertiary} rounded-lg font-medium`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAlert}
                className="flex-1 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PriceOracle
