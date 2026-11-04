const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

// ─── Local disk storage (always available, used as fallback) ─────────────────
const localDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')
    cb(null, `${Date.now()}-${safe}`)
  },
})

// ─── Cloudinary storage (only if credentials are set) ────────────────────────
let cloudinaryConfigured = false
let cloudinaryStorage    = null
let cloudinaryInstance   = null

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env

if (
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  CLOUDINARY_API_KEY    && CLOUDINARY_API_KEY    !== 'your_api_key' &&
  CLOUDINARY_API_SECRET && CLOUDINARY_API_SECRET !== 'your_api_secret'
) {
  try {
    const cloudinary = require('cloudinary').v2
    const { CloudinaryStorage } = require('multer-storage-cloudinary')
    cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET })

    cloudinaryStorage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'scrapbazaar/materials',
        allowed_formats: ['jpg','jpeg','png','webp'],
        transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
      },
    })

    cloudinaryConfigured = true
    cloudinaryInstance   = cloudinary
    console.log('✅ Cloudinary configured')
  } catch (e) {
    console.log('⚠️  Cloudinary setup failed, using local storage:', e.message)
  }
} else {
  console.log('ℹ️  Cloudinary not configured — using local file storage for uploads')
}

// ─── Exported middleware ──────────────────────────────────────────────────────

exports.uploadMaterialImages = multer({
  storage: cloudinaryConfigured ? cloudinaryStorage : localDiskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype)
    if (ok) cb(null, true)
    else    cb(new Error('Only image files are allowed'))
  },
}).array('images', 6)

exports.uploadDocument = multer({
  storage: localDiskStorage,   // documents always stored locally
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/
    const ok = allowed.test(path.extname(file.originalname).toLowerCase())
    if (ok) cb(null, true)
    else    cb(new Error('Only images and PDFs are allowed'))
  },
}).single('document')

// Helper: extract the public URL from an uploaded file object
exports.getFileUrl = (file) => {
  if (!file) return null
  return file.secure_url || file.path || `/uploads/${file.filename}`
}

exports.cloudinary        = cloudinaryInstance
exports.cloudinaryConfigured = cloudinaryConfigured
