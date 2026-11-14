# ScrapBazaar — B2B Industrial Scrap Marketplace

A complete, production-ready B2B scrap marketplace connecting verified industrial scrap sellers with verified buyers through transparent, real-time competitive bidding.

---

## Administrator Account Setup

The first administrator account must be created from the server side using a CLI script.
There is **no public registration endpoint** for admin accounts.

### Prerequisites

Configure these variables in `backend/.env`:

| Variable | Description |
|----------|-------------|
| `ADMIN_EMAIL` | The email address for the admin account |
| `ADMIN_PASSWORD` | A strong password (minimum 8 characters) |
| `ADMIN_NAME` | Display name for the admin (optional, defaults to "ScrapBazaar Admin") |
| `MONGODB_URI` | MongoDB connection string (local or Atlas) |

### Create the First Admin

From the `backend` directory:

```bash
# Uses ADMIN_EMAIL and ADMIN_PASSWORD from .env
node scripts/create-admin.js

# Override email and password via CLI
node scripts/create-admin.js --email=you@email.com --password=YourStrongPass123!
```

The script will:
- Check if an admin already exists (refuses to create duplicates)
- Check if the email belongs to a buyer/seller (refuses to overwrite)
- Hash the password with bcrypt (12 rounds) — never stored in plain text
- Create the account with role `admin` and `verificationStatus: approved`

### Promote an Existing User to Admin

If you need to grant admin access to someone who already has a buyer/seller account:

```bash
node scripts/promote-admin.js --email=existing@email.com
```

This is irreversible — the user's role changes from buyer/seller to admin.

### Log In After Creation

1. Open the frontend in your browser
2. Go to the Login page
3. Select **Administrator** role
4. Enter the admin email and password
5. You will be redirected to the Admin Dashboard

### Duplicate Admin Prevention

The script checks for existing admin accounts before creating a new one. If an admin already exists, it will display the existing admin's email and exit without making changes.

---

## Project Structure

```
sales scrap2/
├── frontend/    # React + Vite frontend
└── backend/     # Node.js + Express API
```

---

## Quick Start

### 1. Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)
- Razorpay account (for payments — test mode works without a live account)

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev
```

The backend will start on `http://localhost:5000`.

On first run, an admin account is seeded automatically using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

The frontend will start on `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry (default: 7d) |
| `FRONTEND_URL` | Frontend URL for CORS |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `EMAIL_HOST` | SMTP host for email |
| `EMAIL_USER` | Email address |
| `EMAIL_PASS` | Email password / app password |
| `ADMIN_EMAIL` | Initial admin email |
| `ADMIN_PASSWORD` | Initial admin password |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key |

---

## Features

### Public Pages
- **Homepage** — Hero, stats, how it works, categories, FAQs, CTA
- **Buyers Page** — Buyer information, how bidding works, notifications
- **Sellers Page** — Seller information, listing wizard preview, auction rules

### Authentication
- Role-based login: Buyer, Seller, Administrator
- Registration with business details
- Business verification workflow (documents submitted, admin reviews)
- Forgot password

### Buyer Dashboard
- Overview with real stats and charts
- Explore materials with search, filters and sorting
- Live auctions (ending soonest)
- My bids history
- Won auctions
- Transactions
- Notifications
- Analytics
- Business profile

### Seller Dashboard
- Overview with real stats and charts
- My Materials (grid + table view)
- Add Material — 4-step guided wizard
- Live bids monitoring
- Sold materials
- Transactions
- Notifications
- Analytics
- Business profile

### Admin Dashboard
- Platform overview stats
- Business verification review (approve/reject with reason)
- User management
- Listing management
- Auction monitoring
- Transaction tracking

### Core Logic
- Server-side bid validation
- Minimum bid increment enforcement
- Anonymous bidder labels during live auctions
- Automatic auction closure via cron job (runs every minute)
- Winner determination on backend
- Transaction creation on auction close
- Notifications for all key events
- `minAcceptablePrice` is never exposed in any public API response

---

## Deployment

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build
# Deploy the dist/ folder
# Set VITE_API_URL to your backend production URL
```

### Backend (Railway / Render / DigitalOcean)
```bash
cd backend
npm start
# Set all production environment variables
# Use MongoDB Atlas for the database
# Use Cloudinary for image storage
```

### CORS
Set `FRONTEND_URL` in backend `.env` to your deployed frontend URL.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Custom CSS with CSS variables (light/dark) |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT + bcryptjs |
| Images | Cloudinary |
| Payments | Razorpay (test mode ready) |
| Scheduling | node-cron |

---

## Security Notes

- All API routes use JWT authentication
- Seller minimum acceptable price (`minAcceptablePrice`) is never returned in any public API response
- Business documents uploaded with restricted access (Cloudinary authenticated mode)
- Rate limiting on all API routes and stricter limits on auth routes
- Helmet.js for HTTP security headers
- Passwords hashed with bcryptjs (12 rounds)
- Role-based authorization middleware on all protected routes
