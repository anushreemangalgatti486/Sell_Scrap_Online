/**
 * payments.js — Razorpay payment integration for advance payment (Option C).
 *
 * Flow:
 *   1. Buyer wins auction → Transaction created (advance_pending)
 *   2. POST /create-order → Razorpay order created for advance amount
 *   3. Buyer pays via Razorpay Checkout (frontend)
 *   4. POST /verify → backend verifies payment signature → advance_paid
 *   5. POST /webhook → Razorpay webhook (idempotent, signature-verified)
 *   6. Seller records weighment → remaining balance calculated
 *   7. Buyer + seller confirm offline settlement → completed
 *
 * Security:
 *   - Razorpay key_secret is NEVER sent to frontend
 *   - Payment success is NEVER trusted from frontend alone
 *   - Webhook signature verified with RAZORPAY_WEBHOOK_SECRET
 *   - Idempotency via webhookProcessed flag
 *   - All amounts in paise (integer) — no floating point
 */

const express     = require('express')
const router      = express.Router()
const crypto      = require('crypto')
const Transaction = require('../models/Transaction')
const Setting      = require('../models/Setting')
const { protect, restrictTo } = require('../middleware/auth')
const { createNotification } = require('../utils/notifications')

// ── Razorpay instance (lazy init) ──
let _razorpay = null
function getRazorpay() {
  if (_razorpay) return _razorpay
  const Razorpay = require('razorpay')
  const keyId     = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret || keyId === 'rzp_test_your_key_id') {
    return null // not configured
  }

  _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
  return _razorpay
}

// ── Helper: get advance percentage from Settings (default 10) ──
async function getAdvancePercentage() {
  const setting = await Setting.findOne({ key: 'advancePercentage' }).lean()
  if (setting && typeof setting.value === 'number' && setting.value > 0 && setting.value <= 100) {
    return setting.value
  }
  return 10
}

// ── Helper: calculate advance amount in paise ──
function calcAdvanceAmount(totalAmountPaise, percentage) {
  // totalAmountPaise is already an integer (paise)
  // advance = totalAmount * (percentage / 100), rounded to nearest rupee (100 paise)
  const advance = Math.round((totalAmountPaise * percentage) / 100 / 100) * 100
  return Math.max(100, advance) // minimum ₹1 (100 paise)
}

// ── Helper: check user is party to transaction ──
function canAccess(tx, user) {
  if (user.role === 'admin') return true
  return tx.buyer.equals(user._id) || tx.seller.equals(user._id)
}

/* ═══════════════════════════════════════════════════════════════════
   POST /api/payments/create-order
   Buyer initiates advance payment → creates Razorpay order
   ═══════════════════════════════════════════════════════════════════ */
router.post('/create-order', protect, restrictTo('buyer'), async (req, res) => {
  try {
    const { transactionId } = req.body
    if (!transactionId) return res.status(400).json({ message: 'Transaction ID is required' })

    const tx = await Transaction.findById(transactionId)
      .populate('material', 'name')
      .populate('seller', 'name businessName')
    if (!tx) return res.status(404).json({ message: 'Transaction not found' })

    // Ownership check — buyer can only pay for their own transactions
    if (!tx.buyer.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only pay for your own transactions' })
    }

    // State check — only allow payment from advance_pending or payment_failed
    if (!['advance_pending', 'payment_failed'].includes(tx.paymentStatus)) {
      return res.status(400).json({ message: `Cannot create order: transaction is ${tx.paymentStatus}` })
    }

    // Prevent duplicate orders if one is already in flight
    if (tx.advanceStatus === 'order_created' && tx.razorpayOrderId) {
      // Return the existing order instead of creating a new one
      return res.json({
        orderId:       tx.razorpayOrderId,
        amount:        tx.advanceAmount,
        currency:      'INR',
        transactionId: tx._id,
        keyId:         process.env.RAZORPAY_KEY_ID, // public key only — safe for frontend
      })
    }

    const rzp = getRazorpay()
    if (!rzp) {
      // In development or when test keys are placeholders, create a mock order so testing works
      if (process.env.NODE_ENV !== 'production' || !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_your_key_id') {
        const percentage = await getAdvancePercentage()
        const totalPaise = tx.totalAmount || 0
        const advancePaise = calcAdvanceAmount(totalPaise, percentage)
        const mockOrderId = `order_mock_${Date.now()}`

        tx.razorpayOrderId   = mockOrderId
        tx.advanceAmount     = advancePaise
        tx.advancePercentage = percentage
        tx.advanceStatus     = 'order_created'
        tx.paymentStatus     = 'advance_pending'
        await tx.save()

        return res.json({
          orderId:       mockOrderId,
          amount:        advancePaise,
          currency:      'INR',
          transactionId: tx._id,
          keyId:         'mock_key',
          isMock:        true,
        })
      }
      return res.status(503).json({ message: 'Razorpay is not configured. Contact administrator.' })
    }

    // Calculate advance amount
    const percentage = await getAdvancePercentage()
    const totalPaise = tx.totalAmount || 0
    if (totalPaise <= 0) {
      return res.status(400).json({ message: 'Invalid transaction amount' })
    }
    const advancePaise = calcAdvanceAmount(totalPaise, percentage)

    // Create Razorpay order
    const order = await rzp.orders.create({
      amount:   advancePaise,
      currency: 'INR',
      receipt:  `tx_${tx._id.toString().slice(-12)}`,
      notes: {
        transactionId: tx._id.toString(),
        material:      tx.material?.name || '',
      },
    })

    // Save order details to transaction
    tx.razorpayOrderId    = order.id
    tx.advanceAmount      = advancePaise
    tx.advancePercentage  = percentage
    tx.advanceStatus      = 'order_created'
    tx.paymentStatus      = 'advance_pending'
    await tx.save()

    // Notify seller that buyer initiated payment
    await createNotification(
      tx.seller._id,
      'payment',
      `Buyer has initiated advance payment for ${tx.material?.name}.`,
      { transactionId: tx._id }
    )

    res.json({
      orderId:       order.id,
      amount:        advancePaise,
      currency:      'INR',
      transactionId: tx._id,
      keyId:         process.env.RAZORPAY_KEY_ID, // public key only
    })
  } catch (err) {
    console.error('Create order error:', err.message)
    res.status(500).json({ message: 'Failed to create payment order' })
  }
})

