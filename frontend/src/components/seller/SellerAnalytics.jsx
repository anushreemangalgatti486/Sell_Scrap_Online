import React, { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'
import api from '../../services/api'
import { sellerAPI } from '../../services/api'

export default function SellerAnalytics({ setTitle }) {
  useEffect(() => setTitle('Analytics'), [])
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sellerAPI.getAnalytics()
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display:'flex',flexDirection:'column',gap:20 }}>{[1,2].map(i=><div key={i} className="skeleton" style={{height:260,borderRadius:'var(--radius-lg)'}}/>)}</div>

  if (!data) return (
    <div className="empty-state">
      <div className="empty-state-icon"><BarChart3 size={32}/></div>
      <h3>No analytics data yet</h3>
      <p>Start listing materials to see your sales analytics here.</p>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <h2>Analytics</h2>
      {data.monthlySales?.length > 0 && (
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ marginBottom:16 }}>Monthly Revenue (₹)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
              <XAxis dataKey="month" tick={{fontSize:12,fill:'var(--text-muted)'}}/>
              <YAxis tick={{fontSize:12,fill:'var(--text-muted)'}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>[`₹${v.toLocaleString()}`,'Revenue']} contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border-light)',borderRadius:8}}/>
              <Bar dataKey="revenue" fill="var(--brand-primary)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.demandByCategory?.length > 0 && (
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ marginBottom:16 }}>Material Demand by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.demandByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
              <XAxis type="number" tick={{fontSize:12,fill:'var(--text-muted)'}}/>
              <YAxis dataKey="category" type="category" tick={{fontSize:12,fill:'var(--text-muted)'}} width={80}/>
              <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border-light)',borderRadius:8}}/>
              <Bar dataKey="bids" fill="var(--amber-500)" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
