import { useState, useEffect } from 'react'
import {
  getCachedPriceOracleData,
  removeFromWatchlistCached,
  addAlertCached,
  removeAlertCached,
  toggleAlertCached
} from '../lib/priceOracleCache'

function PriceOracle({ user, theme, onCardClick }) {
  const [activeTab, setActiveTab] = useState('watchlist')
  const [watchlist, setWatchlist] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAlertModal, setShowAlertModal] = useState(false)

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
      <div className="flex gap-2 border-b border-gray-700 pb-2 flex-wrap items-center">
        {[
          { id: 'watchlist', label: 'Watchlist', icon: '👁️', count: watchlist.length },
          { id: 'alerts', label: 'Alerts', icon: '🔔', count: alerts.filter(a => a.enabled).length }
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
        <a
          href="https://biggitybrolo.github.io/mtgpricetracker/"
          target="_blank"
          rel="noopener noreferrer"
          className={`ml-auto px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400`}
        >
          <span>📈</span>
          Go to Price Oracle
          <span>→</span>
        </a>
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
