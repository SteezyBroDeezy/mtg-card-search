 import { useState, useEffect } from 'react'
  import { getLists, deleteList, getCardsInList, removeCardFromList } from
  '../lib/firebase'

  function MyLists({ userId, onClose }) {
    const [lists, setLists] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedList, setSelectedList] = useState(null)
    const [cards, setCards] = useState([])
    const [loadingCards, setLoadingCards] = useState(false)

    useEffect(() => {
      loadLists()
    }, [])

    async function loadLists() {
      try {
        const userLists = await getLists(userId)
        setLists(userLists)
      } catch (err) {
        console.error('Failed to load lists:', err)
      } finally {
        setLoading(false)
      }
    }

    async function handleSelectList(list) {
      setSelectedList(list)
      setLoadingCards(true)
      try {
        const listCards = await getCardsInList(userId, list.id)
        setCards(listCards)
      } catch (err) {
        console.error('Failed to load cards:', err)
      } finally {
        setLoadingCards(false)
      }
    }

    async function handleDeleteList(listId) {
      if (!confirm('Delete this list?')) return
      try {
        await deleteList(userId, listId)
        setLists(lists.filter(l => l.id !== listId))
        if (selectedList?.id === listId) {
          setSelectedList(null)
          setCards([])
        }
      } catch (err) {
        console.error('Failed to delete list:', err)
      }
    }

    async function handleRemoveCard(cardId) {
      try {
        await removeCardFromList(userId, selectedList.id, cardId)
        setCards(cards.filter(c => c.id !== cardId))
      } catch (err) {
        console.error('Failed to remove card:', err)
      }
    }

    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center
  justify-center p-4 z-50"
        onClick={onClose}
      >
        <div
          className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh]
  overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b
  border-gray-700">
            <div className="flex items-center gap-4">
              {selectedList && (
                <button
                  onClick={() => { setSelectedList(null); setCards([]) }}
                  className="text-gray-400 hover:text-white"
                >
                  Back
                </button>
              )}
              <h2 className="text-xl font-bold text-white">
                {selectedList ? selectedList.name : 'My Lists'}
              </h2>
            </div>
            <button onClick={onClose} className="text-gray-400
  hover:text-white text-2xl">
              x
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : selectedList ? (
              loadingCards ? (
                <p className="text-gray-500">Loading cards...</p>
              ) : cards.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No cards in
  this list</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3
  md:grid-cols-4 gap-4">
                  {cards.map(card => (
                    <div key={card.id} className="relative group">
                      <img
                        src={card.image_small}
                        alt={card.name}
                        className="w-full rounded-lg"
                      />
                      {card.note && (
                        <div className="mt-1 text-xs
  text-gray-400">{card.note}</div>
                      )}
                      <button
                        onClick={() => handleRemoveCard(card.id)}
                        className="absolute top-1 right-1 bg-red-600
  text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : lists.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No lists yet</p>
            ) : (
              <div className="space-y-2">
                {lists.map(list => (
                  <div
                    key={list.id}
                    className="flex items-center justify-between p-4
  bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                    onClick={() => handleSelectList(list)}
                  >
                    <div className="text-white">
                      <span className="font-medium">{list.name}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        ({list.cardCount || 0} cards)
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteList(list.id)
                      }}
                      className="text-red-400 hover:text-red-300 px-2"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  export default MyLists