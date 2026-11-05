const jwt = require('jsonwebtoken')

/**
 * Validate that JWT_SECRET is present and strong enough at startup.
 * Called once from server.js before any routes are registered.
 */
exports.validateJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error('❌ FATAL: JWT_SECRET environment variable is not set.')
    process.exit(1)
  }
  if (secret.length < 32) {
    console.error('❌ FATAL: JWT_SECRET is too short (minimum 32 characters).')
    process.exit(1)
  }
}

exports.signToken = (id, role) => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')

  return jwt.sign(
    { id, role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

exports.sendTokenResponse = (user, statusCode, res) => {
  const token = exports.signToken(user._id, user.role)
  const userObj = user.toPublic ? user.toPublic() : user.toObject()
  res.status(statusCode).json({ token, user: userObj })
}
