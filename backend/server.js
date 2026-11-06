require('dotenv').config()
const http      = require('http')
const express   = require('express')
const cors      = require('cors')
const helmet    = require('helmet')
const rateLimit = require('express-rate-limit')
const mongoose  = require('mongoose')
const path      = require('path')
const cron      = require('node-cron')
const { initSocket }       = require('./utils/socket')
const { validateJwtSecret } = require('./utils/jwt')

const authRoutes         = require('./routes/auth')
const materialRoutes     = require('./routes/materials')
const bidRoutes          = require('./routes/bids')
const auctionRoutes      = require('./routes/auctions')
const transactionRoutes  = require('./routes/transactions')
const paymentRoutes      = require('./routes/payments')
const notificationRoutes = require('./routes/notifications')
const businessRoutes     = require('./routes/business')
const adminRoutes        = require('./routes/admin')
const buyerRoutes        = require('./routes/buyer')
const sellerRoutes       = require('./routes/seller')

const { closeExpiredAuctions } = require('./utils/auctionJobs')
const { seedAdmin }            = require('./utils/seedAdmin')

const app        = express()
const httpServer = http.createServer(app)
const PORT       = process.env.PORT || 5002

// Validate JWT secret before anything else starts
validateJwtSecret()

// Initialise Socket.io (with auth — see utils/socket.js)
initSocket(httpServer)

/* ─── CORS allowlist ─── */
const buildAllowedOrigins = () => {
  const origins = new Set()

  // Always allow the configured frontend URL
  const frontendUrl = process.env.FRONTEND_URL
  if (frontendUrl) {
    frontendUrl.split(',').map(o => o.trim()).filter(Boolean).forEach(o => origins.add(o))
  }

  // Any additional origins from EXTRA_ORIGINS (comma-separated)
  const extra = process.env.EXTRA_ORIGINS
  if (extra) {
    extra.split(',').map(o => o.trim()).filter(Boolean).forEach(o => origins.add(o))
  }

  // In development always allow localhost variants
  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:5173')
    origins.add('http://localhost:5174')
    origins.add('http://localhost:5175')
    origins.add('http://localhost:3000')
  }

  return [...origins]
}

const allowedOrigins = buildAllowedOrigins()

/* ─── Middleware ─── */
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman in dev)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin '${origin}' is not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Global rate limit — 300 requests per 15 minutes per IP
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }))

// Stricter rate limit on auth routes
// Dev: 100 req / 15 min  |  Production: 20 req / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 100,
  message: { message: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

/* ─── Routes ─── */
app.use('/api/auth',          authLimiter, authRoutes)
app.use('/api/materials',     materialRoutes)
app.use('/api/bids',          bidRoutes)
app.use('/api/auctions',      auctionRoutes)
app.use('/api/transactions',  transactionRoutes)
app.use('/api/payments',      paymentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/business',      businessRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/buyer',         buyerRoutes)
app.use('/api/seller',        sellerRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  })
})

app.use((req, res) => res.status(404).json({ message: 'Route not found' }))
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

/* ─── Database connection ─── */
async function connectDB() {
  const uri = process.env.MONGODB_URI || ''

  if (!uri || uri === 'mongodb://localhost:27017/scrapbazaar') {
    // Check if local MongoDB is running
    try {
      await mongoose.connect('mongodb://localhost:27017/scrapbazaar', {
        serverSelectionTimeoutMS: 2000,
      })
      console.log('✅ Connected to local MongoDB')
      return true
    } catch {
      console.log('\n' + '='.repeat(60))
      console.log('  ❌  NO DATABASE CONNECTED')
      console.log('='.repeat(60))
      console.log('\n  MongoDB is not running locally.')
      console.log('\n  QUICK FIX — Use MongoDB Atlas (free, takes 2 min):')
      console.log('\n  1. Go to https://www.mongodb.com/atlas/database')
      console.log('  2. Sign up free → Create a free M0 cluster')
      console.log('  3. Click "Connect" → "Drivers" → copy the URI')
      console.log('  4. Edit backend/.env and set:')
      console.log('     MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/scrapbazaar')
      console.log('  5. Restart the backend')
      console.log('\n  OR install MongoDB locally:')
      console.log('  https://www.mongodb.com/try/download/community')
      console.log('\n' + '='.repeat(60) + '\n')
      return false
    }
  }

  // Atlas or custom URI provided
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
    console.log('✅ MongoDB Atlas connected')
    return true
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    return false
  }
}

async function main() {
  const dbOk = await connectDB()

  if (dbOk) {
    await seedAdmin()
    cron.schedule('* * * * *', async () => {
      try { await closeExpiredAuctions() }
      catch (e) { console.error('Cron error:', e.message) }
    })
    console.log(`\n✅ Database ready`)
    console.log(`   Admin → ${process.env.ADMIN_EMAIL || 'admin@scrapbazaar.in'} / ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`)
  }

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 ScrapBazaar API  →  http://localhost:${PORT}`)
    console.log(`   DB: ${dbOk ? 'Connected ✅' : 'NOT connected ❌  — registration/login will fail'}`)
    console.log(`   Health: http://localhost:${PORT}/api/health\n`)
  })
}

main().catch(console.error)
