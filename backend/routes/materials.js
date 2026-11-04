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
    const material = await Material
      .findById(req.params.id)
      .select('-minAcceptablePrice')
      .populate('seller', safePopulate)
      .lean()
    if (!material) return res.status(404).json({ message: 'Material not found' })
    res.json({ material })
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
    const startTime = auctionStartDate ? new Date(auctionStartDate) : null
    const endTime   = auctionEndDate   ? new Date(auctionEndDate)   : null
    let auctionStatus = 'draft'
    if (startTime && endTime) {
      auctionStatus = startTime <= now ? 'active' : 'scheduled'
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
    material.isActive = false
    await material.save()
    res.json({ message: 'Listing removed' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
