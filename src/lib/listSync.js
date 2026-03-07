import { db } from './db'
import {
  getLists,
  createList as firebaseCreateList,
  deleteList as firebaseDeleteList,
  getCardsInList,
  addCardToList as firebaseAddCard,
  removeCardFromList as firebaseRemoveCard
} from './firebase'
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore'
import { firestore } from './firebase'

// Generate a local ID for offline-created items
function generateLocalId() {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Get all lists (local first, with sync status)
export async function getLocalLists() {
  return await db.lists.toArray()
}

// Create a list locally
export async function createListLocal(name) {
  const list = {
    id: generateLocalId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cardCount: 0,
    synced: false
  }
  await db.lists.add(list)
  return list
}

// Delete a list locally
export async function deleteListLocal(listId) {
  await db.lists.delete(listId)
  await db.listCards.where('listId').equals(listId).delete()
}

// Get cards in a list (local)
export async function getListCardsLocal(listId) {
  return await db.listCards.where('listId').equals(listId).toArray()
}

// Add card to list locally
export async function addCardToListLocal(listId, card, note = '') {
  const existing = await db.listCards.get([listId, card.id])
  if (existing) {
    // Already exists, just update note if different
    if (existing.note !== note) {
      await db.listCards.update([listId, card.id], { note, synced: false })
    }
    return existing
  }

  const listCard = {
    listId,
    cardId: card.id,
    name: card.name,
    image_small: card.image_small,
    image_normal: card.image_normal,
    note,
    addedAt: new Date().toISOString(),
    synced: false
  }
  await db.listCards.add(listCard)

  // Update card count
  const list = await db.lists.get(listId)
  if (list) {
    await db.lists.update(listId, {
      cardCount: (list.cardCount || 0) + 1,
      updatedAt: new Date().toISOString(),
      synced: false
    })
  }

  return listCard
}

// Remove card from list locally
export async function removeCardFromListLocal(listId, cardId) {
  await db.listCards.delete([listId, cardId])

  // Update card count
  const list = await db.lists.get(listId)
  if (list) {
    await db.lists.update(listId, {
      cardCount: Math.max((list.cardCount || 1) - 1, 0),
      updatedAt: new Date().toISOString(),
      synced: false
    })
  }
}

// Sync lists with Firebase
export async function syncLists(userId) {
  if (!userId) return { success: false, error: 'Not logged in' }

  try {
    // 1. Get local lists
    const localLists = await db.lists.toArray()

    // 2. Get Firebase lists
    const firebaseLists = await getLists(userId)

    // 3. Create a map of Firebase lists by ID
    const firebaseListMap = new Map(firebaseLists.map(l => [l.id, l]))
    const localListMap = new Map(localLists.map(l => [l.id, l]))

    // 4. Push local-only lists to Firebase
    for (const local of localLists) {
      if (local.id.startsWith('local_') && !local.synced) {
        // This is a new local list, create in Firebase
        const listRef = doc(collection(firestore, 'users', userId, 'lists'))
        await setDoc(listRef, {
          name: local.name,
          createdAt: local.createdAt,
          cardCount: local.cardCount || 0
        })

        // Get cards for this list and push them too
        const localCards = await db.listCards.where('listId').equals(local.id).toArray()
        for (const card of localCards) {
          const cardRef = doc(firestore, 'users', userId, 'lists', listRef.id, 'cards', card.cardId)
          await setDoc(cardRef, {
            cardId: card.cardId,
            name: card.name,
            image_small: card.image_small,
            image_normal: card.image_normal,
            note: card.note || '',
            addedAt: card.addedAt
          })
        }

        // Update local list with Firebase ID
        await db.lists.delete(local.id)
        await db.listCards.where('listId').equals(local.id).modify({ listId: listRef.id, synced: true })
        await db.lists.add({
          ...local,
          id: listRef.id,
          synced: true
        })
      }
    }

    // 5. Pull Firebase lists that don't exist locally
    for (const firebase of firebaseLists) {
      if (!localListMap.has(firebase.id)) {
        // New list from Firebase, add locally
        await db.lists.put({
          id: firebase.id,
          name: firebase.name,
          createdAt: firebase.createdAt,
          updatedAt: firebase.createdAt,
          cardCount: firebase.cardCount || 0,
          synced: true
        })

        // Also fetch and store cards
        const firebaseCards = await getCardsInList(userId, firebase.id)
        for (const card of firebaseCards) {
          await db.listCards.put({
            listId: firebase.id,
            cardId: card.cardId || card.id,
            name: card.name,
            image_small: card.image_small,
            image_normal: card.image_normal,
            note: card.note || '',
            addedAt: card.addedAt,
            synced: true
          })
        }
      }
    }

    // 6. Sync unsynced cards for existing lists
    const unsyncedCards = await db.listCards.where('synced').equals(false).toArray()
    for (const card of unsyncedCards) {
      if (!card.listId.startsWith('local_')) {
        const cardRef = doc(firestore, 'users', userId, 'lists', card.listId, 'cards', card.cardId)
        await setDoc(cardRef, {
          cardId: card.cardId,
          name: card.name,
          image_small: card.image_small,
          image_normal: card.image_normal,
          note: card.note || '',
          addedAt: card.addedAt
        })
        await db.listCards.update([card.listId, card.cardId], { synced: true })
      }
    }

    // 7. Mark all local lists as synced
    await db.lists.toCollection().modify({ synced: true })

    // 8. Save last sync time
    await db.meta.put({ key: 'lastListSync', value: new Date().toISOString() })

    return { success: true }
  } catch (error) {
    console.error('Sync failed:', error)
    return { success: false, error: error.message }
  }
}

// Get last sync time
export async function getLastSyncTime() {
  const meta = await db.meta.get('lastListSync')
  return meta?.value || null
}

// Check if there are unsynced changes
export async function hasUnsyncedChanges() {
  const unsyncedLists = await db.lists.where('synced').equals(false).count()
  const unsyncedCards = await db.listCards.where('synced').equals(false).count()
  return unsyncedLists > 0 || unsyncedCards > 0
}
