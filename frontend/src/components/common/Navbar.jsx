import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import {
  Sun, Moon, ChevronDown, Menu, X,
  ShieldCheck, Users, Truck, LogOut, User, LayoutDashboard
} from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate  = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginDropOpen, setLoginDropOpen] = useState(false)
  const [userDropOpen,  setUserDropOpen]  = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const loginRef = useRef(null)
  const userRef  = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (loginRef.current && !loginRef.current.contains(e.target)) setLoginDropOpen(false)
      if (userRef.current  && !userRef.current.contains(e.target))  setUserDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    setUserDropOpen(false)
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!user) return '/auth/login'
    if (user.role === 'buyer')  return '/buyer/overview'
    if (user.role === 'seller') return '/seller/overview'
    if (user.role === 'admin')  return '/admin/overview'
    return '/'
  }

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-mark">SB</div>
          <div className="logo-text">
            <span className="logo-name">ScrapBazaar</span>
            <span className="logo-tagline">B2B Marketplace</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar-nav">
          <Link to="/"        className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
          <Link to="/buyers"  className={`nav-link ${isActive('/buyers') ? 'active' : ''}`}>Buyers</Link>
          <Link to="/sellers" className={`nav-link ${isActive('/sellers') ? 'active' : ''}`}>Sellers</Link>
        </nav>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          {/* Theme toggle */}
          <button className="btn btn-ghost btn-icon theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {user ? (
            /* Logged-in user menu */
            <div className="dropdown" ref={userRef}>
              <button className="user-menu-btn" onClick={() => setUserDropOpen(o => !o)}>
                <div className="user-avatar">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="user-name">{user.name?.split(' ')[0]}</span>
                <ChevronDown size={14} className={`drop-arrow ${userDropOpen ? 'open' : ''}`} />
              </button>
              {userDropOpen && (
                <div className="dropdown-menu dropdown-right">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user.name}</p>
                    <p className="dropdown-role">{user.role}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to={getDashboardLink()} className="dropdown-item" onClick={() => setUserDropOpen(false)}>
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>
                  <Link to={`/${user.role}/profile`} className="dropdown-item" onClick={() => setUserDropOpen(false)}>
                    <User size={15} /> My Profile
                  </Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Login dropdown */
            <div className="dropdown" ref={loginRef}>
              <button
                className="btn btn-ghost login-btn"
                onClick={() => setLoginDropOpen(o => !o)}
              >
                Login <ChevronDown size={14} className={`drop-arrow ${loginDropOpen ? 'open' : ''}`} />
              </button>
              {loginDropOpen && (
                <div className="dropdown-menu dropdown-right">
                  <Link to="/auth/login?role=admin" className="dropdown-item" onClick={() => setLoginDropOpen(false)}>
                    <ShieldCheck size={15} /> Administrator Login
                  </Link>
                  <Link to="/auth/login?role=buyer" className="dropdown-item" onClick={() => setLoginDropOpen(false)}>
                    <Users size={15} /> Buyer Login
                  </Link>
                  <Link to="/auth/login?role=seller" className="dropdown-item" onClick={() => setLoginDropOpen(false)}>
                    <Truck size={15} /> Seller Login
                  </Link>
                </div>
              )}
            </div>
          )}

          {!user && (
            <Link to="/auth/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="mobile-menu-btn btn btn-ghost btn-icon" onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            <Link to="/"        className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}       onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/buyers"  className={`mobile-nav-link ${isActive('/buyers') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>Buyers</Link>
            <Link to="/sellers" className={`mobile-nav-link ${isActive('/sellers') ? 'active' : ''}`}onClick={() => setMobileOpen(false)}>Sellers</Link>
          </nav>
          <div className="mobile-actions">
            <button className="btn btn-ghost w-full" onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
            {user ? (
              <>
                <Link to={getDashboardLink()} className="btn btn-primary w-full" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <button className="btn btn-ghost w-full" onClick={handleLogout}>
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/auth/login"    className="btn btn-ghost w-full"   onClick={() => setMobileOpen(false)}>Login</Link>
                <Link to="/auth/register" className="btn btn-primary w-full" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
