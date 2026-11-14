import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { BarChart3, Gavel, Trophy, TrendingUp, CreditCard, Package, ArrowRight } from 'lucide-react'
import { buyerAPI } from '../../services/api'
import './BuyerComponents.css'

export default function BuyerAnalytics({ setTitle }) {
  useEffect(() => setTitle('Analytics'), [])
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buyerAPI.getAnalytics()
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="stats-row">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    )
  }

  const hasActivity = data && (
    (data.totalBids && data.totalBids > 0) ||
    (data.bidActivity && data.bidActivity.some(b => b.bids > 0)) ||
    (data.totalSpend && data.totalSpend > 0)
  )

  if (!data || !hasActivity) {
    return (
      <div className="empty-state card" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div className="empty-state-icon" style={{ margin: '0 auto 16px' }}><BarChart3 size={36} /></div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: 8 }}>No Bidding Analytics Yet</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto 20px', fontSize: '0.9rem' }}>
          You haven't placed any bids yet. Explore available scrap auctions and start bidding to see your live engagement, win rate, and spend analytics.
        </p>
        <Link to="/buyer/explore" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Package size={16} /> Explore Materials & Start Bidding <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  const STAT_CARDS = [
    {
      label: 'Total Bids Placed',
      value: data.totalBids ?? 0,
      sub: `${data.activeBids || 0} active • ${data.lostBids || 0} outbid`,
      icon: <Gavel size={22} />,
      color: 'stat-icon-blue'
    },
    {
      label: 'Auctions Won',
      value: data.wonAuctions ?? 0,
      sub: data.wonAuctions > 0 ? 'Successful acquisitions' : '0 won so far',
      icon: <Trophy size={22} />,
      color: 'stat-icon-green'
    },
    {
      label: 'Win Rate',
      value: `${data.winRate ?? 0}%`,
      sub: `${data.wonAuctions || 0} of ${data.totalBids || 0} bids`,
      icon: <TrendingUp size={22} />,
      color: 'stat-icon-amber'
    },
    {
      label: 'Total Expenditure',
      value: `₹${(data.totalSpend || 0).toLocaleString()}`,
      sub: data.avgBid ? `Avg bid: ₹${data.avgBid.toLocaleString()}` : 'No purchases yet',
      icon: <CreditCard size={22} />,
      color: 'stat-icon-red'
    },
  ]

  const totalBidsCount = data.totalBids || 0
  const maxBidActivity = Math.max(...(data.bidActivity?.map(b => b.bids) || [0]), 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ margin: '0 0 4px 0' }}>Bidding & Spend Analytics</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
          Comprehensive overview of your auction activity, bidding volume, material interests, and purchase expenditures.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="stats-row">
        {STAT_CARDS.map((c, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${c.color}`}>{c.icon}</div>
            <div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Primary Charts: Activity & Category Interest */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Monthly Bidding Activity */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Bidding Activity (Last 6 Months)</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total bids submitted per month</span>
            </div>
            <span className="badge badge-blue">{totalBidsCount} Bid{totalBidsCount !== 1 ? 's' : ''} Total</span>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.bidActivity || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis allowDecimals={false} domain={[0, maxBidActivity]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <Tooltip
                formatter={(v) => [`${v} bids placed`, 'Volume']}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8 }}
              />
              <Bar dataKey="bids" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Material Demand by Category</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bids placed per scrap category</span>
            </div>
            <span className="badge badge-amber">{data.categoryDistribution?.length || 0} Categories</span>
          </div>

          {data.categoryDistribution && data.categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.categoryDistribution} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} width={80} />
                <Tooltip
                  formatter={(v) => [`${v} bids`, 'Bids']}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8 }}
                />
                <Bar dataKey="bids" fill="var(--amber-500)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No category data yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Purchase Expenditure */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Monthly Purchase Expenditure (₹)</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total value of won auctions and successful transactions
            </span>
          </div>
          {data.totalSpend > 0 ? (
            <span className="badge badge-green">₹{(data.totalSpend).toLocaleString()} Total Spent</span>
          ) : (
            <span className="badge badge-gray">₹0 Spent (0 Won Auctions)</span>
          )}
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.monthlySpend || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
            />
            <Tooltip
              formatter={(v) => [`₹${v.toLocaleString()}`, 'Spent']}
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8 }}
            />
            <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
