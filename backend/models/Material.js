const mongoose = require('mongoose')

const auctionSchema = new mongoose.Schema({
  startTime:  { type: Date },
  endTime:    { type: Date },
  status:     { type: String, enum: ['draft', 'scheduled', 'active', 'closed', 'cancelled'], default: 'draft' },
  winner:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  winningBid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
  closedAt:   { type: Date },
}, { _id: false })

const materialSchema = new mongoose.Schema({
  // Core
  name:         { type: String, required: true, trim: true },
  category:     { type: String, required: true },
  materialType: { type: String },
  grade:        { type: String },
  description:  { type: String },
  specifications: { type: String },

  // Images (Cloudinary URLs — public images only)
  images: [{ type: String }],
  imagePublicIds: [{ type: String }],

  // Stock
  quantity:          { type: Number, required: true, min: 0 },
  unit:              { type: String, enum: ['kg', 'tonnes', 'pieces', 'litres'], default: 'tonnes' },
  location:          { type: String },
  stockAvailability: { type: String, enum: ['available', 'upcoming'], default: 'available' },

  // Pricing
  startingPrice:    { type: Number, required: true, min: 1 },
  minBidIncrement:  { type: Number, default: 100, min: 1 },
  // minAcceptablePrice is stored but NEVER exposed in any public API response
  minAcceptablePrice: { type: Number, select: false },
  currentHighestBid:  { type: Number },

  // Delivery
  deliveryTerms: { type: String },

  // Auction
  auction: { type: auctionSchema, default: {} },

  // Counts
  bidsCount: { type: Number, default: 0 },

  // Seller
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  isActive: { type: Boolean, default: true },
}, { timestamps: true })

materialSchema.index({ category: 1, 'auction.status': 1 })
materialSchema.index({ seller: 1 })
materialSchema.index({ name: 'text', description: 'text', category: 'text' })

module.exports = mongoose.model('Material', materialSchema)
