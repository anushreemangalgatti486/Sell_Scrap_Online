import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// Check if credentials have been supplied
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY'
)

let app = null
let db = null
let auth = null

if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    db = getFirestore(app)
    auth = getAuth(app)
    console.log('✓ Firebase initialized in client with Cloud Firestore')
  } catch (err) {
    console.warn('⚠️ Firebase client initialization failed:', err.message)
  }
} else {
  console.info('ℹ Firebase not yet configured in .env. Falling back to REST & Socket.io.')
}

export async function syncClientStats(stats) {
  if (!isFirebaseConfigured || !db) return
  try {
    await setDoc(doc(db, 'platform', 'stats'), {
      ...stats,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (err) {
    console.warn('Failed to sync stats to Firestore:', err.message)
  }
}

export async function syncClientUserStatus(userId, isActive) {
  if (!isFirebaseConfigured || !db || !userId) return
  try {
    await setDoc(doc(db, 'users', userId.toString()), {
      isActive,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (err) {
    console.warn('Failed to sync user status to Firestore:', err.message)
  }
}

export async function removeClientUser(userId) {
  if (!isFirebaseConfigured || !db || !userId) return
  try {
    await deleteDoc(doc(db, 'users', userId.toString()))
  } catch (err) {
    console.warn('Failed to delete user doc in Firestore:', err.message)
  }
}

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

const GOOGLE_AUTH_ERRORS = {
  'auth/popup-closed-by-user':    'Google sign-in popup was closed before completing.',
  'auth/cancelled-popup-request': 'Sign-in request was cancelled. Please try again.',
  'auth/popup-blocked':           'Popup was blocked by your browser. Please allow popups for this site.',
  'auth/unauthorized-domain':     'This domain is not authorized in Firebase Auth settings. Add it under Authentication > Settings > Authorized domains.',
  'auth/operation-not-allowed':   'Google Sign-In is not enabled yet in Firebase Console (Authentication > Sign-in method > Google).',
}

export async function signInWithGooglePopup() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Authentication is not configured.')
  }
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return await result.user.getIdToken()
  } catch (err) {
    const friendly = GOOGLE_AUTH_ERRORS[err.code]
    if (friendly) {
      const wrapped = new Error(friendly)
      wrapped.code = err.code
      throw wrapped
    }
    throw err
  }
}

export async function firebaseSignOut() {
  if (!auth) return
  try {
    await signOut(auth)
  } catch (err) {
    console.warn('Firebase signOut failed:', err.message)
  }
}

export { app, db, auth }
