const jwt = require('jsonwebtoken')

exports.signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

exports.sendTokenResponse = (user, statusCode, res) => {
  const token = exports.signToken(user._id, user.role)
  const userObj = user.toPublic ? user.toPublic() : user.toObject()
  res.status(statusCode).json({ token, user: userObj })
}
