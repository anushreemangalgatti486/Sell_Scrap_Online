import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import { CreditCard } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminTransactions({ setTitle }) {
  useEffect(() => setTitle('Transactions'), [])
  const [txns,    setTxns]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getTransactions()
      .then(r => setTxns(r.data.transactions || []))
      .catch(() => setTxns([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Transactions</h2>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Material</th><th>Buyer</th><th>Seller</th><th>Amount</th><th>Payment</th><th>Date</th></tr></thead>
          <tbody>
            {txns.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text-muted)', padding: 40 }}>No transactions yet</td></tr>
            ) : txns.map(tx => (
              <tr key={tx._id}>
                <td><strong>{tx.material?.name || '—'}</strong></td>
                <td>{tx.buyer?.businessName || '—'}</td>
                <td>{tx.seller?.businessName || '—'}</td>
                <td><strong>₹{tx.totalAmount?.toLocaleString() || '—'}</strong></td>
                <td><span className={`badge ${tx.paymentStatus==='successful'?'badge-green':tx.paymentStatus==='failed'?'badge-red':'badge-amber'}`}>{tx.paymentStatus}</span></td>
                <td>{tx.createdAt ? format(new Date(tx.createdAt), 'dd MMM yyyy') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
