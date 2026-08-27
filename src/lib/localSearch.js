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
export async function searchLocal({ filters, nameSearch }, limit = 500, onFullScan) {
  // 1. Anchored on an indexed filter — narrow first, predicate second.
  const anchored = anchorCollection(filters)
  if (anchored) {
    return await anchored
      .filter(card => matchesFilters(card, filters, nameSearch))
      .limit(limit)
      .toArray()
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
