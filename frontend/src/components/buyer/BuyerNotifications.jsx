import React, { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { notificationsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function BuyerNotifications({ setTitle }) {
  useEffect(() => setTitle('Notifications'), [])
  const { clearUnread } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    notificationsAPI.getMine()
      .then(r => {
        setNotifications(r.data.notifications || [])
        // Clear the bell badge when this page is opened
        clearUnread()
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }, [])

  // Prepend new notifications that arrive via socket while this page is open
  // Deduplicate by _id to prevent duplicates on reconnect
  useEffect(() => {
    const handler = (event) => {
      if (!event.detail) return
      setNotifications(prev => {
        const exists = prev.some(n => n._id?.toString() === event.detail._id?.toString())
        if (exists) return prev
        return [event.detail, ...prev]
      })
    }
    window.addEventListener('sb:notification', handler)
    return () => window.removeEventListener('sb:notification', handler)
  }, [])

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      setNotifications(n => n.map(x => ({ ...x, read: true })))
      toast.success('All notifications marked as read')
    } catch { toast.error('Failed to mark notifications') }
  }

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id)
      setNotifications(n => n.map(x => x._id === id ? { ...x, read: true } : x))
    } catch {}
  }

  const ICON_MAP = {
    bid_placed:     '💰',
    outbid:         '📈',
    auction_won:    '🏆',
    auction_lost:   '❌',
    verification:   '✅',
    payment:        '💳',
    transaction:    '📦',
    general:        '🔔',
  }

  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Notifications</h2>
        {notifications.some(n => !n.read) && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Bell size={32} /></div>
          <h3>No notifications yet</h3>
          <p>You'll receive updates about bids, auctions and transactions here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {notifications.map(n => (
            <div
              key={n._id}
              onClick={() => !n.read && markRead(n._id)}
              style={{
                display: 'flex',
                gap: 14,
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-light)',
                background: n.read ? 'var(--bg-card)' : 'var(--brand-light)',
                cursor: n.read ? 'default' : 'pointer',
                transition: 'background var(--transition)',
              }}
            >
              <div style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: 2 }}>{ICON_MAP[n.type] || '🔔'}</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text-primary)', marginBottom: 2, fontWeight: n.read ? 400 : 600 }}>{n.message}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : '—'}
                </p>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-primary)', flexShrink: 0, marginTop: 8 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
