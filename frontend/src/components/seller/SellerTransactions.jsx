import React, { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { transactionsAPI } from '../../services/api'
import { format } from 'date-fns'

export default function SellerTransactions({ setTitle }) {
  useEffect(() => setTitle('Transactions'), [])
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    transactionsAPI.getMine()
      .then(r => setTxns(r.data.transactions || []))
      .catch(() => setTxns([]))
      .finally(() => setLoading(false))
  }, [])

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
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Material</th><th>Buyer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {txns.map(tx => (
              <tr key={tx._id}>
                <td><strong>{tx.material?.name || '—'}</strong></td>
                <td>{tx.buyer?.businessName || '—'}</td>
                <td><strong>₹{tx.totalAmount?.toLocaleString() || '—'}</strong></td>
                <td>
                  <span className={`badge ${
                    tx.paymentStatus === 'successful' ? 'badge-green' :
                    tx.paymentStatus === 'failed'     ? 'badge-red'   :
                    tx.paymentStatus === 'pending'    ? 'badge-amber' : 'badge-blue'
                  }`}>{tx.paymentStatus}</span>
                </td>
                <td>{tx.createdAt ? format(new Date(tx.createdAt), 'dd MMM yyyy') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
