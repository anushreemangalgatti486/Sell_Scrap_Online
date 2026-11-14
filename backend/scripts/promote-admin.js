/**
 * promote-admin.js — Promote an existing buyer/seller account to admin.
 *
 * Usage:
 *   node scripts/promote-admin.js --email=user@email.com
 *
 * This is an irreversible, high-privilege action.
 * Only run this if you explicitly intend to grant admin access to an existing user.
 * The script will:
 *   1. Connect to the database
 *   2. Find the user by email
 *   3. Verify they are NOT already an admin
 *   4. Change their role to 'admin' and set verificationStatus to 'approved'
 *   5. Print a clear audit message
 */

require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('../models/User')

function parseArgs() {
  const args = {}
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--email=')) args.email = arg.split('=')[1]
  })
  return args
}

async function promoteAdmin() {
  const cliArgs = parseArgs()
  const email = (cliArgs.email || '').trim().toLowerCase()

  console.log('\n' + '='.repeat(60))
  console.log('  ScrapBazaar — Promote User to Admin')
  console.log('='.repeat(60) + '\n')

  if (!email) {
    console.error('❌ No email specified.')
    console.error('   Usage: node scripts/promote-admin.js --email=user@email.com')
    process.exit(1)
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scrapbazaar'
  console.log('📊 Connecting to database...')

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    console.log('✅ Database connected\n')
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message)
    process.exit(1)
  }

  try {
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      console.error(`❌ No account found with email: ${email}`)
      process.exit(1)
    }

    if (user.role === 'admin') {
      console.log(`ℹ️  User "${email}" is already an admin. No changes made.`)
      process.exit(0)
    }

    console.log(`⚠️  PROMOTION WARNING`)
    console.log(`   Email:      ${user.email}`)
    console.log(`   Current role: ${user.role}`)
    console.log(`   Name:        ${user.name}`)
    console.log(`   User ID:     ${user._id}`)
    console.log(`\n   This will grant FULL ADMIN ACCESS to this account.\n`)

    // In CLI mode, confirm interactively
    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout })
    const answer = await new Promise(resolve => {
      readline.question('Type "PROMOTE" to confirm: ', resolve)
    })
    readline.close()

    if (answer.trim() !== 'PROMOTE') {
      console.log('\n❌ Promotion cancelled. No changes made.')
      process.exit(0)
    }

    user.role = 'admin'
    user.verificationStatus = 'approved'
    await user.save()

    console.log('\n✅ User promoted to admin successfully!')
    console.log(`   Email: ${user.email}`)
    console.log(`   Role:  ${user.role}`)
    console.log('\n📌 This user can now log in as "Administrator" on the login page.\n')

  } catch (err) {
    console.error('\n❌ Failed to promote user:', err.message)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    process.exit(0)
  }
}

promoteAdmin()
