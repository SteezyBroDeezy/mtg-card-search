import Dexie from 'dexie'

// Create the database
export const db = new Dexie('mtg-card-search')

 // Version 6 - Added normalized name fields for fast indexed suggestion lookup
  db.version(6).stores({
    cards: 'id, name, name_normalized, *name_words, flavor_name, flavor_name_normalized, type_line, mana_cost,
  cmc, set, rarity, colors, power, toughness, artist, loyalty, color_identity, reserved, edhrec_rank,
  released_at',
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
