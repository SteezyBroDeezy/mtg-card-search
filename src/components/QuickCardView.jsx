import { useState, useEffect } from 'react'
import {
  isInWatchlistCached,
  addToWatchlistCached,
  removeFromWatchlistCached
} from '../lib/priceOracleCache'

function QuickCardView({ card, user, theme, onClose, onViewDetails, onSaveToList }) {
  const [inWatchlist, setInWatchlist] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [currentFace, setCurrentFace] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)

  useEffect(() => {
    if (user && card) {
      // Use cached check - NO Firebase call!
      setInWatchlist(isInWatchlistCached(card.id))
    }
  }, [user, card])

  // Reset face when card changes
  useEffect(() => {
    setCurrentFace(0)
  }, [card?.id])

  async function handleWatchlistToggle() {
    if (!user) {
      alert('Please log in to track prices')
      return
    }

    setWatchlistLoading(true)
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
    }
    setWatchlistLoading(false)
  }

  function handleSaveToList() {
    if (!user) {
      alert('Please log in to save cards')
      return
    }
    onSaveToList()
  }

  if (!card) return null

  // Check for double-faced card
  const hasMultipleFaces = card.card_faces && card.card_faces.length > 1
  const activeFace = hasMultipleFaces ? card.card_faces[currentFace] : null

  function flipCard(e) {
    e.stopPropagation()
    if (!hasMultipleFaces) return
    setIsFlipping(true)
    setTimeout(() => {
      setCurrentFace(prev => (prev + 1) % card.card_faces.length)
      setIsFlipping(false)
    }, 150)
  }

  // Get the best image - handle both local DB format and Scryfall API format
  // For DFCs, use the active face
  const displayImage = activeFace?.image_large || activeFace?.image_normal ||
    activeFace?.image_uris?.large || activeFace?.image_uris?.normal ||
    card.image_large || card.image_normal ||
    card.image_uris?.large || card.image_uris?.normal ||
    card.card_faces?.[0]?.image_large || card.card_faces?.[0]?.image_normal ||
    card.card_faces?.[0]?.image_uris?.large || card.card_faces?.[0]?.image_uris?.normal

  // Get price
  const price = card.prices?.usd ? `$${card.prices.usd}` :
    card.prices?.usd_foil ? `$${card.prices.usd_foil} foil` : null

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex flex-col"
      onClick={onClose}
    >
      {/* Close button */}
      <div className="flex justify-between items-center p-3">
        <div className="text-white font-semibold truncate flex-1 pr-4">
          {card.name}
        </div>
        <button
          onClick={onClose}
          className="text-white text-3xl leading-none w-10 h-10 flex items-center justify-center"
        >
          ×
        </button>
      </div>

      {/* Card Image - Large and centered */}
      <div
        className="flex-1 flex items-center justify-center p-2 overflow-hidden"
        onClick={(e) => {
          e.stopPropagation()
          onViewDetails()
        }}
      >
        <div className="relative">
          {displayImage ? (
            <img
              src={displayImage}
              alt={card.name}
              className={`max-h-full max-w-full w-auto h-auto rounded-xl shadow-2xl cursor-pointer transition-all duration-150 ${
                isFlipping ? 'scale-95 opacity-80' : 'active:scale-95'
              }`}
              style={{ maxWidth: '95vw', maxHeight: '60vh' }}
            />
          ) : (
            <div className="w-full max-w-sm aspect-[488/680] bg-gray-800 rounded-xl flex items-center justify-center">
              <span className="text-gray-400 text-center p-4">{card.name}</span>
            </div>
          )}

          {/* Flip button for double-faced cards */}
          {hasMultipleFaces && (
            <button
              onClick={flipCard}
              className="absolute bottom-3 right-3 bg-black/80 hover:bg-black text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Flip
            </button>
          )}
        </div>
      </div>

      {/* Face indicator for DFCs */}
      {hasMultipleFaces && (
        <div className="text-center pb-1">
          <span className="text-gray-400 text-sm">
            {activeFace?.name || card.card_faces[currentFace]?.name} ({currentFace + 1}/{card.card_faces.length})
          </span>
        </div>
      )}

      {/* Price badge */}
      {price && (
        <div className="text-center pb-2">
          <span className="text-green-400 text-xl font-bold">{price}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div
        className="p-4 pt-2 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Primary actions row */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveToList}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-lg transition-colors"
          >
            Save to List
          </button>
          <button
            onClick={handleWatchlistToggle}
            disabled={watchlistLoading}
            className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-colors ${
              inWatchlist
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white'
            } disabled:opacity-50`}
          >
            {watchlistLoading ? '...' : inWatchlist ? '✓ Watching' : 'Track Price'}
          </button>
        </div>

        {/* View details button */}
        <button
          onClick={onViewDetails}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white rounded-xl font-medium transition-colors"
        >
          View All Details & Printings
        </button>
      </div>
    </div>
  )
}

export default QuickCardView
