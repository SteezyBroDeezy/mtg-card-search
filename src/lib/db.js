import Dexie from 'dexie'

  // Create the database
  export const db = new Dexie('mtg-card-search')

  // Define tables
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

  