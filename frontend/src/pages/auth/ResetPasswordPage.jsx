import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import './AuthPages.css'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { updateUser } = useAuth()

  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [done,        setDone]        = useState(false)
  const [tokenError,  setTokenError]  = useState(false)

  useEffect(() => {
    if (!token || !email) setTokenError(true)
  }, [token, email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      const res = await authAPI.reset({ token, email, password })
      // Backend returns a new JWT — log the user in automatically
      if (res.data.token) {
        localStorage.setItem('sb_token', res.data.token)
        updateUser(res.data.user)
      }
      setDone(true)
      toast.success('Password updated successfully!')
      setTimeout(() => navigate(`/${res.data.user?.role || ''}/overview`), 2000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password.'
      toast.error(msg)
      if (msg.includes('invalid') || msg.includes('expired')) {
        setTokenError(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (tokenError) {
    return (
      <div className="auth-page auth-centered">
        <div className="auth-card" style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: '#EF4444', margin: '0 auto 16px' }} />
          <h2 style={{ marginBottom: 8 }}>Link Invalid or Expired</h2>
          <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>
            This password reset link is invalid or has expired. Reset links are only valid for 1 hour.
          </p>
          <Link to="/auth/forgot-password" className="btn btn-primary w-full">
            Request a New Link
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="auth-page auth-centered">
        <div className="auth-card" style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--brand-primary)', margin: '0 auto 16px' }} />
          <h2 style={{ marginBottom: 8 }}>Password Updated!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Redirecting you to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page auth-centered">
      <div className="auth-card" style={{ maxWidth: 440, width: '100%' }}>
        <Link to="/auth/login" className="auth-back-link" style={{ marginBottom: 24, display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Back to Login
        </Link>
        <div className="logo-mark" style={{ width: 52, height: 52, fontSize: '1rem', marginBottom: 20 }}>SB</div>

        <h2 className="auth-title">Set New Password</h2>
        <p className="auth-subtitle">Choose a strong password for <strong>{email}</strong></p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon-static" />
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={8}
                required
                style={{ paddingLeft: 40 }}
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon-static" />
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Repeat your new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                minLength={8}
                required
                style={{ paddingLeft: 40 }}
              />
            </div>
            {confirm && password !== confirm && (
              <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: 4 }}>Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading || password !== confirm}
          >
            {loading ? <><div className="spinner" /> Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
