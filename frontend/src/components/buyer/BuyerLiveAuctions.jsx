import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Clock, Package } from 'lucide-react'
import { io } from 'socket.io-client'
import { materialsAPI } from '../../services/api'
import { formatDistanceToNow } from 'date-fns'
import './BuyerComponents.css'

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5002'

export default function BuyerLiveAuctions({ setTitle }) {
  useEffect(() => setTitle('Live Auctions'), [])
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const socketRef = useRef(null)
  const roomsRef  = useRef(new Set())

  // Fetch active auctions on mount
  useEffect(() => {
    materialsAPI.getAll({ status: 'active', sort: 'ending_soon', limit: 50 })
      .then(r => setItems(r.data.materials || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  // Create ONE socket and join a room for each active auction
  useEffect(() => {
    const token = localStorage.getItem('sb_token')

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      auth: token ? { token } : {},
    })
    socketRef.current = socket

    socket.on('bid:new', (data) => {
      const mid = data.materialId?.toString()
      if (!mid) return
      setItems(prev => prev.map(m =>
        m._id === mid
          ? { ...m, currentHighestBid: data.currentHighestBid, bidsCount: data.bidsCount }
          : m
      ))
    })

    socket.on('auction:closed', (data) => {
      const mid = data.materialId?.toString()
      if (!mid) return
      // Remove the closed auction from the live list
      setItems(prev => prev.filter(m => m._id !== mid))
      roomsRef.current.delete(mid)
    })

    return () => {
      socket.disconnect()
      roomsRef.current.clear()
    }
  }, [])

  // Whenever `items` changes, join any rooms we haven't joined yet
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return
    items.forEach(m => {
      if (!roomsRef.current.has(m._id)) {
        socket.emit('join:auction', m._id)
        roomsRef.current.add(m._id)
      }
    })
  }, [items])

  return (
    <div>
      <div className="section-header" style={{ textAlign: 'left', marginBottom: 20 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={22} style={{ color: 'var(--amber-500)' }} /> Live Auctions
        </h2>
        <p>Active auctions ending soonest. Place your bid before they close.</p>
      </div>

      {loading ? (
        <div className="materials-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Zap size={32} /></div>
          <h3>No live auctions right now</h3>
          <p>Check back soon or explore all available materials.</p>
          <Link to="/buyer/explore" className="btn btn-primary">Explore Materials</Link>
        </div>
      ) : (
        <div className="materials-grid">
          {items.map(m => (
            <Link key={m._id} to={`/materials/${m._id}`} className="material-card">
              <div className="mat-img-wrap">
                {m.images?.[0]
                  ? <img src={m.images[0]} alt={m.name} className="mat-img" />
                  : <div className="mat-img-placeholder"><Package size={32} /></div>}
                <div className="mat-status-badge">
                  <span className="badge badge-green">● Live</span>
                </div>
              </div>
              <div className="mat-body">
                <div className="mat-category">{m.category}</div>
                <h4 className="mat-name">{m.name}</h4>
                <div className="mat-prices">
                  <div className="mat-price-row">
                    <span className="mat-price-label">Current Bid</span>
                    <span className="mat-price highlight">
                      ₹{m.currentHighestBid?.toLocaleString() || m.startingPrice?.toLocaleString()}
                    </span>
                  </div>
                  <div className="mat-price-row">
                    <span className="mat-price-label">{m.bidsCount || 0} bids</span>
                  </div>
                </div>
                <div className="mat-countdown">
                  <Clock size={13} />
                  {m.auction?.endTime
                    ? formatDistanceToNow(new Date(m.auction.endTime), { addSuffix: false })
                    : '—'} remaining
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
