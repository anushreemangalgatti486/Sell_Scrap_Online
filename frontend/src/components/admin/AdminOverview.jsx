import React, { useEffect, useState } from 'react'
import { Users, Package, Gavel, CreditCard, ShieldCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { adminAPI } from '../../services/api'
import { Link } from 'react-router-dom'
import '../buyer/BuyerComponents.css'

export default function AdminOverview({ setTitle }) {
  useEffect(() => setTitle('Admin Overview'), [])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const CARDS = [
    { label: 'Total Users',         value: stats?.totalUsers        ?? '—', icon: <Users      size={22} />, color: 'stat-icon-blue',  link: '/admin/users' },
    { label: 'Pending Verifications', value: stats?.pendingVerifications ?? '—', icon: <ShieldCheck size={22} />, color: 'stat-icon-amber', link: '/admin/verifications' },
    { label: 'Active Listings',     value: stats?.activeListings    ?? '—', icon: <Package    size={22} />, color: 'stat-icon-green', link: '/admin/listings' },
    { label: 'Active Auctions',     value: stats?.activeAuctions    ?? '—', icon: <Gavel      size={22} />, color: 'stat-icon-red',   link: '/admin/auctions' },
  ]

  return (
    <div className="buyer-overview">
      <div className="stats-row">
        {CARDS.map((c, i) => (
          <Link key={i} to={c.link} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer' }}>
              <div className={`stat-icon ${c.color}`}>{c.icon}</div>
              <div>
                <div className="stat-value">{loading ? <div className="skeleton" style={{ width: 60, height: 28 }} /> : c.value}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {stats?.platformActivity?.length > 0 && (
        <div className="chart-card card">
          <h3>Platform Activity (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.platformActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8 }} />
              <Bar dataKey="newUsers"    fill="var(--brand-primary)" name="New Users"    radius={[2,2,0,0]} />
              <Bar dataKey="newListings" fill="var(--amber-500)"     name="New Listings" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="quick-actions card">
        <h3>Quick Actions</h3>
        <div className="quick-action-grid">
          <Link to="/admin/verifications" className="quick-action-btn"><ShieldCheck size={20} /> Review Verifications</Link>
          <Link to="/admin/users"         className="quick-action-btn"><Users       size={20} /> Manage Users</Link>
          <Link to="/admin/listings"      className="quick-action-btn"><Package     size={20} /> Review Listings</Link>
          <Link to="/admin/auctions"      className="quick-action-btn"><Gavel       size={20} /> Monitor Auctions</Link>
        </div>
      </div>
    </div>
  )
}
