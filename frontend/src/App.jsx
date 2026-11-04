import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoadingScreen from './components/common/LoadingScreen'

// Public pages
const HomePage        = lazy(() => import('./pages/HomePage'))
const BuyersPage      = lazy(() => import('./pages/BuyersPage'))
const SellersPage     = lazy(() => import('./pages/SellersPage'))
const LoginPage       = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage    = lazy(() => import('./pages/auth/RegisterPage'))
const VerifyPage      = lazy(() => import('./pages/auth/VerifyPage'))
const ForgotPassword  = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const MaterialDetail  = lazy(() => import('./pages/MaterialDetailPage'))

// Buyer pages
const BuyerDashboard  = lazy(() => import('./pages/buyer/BuyerDashboard'))

// Seller pages
const SellerDashboard = lazy(() => import('./pages/seller/SellerDashboard'))

// Admin pages
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'))

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                fontSize: '0.9rem',
              },
              success: { iconTheme: { primary: '#1B6B3A', secondary: 'white' } },
              error:   { iconTheme: { primary: '#EF4444', secondary: 'white' } },
            }}
          />
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Public */}
              <Route path="/"         element={<HomePage />} />
              <Route path="/buyers"   element={<BuyersPage />} />
              <Route path="/sellers"  element={<SellersPage />} />
              <Route path="/auth/login"           element={<LoginPage />} />
              <Route path="/auth/register"        element={<RegisterPage />} />
              <Route path="/auth/verify"          element={<VerifyPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/materials/:id"        element={<MaterialDetail />} />

              {/* Buyer (protected) */}
              <Route path="/buyer/*" element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <BuyerDashboard />
                </ProtectedRoute>
              } />

              {/* Seller (protected) */}
              <Route path="/seller/*" element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerDashboard />
                </ProtectedRoute>
              } />

              {/* Admin (protected) */}
              <Route path="/admin/*" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
