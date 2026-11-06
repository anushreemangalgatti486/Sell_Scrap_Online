import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Gavel, ShoppingBag, TrendingUp, Plus, ArrowRight, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import api from '../../services/api'
import { sellerAPI } from '../../services/api'
import '../buyer/BuyerComponents.css'
import './SellerComponents.css'

export default function SellerOverview({ setTitle }) {
  useEffect(() => setTitle('Overview'), [])
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sellerAPI.getStats()
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const STAT_CARDS = [
    { label: 'Total Listings',  value: stats?.totalListings  ?? '—', icon: <Package     size={22} />, color: 'stat-icon-blue'  },
    { label: 'Active Auctions', value: stats?.activeAuctions ?? '—', icon: <Clock       size={22} />, color: 'stat-icon-amber' },
    { label: 'Successful Sales',value: stats?.successfulSales ?? '—', icon: <ShoppingBag size={22} />, color: 'stat-icon-green' },
    { label: 'Total Revenue',   value: stats?.totalRevenue ? `₹${(stats.totalRevenue/100000).toFixed(1)}L` : '—', icon: <TrendingUp size={22} />, color: 'stat-icon-red' },
  ]

  return (
    <div className="buyer-overview">
      <div className="stats-row">
        {STAT_CARDS.map((c, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${c.color}`}>{c.icon}</div>
            <div>
              <div className="stat-value">{loading ? <div className="skeleton" style={{ width: 60, height: 28 }} /> : c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-card card">
          <h3>Monthly Sales Revenue (₹)</h3>
          {loading ? (
            <div className="skeleton" style={{ height: 200, marginTop: 16 }} />
          ) : stats?.monthlySales?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="var(--brand-primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No sales data yet</p></div>}
        </div>

        <div className="chart-card card">
          <h3>Bidding Activity</h3>
          {loading ? (
            <div className="skeleton" style={{ height: 200, marginTop: 16 }} />
          ) : stats?.biddingActivity?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.biddingActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="bids" stroke="var(--amber-500)" strokeWidth={2} dot={{ r: 4, fill: 'var(--amber-500)' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No data yet</p></div>}
        </div>
      </div>

      <div className="quick-actions card">
        <h3>Quick Actions</h3>
        <div className="quick-action-grid">
          <Link to="/seller/add"       className="quick-action-btn"><Plus      size={20} /> Add New Material  <ArrowRight size={16} /></Link>
          <Link to="/seller/materials" className="quick-action-btn"><Package   size={20} /> My Listings       <ArrowRight size={16} /></Link>
          <Link to="/seller/bids"      className="quick-action-btn"><Gavel     size={20} /> View Live Bids    <ArrowRight size={16} /></Link>
          <Link to="/seller/sold"      className="quick-action-btn"><ShoppingBag size={20} /> Sold Materials  <ArrowRight size={16} /></Link>
        </div>
      </div>
    </div>
  )
}
