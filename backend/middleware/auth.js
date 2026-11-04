const jwt  = require('jsonwebtoken')
const User = require('../models/User')

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated' })
    }
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    if (!user || !user.isActive) return res.status(401).json({ message: 'User not found or inactive' })
    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired' })
    return res.status(401).json({ message: 'Invalid token' })
  }
}

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action' })
  }
  next()
}

exports.requireVerified = (req, res, next) => {
  if (req.user.verificationStatus !== 'approved') {
    return res.status(403).json({ message: 'Your business must be verified to access this feature' })
  }
  next()
}
