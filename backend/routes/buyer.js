const express  = require('express')
const router   = express.Router()
const Bid      = require('../models/Bid')
const { protect, restrictTo } = require('../middleware/auth')

router.use(protect, restrictTo('buyer'))

// GET /api/buyer/stats
router.get('/stats', async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user._id }).lean()
    const totalBids    = bids.length
    const activeBids   = bids.filter(b => b.status === 'active').length
    const wonAuctions  = bids.filter(b => b.status === 'won').length
    const totalSpent   = bids.filter(b => b.status === 'won').reduce((acc, b) => acc + (b.amount || 0), 0)

    // Monthly bid activity (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const recentBids = bids.filter(b => new Date(b.createdAt) >= sixMonthsAgo)
    const monthlyMap = {}
    recentBids.forEach(b => {
      const key = new Date(b.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' })
      monthlyMap[key] = (monthlyMap[key] || 0) + 1
    })
    const monthlyBids = Object.entries(monthlyMap).map(([month, bids]) => ({ month, bids }))

    const wonLost = { won: wonAuctions, lost: bids.filter(b => b.status === 'lost').length }

    res.json({ totalBids, activeBids, wonAuctions, totalSpent, monthlyBids, wonLost })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/buyer/analytics
router.get('/analytics', async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user._id, status: 'won' })
      .populate('material', 'quantity unit')
      .lean()

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlySpendMap = {}
    const bidActivityMap  = {}
    bids.forEach(b => {
      const key = new Date(b.createdAt).toLocaleString('default', { month: 'short' })
      monthlySpendMap[key] = (monthlySpendMap[key] || 0) + (b.amount * (b.material?.quantity || 1))
      bidActivityMap[key]  = (bidActivityMap[key] || 0) + 1
    })

    const monthlySpend   = Object.entries(monthlySpendMap).map(([month, amount]) => ({ month, amount }))
    const bidActivity    = Object.entries(bidActivityMap).map(([month, bids]) => ({ month, bids }))

    res.json({ monthlySpend, bidActivity })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
