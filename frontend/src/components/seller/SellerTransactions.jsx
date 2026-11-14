import React, { useEffect, useState, useCallback } from 'react'
import { CreditCard, CheckCircle2, Scale, Clock, XCircle } from 'lucide-react'
import { transactionsAPI, paymentAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_BADGE = {
  advance_pending:  'badge-amber',
  advance_paid:     'badge-blue',
  pickup_initiated: 'badge-blue',
  balance_pending:  'badge-amber',
  completed:        'badge-green',
  payment_failed:   'badge-red',
  cancelled:        'badge-gray',
  // Legacy
  pending:          'badge-amber',
  initiated:        'badge-blue',
  successful:       'badge-green',
  failed:           'badge-red',
}
const STATUS_LABEL = {
  advance_pending:  'Advance Due',
  advance_paid:     'Advance Paid',
  pickup_initiated: 'Pickup',
  balance_pending:  'Balance Due',
  completed:        'Completed',
  payment_failed:   'Payment Failed',
  cancelled:        'Cancelled',
  pending:          'Pending',
  initiated:        'In Progress',
  successful:       'Completed',
  failed:           'Cancelled',
}

function fmtPaise(p) {
  if (!p && p !== 0) return '—'
  return `₹${(p / 100).toLocaleString('en-IN')}`
}

export default function SellerTransactions({ setTitle }) {
  useEffect(() => setTitle('Transactions'), [])
  const [txns,      setTxns]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [acting,    setActing]    = useState(null)
  const [expanded, setExpanded]  = useState(null)
  const [weighmentInput, setWeighmentInput] = useState({}) // { txId: value }

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

  /* ── Record final weighment ── */
  const handleWeighment = async (tx) => {
    const w = weighmentInput[tx._id]
    if (!w || isNaN(w) || +w <= 0) {
      toast.error('Please enter a valid weighment quantity')
      return
    }
    setActing(tx._id)
    try {
      const resp = await paymentAPI.recordWeighment(tx._id, w)
      toast.success(`Weighment recorded. Remaining balance: ${fmtPaise(resp.data.transaction.remainingBalance)}`)
      loadTxns()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record weighment')
    } finally { setActing(null) }
  }

  /* ── Confirm offline settlement ── */
  const handleSettle = async (txId) => {
    if (!window.confirm('Confirm that you have received the offline balance settlement?')) return
    setActing(txId)
    try {
      await paymentAPI.settle(txId)
      toast.success('Settlement confirmed!')
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
                  <div style={{ fontWeight: 700 }}>{fmtPaise(tx.totalAmount)}</div>
                  <span className={`badge ${STATUS_BADGE[tx.paymentStatus] || 'badge-amber'}`} style={{ marginTop: 4, display: 'inline-block' }}>
                    {STATUS_LABEL[tx.paymentStatus] || tx.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Expanded */}
              {open && (
                <div style={{ borderTop: '1px solid var(--border-light)', padding: '14px 20px', background: 'var(--bg-secondary)' }}>
                  {/* Payment breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Est. Total</div>
                      <div style={{ fontWeight: 600 }}>{fmtPaise(tx.totalAmount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Advance ({tx.advancePercentage || 10}%)</div>
                      <div style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>
                        {tx.advanceStatus === 'paid' ? '✅ ' : ''}{fmtPaise(tx.advanceAmount)}
                      </div>
                    </div>
                    {tx.finalWeighment && (
                      <>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Final Weighment</div>
                          <div style={{ fontWeight: 600 }}>{tx.finalWeighment} {tx.unit}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Final Amount</div>
                          <div style={{ fontWeight: 600 }}>{fmtPaise(tx.finalAmount)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Balance Due</div>
                          <div style={{ fontWeight: 700, color: 'var(--amber-600)' }}>{fmtPaise(tx.remainingBalance)}</div>
                        </div>
                      </>
                    )}
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Buyer Confirmed</div>
                      <div style={{ fontWeight: 600 }}>{tx.confirmedByBuyer ? '✅ Yes' : '⏳ Pending'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Your Confirmation</div>
                      <div style={{ fontWeight: 600 }}>{tx.confirmedBySeller ? '✅ Yes' : '⏳ Pending'}</div>
                    </div>
                    {tx.completedAt && (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Completed</div>
                        <div style={{ fontWeight: 600 }}>{format(new Date(tx.completedAt), 'dd MMM yyyy')}</div>
                      </div>
                    )}
                  </div>

                  {/* Record weighment */}
                  {tx.paymentStatus === 'advance_paid' && !tx.finalWeighment && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                      <Scale size={16} style={{ color: 'var(--text-muted)' }} />
                      <input
                        className="form-input"
                        type="number"
                        placeholder={`Actual weighment (${tx.unit})`}
                        value={weighmentInput[tx._id] || ''}
                        onChange={e => setWeighmentInput(prev => ({ ...prev, [tx._id]: e.target.value }))}
                        style={{ width: 200 }}
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={acting === tx._id}
                        onClick={() => handleWeighment(tx)}
                      >
                        {acting === tx._id ? <div className="spinner" /> : <Scale size={14} />}
                        Record Weighment
                      </button>
                    </div>
                  )}

                  {/* Confirm offline settlement */}
                  {tx.paymentStatus === 'balance_pending' && !tx.confirmedBySeller && (
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={acting === tx._id}
                      onClick={() => handleSettle(tx._id)}
                    >
                      {acting === tx._id ? <div className="spinner" /> : <CheckCircle2 size={14} />}
                      Confirm Settlement Received
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
