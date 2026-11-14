import { useEffect, useRef } from 'react'
import { db, isFirebaseConfigured } from '../services/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5002'

/**
 * Real-time Auction Hook
 * Uses Cloud Firestore onSnapshot for real-time bid & auction closing events,
 * and maintains Socket.io as fallback/complement.
 */
export function useRealtimeAuction(materialId, { onBidNew, onAuctionClose } = {}) {
  const socketRef = useRef(null)

  // 1. Cloud Firestore Real-time Listener
  useEffect(() => {
    if (!materialId || !isFirebaseConfigured || !db) return
    let unsubscribe = null
    try {
      const auctionRef = doc(db, 'auctions', materialId.toString())
      unsubscribe = onSnapshot(auctionRef, (snap) => {
        if (!snap.exists()) return
        const data = snap.data()
        if (data.lastBid && onBidNew) {
          onBidNew({
            materialId,
            currentHighestBid: data.currentHighestBid,
            bidsCount: data.bidsCount,
            ...data.lastBid,
          })
        }
        if (data.status === 'closed' && onAuctionClose) {
          onAuctionClose(data)
        }
      }, (err) => {
        console.warn('Firestore auction snapshot error:', err.message)
      })
    } catch (err) {
      console.warn('Failed to subscribe to Firestore auction:', err.message)
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [materialId, onBidNew, onAuctionClose])

  // 2. Socket.io Real-time Listener (Fallback)
  useEffect(() => {
    if (!materialId) return
    const token = localStorage.getItem('sb_token')
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      auth: token ? { token } : {},
    })
    socketRef.current = socket

    socket.emit('join:auction', materialId)
    if (onBidNew) socket.on('bid:new', onBidNew)
    if (onAuctionClose) socket.on('auction:closed', onAuctionClose)

    return () => {
      socket.emit('leave:auction', materialId)
      socket.disconnect()
      socketRef.current = null
    }
  }, [materialId, onBidNew, onAuctionClose])

  return socketRef
}
