import { useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  ClipboardList,
  Star,
  Megaphone,
} from 'lucide-react'
import DashboardLayout from './DashboardLayout'

const adminNavGroups = [
  {
    label: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      { icon: Star, label: 'Reviews', path: '/admin/reviews' },
      { icon: Megaphone, label: 'Broadcasts', path: '/admin/broadcasts' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { icon: Building2, label: 'Pharmacies', path: '/admin/pharmacies' },
      { icon: Users, label: 'Users', path: '/admin/users' },
    ],
  },
  {
    label: 'SUBSCRIPTIONS',
    items: [
      { icon: CreditCard, label: 'Plans', path: '/admin/plans' },
      { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
    ],
  },
  {
    label: 'PLATFORM',
    items: [
      { icon: Settings, label: 'Settings', path: '/admin/settings' },
      { icon: ClipboardList, label: 'Audit Logs', path: '/admin/audit-logs' },
    ],
  },
]

export default function AdminLayout() {
  return <DashboardLayout role="admin" />
}

export { adminNavGroups }
