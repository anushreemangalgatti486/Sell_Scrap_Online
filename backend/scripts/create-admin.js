/**
 * create-admin.js — Standalone CLI script to create or manage the first admin account.
 *
 * Usage:
 *   node scripts/create-admin.js                          # reads from .env (ADMIN_EMAIL / ADMIN_PASSWORD)
 *   node scripts/create-admin.js --email=you@email.com   # override email
 *   node scripts/create-admin.js --password=YourPass123!  # override password
 *   node scripts/create-admin.js --email=you@email.com --password=YourPass123!
 *
 * The script:
 *   1. Connects to the database (uses MONGODB_URI from .env or local default)
 *   2. Checks if any admin account already exists
 *   3. If the specified email belongs to a buyer/seller, warns and exits (no overwrite)
 *   4. If no conflict, creates a new admin with bcrypt-hashed password
 *   5. Prints clear status messages and exits
 *
 * Security:
 *   - Password is hashed via the User model pre-save hook (bcrypt, 12 rounds)
 *   - Never stores or prints the plain-text password
 *   - No unauthenticated API endpoint is exposed
 *   - Must be run from the server with database access
 *
 * Run from the backend directory:
 *   node scripts/create-admin.js
 */

require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('../models/User')

// ── Parse command-line arguments ──
function parseArgs() {
  const args = {}
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--email='))    args.email    = arg.split('=')[1]
    if (arg.startsWith('--password=')) args.password = arg.split('=')[1]
  })
  return args
}

// ── Validate email format ──
function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

async function createAdmin() {
  const cliArgs = parseArgs()

  // Resolve email and password from CLI args or env vars
  const email    = (cliArgs.email    || process.env.ADMIN_EMAIL    || '').trim().toLowerCase()
  const password = cliArgs.password || process.env.ADMIN_PASSWORD || ''
  const name     = process.env.ADMIN_NAME || 'ScrapBazaar Admin'

  console.log('\n' + '='.repeat(60))
  console.log('  ScrapBazaar — Admin Account Setup')
  console.log('='.repeat(60) + '\n')

  // Validate inputs
  if (!email) {
    console.error('❌ No email specified.')
    console.error('   Set ADMIN_EMAIL in backend/.env OR pass --email=you@email.com')
    process.exit(1)
  }

  if (!password) {
    console.error('❌ No password specified.')
    console.error('   Set ADMIN_PASSWORD in backend/.env OR pass --password=YourPass123!')
    process.exit(1)
  }

  if (!isValidEmail(email)) {
    console.error(`❌ Invalid email format: "${email}"`)
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters.')
    process.exit(1)
  }

  // Connect to database
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scrapbazaar'
  console.log(`📊 Connecting to database...`)

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    console.log('✅ Database connected\n')
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message)
    console.error('   Check MONGODB_URI in backend/.env or ensure MongoDB is running.')
    process.exit(1)
  }

  try {
    // ── Step 1: Check if any admin already exists ──
    const existingAdmin = await User.findOne({ role: 'admin' }).lean()

    if (existingAdmin) {
      console.log(`ℹ️  An admin account already exists: ${existingAdmin.email}`)
      console.log(`    Account ID: ${existingAdmin._id}`)
      console.log(`    Active: ${existingAdmin.isActive ? 'Yes' : 'No'}\n`)

      if (existingAdmin.email === email) {
        console.log('✅ The existing admin uses the same email you specified.')
        console.log('   To reset the password, use the forgot-password flow:')
        console.log('   1. Go to the login page → "Forgot password?"')
        console.log('   2. Enter ' + email)
        console.log('   3. Check the backend console for the reset link (dev mode)\n')
        console.log('   Or update ADMIN_PASSWORD in .env and run this script with --force:')
        console.log('   node scripts/create-admin.js --email=' + email + ' --password=NewPass123! --force\n')
        process.exit(0)
      }

      console.log('⚠️  A DIFFERENT admin account already exists.')
      console.log('   This script will NOT create a second admin account.\n')

      // Check if the requested email belongs to an existing buyer/seller
      const existingUser = await User.findOne({ email }).lean()
      if (existingUser) {
        console.log(`   The email "${email}" is registered as a ${existingUser.role}.`)
        console.log('   To PROMOTE this account to admin, use the explicit promotion script:')
        console.log('   node scripts/promote-admin.js --email=' + email + '\n')
      } else {
        console.log(`   The email "${email}" is not yet registered.`)
        console.log('   To create a new admin with this email, first remove the existing admin:')
        console.log('   (Use MongoDB Compass or mongo shell to delete or demote the current admin)\n')
      }

      process.exit(0)
    }

    // ── Step 2: Check if the email is already used by a buyer/seller ──
    const existingUser = await User.findOne({ email }).lean()

    if (existingUser) {
      console.log(`⚠️  CONFLICT: The email "${email}" is already registered as a ${existingUser.role}.`)
      console.log('   This script will NOT overwrite or change the role of an existing account.\n')
      console.log('   Options:')
      console.log('   1. Use a different email address for the admin account.')
      console.log('   2. To PROMOTE this existing account to admin, use the promotion script:')
      console.log('      node scripts/promote-admin.js --email=' + email)
      console.log('      (This is an irreversible action and should only be done by authorised personnel.)\n')
      process.exit(1)
    }

    // ── Step 3: Create the admin account ──
    console.log(`🔧 Creating admin account...`)
    console.log(`   Email: ${email}`)
    console.log(`   Name:  ${name}\n`)

    const admin = await User.create({
      name,
      email,
      password, // pre-save hook will hash this with bcrypt (12 rounds)
      role: 'admin',
      verificationStatus: 'approved',
      isActive: true,
    })

    console.log('✅ Admin account created successfully!\n')
    console.log('─'.repeat(60))
    console.log('  Account Details:')
    console.log('─'.repeat(60))
    console.log(`  Email:      ${admin.email}`)
    console.log(`  Role:       ${admin.role}`)
    console.log(`  ID:         ${admin._id}`)
    console.log(`  Active:     ${admin.isActive}`)
    console.log(`  Verified:   ${admin.verificationStatus}`)
    console.log('─'.repeat(60))
    console.log('\n📌 Login Instructions:')
    console.log('   1. Open the frontend in your browser')
    console.log('   2. Go to the Login page')
    console.log('   3. Select "Administrator" role')
    console.log(`   4. Enter email: ${email}`)
    console.log('   5. Enter the password you configured in .env or passed via CLI')
    console.log('\n⚠️  IMPORTANT: Do NOT share these credentials. Change the password regularly.\n')

  } catch (err) {
    console.error('\n❌ Failed to create admin:', err.message)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    process.exit(0)
  }
}

createAdmin()
