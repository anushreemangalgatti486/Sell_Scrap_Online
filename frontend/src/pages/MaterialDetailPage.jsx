import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { materialsAPI, bidsAPI } from '../services/api'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import { useRealtimeAuction } from '../hooks/useRealtimeAuction'
import {
  Clock, Package, MapPin, CheckCircle2, ArrowLeft,
  ChevronLeft, ChevronRight, TrendingUp, Scale, Gavel, User
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'
import './MaterialDetailPage.css'

function Countdown({ endTime }) {
  const [diff, setDiff] = useState('')
  useEffect(() => {
    const update = () => {
      const ms = new Date(endTime) - new Date()
      if (ms <= 0) { setDiff('Auction ended'); return }
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setDiff(`${h}h ${m}m ${s}s`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [endTime])
  return <span className="countdown-timer">{diff}</span>
}

export default function MaterialDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [material,   setMaterial]  = useState(null)
  const [bids,       setBids]      = useState([])
  const [loading,    setLoading]   = useState(true)
  const [bidAmount,  setBidAmount] = useState('')
  const [placing,    setPlacing]   = useState(false)
  const [accepting,  setAccepting] = useState(false)
  const [imgIdx,     setImgIdx]    = useState(0)

  const fetchMaterial = useCallback(async () => {
    try {
      const [matRes, bidRes] = await Promise.all([
        materialsAPI.getOne(id),
        bidsAPI.getForMaterial(id),
      ])
      setMaterial(matRes.data.material)
      setBids(bidRes.data.bids || [])
    } catch {
      toast.error('Material not found')
      navigate('/buyer/explore')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchMaterial()
  }, [fetchMaterial])

  // Real-time Cloud Firestore & Socket updates
  useRealtimeAuction(id, {
    onBidNew: (data) => {
      // Update bid stats instantly
      setMaterial(prev => prev ? {
        ...prev,
        currentHighestBid: data.currentHighestBid,
        bidsCount: data.bidsCount,
      } : prev)
      // Prepend new bid to history
      setBids(prev => [{
        _id:            Date.now().toString(),
        amount:         data.amount,
        anonymousLabel: data.anonymousLabel,
        createdAt:      data.createdAt,
      }, ...prev])
    },
    onAuctionClose: () => {
      // Refresh fully when auction closes so winner info shows
      fetchMaterial()
      toast('This auction has just closed.', { icon: '🔔' })
    },
  })

  const handleBid = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Please log in to place a bid'); navigate('/auth/login?role=buyer'); return }
    if (user.role !== 'buyer') { toast.error('Only buyers can place bids'); return }
    if (user.verificationStatus !== 'approved') { toast.error('Your business must be verified to bid'); return }
    const amount = parseFloat(bidAmount)
    if (!amount || isNaN(amount)) { toast.error('Please enter a valid bid amount'); return }
    const minBid = (material.currentHighestBid || material.startingPrice) + (material.minBidIncrement || 0)
    if (amount < minBid) { toast.error(`Minimum bid is ₹${minBid.toLocaleString()}`); return }
    setPlacing(true)
    try {
      await bidsAPI.place(id, amount)
      toast.success('Bid placed successfully!')
      setBidAmount('')
      fetchMaterial()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place bid')
    } finally {
      setPlacing(false)
    }
  }

  const handleSellerAcceptBid = async () => {
    if (!window.confirm(`Accept highest bid of ₹${material.currentHighestBid?.toLocaleString()}/${material.unit} and finalize the sale? This will close the auction and create a transaction.`)) return
    setAccepting(true)
    try {
      await materialsAPI.acceptBid(material._id)
      toast.success('Bid accepted! Auction closed and transaction created.')
      fetchMaterial()
      navigate('/seller/transactions')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept bid')
    } finally {
      setAccepting(false)
    }
  }

  const handleActivateAuction = async () => {
    try {
      await materialsAPI.activate(material._id)
      toast.success('Auction activated! It is now live for bidding.')
      fetchMaterial()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate auction')
    }
  }

  if (loading) return (
    <div className="detail-loading">
      <Navbar />
      <div style={{ padding: '120px 24px', display: 'flex', gap: 32 }}>
        <div className="skeleton" style={{ flex: 1, height: 400, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton" style={{ flex: 1, height: 400, borderRadius: 'var(--radius-lg)' }} />
      </div>
    </div>
  )

  if (!material) return null

  const isActive   = material.auction?.status === 'active'
  const isEnded    = material.auction?.status === 'closed'
  const images     = material.images?.length > 0 ? material.images : []
  const minNextBid = (material.currentHighestBid || material.startingPrice) + (material.minBidIncrement || 0)
  const isOwner    = user?._id && (material.seller?._id === user._id || material.seller === user._id)
  const canBid     = user?.role === 'buyer' && user?.verificationStatus === 'approved' && isActive && !isOwner

  return (
    <div className="detail-page">
      <Navbar />
      <div className="detail-container container">
        {/* Breadcrumb */}
        <div className="detail-breadcrumb">
          <Link to="/buyer/explore"><ArrowLeft size={14} /> Back to materials</Link>
          <span>/</span>
          <span>{material.category}</span>
          <span>/</span>
          <span>{material.name}</span>
        </div>

        {/* Main split */}
        <div className="detail-split">
          {/* LEFT — Images */}
          <div className="detail-images">
            <div className="main-image-wrap">
              {images.length > 0 ? (
                <img src={images[imgIdx]} alt={material.name} className="main-image" />
              ) : (
                <div className="main-image-placeholder">
                  <Package size={48} />
                  <span>No image available</span>
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button className="img-nav prev" onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}>
                    <ChevronLeft size={18} />
                  </button>
                  <button className="img-nav next" onClick={() => setImgIdx(i => (i + 1) % images.length)}>
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="thumbnail-row">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`thumbnail ${i === imgIdx ? 'active' : ''}`}
                    onClick={() => setImgIdx(i)}
                  >
                    <img src={img} alt={`thumb-${i}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Info & Bidding */}
          <div className="detail-info">
            <div className="detail-badges">
              <span className="badge badge-gray">{material.category}</span>
              {isActive  && <span className="badge badge-green">● Live Auction</span>}
              {isEnded   && <span className="badge badge-gray">Auction Ended</span>}
              {material.seller?.verificationStatus === 'approved' && (
                <span className="badge badge-blue"><CheckCircle2 size={11} /> Verified Seller</span>
              )}
            </div>

            <h1 className="detail-title">{material.name}</h1>

            <div className="detail-specs">
              <div className="spec-row"><span>Grade / Quality</span><strong>{material.grade || 'N/A'}</strong></div>
              <div className="spec-row"><span>Quantity</span><strong>{material.quantity} {material.unit}</strong></div>
              <div className="spec-row"><span>Location</span><strong><MapPin size={13} /> {material.location || 'Not specified'}</strong></div>
            </div>

            <div className="price-card">
              <div className="price-row">
                <div>
                  <div className="price-label">Starting Price</div>
                  <div className="price-value">₹{material.startingPrice?.toLocaleString()}<span className="price-unit">/{material.unit}</span></div>
                </div>
                <div>
                  <div className="price-label">Current Highest Bid</div>
                  <div className="price-value highlight">₹{material.currentHighestBid ? material.currentHighestBid.toLocaleString() : '—'}<span className="price-unit">/{material.unit}</span></div>
                </div>
              </div>
              <div className="price-bids-count">{material.bidsCount || 0} bid{material.bidsCount !== 1 ? 's' : ''} placed</div>
            </div>

            {material.auction?.endTime && (
              <div className="countdown-card">
                <Clock size={16} />
                {isActive ? (
                  <div>
                    <div className="countdown-label">Auction closes in</div>
                    <Countdown endTime={material.auction.endTime} />
                  </div>
                ) : isEnded ? (
                  <div>
                    <div className="countdown-label">Auction closed</div>
                    <span>{format(new Date(material.auction.endTime), 'dd MMM yyyy, hh:mm a')}</span>
                  </div>
                ) : (
                  <div>
                    <div className="countdown-label">Auction starts in</div>
                    {material.auction?.startTime ? (
                      <Countdown endTime={material.auction.startTime} />
                    ) : (
                      <span>Scheduled</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bid form / Seller action panel */}
            {isOwner ? (
              <div className="bid-cta-box" style={{ background: 'var(--bg-card)', border: '1.5px solid var(--brand-primary)', padding: 18, borderRadius: 'var(--radius-lg)' }}>
                <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-primary)' }}>
                  <Package size={16} /> Seller Control Panel
                </h4>
                <p style={{ fontSize: '0.875rem', marginBottom: 12, color: 'var(--text-muted)' }}>
                  You listed this material. Sellers cannot place bids on their own materials.
                </p>
                {isActive ? (
                  material.currentHighestBid ? (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={handleSellerAcceptBid}
                      disabled={accepting}
                    >
                      {accepting ? 'Accepting Bid...' : <><CheckCircle2 size={16} /> Accept Highest Bid (₹{material.currentHighestBid?.toLocaleString()}/{material.unit})</>}
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      ● Live Auction: Waiting for buyers to place bids.
                    </div>
                  )
                ) : isEnded ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span className="badge badge-blue">✓ Auction Closed / Sold</span>
                    <Link to="/seller/transactions" className="btn btn-primary btn-sm">View Transaction Details</Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Status: <strong>Scheduled</strong> (starts {material.auction?.startTime ? format(new Date(material.auction.startTime), 'dd MMM yyyy, hh:mm a') : 'soon'}).
                    </p>
                    <button className="btn btn-primary btn-sm" onClick={handleActivateAuction} style={{ alignSelf: 'flex-start' }}>
                      <Gavel size={14} /> Start Auction Live Now
                    </button>
                  </div>
                )}
              </div>
            ) : canBid ? (
              <form className="bid-form" onSubmit={handleBid}>
                <div className="form-group">
                  <label className="form-label">Your Bid Amount (₹/{material.unit})</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      className="form-input"
                      placeholder={`Min. ₹${minNextBid.toLocaleString()}`}
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      min={minNextBid}
                      step={material.minBidIncrement || 1}
                      required
                    />
                    <button type="submit" className="btn btn-primary" disabled={placing} style={{ whiteSpace: 'nowrap' }}>
                      {placing ? <><div className="spinner" /> Placing...</> : <><Gavel size={15} /> Place Bid</>}
                    </button>
                  </div>
                  <p className="form-hint">Minimum bid increment: ₹{(material.minBidIncrement || 0).toLocaleString()}</p>
                </div>
              </form>
            ) : !user ? (
              <div className="bid-cta-box">
                <p>Please log in as a verified buyer to place a bid.</p>
                <Link to="/auth/login?role=buyer" className="btn btn-primary">Login to Bid</Link>
              </div>
            ) : isEnded ? (
              <div className="bid-cta-box">
                <p style={{ color: 'var(--text-muted)' }}>This auction has ended.</p>
                {material.currentHighestBid ? <span className="badge badge-green">Winning Bid: ₹{material.currentHighestBid?.toLocaleString()}/{material.unit}</span> : null}
              </div>
            ) : !isActive ? (
              <div className="bid-cta-box">
                <h4 style={{ margin: '0 0 6px 0' }}>⏰ Auction Scheduled</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                  This auction starts on <strong>{material.auction?.startTime ? format(new Date(material.auction.startTime), 'dd MMM yyyy, hh:mm a') : 'soon'}</strong>. Bidding opens once the auction goes live.
                </p>
              </div>
            ) : user.role !== 'buyer' ? (
              <div className="bid-cta-box">
                <p>You are logged in with a <strong>{user.role}</strong> account. Only buyers can place bids.</p>
                <Link to="/auth/login?role=buyer" className="btn btn-secondary btn-sm">Switch to Buyer Account</Link>
              </div>
            ) : (
              <div className="bid-cta-box" style={{ background: 'var(--amber-50, #fffbeb)', border: '1px solid var(--amber-200, #fde68a)' }}>
                <h4 style={{ margin: '0 0 4px 0', color: 'var(--amber-800, #92400e)' }}>🔒 Business Verification Required</h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--amber-700, #b45309)' }}>
                  Your business verification status is <strong>{user.verificationStatus?.replace('_', ' ') || 'not verified'}</strong>. Industrial auctions require business KYC approval before placing bids.
                </p>
                <Link to="/auth/verify" className="btn btn-primary btn-sm">Submit Business Verification</Link>
              </div>
            )}

            {/* Delivery terms */}
            <div className="detail-terms">
              <h4>Pickup / Delivery</h4>
              <p>{material.deliveryTerms || 'Buyer coordinates pickup from seller\'s warehouse. Weighment at buyer\'s or mutually agreed location.'}</p>
            </div>
          </div>
        </div>

        {/* Bottom sections */}
        <div className="detail-bottom">
          {/* Description */}
          <div className="card detail-section">
            <h3>Material Description</h3>
            <p>{material.description || 'No description provided.'}</p>
            {material.specifications && (
              <>
                <h4 style={{ marginTop: 16, marginBottom: 8 }}>Specifications</h4>
                <p>{material.specifications}</p>
              </>
            )}
          </div>

          {/* Bid history */}
          <div className="card detail-section">
            <h3>Bid History</h3>
            {bids.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No bids placed yet. Be the first to bid!</p>
            ) : (
              <div className="bid-history">
                {bids.map((b, i) => (
                  <div key={b._id || i} className={`bid-history-row ${i === 0 ? 'top-bid' : ''}`}>
                    <div className="bid-bidder">
                      <User size={14} />
                      {isActive ? b.anonymousLabel || `Buyer ${String(i + 1).padStart(2, '0')}` : (i === 0 ? (b.bidder?.businessName || 'Winner') : b.anonymousLabel || `Buyer ${String(i + 1).padStart(2, '0')}`)}
                      {i === 0 && isEnded && <span className="badge badge-green" style={{ marginLeft: 6 }}>Winner</span>}
                    </div>
                    <div className="bid-amount">₹{b.amount?.toLocaleString()}/{material.unit}</div>
                    <div className="bid-time">{b.createdAt ? formatDistanceToNow(new Date(b.createdAt), { addSuffix: true }) : '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seller info */}
          <div className="card detail-section">
            <h3>Seller Information</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {material.seller?.businessName?.charAt(0) || 'S'}
              </div>
              <div>
                <strong>{material.seller?.businessName || 'Verified Seller'}</strong>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {material.seller?.verificationStatus === 'approved' && <span className="badge badge-green"><CheckCircle2 size={11} /> KYC Verified</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
