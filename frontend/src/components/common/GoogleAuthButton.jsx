import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
      />
    </svg>
  )
}

/**
 * Shared "Continue with Google" button for Login and Register pages.
 * Authenticates via Firebase Auth Google popup and exchanges the ID token
 * for a ScrapBazaar backend session JWT.
 */
export default function GoogleAuthButton({ role = 'buyer', disabled = false }) {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { user, isNewUser } = await loginWithGoogle(role)
      if (isNewUser) {
        toast.success('Account created with Google! Please complete your business verification.')
        navigate('/auth/verify')
      } else {
        toast.success(`Welcome back, ${user.name?.split(' ')[0] || 'User'}!`)
        if (user.role === 'buyer') navigate('/buyer/overview')
        else if (user.role === 'seller') navigate('/seller/overview')
        else if (user.role === 'admin') navigate('/admin/overview')
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Google sign-in failed. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      className="btn-google"
      onClick={handleGoogleSignIn}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <div className="spinner" />
          <span>Connecting to Google...</span>
        </>
      ) : (
        <>
          <GoogleIcon />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  )
}
