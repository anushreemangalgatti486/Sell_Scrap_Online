import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { businessAPI } from '../../services/api'
import { CheckCircle2, Clock, XCircle, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BuyerProfile({ setTitle }) {
  useEffect(() => setTitle('My Business Profile'), [])
  const { user, updateUser } = useAuth()
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    businessAPI.getProfile()
      .then(r => { setProfile(r.data.profile); setForm(r.data.profile || {}) })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await businessAPI.updateProfile(form)
      setProfile(form)
      setEditing(false)
      // Sync the auth context so navbar/topbar reflects updated name
      if (form.businessName) updateUser({ businessName: form.businessName })
      toast.success('Profile updated')
    } catch { toast.error('Failed to update profile') }
    finally { setSaving(false) }
  }

  const VerifBadge = () => {
    if (user?.verificationStatus === 'approved') return <span className="badge badge-green"><CheckCircle2 size={13} /> Verified</span>
    if (user?.verificationStatus === 'rejected') return <span className="badge badge-red"><XCircle size={13} /> Rejected</span>
    return <span className="badge badge-amber"><Clock size={13} /> Pending Verification</span>
  }

  if (loading) return <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>My Business Profile</h2>
        <VerifBadge />
      </div>

      <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3>{user?.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.email}</p>
          </div>
        </div>

        <div className="divider" />

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group"><label className="form-label">Business Name</label><input className="form-input" value={form.businessName || ''} onChange={e => setForm(f => ({...f, businessName: e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Business Type</label><input className="form-input" value={form.businessType || ''} onChange={e => setForm(f => ({...f, businessType: e.target.value}))} /></div>
            </div>
            <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address || ''} onChange={e => setForm(f => ({...f, address: e.target.value}))} /></div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group"><label className="form-label">City</label><input className="form-input" value={form.city || ''} onChange={e => setForm(f => ({...f, city: e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">State</label><input className="form-input" value={form.state || ''} onChange={e => setForm(f => ({...f, state: e.target.value}))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Business Name', value: profile?.businessName },
              { label: 'Business Type', value: profile?.businessType },
              { label: 'Address',       value: profile?.address },
              { label: 'City',          value: profile?.city },
              { label: 'State',         value: profile?.state },
              { label: 'Phone',         value: user?.phone },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', gap: 16 }}>
                <span style={{ width: 140, fontSize: '0.85rem', color: 'var(--text-muted)', flexShrink: 0 }}>{f.label}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{f.value || '—'}</span>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
