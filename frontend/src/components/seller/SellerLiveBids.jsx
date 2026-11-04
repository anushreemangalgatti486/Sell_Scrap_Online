import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gavel, Eye, Clock, Package } from 'lucide-react'
import { materialsAPI, bidsAPI } from '../../services/api'
import { formatDistanceToNow } from 'date-fns'

export default function SellerLiveBids({ setTitle }) {
  useEffect(() => setTitle('Live Bids'), [])
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    materialsAPI.getMine({ status: 'active' })
      .then(r => setItems(r.data.materials || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />

  if (items.length === 0) return (
    <div className="empty-state">
      <div className="empty-state-icon"><Gavel size={32} /></div>
      <h3>No live auctions</h3>
      <p>Your active auction listings and their bids will appear here.</p>
      <Link to="/seller/add" className="btn btn-primary">Add Material</Link>
    </div>
  )

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Live Bids</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map(m => (
          <div key={m._id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span className="badge badge-green">● Live</span>
                  <span className="badge badge-gray">{m.category}</span>
                </div>
                <h3 style={{ marginBottom: 4 }}>{m.name}</h3>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{m.quantity} {m.unit} · {m.location}</div>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Starting Price</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>₹{m.startingPrice?.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Highest Bid</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--brand-primary)' }}>₹{m.currentHighestBid?.toLocaleString() || '—'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Bids</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>{m.bidsCount || 0}</div>
                </div>
                {m.auction?.endTime && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Ends In</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--amber-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />{formatDistanceToNow(new Date(m.auction.endTime))}
                    </div>
                  </div>
                )}
              </div>
              <Link to={`/materials/${m._id}`} className="btn btn-ghost btn-sm">
                <Eye size={14} /> View Bids
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
