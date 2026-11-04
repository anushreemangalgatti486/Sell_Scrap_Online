import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '../../components/common/DashboardLayout'
import {
  LayoutDashboard, Search, Zap, Gavel, Trophy,
  CreditCard, Bell, BarChart3, User, Package
} from 'lucide-react'
import BuyerOverview from '../../components/buyer/BuyerOverview'
import BuyerExploreMaterials from '../../components/buyer/BuyerExploreMaterials'
import BuyerLiveAuctions from '../../components/buyer/BuyerLiveAuctions'
import BuyerMyBids from '../../components/buyer/BuyerMyBids'
import BuyerTransactions from '../../components/buyer/BuyerTransactions'
import BuyerNotifications from '../../components/buyer/BuyerNotifications'
import BuyerAnalytics from '../../components/buyer/BuyerAnalytics'
import BuyerProfile from '../../components/buyer/BuyerProfile'

const NAV_ITEMS = [
  { to: '/buyer/overview',  label: 'Overview',          icon: <LayoutDashboard size={18} />, exact: true },
  { to: '/buyer/explore',   label: 'Explore Materials', icon: <Search size={18} /> },
  { to: '/buyer/auctions',  label: 'Live Auctions',     icon: <Zap size={18} /> },
  { to: '/buyer/bids',      label: 'My Bids',           icon: <Gavel size={18} /> },
  { to: '/buyer/won',       label: 'Won Auctions',      icon: <Trophy size={18} /> },
  { to: '/buyer/transactions', label: 'Transactions',   icon: <CreditCard size={18} /> },
  { divider: true, label: 'Account' },
  { to: '/buyer/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { to: '/buyer/analytics',    label: 'Analytics',      icon: <BarChart3 size={18} /> },
  { to: '/buyer/profile',      label: 'My Business',    icon: <User size={18} /> },
]

export default function BuyerDashboard() {
  const [pageTitle, setPageTitle] = React.useState('Dashboard')

  return (
    <DashboardLayout navItems={NAV_ITEMS} title={pageTitle}>
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview"      element={<BuyerOverview      setTitle={setPageTitle} />} />
        <Route path="explore"       element={<BuyerExploreMaterials setTitle={setPageTitle} />} />
        <Route path="auctions"      element={<BuyerLiveAuctions  setTitle={setPageTitle} />} />
        <Route path="bids"          element={<BuyerMyBids        setTitle={setPageTitle} />} />
        <Route path="won"           element={<BuyerMyBids won    setTitle={setPageTitle} />} />
        <Route path="transactions"  element={<BuyerTransactions  setTitle={setPageTitle} />} />
        <Route path="notifications" element={<BuyerNotifications setTitle={setPageTitle} />} />
        <Route path="analytics"     element={<BuyerAnalytics     setTitle={setPageTitle} />} />
        <Route path="profile"       element={<BuyerProfile       setTitle={setPageTitle} />} />
        <Route path="*"             element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  )
}
