import { useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  Tag,
  Activity,
  AlertTriangle,
  Clock,
  Package,
  FileText,
  Users,
  DollarSign,
  BarChart3,
  Truck,
  Settings,
  Star,
} from 'lucide-react'
import DashboardLayout from './DashboardLayout'

const ownerNavGroups = [
  {
    label: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/owner' },
      { icon: ShoppingCart, label: 'POS', path: '/owner/pos' },
    ],
  },
  {
    label: 'INVENTORY',
    items: [
      { icon: Pill, label: 'Drugs', path: '/owner/drugs' },
      { icon: Tag, label: 'Categories', path: '/owner/categories' },
      { icon: Activity, label: 'Stock Movements', path: '/owner/stock-movements' },
      { icon: AlertTriangle, label: 'Low Stock', path: '/owner/low-stock' },
      { icon: Clock, label: 'Expiring Soon', path: '/owner/expiring' },
    ],
  },
  {
    label: 'SALES',
    items: [
      { icon: Package, label: 'Orders', path: '/owner/orders' },
      { icon: FileText, label: 'Prescriptions', path: '/owner/prescriptions' },
      { icon: Users, label: 'Customers', path: '/owner/customers' },
      { icon: Star, label: 'Reviews', path: '/owner/reviews' },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { icon: DollarSign, label: 'Expenses', path: '/owner/expenses' },
      { icon: BarChart3, label: 'Reports', path: '/owner/reports' },
    ],
  },
  {
    label: 'DELIVERIES',
    items: [
      { icon: Truck, label: 'Deliveries', path: '/owner/deliveries' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { icon: Settings, label: 'Settings', path: '/owner/settings' },
    ],
  },
]

export default function OwnerLayout() {
  return <DashboardLayout role="owner" />
}

export { ownerNavGroups }
