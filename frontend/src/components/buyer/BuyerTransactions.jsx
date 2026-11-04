import React, { useEffect, useState } from 'react'
import { CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { transactionsAPI } from '../../services/api'
import { format } from 'date-fns'
import './BuyerComponents.css'

const STATUS_CONFIG = {
  pending:    { icon: <Clock size={20} />,         color: 'stat-icon-amber', badge: 'badge-amber' },
  initiated:  { icon: <Clock size={20} />,         color: 'stat-icon-blue',  badge: 'badge-blue'  },
  successful: { icon: <CheckCircle2 size={20} />,  color: 'stat-icon-green', badge: 'badge-green' },
  failed:     { icon: <XCircle size={20} />,       color: 'stat-icon-red',   badge: 'badge-red'   },
  refunded:   { icon: <CreditCard size={20} />,    color: 'stat-icon-amber', badge: 'badge-amber' },
}

export default function BuyerTransactions({ setTitle }) {
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
      <p>Once you win an auction, your transactions will appear here.</p>
    </div>
  )

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Transactions</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {txns.map(tx => {
          const cfg = STATUS_CONFIG[tx.paymentStatus] || STATUS_CONFIG.pending
          return (
            <div key={tx._id} className="transaction-card">
              <div className={`tx-status-icon ${cfg.color}`}>{cfg.icon}</div>
              <div className="tx-info">
                <h4>{tx.material?.name || 'Material'}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {tx.createdAt ? format(new Date(tx.createdAt), 'dd MMM yyyy') : '—'} · {tx.seller?.businessName || 'Seller'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="tx-amount">₹{tx.totalAmount?.toLocaleString() || '—'}</div>
                <span className={`badge ${cfg.badge}`}>{tx.paymentStatus}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
