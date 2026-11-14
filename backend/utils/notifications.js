const Notification = require('../models/Notification')

/**
 * createNotification — saves a notification to the DB and pushes it
 * to the user's Socket.io room in real-time.
 *
 * Duplicate prevention: for 'outbid' and 'bid_placed' types, skip if
 * an identical notification was created for the same user+material
 * within the last 10 seconds (prevents duplicate cron/socket events).
 */
exports.createNotification = async (userId, type, message, data = {}) => {
  try {
    // Deduplication for high-frequency notification types
    const DEDUP_TYPES = ['outbid', 'bid_placed']
    if (DEDUP_TYPES.includes(type) && data.materialId) {
      const tenSecondsAgo = new Date(Date.now() - 10000)
      const existing = await Notification.findOne({
        user:       userId,
        type,
        'data.materialId': data.materialId.toString(),
        createdAt:  { $gte: tenSecondsAgo },
      })
      if (existing) return // skip duplicate
    }

    const notification = await Notification.create({ user: userId, type, message, data })

    // Push to the user's personal socket room (join:notifications)
    // Imported lazily to avoid circular dependency with socket.js
    try {
      const { emitNotification } = require('./socket')
      emitNotification(userId.toString(), {
        _id:       notification._id,
        type:      notification.type,
        message:   notification.message,
        data:      notification.data,
        read:      false,
        createdAt: notification.createdAt,
      })
    } catch {
      // Socket not initialised yet — notification is still saved to DB
    }
  } catch (err) {
    console.error('Notification creation failed:', err.message)
  }
}
