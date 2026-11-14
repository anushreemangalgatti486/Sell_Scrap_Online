const express   = require('express')
const router    = express.Router()
const Material  = require('../models/Material')
const { protect, restrictTo, requireVerified } = require('../middleware/auth')
const { uploadMaterialImages, getFileUrl } = require('../middleware/upload')

// Helper to build safe public material object (never exposes minAcceptablePrice)
const safePopulate = 'name email role verificationStatus businessName'

// GET /api/materials — public listing
router.get('/', async (req, res) => {
  try {
    const { search, category, sort, page = 1, limit = 12, status } = req.query
    const query = { isActive: true }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }
    if (category && category !== 'All') query.category = category
    if (status) query['auction.status'] = status

    let sortObj = { createdAt: -1 }
    if (sort === 'price_asc')    sortObj = { startingPrice: 1 }
    if (sort === 'price_desc')   sortObj = { startingPrice: -1 }
    if (sort === 'ending_soon')  sortObj = { 'auction.endTime': 1 }

    const total     = await Material.countDocuments(query)
    const materials = await Material
      .find(query)
      .select('-minAcceptablePrice')
      .sort(sortObj)
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .populate('seller', safePopulate)
      .lean()

    res.json({ materials, total, page: +page, limit: +limit })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/materials/mine — seller's own listings
router.get('/mine', protect, restrictTo('seller'), async (req, res) => {
  try {
    const { sold, search } = req.query
    const query = { seller: req.user._id, isActive: true }
    if (sold === 'true')  query['auction.status'] = 'closed'
    if (sold === 'false') query['auction.status'] = { $ne: 'closed' }
    if (search) query.name = { $regex: search, $options: 'i' }

    const materials = await Material.find(query).select('-minAcceptablePrice').sort({ createdAt: -1 }).lean()
    res.json({ materials })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/materials/:id — single material
router.get('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
    if (!material) return res.status(404).json({ message: 'Material not found' })

    const now = new Date()
    // Auto-activate if start time has passed or is within 10 minutes
    if (material.auction?.startTime && ['scheduled', 'draft'].includes(material.auction.status)) {
      const startTime = new Date(material.auction.startTime)
      if (startTime <= new Date(now.getTime() + 10 * 60 * 1000)) {
        material.auction.status = 'active'
        await material.save()
      }
    }

    const safeMaterial = await Material
      .findById(req.params.id)
      .select('-minAcceptablePrice')
      .populate('seller', safePopulate)
      .lean()

    res.json({ material: safeMaterial })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/materials — create (seller only)
router.post('/', protect, restrictTo('seller'), requireVerified, uploadMaterialImages, async (req, res) => {
  try {
    const {
      name, category, materialType, grade, description, specifications,
      quantity, unit, location, stockAvailability,
      startingPrice, minBidIncrement, minAcceptablePrice,
      auctionStartDate, auctionEndDate, deliveryTerms,
    } = req.body

    const images = []
    if (req.files?.length) {
      req.files.forEach(f => images.push(getFileUrl(f)))
    }

    const now = new Date()
    const parseDate = (s) => {
      if (!s) return null
      return new Date(s)
    }
    const startTime = parseDate(auctionStartDate) || now
    const endTime   = parseDate(auctionEndDate)
    let auctionStatus = 'active'
    if (startTime && endTime) {
      // 10 minutes buffer: starting today or within 10 minutes activates immediately
      auctionStatus = startTime <= new Date(now.getTime() + 10 * 60 * 1000) ? 'active' : 'scheduled'
    }

    const material = await Material.create({
      name, category, materialType, grade, description, specifications,
      images,
      quantity: +quantity, unit, location, stockAvailability,
      startingPrice: +startingPrice,
      minBidIncrement: +minBidIncrement || 100,
      minAcceptablePrice: minAcceptablePrice ? +minAcceptablePrice : undefined,
      deliveryTerms,
      auction: { startTime, endTime, status: auctionStatus },
      seller: req.user._id,
    })

    res.status(201).json({ material: { ...material.toObject(), minAcceptablePrice: undefined } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/materials/:id
router.delete('/:id', protect, restrictTo('seller', 'admin'), async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
    if (!material) return res.status(404).json({ message: 'Material not found' })
    if (req.user.role === 'seller' && !material.seller.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    if (material.auction?.status === 'active') {
      return res.status(400).json({ message: 'Cannot delete an active auction' })
    }
    if (material.auction?.status === 'closed' || material.auction?.winner) {
      return res.status(400).json({ message: 'Cannot delete a material after a bid has been accepted / auction closed' })
    }
    material.isActive = false
    await material.save()
    res.json({ message: 'Listing removed' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/materials/:id — edit listing (seller who owns it, or admin)
router.put('/:id', protect, restrictTo('seller', 'admin'), async (req, res) => {
  try {
    const material = await Material.findById(req.params.id).select('+minAcceptablePrice')
    if (!material) return res.status(404).json({ message: 'Material not found' })

    // Ownership check — sellers can only edit their own listings
    if (req.user.role === 'seller' && !material.seller.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to edit this listing' })
    }

    // Cannot edit while auction is active
    if (material.auction?.status === 'active') {
      return res.status(400).json({ message: 'Cannot edit a listing while auction is active' })
    }

    // Check if seller has accepted the highest bid / auction is closed with a winner
    const isAcceptedOrSold = material.auction?.status === 'closed' || Boolean(material.auction?.winner)

    if (isAcceptedOrSold) {
      // After accepting the highest bid, seller CANNOT change any material information except pickup address/location & delivery terms
      const lockedFields = ['name', 'description', 'specifications', 'grade', 'quantity', 'unit', 'stockAvailability', 'minAcceptablePrice']
      const changedLockedFields = lockedFields.filter(f => req.body[f] !== undefined && String(req.body[f]) !== String(material[f] ?? ''))

      if (changedLockedFields.length > 0) {
        return res.status(400).json({
          message: `The highest bid for this material has already been accepted. Material specifications (${changedLockedFields.join(', ')}) cannot be altered. Only pickup address / location can be updated.`
        })
      }

      if (req.body.location !== undefined) {
        material.location = req.body.location
      }
      if (req.body.deliveryTerms !== undefined) {
        material.deliveryTerms = req.body.deliveryTerms
      }

      await material.save()
      const safeObj = material.toObject()
      delete safeObj.minAcceptablePrice
      return res.json({ material: safeObj, message: 'Pickup address updated successfully' })
    }

    // Whitelist of editable fields — never allow changing seller or minAcceptablePrice via PUT
    const allowed = [
      'name', 'description', 'specifications', 'grade', 'deliveryTerms',
      'quantity', 'unit', 'location', 'stockAvailability',
    ]
    allowed.forEach(field => {
      if (req.body[field] !== undefined) material[field] = req.body[field]
    })

    // Allow updating minAcceptablePrice only for the owning seller
    if (req.user.role === 'seller' && req.body.minAcceptablePrice !== undefined) {
      material.minAcceptablePrice = +req.body.minAcceptablePrice || undefined
    }

    await material.save()
    const safeObj = material.toObject()
    delete safeObj.minAcceptablePrice
    res.json({ material: safeObj })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/materials/:id/accept-bid — seller accepts highest bid & closes auction early
router.post('/:id/accept-bid', protect, restrictTo('seller', 'admin'), async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
    if (!material) return res.status(404).json({ message: 'Material not found' })

    if (req.user.role === 'seller' && !material.seller.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to accept bids for this material' })
    }

    if (material.auction?.status !== 'active') {
      return res.status(400).json({ message: 'Auction is not currently active' })
    }

    const Bid = require('../models/Bid')
    const Transaction = require('../models/Transaction')
    const { createNotification } = require('../utils/notifications')
    const { emitAuctionClosed } = require('../utils/socket')
    const { syncAuctionClosedToFirestore } = require('../utils/firebase')

    const winningBid = await Bid.findOne({ material: material._id })
      .sort({ amount: -1 })
      .populate('bidder', 'name email businessName')

    if (!winningBid) {
      return res.status(400).json({ message: 'No bids have been placed on this material yet' })
    }

    const now = new Date()

    material.auction.status = 'closed'
    material.auction.closedAt = now
    material.auction.winner = winningBid.bidder._id
    material.auction.winningBid = winningBid._id
    await material.save()

    await Bid.updateMany({ material: material._id, _id: { $ne: winningBid._id } }, { status: 'lost' })
    await Bid.findByIdAndUpdate(winningBid._id, { status: 'won' })

    const totalAmount = winningBid.amount * material.quantity
    const tx = await Transaction.create({
      material:   material._id,
      buyer:      winningBid.bidder._id,
      seller:     material.seller,
      winningBid: winningBid._id,
      bidAmount:  winningBid.amount,
      quantity:   material.quantity,
      unit:       material.unit,
      totalAmount,
      paymentStatus: 'advance_pending',
      advanceStatus: 'pending',
      advancePercentage: 10,
    })

    await createNotification(
      winningBid.bidder._id,
      'auction_won',
      `Congratulations! Your bid of ₹${winningBid.amount.toLocaleString()} was accepted by the seller for ${material.name}.`,
      { materialId: material._id, transactionId: tx._id }
    )

    await createNotification(
      material.seller,
      'transaction',
      `You accepted the winning bid of ₹${winningBid.amount.toLocaleString()} for ${material.name}. A transaction has been created.`,
      { materialId: material._id, transactionId: tx._id }
    )

    emitAuctionClosed(material._id.toString(), {
      materialId: material._id,
      status: 'closed',
      winningBid: winningBid.amount,
      closedAt: now,
    })

    syncAuctionClosedToFirestore(material._id, {
      winningBid: winningBid.amount,
      winner: winningBid.bidder._id,
      closedAt: now.toISOString(),
    })

    res.json({
      message: 'Bid accepted and auction closed successfully',
      material,
      transaction: tx,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/materials/:id/activate — seller or admin activates scheduled/draft auction immediately
router.post('/:id/activate', protect, restrictTo('seller', 'admin'), async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
    if (!material) return res.status(404).json({ message: 'Material not found' })
    if (req.user.role === 'seller' && !material.seller.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    material.auction.status = 'active'
    material.auction.startTime = new Date()
    // Default 3 days if no endTime set
    if (!material.auction.endTime || new Date(material.auction.endTime) <= new Date()) {
      material.auction.endTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }
    await material.save()
    res.json({ message: 'Auction is now live', material })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
