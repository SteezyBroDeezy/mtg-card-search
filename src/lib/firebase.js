import { initializeApp } from 'firebase/app'
  import { getAuth, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, onAuthStateChanged } from
  'firebase/auth'
  import { getFirestore, doc, setDoc, getDoc, collection, getDocs,
  deleteDoc, updateDoc } from 'firebase/firestore'

  const firebaseConfig = {
  apiKey: "AIzaSyDl40JiXr897hVYH63QOA3b8cCgX1e64pI",
  authDomain: "mtg-card-search-e0ed3.firebaseapp.com",
  projectId: "mtg-card-search-e0ed3",
  storageBucket: "mtg-card-search-e0ed3.firebasestorage.app",
  messagingSenderId: "1041838644245",
  appId: "1:1041838644245:web:3ed0313b6cd2b1e7e8021c",
  measurementId: "G-6NSQSJVNET"
};

 // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  export const auth = getAuth(app)
  export const firestore = getFirestore(app)

  // Auth functions
  export async function signUp(email, password) {
    const result = await createUserWithEmailAndPassword(auth, email,
  password)
    return result.user
  }

  export async function logIn(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  }

  export async function logOut() {
    await signOut(auth)
  }

  export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback)
  }

  // List functions
  export async function createList(userId, listName) {
    const listRef = doc(collection(firestore, 'users', userId, 'lists'))
    await setDoc(listRef, {
      name: listName,
      createdAt: new Date().toISOString(),
      cardCount: 0
    })
    return listRef.id
  }

  export async function getLists(userId) {
    const listsRef = collection(firestore, 'users', userId, 'lists')
    const snapshot = await getDocs(listsRef)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  export async function deleteList(userId, listId) {
    await deleteDoc(doc(firestore, 'users', userId, 'lists', listId))
  }

  export async function addCardToList(userId, listId, card, note = '') {
    const cardRef = doc(firestore, 'users', userId, 'lists', listId,
  'cards', card.id)
    await setDoc(cardRef, {
      cardId: card.id,
      name: card.name,
      image_small: card.image_small,
      image_normal: card.image_normal,
      note: note,
      addedAt: new Date().toISOString()
    })

    // Update card count
    const listRef = doc(firestore, 'users', userId, 'lists', listId)
    const listDoc = await getDoc(listRef)
    if (listDoc.exists()) {
      await updateDoc(listRef, {
        cardCount: (listDoc.data().cardCount || 0) + 1
      })
    }
  }

  export async function removeCardFromList(userId, listId, cardId) {
    await deleteDoc(doc(firestore, 'users', userId, 'lists', listId,
  'cards', cardId))

    // Update card count
    const listRef = doc(firestore, 'users', userId, 'lists', listId)
    const listDoc = await getDoc(listRef)
    if (listDoc.exists()) {
      await updateDoc(listRef, {
        cardCount: Math.max((listDoc.data().cardCount || 1) - 1, 0)
      })
    }
  }

  export async function getCardsInList(userId, listId) {
    const cardsRef = collection(firestore, 'users', userId, 'lists', listId,
   'cards')
    const snapshot = await getDocs(cardsRef)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  export async function updateCardNote(userId, listId, cardId, note) {
    const cardRef = doc(firestore, 'users', userId, 'lists', listId,
  'cards', cardId)
    await updateDoc(cardRef, { note })
  }

  // ==================== PRICE ORACLE FUNCTIONS ====================

  // Get user's Price Oracle data (watchlist, alerts, settings)
  export async function getPriceOracleData(userId) {
    const docRef = doc(firestore, 'priceOracleUsers', userId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data()
    }
    return { watchlist: [], alerts: [], settings: {} }
  }

  // Save Price Oracle data
  export async function savePriceOracleData(userId, data) {
    const docRef = doc(firestore, 'priceOracleUsers', userId)
    await setDoc(docRef, data, { merge: true })
  }

  // Add card to watchlist
  export async function addToWatchlist(userId, card) {
    const docRef = doc(firestore, 'priceOracleUsers', userId)
    const docSnap = await getDoc(docRef)
    const data = docSnap.exists() ? docSnap.data() : { watchlist: [], alerts: [] }

    // Check if already in watchlist
    if (data.watchlist?.some(c => c.id === card.id)) {
      return false // Already exists
    }

    const watchlistCard = {
      id: card.id,
      name: card.name,
      set: card.set,
      setName: card.set_name,
      rarity: card.rarity,
      image: card.image_small || card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small,
      price: parseFloat(card.prices?.usd) || parseFloat(card.prices?.usd_foil) || 0,
      priceStr: card.prices?.usd ? `$${card.prices.usd}` : card.prices?.usd_foil ? `$${card.prices.usd_foil}` : 'N/A',
      addedAt: new Date().toISOString()
    }

    data.watchlist = [...(data.watchlist || []), watchlistCard]
    await setDoc(docRef, data, { merge: true })
    return true
  }

  // Remove card from watchlist
  export async function removeFromWatchlist(userId, cardId) {
    const docRef = doc(firestore, 'priceOracleUsers', userId)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return

    const data = docSnap.data()
    data.watchlist = (data.watchlist || []).filter(c => c.id !== cardId)
    await setDoc(docRef, data, { merge: true })
  }

  // Check if card is in watchlist
  export async function isInWatchlist(userId, cardId) {
    const docRef = doc(firestore, 'priceOracleUsers', userId)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return false
    return docSnap.data().watchlist?.some(c => c.id === cardId) || false
  }

  // Add price alert
  export async function addPriceAlert(userId, alert) {
    const docRef = doc(firestore, 'priceOracleUsers', userId)
    const docSnap = await getDoc(docRef)
    const data = docSnap.exists() ? docSnap.data() : { watchlist: [], alerts: [] }

    const newAlert = {
      id: Date.now().toString(),
      ...alert,
      enabled: true,
      created: new Date().toISOString()
    }

    data.alerts = [...(data.alerts || []), newAlert]
    await setDoc(docRef, data, { merge: true })
    return newAlert.id
  }

  // Remove price alert
  export async function removePriceAlert(userId, alertId) {
    const docRef = doc(firestore, 'priceOracleUsers', userId)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return

    const data = docSnap.data()
    data.alerts = (data.alerts || []).filter(a => a.id !== alertId)
    await setDoc(docRef, data, { merge: true })
  }

  // Toggle alert enabled/disabled
  export async function togglePriceAlert(userId, alertId) {
    const docRef = doc(firestore, 'priceOracleUsers', userId)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return

    const data = docSnap.data()
    data.alerts = (data.alerts || []).map(a =>
      a.id === alertId ? { ...a, enabled: !a.enabled } : a
    )
    await setDoc(docRef, data, { merge: true })
  }
