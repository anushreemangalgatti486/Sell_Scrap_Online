# ScrapBazaar — Production Deployment Guide

## Architecture Overview

```
Frontend  →  React + Vite  →  Vercel / Netlify (static)
Backend   →  Node.js + Express  →  Railway / Render / DigitalOcean
Database  →  MongoDB Atlas (M0 free or M10+ for production)
Storage   →  Cloudinary (images and documents)
Email     →  Gmail SMTP with App Password (or SendGrid for scale)
```

---

## Step 1: MongoDB Atlas

1. Go to https://cloud.mongodb.com and sign up
2. Create a free M0 cluster (or M10 for production)
3. Create a database user with a strong password
4. Whitelist `0.0.0.0/0` for Railway/Render (or specific IPs for DigitalOcean)
5. Click **Connect → Drivers** and copy the URI:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/scrapbazaar
   ```
6. Set `MONGODB_URI` in your backend environment variables

---

## Step 2: Cloudinary

1. Go to https://cloudinary.com and sign up for free
2. From the Dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret
3. Set these in backend environment variables

---

## Step 3: Email (Gmail SMTP)

1. Enable 2-Factor Authentication on your Gmail account
2. Go to **Google Account → Security → App Passwords**
3. Create an app password for "Mail" on "Other device"
4. Set backend environment variables:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your@gmail.com
   EMAIL_PASS=your_16_char_app_password
   EMAIL_FROM=ScrapBazaar <noreply@yourdomain.com>
   ```

**For production scale:** Use SendGrid or AWS SES instead of Gmail.

---

## Step 4: Razorpay (Payment Gateway)

> **Payment model chosen:** See PAYMENT_MODEL.md
> Before going live, complete Razorpay KYC at https://dashboard.razorpay.com

1. Sign up at https://dashboard.razorpay.com
2. For testing, use Test Mode keys (no real money)
3. For production, complete KYC and use Live Mode keys
4. Set backend environment variables:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```
5. Set frontend environment variable:
   ```
   VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx  (public key only — never the secret)
   ```

---

## Step 5: Backend Deployment (Railway)

1. Push code to GitHub (already done)
2. Go to https://railway.app and sign in with GitHub
3. Click **New Project → Deploy from GitHub repo**
4. Select the repository, set root directory to `backend/`
5. Railway auto-detects Node.js — it will run `npm start`
6. Set all environment variables in the Railway dashboard:

```
NODE_ENV=production
PORT=5002
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<64-random-hex-chars>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=ScrapBazaar <noreply@scrapbazaar.in>
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password-min-16-chars>
ADMIN_NAME=ScrapBazaar Admin
```

7. Note your Railway deployment URL (e.g., `https://scrapbazaar.railway.app`)

---

## Step 6: Frontend Deployment (Vercel)

1. Go to https://vercel.com and sign in with GitHub
2. Click **New Project → Import Git Repository**
3. Select the repository, set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Set environment variables in Vercel dashboard:

```
VITE_API_URL=https://your-backend.railway.app/api
VITE_CLOUDINARY_CLOUD_NAME=xxx
VITE_RAZORPAY_KEY_ID=rzp_live_xxx
```

5. Deploy → note your Vercel URL (e.g., `https://scrapbazaar.vercel.app`)

---

## Step 7: Update CORS and Frontend URL

After getting your Vercel URL, update the backend environment variable:
```
FRONTEND_URL=https://scrapbazaar.vercel.app
```

And redeploy the backend (Railway auto-redeploys on env var change).

---

## Step 8: Verify Production Deployment

Check these endpoints:

```
GET  https://your-backend.railway.app/api/health
→ { "status": "ok", "db": "connected" }

GET  https://scrapbazaar.vercel.app/
→ Home page loads

POST https://your-backend.railway.app/api/auth/login
→ Admin login works with your configured ADMIN_EMAIL/PASSWORD
```

---

## Required Environment Variables Summary

### Backend (all required in production)

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Set to `production` | ✅ |
| `PORT` | Server port (Railway sets automatically) | ✅ |
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ |
| `JWT_SECRET` | Min 64 random hex chars | ✅ |
| `JWT_EXPIRES_IN` | Token expiry e.g. `7d` | ✅ |
| `FRONTEND_URL` | Your Vercel URL (for CORS) | ✅ |
| `EMAIL_HOST` | SMTP host | For password reset |
| `EMAIL_PORT` | SMTP port (587) | For password reset |
| `EMAIL_USER` | SMTP username | For password reset |
| `EMAIL_PASS` | SMTP password / app password | For password reset |
| `EMAIL_FROM` | From address | For password reset |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | For image uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key | For image uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | For image uploads |
| `RAZORPAY_KEY_ID` | Razorpay public key | For payments |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | For payments |
| `ADMIN_EMAIL` | Initial admin email | ✅ |
| `ADMIN_PASSWORD` | Initial admin password (strong) | ✅ |
| `ADMIN_NAME` | Admin display name | ✅ |

### Frontend (.env / Vercel env vars)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full backend URL + `/api` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Same as backend (for direct uploads) |
| `VITE_RAZORPAY_KEY_ID` | Public Razorpay key only (NOT secret) |

---

## Security Checklist Before Going Live

- [ ] JWT_SECRET is at least 64 random characters (never the default)
- [ ] ADMIN_PASSWORD is strong and changed from default
- [ ] NODE_ENV=production (enables strict rate limits: 20 auth req/15min)
- [ ] CORS only allows your Vercel domain, not `*`
- [ ] `.env` files are gitignored and never committed
- [ ] Razorpay secret key is ONLY in backend env vars, never frontend
- [ ] MongoDB Atlas: network access is restricted to your server IPs
- [ ] HTTPS is enforced (Vercel and Railway both provide this automatically)

---

## Local Development

```powershell
# From project root — starts both frontend and backend
npm run dev

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev
```

Backend: http://localhost:5002  
Frontend: http://localhost:5173 (or 5174/5175 if port is occupied)  
Admin login: Use credentials from `backend/.env` ADMIN_EMAIL / ADMIN_PASSWORD

---

## Database Indexes (auto-created by Mongoose)

All indexes are defined in the models and created automatically on first startup:
- `User`: email (unique), role
- `Material`: category+status, seller, text search (name/description/category)
- `Bid`: material+amount, bidder+createdAt
- `Transaction`: buyer+createdAt, seller+createdAt
- `Notification`: user+createdAt
