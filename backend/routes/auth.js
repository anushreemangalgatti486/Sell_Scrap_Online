const express = require('express')
const router  = express.Router()
const User    = require('../models/User')
const { signToken, sendTokenResponse } = require('../utils/jwt')
const { protect } = require('../middleware/auth')

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, businessName, businessType } = req.body

    if (!['buyer', 'seller'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role for registration' })
    }
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ message: 'Email already registered' })

    const user = await User.create({ name, email, phone, password, role, businessName, businessType })
    sendTokenResponse(user, 201, res)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })

    if (role && user.role !== role) {
      return res.status(401).json({ message: `No ${role} account found with this email` })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' })

    if (!user.isActive) return res.status(401).json({ message: 'Account has been deactivated' })

    sendTokenResponse(user, 200, res)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('businessProfile')
    res.json({ user: user.toPublic() })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email: email?.toLowerCase() })
    // Always return 200 to prevent email enumeration
    if (!user) return res.json({ message: 'If that email is registered, you will receive a reset link.' })

    // In production: generate token, send email via nodemailer
    // For now: acknowledge the request
    res.json({ message: 'If that email is registered, you will receive a reset link.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
