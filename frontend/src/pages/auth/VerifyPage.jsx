import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { businessAPI } from '../../services/api'
import { Upload, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import './AuthPages.css'

export default function VerifyPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [loading,  setLoading]  = useState(false)
  const [docFile,  setDocFile]  = useState(null)
  const [form,     setForm]     = useState({
    businessName: user?.businessName || '',
    businessType: user?.businessType || '',
    authorizedPerson: user?.name || '',
    gstin: '',
    businessRegNo: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // Already verified
  if (user?.verificationStatus === 'approved') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', padding: 24 }}>
        <div style={{ textAlign:'center', maxWidth: 440 }}>
          <CheckCircle2 size={64} style={{ color:'var(--brand-primary)', margin:'0 auto 16px' }} />
          <h2 style={{ marginBottom: 8 }}>Business Verified!</h2>
          <p style={{ marginBottom: 24 }}>Your business has been verified. You can now access all marketplace features.</p>
          <button className="btn btn-primary" onClick={() => navigate(`/${user.role}/overview`)}>
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Pending
  if (user?.verificationStatus === 'pending' && user?.verificationSubmitted) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', padding: 24 }}>
        <div style={{ textAlign:'center', maxWidth: 440 }}>
          <Clock size={64} style={{ color:'var(--amber-500)', margin:'0 auto 16px' }} />
          <h2 style={{ marginBottom: 8 }}>Verification Under Review</h2>
          <p style={{ marginBottom: 24 }}>Your documents have been submitted. Our team will review and approve your business within 24–48 hours. You will receive an email notification once approved.</p>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!docFile) { toast.error('Please upload a business document'); return }
    if (!form.gstin && !form.businessRegNo) { toast.error('Please provide GSTIN or a business registration number'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('document', docFile)
      await businessAPI.submitVerification(fd)
      updateUser({ verificationSubmitted: true })
      toast.success('Verification documents submitted successfully!')
      navigate('/auth/verify')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page verify-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="logo-mark" style={{ width: 52, height: 52, fontSize: '1rem' }}>SB</div>
          <div>
            <div className="logo-name">ScrapBazaar</div>
            <div className="logo-tagline">Business Verification</div>
          </div>
        </div>
        <div className="auth-hero-text">
          <h2>Complete your business verification to start trading.</h2>
          <p>We verify every buyer and seller on the platform to ensure a trusted, fraud-free marketplace.</p>
        </div>
        <div className="verify-steps">
          <div className="verify-step done"><CheckCircle2 size={16} /> Account created</div>
          <div className="verify-step active"><AlertCircle size={16} /> Submit business details</div>
          <div className="verify-step"><Clock size={16} /> Awaiting review (24–48h)</div>
          <div className="verify-step"><CheckCircle2 size={16} /> Access marketplace</div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
          GSTIN is not mandatory. Any valid business registration document is accepted.
        </p>
      </div>

      <div className="auth-right">
        <div className="auth-card" style={{ maxWidth: 600 }}>
          <h2 className="auth-title">Business Verification</h2>
          <p className="auth-subtitle">Fill in your business details and upload a supporting document.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input className="form-input" value={form.businessName} onChange={set('businessName')} required />
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
              <label className="form-label">Authorized Person's Name</label>
              <input className="form-input" value={form.authorizedPerson} onChange={set('authorizedPerson')} required />
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">GSTIN <span className="form-hint" style={{ display:'inline' }}>(optional)</span></label>
                <input className="form-input" placeholder="15-digit GSTIN" value={form.gstin} onChange={set('gstin')} maxLength={15} />
              </div>
              <div className="form-group">
                <label className="form-label">Business Reg. No. <span className="form-hint" style={{ display:'inline' }}>(if no GSTIN)</span></label>
                <input className="form-input" placeholder="Registration number" value={form.businessRegNo} onChange={set('businessRegNo')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Business Address</label>
              <input className="form-input" placeholder="Street / Area" value={form.address} onChange={set('address')} required />
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" value={form.city} onChange={set('city')} required />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" value={form.state} onChange={set('state')} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Business Document Upload</label>
              <div
                className={`file-drop-zone ${docFile ? 'has-file' : ''}`}
                onClick={() => document.getElementById('docInput').click()}
              >
                {docFile ? (
                  <div className="file-selected">
                    <CheckCircle2 size={20} style={{ color: 'var(--brand-primary)' }} />
                    <span>{docFile.name}</span>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <Upload size={24} />
                    <p>Click to upload GSTIN certificate, business registration or any valid document</p>
                    <span>PDF, JPG or PNG — Max 5MB</span>
                  </div>
                )}
                <input id="docInput" type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDocFile(e.target.files[0])} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <><div className="spinner" /> Submitting...</> : 'Submit for Verification'}
            </button>
            {user?.role && user.role !== 'admin' && (
              <button
                type="button"
                className="btn btn-ghost w-full"
                onClick={() => navigate(`/${user.role}/overview`)}
              >
                Skip for now — Explore Dashboard
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
