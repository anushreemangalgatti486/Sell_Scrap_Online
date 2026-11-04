import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { LogOut, Sun, Moon, Menu, X, Bell, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import './DashboardLayout.css'

export default function DashboardLayout({ navItems, children, title }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className={`dash-layout ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className={`dash-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="dash-sidebar-header">
          {!collapsed && (
            <div className="dash-logo">
              <div className="logo-mark">SB</div>
              <span className="logo-name">ScrapBazaar</span>
            </div>
          )}
          <button className="dash-collapse-btn" onClick={() => { setCollapsed(c => !c); setMobileOpen(false) }}>
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        <nav className="dash-nav">
          {navItems.map(item => (
            item.divider ? (
              <div key={item.label} className="dash-nav-divider">{!collapsed && <span>{item.label}</span>}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : ''}
              >
                <span className="dash-nav-icon">{item.icon}</span>
                {!collapsed && <span className="dash-nav-label">{item.label}</span>}
                {!collapsed && item.badge && <span className="dash-nav-badge">{item.badge}</span>}
              </NavLink>
            )
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="dash-sidebar-footer">
          {!collapsed && (
            <div className="dash-user-info">
              <div className="dash-avatar">{user?.name?.charAt(0) || 'U'}</div>
              <div className="dash-user-details">
                <div className="dash-user-name">{user?.name}</div>
                <div className="dash-user-role">{user?.role}</div>
              </div>
            </div>
          )}
          <button className="dash-logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="dash-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Main area */}
      <div className="dash-main">
        {/* Top bar */}
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <button className="dash-mobile-menu-btn" onClick={() => setMobileOpen(o => !o)}>
              <Menu size={20} />
            </button>
            <h1 className="dash-page-title">{title}</h1>
          </div>
          <div className="dash-topbar-right">
            <button className="btn btn-ghost btn-icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button className="btn btn-ghost btn-icon notification-btn" aria-label="Notifications">
              <Bell size={17} />
              <span className="notif-dot" />
            </button>
            <div className="dash-topbar-user">
              <div className="dash-avatar sm">{user?.name?.charAt(0) || 'U'}</div>
              <span>{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="dash-content">
          {children}
        </main>
      </div>
    </div>
  )
}
