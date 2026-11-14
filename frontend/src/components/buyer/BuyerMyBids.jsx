import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gavel, Trophy, ExternalLink } from 'lucide-react'
import { bidsAPI } from '../../services/api'
import { format } from 'date-fns'
import './BuyerComponents.css'

export default function BuyerMyBids({ setTitle, won = false }) {
  useEffect(() => setTitle(won ? 'Won Auctions' : 'My Bids'), [won])
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bidsAPI.getMyBids()
      .then(r => {
        const all = r.data.bids || []
        setBids(won ? all.filter(b => b.status === 'won') : all)
      })
      .catch(() => setBids([]))
      .finally(() => setLoading(false))
  }, [won])

  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />

  if (bids.length === 0) return (
    <div className="empty-state">
      <div className="empty-state-icon">{won ? <Trophy size={32} /> : <Gavel size={32} />}</div>
      <h3>{won ? 'No won auctions yet' : 'No bids placed yet'}</h3>
      <p>{won ? 'Win an auction to see it here.' : 'Explore live auctions and place your first bid.'}</p>
      <Link to="/buyer/auctions" className="btn btn-primary">View Live Auctions</Link>
    </div>
  )

  return (
    <div className="bids-page">
      <h2 style={{ marginBottom: 16 }}>{won ? 'Won Auctions' : 'My Bids'}</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Category</th>
              <th>Bid Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bids.map(b => (
              <tr key={b._id} className={b.status === 'won' ? 'bid-row-won' : ''}>
                <td><strong>{b.material?.name || 'Unknown'}</strong></td>
                <td>{b.material?.category || '—'}</td>
                <td><strong>₹{b.amount?.toLocaleString()}/{b.material?.unit || 'unit'}</strong></td>
                <td>
                  <span className={`badge ${
                    b.status === 'won'     ? 'badge-green' :
                    b.status === 'active'  ? 'badge-blue'  :
                    b.status === 'outbid'  ? 'badge-amber' : 'badge-gray'
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td>{b.createdAt ? format(new Date(b.createdAt), 'dd MMM yyyy') : '—'}</td>
                <td>
                  <Link to={`/materials/${b.material?._id}`} className="btn btn-ghost btn-sm">
                    <ExternalLink size={13} /> View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
