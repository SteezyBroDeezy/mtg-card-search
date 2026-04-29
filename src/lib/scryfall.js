import { db } from './db'

const SCRYFALL_API = 'https://api.scryfall.com'

  // Normalize text for indexed suggestion lookup.
  // Keep this in sync with the normalize used in SearchBar.jsx.
  export function normalizeText(text) {
    if (!text) return ''
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[''`]/g, '')
      .replace(/[æ]/gi, 'ae')
      .replace(/[œ]/gi, 'oe')
      .toLowerCase()
  }

// Process a raw card from Scryfall into our compact format
function processCard(card) {
  const hasMultipleFaces = card.card_faces && card.card_faces.length > 1

  let cardData = {
    id: card.id,
    name: card.name,
flavor_name: card.flavor_name || '', // Secret Lair / Universe Beyond alternate names
  name_normalized: normalizeText(card.name),
  name_words: normalizeText(card.name).split(/\s+/).filter(Boolean),
  flavor_name_normalized: normalizeText(card.flavor_name || ''),
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
  // Initial estimate; refined from data.total_cards on the first response
  let estimatedTotal = 32000
  // Track the latest release date seen so future syncs can be incremental
  let latestRelease = ''

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

      // Use the real total from Scryfall once we know it
      if (typeof data.total_cards === 'number' && data.total_cards > 0) {
        estimatedTotal = data.total_cards
      }

      if (data.data && data.data.length > 0) {
        // Process and save this batch
        const cards = data.data.map(processCard).filter(Boolean)

        if (cards.length > 0) {
          await db.cards.bulkAdd(cards)
          totalSaved += cards.length
          for (const c of cards) {
            if (c.released_at && c.released_at > latestRelease) {
              latestRelease = c.released_at
            }
          }
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
  if (latestRelease) {
    await db.meta.put({ key: 'lastReleaseSeen', value: latestRelease })
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  onProgress?.({
    step: 'Done!',
    percent: 100,
    detail: `${totalSaved.toLocaleString()} cards in ${totalTime} minutes`
  })

  return totalSaved
}

// Incremental sync: only fetch cards released since last sync.
// Falls back to a full downloadCards() if there's no prior sync to compare against.
export async function syncNewCards(onProgress) {
  const lastReleaseMeta = await db.meta.get('lastReleaseSeen')
  const cardCount = await db.cards.count()

  // No prior sync OR DB was wiped — do a full download instead.
  if (!lastReleaseMeta?.value || cardCount === 0) {
    return await downloadCards(onProgress)
  }

  const startTime = Date.now()

  // 30-day overlap window catches errata / late-added reprints we may have missed.
  const lastDate = new Date(lastReleaseMeta.value)
  const overlapMs = 30 * 24 * 60 * 60 * 1000
  const sinceDate = new Date(lastDate.getTime() - overlapMs)
  const sinceStr = sinceDate.toISOString().slice(0, 10)

  onProgress?.({
    step: 'Checking for new cards...',
    percent: 0,
    detail: `Looking for cards since ${sinceStr}`
  })

  const query = `game:paper date>=${sinceStr}`
  let nextUrl = `${SCRYFALL_API}/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name`
  let totalUpdated = 0
  let pageNum = 0
  let estimatedTotal = 500
  let latestRelease = lastReleaseMeta.value

  while (nextUrl) {
    pageNum++

    onProgress?.({
      step: `Syncing new cards (page ${pageNum})...`,
      percent: Math.min(95, Math.floor((totalUpdated / Math.max(estimatedTotal, 1)) * 95)),
      detail: `${totalUpdated.toLocaleString()} cards updated`
    })

    try {
      const response = await fetch(nextUrl)

      if (!response.ok) {
        if (response.status === 404) {
          // Scryfall returns 404 when no cards match — already up to date.
          nextUrl = null
          break
        }
        if (response.status === 429) {
          await delay(1000)
          continue
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (typeof data.total_cards === 'number' && data.total_cards > 0) {
        estimatedTotal = data.total_cards
      }

      if (data.data && data.data.length > 0) {
        const cards = data.data.map(processCard).filter(Boolean)
        if (cards.length > 0) {
          // bulkPut upserts — overwrites any existing rows with same id (errata, etc).
          await db.cards.bulkPut(cards)
          totalUpdated += cards.length
          for (const c of cards) {
            if (c.released_at && c.released_at > latestRelease) {
              latestRelease = c.released_at
            }
          }
        }
      }

      if (data.has_more && data.next_page) {
        nextUrl = data.next_page
        await delay(100)
      } else {
        nextUrl = null
      }
    } catch (error) {
      console.error('Sync fetch error:', error)
      await delay(500)
    }
  }

  await db.meta.put({ key: 'lastSync', value: new Date().toISOString() })
  await db.meta.put({ key: 'lastReleaseSeen', value: latestRelease })

  const totalSeconds = ((Date.now() - startTime) / 1000).toFixed(1)
  onProgress?.({
    step: 'Done!',
    percent: 100,
    detail: totalUpdated > 0
      ? `${totalUpdated.toLocaleString()} card${totalUpdated === 1 ? '' : 's'} updated in ${totalSeconds}s`
      : `Already up to date (checked in ${totalSeconds}s)`
  })

  // Return the new total card count so callers can update UI state.
  return await db.cards.count()
}
