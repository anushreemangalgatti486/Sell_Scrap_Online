import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, Users, Truck, ArrowLeft, CheckCircle2 } from 'lucide-react'
import GoogleAuthButton from '../../components/common/GoogleAuthButton'
import toast from 'react-hot-toast'
import './AuthPages.css'

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { register } = useAuth()

  const [role,    setRole]    = useState(searchParams.get('role') || 'buyer')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form,    setForm]    = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    businessName: '', businessType: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const user = await register({ ...form, role })
      toast.success('Account created! Please complete your business verification.')
      navigate('/auth/verify')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.')
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
          <h2>Join India's fastest-growing B2B scrap trading network.</h2>
          <p>Register your business today and start trading with hundreds of verified buyers and sellers.</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature"><CheckCircle2 size={16} /> Free registration</div>
          <div className="auth-feature"><CheckCircle2 size={16} /> Verified in 24–48 hours</div>
          <div className="auth-feature"><CheckCircle2 size={16} /> No hidden fees</div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Register your business to get started.</p>

          {/* Role selector */}
          <div className="role-selector">
            <button type="button" className={`role-btn buyer-role-btn ${role === 'buyer' ? 'active' : ''}`} onClick={() => setRole('buyer')}>
              <Users size={20} /> <span>Register as Buyer</span>
            </button>
            <button type="button" className={`role-btn seller-role-btn ${role === 'seller' ? 'active' : ''}`} onClick={() => setRole('seller')}>
              <Truck size={20} /> <span>Register as Seller</span>
            </button>
          </div>

          <GoogleAuthButton role={role} disabled={loading} />
          <div className="auth-divider" style={{ marginBottom: 16 }}><span>or register with email</span></div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Your full name" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required autoComplete="email" />
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input className="form-input" placeholder="Your company name" value={form.businessName} onChange={set('businessName')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Business Type</label>
                <select className="form-input" value={form.businessType} onChange={set('businessType')} required>
                  <option value="">Select type</option>
                  <option value="proprietorship">Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="private_limited">Private Limited</option>
                  <option value="public_limited">Public Limited</option>
                  <option value="llp">LLP</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPwd(s => !s)}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={set('confirmPassword')} required autoComplete="new-password" />
            </div>

            <p className="form-hint">
              By registering you agree to our <a href="#" className="auth-link">Terms of Service</a> and <a href="#" className="auth-link">Privacy Policy</a>.
            </p>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <><div className="spinner" /> Creating account...</> : `Create ${role === 'buyer' ? 'Buyer' : 'Seller'} Account`}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to={`/auth/login?role=${role}`} className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
