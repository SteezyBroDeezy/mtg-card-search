import { useState, useEffect } from 'react'
import { useSwipeToClose } from '../lib/useSwipeToClose'
import SyncListsButton from './SyncListsButton'
import {
  getLocalLists,
  createListLocal,
  addCardToListLocal
} from '../lib/listSync'

function SaveToListModal({ card, userId, onClose, theme, user, syncing, hasUnsynced, onSyncLists }) {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [newListName, setNewListName] = useState('')
  const [note, setNote] = useState('')
  const [selectedList, setSelectedList] = useState(null)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showNewListInput, setShowNewListInput] = useState(false)

  // Use theme or fallback to defaults
  const bgPrimary = theme?.bgSecondary || 'bg-gray-800'
  const bgSecondary = theme?.bgTertiary || 'bg-gray-700'
  const textPrimary = theme?.text || 'text-white'
  const textSecondary = theme?.textSecondary || 'text-gray-400'
  const border = theme?.border || 'border-gray-600'
  const accent = theme?.accent || 'bg-blue-600'

  useEffect(() => {
    loadLists()
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

  async function handleCreateList(e) {
    e.preventDefault()
    if (!newListName.trim()) return

    setCreating(true)
    try {
      const newList = await createListLocal(newListName.trim())
      setLists([...lists, newList])
      setNewListName('')
      setSelectedList(newList.id) // Auto-select new list
      setShowNewListInput(false)
    } catch (err) {
      console.error('Failed to create list:', err)
    } finally {
      setCreating(false)
    }
  }

  async function handleSave() {
    if (!selectedList) return

    setSaving(true)
    try {
      await addCardToListLocal(selectedList, card, note)
      setSaved(true)
      // Longer than the old 800ms so the sync button below is actually
      // reachable after a save.
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      console.error('Failed to save card:', err)
      alert('Failed to save card')
    } finally {
      setSaving(false)
    }
  }

  const swipe = useSwipeToClose(onClose)

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-[80]"
      onClick={onClose}
    >
      {/* Mobile: Bottom sheet, sized for thumbs | Desktop: a bigger centered
          modal with tighter, denser controls, so a list of 10+ names
          doesn't need to scroll just to see them. */}
      <div
        className={`${bgPrimary} w-full sm:max-w-xl sm:mx-4 sm:rounded-xl rounded-t-2xl max-h-[85vh] sm:max-h-[85vh] flex flex-col animate-slide-up sm:animate-none`}
        onClick={(e) => e.stopPropagation()}
        style={swipe.swipeStyle}
        {...swipe.swipeHandlers}
      >
        {/* Drag handle for mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-600 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center p-4 pb-2 sm:p-4 sm:pb-2">
          <div>
            <h2 className={`text-xl sm:text-lg font-bold ${textPrimary}`}>Save to List</h2>
            <p className={`${textSecondary} text-sm mt-0.5 truncate max-w-[250px] sm:max-w-xs`}>{card.name}</p>
          </div>
          <button
            onClick={onClose}
            className={`${textSecondary} hover:text-white text-3xl sm:text-2xl leading-none w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20`}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className={textSecondary}>Loading lists...</p>
          </div>
        ) : saved ? (
          <div className="text-center py-12 px-4">
            <div className="text-green-400 text-5xl mb-3">✓</div>
            <p className="text-green-400 font-semibold text-lg">Saved!</p>
            <p className={`${textSecondary} text-sm mt-2`}>
              Don't forget to sync to push to cloud
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col p-4 pt-2 sm:p-4 sm:pt-2">
            {/* Create New List - Prominent at top, but not oversized on desktop */}
            <div className="mb-4 sm:mb-3">
              {showNewListInput ? (
                <form onSubmit={handleCreateList} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list name..."
                    autoFocus
                    className={`flex-1 w-full px-4 py-3 sm:px-3 sm:py-2 ${bgSecondary} border-2 border-blue-500 rounded-xl sm:rounded-lg ${textPrimary} text-lg sm:text-sm`}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={creating || !newListName.trim()}
                      className={`flex-1 sm:flex-none py-3 sm:py-2 sm:px-4 ${accent} hover:opacity-90 text-white rounded-xl sm:rounded-lg font-semibold sm:text-sm disabled:opacity-50`}
                    >
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewListInput(false); setNewListName('') }}
                      className={`px-4 py-3 sm:py-2 ${bgSecondary} rounded-xl sm:rounded-lg sm:text-sm ${textSecondary}`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowNewListInput(true)}
                  className={`w-full py-3.5 sm:py-2 border-2 border-dashed ${border} rounded-xl sm:rounded-lg ${textSecondary} hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-2 text-base sm:text-sm`}
                >
                  <span className="text-xl sm:text-base">+</span>
                  <span>Create New List</span>
                </button>
              )}
            </div>

            {/* Existing Lists — a denser 2-column grid on desktop, where the
                bigger modal has room, so more of the list is visible without
                scrolling. Mobile keeps the single-column, thumb-sized rows. */}
            <div className="flex-1 overflow-y-auto -mx-4 px-4">
              {lists.length === 0 ? (
                <div className={`text-center py-8 ${textSecondary}`}>
                  <div className="text-4xl mb-3 opacity-50">📋</div>
                  <p>No lists yet</p>
                  <p className="text-sm mt-1">Create your first list above!</p>
                </div>
              ) : (
                <div>
                  <p className={`${textSecondary} text-xs uppercase tracking-wider font-semibold mb-2`}>
                    Your Lists ({lists.length})
                  </p>
                  <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-2">
                    {lists.map(list => (
                      <button
                        key={list.id}
                        onClick={() => setSelectedList(list.id)}
                        className={`w-full text-left px-4 py-4 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-lg border-2 transition-all ${
                          selectedList === list.id
                            ? 'border-blue-500 bg-blue-500/20'
                            : `${border} hover:border-gray-500 ${bgSecondary}`
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <span className={`font-semibold ${textPrimary} text-base sm:text-sm truncate block`}>{list.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`${textSecondary} text-sm sm:text-xs`}>
                                {list.cardCount || 0} card{(list.cardCount || 0) !== 1 ? 's' : ''}
                              </span>
                              {!list.synced && (
                                <span className="text-yellow-500 text-xs bg-yellow-900/50 px-1.5 py-0.5 rounded">
                                  Unsynced
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedList === list.id && (
                            <div className="text-blue-400 text-xl sm:text-base flex-shrink-0 ml-2">✓</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Note Input */}
            <div className="mt-4 pt-4 sm:mt-3 sm:pt-3 border-t border-gray-700">
              <label className={`block text-sm sm:text-xs ${textSecondary} mb-2 sm:mb-1`}>
                Note (optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Replace Shock with this"
                className={`w-full px-4 py-3 sm:px-3 sm:py-2 ${bgSecondary} border ${border} rounded-xl sm:rounded-lg ${textPrimary} sm:text-sm`}
              />
            </div>

            {/* Save Button - prominent on mobile, a normal-sized button on desktop */}
            <button
              onClick={handleSave}
              disabled={!selectedList || saving}
              className={`mt-4 sm:mt-3 w-full py-4 sm:py-2.5 ${accent} hover:opacity-90 rounded-xl sm:rounded-lg font-bold text-lg sm:text-base text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity`}
            >
              {saving ? 'Saving...' : selectedList ? 'Save to List' : 'Select a List'}
            </button>

            <div className="mt-3 sm:mt-2 flex items-center justify-center gap-3">
              <p className={`${textSecondary} text-xs`}>
                Saved locally
              </p>
              <SyncListsButton
                user={user}
                syncing={syncing}
                hasUnsynced={hasUnsynced}
                onSync={onSyncLists}
                theme={theme}
              />
            </div>
          </div>
        )}
      </div>

      {/* CSS for slide-up animation */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default SaveToListModal
