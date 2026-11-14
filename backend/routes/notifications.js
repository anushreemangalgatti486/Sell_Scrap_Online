const express      = require('express')
const router       = express.Router()
const Notification = require('../models/Notification')
const { protect }  = require('../middleware/auth')

// GET /api/notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
    res.json({ notifications })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/notifications/:id/read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const n = await Notification.findOne({ _id: req.params.id, user: req.user._id })
    if (!n) return res.status(404).json({ message: 'Notification not found' })
    n.read = true
    await n.save()
    res.json({ notification: n })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/notifications/read-all
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
    res.json({ message: 'All marked as read' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
