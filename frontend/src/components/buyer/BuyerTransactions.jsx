import React, { useEffect, useState, useCallback } from 'react'
import { CreditCard, CheckCircle2, Clock, XCircle, TruckIcon, Eye } from 'lucide-react'
import { transactionsAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import './BuyerComponents.css'

const STATUS_CONFIG = {
  pending:    { icon: <Clock size={18} />,        color: 'stat-icon-amber', badge: 'badge-amber',  label: 'Pending' },
  initiated:  { icon: <TruckIcon size={18} />,    color: 'stat-icon-blue',  badge: 'badge-blue',   label: 'In Progress' },
  successful: { icon: <CheckCircle2 size={18} />, color: 'stat-icon-green', badge: 'badge-green',  label: 'Completed' },
  failed:     { icon: <XCircle size={18} />,      color: 'stat-icon-red',   badge: 'badge-red',    label: 'Cancelled' },
  refunded:   { icon: <CreditCard size={18} />,   color: 'stat-icon-amber', badge: 'badge-amber',  label: 'Refunded' },
}

export default function BuyerTransactions({ setTitle }) {
  useEffect(() => setTitle('Transactions'), [])
  const [txns,      setTxns]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [acting,    setActing]    = useState(null) // txn id being acted on
  const [expanded,  setExpanded]  = useState(null)

  const loadTxns = useCallback(() => {
    transactionsAPI.getMine()
      .then(r => setTxns(r.data.transactions || []))
      .catch(() => setTxns([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadTxns() }, [loadTxns])

  // Listen for real-time payment notifications
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.type === 'payment' || e.detail?.type === 'transaction') loadTxns()
    }
    window.addEventListener('sb:notification', handler)
    return () => window.removeEventListener('sb:notification', handler)
  }, [loadTxns])

  const handleInitiate = async (txId) => {
    if (!window.confirm('Confirm that you want to proceed with this transaction?')) return
    setActing(txId)
    try {
      await transactionsAPI.initiate(txId)
      toast.success('Transaction initiated. Seller has been notified.')
      loadTxns()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate')
    } finally { setActing(null) }
  }

  const handleConfirm = async (txId) => {
    if (!window.confirm('Confirm pickup and completion of this transaction?')) return
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
      <p>Once you win an auction, your transactions will appear here.</p>
    </div>
  )

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Transactions</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {txns.map(tx => {
          const cfg  = STATUS_CONFIG[tx.paymentStatus] || STATUS_CONFIG.pending
          const open = expanded === tx._id
          return (
            <div key={tx._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Summary row */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer' }}
                onClick={() => setExpanded(open ? null : tx._id)}
              >
                <div className={`stat-icon ${cfg.color}`} style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tx.material?.name || 'Material'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {tx.createdAt ? format(new Date(tx.createdAt), 'dd MMM yyyy') : '—'}
                    {tx.seller?.businessName ? ` · ${tx.seller.businessName}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>₹{tx.totalAmount?.toLocaleString() || '—'}</div>
                  <span className={`badge ${cfg.badge}`} style={{ marginTop: 4, display: 'inline-block' }}>{cfg.label}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {open && (
                <div style={{ borderTop: '1px solid var(--border-light)', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Bid Amount</div><div style={{ fontWeight: 600 }}>₹{tx.bidAmount?.toLocaleString()}/{tx.unit || 'unit'}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Quantity</div><div style={{ fontWeight: 600 }}>{tx.quantity} {tx.unit}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pickup</div><div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{tx.pickupStatus}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Seller Confirmed</div><div style={{ fontWeight: 600 }}>{tx.confirmedBySeller ? '✅ Yes' : '⏳ Pending'}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Your Confirmation</div><div style={{ fontWeight: 600 }}>{tx.confirmedByBuyer ? '✅ Yes' : '⏳ Pending'}</div></div>
                    {tx.paidAt && <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Completed</div><div style={{ fontWeight: 600 }}>{format(new Date(tx.paidAt), 'dd MMM yyyy')}</div></div>}
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {/* Initiate payment */}
                    {tx.paymentStatus === 'pending' && (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={acting === tx._id}
                        onClick={() => handleInitiate(tx._id)}
                      >
                        {acting === tx._id ? <div className="spinner" /> : <TruckIcon size={14} />}
                        Proceed to Pickup
                      </button>
                    )}

                    {/* Confirm pickup */}
                    {(tx.paymentStatus === 'initiated' || tx.paymentStatus === 'pending') && !tx.confirmedByBuyer && (
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={acting === tx._id}
                        onClick={() => handleConfirm(tx._id)}
                      >
                        {acting === tx._id ? <div className="spinner" /> : <CheckCircle2 size={14} />}
                        Confirm Pickup
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
