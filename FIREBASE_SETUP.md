# Firebase Real-time Cloud Firestore Integration Guide

This project is now equipped with **Google Cloud Firestore** for instant real-time synchronization (Admin Overview stats, account suspensions, bids, and auctions).

---

## 🚀 How to Set Up Your Firebase Project (Takes 2 Minutes)

### Step 1: Create a Free Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** (or **"Create a project"**).
3. Name your project (e.g., `scrapbazaar-realtime`).
4. (Optional) Disable or enable Google Analytics, then click **Create project**.

### Step 2: Create a Cloud Firestore Database
1. In your Firebase project dashboard, click **Firestore Database** in the left sidebar (under *Build*).
2. Click **Create database**.
3. Select your location (e.g. `asia-south1 (Mumbai)`).
4. For security rules, select **Start in test mode** for local development, then click **Enable**.

### Step 3: Register a Web App & Copy Frontend Keys
1. In Project Settings (gear icon in top left) -> **General** tab, scroll down to **Your apps**.
2. Click the **Web** icon (`</>`).
3. App nickname: `scrapbazaar-web`, click **Register app**.
4. You will see a `firebaseConfig` object with:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
5. Copy these values into [`frontend/.env`](file:///d:/sales%20scrap2/frontend/.env):
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789...
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef...
   ```

### Step 4 (Optional): Backend Service Account (For Server-to-Firestore Sync)
1. In Firebase Console -> **Project Settings** -> **Service accounts** tab.
2. Click **Generate new private key**.
3. Save the downloaded JSON file as `backend/config/serviceAccountKey.json`.

---

## ⚡ Real-Time Features Enabled by Firebase:

1. **Live Admin Overview**:
   - `useRealtimeStats` listens to `platform/stats` via Firestore `onSnapshot()`.
   - When users register or get suspended, the Overview stats automatically update without page refresh.

2. **Instant User Suspension Kickout**:
   - `AuthContext` listens to `users/{userId}` via Firestore `onSnapshot()`.
   - When an admin clicks "Suspend", the active session of that buyer/seller immediately closes with an alert.

3. **Live Bidding & Auction Closure**:
   - `useRealtimeAuction` streams new bids and closed states directly from Firestore `auctions/{materialId}`.

4. **Continue with Google Sign-In (`POST /api/auth/google`)**:
   - Enables 1-click Google login & buyer/seller signup via Firebase Authentication.
   - Make sure **Google** is enabled in Firebase Console:
     1. Open **Authentication** → **Sign-in method** → **Add new provider** → **Google** → **Enable** → **Save**.
     2. Under **Authentication** → **Settings** → **Authorized domains**, confirm `localhost` is listed (it is included by default).
