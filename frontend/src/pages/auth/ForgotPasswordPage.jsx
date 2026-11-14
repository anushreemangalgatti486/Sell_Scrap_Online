import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import './AuthPages.css'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.forgot(email)
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page auth-centered">
      <div className="auth-card" style={{ maxWidth: 440, width: '100%' }}>
        <Link to="/auth/login" className="auth-back-link" style={{ marginBottom: 24, display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Back to Login
        </Link>
        <div className="logo-mark" style={{ width: 52, height: 52, fontSize: '1rem', marginBottom: 20 }}>SB</div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--brand-primary)', margin: '0 auto 16px' }} />
            <h2 style={{ marginBottom: 8 }}>Check Your Email</h2>
            <p style={{ marginBottom: 24 }}>We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.</p>
            <Link to="/auth/login" className="btn btn-primary w-full">Back to Login</Link>
          </div>
        ) : (
          <>
            <h2 className="auth-title">Forgot Password</h2>
            <p className="auth-subtitle">Enter your registered email address and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <Mail size={16} className="input-icon-static" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                {loading ? <><div className="spinner" /> Sending...</> : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
