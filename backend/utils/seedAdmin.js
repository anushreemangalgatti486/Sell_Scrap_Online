const User = require('../models/User')

exports.seedAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'admin' })
    if (existing) return

    const adminEmail    = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD
    const adminName     = process.env.ADMIN_NAME || 'ScrapBazaar Admin'

    if (!adminEmail || !adminPassword) {
      console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed')
      return
    }

    // In production, refuse to seed with the default example credentials
    if (process.env.NODE_ENV === 'production') {
      const weakPasswords = ['Admin@123456', 'admin123', 'password', 'admin']
      if (weakPasswords.includes(adminPassword)) {
        console.error('❌ FATAL: Default admin password detected in production. Set a strong ADMIN_PASSWORD.')
        process.exit(1)
      }
    }

    await User.create({
      name:               adminName,
      email:              adminEmail,
      password:           adminPassword,
      role:               'admin',
      verificationStatus: 'approved',
    })
    console.log(`✅ Admin account created: ${adminEmail}`)
  } catch (err) {
    console.error('Admin seed error:', err.message)
  }
}
