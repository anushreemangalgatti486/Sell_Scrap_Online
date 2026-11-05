import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef,
} from 'react'
import { io } from 'socket.io-client'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5002'

const NOTIF_ICONS = {
  bid_placed:  '💰',
  outbid:      '📈',
  auction_won: '🏆',
  auction_lost:'❌',
  verification:'✅',
  payment:     '💳',
  transaction: '📦',
  general:     '🔔',
}

export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [unreadCount,   setUnreadCount]   = useState(0)
  const socketRef = useRef(null)

  /* ── restore session on mount ── */
  useEffect(() => {
    const token = localStorage.getItem('sb_token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('sb_token')
          delete api.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  /* ── fetch initial unread count when user logs in ── */
  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    api.get('/notifications')
      .then(r => {
        const notifs = r.data.notifications || []
        setUnreadCount(notifs.filter(n => !n.read).length)
      })
      .catch(() => {})
  }, [user?._id])

  /* ── Socket.io: personal notification room ── */
  useEffect(() => {
    // Disconnect any previous socket when user changes
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    if (!user) return

    const token = localStorage.getItem('sb_token')
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      auth: token ? { token } : {},
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join:notifications')
    })

    socket.on('notification:new', (notif) => {
      // Increment unread badge
      setUnreadCount(c => c + 1)
      // Dispatch event so the notifications page can prepend live items
      window.dispatchEvent(new CustomEvent('sb:notification', { detail: notif }))
      // Show a toast for important notification types
      const icon = NOTIF_ICONS[notif.type] || '🔔'
      toast(`${icon} ${notif.message}`, {
        duration: 5000,
        style: {
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-light)',
          borderRadius: '10px',
          fontSize: '0.875rem',
        },
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?._id])

  const login = useCallback(async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role })
    const { token, user } = res.data
    localStorage.setItem('sb_token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    return user
  }, [])

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data)
    const { token, user } = res.data
    localStorage.setItem('sb_token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    return user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sb_token')
    delete api.defaults.headers.common['Authorization']
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setUser(null)
    setUnreadCount(0)
    toast.success('Logged out successfully')
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }, [])

  const clearUnread = useCallback(() => setUnreadCount(0), [])

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateUser,
      unreadCount, clearUnread,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
