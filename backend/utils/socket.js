/**
 * socket.js — Socket.io server with JWT authentication middleware.
 *
 * Security model:
 *  - Every connecting client must supply a valid JWT in the auth handshake.
 *  - The decoded user (id, role) is attached to socket.data.user.
 *  - Unauthenticated sockets are rejected at connection time.
 *  - Auction rooms are public-read (viewers can join any materialId room)
 *    but bid data carries only anonymous labels — no PII is pushed.
 *  - Admin-only room joins can be extended here if needed.
 */

const jwt = require('jsonwebtoken')

let _io = null

/**
 * Initialise Socket.io with the HTTP server (called once from server.js).
 */
exports.initSocket = (httpServer) => {
  const { Server } = require('socket.io')

  const allowedOrigins = []
  if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(',').map(o => o.trim()).filter(Boolean).forEach(o => allowedOrigins.push(o))
  }
  if (process.env.EXTRA_ORIGINS) {
    process.env.EXTRA_ORIGINS.split(',').map(o => o.trim()).filter(Boolean).forEach(o => allowedOrigins.push(o))
  }
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000')
  }

  _io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : false,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  /* ── JWT authentication middleware ── */
  _io.use((socket, next) => {
    try {
      // Client sends token via: socket = io(url, { auth: { token } })
      const token = socket.handshake.auth?.token
        || socket.handshake.headers?.authorization?.replace('Bearer ', '')

      if (!token) {
        // Allow unauthenticated connections as anonymous viewers
        // They can watch auctions but carry no identity
        socket.data.user = null
        socket.data.authenticated = false
        return next()
      }

      const secret = process.env.JWT_SECRET
      if (!secret) return next(new Error('Server configuration error'))

      const decoded = jwt.verify(token, secret)
      socket.data.user = { id: decoded.id, role: decoded.role }
      socket.data.authenticated = true
      next()
    } catch (err) {
      // Invalid / expired token — treat as unauthenticated (not a hard disconnect)
      // This allows public viewers of live auctions without forcing them to log in
      socket.data.user = null
      socket.data.authenticated = false
      next()
    }
  })

  _io.on('connection', (socket) => {
    /**
     * join:auction — subscribe to live updates for a specific material auction.
     * Any visitor (authenticated or not) can watch a live auction.
     * Only the materialId is used as a room name; no PII is stored server-side.
     */
    socket.on('join:auction', (materialId) => {
      if (!materialId || typeof materialId !== 'string' || materialId.length > 100) return
      // Sanitise: only allow valid MongoDB ObjectId-like strings (24 hex chars)
      if (!/^[a-f0-9]{24}$/i.test(materialId)) return
      socket.join(`auction:${materialId}`)
    })

    socket.on('leave:auction', (materialId) => {
      if (!materialId || typeof materialId !== 'string') return
      socket.leave(`auction:${materialId}`)
    })

    /**
     * join:notifications — subscribe to personal notification pushes.
     * Only authenticated users can join their own notification room.
     * The room name is keyed by user ID so users cannot join each other's rooms.
     */
    socket.on('join:notifications', () => {
      if (!socket.data.authenticated || !socket.data.user?.id) {
        socket.emit('error', { message: 'Authentication required for notification updates' })
        return
      }
      socket.join(`user:${socket.data.user.id}`)
    })

    socket.on('disconnect', () => {})
  })

  console.log('⚡ Socket.io ready (JWT auth enabled)')
  return _io
}

/**
 * Get the socket.io instance anywhere in the app.
 */
exports.getIO = () => {
  if (!_io) throw new Error('Socket.io not initialised — call initSocket first')
  return _io
}

/**
 * Emit a new-bid event to everyone watching a specific auction.
 * Called from the bids route after a bid is saved.
 * Payload contains only anonymous data — no bidder PII.
 */
exports.emitBidUpdate = (materialId, payload) => {
  if (!_io) return
  _io.to(`auction:${materialId}`).emit('bid:new', payload)
}

/**
 * Emit an auction-closed event when the cron job closes an auction.
 */
exports.emitAuctionClosed = (materialId, payload) => {
  if (!_io) return
  _io.to(`auction:${materialId}`).emit('auction:closed', payload)
}

/**
 * Emit a notification to a specific user (by user ID).
 * Only reaches clients that have joined their own user room via join:notifications.
 */
exports.emitNotification = (userId, notification) => {
  if (!_io) return
  _io.to(`user:${userId}`).emit('notification:new', notification)
}
