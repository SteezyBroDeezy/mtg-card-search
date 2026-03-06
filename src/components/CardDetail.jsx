 import { useState } from 'react'
  import SaveToListModal from './SaveToListModal'

  function CardDetail({ card, onClose, user }) {
    const [showSaveModal, setShowSaveModal] = useState(false)

    if (!card) return null

    function handleSaveClick() {
      if (!user) {
        alert('Please log in to save cards')
        return
      }
      setShowSaveModal(true)
    }

    return (
      <>
        <div
          className="fixed inset-0 bg-black/80 flex items-center
  justify-center p-4 z-50"
          onClick={onClose}
        >
          <div
            className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh]
  overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b
  border-gray-700">
              <h2 className="text-xl font-bold">{card.name}</h2>
              <button onClick={onClose} className="text-gray-400
  hover:text-white text-2xl">
                x
              </button>
            </div>

            <div className="p-4 flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                {card.image_normal ? (
                  <img src={card.image_normal} alt={card.name}
  className="w-full md:w-64 rounded-lg" />
                ) : (
                  <div className="w-full md:w-64 aspect-[488/680]
  bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Type</p>
                  <p>{card.type_line}</p>
                </div>

                {card.mana_cost && (
                  <div>
                    <p className="text-gray-400 text-sm">Mana Cost</p>
                    <p className="text-lg">{card.mana_cost}</p>
                  </div>
                )}

                {card.oracle_text && (
                  <div>
                    <p className="text-gray-400 text-sm">Text</p>
                    <p
  className="whitespace-pre-line">{card.oracle_text}</p>
                  </div>
                )}

                <div>
                  <p className="text-gray-400 text-sm">Set</p>
                  <p>{card.set_name} ({card.set.toUpperCase()})</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Rarity</p>
                  <p className="capitalize">{card.rarity}</p>
                </div>

                {card.prices?.usd && (
                  <div>
                    <p className="text-gray-400 text-sm">Price</p>
                    <p className="text-green-400">${card.prices.usd}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-700">
              <button
                onClick={handleSaveClick}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700
  rounded-lg font-medium"
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