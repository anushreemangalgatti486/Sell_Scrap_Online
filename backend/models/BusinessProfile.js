const mongoose = require('mongoose')

const businessProfileSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName:  { type: String, required: true, trim: true },
  businessType:  { type: String, required: true },
  authorizedPerson: { type: String, required: true },
  gstin:         { type: String, trim: true },
  businessRegNo: { type: String, trim: true },
  address:       { type: String },
  city:          { type: String },
  state:         { type: String },
  pincode:       { type: String },
  documentUrl:   { type: String }, // Cloudinary secure_url
  documentPublicId: { type: String }, // For deletion
}, { timestamps: true })

module.exports = mongoose.model('BusinessProfile', businessProfileSchema)
