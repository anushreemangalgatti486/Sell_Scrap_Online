const mongoose = require('mongoose')

/**
 * Setting — singleton-style key-value store for platform-wide configuration.
 * Used for admin-configurable values like advance payment percentage.
 */
const settingSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true, trim: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

module.exports = mongoose.model('Setting', settingSchema)
