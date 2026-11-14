const express   = require('express')
const router    = express.Router()
const Material  = require('../models/Material')
const Bid       = require('../models/Bid')
const Transaction = require('../models/Transaction')
const { protect, restrictTo } = require('../middleware/auth')
const { uploadMaterialImages, getFileUrl } = require('../middleware/upload')

router.use(protect, restrictTo('seller'))

// GET /api/seller/stats
router.get('/stats', async (req, res) => {
  try {
    const materials = await Material.find({ seller: req.user._id, isActive: true }).lean()
    const totalListings   = materials.length
    const activeAuctions  = materials.filter(m => m.auction?.status === 'active').length
    const successfulSales = materials.filter(m => m.auction?.status === 'closed' && m.auction?.winner).length
    const txns = await Transaction.find({ seller: req.user._id, paymentStatus: 'successful' }).lean()
    const totalRevenue = txns.reduce((acc, t) => acc + (t.totalAmount || 0), 0)

    // Monthly sales (last 6 months)
    const monthlySalesMap = {}
    txns.forEach(t => {
      const key = new Date(t.paidAt || t.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' })
      monthlySalesMap[key] = (monthlySalesMap[key] || 0) + (t.totalAmount || 0)
    })
    const monthlySales = Object.entries(monthlySalesMap).map(([month, revenue]) => ({ month, revenue }))

    // Bidding activity
    const allBids = await Bid.find({ material: { $in: materials.map(m => m._id) } }).lean()
    const activityMap = {}
    allBids.forEach(b => {
      const key = new Date(b.createdAt).toLocaleString('default', { month: 'short' })
      activityMap[key] = (activityMap[key] || 0) + 1
    })
    const biddingActivity = Object.entries(activityMap).map(([month, bids]) => ({ month, bids }))

    res.json({ totalListings, activeAuctions, successfulSales, totalRevenue, monthlySales, biddingActivity })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/seller/analytics
router.get('/analytics', async (req, res) => {
  try {
    const materials = await Material.find({ seller: req.user._id }).lean()
    const txns = await Transaction.find({ seller: req.user._id }).lean()

    // Continuous 6-month window
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(d.toLocaleString('default', { month: 'short' }))
    }

    const monthlySalesMap = {}
    months.forEach(m => { monthlySalesMap[m] = 0 })
    txns.forEach(t => {
      const key = new Date(t.paidAt || t.createdAt).toLocaleString('default', { month: 'short' })
      if (monthlySalesMap[key] !== undefined) {
        monthlySalesMap[key] += (t.totalAmount || 0)
      }
    })
    const monthlySales = months.map(month => ({ month, revenue: monthlySalesMap[month] }))

    // Demand by category (bids per category)
    const allBids = await Bid.find({ material: { $in: materials.map(m => m._id) } }).populate('material', 'category').lean()
    const catMap = {}
    allBids.forEach(b => {
      const cat = b.material?.category || 'Other'
      catMap[cat] = (catMap[cat] || 0) + 1
    })
    const demandByCategory = Object.entries(catMap).map(([category, bids]) => ({ category, bids }))

    const totalRevenue = txns.reduce((acc, t) => acc + (t.totalAmount || 0), 0)
    const totalListings = materials.length
    const totalBidsReceived = allBids.length

    res.json({ totalListings, totalBidsReceived, totalRevenue, monthlySales, demandByCategory })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/seller/materials — create with image upload
router.post('/materials', uploadMaterialImages, async (req, res) => {
  try {
    const {
      name, category, materialType, grade, description, specifications,
      quantity, unit, location, stockAvailability,
      startingPrice, minBidIncrement, minAcceptablePrice,
      auctionStartDate, auctionEndDate, deliveryTerms,
    } = req.body

    const images = (req.files || []).map(f => getFileUrl(f)).filter(Boolean)

    const now = new Date()
    // Treat naive datetime strings (from datetime-local inputs) as UTC
    // by appending 'Z' if no timezone is present
    const toUTC = (s) => {
      if (!s) return null
      if (/Z$|[+-]\d{2}:\d{2}$/.test(s)) return new Date(s)
      return new Date(s + ':00Z')
    }
    const startTime = toUTC(auctionStartDate)
    const endTime   = toUTC(auctionEndDate)
    let auctionStatus = 'draft'
    if (startTime && endTime) {
      auctionStatus = startTime <= now ? 'active' : 'scheduled'
    }

    const material = await Material.create({
      name, category, materialType, grade, description, specifications,
      images,
      quantity: +quantity, unit, location, stockAvailability,
      startingPrice: +startingPrice,
      minBidIncrement: +(minBidIncrement || 100),
      minAcceptablePrice: minAcceptablePrice ? +minAcceptablePrice : undefined,
      deliveryTerms,
      auction: { startTime, endTime, status: auctionStatus },
      seller: req.user._id,
    })

    const safeObj = material.toObject()
    delete safeObj.minAcceptablePrice
    res.status(201).json({ material: safeObj })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
