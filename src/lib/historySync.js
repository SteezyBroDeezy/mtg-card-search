import { doc, getDoc, setDoc } from 'firebase/firestore'
import { firestore } from './firebase'

// Search history sync.
//
// History lives in localStorage so it works signed-out and offline. Signing
// in and syncing merges this device's history with whatever the account
// already has, so a search run on the website shows up in the phone's PWA
// and vice versa.
//
// The whole history is one Firestore document, not a document per entry:
// a sync costs exactly one read and one write regardless of size, which
// matters given the 50k reads/day free tier these apps share.

const STORAGE_KEY = 'mtg-search-history'
const LAST_SYNC_KEY = 'mtg-history-last-sync'

// Enough room to hold several devices' worth after a merge.
export const HISTORY_LIMIT = 50

function historyDoc(userId) {
  return doc(firestore, 'users', userId, 'prefs', 'searchHistory')
}

export function loadLocalHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLocalHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)))
  } catch {
    // Storage full or blocked; history is a convenience, not critical state.
  }
}

export function getLastHistorySync() {
  return localStorage.getItem(LAST_SYNC_KEY)
}

/**
 * Merge two history lists into one.
 *
 * Same query from two devices collapses into a single entry keeping the most
 * recent timestamp, and the result count from whichever run was newer — an
 * older count would be stale. Newest first, capped.
 */
export function mergeHistories(a = [], b = []) {
  const byQuery = new Map()

  for (const entry of [...a, ...b]) {
    if (!entry || typeof entry.query !== 'string' || !entry.query.trim()) continue
    const key = entry.query
    const stamp = Number(entry.timestamp) || 0
    const existing = byQuery.get(key)
    if (!existing || stamp > existing.timestamp) {
      byQuery.set(key, {
        query: key,
        timestamp: stamp,
        resultCount: Number.isFinite(entry.resultCount)
          ? entry.resultCount
          : existing?.resultCount ?? 0,
      })
    }
  }

  return [...byQuery.values()]
    .sort((x, y) => y.timestamp - x.timestamp)
    .slice(0, HISTORY_LIMIT)
}

/**
 * Pull the account's history, merge with this device's, push the result back.
 * Returns { success, history, added, error }.
 */
export async function syncSearchHistory(userId, localHistory = loadLocalHistory()) {
  if (!userId) {
    return { success: false, error: 'Not signed in', history: localHistory, added: 0 }
  }

  try {
    const ref = historyDoc(userId)
    const snapshot = await getDoc(ref)
    const remote = snapshot.exists() ? (snapshot.data().entries || []) : []

    const merged = mergeHistories(localHistory, remote)

    // How many entries this device didn't already have.
    const localQueries = new Set(localHistory.map(e => e.query))
    const added = merged.filter(e => !localQueries.has(e.query)).length

    await setDoc(ref, {
      entries: merged,
      updatedAt: new Date().toISOString(),
    })

    saveLocalHistory(merged)
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())

    return { success: true, history: merged, added }
  } catch (error) {
    console.error('History sync failed:', error)
    return { success: false, error: error.message, history: localHistory, added: 0 }
  }
}

/** Wipe the account's history as well as this device's. */
export async function clearRemoteHistory(userId) {
  if (!userId) return { success: true }
  try {
    await setDoc(historyDoc(userId), {
      entries: [],
      updatedAt: new Date().toISOString(),
    })
    return { success: true }
  } catch (error) {
    console.error('Clearing remote history failed:', error)
    return { success: false, error: error.message }
  }
}
