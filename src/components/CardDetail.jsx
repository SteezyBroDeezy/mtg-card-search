import { useState, useEffect } from 'react'
import SaveToListModal from './SaveToListModal'
import {
  isInWatchlistCached,
  addToWatchlistCached,
  removeFromWatchlistCached
} from '../lib/priceOracleCache'

function CardDetail({ card, allPrintings = [], onClose, onSelectPrinting, user, theme, onListUpdated }) {
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [currentFace, setCurrentFace] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [showLegalities, setShowLegalities] = useState(false)
  const [showAllPrintings, setShowAllPrintings] = useState(true)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [watchlistError, setWatchlistError] = useState(null)

  useEffect(() => {
    if (user && card) {
      // Use cached check - NO Firebase call!
      setInWatchlist(isInWatchlistCached(card.id))
    }
  }, [user, card])

  if (!card) return null

  const hasMultipleFaces = card.card_faces && card.card_faces.length > 1
  const activeFace = hasMultipleFaces ? card.card_faces[currentFace] : null

  function handleSaveClick() {
    if (!user) {
      alert('Please log in to save cards')
      return
    }
    setShowSaveModal(true)
  }

  function flipCard() {
    if (!hasMultipleFaces) return
    setIsFlipping(true)
    setTimeout(() => {
      setCurrentFace(prev => (prev + 1) % card.card_faces.length)
      setIsFlipping(false)
    }, 150)
  }

  async function handleWatchlistToggle() {
    if (!user) {
      alert('Please log in to track prices')
      return
    }

    setWatchlistLoading(true)
    setWatchlistError(null)
    try {
      if (inWatchlist) {
        await removeFromWatchlistCached(user.uid, card.id)
        setInWatchlist(false)
      } else {
        await addToWatchlistCached(user.uid, card)
        setInWatchlist(true)
      }
    } catch (e) {
      console.error('Watchlist error:', e)
      const msg = e.code === 'permission-denied'
        ? 'Firestore rules block priceOracleUsers. Update your security rules.'
        : e.message || 'Failed to update watchlist'
      setWatchlistError(msg)
    }
    setWatchlistLoading(false)
  }

  // Get all price displays (USD only - TCGPlayer)
  function getAllPrices(c) {
    const prices = []

    if (c.prices?.usd) {
      prices.push({ source: 'TCGPlayer', price: `$${c.prices.usd}`, type: 'Regular', color: 'text-green-400' })
    }
    if (c.prices?.usd_foil) {
      prices.push({ source: 'TCGPlayer', price: `$${c.prices.usd_foil}`, type: 'Foil', color: 'text-purple-400' })
    }
    if (c.prices?.usd_etched) {
      prices.push({ source: 'TCGPlayer', price: `$${c.prices.usd_etched}`, type: 'Etched', color: 'text-blue-400' })
    }

    return prices
  }

  // Get best price for display (USD only)
  function getBestPrice(c) {
    if (c.prices?.usd) return { price: `$${c.prices.usd}`, type: 'USD' }
    if (c.prices?.usd_foil) return { price: `$${c.prices.usd_foil}`, type: 'Foil' }
    if (c.prices?.usd_etched) return { price: `$${c.prices.usd_etched}`, type: 'Etched' }
    return { price: 'No price', type: '' }
  }

  // Get current display values - handle both local DB format and Scryfall API format
  const displayImage = activeFace?.image_large || activeFace?.image_normal ||
                       activeFace?.image_uris?.large || activeFace?.image_uris?.normal ||
                       card.image_large || card.image_normal ||
                       card.image_uris?.large || card.image_uris?.normal
  const displayName = activeFace?.name || card.name
  const displayType = activeFace?.type_line || card.type_line
  const displayManaCost = activeFace?.mana_cost || card.mana_cost
  const displayOracleText = activeFace?.oracle_text || card.oracle_text
  const displayPower = activeFace?.power || card.power
  const displayToughness = activeFace?.toughness || card.toughness
  const displayLoyalty = activeFace?.loyalty || card.loyalty
  const displayDefense = activeFace?.defense || card.defense

  // Format legalities for display
  const majorFormats = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper']
  const legalFormats = majorFormats.filter(f => card.legalities?.[f] === 'legal')

  const allPrices = getAllPrices(card)
  const bestPrice = getBestPrice(card)

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <div
          className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold">{card.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
              &times;
            </button>
          </div>

          <div className="p-4 flex flex-col lg:flex-row gap-6">
            {/* Left Column - Card Image */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div
                className={`relative cursor-pointer transition-transform duration-150 ${
                  isFlipping ? 'scale-95 opacity-80' : ''
                } ${hasMultipleFaces ? 'hover:scale-105' : ''}`}
                onClick={hasMultipleFaces ? flipCard : undefined}
              >
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={displayName}
                    className="w-full max-w-[300px] rounded-lg shadow-xl"
                  />
                ) : (
                  <div className="w-full max-w-[300px] aspect-[488/680] bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}

                {/* Flip indicator */}
                {hasMultipleFaces && (
                  <div className="absolute bottom-2 right-2 bg-black/70 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Flip</span>
                  </div>
                )}
              </div>

              {/* Face selector */}
              {hasMultipleFaces && (
                <div className="flex gap-2 mt-3">
                  {card.card_faces.map((face, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentFace(idx)}
                      className={`px-3 py-1 rounded text-sm ${
                        currentFace === idx
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {face.name.split(' //')[0]}
                    </button>
                  ))}
                </div>
              )}

              {/* Watchlist Button */}
              <button
                onClick={handleWatchlistToggle}
                disabled={watchlistLoading}
                className={`mt-4 px-4 py-2 ${
                  inWatchlist
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50`}
              >
                <span>{inWatchlist ? '✓' : '◆'}</span>
                {watchlistLoading ? 'Saving...' : inWatchlist ? 'In Watchlist' : 'Track Price'}
              </button>
              {watchlistError && (
                <p className="text-red-400 text-xs mt-1 max-w-[300px] text-center">{watchlistError}</p>
              )}
            </div>

            {/* Right Column - Card Details */}
            <div className="flex-1 space-y-4">
              {hasMultipleFaces && (
                <div>
                  <p className="text-gray-400 text-sm">Face</p>
                  <p className="text-lg font-semibold">{displayName}</p>
                </div>
              )}

              <div>
                <p className="text-gray-400 text-sm">Type</p>
                <p>{displayType}</p>
              </div>

              {displayManaCost && (
                <div>
                  <p className="text-gray-400 text-sm">Mana Cost</p>
                  <p className="text-lg">{displayManaCost}</p>
                </div>
              )}

              {displayOracleText && (
                <div>
                  <p className="text-gray-400 text-sm">Text</p>
                  <p className="whitespace-pre-line">{displayOracleText}</p>
                </div>
              )}

              {/* Power / Toughness */}
              {(displayPower || displayToughness) && (
                <div>
                  <p className="text-gray-400 text-sm">Power / Toughness</p>
                  <p className="text-2xl font-bold">{displayPower} / {displayToughness}</p>
                </div>
              )}

              {/* Loyalty / Defense */}
              {displayLoyalty && (
                <div>
                  <p className="text-gray-400 text-sm">Starting Loyalty</p>
                  <p className="text-2xl font-bold">{displayLoyalty}</p>
                </div>
              )}
              {displayDefense && (
                <div>
                  <p className="text-gray-400 text-sm">Defense</p>
                  <p className="text-2xl font-bold">{displayDefense}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Set</p>
                  <p>{card.set_name} ({card.set.toUpperCase()})</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Rarity</p>
                  <p className={`capitalize ${
                    card.rarity === 'mythic' ? 'text-orange-400' :
                    card.rarity === 'rare' ? 'text-yellow-400' :
                    card.rarity === 'uncommon' ? 'text-gray-300' :
                    'text-gray-500'
                  }`}>{card.rarity}</p>
                </div>
              </div>

              {/* Multi-Source Prices */}
              <div className="p-4 bg-gray-900 rounded-lg">
                <p className="text-gray-400 text-sm mb-3">Prices</p>
                {allPrices.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {allPrices.map((p, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">
                          {p.source} <span className="text-gray-500">({p.type})</span>
                        </span>
                        <span className={`font-bold ${p.color}`}>{p.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No pricing data available</p>
                )}
              </div>

              {card.artist && (
                <div>
                  <p className="text-gray-400 text-sm">Artist</p>
                  <p className="italic">{card.artist}</p>
                </div>
              )}

              {card.flavor_text && (
                <div>
                  <p className="text-gray-400 text-sm">Flavor</p>
                  <p className="italic text-gray-300">{card.flavor_text}</p>
                </div>
              )}

              {card.keywords && card.keywords.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm">Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {card.keywords.map(kw => (
                      <span key={kw} className="px-2 py-0.5 bg-gray-700 rounded text-sm">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Format Legality */}
              <div>
                <button
                  onClick={() => setShowLegalities(!showLegalities)}
                  className="text-gray-400 text-sm hover:text-white flex items-center gap-1"
                >
                  Format Legality
                  <svg className={`w-4 h-4 transition-transform ${showLegalities ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {!showLegalities && legalFormats.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {legalFormats.map(f => (
                      <span key={f} className="px-2 py-0.5 bg-green-900/50 text-green-400 rounded text-xs capitalize">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
                {showLegalities && card.legalities && (
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {Object.entries(card.legalities).map(([format, status]) => (
                      <div key={format} className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${
                          status === 'legal' ? 'bg-green-500' :
                          status === 'banned' ? 'bg-red-500' :
                          status === 'restricted' ? 'bg-yellow-500' :
                          'bg-gray-600'
                        }`} />
                        <span className="capitalize text-gray-300">{format}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {card.reserved && (
                  <span className="px-2 py-1 bg-amber-900/50 text-amber-400 rounded text-xs">
                    Reserved List
                  </span>
                )}
                {card.edhrec_rank && (
                  <span className="px-2 py-1 bg-purple-900/50 text-purple-400 rounded text-xs">
                    EDHREC #{card.edhrec_rank.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* All Printings Section */}
          {allPrintings.length > 1 && (
            <div className="border-t border-gray-700 p-4">
              <button
                onClick={() => setShowAllPrintings(!showAllPrintings)}
                className="flex items-center gap-2 text-lg font-semibold mb-3"
              >
                All Printings ({allPrintings.length})
                <svg className={`w-5 h-5 transition-transform ${showAllPrintings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showAllPrintings && (
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {allPrintings.map((printing, idx) => {
                    const pPrice = getBestPrice(printing)
                    const isSelected = printing.id === card.id

                    return (
                      <button
                        key={printing.id}
                        onClick={() => onSelectPrinting?.(printing)}
                        className={`flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-blue-600/30 border border-blue-500'
                            : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent'
                        }`}
                      >
                        {/* Mini thumbnail */}
                        {printing.image_small && (
                          <img
                            src={printing.image_small}
                            alt=""
                            className="w-12 h-auto rounded"
                          />
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{printing.set_name}</p>
                          <p className="text-sm text-gray-400">
                            {printing.set.toUpperCase()} · {printing.rarity}
                            {printing.released_at && ` · ${printing.released_at.substring(0, 4)}`}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className={`font-bold ${
                            pPrice.price === 'No price' ? 'text-gray-500' : 'text-green-400'
                          }`}>
                            {pPrice.price}
                          </p>
                          {pPrice.type && <p className="text-xs text-gray-500">{pPrice.type}</p>}
                        </div>

                        {/* Cheapest badge */}
                        {idx === 0 && pPrice.price !== 'No price' && (
                          <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded">
                            Cheapest
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="p-4 border-t border-gray-700 flex gap-3">
            <button
              onClick={handleSaveClick}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              Save to List
            </button>
            <button
              onClick={handleWatchlistToggle}
              disabled={watchlistLoading}
              className={`py-3 px-6 ${
                inWatchlist
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              } rounded-lg font-medium disabled:opacity-50`}
            >
              {inWatchlist ? '✓ Watching' : '◆ Track Price'}
            </button>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <SaveToListModal
          card={card}
          userId={user.uid}
          onClose={() => {
            setShowSaveModal(false)
            if (onListUpdated) onListUpdated()
          }}
          theme={theme}
        />
      )}
    </>
  )
}

export default CardDetail
