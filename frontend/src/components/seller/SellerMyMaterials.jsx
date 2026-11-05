import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, Plus, Package, Clock, Pencil, Trash2, Eye, X, Save } from 'lucide-react'
import { materialsAPI } from '../../services/api'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import './SellerComponents.css'
import '../buyer/BuyerComponents.css'

/* ── inline edit modal ── */
function EditModal({ material, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:          material.name          || '',
    description:   material.description   || '',
    grade:         material.grade         || '',
    quantity:      material.quantity      || '',
    location:      material.location      || '',
    deliveryTerms: material.deliveryTerms || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      await materialsAPI.update(material._id, form)
      toast.success('Listing updated')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3>Edit Listing</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Grade / Quality</label>
            <input className="form-input" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} />
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-input" type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Delivery Terms</label>
            <input className="form-input" value={form.deliveryTerms} onChange={e => setForm(f => ({ ...f, deliveryTerms: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SellerMyMaterials({ setTitle, sold = false }) {
  useEffect(() => setTitle(sold ? 'Sold Materials' : 'My Materials'), [sold])
  const [view,      setView]      = useState('grid')
  const [materials, setMaterials] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [editing,   setEditing]   = useState(null) // material being edited

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await materialsAPI.getMine({ sold: sold ? 'true' : 'false', search })
      setMaterials(res.data.materials || [])
    } catch { setMaterials([]) }
    finally  { setLoading(false) }
  }, [sold, search])

  useEffect(() => { fetch() }, [fetch])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return
    try {
      await materialsAPI.delete(id)
      toast.success('Listing deleted')
      fetch()
    } catch { toast.error('Failed to delete listing') }
  }

  if (loading) return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>{Array.from({length:6}).map((_,i)=><div key={i} className="skeleton" style={{height:280,borderRadius:'var(--radius-lg)'}}/>)}</div>

  return (
    <div className="materials-page">
      {editing && (
        <EditModal
          material={editing}
          onClose={() => setEditing(null)}
          onSaved={fetch}
        />
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <h2>{sold ? 'Sold Materials' : 'My Materials'}</h2>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div className="view-toggle">
            <button className={`view-toggle-btn ${view==='grid'?'active':''}`} onClick={()=>setView('grid')}><LayoutGrid size={14}/>Grid</button>
            <button className={`view-toggle-btn ${view==='table'?'active':''}`} onClick={()=>setView('table')}><List size={14}/>Table</button>
          </div>
          {!sold && <Link to="/seller/add" className="btn btn-primary btn-sm"><Plus size={14}/>Add Material</Link>}
        </div>
      </div>

      <input className="form-input" placeholder="Search materials..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:320}}/>

      {materials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={32}/></div>
          <h3>{sold ? 'No sold materials yet' : 'No listings yet'}</h3>
          {!sold && <p>Create your first scrap material listing to start receiving bids.</p>}
          {!sold && <Link to="/seller/add" className="btn btn-primary"><Plus size={16}/>Add First Material</Link>}
        </div>
      ) : view === 'grid' ? (
        <div className="materials-grid">
          {materials.map(m => (
            <div key={m._id} className="seller-mat-card">
              <div className="smc-img">
                {m.images?.[0] ? <img src={m.images[0]} alt={m.name}/> : <div className="smc-img-placeholder"><Package size={28}/></div>}
              </div>
              <div className="smc-body">
                <div className="smc-header">
                  <h4 className="smc-name">{m.name}</h4>
                  <span className={`badge ${m.auction?.status==='active'?'badge-green':m.auction?.status==='closed'?'badge-gray':'badge-amber'}`}>
                    {m.auction?.status || 'draft'}
                  </span>
                </div>
                <div className="smc-meta">
                  <span>{m.category}</span>·<span>{m.quantity} {m.unit}</span>
                </div>
                <div className="smc-prices">
                  <div className="smc-price-item"><div className="smc-price-label">Starting</div><div className="smc-price-val">₹{m.startingPrice?.toLocaleString()}</div></div>
                  <div className="smc-price-item"><div className="smc-price-label">Highest Bid</div><div className="smc-price-val green">₹{m.currentHighestBid?.toLocaleString()||'—'}</div></div>
                  <div className="smc-price-item"><div className="smc-price-label">Bids</div><div className="smc-price-val">{m.bidsCount||0}</div></div>
                </div>
                {m.auction?.endTime && m.auction?.status==='active' && (
                  <div className="smc-countdown"><Clock size={12}/>{formatDistanceToNow(new Date(m.auction.endTime),{addSuffix:false})} left</div>
                )}
                <div className="smc-footer" style={{marginTop:8}}>
                  <Link to={`/materials/${m._id}`} className="btn btn-ghost btn-sm"><Eye size={13}/>View</Link>
                  {!sold && m.auction?.status !== 'active' && (
                    <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(m)}><Pencil size={13}/>Edit</button>
                  )}
                  {!sold && m.auction?.status !== 'active' && <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(m._id)}><Trash2 size={13}/></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Category</th><th>Qty</th><th>Starting</th><th>Highest Bid</th><th>Bids</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {materials.map(m=>(
                <tr key={m._id}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.category}</td>
                  <td>{m.quantity} {m.unit}</td>
                  <td>₹{m.startingPrice?.toLocaleString()}</td>
                  <td>₹{m.currentHighestBid?.toLocaleString()||'—'}</td>
                  <td>{m.bidsCount||0}</td>
                  <td><span className={`badge ${m.auction?.status==='active'?'badge-green':m.auction?.status==='closed'?'badge-gray':'badge-amber'}`}>{m.auction?.status||'draft'}</span></td>
                  <td style={{display:'flex',gap:6}}>
                    <Link to={`/materials/${m._id}`} className="btn btn-ghost btn-sm"><Eye size={13}/></Link>
                    {!sold && m.auction?.status!=='active' && (
                      <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(m)}><Pencil size={13}/></button>
                    )}
                    {!sold && m.auction?.status!=='active' && <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(m._id)}><Trash2 size={13}/></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
