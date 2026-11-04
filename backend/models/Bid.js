const mongoose = require('mongoose')

const bidSchema = new mongoose.Schema({
  material:      { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  bidder:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  amount:        { type: Number, required: true, min: 1 },
  // Status
  status:        { type: String, enum: ['active', 'outbid', 'won', 'lost'], default: 'active' },
  // Anonymous label shown during live auction (Buyer 01, Buyer 02, etc.)
  anonymousLabel:{ type: String },
}, { timestamps: true })

bidSchema.index({ material: 1, amount: -1 })
bidSchema.index({ bidder: 1, createdAt: -1 })

module.exports = mongoose.model('Bid', bidSchema)
