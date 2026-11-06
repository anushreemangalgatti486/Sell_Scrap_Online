const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  material:    { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  buyer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  seller:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  winningBid:  { type: mongoose.Schema.Types.ObjectId, ref: 'Bid',      required: true },

  // ── Amounts (all stored in PAISE — integer, never floating point) ──
  bidAmount:     { type: Number, required: true },            // per-unit price in paise
  quantity:      { type: Number },                            // original quantity
  unit:          { type: String },
  totalAmount:   { type: Number },                            // bidAmount * quantity (estimated, paise)

  // ── Advance Payment (Razorpay) ──
  advancePercentage: { type: Number, default: 10 },          // % of totalAmount, admin-configurable
  advanceAmount:     { type: Number, default: 0 },            // calculated advance in paise
  advanceStatus: {
    type: String,
    enum: ['pending', 'order_created', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  advancePaidAt:     { type: Date },

  // Razorpay fields (secrets never exposed to frontend)
  razorpayOrderId:    { type: String, index: true },
  razorpayPaymentId:  { type: String, index: true },
  razorpaySignature:  { type: String, select: false },       // never returned in API responses

  // Idempotency — prevents duplicate webhook processing
  webhookProcessed:   { type: Boolean, default: false },
  webhookProcessedAt: { type: Date },

  // ── Final Weighment & Balance ──
  finalWeighment:  { type: Number },                         // actual weighed quantity
  finalAmount:     { type: Number },                          // recalculated: bidAmount * finalWeighment (paise)
  remainingBalance:{ type: Number },                          // finalAmount - advanceAmount (paise)

  // ── Lifecycle Status ──
  // advance_pending → advance_paid → pickup_initiated → balance_pending → completed
  //                          ↘ payment_failed          ↘ cancelled
  paymentStatus: {
    type: String,
    enum: [
      'advance_pending',    // transaction created, advance not yet paid
      'advance_paid',       // advance verified via Razorpay
      'pickup_initiated',   // pickup in progress
      'balance_pending',    // weighment done, awaiting offline settlement
      'completed',          // all confirmations done
      'payment_failed',     // advance payment failed
      'cancelled',          // transaction cancelled
    ],
    default: 'advance_pending',
  },

  // ── Pickup ──
  pickupStatus:   { type: String, enum: ['pending', 'scheduled', 'completed'], default: 'pending' },
  pickupDate:     { type: Date },

  // ── Offline Settlement Confirmation ──
  settlementStatus: {
    type: String,
    enum: ['pending', 'buyer_confirmed', 'seller_confirmed', 'settled'],
    default: 'pending',
  },
  confirmedByBuyer:  { type: Boolean, default: false },
  confirmedBySeller: { type: Boolean, default: false },
  completedAt:       { type: Date },

  // Legacy field kept for backward compatibility with existing components
  paidAt: { type: Date },
}, { timestamps: true })

transactionSchema.index({ buyer: 1, createdAt: -1 })
transactionSchema.index({ seller: 1, createdAt: -1 })

module.exports = mongoose.model('Transaction', transactionSchema)
