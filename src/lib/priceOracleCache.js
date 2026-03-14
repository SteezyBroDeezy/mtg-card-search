import { db } from './db'
import {
  getPriceOracleData,
  savePriceOracleData
} from './firebase'

// Cache key for storing last sync time
const CACHE_KEY = 'priceOracleCache'
const SYNC_INTERVAL = 60 * 60 * 1000 // 1 HOUR (increased from 5 min)

// In-memory cache for current session
let memoryCache = null
let lastSyncTime = 0
let pendingChanges = false
let currentUserId = null

// Initialize cache from IndexedDB (OFFLINE-FIRST: doesn't auto-fetch from Firebase)
export async function initPriceOracleCache(userId) {
  if (!userId) return null
  currentUserId = userId

  try {
    // Try to load from IndexedDB first
    const cached = await db.meta.get(CACHE_KEY)
    if (cached?.value && cached.value.userId === userId) {
      memoryCache = cached.value.data
      lastSyncTime = cached.value.timestamp
      console.log('Loaded Price Oracle data from local cache')
      return memoryCache
    }

    // No local cache for this user - initialize empty and let user sync manually
    memoryCache = { watchlist: [], alerts: [] }

    // Only auto-fetch from Firebase on FIRST load (no local data exists)
    if (!cached?.value) {
      console.log('No local cache found, fetching from Firebase...')
      return await refreshFromFirebase(userId)
    }

    return memoryCache
  } catch (e) {
    console.error('Error initializing price oracle cache:', e)
    return memoryCache || { watchlist: [], alerts: [] }
  }
}

// Force refresh from Firebase (MANUAL SYNC ONLY - call sparingly!)
export async function refreshFromFirebase(userId) {
  if (!userId) return null

  try {
    console.log('Syncing Price Oracle data from Firebase...')
    const data = await getPriceOracleData(userId)
    memoryCache = data
    lastSyncTime = Date.now()

    // Save to IndexedDB
    await db.meta.put({
      key: CACHE_KEY,
      value: {
        data: memoryCache,
        timestamp: lastSyncTime,
        userId
      }
    })

    pendingChanges = false
    console.log('Price Oracle sync complete')
    return memoryCache
  } catch (e) {
    console.error('Error refreshing from Firebase:', e)
    // Return cached data if available
    return memoryCache || { watchlist: [], alerts: [] }
  }
}

// Push local changes to Firebase (MANUAL SYNC ONLY)
export async function pushToFirebase(userId) {
  if (!userId || !memoryCache) return { success: false, error: 'No data to sync' }

  try {
    console.log('Pushing Price Oracle data to Firebase...')
    await savePriceOracleData(userId, memoryCache)
    pendingChanges = false
    lastSyncTime = Date.now()

    // Update IndexedDB with new sync time
    await db.meta.put({
      key: CACHE_KEY,
      value: {
        data: memoryCache,
        timestamp: lastSyncTime,
        userId
      }
    })

    console.log('Price Oracle push complete')
    return { success: true }
  } catch (e) {
    console.error('Failed to push to Firebase:', e)
    return { success: false, error: e.message }
  }
}

// Full sync: pull from Firebase, merge, push back
export async function fullSync(userId) {
  if (!userId) return { success: false, error: 'Not logged in' }

  try {
    // First push any local changes
    if (pendingChanges) {
      await pushToFirebase(userId)
    }

    // Then pull latest from Firebase
    await refreshFromFirebase(userId)

    return { success: true }
  } catch (e) {
    console.error('Full sync failed:', e)
    return { success: false, error: e.message }
  }
}

// Get cached data (NO Firebase call)
export function getCachedPriceOracleData() {
  return memoryCache || { watchlist: [], alerts: [] }
}

// Check if card is in watchlist (NO Firebase call - uses cache)
export function isInWatchlistCached(cardId) {
  if (!memoryCache?.watchlist) return false
  return memoryCache.watchlist.some(c => c.id === cardId)
}

// Save to local cache only (NO Firebase call)
async function saveToLocalCache() {
  if (!memoryCache || !currentUserId) return

  await db.meta.put({
    key: CACHE_KEY,
    value: {
      data: memoryCache,
      timestamp: lastSyncTime,
      userId: currentUserId
    }
  })
}

// Add to watchlist (LOCAL ONLY - no auto Firebase sync)
export async function addToWatchlistCached(userId, card) {
  if (!userId || !memoryCache) return false

  // Check if already exists
  if (memoryCache.watchlist?.some(c => c.id === card.id)) {
    return false
  }

  const watchlistCard = {
    id: card.id,
    name: card.name,
    set: card.set,
    setName: card.set_name,
    rarity: card.rarity,
    image: card.image_small || card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small,
    price: parseFloat(card.prices?.usd) || parseFloat(card.prices?.usd_foil) || 0,
    priceStr: card.prices?.usd ? `$${card.prices.usd}` : card.prices?.usd_foil ? `$${card.prices.usd_foil}` : 'N/A',
    addedAt: new Date().toISOString()
  }

  // Update memory cache immediately
  memoryCache.watchlist = [...(memoryCache.watchlist || []), watchlistCard]
  pendingChanges = true

  // Save to IndexedDB only (NO Firebase)
  await saveToLocalCache()

  return true
}

// Remove from watchlist (LOCAL ONLY - no auto Firebase sync)
export async function removeFromWatchlistCached(userId, cardId) {
  if (!userId || !memoryCache) return

  memoryCache.watchlist = (memoryCache.watchlist || []).filter(c => c.id !== cardId)
  pendingChanges = true

  await saveToLocalCache()
}

// Add alert (LOCAL ONLY - no auto Firebase sync)
export async function addAlertCached(userId, alert) {
  if (!userId || !memoryCache) return null

  const newAlert = {
    id: Date.now().toString(),
    ...alert,
    enabled: true,
    created: new Date().toISOString()
  }

  memoryCache.alerts = [...(memoryCache.alerts || []), newAlert]
  pendingChanges = true

  await saveToLocalCache()

  return newAlert.id
}

// Remove alert (LOCAL ONLY)
export async function removeAlertCached(userId, alertId) {
  if (!userId || !memoryCache) return

  memoryCache.alerts = (memoryCache.alerts || []).filter(a => a.id !== alertId)
  pendingChanges = true

  await saveToLocalCache()
}

// Toggle alert (LOCAL ONLY)
export async function toggleAlertCached(userId, alertId) {
  if (!userId || !memoryCache) return

  memoryCache.alerts = (memoryCache.alerts || []).map(a =>
    a.id === alertId ? { ...a, enabled: !a.enabled } : a
  )
  pendingChanges = true

  await saveToLocalCache()
}

// Check if there are pending changes
export function hasPendingChanges() {
  return pendingChanges
}

// Get last sync time
export function getLastSyncTime() {
  return lastSyncTime
}

// Check if cache is stale (more than 1 hour old)
export function isCacheStale() {
  return Date.now() - lastSyncTime > SYNC_INTERVAL
}

// Clear cache (on logout)
export async function clearPriceOracleCache() {
  memoryCache = null
  lastSyncTime = 0
  pendingChanges = false
  currentUserId = null
  await db.meta.delete(CACHE_KEY)
}
