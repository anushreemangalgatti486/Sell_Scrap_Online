const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    {
    type: String,
    enum: ['bid_placed', 'outbid', 'auction_won', 'auction_lost', 'verification', 'payment', 'transaction', 'general'],
    required: true,
  },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
  data:    { type: mongoose.Schema.Types.Mixed }, // Extra context (e.g., materialId)
}, { timestamps: true })

notificationSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
