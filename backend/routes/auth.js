const express  = require('express')
const router   = express.Router()
const crypto   = require('crypto')
const User     = require('../models/User')
const Material = require('../models/Material')
const { signToken, sendTokenResponse } = require('../utils/jwt')
const { sendPasswordResetEmail } = require('../utils/email')
const { protect } = require('../middleware/auth')
const { verifyFirebaseIdToken, isAuthInitialized, syncStatsToFirestore } = require('../utils/firebase')

/* ── helpers ── */
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
const sanitiseStr  = (s) => (typeof s === 'string' ? s.trim().slice(0, 200) : '')

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const name         = sanitiseStr(req.body.name)
    const email        = sanitiseStr(req.body.email).toLowerCase()
    const phone        = sanitiseStr(req.body.phone)
    const password     = typeof req.body.password === 'string' ? req.body.password : ''
    const role         = sanitiseStr(req.body.role)
    const businessName = sanitiseStr(req.body.businessName)
    const businessType = sanitiseStr(req.body.businessType)

    if (!['buyer', 'seller'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role for registration' })
    }
    if (!name)               return res.status(400).json({ message: 'Name is required' })
    if (!email)              return res.status(400).json({ message: 'Email is required' })
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email address' })
    if (!password)           return res.status(400).json({ message: 'Password is required' })
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' })
    if (password.length > 128) return res.status(400).json({ message: 'Password is too long' })

    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ message: 'Email already registered' })

    const user = await User.create({ name, email, phone, password, role, businessName, businessType })
    sendTokenResponse(user, 201, res)
  } catch (err) {
    console.error('Register error:', err.message)
    res.status(500).json({ message: 'Registration failed. Please try again.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email    = sanitiseStr(req.body.email).toLowerCase()
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    const role     = sanitiseStr(req.body.role) || null

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Valid email is required' })
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })

    if (role && user.role !== role) {
      return res.status(401).json({ message: `No ${role} account found with this email` })
    }

    if (!user.password && user.authProvider === 'google') {
      return res.status(401).json({ message: 'This account uses Google Sign-In. Please click "Continue with Google" to log in.' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' })

    if (!user.isActive) return res.status(401).json({ message: 'Account has been deactivated' })

    sendTokenResponse(user, 200, res)
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ message: 'Login failed. Please try again.' })
  }
})

// POST /api/auth/google — sign in or register via Firebase Google ID token
router.post('/google', async (req, res) => {
  try {
    const idToken = typeof req.body.idToken === 'string' ? req.body.idToken.trim() : ''
    const role    = sanitiseStr(req.body.role) || 'buyer'

    if (!idToken) {
      return res.status(400).json({ message: 'Google authentication token is required' })
    }
    if (!isAuthInitialized()) {
      return res.status(503).json({ message: 'Google Sign-In is not configured on the server.' })
    }

    let decoded
    try {
      decoded = await verifyFirebaseIdToken(idToken)
    } catch (verifyErr) {
      console.error('Google token verification failed:', verifyErr.code || verifyErr.message)
      return res.status(401).json({ message: 'Google sign-in session could not be verified. Please try again.' })
    }

    const email = sanitiseStr(decoded.email).toLowerCase()
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'A valid Google email address is required' })
    }
    if (decoded.email_verified === false) {
      return res.status(400).json({ message: 'Please verify your Google account email address first.' })
    }

    let user = await User.findOne({ email })

    if (user) {
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account has been deactivated' })
      }
      if (role && user.role !== role) {
        return res.status(401).json({
          message: `This Google email is registered as a ${user.role}. Please select the ${user.role} option to sign in.`,
        })
      }

      let updated = false
      if (!user.googleUid && decoded.uid) {
        user.googleUid = decoded.uid
        updated = true
      }
      if (decoded.picture && user.avatar !== decoded.picture) {
        user.avatar = decoded.picture
        updated = true
      }
      if (updated) await user.save({ validateModifiedOnly: true })

      const token = signToken(user._id, user.role)
      return res.status(200).json({ token, user: user.toPublic(), isNewUser: false })
    }

    // New user registration via Google — only buyer and seller allowed
    if (role === 'admin') {
      return res.status(403).json({
        message: 'No administrator account exists for this Google email. Admin accounts cannot be created via Google Sign-In.',
      })
    }
    if (!['buyer', 'seller'].includes(role)) {
      return res.status(400).json({ message: 'Please choose Buyer or Seller to continue with Google.' })
    }

    const displayName = sanitiseStr(decoded.name) || email.split('@')[0]
    user = await User.create({
      name: displayName,
      email,
      role,
      authProvider: 'google',
      googleUid: decoded.uid,
      avatar: decoded.picture || undefined,
      isActive: true,
    })

    // Sync updated stats to Firestore (best-effort)
    try {
      const [totalUsers, pendingVerifications, activeListings, activeAuctions] = await Promise.all([
        User.countDocuments({ role: { $in: ['buyer', 'seller'] }, isActive: true }),
        User.countDocuments({ verificationStatus: 'pending', isActive: true }),
        Material.countDocuments({ isActive: true }),
        Material.countDocuments({ 'auction.status': 'active' }),
      ])
      syncStatsToFirestore({ totalUsers, pendingVerifications, activeListings, activeAuctions })
    } catch {}

    const token = signToken(user._id, user.role)
    res.status(201).json({ token, user: user.toPublic(), isNewUser: true })
  } catch (err) {
    console.error('Google auth error:', err.message)
    res.status(500).json({ message: 'Google sign-in failed. Please try again.' })
  }
})

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('businessProfile')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user: user.toPublic() })
  } catch (err) {
    console.error('Me error:', err.message)
    res.status(500).json({ message: 'Failed to fetch user data' })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const email = sanitiseStr(req.body.email).toLowerCase()
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Valid email is required' })
    }

    // Always return success to prevent email enumeration
    const user = await User.findOne({ email })
    if (!user) {
      return res.json({ message: 'If that email is registered, you will receive a reset link.' })
    }

    // Generate a cryptographically random reset token
    const rawToken   = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expires     = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    user.passwordResetToken   = hashedToken
    user.passwordResetExpires = expires
    await user.save({ validateModifiedOnly: true })

    // Build reset URL — points to the frontend reset page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174'
    const resetUrl    = `${frontendUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`

    await sendPasswordResetEmail(email, resetUrl, user.name)

    res.json({ message: 'If that email is registered, you will receive a reset link.' })
  } catch (err) {
    console.error('Forgot password error:', err.message)
    // Don't leak whether the email exists
    res.json({ message: 'If that email is registered, you will receive a reset link.' })
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const rawToken   = sanitiseStr(req.body.token)
    const email      = sanitiseStr(req.body.email).toLowerCase()
    const password   = typeof req.body.password === 'string' ? req.body.password : ''

    if (!rawToken || !email || !password) {
      return res.status(400).json({ message: 'Token, email and new password are required' })
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }
    if (password.length > 128) {
      return res.status(400).json({ message: 'Password is too long' })
    }

    // Hash the incoming token and look it up
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

    const user = await User.findOne({
      email,
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: new Date() }, // not expired
    }).select('+passwordResetToken +passwordResetExpires +password')

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired. Please request a new one.' })
    }

    // Update password and clear reset fields
    user.password             = password
    user.passwordResetToken   = undefined
    user.passwordResetExpires = undefined
    await user.save()

    // Issue a fresh JWT so the user is logged in immediately
    sendTokenResponse(user, 200, res)
  } catch (err) {
    console.error('Reset password error:', err.message)
    res.status(500).json({ message: 'Password reset failed. Please try again.' })
  }
})

module.exports = router
