const jwt  = require('jsonwebtoken')
const User = require('../models/User')

/**
 * protect — verifies the JWT from the Authorization header.
 * Attaches the authenticated user to req.user.
 */
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const token = authHeader.split(' ')[1]
    const secret = process.env.JWT_SECRET
    if (!secret) return res.status(500).json({ message: 'Server configuration error' })

    const decoded = jwt.verify(token, secret)

    // Ensure the payload has expected fields
    if (!decoded.id || !decoded.role) {
      return res.status(401).json({ message: 'Invalid token payload' })
    }

    const user = await User.findById(decoded.id).select('-password')
    if (!user) return res.status(401).json({ message: 'User not found' })
    if (!user.isActive) return res.status(401).json({ message: 'Account is deactivated' })

    // Guard against role tampering: the role in the DB is authoritative
    // If the token role no longer matches the DB role, reject
    if (user.role !== decoded.role) {
      return res.status(401).json({ message: 'Token role mismatch — please log in again' })
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired' })
    if (err.name === 'JsonWebTokenError')  return res.status(401).json({ message: 'Invalid token' })
    return res.status(401).json({ message: 'Authentication failed' })
  }
}

/**
 * restrictTo — role-based access control.
 * Must be used after protect().
 */
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' })
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action' })
  }
  next()
}

/**
 * requireVerified — ensures the user has passed KYC.
 * Must be used after protect().
 */
exports.requireVerified = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' })
  if (req.user.verificationStatus !== 'approved') {
    return res.status(403).json({ message: 'Your business must be verified to access this feature' })
  }
  next()
}
