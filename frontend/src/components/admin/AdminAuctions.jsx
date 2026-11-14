import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import { Gavel, Eye, X, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminAuctions({ setTitle }) {
  useEffect(() => setTitle('Auctions'), [])
  const [auctions,  setAuctions]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('active')
  const [closing,   setClosing]   = useState(null)

  const fetchAuctions = (status) => {
    setLoading(true)
    adminAPI.getAuctions(status !== 'all' ? { status } : {})
      .then(r => setAuctions(r.data.auctions || []))
      .catch(() => setAuctions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAuctions(filter) }, [filter])

  const handleForceClose = async (auction) => {
    if (!window.confirm(`Force-close auction for "${auction.material?.name}"? This will determine a winner immediately.`)) return
    setClosing(auction._id)
    try {
      await adminAPI.closeAuction(auction._id)
      toast.success('Auction closed')
      fetchAuctions(filter)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close auction')
    } finally { setClosing(null) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2>Auctions ({auctions.length})</h2>
        <select
          className="form-input"
          style={{ width: 'auto' }}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="closed">Closed</option>
          <option value="all">All</option>
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
                  <th>Seller</th>
                  <th>Starting</th>
                  <th>Highest Bid</th>
                  <th>Bids</th>
                  <th>Status</th>
                  <th>Ends</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {auctions.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No auctions found</td></tr>
                ) : auctions.map(a => (
                  <tr key={a._id}>
                    <td><strong>{a.material?.name || '—'}</strong></td>
                    <td>{a.material?.seller?.businessName || '—'}</td>
                    <td>₹{a.material?.startingPrice?.toLocaleString() || '—'}</td>
                    <td>₹{a.currentHighestBid?.toLocaleString() || '—'}</td>
                    <td>{a.bidsCount || 0}</td>
                    <td>
                      <span className={`badge ${
                        a.status === 'active'    ? 'badge-green' :
                        a.status === 'closed'    ? 'badge-gray'  :
                        a.status === 'scheduled' ? 'badge-amber' : 'badge-gray'
                      }`}>{a.status}</span>
                    </td>
                    <td>{a.endTime ? format(new Date(a.endTime), 'dd MMM HH:mm') : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/materials/${a.material?._id}`} className="btn btn-ghost btn-sm">
                          <Eye size={13} />
                        </Link>
                        {a.status === 'active' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleForceClose(a)}
                            disabled={closing === a._id}
                            title="Force close auction"
                          >
                            <X size={13} /> {closing === a._id ? '...' : 'Close'}
                          </button>
                        )}
                      </div>
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