/* ═══════════════════════════════════════════════════════════════════
   POST /api/payments/verify
   Buyer submits Razorpay checkout response → backend verifies signature
   This is the FIRST verification. The webhook is the SECOND (authoritative).
   ═══════════════════════════════════════════════════════════════════ */
router.post('/verify', protect, restrictTo('buyer'), async (req, res) => {
  try {
    const { transactionId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body

    if (!transactionId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'Missing payment verification fields' })
    }

    const tx = await Transaction.findById(transactionId)
    if (!tx) return res.status(404).json({ message: 'Transaction not found' })
    if (!tx.buyer.equals(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    // Check if this is a simulated test payment
    if (razorpayPaymentId.startsWith('mock_pay_')) {
      tx.razorpayPaymentId  = razorpayPaymentId
      tx.razorpaySignature  = 'mock_signature'
      tx.advanceStatus      = 'paid'
      tx.advancePaidAt      = new Date()
      tx.paymentStatus      = 'advance_paid'
      tx.webhookProcessed   = true
      tx.webhookProcessedAt = new Date()
      await tx.save()

      await createNotification(tx.buyer, 'payment',
        `Advance payment of ₹${(tx.advanceAmount / 100).toLocaleString()} verified (Demo mode).`,
        { transactionId: tx._id })
      await createNotification(tx.seller, 'payment',
        `Advance payment of ₹${(tx.advanceAmount / 100).toLocaleString()} received from buyer (Demo mode).`,
        { transactionId: tx._id })

      return res.json({ verified: true, transaction: tx, mock: true })
    }

    // Verify the signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) return res.status(500).json({ message: 'Server configuration error' })

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex')

    if (expectedSignature !== razorpaySignature) {
      // Signature mismatch — forged or tampered response
      tx.advanceStatus = 'failed'
      tx.paymentStatus  = 'payment_failed'
      await tx.save()

      await createNotification(tx.buyer, 'payment',
        `Advance payment verification failed for ${tx.material?.name || 'transaction'}.`,
        { transactionId: tx._id })

      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' })
    }

    // Signature verified — mark advance as paid
    tx.razorpayPaymentId = razorpayPaymentId
    tx.razorpaySignature = razorpaySignature
    tx.advanceStatus    = 'paid'
    tx.advancePaidAt     = new Date()
    tx.paymentStatus     = 'advance_paid'
    tx.webhookProcessed  = true  // mark as processed so webhook doesn't duplicate
    tx.webhookProcessedAt = new Date()
    await tx.save()

    // Notify both parties
    await createNotification(tx.buyer, 'payment',
      `Advance payment of ₹${(tx.advanceAmount / 100).toLocaleString()} verified for your transaction.`,
      { transactionId: tx._id })
    await createNotification(tx.seller, 'payment',
      `Advance payment of ₹${(tx.advanceAmount / 100).toLocaleString()} received from buyer. Please coordinate pickup.`,
      { transactionId: tx._id })

    res.json({
      verified: true,
      transaction: {
        _id:            tx._id,
        paymentStatus:   tx.paymentStatus,
        advanceStatus:   tx.advanceStatus,
        advanceAmount:   tx.advanceAmount,
        advancePaidAt:   tx.advancePaidAt,
      },
    })
  } catch (err) {
    console.error('Payment verify error:', err.message)
    res.status(500).json({ message: 'Payment verification failed' })
  }
})

// POST /api/payments/mock-advance — dev helper to instantly confirm advance payment
router.post('/mock-advance', protect, restrictTo('buyer', 'admin'), async (req, res) => {
  try {
    const { transactionId } = req.body
    const tx = await Transaction.findById(transactionId).populate('material')
    if (!tx) return res.status(404).json({ message: 'Transaction not found' })

    const percentage = tx.advancePercentage || (await getAdvancePercentage())
    const advancePaise = tx.advanceAmount || calcAdvanceAmount(tx.totalAmount, percentage)

    tx.advanceAmount      = advancePaise
    tx.advancePercentage  = percentage
    tx.razorpayOrderId    = `order_mock_${Date.now()}`
    tx.razorpayPaymentId  = `mock_pay_${Date.now()}`
    tx.razorpaySignature  = 'mock_signature'
    tx.advanceStatus      = 'paid'
    tx.advancePaidAt      = new Date()
    tx.paymentStatus      = 'advance_paid'
    tx.webhookProcessed   = true
    tx.webhookProcessedAt = new Date()
    await tx.save()

    await createNotification(tx.buyer, 'payment',
      `Advance payment of ₹${(advancePaise / 100).toLocaleString()} confirmed (Demo Mode).`,
      { transactionId: tx._id })
    await createNotification(tx.seller, 'payment',
      `Advance payment of ₹${(advancePaise / 100).toLocaleString()} received from buyer (Demo Mode). Please coordinate pickup.`,
      { transactionId: tx._id })

    res.json({ verified: true, message: 'Test advance payment confirmed successfully', transaction: tx })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/* ═══════════════════════════════════════════════════════════════════
   POST /api/payments/webhook
   Razorpay webhook — authoritative payment confirmation.
   Raw body must be used for signature verification.
   This route is registered BEFORE express.json() in server.js.
   ═══════════════════════════════════════════════════════════════════ */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured')
      return res.status(500).json({ error: 'Webhook not configured' })
    }

    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature']
    if (!signature) {
      return res.status(400).json({ error: 'Missing signature header' })
    }

    const body = req.body.toString() // raw body as string
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.error('Webhook signature mismatch')
      return res.status(400).json({ error: 'Invalid webhook signature' })
    }

    // Parse the event
    const event = JSON.parse(body)
    const { event: eventType, payload } = event

    // Handle payment.captured event
    if (eventType === 'payment.captured') {
      const payment = payload.payment.entity
      const orderId = payment.order_id

      // Find transaction by razorpay order ID
      const tx = await Transaction.findOne({ razorpayOrderId: orderId })
      if (!tx) {
        console.error('Webhook: no transaction for order', orderId)
        return res.status(200).json({ status: 'ok' }) // ack to prevent retries
      }

      // Idempotency — skip if already processed
      if (tx.webhookProcessed) {
        return res.status(200).json({ status: 'ok', message: 'Already processed' })
      }

      // Verify the payment amount matches the expected advance
      if (payment.amount !== tx.advanceAmount) {
        console.error(`Webhook: amount mismatch. Expected ${tx.advanceAmount}, got ${payment.amount}`)
        return res.status(200).json({ status: 'ok' }) // ack but don't update
      }

      // Mark as paid
      tx.razorpayPaymentId = payment.id
      tx.razorpaySignature = payment.signature || ''
      tx.advanceStatus    = 'paid'
      tx.advancePaidAt    = new Date()
      tx.paymentStatus    = 'advance_paid'
      tx.webhookProcessed = true
      tx.webhookProcessedAt = new Date()
      await tx.save()

      // Notify both parties
      await createNotification(tx.buyer, 'payment',
        `Advance payment of ₹${(tx.advanceAmount / 100).toLocaleString()} confirmed.`,
        { transactionId: tx._id })
      await createNotification(tx.seller, 'payment',
        `Advance payment of ₹${(tx.advanceAmount / 100).toLocaleString()} received.`,
        { transactionId: tx._id })
    }

    // Handle payment.failed event
    if (eventType === 'payment.failed') {
      const payment = payload.payment.entity
      const tx = await Transaction.findOne({ razorpayOrderId: payment.order_id })
      if (tx && !tx.webhookProcessed) {
        tx.advanceStatus = 'failed'
        tx.paymentStatus  = 'payment_failed'
        await tx.save()

        await createNotification(tx.buyer, 'payment',
          `Advance payment failed for your transaction. You can retry.`,
          { transactionId: tx._id })
      }
    }

    // Always ack 200 to prevent Razorpay retries
    res.status(200).json({ status: 'ok' })
  } catch (err) {
    console.error('Webhook error:', err.message)
    res.status(200).json({ status: 'ok' }) // ack to prevent retries even on error
  }
})

