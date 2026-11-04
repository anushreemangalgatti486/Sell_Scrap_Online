const express  = require('express')
const router   = express.Router()
const Material = require('../models/Material')
const Bid      = require('../models/Bid')
const { protect, restrictTo } = require('../middleware/auth')

// GET /api/auctions/active
router.get('/active', async (req, res) => {
  try {
    const auctions = await Material.find({ 'auction.status': { $in: ['active', 'scheduled'] }, isActive: true })
      .select('-minAcceptablePrice')
      .sort({ 'auction.endTime': 1 })
      .populate('seller', 'businessName verificationStatus')
      .lean()
    // Reshape to auction objects
    const result = auctions.map(m => ({
      _id: m.auction._id || m._id,
      material: m,
      status: m.auction.status,
      endTime: m.auction.endTime,
      currentHighestBid: m.currentHighestBid,
      bidsCount: m.bidsCount,
    }))
    res.json({ auctions: result })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/auctions/:id
router.get('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id).select('-minAcceptablePrice').populate('seller').lean()
    if (!material) return res.status(404).json({ message: 'Auction not found' })
    res.json({ auction: material.auction, material })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
