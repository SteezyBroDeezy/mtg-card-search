import { db } from './db'

  const BULK_DATA_URL = 'https://api.scryfall.com/bulk-data'

  export async function downloadCards(onProgress) {
    onProgress?.({ step: 'Finding download URL...', percent: 0 })

    const bulkResponse = await fetch(BULK_DATA_URL)
    const bulkData = await bulkResponse.json()

    const defaultCards = bulkData.data.find(d => d.type === 'default_cards')
    if (!defaultCards) {
      throw new Error('Could not find default_cards dataset')
    }

    onProgress?.({ step: 'Downloading cards...', percent: 10 })

    const response = await fetch(defaultCards.download_uri)
    const cards = await response.json()

    onProgress?.({ step: 'Processing cards...', percent: 50 })

    const paperCards = cards
      .filter(card => card.games?.includes('paper'))
      .map(card => ({
        id: card.id,
        name: card.name,
        type_line: card.type_line || '',
        mana_cost: card.mana_cost || '',
        cmc: card.cmc || 0,
        oracle_text: card.oracle_text || '',
        set: card.set,
        set_name: card.set_name,
        rarity: card.rarity,
        colors: card.colors || [],
        color_identity: card.color_identity || [],
        image_small: card.image_uris?.small || '',
        image_normal: card.image_uris?.normal || '',
        prices: card.prices || {},
        legalities: card.legalities || {}
      }))

    onProgress?.({ step: 'Saving to database...', percent: 70 })

    await db.cards.clear()

    const batchSize = 5000
    for (let i = 0; i < paperCards.length; i += batchSize) {
      const batch = paperCards.slice(i, i + batchSize)
      await db.cards.bulkAdd(batch)
      const percent = 70 + Math.floor((i / paperCards.length) * 25)
      onProgress?.({
        step: 'Saving cards... ' + (i + batch.length) + ' / ' +
  paperCards.length,
        percent: percent
      })
    }

    await db.meta.put({ key: 'lastSync', value: new Date().toISOString() })

    onProgress?.({ step: 'Done!', percent: 100 })

    return paperCards.length
  }