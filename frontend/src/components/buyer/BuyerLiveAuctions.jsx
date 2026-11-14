import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Clock, Package, RefreshCw } from 'lucide-react'
import { io } from 'socket.io-client'
import { materialsAPI } from '../../services/api'
import { formatDistanceToNow } from 'date-fns'
import './BuyerComponents.css'

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5002'

export default function BuyerLiveAuctions({ setTitle }) {
  useEffect(() => setTitle('Live Auctions'), [])
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)
  const roomsRef  = useRef(new Set())

  const fetchAuctions = useCallback(() => {
    setLoading(true)
    materialsAPI.getAll({ status: 'active', sort: 'ending_soon', limit: 50 })
      .then(r => setItems(r.data.materials || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  // Fetch on mount
  useEffect(() => { fetchAuctions() }, [fetchAuctions])

  // Create socket once and keep it alive
  useEffect(() => {
    const token = localStorage.getItem('sb_token')
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: token ? { token } : {},
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      // Re-join all rooms after reconnect
      roomsRef.current.forEach(id => socket.emit('join:auction', id))
    })

    socket.on('disconnect', () => setConnected(false))

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
      setItems(prev => prev.filter(m => m._id !== mid))
      roomsRef.current.delete(mid)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      roomsRef.current.clear()
    }
  }, [])

  // Join new rooms whenever items list changes
  useEffect(() => {
    const socket = socketRef.current
    if (!socket?.connected) return
    items.forEach(m => {
      if (!roomsRef.current.has(m._id)) {
        socket.emit('join:auction', m._id)
        roomsRef.current.add(m._id)
      }
    })
  }, [items, connected])  // re-run when connection restores

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={22} style={{ color: 'var(--amber-500)' }} /> Live Auctions
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Active auctions ending soonest. Place your bid before they close.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', color: connected ? 'var(--brand-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? 'var(--brand-primary)' : 'var(--text-muted)', display: 'inline-block' }} />
            {connected ? 'Live' : 'Connecting...'}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={fetchAuctions} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
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
