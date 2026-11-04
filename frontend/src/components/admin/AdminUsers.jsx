import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import { Users, Search } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminUsers({ setTitle }) {
  useEffect(() => setTitle('Users'), [])
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [role,    setRole]    = useState('all')

  useEffect(() => {
    adminAPI.getUsers({ search, role: role === 'all' ? '' : role })
      .then(r => setUsers(r.data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [search, role])

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Users</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 'auto' }} value={role} onChange={e => setRole(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="buyer">Buyers</option>
          <option value="seller">Sellers</option>
        </select>
      </div>
      {loading ? <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Business</th><th>Verification</th><th>Registered</th></tr></thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No users found</td></tr>
              ) : users.map(u => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${u.role === 'seller' ? 'badge-green' : 'badge-blue'}`}>{u.role}</span></td>
                  <td>{u.businessProfile?.businessName || '—'}</td>
                  <td>
                    <span className={`badge ${
                      u.verificationStatus === 'approved' ? 'badge-green' :
                      u.verificationStatus === 'rejected' ? 'badge-red'   : 'badge-amber'
                    }`}>{u.verificationStatus || 'not submitted'}</span>
                  </td>
                  <td>{u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
