import { useState, useEffect } from 'react'
import { useSwipeToClose } from '../lib/useSwipeToClose'
import SwipeHandle from './SwipeHandle'
import SyncListsButton from './SyncListsButton'
import { db } from '../lib/db'
import { searchNormalize, normalizeText, resolveFlavorName } from '../lib/scryfall'
import { getLocalLists, createListLocal, addCardToListLocal } from '../lib/listSync'

// Turns pasted decklist text into { name, quantity } entries.
//
// Handles the formats people actually paste: "4 Lightning Bolt",
// "4x Lightning Bolt", a bare card name (one per line, quantity 1), MTGO/
// Arena export lines with a set code and collector number attached
// ("1 Sol Ring (C21) 100"), an "*F*" foil marker, an "SB:" sideboard
// prefix, and section headers like "Deck" / "Sideboard" / "Commander"
// which are dropped rather than treated as card names. Blank lines and
// // or # comments are skipped. Names repeated across sections (a card in
// both main deck and sideboard, or just duplicated by mistake) have their
// quantities summed rather than creating two rows.
function parseDeckList(text) {
  const entries = new Map() // lowercased name -> { name, quantity }
  for (const raw of (text || '').split(/\r?\n/)) {
    let line = raw.trim()
    if (!line) continue
    if (/^(\/\/|#)/.test(line)) continue
    if (/^(deck|decklist|main\s*deck|sideboard|maybeboard|commander|companion)\s*:?$/i.test(line)) continue

    line = line.replace(/^SB:\s*/i, '')
    line = line.replace(/\s*\*F\*\s*$/i, '')
    // Trailing set code + collector number, e.g. "(WOE) 123" or "(2X2) 45★"
    line = line.replace(/\s*\([A-Za-z0-9]{2,6}\)\s*[A-Za-z0-9★]*\s*$/, '')
    if (!line) continue

    const match = line.match(/^(\d+)\s*[xX×]?\s*(.+)$/)
    const quantity = match ? (parseInt(match[1], 10) || 1) : 1
    const name = (match ? match[2] : line).trim()
    if (!name) continue

    const key = name.toLowerCase()
    const existing = entries.get(key)
    if (existing) existing.quantity += quantity
    else entries.set(key, { name, quantity })
  }
  return [...entries.values()]
}

// Local-database lookup for one deck-list name. Tries, in order: an exact
// match on the indexed search key, a prefix match against the full name
// (catches a double-faced card entered by its front face only — the stored
// name is "Front // Back" and name_normalized keeps the punctuation, so a
// startsWith still lines up), then the flavor-name table for a reskinned
// printing entered under its printed title. Returns the stored card row or
// null.
async function lookupLocalCard(name, depth = 0) {
  const bySearch = await db.cards.where('name_search').equals(searchNormalize(name)).first()
  if (bySearch) return bySearch

  const prefix = normalizeText(name)
  const byPrefix = await db.cards.where('name_normalized').startsWith(prefix).first()
  if (byPrefix) return byPrefix

  if (depth === 0) {
    const realName = await resolveFlavorName(name)
    if (realName && realName.toLowerCase() !== name.toLowerCase()) {
      return lookupLocalCard(realName, depth + 1)
    }
  }
  return null
}

// Scryfall's collection endpoint, 75 identifiers per request. Matches each
// returned card back to its entry by name rather than trusting response
// order — a request for a double-faced card's front face alone comes back
// named "Front // Back", so an exact match is tried first and a front-face
// match second.
async function lookupOnline(entries) {
  const byName = new Map(entries.map(e => [e.name.toLowerCase(), e]))
  for (let i = 0; i < entries.length; i += 75) {
    const batch = entries.slice(i, i + 75)
    let data
    try {
      const res = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: batch.map(e => ({ name: e.name })) })
      })
      if (!res.ok) continue
      data = await res.json()
    } catch {
      continue
    }
    for (const card of data.data || []) {
      const full = card.name.toLowerCase()
      const front = full.split(' // ')[0]
      const entry = byName.get(full) || byName.get(front)
      if (entry) entry.card = card
    }
  }
}

