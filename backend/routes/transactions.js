const express      = require('express')
const router       = express.Router()
const Transaction  = require('../models/Transaction')
const { protect }  = require('../middleware/auth')
const { createNotification } = require('../utils/notifications')

/* helper — verify the current user is party to this transaction */
function canAccess(tx, user) {
  if (user.role === 'admin') return true
  return tx.buyer.equals(user._id) || tx.seller.equals(user._id)
}

// GET /api/transactions/mine
router.get('/mine', protect, async (req, res) => {
  try {
    let query = {}
    if (req.user.role === 'buyer')  query.buyer  = req.user._id
    if (req.user.role === 'seller') query.seller = req.user._id
    // admin: query stays {} → all transactions

    const txns = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .populate('material', 'name category images unit')
      .populate('buyer',    'name businessName email')
      .populate('seller',   'name businessName email')
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
      .populate('material', 'name category images unit location')
      .populate('buyer',    'name businessName email phone')
      .populate('seller',   'name businessName email phone')
      .populate('winningBid')
    if (!tx) return res.status(404).json({ message: 'Transaction not found' })
    if (!canAccess(tx, req.user)) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    res.json({ transaction: tx })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/transactions/:id/initiate
// Buyer initiates the payment process (marks as 'initiated')
router.post('/:id/initiate', protect, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id)
      .populate('material', 'name')
      .populate('seller', 'name businessName')
    if (!tx) return res.status(404).json({ message: 'Transaction not found' })
    if (!tx.buyer.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the buyer can initiate payment' })
    }
    if (tx.paymentStatus !== 'pending') {
      return res.status(400).json({ message: `Transaction is already ${tx.paymentStatus}` })
    }

    tx.paymentStatus = 'initiated'
    await tx.save()

    // Notify seller
    await createNotification(
      tx.seller._id,
      'payment',
      `Buyer has initiated payment for ${tx.material?.name}. Please coordinate pickup.`,
      { transactionId: tx._id }
    )

    res.json({ transaction: tx })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/transactions/:id/confirm
// Dual-confirmation: buyer confirms receipt, seller confirms pickup.
// When both confirm → status becomes 'successful'.
router.post('/:id/confirm', protect, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id)
      .populate('material', 'name')
      .populate('buyer',  'name businessName')
      .populate('seller', 'name businessName')
    if (!tx) return res.status(404).json({ message: 'Transaction not found' })
    if (!canAccess(tx, req.user)) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    if (tx.paymentStatus === 'successful') {
      return res.status(400).json({ message: 'Transaction already completed' })
    }

    if (req.user.role === 'buyer'  && tx.buyer._id.equals(req.user._id))  tx.confirmedByBuyer  = true
    if (req.user.role === 'seller' && tx.seller._id.equals(req.user._id)) tx.confirmedBySeller = true

    // Optional: record weighment supplied by either party
    if (req.body.weighment && !isNaN(req.body.weighment)) {
      tx.weighment = +req.body.weighment
    }
    if (req.body.pickupDate) {
      tx.pickupDate    = new Date(req.body.pickupDate)
      tx.pickupStatus  = 'scheduled'
    }

    // Both confirmed → complete
    if (tx.confirmedByBuyer && tx.confirmedBySeller) {
      tx.paymentStatus = 'successful'
      tx.pickupStatus  = 'completed'
      tx.paidAt        = new Date()

      // Notify both parties
      await createNotification(
        tx.buyer._id,
        'payment',
        `Transaction for ${tx.material?.name} has been completed successfully.`,
        { transactionId: tx._id }
      )
      await createNotification(
        tx.seller._id,
        'payment',
        `Transaction for ${tx.material?.name} has been completed. Payment confirmed.`,
        { transactionId: tx._id }
      )
    } else {
      // Partial — notify the other party
      const otherParty = req.user.role === 'buyer' ? tx.seller._id : tx.buyer._id
      const confirmerName = req.user.role === 'buyer'
        ? tx.buyer?.businessName || 'Buyer'
        : tx.seller?.businessName || 'Seller'
      await createNotification(
        otherParty,
        'transaction',
        `${confirmerName} has confirmed pickup for ${tx.material?.name}. Please confirm your side to complete.`,
        { transactionId: tx._id }
      )
    }

    await tx.save()
    res.json({ transaction: tx })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/transactions/:id/cancel (admin or buyer before payment)
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id)
      .populate('material', 'name')
    if (!tx) return res.status(404).json({ message: 'Transaction not found' })

    // Only admin or the buyer can cancel, and only while pending/initiated
    const canCancel =
      req.user.role === 'admin' ||
      (tx.buyer.equals(req.user._id) && ['pending', 'initiated'].includes(tx.paymentStatus))

    if (!canCancel) {
      return res.status(403).json({ message: 'Cannot cancel this transaction' })
    }

    tx.paymentStatus = 'failed'
    await tx.save()

    await createNotification(tx.seller, 'transaction',
      `Transaction for ${tx.material?.name} was cancelled.`, { transactionId: tx._id })
    await createNotification(tx.buyer, 'transaction',
      `Transaction for ${tx.material?.name} was cancelled.`, { transactionId: tx._id })

    res.json({ message: 'Transaction cancelled', transaction: tx })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