/* ═══════════════════════════════════════════════════════════════════
   POST /api/payments/transactions/:id/weighment
   Seller records the actual weighed quantity.
   System recalculates final amount and remaining balance.
   ═══════════════════════════════════════════════════════════════════ */
router.post('/transactions/:id/weighment', protect, async (req, res) => {
  try {
    const { weighment } = req.body
    if (!weighment || isNaN(weighment) || +weighment <= 0) {
      return res.status(400).json({ message: 'Valid weighment quantity is required' })
    }

    const tx = await Transaction.findById(req.params.id)
      .populate('material', 'name')
      .populate('buyer',  'name businessName')
      .populate('seller', 'name businessName')
    if (!tx) return res.status(404).json({ message: 'Transaction not found' })

    // Only the seller can record weighment
    if (req.user.role !== 'admin' && !tx.seller._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the seller can record weighment' })
    }

    // Weighment can only be recorded after advance is paid
    if (!['advance_paid', 'pickup_initiated'].includes(tx.paymentStatus)) {
      return res.status(400).json({ message: 'Weighment can only be recorded after advance payment' })
    }

    const w = +weighment
    tx.finalWeighment = w
    // finalAmount = bidAmount (paise) * finalWeighment
    tx.finalAmount = tx.bidAmount * w
    // remainingBalance = finalAmount - advanceAmount (both in paise)
    tx.remainingBalance = Math.max(0, tx.finalAmount - tx.advanceAmount)
    tx.paymentStatus = 'balance_pending'
    tx.pickupStatus = 'completed'

    await tx.save()

    // Notify buyer that weighment is recorded
    await createNotification(tx.buyer._id, 'transaction',
      `Seller has recorded final weighment of ${w} ${tx.unit} for ${tx.material?.name}. Remaining balance: ₹${(tx.remainingBalance / 100).toLocaleString()}.`,
      { transactionId: tx._id })

    res.json({
      transaction: {
        _id:             tx._id,
        finalWeighment:  tx.finalWeighment,
        finalAmount:     tx.finalAmount,
        advanceAmount:   tx.advanceAmount,
        remainingBalance: tx.remainingBalance,
        paymentStatus:   tx.paymentStatus,
        pickupStatus:    tx.pickupStatus,
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/* ═══════════════════════════════════════════════════════════════════
   POST /api/payments/transactions/:id/settle
   Buyer or seller confirms offline balance settlement.
   Transaction completes only when BOTH confirm.
   ═══════════════════════════════════════════════════════════════════ */
router.post('/transactions/:id/settle', protect, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id)
      .populate('material', 'name')
      .populate('buyer',  'name businessName')
      .populate('seller', 'name businessName')
    if (!tx) return res.status(404).json({ message: 'Transaction not found' })
    if (!canAccess(tx, req.user)) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // Settlement can only happen after weighment (balance_pending)
    if (tx.paymentStatus !== 'balance_pending') {
      return res.status(400).json({ message: `Cannot settle: transaction is ${tx.paymentStatus}` })
    }

    // Record confirmation
    if (req.user.role === 'buyer'  && tx.buyer._id.equals(req.user._id))  {
      tx.confirmedByBuyer = true
      tx.settlementStatus = tx.settlementStatus === 'seller_confirmed' ? 'settled' : 'buyer_confirmed'
    }
    if (req.user.role === 'seller' && tx.seller._id.equals(req.user._id)) {
      tx.confirmedBySeller = true
      tx.settlementStatus = tx.settlementStatus === 'buyer_confirmed' ? 'settled' : 'seller_confirmed'
    }

    // Both confirmed → complete
    if (tx.confirmedByBuyer && tx.confirmedBySeller) {
      tx.paymentStatus    = 'completed'
      tx.settlementStatus = 'settled'
      tx.completedAt      = new Date()
      tx.paidAt            = new Date() // backward compat

      await createNotification(tx.buyer._id, 'payment',
        `Transaction for ${tx.material?.name} has been completed successfully.`,
        { transactionId: tx._id })
      await createNotification(tx.seller._id, 'payment',
        `Transaction for ${tx.material?.name} completed. All settlements confirmed.`,
        { transactionId: tx._id })
    } else {
      // Partial — notify the other party
      const otherParty  = req.user.role === 'buyer' ? tx.seller._id : tx.buyer._id
      const confirmer   = req.user.role === 'buyer'
        ? tx.buyer?.businessName || 'Buyer'
        : tx.seller?.businessName || 'Seller'
      await createNotification(otherParty, 'transaction',
        `${confirmer} has confirmed offline settlement for ${tx.material?.name}. Please confirm your side to complete.`,
        { transactionId: tx._id })
    }

    await tx.save()
    res.json({ transaction: tx })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
