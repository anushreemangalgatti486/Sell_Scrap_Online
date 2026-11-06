import React, { useEffect, useState, useCallback } from 'react'
import { CreditCard, CheckCircle2, Clock, XCircle, IndianRupee, Loader2 } from 'lucide-react'
import { transactionsAPI, paymentAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import './BuyerComponents.css'

/* ── Status display config for new lifecycle ── */
const STATUS_CONFIG = {
  advance_pending:  { icon: <Clock size={18} />,        color: 'stat-icon-amber', badge: 'badge-amber',  label: 'Advance Due' },
  advance_paid:     { icon: <CreditCard size={18} />,    color: 'stat-icon-blue',  badge: 'badge-blue',   label: 'Advance Paid' },
  pickup_initiated: { icon: <Loader2 size={18} />,       color: 'stat-icon-blue',  badge: 'badge-blue',   label: 'Pickup' },
  balance_pending:  { icon: <IndianRupee size={18} />,   color: 'stat-icon-amber', badge: 'badge-amber',  label: 'Balance Due' },
  completed:        { icon: <CheckCircle2 size={18} />,  color: 'stat-icon-green', badge: 'badge-green',  label: 'Completed' },
  payment_failed:   { icon: <XCircle size={18} />,        color: 'stat-icon-red',   badge: 'badge-red',    label: 'Payment Failed' },
  cancelled:        { icon: <XCircle size={18} />,        color: 'stat-icon-gray',  badge: 'badge-gray',   label: 'Cancelled' },
  // Legacy status mapping
  pending:          { icon: <Clock size={18} />,        color: 'stat-icon-amber', badge: 'badge-amber',  label: 'Pending' },
  initiated:        { icon: <Clock size={18} />,        color: 'stat-icon-blue',  badge: 'badge-blue',   label: 'In Progress' },
  successful:       { icon: <CheckCircle2 size={18} />, color: 'stat-icon-green', badge: 'badge-green',  label: 'Completed' },
  failed:           { icon: <XCircle size={18} />,      color: 'stat-icon-red',   badge: 'badge-red',    label: 'Cancelled' },
}

/* ── Helper: format paise to rupee string ── */
function fmtPaise(p) {
  if (!p && p !== 0) return '—'
  return `₹${(p / 100).toLocaleString('en-IN')}`
}

/* ── Load Razorpay checkout script ── */
let razorpayScriptLoaded = false
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (razorpayScriptLoaded && window.Razorpay) return resolve()
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => { razorpayScriptLoaded = true; resolve() }
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'))
    document.body.appendChild(script)
  })
}

export default function BuyerTransactions({ setTitle }) {
  useEffect(() => setTitle('Transactions'), [])
  const [txns,     setTxns]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState(null) // txn id being acted on
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

  /* ── Pay Advance via Razorpay ── */
  const handlePayAdvance = async (tx) => {
    setActing(tx._id)
    try {
      // 1. Create order on backend
      const orderResp = await paymentAPI.createOrder(tx._id)
      const { orderId, amount, currency, keyId } = orderResp.data

      if (!keyId || keyId === 'rzp_test_your_key_id') {
        toast.error('Razorpay not configured. Contact admin.')
        return
      }

      // 2. Load Razorpay checkout script
      await loadRazorpayScript()

      // 3. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key:        keyId,
        amount:     amount,
        currency:   currency,
        order_id:   orderId,
        name:       'ScrapBazaar',
        description: `Advance payment for ${tx.material?.name || 'transaction'}`,
        prefill: {
          name:    tx.buyer?.name || '',
          email:   tx.buyer?.email || '',
        },
        theme: { color: '#1B6B3A' },
        handler: async (response) => {
          // 4. Verify payment on backend (never trust frontend alone)
          try {
            const verifyResp = await paymentAPI.verify({
              transactionId:      tx._id,
              razorpayOrderId:    response.razorpay_order_id,
              razorpayPaymentId:  response.razorpay_payment_id,
              razorpaySignature:  response.razorpay_signature,
            })

            if (verifyResp.data.verified) {
              toast.success('Advance payment verified successfully!')
              loadTxns()
            } else {
              toast.error('Payment verification failed')
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed')
            loadTxns()
          }
        },
        modal: {
          ondismiss: () => {
            setActing(null)
            // Don't mark as success — checkout was dismissed
            toast('Payment cancelled. You can retry later.', { icon: 'ℹ️' })
          }
        },
      })

      rzp.on('payment.failed', (resp) => {
        toast.error(`Payment failed: ${resp.error?.description || 'Unknown error'}`)
        loadTxns()
      })

      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment')
    } finally {
      setActing(null)
    }
  }

  /* ── Confirm offline settlement ── */
  const handleSettle = async (txId) => {
    if (!window.confirm('Confirm that you have completed the offline balance settlement?')) return
    setActing(txId)
    try {
      const resp = await paymentAPI.settle(txId)
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
      <p>Once you win an auction, your transactions will appear here.</p>
    </div>
  )

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Transactions</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {txns.map(tx => {
          const cfg  = STATUS_CONFIG[tx.paymentStatus] || STATUS_CONFIG.advance_pending
          const open = expanded === tx._id
          const advancePct = tx.advancePercentage || 10

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
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{fmtPaise(tx.totalAmount)}</div>
                  <span className={`badge ${cfg.badge}`} style={{ marginTop: 4, display: 'inline-block' }}>{cfg.label}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {open && (
                <div style={{ borderTop: '1px solid var(--border-light)', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
                  {/* Payment breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Est. Total Amount</div>
                      <div style={{ fontWeight: 600 }}>{fmtPaise(tx.totalAmount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Advance ({advancePct}%)</div>
                      <div style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{fmtPaise(tx.advanceAmount)}</div>
                    </div>
                    {tx.advanceStatus === 'paid' && (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Advance Paid</div>
                        <div style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>✅ {tx.advancePaidAt ? format(new Date(tx.advancePaidAt), 'dd MMM yyyy') : '—'}</div>
                      </div>
                    )}
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
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Remaining Balance</div>
                          <div style={{ fontWeight: 700, color: 'var(--amber-600)' }}>{fmtPaise(tx.remainingBalance)} <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>(offline)</span></div>
                        </div>
                      </>
                    )}
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pickup</div>
                      <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{tx.pickupStatus}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Your Settlement</div>
                      <div style={{ fontWeight: 600 }}>{tx.confirmedByBuyer ? '✅ Confirmed' : '⏳ Pending'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Seller Settlement</div>
                      <div style={{ fontWeight: 600 }}>{tx.confirmedBySeller ? '✅ Confirmed' : '⏳ Pending'}</div>
                    </div>
                    {tx.completedAt && (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Completed</div>
                        <div style={{ fontWeight: 600 }}>{format(new Date(tx.completedAt), 'dd MMM yyyy')}</div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {/* Pay Advance */}
                    {['advance_pending', 'payment_failed'].includes(tx.paymentStatus) && (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={acting === tx._id}
                        onClick={() => handlePayAdvance(tx)}
                      >
                        {acting === tx._id ? <div className="spinner" /> : <CreditCard size={14} />}
                        {tx.paymentStatus === 'payment_failed' ? 'Retry Advance Payment' : `Pay ${advancePct}% Advance`}
                      </button>
                    )}

                    {/* Confirm offline settlement */}
                    {tx.paymentStatus === 'balance_pending' && !tx.confirmedByBuyer && (
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={acting === tx._id}
                        onClick={() => handleSettle(tx._id)}
                      >
                        {acting === tx._id ? <div className="spinner" /> : <CheckCircle2 size={14} />}
                        Confirm Offline Settlement
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
