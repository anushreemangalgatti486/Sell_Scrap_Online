import React, { useEffect, useState } from 'react'
import { auctionsAPI } from '../../services/api'
import { Gavel, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

export default function AdminAuctions({ setTitle }) {
  useEffect(() => setTitle('Auctions'), [])
  const [auctions, setAuctions] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    auctionsAPI.getActive()
      .then(r => setAuctions(r.data.auctions || []))
      .catch(() => setAuctions([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Auctions ({auctions.length})</h2>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Material</th><th>Seller</th><th>Starting</th><th>Highest Bid</th><th>Bids</th><th>Status</th><th>Ends</th><th>View</th></tr></thead>
          <tbody>
            {auctions.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--text-muted)', padding: 40 }}>No auctions found</td></tr>
            ) : auctions.map(a => (
              <tr key={a._id}>
                <td><strong>{a.material?.name || '—'}</strong></td>
                <td>{a.material?.seller?.businessName || '—'}</td>
                <td>₹{a.material?.startingPrice?.toLocaleString() || '—'}</td>
                <td>₹{a.currentHighestBid?.toLocaleString() || '—'}</td>
                <td>{a.bidsCount || 0}</td>
                <td><span className={`badge ${a.status === 'active' ? 'badge-green' : a.status === 'closed' ? 'badge-gray' : 'badge-amber'}`}>{a.status}</span></td>
                <td>{a.endTime ? format(new Date(a.endTime), 'dd MMM HH:mm') : '—'}</td>
                <td><Link to={`/materials/${a.material?._id}`} className="btn btn-ghost btn-sm"><Eye size={13} /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
