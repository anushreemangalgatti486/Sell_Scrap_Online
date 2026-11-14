import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, CheckCircle2, X, Plus, Eye } from 'lucide-react'
import { materialsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import './SellerComponents.css'

const CATEGORIES = ['Iron & Steel', 'Copper', 'Aluminium', 'Paper', 'Plastic', 'Wood', 'E-Waste', 'Industrial', 'Other']
const UNITS      = ['kg', 'tonnes', 'pieces', 'litres']
const STEPS      = ['Material Info', 'Images & Stock', 'Pricing & Auction', 'Review & Publish']

const initForm = {
  // Step 1
  name: '', category: '', materialType: '', grade: '', description: '',
  // Step 2
  images: [], quantity: '', unit: 'tonnes', location: '', stockAvailability: 'available',
  // Step 3
  startingPrice: '', minAcceptablePrice: '', minBidIncrement: '', auctionStartDate: '', auctionEndDate: '', deliveryTerms: '',
  // Step 4
  agreedToTerms: false,
}

export default function SellerAddMaterial({ setTitle }) {
  useEffect(() => setTitle('Add Material'), [])
  const navigate = useNavigate()
  const [step,    setStep]    = useState(0)
  const [form,    setForm]    = useState(initForm)
  const [loading, setLoading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState([])

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [k]: val }))
  }

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files)
    if (form.images.length + files.length > 6) { toast.error('Maximum 6 images allowed'); return }
    setForm(f => ({ ...f, images: [...f.images, ...files] }))
    setPreviewUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const removeImage = (i) => {
    setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))
    setPreviewUrls(prev => prev.filter((_, idx) => idx !== i))
  }

  const validateStep = () => {
    if (step === 0) {
      if (!form.name || !form.category) { toast.error('Material name and category are required'); return false }
    }
    if (step === 1) {
      if (!form.quantity || !form.location) { toast.error('Quantity and location are required'); return false }
    }
    if (step === 2) {
      if (!form.startingPrice || !form.minBidIncrement || !form.auctionStartDate || !form.auctionEndDate) {
        toast.error('Please fill all pricing and auction fields')
        return false
      }
      if (new Date(form.auctionEndDate) <= new Date(form.auctionStartDate)) {
        toast.error('Auction end date must be after start date')
        return false
      }
      if (parseFloat(form.startingPrice) <= 0) { toast.error('Starting price must be greater than 0'); return false }
    }
    if (step === 3) {
      if (!form.agreedToTerms) { toast.error('Please agree to the auction terms'); return false }
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    setLoading(true)
    try {
      const fd = new FormData()
      // Text fields
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'images') return
        if ((k === 'auctionStartDate' || k === 'auctionEndDate') && v) {
          fd.append(k, new Date(v).toISOString())
        } else {
          fd.append(k, v)
        }
      })
      // Images
      form.images.forEach(img => fd.append('images', img))
      await materialsAPI.create(fd)
      toast.success('Material listed successfully!')
      navigate('/seller/materials')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-material-page">
      {/* Step progress */}
      <div className="wizard-progress">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className={`wizard-progress-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
              <div className="wp-circle">{i < step ? <CheckCircle2 size={14} /> : i + 1}</div>
              <span className="wp-label">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`wp-line ${i < step ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="wizard-card card">
        {/* Step 0: Material Info */}
        {step === 0 && (
          <div className="wizard-step-content">
            <h3 className="step-title">Step 1: Material Information</h3>
            <div className="wizard-form">
              <div className="form-group">
                <label className="form-label">Material Name *</label>
                <input className="form-input" placeholder="e.g., MS Plate Scrap" value={form.name} onChange={set('name')} required />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-input" value={form.category} onChange={set('category')} required>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Material Type</label>
                  <input className="form-input" placeholder="e.g., HMS 1 & 2, OCC, HDPE" value={form.materialType} onChange={set('materialType')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Grade / Quality</label>
                <input className="form-input" placeholder="e.g., Grade A, Mixed, Prime" value={form.grade} onChange={set('grade')} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={4} placeholder="Describe the material, its condition and any other relevant details..." value={form.description} onChange={set('description')} />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Images & Stock */}
        {step === 1 && (
          <div className="wizard-step-content">
            <h3 className="step-title">Step 2: Images & Stock</h3>
            <div className="wizard-form">
              <div className="form-group">
                <label className="form-label">Material Images (up to 6)</label>
                <div className="image-upload-grid">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="img-preview-item">
                      <img src={url} alt={`preview-${i}`} />
                      <button type="button" className="img-remove-btn" onClick={() => removeImage(i)}><X size={12} /></button>
                    </div>
                  ))}
                  {previewUrls.length < 6 && (
                    <label className="img-add-slot">
                      <Plus size={24} />
                      <span>Add Photo</span>
                      <input type="file" hidden accept="image/*" multiple onChange={handleImageAdd} />
                    </label>
                  )}
                </div>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Available Quantity *</label>
                  <input className="form-input" type="number" placeholder="e.g., 15" value={form.quantity} onChange={set('quantity')} min="0.1" step="0.1" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit *</label>
                  <select className="form-input" value={form.unit} onChange={set('unit')}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Warehouse / Pickup Location *</label>
                <input className="form-input" placeholder="City, State — e.g., Pune, Maharashtra" value={form.location} onChange={set('location')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Availability</label>
                <select className="form-input" value={form.stockAvailability} onChange={set('stockAvailability')}>
                  <option value="available">Available Now</option>
                  <option value="upcoming">Upcoming (within 7 days)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {step === 2 && (
          <div className="wizard-step-content">
            <h3 className="step-title">Step 3: Pricing & Auction</h3>
            <div className="wizard-form">
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Starting Price (₹/{form.unit}) *</label>
                  <input className="form-input" type="number" placeholder="e.g., 28000" value={form.startingPrice} onChange={set('startingPrice')} min="1" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Min. Bid Increment (₹) *</label>
                  <input className="form-input" type="number" placeholder="e.g., 500" value={form.minBidIncrement} onChange={set('minBidIncrement')} min="1" required />
                </div>
              </div>
              <div className="form-group confidential-field">
                <label className="form-label">🔒 Minimum Acceptable Price (₹/{form.unit})</label>
                <input className="form-input" type="number" placeholder="Your private reserve price" value={form.minAcceptablePrice} onChange={set('minAcceptablePrice')} min="1" />
                <p className="form-hint" style={{ color: 'var(--amber-600)', fontWeight: 500 }}>
                  This price is confidential — it is never shown to buyers or included in any public response.
                </p>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Auction Start Date & Time *</label>
                  <input className="form-input" type="datetime-local" value={form.auctionStartDate} onChange={set('auctionStartDate')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Auction End Date & Time *</label>
                  <input className="form-input" type="datetime-local" value={form.auctionEndDate} onChange={set('auctionEndDate')} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Pickup / Delivery Terms</label>
                <textarea className="form-input" rows={3} placeholder="e.g., Buyer arranges pickup. Weighment at buyer's premises." value={form.deliveryTerms} onChange={set('deliveryTerms')} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="wizard-step-content">
            <h3 className="step-title">Step 4: Review & Publish</h3>
            <div className="review-grid">
              <div className="review-card">
                <h4>Material Information</h4>
                <div className="review-row"><span>Name</span><strong>{form.name}</strong></div>
                <div className="review-row"><span>Category</span><strong>{form.category}</strong></div>
                <div className="review-row"><span>Type</span><strong>{form.materialType || '—'}</strong></div>
                <div className="review-row"><span>Grade</span><strong>{form.grade || '—'}</strong></div>
              </div>
              <div className="review-card">
                <h4>Stock Details</h4>
                <div className="review-row"><span>Quantity</span><strong>{form.quantity} {form.unit}</strong></div>
                <div className="review-row"><span>Location</span><strong>{form.location}</strong></div>
                <div className="review-row"><span>Images</span><strong>{form.images.length} uploaded</strong></div>
              </div>
              <div className="review-card">
                <h4>Auction Details</h4>
                <div className="review-row"><span>Starting Price</span><strong>₹{parseFloat(form.startingPrice || 0).toLocaleString()}/{form.unit}</strong></div>
                <div className="review-row"><span>Min. Bid Increment</span><strong>₹{form.minBidIncrement}</strong></div>
                <div className="review-row"><span>Start Time</span><strong>{form.auctionStartDate ? new Date(form.auctionStartDate).toLocaleString() : '—'}</strong></div>
                <div className="review-row"><span>End Time</span><strong>{form.auctionEndDate ? new Date(form.auctionEndDate).toLocaleString() : '—'}</strong></div>
                <div className="review-row confidential-row"><span>Min. Acceptable Price</span><strong>🔒 Confidential</strong></div>
              </div>
            </div>
            {previewUrls.length > 0 && (
              <div className="review-images">
                <h4>Material Images</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {previewUrls.map((url, i) => (
                    <img key={i} src={url} style={{ width: 80, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }} alt="" />
                  ))}
                </div>
              </div>
            )}
            <div className="terms-check">
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.agreedToTerms} onChange={set('agreedToTerms')} style={{ marginTop: 4, flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem' }}>
                  I agree to ScrapBazaar's auction terms and confirm that all material details provided are accurate. I understand that once bidding begins, auction-critical details cannot be changed without cancelling the auction.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="wizard-nav">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
              ← Previous Step
            </button>
          )}
          <div style={{ marginLeft: 'auto' }}>
            {step < 3 ? (
              <button className="btn btn-primary" onClick={handleNext}>
                Next Step →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? <><div className="spinner" /> Publishing...</> : '🚀 Publish Listing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
