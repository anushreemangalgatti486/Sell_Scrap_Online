import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, ShieldCheck, Users, Truck, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import './AuthPages.css'

const ROLES = [
  { id: 'buyer',  label: 'Buyer',         icon: <Users size={20} />,       color: 'buyer-role-btn' },
  { id: 'seller', label: 'Seller',        icon: <Truck size={20} />,       color: 'seller-role-btn' },
  { id: 'admin',  label: 'Administrator', icon: <ShieldCheck size={20} />, color: 'admin-role-btn' },
]

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  const [role,     setRole]     = useState(searchParams.get('role') || 'buyer')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const user = await login(email, password, role)
      toast.success(`Welcome back, ${user.name?.split(' ')[0]}!`)
      if (user.role === 'buyer')  navigate('/buyer/overview')
      else if (user.role === 'seller') navigate('/seller/overview')
      else if (user.role === 'admin')  navigate('/admin/overview')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <Link to="/" className="auth-back-link"><ArrowLeft size={16} /> Back to Home</Link>
        <div className="auth-brand">
          <div className="logo-mark" style={{ width: 52, height: 52, fontSize: '1rem' }}>SB</div>
          <div>
            <div className="logo-name">ScrapBazaar</div>
            <div className="logo-tagline">B2B Scrap Marketplace</div>
          </div>
        </div>
        <div className="auth-hero-text">
          <h2>Welcome back to India's verified B2B scrap marketplace.</h2>
          <p>Log in to access your dashboard, manage listings, place bids and track your transactions.</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature"><ShieldCheck size={16} /> Verified business network</div>
          <div className="auth-feature"><Users       size={16} /> 500+ active businesses</div>
          <div className="auth-feature"><Truck       size={16} /> Pan-India coverage</div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">Choose your role and sign in to your account.</p>

          {/* Role selector */}
          <div className="role-selector">
            {ROLES.map(r => (
              <button
                key={r.id}
                type="button"
                className={`role-btn ${r.color} ${role === r.id ? 'active' : ''}`}
                onClick={() => setRole(r.id)}
              >
                {r.icon}
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Password
                <Link to="/auth/forgot-password" className="auth-link">Forgot password?</Link>
              </label>
              <div className="input-with-icon">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPwd(s => !s)}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <><div className="spinner" /> Signing in...</> : `Sign In as ${ROLES.find(r => r.id === role)?.label}`}
            </button>
          </form>

          {role !== 'admin' && (
            <p className="auth-switch">
              Don't have an account?{' '}
              <Link to={`/auth/register?role=${role}`} className="auth-link">
                Register as {role === 'buyer' ? 'Buyer' : 'Seller'}
              </Link>
            </p>
          )}

          <div className="auth-divider"><span>Secure login — ScrapBazaar</span></div>
        </div>
      </div>
    </div>
  )
}
