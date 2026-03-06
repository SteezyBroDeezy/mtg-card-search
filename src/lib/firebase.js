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
