import React, { useEffect, useState, useCallback } from 'react'
import { adminAPI, transactionsAPI } from '../../services/api'
import { CreditCard, X } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_BADGE = {
  pending:    'badge-amber',
  initiated:  'badge-blue',
  successful: 'badge-green',
  failed:     'badge-red',
  refunded:   'badge-amber',
}

export default function AdminTransactions({ setTitle }) {
  useEffect(() => setTitle('Transactions'), [])
  const [txns,      setTxns]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('all')
  const [cancelling,setCancelling]= useState(null)

  const loadTxns = useCallback(() => {
    setLoading(true)
    adminAPI.getTransactions()
      .then(r => setTxns(r.data.transactions || []))
      .catch(() => setTxns([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadTxns() }, [loadTxns])

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

  const filtered = filter === 'all' ? txns : txns.filter(t => t.paymentStatus === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2>Transactions ({filtered.length})</h2>
        <select className="form-input" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="initiated">In Progress</option>
          <option value="successful">Completed</option>
          <option value="failed">Cancelled</option>
        </select>
      </div>

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
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Buyer ✓</th>
                  <th>Seller ✓</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No transactions found</td></tr>
                ) : filtered.map(tx => (
                  <tr key={tx._id}>
                    <td><strong>{tx.material?.name || '—'}</strong></td>
                    <td>{tx.buyer?.businessName || '—'}</td>
                    <td>{tx.seller?.businessName || '—'}</td>
                    <td><strong>₹{tx.totalAmount?.toLocaleString() || '—'}</strong></td>
                    <td><span className={`badge ${STATUS_BADGE[tx.paymentStatus] || 'badge-amber'}`}>{tx.paymentStatus}</span></td>
                    <td>{tx.confirmedByBuyer  ? '✅' : '—'}</td>
                    <td>{tx.confirmedBySeller ? '✅' : '—'}</td>
                    <td>{tx.createdAt ? format(new Date(tx.createdAt), 'dd MMM yyyy') : '—'}</td>
                    <td>
                      {['pending', 'initiated'].includes(tx.paymentStatus) && (
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
