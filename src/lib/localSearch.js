import { db } from './db'
import { matchesFilters } from './search'

// Offline search strategy.
//
// The naive approach — db.cards.filter(predicate) — walks every row with a
// cursor, deserializing all 32,726 cards (~53MB) on every single search.
// That is what made searching stall on a phone.
//
// Instead, pick an indexed "anchor" that narrows the candidate set inside
// IndexedDB, then run the full predicate over only those candidates. A
// search for `t:creature s:neo` touches a few hundred rows instead of
// thirty thousand.

/**
 * Choose the most selective indexed query available for these filters.
 * Returns a Dexie Collection, or null when nothing is anchorable.
 */
function anchorCollection(filters) {
  const find = (type) => filters.find(f => f.type === type && !f.negated)

  // Set codes are the most selective thing a query can carry.
  const set = find('set')
  if (set?.value) return db.cards.where('set').equals(String(set.value).toLowerCase())

  const artist = find('artist')
  if (artist?.value) return db.cards.where('artist').startsWithIgnoreCase(String(artist.value))

  const cmc = find('cmc')
  if (cmc && (cmc.operator === '=' || !cmc.operator)) {
    return db.cards.where('cmc').equals(Number(cmc.value))
  }

  const edhrec = find('edhrec')
  if (edhrec && String(edhrec.operator || '<=').startsWith('<')) {
    return db.cards.where('edhrec_rank').belowOrEqual(Number(edhrec.value))
  }

  const rarity = find('rarity')
  if (rarity?.value) return db.cards.where('rarity').equals(String(rarity.value).toLowerCase())

  // t: is one of the most common filters and used to force a full scan.
  // Anchor on the first word of the value; the predicate still confirms the
  // full match, so partial words like t:creat keep working.
  const type = find('type')
  if (type?.value) {
    const word = String(type.value).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)[0]
    if (word) return { collection: db.cards.where('type_words').startsWith(word), unverified: true }
  }

  return null
}

/**
 * Indexed candidates for a name search: cards whose full name, or any word
 * in it, begins with what was typed. Covers the overwhelming majority of
 * real searches without touching the rest of the table.
 */
async function nameCandidates(nameSearch, limit) {
  const term = nameSearch.toLowerCase().trim()
  if (!term) return null

  const [byName, byWord] = await Promise.all([
    db.cards.where('name_normalized').startsWith(term).limit(limit).toArray(),
    db.cards.where('name_words').startsWith(term).limit(limit).toArray(),
  ])

  const seen = new Set()
  const out = []
  for (const card of [...byName, ...byWord]) {
    if (seen.has(card.id)) continue
    seen.add(card.id)
    out.push(card)
  }
  return out
}

/**
 * Run a parsed query against the local database.
 *
 * `onFullScan` is called when the fast paths miss and every row has to be
 * read, so the UI can say so rather than appearing frozen.
 */
// Handful of recent result sets, keyed by the parsed query. Re-running a
// search — going back from a card, restoring on reopen, toggling a sort —
// then costs nothing. Deliberately small: a full result set is up to 500
// cards.
const CACHE_LIMIT = 5
const resultCache = new Map()

export function clearSearchCache() {
  resultCache.clear()
}

export async function searchLocal({ filters, nameSearch }, limit = 500, onFullScan) {
  const cacheKey = JSON.stringify({ filters, nameSearch, limit })
  if (resultCache.has(cacheKey)) {
    const hit = resultCache.get(cacheKey)
    // Refresh recency.
    resultCache.delete(cacheKey)
    resultCache.set(cacheKey, hit)
    return hit
  }

  const results = await runSearch({ filters, nameSearch }, limit, onFullScan)

  resultCache.set(cacheKey, results)
  if (resultCache.size > CACHE_LIMIT) {
    resultCache.delete(resultCache.keys().next().value)
  }
  return results
}

async function runSearch({ filters, nameSearch }, limit, onFullScan) {
  // 1. Anchored on an indexed filter — narrow first, predicate second.
  const anchor = anchorCollection(filters)
  if (anchor) {
    const collection = anchor.collection || anchor
    const results = await collection
      .filter(card => matchesFilters(card, filters, nameSearch))
      .limit(limit)
      .toArray()

    // An "unverified" anchor (type_words) is only present on cards stored
    // since that index was added. No hits may mean no matches, or may mean
    // the index is empty for this database — fall through rather than
    // wrongly reporting nothing found.
    if (results.length > 0 || !anchor.unverified) return results
  }

  // 2. Name-led search: indexed prefix lookups, then the remaining filters.
  if (nameSearch) {
    const candidates = await nameCandidates(nameSearch, limit)
    if (candidates && candidates.length > 0) {
      const matched = candidates.filter(card => matchesFilters(card, filters, nameSearch))
      if (matched.length > 0) return matched.slice(0, limit)
    }
    // Nothing began with the term — it may appear mid-word ("olt" in
    // "Lightning Bolt"), which no prefix index can answer.
  }

  // 3. Whole-table scan. Oracle text and type searches land here by nature:
  // no index can answer "contains this phrase".
  onFullScan?.()
  return await fullScan(filters, nameSearch, limit)
}

// Rows pulled per batch during a scan. Big enough that the native bulk read
// dominates, small enough that peak memory stays a few MB rather than the
// ~53MB the whole table would occupy.
const SCAN_CHUNK = 2000

/**
 * Scan every card in primary-key order, in batches, stopping as soon as
 * enough matches are found.
 *
 * Dexie's .filter() walks the table with a cursor, one row at a time, and
 * that per-row overhead is what made unanchored searches crawl on a phone.
 * Reading a block at a time uses IndexedDB's bulk path instead, and a query
 * with plenty of matches now stops after a batch or two rather than always
 * paying for the full table.
 */
async function fullScan(filters, nameSearch, limit) {
  const results = []
  let cursorId = null

  for (;;) {
    const batch = cursorId === null
      ? await db.cards.limit(SCAN_CHUNK).toArray()
      : await db.cards.where('id').above(cursorId).limit(SCAN_CHUNK).toArray()

    if (batch.length === 0) break

    for (const card of batch) {
      if (matchesFilters(card, filters, nameSearch)) {
        results.push(card)
        if (results.length >= limit) return results
      }
    }

    if (batch.length < SCAN_CHUNK) break
    cursorId = batch[batch.length - 1].id
    // Let the UI breathe between batches so typing and taps stay responsive.
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  return results
}
