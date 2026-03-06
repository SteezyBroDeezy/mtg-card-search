 import { useState, useEffect } from 'react'
  import { getLists, createList, addCardToList } from '../lib/firebase'

  function SaveToListModal({ card, userId, onClose }) {
    const [lists, setLists] = useState([])
    const [loading, setLoading] = useState(true)
    const [newListName, setNewListName] = useState('')
    const [note, setNote] = useState('')
    const [selectedList, setSelectedList] = useState(null)
    const [saving, setSaving] = useState(false)
    const [creating, setCreating] = useState(false)

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

    async function handleCreateList(e) {
      e.preventDefault()
      if (!newListName.trim()) return

      setCreating(true)
      try {
        const listId = await createList(userId, newListName.trim())
        setLists([...lists, { id: listId, name: newListName.trim(),
  cardCount: 0 }])
        setNewListName('')
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
        await addCardToList(userId, selectedList, card, note)
        onClose()
      } catch (err) {
        console.error('Failed to save card:', err)
      } finally {
        setSaving(false)
      }
    }

    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center
  justify-center p-4 z-50"
        onClick={onClose}
      >
        <div
          className="bg-gray-800 rounded-xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Save to List</h2>
            <button onClick={onClose} className="text-gray-400
  hover:text-white text-2xl">
              x
            </button>
          </div>

          <p className="text-gray-400 mb-4">{card.name}</p>

          {loading ? (
            <p className="text-gray-500">Loading lists...</p>
          ) : (
            <>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                {lists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedList(list.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border
   ${
                      selectedList === list.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <span className="font-medium">{list.name}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      ({list.cardCount || 0} cards)
                    </span>
                  </button>
                ))}

                {lists.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No lists yet. Create one below!
                  </p>
                )}
              </div>

              <form onSubmit={handleCreateList} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="New list name..."
                  className="flex-1 px-3 py-2 bg-gray-700 border
  border-gray-600 rounded-lg text-white"
                />
                <button
                  type="submit"
                  disabled={creating || !newListName.trim()}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500
  rounded-lg disabled:opacity-50"
                >
                  {creating ? '...' : '+ Add'}
                </button>
              </form>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Replace Shock with this"
                  className="w-full px-3 py-2 bg-gray-700 border
  border-gray-600 rounded-lg text-white"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!selectedList || saving}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700
  rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save to List'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  export default SaveToListModal