const Notification = require('../models/Notification')

exports.createNotification = async (userId, type, message, data = {}) => {
  try {
    await Notification.create({ user: userId, type, message, data })
  } catch (err) {
    console.error('Notification creation failed:', err.message)
  }
}
