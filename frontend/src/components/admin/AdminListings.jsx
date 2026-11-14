import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import { Package, Trash2, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AdminListings({ setTitle }) {
  useEffect(() => setTitle('Listings'), [])
  const [listings, setListings] = useState([])
  const [loading,  setLoading]  = useState(true)

  const fetch = () => {
    adminAPI.getListings()
      .then(r => setListings(r.data.listings || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }
  useEffect(fetch, [])

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this listing? This action cannot be undone.')) return
    try {
      await adminAPI.removeListing(id)
      toast.success('Listing removed')
      fetch()
    } catch { toast.error('Failed to remove listing') }
  }

  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>All Listings ({listings.length})</h2>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Material</th><th>Seller</th><th>Category</th><th>Qty</th><th>Status</th><th>Listed</th><th>Actions</th></tr></thead>
          <tbody>
            {listings.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No listings found</td></tr>
            ) : listings.map(l => (
              <tr key={l._id}>
                <td><strong>{l.name}</strong></td>
                <td>{l.seller?.businessName || '—'}</td>
                <td>{l.category}</td>
                <td>{l.quantity} {l.unit}</td>
                <td><span className={`badge ${l.auction?.status === 'active' ? 'badge-green' : l.auction?.status === 'closed' ? 'badge-gray' : 'badge-amber'}`}>{l.auction?.status || 'draft'}</span></td>
                <td>{l.createdAt ? format(new Date(l.createdAt), 'dd MMM yyyy') : '—'}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <Link to={`/materials/${l._id}`} className="btn btn-ghost btn-sm"><Eye size={13} /></Link>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemove(l._id)}><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
