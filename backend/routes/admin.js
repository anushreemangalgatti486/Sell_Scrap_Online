const express         = require('express')
const router          = express.Router()
const User            = require('../models/User')
const BusinessProfile = require('../models/BusinessProfile')
const Material        = require('../models/Material')
const { protect, restrictTo } = require('../middleware/auth')
const { createNotification } = require('../utils/notifications')
const { sendVerificationApprovedEmail } = require('../utils/email')

// All admin routes require admin role
router.use(protect, restrictTo('admin'))

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, pendingVerifications, activeListings, activeAuctions] = await Promise.all([
      User.countDocuments({ role: { $in: ['buyer', 'seller'] } }),
      User.countDocuments({ verificationStatus: 'pending' }),
      Material.countDocuments({ isActive: true }),
      Material.countDocuments({ 'auction.status': 'active' }),
    ])

    // Platform activity — last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [recentUsers, recentMaterials] = await Promise.all([
      User.find({ createdAt: { $gte: sixMonthsAgo } }).select('createdAt').lean(),
      Material.find({ createdAt: { $gte: sixMonthsAgo } }).select('createdAt').lean(),
    ])

    const activityMap = {}
    const toKey = (d) => new Date(d).toLocaleString('default', { month: 'short', year: '2-digit' })
    recentUsers.forEach(u => {
      const k = toKey(u.createdAt)
      if (!activityMap[k]) activityMap[k] = { month: k, newUsers: 0, newListings: 0 }
      activityMap[k].newUsers++
    })
    recentMaterials.forEach(m => {
      const k = toKey(m.createdAt)
      if (!activityMap[k]) activityMap[k] = { month: k, newUsers: 0, newListings: 0 }
      activityMap[k].newListings++
    })
    const platformActivity = Object.values(activityMap)

    res.json({ totalUsers, pendingVerifications, activeListings, activeAuctions, platformActivity })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { search, role } = req.query
    const query = {}
    if (role) query.role = role
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }
    const users = await User.find(query).populate('businessProfile').sort({ createdAt: -1 }).lean()
    res.json({ users })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/verifications/pending
router.get('/verifications/pending', async (req, res) => {
  try {
    const pendingUsers = await User.find({ verificationStatus: 'pending' }).lean()
    const verifications = await Promise.all(pendingUsers.map(async u => {
      const profile = await BusinessProfile.findOne({ user: u._id }).lean()
      return { ...profile, user: u }
    }))
    res.json({ verifications: verifications.filter(Boolean) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/verifications/:userId/approve
router.post('/verifications/:userId/approve', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { verificationStatus: 'approved' },
      { new: true }
    )
    if (!user) return res.status(404).json({ message: 'User not found' })
    await createNotification(
      user._id,
      'verification',
      'Your business has been verified and approved! You can now access all marketplace features.',
    )
    // Send approval email
    try { await sendVerificationApprovedEmail(user.email, user.name, user.role) } catch {}
    res.json({ message: 'Business approved', user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/verifications/:userId/reject
router.post('/verifications/:userId/reject', async (req, res) => {
  try {
    const { reason } = req.body
    if (!reason) return res.status(400).json({ message: 'Rejection reason is required' })
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { verificationStatus: 'rejected', rejectionReason: reason },
      { new: true }
    )
    if (!user) return res.status(404).json({ message: 'User not found' })
    await createNotification(
      user._id,
      'verification',
      `Your business verification was not approved. Reason: ${reason}. Please resubmit with the required information.`,
    )
    res.json({ message: 'Verification rejected' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/auctions — all auctions (all statuses) for admin view
router.get('/auctions', async (req, res) => {
  try {
    const { status } = req.query
    const query = { isActive: true }
    if (status) query['auction.status'] = status

    const materials = await Material.find(query)
      .select('-minAcceptablePrice')
      .sort({ 'auction.endTime': 1 })
      .populate('seller', 'businessName verificationStatus')
      .lean()

    const auctions = materials.map(m => ({
      _id:              m._id,
      material:         m,
      status:           m.auction.status,
      endTime:          m.auction.endTime,
      currentHighestBid: m.currentHighestBid,
      bidsCount:        m.bidsCount,
    }))
    res.json({ auctions })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/auctions/:materialId/close — force-close an active auction
router.post('/auctions/:materialId/close', async (req, res) => {
  try {
    const material = await Material.findById(req.params.materialId)
    if (!material) return res.status(404).json({ message: 'Material not found' })
    if (material.auction?.status !== 'active') {
      return res.status(400).json({ message: 'Auction is not currently active' })
    }

    // Run the same close logic as the cron job
    const { closeExpiredAuctions } = require('../utils/auctionJobs')
    // Force close by setting endTime to now and running the job
    material.auction.endTime = new Date(Date.now() - 1000)
    await material.save()
    await closeExpiredAuctions()

    res.json({ message: 'Auction closed successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/listings
router.get('/listings', async (req, res) => {
  try {
    const listings = await Material.find({ isActive: true })
      .select('-minAcceptablePrice')
      .sort({ createdAt: -1 })
      .populate('seller', 'name businessName')
      .lean()
    res.json({ listings })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/admin/listings/:id
router.delete('/listings/:id', async (req, res) => {
  try {
    await Material.findByIdAndUpdate(req.params.id, { isActive: false })
    res.json({ message: 'Listing removed' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/transactions — all platform transactions (admin only)
router.get('/transactions', async (req, res) => {
  try {
    const Transaction = require('../models/Transaction')
    const txns = await Transaction.find()
      .sort({ createdAt: -1 })
      .populate('material', 'name category')
      .populate('buyer',  'name businessName')
      .populate('seller', 'name businessName')
      .lean()
    res.json({ transactions: txns })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/users/:userId/suspend — suspend or activate a user
router.post('/users/:userId/suspend', async (req, res) => {
  try {
    const { active } = req.body
    if (typeof active !== 'boolean') {
      return res.status(400).json({ message: '`active` boolean is required' })
    }
    const user = await User.findById(req.params.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot suspend admin accounts via this endpoint' })
    }
    user.isActive = active
    await user.save()
    res.json({ message: active ? 'User activated' : 'User suspended', userId: user._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
