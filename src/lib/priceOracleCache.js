import { db } from './db'
import {
  getPriceOracleData,
  savePriceOracleData
} from './firebase'

// Cache key for storing last sync time
const CACHE_KEY = 'priceOracleCache'
const SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes

// In-memory cache for current session
let memoryCache = null
let lastSyncTime = 0
let pendingChanges = false

// Initialize cache from IndexedDB
export async function initPriceOracleCache(userId) {
  if (!userId) return null

  try {
    // Try to load from IndexedDB first
    const cached = await db.meta.get(CACHE_KEY)
    if (cached?.value) {
      memoryCache = cached.value.data
      lastSyncTime = cached.value.timestamp

      // If cache is fresh (less than 5 min old), use it
      if (Date.now() - lastSyncTime < SYNC_INTERVAL) {
        return memoryCache
      }
    }

    // Cache is stale or doesn't exist, fetch from Firebase
    return await refreshFromFirebase(userId)
  } catch (e) {
    console.error('Error initializing price oracle cache:', e)
    return memoryCache || { watchlist: [], alerts: [] }
  }
}

// Force refresh from Firebase (call sparingly!)
export async function refreshFromFirebase(userId) {
  if (!userId) return null

  try {
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
    return memoryCache
  } catch (e) {
    console.error('Error refreshing from Firebase:', e)
    // Return cached data if available
    return memoryCache || { watchlist: [], alerts: [] }
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

// Add to watchlist (updates cache immediately, syncs to Firebase in background)
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

  // Save to IndexedDB immediately
  await db.meta.put({
    key: CACHE_KEY,
    value: {
      data: memoryCache,
      timestamp: lastSyncTime,
      userId
    }
  })

  // Sync to Firebase in background (don't await)
  syncToFirebase(userId).catch(e => console.error('Background sync failed:', e))

  return true
}

// Remove from watchlist (updates cache immediately, syncs to Firebase in background)
export async function removeFromWatchlistCached(userId, cardId) {
  if (!userId || !memoryCache) return

  // Update memory cache immediately
  memoryCache.watchlist = (memoryCache.watchlist || []).filter(c => c.id !== cardId)
  pendingChanges = true

  // Save to IndexedDB immediately
  await db.meta.put({
    key: CACHE_KEY,
    value: {
      data: memoryCache,
      timestamp: lastSyncTime,
      userId
    }
  })

  // Sync to Firebase in background
  syncToFirebase(userId).catch(e => console.error('Background sync failed:', e))
}

// Add alert (updates cache immediately, syncs to Firebase in background)
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

  await db.meta.put({
    key: CACHE_KEY,
    value: {
      data: memoryCache,
      timestamp: lastSyncTime,
      userId
    }
  })

  syncToFirebase(userId).catch(e => console.error('Background sync failed:', e))

  return newAlert.id
}

// Remove alert
export async function removeAlertCached(userId, alertId) {
  if (!userId || !memoryCache) return

  memoryCache.alerts = (memoryCache.alerts || []).filter(a => a.id !== alertId)
  pendingChanges = true

  await db.meta.put({
    key: CACHE_KEY,
    value: {
      data: memoryCache,
      timestamp: lastSyncTime,
      userId
    }
  })

  syncToFirebase(userId).catch(e => console.error('Background sync failed:', e))
}

// Toggle alert
export async function toggleAlertCached(userId, alertId) {
  if (!userId || !memoryCache) return

  memoryCache.alerts = (memoryCache.alerts || []).map(a =>
    a.id === alertId ? { ...a, enabled: !a.enabled } : a
  )
  pendingChanges = true

  await db.meta.put({
    key: CACHE_KEY,
    value: {
      data: memoryCache,
      timestamp: lastSyncTime,
      userId
    }
  })

  syncToFirebase(userId).catch(e => console.error('Background sync failed:', e))
}

// Sync pending changes to Firebase
async function syncToFirebase(userId) {
  if (!userId || !memoryCache || !pendingChanges) return

  try {
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
  } catch (e) {
    console.error('Failed to sync to Firebase:', e)
    // Changes are still in local cache, will retry on next action
  }
}

// Check if there are pending changes
export function hasPendingChanges() {
  return pendingChanges
}

// Get last sync time
export function getLastSyncTime() {
  return lastSyncTime
}

// Clear cache (on logout)
export async function clearPriceOracleCache() {
  memoryCache = null
  lastSyncTime = 0
  pendingChanges = false
  await db.meta.delete(CACHE_KEY)
}
