import Dexie from 'dexie'

// Create the database
export const db = new Dexie('mtg-card-search')

// Version 7 - Declares a name_search index for punctuation-insensitive
// lookups. Deliberately does NOT backfill existing rows: rewriting 32k
// records, each with a multi-entry word index, took long enough on a phone
// to look like a hang. New cards get the field from processCard, and the
// suggestion lookup does not depend on it — it derives the same result from
// the name_words index plus a small in-memory filter, which needs no
// migration at all.
db.version(7).stores({
  cards: 'id, name, name_normalized, name_search, *name_words, flavor_name, flavor_name_normalized, flavor_name_search, type_line, mana_cost, cmc, set, rarity, colors, power, toughness, artist, loyalty, color_identity, reserved, edhrec_rank, released_at',
  meta: 'key',
  lists: 'id, name, createdAt, updatedAt, synced',
  listCards: '[listId+cardId], listId, cardId, addedAt, synced'
})

// Version 6 - Added normalized name fields for fast indexed suggestion lookup
db.version(6).stores({
  cards: 'id, name, name_normalized, *name_words, flavor_name, flavor_name_normalized, type_line, mana_cost, cmc, set, rarity, colors, power, toughness, artist, loyalty, color_identity, reserved, edhrec_rank, released_at',
  meta: 'key',
  lists: 'id, name, createdAt, updatedAt, synced',
  listCards: '[listId+cardId], listId, cardId, addedAt, synced'
}).upgrade(tx => {
  // Clear cards to force re-download with normalized fields populated
  return tx.table('cards').clear()
})

// Version 5 - Added flavor_name for Secret Lair / Universe Beyond alternate names
db.version(5).stores({
  cards: 'id, name, flavor_name, type_line, mana_cost, cmc, set, rarity, colors, power, toughness, artist, loyalty, color_identity, reserved, edhrec_rank, released_at',
  meta: 'key',
  lists: 'id, name, createdAt, updatedAt, synced',
  listCards: '[listId+cardId], listId, cardId, addedAt, synced'
}).upgrade(tx => {
  // Clear cards to force re-download with flavor_name field
  return tx.table('cards').clear()
})

// Version 4 - Added local lists support for offline
db.version(4).stores({
  cards: 'id, name, type_line, mana_cost, cmc, set, rarity, colors, power, toughness, artist, loyalty, color_identity, reserved, edhrec_rank, released_at',
  meta: 'key',
  lists: 'id, name, createdAt, updatedAt, synced',
  listCards: '[listId+cardId], listId, cardId, addedAt, synced'
})

// Version 3 - Full featured database with all searchable fields
db.version(3).stores({
  cards: 'id, name, type_line, mana_cost, cmc, set, rarity, colors, power, toughness, artist, loyalty, color_identity, reserved, edhrec_rank, released_at',
  meta: 'key'
}).upgrade(tx => {
  // Clear cards to force re-download with new fields
  return tx.table('cards').clear()
})

db.version(2).stores({
  cards: 'id, name, type_line, mana_cost, cmc, set, rarity, colors, power, toughness, artist',
  meta: 'key'
})

db.version(1).stores({
  cards: 'id, name, type_line, mana_cost, cmc, set, rarity, colors',
  meta: 'key'
})

// An IndexedDB version change needs every other connection closed first.
// Without these handlers a second tab left open at the old version blocks the
// upgrade forever, and the app sits on "Checking database" with no way out.
db.on('blocked', () => {
  console.warn('Database upgrade blocked by another open tab')
})

// Another tab is upgrading: let go so it can proceed.
db.on('versionchange', () => {
  console.warn('Database version change requested elsewhere; closing this connection')
  db.close()
})

/**
 * Open the database, failing loudly instead of hanging.
 *
 * Rejects with a tagged error so the caller can tell "another tab is holding
 * it open" apart from a genuine failure.
 */
export function openDatabase(timeoutMs = 60000) {
  let blocked = false
  const onBlocked = () => { blocked = true }
  db.on('blocked', onBlocked)

  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(
        blocked
          ? 'Database upgrade is waiting on another open tab or window.'
          : 'Database took too long to open.'
      )
      error.code = blocked ? 'blocked' : 'timeout'
      reject(error)
    }, timeoutMs)
  })

  return Promise.race([db.open(), timeout])
}

/**
 * Last resort: delete the local database entirely.
 *
 * Only touches the offline card cache — lists and watchlists live in the
 * account, so nothing synced is lost. The caller reloads afterwards and the
 * app downloads the cards again.
 */
export async function resetDatabase() {
  try {
    db.close()
  } catch {
    // Already closed, or never opened.
  }
  await Dexie.delete('mtg-card-search')
}

// Check if database has cards
export async function hasCards() {
  const count = await db.cards.count()
  return count > 0
}

// Get database info
export async function getDbInfo() {
  const count = await db.cards.count()
  const meta = await db.meta.get('lastSync')
  return {
    cardCount: count,
    lastSync: meta?.value || null
  }
}
