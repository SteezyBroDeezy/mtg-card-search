import { db } from './db'

const BULK_DATA_URL = 'https://api.scryfall.com/bulk-data'

export async function downloadCards(onProgress) {
  const startTime = Date.now()

  onProgress?.({
    step: 'Finding download URL...',
    percent: 0,
    detail: 'Connecting to Scryfall API'
  })

  const bulkResponse = await fetch(BULK_DATA_URL)
  const bulkData = await bulkResponse.json()

  const defaultCards = bulkData.data.find(d => d.type === 'default_cards')
  if (!defaultCards) {
    throw new Error('Could not find default_cards dataset')
  }

  const fileSizeMB = (defaultCards.size / 1024 / 1024).toFixed(1)
  onProgress?.({
    step: 'Downloading cards...',
    percent: 5,
    detail: `Fetching ${fileSizeMB}MB from Scryfall`
  })

  const response = await fetch(defaultCards.download_uri)
  const reader = response.body.getReader()
  const contentLength = +response.headers.get('Content-Length') || defaultCards.size

  let receivedLength = 0
  const chunks = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    chunks.push(value)
    receivedLength += value.length

    const percentDownloaded = Math.floor((receivedLength / contentLength) * 40) + 5
    const downloadedMB = (receivedLength / 1024 / 1024).toFixed(1)
    const elapsed = (Date.now() - startTime) / 1000
    const speed = (receivedLength / 1024 / 1024 / elapsed).toFixed(1)

    onProgress?.({
      step: 'Downloading cards...',
      percent: percentDownloaded,
      detail: `${downloadedMB}MB / ${fileSizeMB}MB (${speed} MB/s)`
    })
  }

  onProgress?.({
    step: 'Processing download...',
    percent: 45,
    detail: 'Parsing JSON data'
  })

  const chunksAll = new Uint8Array(receivedLength)
  let position = 0
  for (const chunk of chunks) {
    chunksAll.set(chunk, position)
    position += chunk.length
  }

  const jsonText = new TextDecoder('utf-8').decode(chunksAll)
  const cards = JSON.parse(jsonText)

  onProgress?.({
    step: 'Processing cards...',
    percent: 50,
    detail: `Found ${cards.length.toLocaleString()} total cards`
  })

  const paperCards = cards
    .filter(card => card.games?.includes('paper'))
    .map(card => {
      // Handle double-faced cards
      const hasMultipleFaces = card.card_faces && card.card_faces.length > 1

      let cardData = {
        id: card.id,
        name: card.name,
        type_line: card.type_line || '',
        mana_cost: card.mana_cost || '',
        cmc: card.cmc || 0,
        oracle_text: card.oracle_text || '',
        power: card.power || '',
        toughness: card.toughness || '',
        artist: card.artist || '',
        set: card.set,
        set_name: card.set_name,
        rarity: card.rarity,
        colors: card.colors || [],
        color_identity: card.color_identity || [],
        prices: card.prices || {},
        legalities: card.legalities || {},
        keywords: card.keywords || [],
        flavor_text: card.flavor_text || ''
      }

      // Single-faced card
      if (card.image_uris) {
        cardData.image_small = card.image_uris.small || ''
        cardData.image_normal = card.image_uris.normal || ''
        cardData.image_large = card.image_uris.large || ''
        cardData.card_faces = null
      }
      // Double-faced / multi-faced card
      else if (hasMultipleFaces) {
        const faces = card.card_faces.map(face => ({
          name: face.name,
          mana_cost: face.mana_cost || '',
          type_line: face.type_line || '',
          oracle_text: face.oracle_text || '',
          power: face.power || '',
          toughness: face.toughness || '',
          image_small: face.image_uris?.small || '',
          image_normal: face.image_uris?.normal || '',
          image_large: face.image_uris?.large || ''
        }))

        cardData.card_faces = faces
        cardData.image_small = faces[0].image_small
        cardData.image_normal = faces[0].image_normal
        cardData.image_large = faces[0].image_large
        cardData.oracle_text = faces.map(f => f.oracle_text).join('\n---\n')

        // Get power/toughness from first face if main card doesn't have it
        if (!cardData.power && faces[0].power) {
          cardData.power = faces[0].power
        }
        if (!cardData.toughness && faces[0].toughness) {
          cardData.toughness = faces[0].toughness
        }
      }
      // No images
      else {
        cardData.image_small = ''
        cardData.image_normal = ''
        cardData.image_large = ''
        cardData.card_faces = null
      }

      return cardData
    })

  const paperCount = paperCards.length
  onProgress?.({
    step: 'Saving to database...',
    percent: 55,
    detail: `Preparing ${paperCount.toLocaleString()} paper cards`
  })

  await db.cards.clear()

  const batchSize = 5000
  for (let i = 0; i < paperCards.length; i += batchSize) {
    const batch = paperCards.slice(i, i + batchSize)
    await db.cards.bulkAdd(batch)

    const saved = i + batch.length
    const percent = 55 + Math.floor((saved / paperCards.length) * 40)
    const elapsed = (Date.now() - startTime) / 1000
    const rate = Math.floor(saved / elapsed)

    onProgress?.({
      step: 'Saving cards...',
      percent: percent,
      detail: `${saved.toLocaleString()} / ${paperCount.toLocaleString()} (${rate.toLocaleString()} cards/sec)`
    })
  }

  await db.meta.put({ key: 'lastSync', value: new Date().toISOString() })

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  onProgress?.({
    step: 'Done!',
    percent: 100,
    detail: `${paperCount.toLocaleString()} cards in ${totalTime}s`
  })

  return paperCards.length
}
