const express     = require('express')
const router      = express.Router()
const Transaction = require('../models/Transaction')
const { protect, restrictTo } = require('../middleware/auth')

// GET /api/transactions/mine
router.get('/mine', protect, async (req, res) => {
  try {
    let query = {}
    if (req.user.role === 'buyer')  query.buyer  = req.user._id
    if (req.user.role === 'seller') query.seller = req.user._id
    // Admin sees all
    const txns = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .populate('material', 'name category images')
      .populate('buyer',  'name businessName')
      .populate('seller', 'name businessName')
      .lean()
    res.json({ transactions: txns })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/transactions/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id)
      .populate('material buyer seller winningBid')
    if (!tx) return res.status(404).json({ message: 'Transaction not found' })
    // Only buyer, seller or admin can view
    if (req.user.role !== 'admin' && !tx.buyer.equals(req.user._id) && !tx.seller.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    res.json({ transaction: tx })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/transactions/:id/confirm
router.post('/:id/confirm', protect, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id)
    if (!tx) return res.status(404).json({ message: 'Transaction not found' })

    if (req.user.role === 'buyer'  && tx.buyer.equals(req.user._id))  tx.confirmedByBuyer  = true
    if (req.user.role === 'seller' && tx.seller.equals(req.user._id)) tx.confirmedBySeller = true

    if (tx.confirmedByBuyer && tx.confirmedBySeller) {
      tx.paymentStatus = 'successful'
      tx.paidAt = new Date()
    }
    await tx.save()
    res.json({ transaction: tx })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
