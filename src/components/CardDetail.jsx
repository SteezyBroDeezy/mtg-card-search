import { useState } from 'react'
import SaveToListModal from './SaveToListModal'

function CardDetail({ card, onClose, user, theme }) {
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [currentFace, setCurrentFace] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)

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

  // Get current display values
  const displayImage = activeFace?.image_large || activeFace?.image_normal ||
                       card.image_large || card.image_normal
  const displayName = activeFace?.name || card.name
  const displayType = activeFace?.type_line || card.type_line
  const displayManaCost = activeFace?.mana_cost || card.mana_cost
  const displayOracleText = activeFace?.oracle_text || card.oracle_text
  const displayPower = activeFace?.power || card.power
  const displayToughness = activeFace?.toughness || card.toughness

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <div
          className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold">{card.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
              &times;
            </button>
          </div>

          <div className="p-4 flex flex-col md:flex-row gap-6">
            {/* Card Image with Flip */}
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
                    className="w-full md:w-72 rounded-lg shadow-xl"
                  />
                ) : (
                  <div className="w-full md:w-72 aspect-[488/680] bg-gray-700 rounded-lg flex items-center justify-center">
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

              {/* Face indicator */}
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
            </div>

            {/* Card Details */}
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

              {/* Artist */}
              {card.artist && (
                <div>
                  <p className="text-gray-400 text-sm">Artist</p>
                  <p className="italic">{card.artist}</p>
                </div>
              )}

              {/* Flavor Text */}
              {card.flavor_text && (
                <div>
                  <p className="text-gray-400 text-sm">Flavor</p>
                  <p className="italic text-gray-300">{card.flavor_text}</p>
                </div>
              )}

              {/* Prices */}
              {(card.prices?.usd || card.prices?.usd_foil) && (
                <div>
                  <p className="text-gray-400 text-sm">Prices</p>
                  <div className="flex gap-4">
                    {card.prices.usd && (
                      <span className="text-green-400">${card.prices.usd}</span>
                    )}
                    {card.prices.usd_foil && (
                      <span className="text-purple-400">${card.prices.usd_foil} (Foil)</span>
                    )}
                  </div>
                </div>
              )}

              {/* Keywords */}
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
            </div>
          </div>

          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleSaveClick}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              Save to List
            </button>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <SaveToListModal
          card={card}
          userId={user.uid}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </>
  )
}

export default CardDetail
