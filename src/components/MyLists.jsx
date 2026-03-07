import { useState, useEffect } from 'react'
import {
  getLocalLists,
  createListLocal,
  deleteListLocal,
  getListCardsLocal,
  removeCardFromListLocal,
  syncLists,
  getLastSyncTime,
  hasUnsyncedChanges
} from '../lib/listSync'

function MyLists({ userId, onClose }) {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedList, setSelectedList] = useState(null)
  const [cards, setCards] = useState([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [hasUnsynced, setHasUnsynced] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [showNewList, setShowNewList] = useState(false)

  useEffect(() => {
    loadLists()
    loadSyncStatus()
  }, [])

  async function loadLists() {
    try {
      const localLists = await getLocalLists()
      setLists(localLists)
    } catch (err) {
      console.error('Failed to load lists:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadSyncStatus() {
    const syncTime = await getLastSyncTime()
    setLastSync(syncTime)
    const unsynced = await hasUnsyncedChanges()
    setHasUnsynced(unsynced)
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const result = await syncLists(userId)
      if (result.success) {
        await loadLists()
        await loadSyncStatus()
      } else {
        alert('Sync failed: ' + result.error)
      }
    } catch (err) {
      console.error('Sync failed:', err)
      alert('Sync failed: ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  async function handleCreateList() {
    if (!newListName.trim()) return
    try {
      await createListLocal(newListName.trim())
      setNewListName('')
      setShowNewList(false)
      await loadLists()
      setHasUnsynced(true)
    } catch (err) {
      console.error('Failed to create list:', err)
    }
  }

  async function handleSelectList(list) {
    setSelectedList(list)
    setLoadingCards(true)
    try {
      const listCards = await getListCardsLocal(list.id)
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
      await deleteListLocal(listId)
      setLists(lists.filter(l => l.id !== listId))
      if (selectedList?.id === listId) {
        setSelectedList(null)
        setCards([])
      }
      setHasUnsynced(true)
    } catch (err) {
      console.error('Failed to delete list:', err)
    }
  }

  async function handleRemoveCard(cardId) {
    try {
      await removeCardFromListLocal(selectedList.id, cardId)
      setCards(cards.filter(c => c.cardId !== cardId))
      setHasUnsynced(true)
    } catch (err) {
      console.error('Failed to remove card:', err)
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

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-4">
            {selectedList && (
              <button
                onClick={() => { setSelectedList(null); setCards([]) }}
                className="text-gray-400 hover:text-white"
              >
                ← Back
              </button>
            )}
            <h2 className="text-xl font-bold text-white">
              {selectedList ? selectedList.name : 'My Lists'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Sync button */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                syncing
                  ? 'bg-gray-600 text-gray-400 cursor-wait'
                  : hasUnsynced
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                  : 'bg-green-700 hover:bg-green-600 text-white'
              }`}
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
              {syncing ? 'Syncing...' : hasUnsynced ? 'Sync Now' : 'Synced'}
            </button>
            <span className="text-gray-500 text-xs">
              {formatSyncTime(lastSync)}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : selectedList ? (
            // Cards view
            loadingCards ? (
              <p className="text-gray-500">Loading cards...</p>
            ) : cards.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No cards in this list</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {cards.map(card => (
                  <div key={card.cardId} className="relative group">
                    <img
                      src={card.image_normal || card.image_small}
                      alt={card.name}
                      className="w-full rounded-lg"
                      loading="lazy"
                    />
                    {card.note && (
                      <div className="mt-1 text-xs text-gray-400 truncate">{card.note}</div>
                    )}
                    {!card.synced && (
                      <div className="absolute top-1 left-1 bg-yellow-600 text-white text-[10px] px-1 rounded">
                        Unsynced
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveCard(card.cardId)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Lists view
            <>
              {/* New list button/form */}
              {showNewList ? (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="List name..."
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                  />
                  <button
                    onClick={handleCreateList}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setShowNewList(false); setNewListName('') }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewList(true)}
                  className="w-full mb-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
                >
                  + New List
                </button>
              )}

              {lists.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No lists yet. Create one or sync to pull from cloud.
                </p>
              ) : (
                <div className="space-y-2">
                  {lists.map(list => (
                    <div
                      key={list.id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                      onClick={() => handleSelectList(list)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-white">
                          <span className="font-medium">{list.name}</span>
                          <span className="text-gray-400 text-sm ml-2">
                            ({list.cardCount || 0} cards)
                          </span>
                        </div>
                        {!list.synced && (
                          <span className="text-yellow-500 text-xs bg-yellow-900/50 px-2 py-0.5 rounded">
                            Unsynced
                          </span>
                        )}
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
            </>
          )}
        </div>

        {/* Footer with sync info */}
        <div className="border-t border-gray-700 p-3 bg-gray-900/50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {lists.length} list{lists.length !== 1 ? 's' : ''} stored locally
            </span>
            <span>
              {hasUnsynced ? '⚠️ Changes pending sync' : '✓ All changes synced'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyLists
