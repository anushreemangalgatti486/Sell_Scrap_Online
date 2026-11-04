import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, Clock, Package, X } from 'lucide-react'
import { materialsAPI } from '../../services/api'
import { formatDistanceToNow } from 'date-fns'
import './BuyerComponents.css'

const CATEGORIES = ['All', 'Iron & Steel', 'Copper', 'Aluminium', 'Paper', 'Plastic', 'Wood', 'E-Waste', 'Industrial']
const SORT_OPTIONS = [
  { label: 'Newest First',     value: 'newest' },
  { label: 'Price: Low–High',  value: 'price_asc' },
  { label: 'Price: High–Low',  value: 'price_desc' },
  { label: 'Ending Soonest',   value: 'ending_soon' },
]

function MaterialCard({ m }) {
  const timeLeft = m.auction?.endTime ? formatDistanceToNow(new Date(m.auction.endTime), { addSuffix: false }) : null
  const isActive = m.auction?.status === 'active'

  return (
    <Link to={`/materials/${m._id}`} className="material-card">
      <div className="mat-img-wrap">
        {m.images?.[0] ? (
          <img src={m.images[0]} alt={m.name} className="mat-img" />
        ) : (
          <div className="mat-img-placeholder"><Package size={32} /></div>
        )}
        <div className="mat-status-badge">
          {isActive ? <span className="badge badge-green">● Live</span> : <span className="badge badge-gray">Upcoming</span>}
        </div>
      </div>
      <div className="mat-body">
        <div className="mat-category">{m.category}</div>
        <h4 className="mat-name">{m.name}</h4>
        <div className="mat-meta">
          <span>Grade: {m.grade || 'N/A'}</span>
          <span>{m.quantity} {m.unit}</span>
        </div>
        <div className="mat-prices">
          <div className="mat-price-row">
            <span className="mat-price-label">Starting</span>
            <span className="mat-price">₹{m.startingPrice?.toLocaleString()}/{m.unit}</span>
          </div>
          <div className="mat-price-row">
            <span className="mat-price-label">Highest Bid</span>
            <span className="mat-price highlight">₹{m.currentHighestBid ? m.currentHighestBid.toLocaleString() : '—'}</span>
          </div>
        </div>
        {timeLeft && (
          <div className="mat-countdown">
            <Clock size={13} /> {timeLeft} left
          </div>
        )}
        <div className="mat-seller">
          <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ Verified Seller</span>
        </div>
      </div>
    </Link>
  )
}

export default function BuyerExploreMaterials({ setTitle }) {
  useEffect(() => setTitle('Explore Materials'), [])

  const [materials, setMaterials] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [category,  setCategory]  = useState('All')
  const [sort,      setSort]      = useState('newest')
  const [page,      setPage]      = useState(1)
  const [total,     setTotal]     = useState(0)
  const LIMIT = 12

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    try {
      const res = await materialsAPI.getAll({
        search,
        category: category === 'All' ? '' : category,
        sort,
        page,
        limit: LIMIT,
      })
      setMaterials(res.data.materials)
      setTotal(res.data.total)
    } catch (err) {
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }, [search, category, sort, page])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  return (
    <div className="explore-page">
      {/* Filters bar */}
      <div className="explore-filters card">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search materials..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          {search && <button className="search-clear" onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
        <div className="filter-row">
          <div className="category-pills">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`cat-pill ${category === c ? 'active' : ''}`}
                onClick={() => { setCategory(c); setPage(1) }}
              >
                {c}
              </button>
            ))}
          </div>
          <select className="sort-select form-input" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="results-count">
        {!loading && <p>{total} material{total !== 1 ? 's' : ''} found</p>}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="materials-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={32} /></div>
          <h3>No materials found</h3>
          <p>Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className="materials-grid">
          {materials.map(m => <MaterialCard key={m._id} m={m} />)}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span>{page} / {Math.ceil(total / LIMIT)}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= Math.ceil(total/LIMIT)} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  )
}
