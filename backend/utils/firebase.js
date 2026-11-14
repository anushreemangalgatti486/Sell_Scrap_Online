const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const path = require('path')
const fs = require('fs')

let isFirebaseInitialized = false
let isAuthInitialized = false
let app = null
let db = null
let authAdmin = null

try {
  let credential = null

  // 1. Check for serviceAccountKey.json in config/ or root
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.join(__dirname, '..', 'config', 'serviceAccountKey.json')

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath)
    credential = cert(serviceAccount)
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    // 2. Check for individual environment variables
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  }

  if (credential) {
    app = getApps().length ? getApp() : initializeApp({ credential })
    db = getFirestore(app)
    authAdmin = getAuth(app)
    isFirebaseInitialized = true
    isAuthInitialized = true
    console.log('✓ Firebase Admin initialized with Firestore & Auth')
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // Initialize Auth verifier with projectId alone (verifies ID tokens via Google public x509 certs)
    app = getApps().length ? getApp() : initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID })
    authAdmin = getAuth(app)
    isAuthInitialized = true
    console.log(`✓ Firebase Admin Auth initialized for project ${process.env.FIREBASE_PROJECT_ID}`)
  } else {
    console.log('ℹ Firebase Admin: No credentials or project ID provided. Running in hybrid fallback mode.')
  }
} catch (err) {
  console.warn('⚠️ Firebase Admin initialization failed:', err.message)
}

/**
 * Verify a Firebase ID token obtained from client Google Sign-In
 */
async function verifyFirebaseIdToken(idToken) {
  if (!isAuthInitialized || !authAdmin) {
    throw new Error('Firebase Auth is not initialized on the server')
  }
  return authAdmin.verifyIdToken(idToken)
}

/**
 * Sync platform overview stats to Firestore document: platform/stats
 */
async function syncStatsToFirestore(stats) {
  if (!isFirebaseInitialized || !db) return
  try {
    await db.collection('platform').doc('stats').set({
      ...stats,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
  } catch (err) {
    console.error('Failed to sync stats to Firestore:', err.message)
  }
}

/**
 * Sync user status to Firestore document: users/{userId}
 * Allows client onSnapshot listener to instantly detect suspension
 */
async function syncUserStatusToFirestore(userId, isActive, role) {
  if (!isFirebaseInitialized || !db) return
  try {
    await db.collection('users').doc(userId.toString()).set({
      isActive,
      role,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
  } catch (err) {
    console.error(`Failed to sync user ${userId} to Firestore:`, err.message)
  }
}

/**
 * Sync a new bid to Firestore document: auctions/{materialId}
 */
async function syncBidToFirestore(materialId, bidData) {
  if (!isFirebaseInitialized || !db) return
  try {
    await db.collection('auctions').doc(materialId.toString()).set({
      materialId: materialId.toString(),
      currentHighestBid: bidData.amount,
      bidsCount: bidData.bidsCount,
      lastBid: {
        amount: bidData.amount,
        anonymousLabel: bidData.anonymousLabel,
        createdAt: bidData.createdAt || new Date().toISOString(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
  } catch (err) {
    console.error(`Failed to sync bid for material ${materialId} to Firestore:`, err.message)
  }
}

/**
 * Sync auction close event to Firestore document: auctions/{materialId}
 */
async function syncAuctionClosedToFirestore(materialId, closeData) {
  if (!isFirebaseInitialized || !db) return
  try {
    await db.collection('auctions').doc(materialId.toString()).set({
      status: 'closed',
      winningBid: closeData.winningBid,
      winner: closeData.winner ? closeData.winner.toString() : null,
      closedAt: closeData.closedAt || new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
  } catch (err) {
    console.error(`Failed to sync auction close for ${materialId} to Firestore:`, err.message)
  }
}

module.exports = {
  db,
  isFirebaseInitialized: () => isFirebaseInitialized,
  isAuthInitialized: () => isAuthInitialized,
  verifyFirebaseIdToken,
  syncStatsToFirestore,
  syncUserStatusToFirestore,
  syncBidToFirestore,
  syncAuctionClosedToFirestore,
}
