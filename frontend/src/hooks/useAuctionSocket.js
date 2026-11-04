import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5002'

/**
 * useAuctionSocket
 *
 * Connects to the Socket.io server, joins the room for a specific auction,
 * and calls your callbacks when events fire.
 *
 * @param {string|null} materialId  - The auction material ID to watch (or null to skip)
 * @param {object}      callbacks
 * @param {function}    callbacks.onBidNew      - Called with bid payload on new bid
 * @param {function}    callbacks.onAuctionClose - Called with payload when auction closes
 */
export default function useAuctionSocket(materialId, { onBidNew, onAuctionClose } = {}) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!materialId) return

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    })

    socketRef.current = socket

    socket.emit('join:auction', materialId)

    if (onBidNew) {
      socket.on('bid:new', onBidNew)
    }

    if (onAuctionClose) {
      socket.on('auction:closed', onAuctionClose)
    }

    return () => {
      socket.emit('leave:auction', materialId)
      socket.disconnect()
    }
  }, [materialId])  // reconnect if materialId changes

  return socketRef
}
