const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  material:    { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  buyer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  seller:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  winningBid:  { type: mongoose.Schema.Types.ObjectId, ref: 'Bid',      required: true },

  // Amounts
  bidAmount:   { type: Number, required: true },
  quantity:    { type: Number },
  unit:        { type: String },
  totalAmount: { type: Number }, // bidAmount * quantity

  // Payment
  paymentStatus:  { type: String, enum: ['pending', 'initiated', 'successful', 'failed', 'refunded'], default: 'pending' },
  razorpayOrderId:{ type: String },
  razorpayPaymentId:{ type: String },
  paidAt:         { type: Date },

  // Logistics
  pickupStatus:   { type: String, enum: ['pending', 'scheduled', 'completed'], default: 'pending' },
  pickupDate:     { type: Date },
  weighment:      { type: Number }, // actual weighed quantity
  confirmedBySeller: { type: Boolean, default: false },
  confirmedByBuyer:  { type: Boolean, default: false },
}, { timestamps: true })

transactionSchema.index({ buyer: 1, createdAt: -1 })
transactionSchema.index({ seller: 1, createdAt: -1 })

module.exports = mongoose.model('Transaction', transactionSchema)
