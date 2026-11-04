import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gavel, Trophy, TrendingUp, Clock, ArrowRight, Package } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../../services/api'
import './BuyerComponents.css'

export default function BuyerOverview({ setTitle }) {
  useEffect(() => setTitle('Overview'), [])

  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/buyer/stats')
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const STAT_CARDS = [
    { label: 'Total Bids',     value: stats?.totalBids     ?? '—', icon: <Gavel size={22} />,   color: 'stat-icon-blue' },
    { label: 'Active Bids',    value: stats?.activeBids    ?? '—', icon: <Clock size={22} />,    color: 'stat-icon-amber' },
    { label: 'Won Auctions',   value: stats?.wonAuctions   ?? '—', icon: <Trophy size={22} />,   color: 'stat-icon-green' },
    { label: 'Total Spent',    value: stats?.totalSpent ? `₹${(stats.totalSpent/100000).toFixed(1)}L` : '—', icon: <TrendingUp size={22} />, color: 'stat-icon-red' },
  ]

  const monthlyData = stats?.monthlyBids || []
  const wonLostData = stats?.wonLost ? [
    { name: 'Won',  value: stats.wonLost.won,  color: '#1B6B3A' },
    { name: 'Lost', value: stats.wonLost.lost, color: '#E2E8F0' },
  ] : []

  return (
    <div className="buyer-overview">
      {/* Stat cards */}
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

      {/* Charts row */}
      <div className="charts-row">
        <div className="chart-card card">
          <h3>Monthly Bidding Activity</h3>
          {loading ? (
            <div className="skeleton" style={{ height: 200, marginTop: 16 }} />
          ) : monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8 }} />
                <Bar dataKey="bids" fill="var(--brand-primary)" radius={[4,4,0,0]} name="Bids Placed" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <p>No bidding activity yet</p>
            </div>
          )}
        </div>

        <div className="chart-card card">
          <h3>Won vs Lost Auctions</h3>
          {loading ? (
            <div className="skeleton" style={{ height: 200, marginTop: 16 }} />
          ) : wonLostData.length > 0 && (wonLostData[0].value + wonLostData[1].value) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={wonLostData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {wonLostData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <p>No auction results yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="quick-actions card">
        <h3>Quick Actions</h3>
        <div className="quick-action-grid">
          <Link to="/buyer/explore" className="quick-action-btn">
            <Package size={20} /> Explore Materials <ArrowRight size={16} />
          </Link>
          <Link to="/buyer/auctions" className="quick-action-btn">
            <Clock size={20} /> Live Auctions <ArrowRight size={16} />
          </Link>
          <Link to="/buyer/bids" className="quick-action-btn">
            <Gavel size={20} /> My Bids <ArrowRight size={16} />
          </Link>
          <Link to="/buyer/profile" className="quick-action-btn">
            <Trophy size={20} /> Won Auctions <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
