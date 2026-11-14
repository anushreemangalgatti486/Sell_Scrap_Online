const express  = require('express')
const router   = express.Router()
const Bid      = require('../models/Bid')
const Material = require('../models/Material')
const { protect, restrictTo, requireVerified } = require('../middleware/auth')
const { createNotification } = require('../utils/notifications')
const { emitBidUpdate } = require('../utils/socket')
const { syncBidToFirestore } = require('../utils/firebase')

// POST /api/bids/:materialId — place a bid
router.post('/:materialId', protect, restrictTo('buyer'), requireVerified, async (req, res) => {
  try {
    const { amount } = req.body
    if (!amount || isNaN(amount) || +amount <= 0) {
      return res.status(400).json({ message: 'Invalid bid amount' })
    }

    const material = await Material.findById(req.params.materialId).select('+minAcceptablePrice')
    if (!material) return res.status(404).json({ message: 'Material not found' })

    const now = new Date()

    // Auto-activate if start time has passed but status is still 'scheduled'
    if (material.auction?.status === 'scheduled' && material.auction.startTime && material.auction.startTime <= now) {
      material.auction.status = 'active'
      await material.save()
    }

    if (material.auction?.status !== 'active') {
      return res.status(400).json({ message: 'This auction is not currently active' })
    }
    if (material.auction.endTime && now > new Date(material.auction.endTime)) {
      return res.status(400).json({ message: 'Auction has ended' })
    }

    // Validate minimum bid
    const minBid = (material.currentHighestBid || material.startingPrice) + (material.minBidIncrement || 0)
    if (+amount < minBid) {
      return res.status(400).json({ message: `Minimum bid is ₹${minBid.toLocaleString()}` })
    }

    // Prevent seller from bidding on own material
    if (material.seller.equals(req.user._id)) {
      return res.status(400).json({ message: 'Sellers cannot bid on their own material' })
    }

    // Determine anonymous label
    const existingBidders = await Bid.find({ material: material._id }).distinct('bidder')
    let anonymousLabel
    const bidderIdx = existingBidders.findIndex(b => b.equals(req.user._id))
    if (bidderIdx === -1) {
      anonymousLabel = `Buyer ${String(existingBidders.length + 1).padStart(2, '0')}`
    } else {
      const existing = await Bid.findOne({ material: material._id, bidder: req.user._id }).sort({ amount: -1 })
      anonymousLabel = existing?.anonymousLabel || `Buyer ${String(bidderIdx + 1).padStart(2, '0')}`
    }

    // Create bid
    const bid = await Bid.create({
      material: material._id,
      bidder: req.user._id,
      amount: +amount,
      anonymousLabel,
    })

    // Update previous highest bidder status
    if (material.currentHighestBid) {
      const prevTopBid = await Bid.findOne({
        material: material._id,
        amount: material.currentHighestBid,
        _id: { $ne: bid._id },
      })
      if (prevTopBid && !prevTopBid.bidder.equals(req.user._id)) {
        await Bid.findByIdAndUpdate(prevTopBid._id, { status: 'outbid' })
        await createNotification(
          prevTopBid.bidder,
          'outbid',
          `You have been outbid on ${material.name}. Place a higher bid to stay in the auction.`,
          { materialId: material._id }
        )
      }
    }

    // Update material
    material.currentHighestBid = +amount
    material.bidsCount = (material.bidsCount || 0) + 1
    await material.save()

    // Notify seller
    await createNotification(
      material.seller,
      'bid_placed',
      `A new bid of ₹${(+amount).toLocaleString()} has been placed on ${material.name}.`,
      { materialId: material._id }
    )

    // Emit real-time update to all clients watching this auction
    emitBidUpdate(material._id.toString(), {
      materialId:        material._id,
      currentHighestBid: material.currentHighestBid,
      bidsCount:         material.bidsCount,
      anonymousLabel:    bid.anonymousLabel,
      amount:            bid.amount,
      createdAt:         bid.createdAt,
    })

    // Also sync to Cloud Firestore for real-time listeners
    syncBidToFirestore(material._id, {
      amount:            bid.amount,
      bidsCount:         material.bidsCount,
      anonymousLabel:    bid.anonymousLabel,
      createdAt:         bid.createdAt,
    })

    res.status(201).json({ bid: { ...bid.toObject(), bidder: undefined } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/bids/material/:materialId — bids for a material
router.get('/material/:materialId', async (req, res) => {
  try {
    const material = await Material.findById(req.params.materialId)
    if (!material) return res.status(404).json({ message: 'Material not found' })

    const auctionActive = material.auction?.status === 'active'
    const bids = await Bid.find({ material: req.params.materialId })
      .sort({ amount: -1 })
      .populate(auctionActive ? '' : 'bidder') // Only populate bidder after auction ends
      .lean()

    // If auction is active, mask bidder info
    const safeBids = bids.map(b => ({
      ...b,
      bidder: auctionActive ? undefined : b.bidder,
    }))

    res.json({ bids: safeBids })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/bids/mine — buyer's own bids
router.get('/mine', protect, restrictTo('buyer'), async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user._id })
      .sort({ createdAt: -1 })
      .populate('material', 'name category unit images auction')
      .lean()
    res.json({ bids })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
