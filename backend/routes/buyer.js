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
    const Transaction = require('../models/Transaction')

    // 1. Fetch ALL bids placed by this buyer (not just won!)
    const allBids = await Bid.find({ bidder: req.user._id })
      .populate('material', 'name category quantity unit')
      .lean()

    const wonBids    = allBids.filter(b => b.status === 'won')
    const activeBids = allBids.filter(b => b.status === 'active')
    const lostBids   = allBids.filter(b => b.status === 'lost')

    // 2. Fetch successful transactions for actual spent amounts if any
    const txns = await Transaction.find({ buyer: req.user._id, paymentStatus: 'successful' }).lean()

    const totalSpend = txns.length > 0
      ? txns.reduce((acc, t) => acc + (t.totalAmount || 0), 0)
      : wonBids.reduce((acc, b) => acc + ((b.amount || 0) * (b.material?.quantity || 1)), 0)

    // 3. Build a continuous 6-month timeline (e.g. Jun, Jul, Aug, Sep, Oct, Nov)
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleString('default', { month: 'short' })
      months.push({ key: label, year: d.getFullYear(), monthIndex: d.getMonth() })
    }

    const monthlySpendMap = {}
    const bidActivityMap  = {}
    months.forEach(m => {
      monthlySpendMap[m.key] = 0
      bidActivityMap[m.key]  = 0
    })

    // Group ALL bids into monthly activity
    allBids.forEach(b => {
      const d = new Date(b.createdAt)
      const key = d.toLocaleString('default', { month: 'short' })
      if (bidActivityMap[key] !== undefined) {
        bidActivityMap[key] += 1
      }
    })

    // Group spend by month
    if (txns.length > 0) {
      txns.forEach(t => {
        const d = new Date(t.paidAt || t.createdAt)
        const key = d.toLocaleString('default', { month: 'short' })
        if (monthlySpendMap[key] !== undefined) {
          monthlySpendMap[key] += (t.totalAmount || 0)
        }
      })
    } else {
      wonBids.forEach(b => {
        const d = new Date(b.createdAt)
        const key = d.toLocaleString('default', { month: 'short' })
        if (monthlySpendMap[key] !== undefined) {
          monthlySpendMap[key] += ((b.amount || 0) * (b.material?.quantity || 1))
        }
      })
    }

    const monthlySpend = months.map(m => ({ month: m.key, amount: monthlySpendMap[m.key] }))
    const bidActivity  = months.map(m => ({ month: m.key, bids: bidActivityMap[m.key] }))

    // 4. Category breakdown
    const catMap = {}
    allBids.forEach(b => {
      const cat = b.material?.category || 'General Scrap'
      catMap[cat] = (catMap[cat] || 0) + 1
    })
    const categoryDistribution = Object.entries(catMap).map(([category, bids]) => ({ category, bids }))

    // 5. Summary metrics
    const totalBids = allBids.length
    const winRate   = totalBids > 0 ? Math.round((wonBids.length / totalBids) * 100) : 0
    const avgBid    = totalBids > 0 ? Math.round(allBids.reduce((acc, b) => acc + (b.amount || 0), 0) / totalBids) : 0

    res.json({
      totalBids,
      activeBids: activeBids.length,
      wonAuctions: wonBids.length,
      lostBids: lostBids.length,
      winRate,
      avgBid,
      totalSpend,
      monthlySpend,
      bidActivity,
      categoryDistribution
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
