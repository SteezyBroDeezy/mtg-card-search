import { db } from './db'

// Keeping stored prices current without re-downloading everything.
//
// Two different problems, two different mechanisms:
//
// 1. A new set introduces a cheaper reprint, so a different printing should
//    now represent the card. The incremental sync already handles this: its
//    date>= query combined with prefer:usd-low returns the cheapest printing
//    of anything reprinted in the window, and overwrites the stored row.
//
// 2. Prices of cards that weren't reprinted simply drift. Nothing re-fetches
//    those short of a full re-download — which is what this file is for. It
//    refreshes only the cards you are actually looking at, in one request per
//    75 cards, via Scryfall's collection endpoint.

const SCRYFALL_API = 'https://api.scryfall.com'
const BATCH_SIZE = 75

// Don't re-fetch the same card repeatedly while browsing.
const DEFAULT_MAX_AGE_MS = 12 * 60 * 60 * 1000

function isStale(card, maxAgeMs) {
  if (!card?.prices_updated_at) return true
  const age = Date.now() - new Date(card.prices_updated_at).getTime()
  return !Number.isFinite(age) || age > maxAgeMs
}

/**
 * Refresh prices for the given cards, newest first.
 *
 * Returns a Map of card id to { prices, changed, previousUsd } so callers
 * can report how many actually moved. Cards priced recently are skipped. Best effort: on any failure the stored
 * prices simply stay as they are.
 */
export async function refreshPrices(cards, { maxAgeMs = DEFAULT_MAX_AGE_MS, force = false } = {}) {
  const updated = new Map()
  if (!navigator.onLine || !Array.isArray(cards) || cards.length === 0) return updated

  const targets = cards.filter(c => c?.id && (force || isStale(c, maxAgeMs)))
  if (targets.length === 0) return updated

  const stamp = new Date().toISOString()

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE)
    try {
      const response = await fetch(`${SCRYFALL_API}/cards/collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: batch.map(c => ({ id: c.id })) }),
      })
      if (!response.ok) break

      const data = await response.json()
      const rows = []
      const previous = new Map(batch.map(c => [c.id, c.prices?.usd ?? null]))
      for (const card of data.data || []) {
        if (!card.id || !card.prices) continue
        const before = previous.get(card.id)
        const after = card.prices.usd ?? null
        updated.set(card.id, {
          prices: card.prices,
          changed: before !== after,
          previousUsd: before,
        })
        rows.push({ id: card.id, prices: card.prices, prices_updated_at: stamp })
      }

      // Write just the two changed fields, leaving the rest of the row alone.
      await Promise.all(
        rows.map(row =>
          db.cards.update(row.id, {
            prices: row.prices,
            prices_updated_at: row.prices_updated_at,
          }).catch(() => {})
        )
      )

      if (i + BATCH_SIZE < targets.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.warn('Price refresh failed:', error)
      break
    }
  }

  return updated
}

/** Oldest price timestamp among these cards, or null if none carry one. */
export function oldestPriceAge(cards) {
  let oldest = null
  for (const card of cards || []) {
    if (!card?.prices_updated_at) continue
    const time = new Date(card.prices_updated_at).getTime()
    if (Number.isFinite(time) && (oldest === null || time < oldest)) oldest = time
  }
  return oldest
}
