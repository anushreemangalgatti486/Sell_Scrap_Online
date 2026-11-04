const User = require('../models/User')

exports.seedAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'admin' })
    if (existing) return

    const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@scrapbazaar.in'
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456'
    const adminName     = process.env.ADMIN_NAME     || 'ScrapBazaar Admin'

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
