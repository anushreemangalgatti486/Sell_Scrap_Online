const express         = require('express')
const router          = express.Router()
const BusinessProfile = require('../models/BusinessProfile')
const User            = require('../models/User')
const { protect }     = require('../middleware/auth')
const { uploadDocument, getFileUrl } = require('../middleware/upload')
const { createNotification } = require('../utils/notifications')

// POST /api/business/verify — submit verification
router.post('/verify', protect, uploadDocument, async (req, res) => {
  try {
    const { businessName, businessType, authorizedPerson, gstin, businessRegNo, address, city, state, pincode } = req.body
    const documentUrl = getFileUrl(req.file)

    if (!businessName || !businessType || !authorizedPerson) {
      return res.status(400).json({ message: 'Business name, type and authorized person are required' })
    }
    if (!gstin && !businessRegNo) {
      return res.status(400).json({ message: 'GSTIN or business registration number is required' })
    }

    // Upsert business profile
    const profile = await BusinessProfile.findOneAndUpdate(
      { user: req.user._id },
      { businessName, businessType, authorizedPerson, gstin, businessRegNo, address, city, state, pincode, documentUrl },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      verificationStatus: 'pending',
      verificationSubmitted: true,
      businessProfile: profile._id,
      businessName, businessType,
    })

    // Notify admin (in production, send email)
    await createNotification(
      req.user._id,
      'verification',
      'Your business verification has been submitted and is under review.',
    )

    res.json({ message: 'Verification submitted successfully', profile })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/business/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({ user: req.user._id }).lean()
    res.json({ profile })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/business/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { businessName, businessType, address, city, state, pincode } = req.body
    const profile = await BusinessProfile.findOneAndUpdate(
      { user: req.user._id },
      { businessName, businessType, address, city, state, pincode },
      { new: true }
    )
    if (businessName) await User.findByIdAndUpdate(req.user._id, { businessName })
    res.json({ profile })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
