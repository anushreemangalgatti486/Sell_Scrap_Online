import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/common/DashboardLayout'
import {
  LayoutDashboard, Users, ShieldCheck, Package,
  Gavel, CreditCard
} from 'lucide-react'
import AdminOverview      from '../../components/admin/AdminOverview'
import AdminUsers         from '../../components/admin/AdminUsers'
import AdminVerifications from '../../components/admin/AdminVerifications'
import AdminListings      from '../../components/admin/AdminListings'
import AdminAuctions      from '../../components/admin/AdminAuctions'
import AdminTransactions  from '../../components/admin/AdminTransactions'

const NAV_ITEMS = [
  { to: '/admin/overview',      label: 'Overview',       icon: <LayoutDashboard size={18} />, exact: true },
  { divider: true, label: 'Management' },
  { to: '/admin/verifications', label: 'Verifications',  icon: <ShieldCheck size={18} /> },
  { to: '/admin/users',         label: 'Users',          icon: <Users size={18} /> },
  { to: '/admin/listings',      label: 'Listings',       icon: <Package size={18} /> },
  { to: '/admin/auctions',      label: 'Auctions',       icon: <Gavel size={18} /> },
  { to: '/admin/transactions',  label: 'Transactions',   icon: <CreditCard size={18} /> },
]

const TAB_ITEMS = [
  { value: 'overview',       label: 'Overview',       icon: <LayoutDashboard size={14} /> },
  { value: 'verifications',  label: 'Verifications',  icon: <ShieldCheck size={14} /> },
  { value: 'users',          label: 'Users',          icon: <Users size={14} /> },
  { value: 'listings',       label: 'Listings',       icon: <Package size={14} /> },
  { value: 'auctions',       label: 'Auctions',       icon: <Gavel size={14} /> },
  { value: 'transactions',   label: 'Transactions',   icon: <CreditCard size={14} /> },
]

export default function AdminDashboard() {
  const [pageTitle, setPageTitle] = React.useState('Admin Dashboard')
  const navigate = useNavigate()

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      title={pageTitle}
      tabItems={TAB_ITEMS}
      onTabChange={(value) => navigate(`/admin/${value}`)}
    >
      <Routes>
        <Route index                element={<Navigate to="overview" replace />} />
        <Route path="overview"      element={<AdminOverview      setTitle={setPageTitle} />} />
        <Route path="users"         element={<AdminUsers         setTitle={setPageTitle} />} />
        <Route path="verifications" element={<AdminVerifications setTitle={setPageTitle} />} />
        <Route path="listings"      element={<AdminListings      setTitle={setPageTitle} />} />
        <Route path="auctions"      element={<AdminAuctions      setTitle={setPageTitle} />} />
        <Route path="transactions"  element={<AdminTransactions  setTitle={setPageTitle} />} />
        <Route path="*"             element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  )
}
