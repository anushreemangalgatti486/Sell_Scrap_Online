import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from './LoadingScreen'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === 'buyer')  return <Navigate to="/buyer/overview" replace />
    if (user.role === 'seller') return <Navigate to="/seller/overview" replace />
    if (user.role === 'admin')  return <Navigate to="/admin/overview" replace />
    return <Navigate to="/" replace />
  }

  // Check verification for buyers and sellers
  if (user.role !== 'admin' && user.verificationStatus === 'pending') {
    if (!location.pathname.includes('/auth/verify')) {
      return <Navigate to="/auth/verify" replace />
    }
  }

  return children
}
