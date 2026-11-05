const express = require('express')
const router  = express.Router()
const User    = require('../models/User')
const { sendTokenResponse } = require('../utils/jwt')
const { protect } = require('../middleware/auth')

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
    if (!name)              return res.status(400).json({ message: 'Name is required' })
    if (!email)             return res.status(400).json({ message: 'Email is required' })
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email address' })
    if (!password)          return res.status(400).json({ message: 'Password is required' })
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
    // Use the same message for wrong email AND wrong password to prevent enumeration
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })

    if (role && user.role !== role) {
      return res.status(401).json({ message: `No ${role} account found with this email` })
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

    // Always return the same message to prevent email enumeration
    await User.findOne({ email }) // exists check (for future email sending)
    res.json({ message: 'If that email is registered, you will receive a reset link.' })
  } catch (err) {
    console.error('Forgot password error:', err.message)
    res.status(500).json({ message: 'Request failed. Please try again.' })
  }
})

module.exports = router
