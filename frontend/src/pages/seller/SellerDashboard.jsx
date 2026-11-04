import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '../../components/common/DashboardLayout'
import {
  LayoutDashboard, Package, Plus, Gavel, BarChart3,
  ShoppingBag, CreditCard, Bell, User, Clock
} from 'lucide-react'
import SellerOverview    from '../../components/seller/SellerOverview'
import SellerMyMaterials from '../../components/seller/SellerMyMaterials'
import SellerAddMaterial from '../../components/seller/SellerAddMaterial'
import SellerLiveBids    from '../../components/seller/SellerLiveBids'
import SellerTransactions from '../../components/seller/SellerTransactions'
import SellerNotifications from '../../components/seller/SellerNotifications'
import SellerAnalytics   from '../../components/seller/SellerAnalytics'
import SellerProfile     from '../../components/seller/SellerProfile'

const NAV_ITEMS = [
  { to: '/seller/overview',   label: 'Overview',           icon: <LayoutDashboard size={18} />, exact: true },
  { to: '/seller/materials',  label: 'My Materials',       icon: <Package size={18} /> },
  { to: '/seller/add',        label: 'Add Material',       icon: <Plus size={18} /> },
  { to: '/seller/bids',       label: 'Live Bids',          icon: <Gavel size={18} /> },
  { to: '/seller/sold',       label: 'Sold Materials',     icon: <ShoppingBag size={18} /> },
  { to: '/seller/transactions', label: 'Transactions',     icon: <CreditCard size={18} /> },
  { divider: true, label: 'Account' },
  { to: '/seller/notifications', label: 'Notifications',   icon: <Bell size={18} /> },
  { to: '/seller/analytics',    label: 'Analytics',        icon: <BarChart3 size={18} /> },
  { to: '/seller/profile',      label: 'Business Profile', icon: <User size={18} /> },
]

export default function SellerDashboard() {
  const [pageTitle, setPageTitle] = React.useState('Dashboard')

  return (
    <DashboardLayout navItems={NAV_ITEMS} title={pageTitle}>
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview"     element={<SellerOverview    setTitle={setPageTitle} />} />
        <Route path="materials"    element={<SellerMyMaterials setTitle={setPageTitle} />} />
        <Route path="add"          element={<SellerAddMaterial setTitle={setPageTitle} />} />
        <Route path="bids"         element={<SellerLiveBids    setTitle={setPageTitle} />} />
        <Route path="sold"         element={<SellerMyMaterials sold setTitle={setPageTitle} />} />
        <Route path="transactions" element={<SellerTransactions setTitle={setPageTitle} />} />
        <Route path="notifications" element={<SellerNotifications setTitle={setPageTitle} />} />
        <Route path="analytics"    element={<SellerAnalytics   setTitle={setPageTitle} />} />
        <Route path="profile"      element={<SellerProfile     setTitle={setPageTitle} />} />
        <Route path="*"            element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  )
}
