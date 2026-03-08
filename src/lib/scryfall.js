import { db } from './db'

const SCRYFALL_API = 'https://api.scryfall.com'

// Process a raw card from Scryfall into our compact format
function processCard(card) {
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

// Delay helper to respect Scryfall rate limits
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Download cards using paginated API calls - mobile friendly!
export async function downloadCards(onProgress) {
  const startTime = Date.now()

  onProgress?.({
    step: 'Preparing download...',
    percent: 0,
    detail: 'This may take a few minutes'
  })

  // Clear existing cards
  await db.cards.clear()

  // We'll fetch all unique cards using search API with pagination
  // Using "game:paper" to get paper cards, unique:cards for one per name
  let nextUrl = `${SCRYFALL_API}/cards/search?q=game%3Apaper&unique=cards&order=name`
  let totalSaved = 0
  let pageNum = 0
  const estimatedTotal = 27000 // Approximate unique cards

  while (nextUrl) {
    pageNum++

    onProgress?.({
      step: `Downloading page ${pageNum}...`,
      percent: Math.min(95, Math.floor((totalSaved / estimatedTotal) * 95)),
      detail: `${totalSaved.toLocaleString()} cards saved`
    })

    try {
      const response = await fetch(nextUrl)

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait and retry
          onProgress?.({
            step: 'Rate limited, waiting...',
            percent: Math.floor((totalSaved / estimatedTotal) * 95),
            detail: 'Scryfall rate limit - resuming shortly'
          })
          await delay(1000)
          continue
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.data && data.data.length > 0) {
        // Process and save this batch
        const cards = data.data.map(processCard).filter(Boolean)

        if (cards.length > 0) {
          await db.cards.bulkAdd(cards)
          totalSaved += cards.length
        }
      }

      // Check for next page
      if (data.has_more && data.next_page) {
        nextUrl = data.next_page
        // Respect rate limits - 100ms between requests
        await delay(100)
      } else {
        nextUrl = null
      }

    } catch (error) {
      console.error('Fetch error:', error)
      // On error, wait and retry
      await delay(500)
    }
  }

  await db.meta.put({ key: 'lastSync', value: new Date().toISOString() })

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  onProgress?.({
    step: 'Done!',
    percent: 100,
    detail: `${totalSaved.toLocaleString()} cards in ${totalTime} minutes`
  })

  return totalSaved
}
