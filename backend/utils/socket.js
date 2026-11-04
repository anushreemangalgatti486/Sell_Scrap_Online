let _io = null

/**
 * Initialise Socket.io with the HTTP server (called once from server.js).
 */
exports.initSocket = (httpServer) => {
  const { Server } = require('socket.io')
  _io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  _io.on('connection', (socket) => {
    // Client joins a room named after the material ID to get live updates
    socket.on('join:auction', (materialId) => {
      socket.join(`auction:${materialId}`)
    })

    socket.on('leave:auction', (materialId) => {
      socket.leave(`auction:${materialId}`)
    })

    socket.on('disconnect', () => {})
  })

  console.log('⚡ Socket.io ready')
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
