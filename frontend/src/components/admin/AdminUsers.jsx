import React, { useEffect, useState, useCallback } from 'react'
import { adminAPI } from '../../services/api'
import { Search, UserX, UserCheck, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { syncClientUserStatus, removeClientUser } from '../../services/firebase'

// 300 ms debounce helper
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function AdminUsers({ setTitle }) {
  useEffect(() => setTitle('Users'), [])
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [role,        setRole]        = useState('all')
  const [suspending,  setSuspending]  = useState(null)
  const [deleting,    setDeleting]    = useState(null)

  const debouncedSearch = useDebounce(search)

  useEffect(() => {
    setLoading(true)
    adminAPI.getUsers({ search: debouncedSearch, role: role === 'all' ? '' : role })
      .then(r => setUsers(r.data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [debouncedSearch, role])

  const handleSuspend = async (user) => {
    const next = !user.isActive
    const label = next ? 'activate' : 'suspend'
    if (!window.confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} ${user.name}?`)) return
    setSuspending(user._id)
    try {
      await adminAPI.suspendUser(user._id, next)
      syncClientUserStatus(user._id, next)
      toast.success(`User ${next ? 'activated' : 'suspended'}`)
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: next } : u))
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${label} user`)
    } finally { setSuspending(null) }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.name} (${user.email})? This frees up their email address for re-registration.`)) return
    setDeleting(user._id)
    try {
      await adminAPI.deleteUser(user._id)
      removeClientUser(user._id)
      toast.success(`User ${user.email} deleted`)
      setUsers(prev => prev.filter(u => u._id !== user._id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    } finally { setDeleting(null) }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Users</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-input" style={{ width: 'auto' }} value={role} onChange={e => setRole(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="buyer">Buyers</option>
          <option value="seller">Sellers</option>
        </select>
      </div>

      {loading
        ? <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
        : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Business</th>
                  <th>Verification</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No users found</td></tr>
                ) : users.map(u => (
                  <tr key={u._id} style={{ opacity: u.isActive === false ? 0.55 : 1 }}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'seller' ? 'badge-green' : 'badge-blue'}`}>{u.role}</span>
                    </td>
                    <td>{u.businessProfile?.businessName || '—'}</td>
                    <td>
                      <span className={`badge ${
                        u.verificationStatus === 'approved' ? 'badge-green' :
                        u.verificationStatus === 'rejected' ? 'badge-red' : 'badge-amber'
                      }`}>{u.verificationStatus || 'not submitted'}</span>
                    </td>
                    <td>{u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className={`btn btn-sm ${u.isActive === false ? 'btn-secondary' : 'btn-ghost'}`}
                          onClick={() => handleSuspend(u)}
                          disabled={suspending === u._id}
                          title={u.isActive === false ? 'Activate user' : 'Suspend user'}
                        >
                          {suspending === u._id
                            ? '...'
                            : u.isActive === false
                              ? <><UserCheck size={13} /> Activate</>
                              : <><UserX size={13} /> Suspend</>
                          }
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          style={{ color: 'var(--red-600, #dc2626)' }}
                          onClick={() => handleDelete(u)}
                          disabled={deleting === u._id}
                          title="Permanently delete user"
                        >
                          {deleting === u._id ? '...' : <><Trash2 size={13} /> Delete</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  )
}
