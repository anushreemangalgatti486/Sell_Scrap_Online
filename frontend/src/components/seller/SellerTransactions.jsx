import React, { useEffect, useState, useCallback } from 'react'
import { CreditCard, CheckCircle2, TruckIcon, Clock, XCircle } from 'lucide-react'
import { transactionsAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_BADGE = {
  pending:    'badge-amber',
  initiated:  'badge-blue',
  successful: 'badge-green',
  failed:     'badge-red',
  refunded:   'badge-amber',
}
const STATUS_LABEL = {
  pending:    'Pending',
  initiated:  'In Progress',
  successful: 'Completed',
  failed:     'Cancelled',
  refunded:   'Refunded',
}

export default function SellerTransactions({ setTitle }) {
  useEffect(() => setTitle('Transactions'), [])
  const [txns,     setTxns]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState(null)
  const [expanded, setExpanded] = useState(null)

  const loadTxns = useCallback(() => {
    transactionsAPI.getMine()
      .then(r => setTxns(r.data.transactions || []))
      .catch(() => setTxns([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadTxns() }, [loadTxns])

  // Real-time updates from socket notifications
  useEffect(() => {
    const handler = (e) => {
      if (['payment', 'transaction'].includes(e.detail?.type)) loadTxns()
    }
    window.addEventListener('sb:notification', handler)
    return () => window.removeEventListener('sb:notification', handler)
  }, [loadTxns])

  const handleConfirm = async (txId) => {
    if (!window.confirm('Confirm that pickup has been completed for this transaction?')) return
    setActing(txId)
    try {
      await transactionsAPI.confirm(txId)
      toast.success('Pickup confirmed!')
      loadTxns()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm')
    } finally { setActing(null) }
  }

  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />

  if (txns.length === 0) return (
    <div className="empty-state">
      <div className="empty-state-icon"><CreditCard size={32} /></div>
      <h3>No transactions yet</h3>
      <p>Completed auction transactions will appear here.</p>
    </div>
  )

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Transactions</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {txns.map(tx => {
          const open = expanded === tx._id
          return (
            <div key={tx._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Summary */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer' }}
                onClick={() => setExpanded(open ? null : tx._id)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{tx.material?.name || '—'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Buyer: {tx.buyer?.businessName || '—'}
                    {tx.createdAt ? ` · ${format(new Date(tx.createdAt), 'dd MMM yyyy')}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700 }}>₹{tx.totalAmount?.toLocaleString() || '—'}</div>
                  <span className={`badge ${STATUS_BADGE[tx.paymentStatus] || 'badge-amber'}`} style={{ marginTop: 4, display: 'inline-block' }}>
                    {STATUS_LABEL[tx.paymentStatus] || tx.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Expanded */}
              {open && (
                <div style={{ borderTop: '1px solid var(--border-light)', padding: '14px 20px', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 14 }}>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Bid / Unit</div><div style={{ fontWeight: 600 }}>₹{tx.bidAmount?.toLocaleString()}/{tx.unit}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Quantity</div><div style={{ fontWeight: 600 }}>{tx.quantity} {tx.unit}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Buyer Confirmed</div><div style={{ fontWeight: 600 }}>{tx.confirmedByBuyer ? '✅ Yes' : '⏳ Pending'}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Your Confirmation</div><div style={{ fontWeight: 600 }}>{tx.confirmedBySeller ? '✅ Yes' : '⏳ Pending'}</div></div>
                    {tx.weighment && <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Weighment</div><div style={{ fontWeight: 600 }}>{tx.weighment} {tx.unit}</div></div>}
                    {tx.paidAt && <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Completed</div><div style={{ fontWeight: 600 }}>{format(new Date(tx.paidAt), 'dd MMM yyyy')}</div></div>}
                  </div>

                  {/* Confirm pickup button */}
                  {(tx.paymentStatus === 'initiated' || tx.paymentStatus === 'pending') && !tx.confirmedBySeller && (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={acting === tx._id}
                      onClick={() => handleConfirm(tx._id)}
                    >
                      {acting === tx._id ? <div className="spinner" /> : <CheckCircle2 size={14} />}
                      Confirm Pickup
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
