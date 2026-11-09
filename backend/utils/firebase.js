const admin = require('firebase-admin')
const path = require('path')
const fs = require('fs')

let isFirebaseInitialized = false
let db = null

try {
  let credential = null

  // 1. Check for serviceAccountKey.json in config/ or root
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.join(__dirname, '..', 'config', 'serviceAccountKey.json')

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath)
    credential = admin.credential.cert(serviceAccount)
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    // 2. Check for individual environment variables
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  }

  if (credential) {
    admin.initializeApp({ credential })
    db = admin.firestore()
    isFirebaseInitialized = true
    console.log('✓ Firebase Admin initialized with Firestore')
  } else {
    console.log('ℹ Firebase Admin: No credentials provided. Running in hybrid fallback mode.')
  }
} catch (err) {
  console.warn('⚠️ Firebase Admin initialization failed:', err.message)
}

/**
 * Sync platform overview stats to Firestore document: platform/stats
 */
async function syncStatsToFirestore(stats) {
  if (!isFirebaseInitialized || !db) return
  try {
    await db.collection('platform').doc('stats').set({
      ...stats,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })
  } catch (err) {
    console.error(`Failed to sync auction close for ${materialId} to Firestore:`, err.message)
  }
}

module.exports = {
  admin,
  db,
  isFirebaseInitialized: () => isFirebaseInitialized,
  syncStatsToFirestore,
  syncUserStatusToFirestore,
  syncBidToFirestore,
  syncAuctionClosedToFirestore,
}
