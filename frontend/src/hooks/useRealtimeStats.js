import { useState, useEffect } from 'react'
import { adminAPI } from '../services/api'
import { db, isFirebaseConfigured } from '../services/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export function useRealtimeStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe = null

    // Initial fetch from REST API
    adminAPI.getStats()
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))

    // Real-time Cloud Firestore subscription if Firebase credentials are provided
    if (isFirebaseConfigured && db) {
      try {
        const statsRef = doc(db, 'platform', 'stats')
        unsubscribe = onSnapshot(statsRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data()
            setStats(prev => ({
              ...(prev || {}),
              ...data,
            }))
          }
        }, (err) => {
          console.warn('Firestore stats snapshot listener error:', err.message)
        })
      } catch (err) {
        console.warn('Failed to attach Firestore stats listener:', err.message)
      }
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  return { stats, loading, isRealtime: isFirebaseConfigured }
}
