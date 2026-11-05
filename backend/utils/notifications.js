const Notification = require('../models/Notification')

/**
 * createNotification — saves a notification to the DB and pushes it
 * to the user's Socket.io room in real-time.
 */
exports.createNotification = async (userId, type, message, data = {}) => {
  try {
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
