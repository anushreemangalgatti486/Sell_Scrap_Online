const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:        { type: String, trim: true },
  password:     {
    type: String,
    required: function () { return this.authProvider !== 'google' },
    minlength: 8,
    select: false,
  },
  googleUid:    { type: String, sparse: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  avatar:       { type: String },
  role:         { type: String, enum: ['buyer', 'seller', 'admin'], required: true },

  // Business
  businessName: { type: String, trim: true },
  businessType: { type: String },

  // Verification
  verificationStatus:   { type: String, enum: ['not_submitted', 'pending', 'approved', 'rejected'], default: 'not_submitted' },
  verificationSubmitted:{ type: Boolean, default: false },
  rejectionReason:      { type: String },

  // Password reset
  passwordResetToken:   { type: String, select: false },
  passwordResetExpires: { type: Date,   select: false },

  // Refs
  businessProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessProfile' },

  isActive: { type: Boolean, default: true },
}, { timestamps: true })

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = function(candidate) {
  if (!this.password) return Promise.resolve(false)
  return bcrypt.compare(candidate, this.password)
}

userSchema.methods.toPublic = function() {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)
