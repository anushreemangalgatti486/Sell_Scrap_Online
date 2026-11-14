import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import { CheckCircle2, XCircle, Eye, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AdminVerifications({ setTitle }) {
  useEffect(() => setTitle('Business Verifications'), [])
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [rejectReason, setRejectReason]   = useState('')
  const [rejectTarget, setRejectTarget]   = useState(null)
  const [processing, setProcessing]       = useState(null)

  const fetch = () => {
    adminAPI.getPending()
      .then(r => setVerifications(r.data.verifications || []))
      .catch(() => setVerifications([]))
      .finally(() => setLoading(false))
  }
  useEffect(fetch, [])

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this business verification?')) return
    setProcessing(id + '_approve')
    try {
      await adminAPI.approve(id)
      toast.success('Business verified and approved!')
      fetch()
    } catch { toast.error('Failed to approve') }
    finally { setProcessing(null) }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please enter a rejection reason'); return }
    setProcessing(rejectTarget + '_reject')
    try {
      await adminAPI.reject(rejectTarget, rejectReason)
      toast.success('Verification rejected')
      setRejectTarget(null)
      setRejectReason('')
      fetch()
    } catch { toast.error('Failed to reject') }
    finally { setProcessing(null) }
  }

  if (loading) return <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Pending Verifications ({verifications.length})</h2>

      {verifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ShieldCheck size={32} /></div>
          <h3>No pending verifications</h3>
          <p>All submitted verifications have been reviewed.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {verifications.map(v => (
            <div key={v._id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-amber">⏳ Pending</span>
                    <span className="badge badge-gray">{v.user?.role}</span>
                  </div>
                  <h3 style={{ marginBottom: 4 }}>{v.businessName}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    {v.authorizedPerson} · {v.user?.email} · {v.user?.phone}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.85rem' }}>
                    <span><strong>Type:</strong> {v.businessType}</span>
                    <span><strong>GSTIN:</strong> {v.gstin || '—'}</span>
                    <span><strong>Reg. No.:</strong> {v.businessRegNo || '—'}</span>
                    <span><strong>City:</strong> {v.city}, {v.state}</span>
                    <span><strong>Submitted:</strong> {v.createdAt ? format(new Date(v.createdAt), 'dd MMM yyyy') : '—'}</span>
                  </div>
                  {v.documentUrl && (
                    <a href={v.documentUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
                      <Eye size={13} /> View Document
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!!processing}
                    onClick={() => handleApprove(v._id)}
                  >
                    {processing === v._id + '_approve' ? <div className="spinner" /> : <CheckCircle2 size={14} />}
                    Approve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={!!processing}
                    onClick={() => setRejectTarget(v._id)}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setRejectTarget(null)}>
          <div className="modal-box">
            <h3 style={{ marginBottom: 8 }}>Reject Verification</h3>
            <p style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Please provide a reason for rejection. This will be sent to the applicant.</p>
            <div className="form-group">
              <label className="form-label">Rejection Reason *</label>
              <textarea className="form-input" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g., Documents are not clearly legible..." />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setRejectTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={!!processing}>
                {processing ? <div className="spinner" /> : null} Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
