import React, { useEffect, useState, useCallback } from 'react'
import { adminAPI, transactionsAPI } from '../../services/api'
import { CreditCard, X, Settings } from 'lucide-react'
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
  payment_failed:   'Failed',
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

export default function AdminTransactions({ setTitle }) {
  useEffect(() => setTitle('Transactions'), [])
  const [txns,      setTxns]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('all')
  const [cancelling,setCancelling]= useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [advancePct, setAdvancePct] = useState(10)
  const [savingPct, setSavingPct] = useState(false)

  const loadTxns = useCallback(() => {
    setLoading(true)
    adminAPI.getTransactions()
      .then(r => setTxns(r.data.transactions || []))
      .catch(() => setTxns([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadTxns()
    // Load current advance percentage
    adminAPI.getSettings()
      .then(r => setAdvancePct(r.data.settings?.advancePercentage || 10))
      .catch(() => {})
  }, [loadTxns])

  const handleCancel = async (txId, matName) => {
    if (!window.confirm(`Cancel transaction for "${matName}"? This cannot be undone.`)) return
    setCancelling(txId)
    try {
      await transactionsAPI.cancel(txId)
      toast.success('Transaction cancelled')
      loadTxns()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel')
    } finally { setCancelling(null) }
  }

  const handleSavePct = async () => {
    setSavingPct(true)
    try {
      await adminAPI.updateSettings({ advancePercentage: advancePct })
      toast.success(`Advance percentage set to ${advancePct}%`)
      setShowSettings(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally { setSavingPct(false) }
  }

  const filtered = filter === 'all' ? txns : txns.filter(t => t.paymentStatus === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2>Transactions ({filtered.length})</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="form-input" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="advance_pending">Advance Due</option>
            <option value="advance_paid">Advance Paid</option>
            <option value="balance_pending">Balance Due</option>
            <option value="completed">Completed</option>
            <option value="payment_failed">Payment Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(s => !s)} title="Payment settings">
            <Settings size={14} /> Settings
          </button>
        </div>
      </div>

      {/* Advance percentage config */}
      {showSettings && (
        <div className="card" style={{ padding: 20, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Advance Payment Percentage:</label>
          <input
            className="form-input"
            type="number"
            min={1}
            max={100}
            value={advancePct}
            onChange={e => setAdvancePct(e.target.value)}
            style={{ width: 80 }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>% of total transaction amount (default: 10%)</span>
          <button className="btn btn-primary btn-sm" onClick={handleSavePct} disabled={savingPct}>
            {savingPct ? <div className="spinner" /> : 'Save'}
          </button>
        </div>
      )}

      {loading
        ? <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
        : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Buyer</th>
                  <th>Seller</th>
                  <th>Total</th>
                  <th>Advance</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>B✓</th>
                  <th>S✓</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No transactions found</td></tr>
                ) : filtered.map(tx => (
                  <tr key={tx._id}>
                    <td><strong>{tx.material?.name || '—'}</strong></td>
                    <td>{tx.buyer?.businessName || '—'}</td>
                    <td>{tx.seller?.businessName || '—'}</td>
                    <td><strong>{fmtPaise(tx.totalAmount)}</strong></td>
                    <td>
                      {tx.advanceStatus === 'paid'
                        ? <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>✅ {fmtPaise(tx.advanceAmount)}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>{fmtPaise(tx.advanceAmount)}</span>
                      }
                    </td>
                    <td>{fmtPaise(tx.remainingBalance)}</td>
                    <td><span className={`badge ${STATUS_BADGE[tx.paymentStatus] || 'badge-amber'}`}>{STATUS_LABEL[tx.paymentStatus] || tx.paymentStatus}</span></td>
                    <td>{tx.confirmedByBuyer  ? '✅' : '—'}</td>
                    <td>{tx.confirmedBySeller ? '✅' : '—'}</td>
                    <td>{tx.createdAt ? format(new Date(tx.createdAt), 'dd MMM yyyy') : '—'}</td>
                    <td>
                      {['advance_pending', 'advance_paid'].includes(tx.paymentStatus) && (
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={cancelling === tx._id}
                          onClick={() => handleCancel(tx._id, tx.material?.name)}
                          title="Cancel transaction"
                        >
                          <X size={13} /> {cancelling === tx._id ? '...' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  )
}
