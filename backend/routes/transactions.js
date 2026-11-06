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
      .select('-razorpaySignature') // never expose signature
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
      .select('-razorpaySignature')
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
// Buyer initiates the transaction — marks as ready for advance payment
router.post('/:id/initiate', protect, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id)
      .populate('material', 'name')
      .populate('seller', 'name businessName')
    if (!tx) return res.status(404).json({ message: 'Transaction not found' })
    if (!tx.buyer.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the buyer can initiate payment' })
    }

    // Allow initiation from advance_pending or payment_failed (retry)
    if (!['advance_pending', 'payment_failed'].includes(tx.paymentStatus)) {
      return res.status(400).json({ message: `Transaction is already ${tx.paymentStatus}` })
    }

    // If payment had failed before, reset to allow retry
    if (tx.paymentStatus === 'payment_failed') {
      tx.paymentStatus  = 'advance_pending'
      tx.advanceStatus  = 'pending'
    }

    await tx.save()

    // Notify seller
    await createNotification(
      tx.seller._id,
      'payment',
      `Buyer has initiated the transaction for ${tx.material?.name}. Advance payment pending.`,
      { transactionId: tx._id }
    )

    res.json({ transaction: tx })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/transactions/:id/confirm
// Legacy confirm — now delegates to settlement confirmation
// Kept for backward compatibility with existing frontend components
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
    if (tx.paymentStatus === 'completed') {
      return res.status(400).json({ message: 'Transaction already completed' })
    }

    // Record weighment if provided (seller can do this)
    if (req.body.weighment && !isNaN(req.body.weighment) && +req.body.weighment > 0) {
      if (req.user.role !== 'admin' && !tx.seller._id.equals(req.user._id)) {
        return res.status(403).json({ message: 'Only the seller can record weighment' })
      }
      tx.finalWeighment = +req.body.weighment
      tx.finalAmount     = tx.bidAmount * tx.finalWeighment
      tx.remainingBalance = Math.max(0, tx.finalAmount - tx.advanceAmount)
      if (tx.paymentStatus === 'advance_paid') tx.paymentStatus = 'balance_pending'
      tx.pickupStatus = 'completed'
    }

    // Settlement confirmation
    if (req.user.role === 'buyer'  && tx.buyer._id.equals(req.user._id))  tx.confirmedByBuyer  = true
    if (req.user.role === 'seller' && tx.seller._id.equals(req.user._id)) tx.confirmedBySeller = true

    // Both confirmed → complete (only after balance_pending)
    if (tx.confirmedByBuyer && tx.confirmedBySeller && tx.paymentStatus === 'balance_pending') {
      tx.paymentStatus    = 'completed'
      tx.settlementStatus = 'settled'
      tx.completedAt      = new Date()
      tx.paidAt            = new Date()

      await createNotification(tx.buyer._id, 'payment',
        `Transaction for ${tx.material?.name} completed successfully.`,
        { transactionId: tx._id })
      await createNotification(tx.seller._id, 'payment',
        `Transaction for ${tx.material?.name} completed. All settlements confirmed.`,
        { transactionId: tx._id })
    } else if (tx.confirmedByBuyer || tx.confirmedBySeller) {
      const otherParty = req.user.role === 'buyer' ? tx.seller._id : tx.buyer._id
      const confirmer  = req.user.role === 'buyer'
        ? tx.buyer?.businessName || 'Buyer'
        : tx.seller?.businessName || 'Seller'
      await createNotification(otherParty, 'transaction',
        `${confirmer} has confirmed for ${tx.material?.name}. Please confirm your side.`,
        { transactionId: tx._id })
    }

    await tx.save()
    res.json({ transaction: tx })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/transactions/:id/cancel (admin or buyer before advance payment)
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id)
      .populate('material', 'name')
    if (!tx) return res.status(404).json({ message: 'Transaction not found' })

    // Only admin or the buyer can cancel
    // After advance is paid, only admin can cancel (requires refund handling)
    const canCancel =
      req.user.role === 'admin' ||
      (tx.buyer.equals(req.user._id) && tx.paymentStatus === 'advance_pending')

    if (!canCancel) {
      return res.status(403).json({
        message: tx.paymentStatus === 'advance_paid'
          ? 'Cannot cancel after advance payment. Contact admin for refund.'
          : 'Cannot cancel this transaction'
      })
    }

    // If advance was already paid, warn about refund
    if (tx.advanceStatus === 'paid') {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Advance payment already received. Only admin can cancel. Refund will need to be processed manually.'
        })
      }
      // Admin cancelling after advance paid — flag for manual refund
      tx.advanceStatus = 'refunded'
    }

    tx.paymentStatus = 'cancelled'
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
