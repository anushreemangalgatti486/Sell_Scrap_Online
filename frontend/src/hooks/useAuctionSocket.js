import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5002'

/**
 * useAuctionSocket
 *
 * Connects to the Socket.io server with JWT authentication,
 * joins the room for a specific auction, and fires callbacks on events.
 *
 * @param {string|null} materialId  — auction material ID to watch (null to skip)
 * @param {object}      callbacks
 * @param {function}    callbacks.onBidNew       — called with bid payload on new bid
 * @param {function}    callbacks.onAuctionClose — called with payload when auction closes
 */
export default function useAuctionSocket(materialId, { onBidNew, onAuctionClose } = {}) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!materialId) return

    // Read token from localStorage — same source the axios instance uses
    const token = localStorage.getItem('sb_token')

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      // Pass JWT in the auth handshake — validated server-side
      auth: token ? { token } : {},
    })

    socketRef.current = socket

    socket.emit('join:auction', materialId)

    if (onBidNew) socket.on('bid:new', onBidNew)
    if (onAuctionClose) socket.on('auction:closed', onAuctionClose)

    return () => {
      socket.emit('leave:auction', materialId)
      socket.disconnect()
    }
  }, [materialId])

  return socketRef
}
