import { db } from './db'

const BULK_DATA_URL = 'https://api.scryfall.com/bulk-data'

// Process a raw card from Scryfall into our compact format
function processCard(card) {
  if (!card.games?.includes('paper')) return null

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
    loyalty: card.loyalty || '',
    defense: card.defense || '',
    artist: card.artist || '',
    set: card.set,
    set_name: card.set_name,
    rarity: card.rarity,
    colors: card.colors || [],
    color_identity: card.color_identity || [],
    produced_mana: card.produced_mana || [],
    prices: card.prices || {},
    legalities: card.legalities || {},
    keywords: card.keywords || [],
    flavor_text: card.flavor_text || '',
    reserved: card.reserved || false,
    edhrec_rank: card.edhrec_rank || null,
    released_at: card.released_at || ''
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
      loyalty: face.loyalty || '',
      defense: face.defense || '',
      image_small: face.image_uris?.small || '',
      image_normal: face.image_uris?.normal || '',
      image_large: face.image_uris?.large || ''
    }))

    cardData.card_faces = faces
    cardData.image_small = faces[0].image_small
    cardData.image_normal = faces[0].image_normal
    cardData.image_large = faces[0].image_large
    cardData.oracle_text = faces.map(f => f.oracle_text).join('\n---\n')

    if (!cardData.power && faces[0].power) cardData.power = faces[0].power
    if (!cardData.toughness && faces[0].toughness) cardData.toughness = faces[0].toughness
    if (!cardData.loyalty && faces[0].loyalty) cardData.loyalty = faces[0].loyalty
  }
  // No images
  else {
    cardData.image_small = ''
    cardData.image_normal = ''
    cardData.image_large = ''
    cardData.card_faces = null
  }

  return cardData
}

// Streaming JSON array parser - processes cards one at a time
async function* streamJsonArray(response, onProgress, contentLength, startTime) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let buffer = ''
  let receivedLength = 0
  let inString = false
  let escapeNext = false
  let depth = 0
  let cardStart = -1
  let cardsYielded = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    receivedLength += value.length
    buffer += decoder.decode(value, { stream: true })

    // Report download progress
    const percentDownloaded = Math.floor((receivedLength / contentLength) * 35) + 5
    const downloadedMB = (receivedLength / 1024 / 1024).toFixed(1)
    const totalMB = (contentLength / 1024 / 1024).toFixed(1)
    const elapsed = (Date.now() - startTime) / 1000
    const speed = (receivedLength / 1024 / 1024 / elapsed).toFixed(1)

    onProgress?.({
      step: 'Downloading & processing...',
      percent: percentDownloaded,
      detail: `${downloadedMB}MB / ${totalMB}MB (${speed} MB/s) - ${cardsYielded.toLocaleString()} cards`
    })

    // Parse buffer for complete JSON objects
    let i = 0
    while (i < buffer.length) {
      const char = buffer[i]

      if (escapeNext) {
        escapeNext = false
        i++
        continue
      }

      if (char === '\\' && inString) {
        escapeNext = true
        i++
        continue
      }

      if (char === '"') {
        inString = !inString
        i++
        continue
      }

      if (inString) {
        i++
        continue
      }

      if (char === '{') {
        if (depth === 0) {
          cardStart = i
        }
        depth++
      } else if (char === '}') {
        depth--
        if (depth === 0 && cardStart !== -1) {
          // Found a complete card object
          const cardJson = buffer.slice(cardStart, i + 1)
          try {
            const card = JSON.parse(cardJson)
            const processed = processCard(card)
            if (processed) {
              cardsYielded++
              yield processed
            }
          } catch (e) {
            // Skip malformed JSON
          }
          cardStart = -1
        }
      }

      i++
    }

    // Keep only unprocessed portion of buffer
    if (cardStart !== -1) {
      buffer = buffer.slice(cardStart)
      cardStart = 0
    } else {
      // Find the last complete position we can safely discard
      // Keep some buffer for partial objects
      const lastBrace = buffer.lastIndexOf('}')
      if (lastBrace !== -1 && depth === 0) {
        buffer = buffer.slice(lastBrace + 1)
      }
    }

    // Prevent buffer from growing too large - force GC-friendly behavior
    if (buffer.length > 5000000 && depth === 0) {
      buffer = ''
    }
  }
}

export async function downloadCards(onProgress, useFullDataset = false) {
  const startTime = Date.now()

  onProgress?.({
    step: 'Finding download URL...',
    percent: 0,
    detail: 'Connecting to Scryfall API'
  })

  const bulkResponse = await fetch(BULK_DATA_URL)
  const bulkData = await bulkResponse.json()

  // Use oracle_cards (smaller, ~60MB) by default for mobile compatibility
  // Use default_cards (~200MB) only if explicitly requested
  const datasetType = useFullDataset ? 'default_cards' : 'oracle_cards'
  const dataset = bulkData.data.find(d => d.type === datasetType)

  if (!dataset) {
    throw new Error(`Could not find ${datasetType} dataset`)
  }

  const fileSizeMB = (dataset.size / 1024 / 1024).toFixed(1)
  const datasetLabel = useFullDataset ? 'all printings' : 'unique cards'
  onProgress?.({
    step: 'Starting download...',
    percent: 5,
    detail: `Fetching ${fileSizeMB}MB (${datasetLabel})`
  })

  const response = await fetch(dataset.download_uri)
  const contentLength = +response.headers.get('Content-Length') || dataset.size

  // Clear existing cards
  await db.cards.clear()

  // Stream and process cards
  let cardBatch = []
  let totalSaved = 0
  const batchSize = 1000 // Smaller batches for mobile

  onProgress?.({
    step: 'Downloading & processing...',
    percent: 5,
    detail: 'Starting stream...'
  })

  for await (const card of streamJsonArray(response, onProgress, contentLength, startTime)) {
    cardBatch.push(card)

    if (cardBatch.length >= batchSize) {
      await db.cards.bulkAdd(cardBatch)
      totalSaved += cardBatch.length
      cardBatch = []

      // Update progress
      const elapsed = (Date.now() - startTime) / 1000
      const rate = Math.floor(totalSaved / elapsed)
      onProgress?.({
        step: 'Saving cards...',
        percent: 40 + Math.min(55, Math.floor(totalSaved / 1500)), // Estimate ~80k cards
        detail: `${totalSaved.toLocaleString()} cards saved (${rate.toLocaleString()}/sec)`
      })
    }
  }

  // Save remaining cards
  if (cardBatch.length > 0) {
    await db.cards.bulkAdd(cardBatch)
    totalSaved += cardBatch.length
  }

  await db.meta.put({ key: 'lastSync', value: new Date().toISOString() })

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  onProgress?.({
    step: 'Done!',
    percent: 100,
    detail: `${totalSaved.toLocaleString()} cards in ${totalTime}s`
  })

  return totalSaved
}
