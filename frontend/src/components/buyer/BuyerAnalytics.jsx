import React, { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'
import api from '../../services/api'
import { buyerAPI } from '../../services/api'

export default function BuyerAnalytics({ setTitle }) {
  useEffect(() => setTitle('Analytics'), [])
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buyerAPI.getAnalytics()
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />)}
  </div>

  if (!data) return (
    <div className="empty-state">
      <div className="empty-state-icon"><BarChart3 size={32} /></div>
      <h3>No analytics data yet</h3>
      <p>Start bidding on materials to see your activity here.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2>Analytics</h2>
      {data.monthlySpend?.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Monthly Purchase Expenditure (₹)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.monthlySpend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Spent']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8 }} />
              <Bar dataKey="amount" fill="var(--amber-500)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.bidActivity?.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Bidding Activity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.bidActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="bids" stroke="var(--brand-primary)" strokeWidth={2} dot={{ fill: 'var(--brand-primary)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