function BulkImportModal({ onClose, theme, dbReady, user, syncing, hasUnsynced, onSyncLists, onImported }) {
  const bgPrimary = theme?.bgSecondary || 'bg-gray-800'
  const bgSecondary = theme?.bgTertiary || 'bg-gray-700'
  const textPrimary = theme?.text || 'text-white'
  const textSecondary = theme?.textSecondary || 'text-gray-400'
  const border = theme?.border || 'border-gray-600'
  const accent = theme?.accent || 'bg-blue-600'

  const [lists, setLists] = useState([])
  const [text, setText] = useState('')
  const [targetMode, setTargetMode] = useState('existing') // 'existing' | 'new'
  const [targetListId, setTargetListId] = useState('')
  const [newListName, setNewListName] = useState('')
  const [step, setStep] = useState('paste') // 'paste' | 'resolving' | 'review' | 'importing' | 'done'
  const [resolved, setResolved] = useState([]) // { name, quantity, card? }
  const [error, setError] = useState(null)

  useEffect(() => {
    getLocalLists().then(ls => {
      setLists(ls)
      if (ls.length === 0) setTargetMode('new')
    })
  }, [])

  const swipe = useSwipeToClose(step === 'importing' ? () => {} : onClose)

  async function handleResolve() {
    const entries = parseDeckList(text)
    if (entries.length === 0) {
      setError('No card names found. Paste one card per line.')
      return
    }
    setError(null)
    setStep('resolving')

    if (dbReady) {
      for (const entry of entries) {
        entry.card = await lookupLocalCard(entry.name)
      }
    } else if (navigator.onLine) {
      await lookupOnline(entries)
    } else {
      setError('Connect to the internet, or download the card database, to look up cards.')
      setStep('paste')
      return
    }

    setResolved(entries)
    setStep('review')
  }

  const found = resolved.filter(e => e.card)
  const notFound = resolved.filter(e => !e.card)
  const totalCopies = found.reduce((sum, e) => sum + e.quantity, 0)

  async function handleImport() {
    let listId = targetListId
    if (targetMode === 'new') {
      if (!newListName.trim()) {
        setError('Name the new list first.')
        return
      }
      const list = await createListLocal(newListName.trim())
      listId = list.id
    }
    if (!listId) {
      setError('Choose a list to import into.')
      return
    }

    setError(null)
    setStep('importing')
    for (const entry of found) {
      await addCardToListLocal(listId, entry.card, '', entry.quantity)
    }
    setStep('done')
    onImported?.()
    setTimeout(onClose, 1800)
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-[80]"
      onClick={step === 'importing' ? undefined : onClose}
    >
      <div
        className={`${bgPrimary} w-full sm:max-w-xl sm:mx-4 sm:rounded-xl rounded-t-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col animate-slide-up sm:animate-none`}
        onClick={(e) => e.stopPropagation()}
        style={swipe.swipeStyle}
        {...swipe.swipeHandlers}
      >
        <SwipeHandle />

        <div className="flex justify-between items-center p-4 pb-2">
          <div>
            <h2 className={`text-xl sm:text-lg font-bold ${textPrimary}`}>Bulk Import Deck</h2>
            <p className={`${textSecondary} text-sm mt-0.5`}>Paste a decklist, add every card to a list at once</p>
          </div>
          {step !== 'importing' && (
            <button
              onClick={onClose}
              className={`${textSecondary} hover:text-white text-3xl sm:text-2xl leading-none w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20`}
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-2 flex flex-col gap-4">
          {step === 'paste' && (
            <>
              <div>
                <label className={`block text-sm ${textSecondary} mb-2`}>
                  Decklist — one card per line
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={'4 Lightning Bolt\n2x Counterspell\n1 Sol Ring (C21) 100\nSol Ring'}
                  rows={10}
                  className={`w-full px-3 py-2 ${bgSecondary} border ${border} rounded-lg ${textPrimary} font-mono text-sm resize-y`}
                />
                <p className={`${textSecondary} text-xs mt-1`}>
                  Quantities, "4x" prefixes, and set/collector-number suffixes from an
                  MTGO or Arena export are all understood — just paste the whole thing.
                </p>
              </div>

              <div>
                <label className={`block text-sm ${textSecondary} mb-2`}>Add to</label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setTargetMode('existing')}
                    disabled={lists.length === 0}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${
                      targetMode === 'existing' ? accent + ' text-white' : `${bgSecondary} ${textSecondary}`
                    }`}
                  >
                    Existing list
                  </button>
                  <button
                    onClick={() => setTargetMode('new')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      targetMode === 'new' ? accent + ' text-white' : `${bgSecondary} ${textSecondary}`
                    }`}
                  >
                    New list
                  </button>
                </div>
                {targetMode === 'existing' ? (
                  <select
                    value={targetListId}
                    onChange={(e) => setTargetListId(e.target.value)}
                    className={`w-full px-3 py-2 ${bgSecondary} border ${border} rounded-lg ${textPrimary}`}
                  >
                    <option value="">Select a list...</option>
                    {lists.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.cardCount || 0} cards)</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., Mono Red Aggro"
                    className={`w-full px-3 py-2 ${bgSecondary} border ${border} rounded-lg ${textPrimary}`}
                  />
                )}
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleResolve}
                disabled={!text.trim() || (targetMode === 'existing' && !targetListId) || (targetMode === 'new' && !newListName.trim())}
                className={`w-full py-3 ${accent} hover:opacity-90 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Find Cards
              </button>
            </>
          )}

          {step === 'resolving' && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3 animate-pulse">🔍</div>
              <p className={textSecondary}>Looking up cards...</p>
            </div>
          )}

          {step === 'review' && (
            <>
              <div className="flex items-center justify-between">
                <p className={textPrimary}>
                  <span className="font-bold text-green-400">{found.length}</span> card{found.length !== 1 ? 's' : ''} found
                  {totalCopies !== found.length && (
                    <span className={textSecondary}> ({totalCopies} copies total)</span>
                  )}
                </p>
                <button onClick={() => setStep('paste')} className="text-blue-400 hover:text-blue-300 text-sm">
                  ← Edit list
                </button>
              </div>

              {notFound.length > 0 && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3">
                  <p className="text-red-400 text-sm font-semibold mb-1">
                    {notFound.length} not found — check spelling and go back to fix:
                  </p>
                  <p className="text-red-300 text-sm">
                    {notFound.map(e => e.name).join(', ')}
                  </p>
                </div>
              )}

              {found.length > 0 && (
                <div className={`flex-1 overflow-y-auto -mx-4 px-4 max-h-64`}>
                  <div className="space-y-1.5">
                    {found.map(e => (
                      <div key={e.card.id} className={`flex items-center gap-2 px-3 py-2 ${bgSecondary} rounded-lg`}>
                        {e.quantity > 1 && (
                          <span className="text-blue-400 font-bold text-sm w-6 flex-shrink-0">×{e.quantity}</span>
                        )}
                        <span className={`${textPrimary} text-sm truncate`}>{e.card.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleImport}
                disabled={found.length === 0}
                className={`w-full py-3 ${accent} hover:opacity-90 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Add {found.length} Card{found.length !== 1 ? 's' : ''} to List
              </button>
            </>
          )}

          {step === 'importing' && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3 animate-spin">⏳</div>
              <p className={textSecondary}>Adding cards...</p>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-12">
              <div className="text-green-400 text-5xl mb-3">✓</div>
              <p className="text-green-400 font-semibold text-lg">
                Added {found.length} card{found.length !== 1 ? 's' : ''}!
              </p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <p className={`${textSecondary} text-xs`}>Saved locally</p>
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
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  )
}

export default BulkImportModal
