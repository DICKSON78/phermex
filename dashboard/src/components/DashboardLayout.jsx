import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  Tags,
  Package,
  AlertTriangle,
  Clock,
  FileText,
  Receipt,
  Users,
  DollarSign,
  BarChart3,
  Truck,
  Settings,
  Bell,
  Menu,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Search,
  Stethoscope,
  ClipboardList,
  Building2,
  QrCode,
  Download,
  RotateCcw,
  ShieldAlert,
  BookOpen,
  FileCheck,
  BadgeAlert,
  BadgeCheck,
  CreditCard,
  MessageCircle,
  Briefcase,
  LifeBuoy,
  Check,
  Plus,
  Star,
  Megaphone,
} from 'lucide-react'

import OwnerDashboard from '../pages/owner/OwnerDashboard'
import POSPage from '../pages/owner/POSPage'
import DrugListPage from '../pages/owner/DrugListPage'
import DrugFormPage from '../pages/owner/DrugFormPage'
import DrugDetailPage from '../pages/owner/DrugDetailPage'
import CategoryListPage from '../pages/owner/CategoryListPage'
import StockMovementsPage from '../pages/owner/StockMovementsPage'
import LowStockPage from '../pages/owner/LowStockPage'
import ExpiringSoonPage from '../pages/owner/ExpiringSoonPage'
import OrderListPage from '../pages/owner/OrderListPage'
import OrderDetailPage from '../pages/owner/OrderDetailPage'
import PrescriptionListPage from '../pages/owner/PrescriptionListPage'
import PrescriptionFormPage from '../pages/owner/PrescriptionFormPage'
import PrescriptionDetailPage from '../pages/owner/PrescriptionDetailPage'
import CustomerListPage from '../pages/owner/CustomerListPage'
import CustomerFormPage from '../pages/owner/CustomerFormPage'
import CustomerDetailPage from '../pages/owner/CustomerDetailPage'
import ExpenseListPage from '../pages/owner/ExpenseListPage'
import ExpenseFormPage from '../pages/owner/ExpenseFormPage'
import ReportsPage from '../pages/owner/ReportsPage'
import DeliveryListPage from '../pages/owner/DeliveryListPage'
import BarcodePage from '../pages/owner/BarcodePage'
import ExportPage from '../pages/owner/ExportPage'
import SettingsPage from '../pages/owner/SettingsPage'
import NotificationsPage from '../pages/owner/NotificationsPage'
import ProfilePage from '../pages/owner/ProfilePage'
import PharmacyReviewsPage from '../pages/owner/PharmacyReviewsPage'

import SupplierListPage from '../pages/owner/SupplierListPage'
import SupplierDetailPage from '../pages/owner/SupplierDetailPage'
import PurchaseOrderListPage from '../pages/owner/PurchaseOrderListPage'
import PurchaseOrderDetailPage from '../pages/owner/PurchaseOrderDetailPage'
import GoodsReceivedPage from '../pages/owner/GoodsReceivedPage'
import StockTransferPage from '../pages/owner/StockTransferPage'
import StockReturnsPage from '../pages/owner/StockReturnsPage'
import DamagedGoodsPage from '../pages/owner/DamagedGoodsPage'
import ControlledSubstancePage from '../pages/owner/ControlledSubstancePage'
import LicenseManagementPage from '../pages/owner/LicenseManagementPage'
import DrugRecallPage from '../pages/owner/DrugRecallPage'
import RegulatoryReportsPage from '../pages/owner/RegulatoryReportsPage'
import ChartOfAccountsPage from '../pages/owner/ChartOfAccountsPage'
import JournalEntriesPage from '../pages/owner/JournalEntriesPage'
import BankManagementPage from '../pages/owner/BankManagementPage'
import BudgetPage from '../pages/owner/BudgetPage'
import TaxManagementPage from '../pages/owner/TaxManagementPage'
import FinancialReportsPage from '../pages/owner/FinancialReportsPage'
import EmployeeListPage from '../pages/owner/EmployeeListPage'
import EmployeeFormPage from '../pages/owner/EmployeeFormPage'
import EmployeeDetailPage from '../pages/owner/EmployeeDetailPage'
import AttendancePage from '../pages/owner/AttendancePage'
import LeavePage from '../pages/owner/LeavePage'
import PayrollPage from '../pages/owner/PayrollPage'
import PerformancePage from '../pages/owner/PerformancePage'
import PharmacyChatListPage from '../pages/owner/PharmacyChatListPage'
import PharmacyChatPage from '../pages/owner/PharmacyChatPage'
import OwnerSupportPage from '../pages/owner/SupportPage'
import AddPharmacyPage from '../pages/owner/AddPharmacyPage'

import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminPharmaciesPage from '../pages/admin/AdminPharmaciesPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage'
import AdminSettingsPage from '../pages/admin/AdminSettingsPage'
import AdminSubscriptionsPage from '../pages/admin/AdminSubscriptionsPage'
import AdminSupportPage from '../pages/admin/AdminSupportPage'
import AdminReportsPage from '../pages/admin/AdminReportsPage'
import AdminContentPage from '../pages/admin/AdminContentPage'
import AdminMarketingPage from '../pages/admin/AdminMarketingPage'
import AdminRevenuePage from '../pages/admin/AdminRevenuePage'
import AdminDrugDatabasePage from '../pages/admin/AdminDrugDatabasePage'
import AdminPlatformSettingsPage from '../pages/admin/AdminPlatformSettingsPage'

import AdminPharmacyFormPage from '../pages/admin/AdminPharmacyFormPage'
import AdminPharmacyShowPage from '../pages/admin/AdminPharmacyShowPage'
import AdminPharmacyApprovalPage from '../pages/admin/AdminPharmacyApprovalPage'
import AdminUserFormPage from '../pages/admin/AdminUserFormPage'
import AdminUserShowPage from '../pages/admin/AdminUserShowPage'
import AdminSubscriptionFormPage from '../pages/admin/AdminSubscriptionFormPage'
import AdminSubscriptionShowPage from '../pages/admin/AdminSubscriptionShowPage'
import AdminSupportFormPage from '../pages/admin/AdminSupportFormPage'
import AdminSupportShowPage from '../pages/admin/AdminSupportShowPage'
import AdminContentFormPage from '../pages/admin/AdminContentFormPage'
import AdminContentShowPage from '../pages/admin/AdminContentShowPage'
import AdminMarketingFormPage from '../pages/admin/AdminMarketingFormPage'
import AdminMarketingShowPage from '../pages/admin/AdminMarketingShowPage'
import AdminRevenueFormPage from '../pages/admin/AdminRevenueFormPage'
import AdminRevenueShowPage from '../pages/admin/AdminRevenueShowPage'
import AdminDrugFormPage from '../pages/admin/AdminDrugFormPage'
import AdminDrugShowPage from '../pages/admin/AdminDrugShowPage'
import AdminPendingApprovalsPage from '../pages/admin/AdminPendingApprovalsPage'
import AdminJobsPage from '../pages/admin/AdminJobsPage'
import AdminJobFormPage from '../pages/admin/AdminJobFormPage'
import AdminJobShowPage from '../pages/admin/AdminJobShowPage'
import AdminBroadcastPage from '../pages/admin/AdminBroadcastPage'
import AdminReviewsPage from '../pages/admin/AdminReviewsPage'

import SellerDashboard from '../pages/seller/SellerDashboard'

const ownerNavGroups = [
  {
    label: 'MAIN',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      { path: '/dashboard/pos', icon: ShoppingCart, label: 'Point of Sale' },
    ],
  },
  {
    label: 'INVENTORY',
    items: [
      { path: '/dashboard/drugs', icon: Pill, label: 'Drugs' },
      { path: '/dashboard/categories', icon: Tags, label: 'Categories' },
      { path: '/dashboard/stock-movements', icon: Package, label: 'Stock Movements' },
      { path: '/dashboard/low-stock', icon: AlertTriangle, label: 'Low Stock Alerts' },
      { path: '/dashboard/expiring-soon', icon: Clock, label: 'Expiring Soon' },
    ],
  },
  {
    label: 'SALES',
    items: [
      { path: '/dashboard/orders', icon: ClipboardList, label: 'Orders' },
      { path: '/dashboard/prescriptions', icon: FileText, label: 'Prescriptions' },
      { path: '/dashboard/customers', icon: Users, label: 'Customers' },
      { path: '/dashboard/chats', icon: MessageCircle, label: 'Messages' },
      { path: '/dashboard/reviews', icon: Star, label: 'Reviews' },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { path: '/dashboard/expenses', icon: Receipt, label: 'Expenses' },
      { path: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
    ],
  },
  {
    label: 'ACCOUNTING',
    items: [
      { path: '/dashboard/chart-of-accounts', icon: BookOpen, label: 'Chart of Accounts' },
      { path: '/dashboard/journal-entries', icon: FileText, label: 'Journal Entries' },
      { path: '/dashboard/bank-management', icon: Building2, label: 'Bank Management' },
      { path: '/dashboard/budgets', icon: DollarSign, label: 'Budgets' },
      { path: '/dashboard/tax-management', icon: Receipt, label: 'Tax Management' },
      { path: '/dashboard/financial-reports', icon: BarChart3, label: 'Financial Reports' },
    ],
  },
  {
    label: 'HR / TEAM',
    items: [
      { path: '/dashboard/employees', icon: Users, label: 'Employees' },
      { path: '/dashboard/attendance', icon: Clock, label: 'Attendance' },
      { path: '/dashboard/leaves', icon: FileText, label: 'Leaves' },
      { path: '/dashboard/payroll', icon: DollarSign, label: 'Payroll' },
      { path: '/dashboard/performance', icon: BarChart3, label: 'Performance' },
    ],
  },
  {
    label: 'DELIVERIES',
    items: [
      { path: '/dashboard/deliveries', icon: Truck, label: 'Deliveries' },
    ],
  },
  {
    label: 'SUPPLY CHAIN',
    items: [
      { path: '/dashboard/suppliers', icon: Users, label: 'Suppliers' },
      { path: '/dashboard/purchase-orders', icon: ShoppingCart, label: 'Purchase Orders' },
      { path: '/dashboard/goods-received', icon: Package, label: 'Goods Received' },
      { path: '/dashboard/stock-transfers', icon: Truck, label: 'Stock Transfers' },
      { path: '/dashboard/stock-returns', icon: RotateCcw, label: 'Stock Returns' },
      { path: '/dashboard/damaged-goods', icon: AlertTriangle, label: 'Damaged Goods' },
    ],
  },
  {
    label: 'COMPLIANCE',
    items: [
      { path: '/dashboard/controlled-substances', icon: ShieldAlert, label: 'Controlled Substances' },
      { path: '/dashboard/licenses', icon: BadgeCheck, label: 'Licenses' },
      { path: '/dashboard/drug-recalls', icon: BadgeAlert, label: 'Drug Recalls' },
      { path: '/dashboard/regulatory-reports', icon: FileCheck, label: 'Regulatory Reports' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { path: '/dashboard/barcode', icon: QrCode, label: 'Barcode' },
      { path: '/dashboard/export', icon: Download, label: 'Export' },
    ],
  },
  {
    label: 'SUPPORT',
    items: [
      { path: '/dashboard/support', icon: LifeBuoy, label: 'Support Tickets' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { path: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
      { path: '/dashboard/profile', icon: User, label: 'Profile' },
      { path: '/dashboard/settings', icon: Settings, label: 'Pharmacy Settings' },
    ],
  },
]

const adminNavGroups = [
  {
    label: 'MAIN',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      { path: '/dashboard/pending-approvals', icon: Clock, label: 'Pending Approvals' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { path: '/dashboard/pharmacies', icon: Building2, label: 'Pharmacies' },
      { path: '/dashboard/users', icon: Users, label: 'Users' },
      { path: '/dashboard/drug-database', icon: Pill, label: 'Drug Database' },
    ],
  },
  {
    label: 'FINANCE & BILLING',
    items: [
      { path: '/dashboard/revenue', icon: DollarSign, label: 'Revenue & Billing' },
      { path: '/dashboard/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { path: '/dashboard/reports', icon: BarChart3, label: 'Reports & Analytics' },
    ],
  },
  {
    label: 'ENGAGEMENT',
    items: [
      { path: '/dashboard/support', icon: FileText, label: 'Support Tickets' },
      { path: '/dashboard/content', icon: BookOpen, label: 'Content & Announcements' },
      { path: '/dashboard/marketing', icon: ClipboardList, label: 'Marketing' },
      { path: '/dashboard/reviews', icon: Star, label: 'Reviews' },
      { path: '/dashboard/broadcasts', icon: Megaphone, label: 'Broadcasts' },
    ],
  },
  {
    label: 'CAREERS',
    items: [
      { path: '/dashboard/jobs', icon: Briefcase, label: 'Job Listings' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { path: '/dashboard/audit-logs', icon: ShieldAlert, label: 'Audit Logs' },
      { path: '/dashboard/settings', icon: Settings, label: 'Platform Settings' },
    ],
  },
]

const sellerNavGroups = [
  {
    label: 'MAIN',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      { path: '/dashboard/pos', icon: ShoppingCart, label: 'Point of Sale' },
    ],
  },
  {
    label: 'INVENTORY',
    items: [
      { path: '/dashboard/drugs', icon: Pill, label: 'Drugs' },
      { path: '/dashboard/categories', icon: Tags, label: 'Categories' },
      { path: '/dashboard/stock-movements', icon: Package, label: 'Stock Movements' },
      { path: '/dashboard/low-stock', icon: AlertTriangle, label: 'Low Stock Alerts' },
      { path: '/dashboard/expiring-soon', icon: Clock, label: 'Expiring Soon' },
    ],
  },
  {
    label: 'SALES',
    items: [
      { path: '/dashboard/orders', icon: ClipboardList, label: 'Orders' },
      { path: '/dashboard/prescriptions', icon: FileText, label: 'Prescriptions' },
      { path: '/dashboard/customers', icon: Users, label: 'Customers' },
      { path: '/dashboard/chats', icon: MessageCircle, label: 'Messages' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { path: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
      { path: '/dashboard/profile', icon: User, label: 'Profile' },
    ],
  },
]

const SIDEBAR_GRADIENT = 'linear-gradient(180deg, #0a1f14 0%, #0d2b1c 50%, #071a0f 100%)'
const ACTIVE_GRADIENT = 'linear-gradient(135deg, #0FD452, #05b843)'

export default function DashboardLayout({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState({})
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [pharmacyDropdownOpen, setPharmacyDropdownOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notifications, setNotifications] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, pharmacyId, switchPharmacy } = useAuth()

  const accessiblePharmacies = user?.accessible_pharmacies && user.accessible_pharmacies.length > 0
    ? user.accessible_pharmacies
    : (user?.pharmacy || [])
  const currentPharmacy = user?.current_pharmacy ?? user?.currentPharmacy
    ?? accessiblePharmacies.find(p => p.id === pharmacyId)
    ?? accessiblePharmacies[0]
  const showPharmacySwitcher = role === 'owner' && accessiblePharmacies.length > 1

  const navGroups = role === 'owner' ? ownerNavGroups : role === 'admin' ? adminNavGroups : sellerNavGroups
  const basePath = '/dashboard'

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    let active = true
    const loadUnread = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count')
        if (active) setNotifications(data.unread_count || 0)
      } catch {
        if (active) setNotifications(0)
      }
    }
    loadUnread()
    return () => { active = false }
  }, [location.pathname])

  // Auto-expand group that contains active item
  useEffect(() => {
    navGroups.forEach((group, gi) => {
      if (group.items.some(item => {
        return item.exact
          ? location.pathname === item.path
          : location.pathname.startsWith(item.path) && location.pathname !== basePath
      })) {
        setCollapsedGroups(prev => ({ ...prev, [gi]: false }))
      }
    })
  }, [location.pathname])

  const toggleGroup = (gi) => {
    setCollapsedGroups(prev => ({ ...prev, [gi]: !prev[gi] }))
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path, exact) => {
    return exact ? location.pathname === path : (location.pathname.startsWith(path) && location.pathname !== basePath)
  }

  const userInitials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const roleLabel = { admin: 'Administrator', owner: 'Pharmacy Owner', pharmacist: 'Pharmacist', cashier: 'Cashier', delivery: 'Delivery', customer: 'Customer' }[user?.role || role] || role

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 pb-3 flex items-center justify-between">
        <Link to={basePath} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
               style={{ background: 'linear-gradient(135deg, #0FD452, #05b843)' }}>
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white font-bold text-[15px] leading-tight">HELIX</h1>
            <p className="text-green-200/60 text-[11px]">
              {role === 'admin' ? 'Admin Panel' : 'Pharmacy System'}
            </p>
          </div>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/60 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Pharmacy Switcher (owners with multiple pharmacies) */}
      {showPharmacySwitcher && (
        <div className="px-3 pb-2 relative">
          <button
            onClick={() => setPharmacyDropdownOpen(prev => !prev)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-green-200/70 font-semibold">Current Pharmacy</p>
              <p className="text-sm font-semibold text-white truncate">{currentPharmacy?.pharmacy_name || 'Select Pharmacy'}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-200 ${pharmacyDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {pharmacyDropdownOpen && (
            <div className="absolute z-20 left-3 right-3 mt-1 rounded-xl bg-dark border border-white/10 shadow-xl overflow-hidden max-h-72 overflow-y-auto">
              {accessiblePharmacies.map((p) => {
                const isCurrent = p.id === pharmacyId
                return (
                  <button
                    key={p.id}
                    onClick={async () => {
                      if (!isCurrent) {
                        try {
                          await switchPharmacy(p.id)
                        } catch (e) {
                          // Show error handled by interceptor
                        }
                      }
                      setPharmacyDropdownOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                      isCurrent ? 'bg-primary/20 text-white font-semibold' : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                  <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: isCurrent ? '#0FD452' : '#ffffff30' }} />
                  <span className="truncate">{p.pharmacy_name}</span>
                  {isCurrent && <Check className="w-4 h-4 text-primary ml-auto shrink-0" />}
                </button>
              )})}
              <div className="border-t border-white/10 mt-1 pt-1">
                <button
                  onClick={() => {
                    setPharmacyDropdownOpen(false)
                    navigate('/dashboard/settings/pharmacies/new')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-white/10 transition-colors font-semibold"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  Add Pharmacy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 sidebar-scroll">
        <div className="space-y-1">
          {navGroups.map((group, gi) => {
            const collapsed = collapsedGroups[gi]
            return (
              <div key={gi}>
                <button
                  onClick={() => toggleGroup(gi)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-green-300/80 hover:text-white transition-colors rounded-lg group"
                >
                  <span>{group.label}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-green-400/60 group-hover:text-white transition-all duration-200 ${collapsed ? '' : 'rotate-90'}`}
                  />
                </button>
                <div className={`space-y-0.5 overflow-hidden transition-all duration-200 ${collapsed ? 'max-h-0 opacity-0' : 'max-h-[800px] opacity-100'}`}>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path, item.exact)
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.exact}
                        onClick={() => setSidebarOpen(false)}
                        title={item.label}
                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          active
                            ? 'text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                        style={active ? { background: ACTIVE_GRADIENT } : undefined}
                      >
                        <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : ''}`} />
                        <span>{item.label}</span>
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </nav>

      {/* Settings + User */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
        {role !== 'seller' && (
          <NavLink
            to={`${basePath}/settings`}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
        )}
        <div className="h-px bg-white/10 my-2" />
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white/20 shrink-0"
               style={{ background: 'linear-gradient(135deg, #0FD452, #05b843)' }}>
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-white/50">{roleLabel}</p>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 md:hidden">
        <div
          className={`h-full w-[272px] flex flex-col transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ background: SIDEBAR_GRADIENT }}
        >
          {sidebarContent}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-[272px] shrink-0 flex-col"
        style={{ background: SIDEBAR_GRADIENT }}
      >
        {sidebarContent}
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 h-14 px-4 md:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-dark">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <div className="h-4 w-px bg-gray-200" />
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-gray-700">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <div className="h-4 w-px bg-gray-200" />
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-gray-700">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button
              onClick={() => navigate(`${basePath}/notifications`)}
              className="relative w-9 h-9 rounded-full bg-primary-light flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <Bell className="w-[18px] h-[18px] text-primary-dark" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold border-2 border-white">
                  {notifications}
                </span>
              )}
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-primary/30 shrink-0"
                     style={{ background: 'linear-gradient(135deg, #0FD452, #05b843)' }}>
                  {userInitials}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-semibold text-gray-800 leading-tight">{user?.name || 'User'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 hidden md:block transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <NavLink
                        to={`${basePath}/profile`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </NavLink>
                      {role !== 'seller' && (
                        <NavLink
                          to={`${basePath}/settings`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </NavLink>
                      )}
                    </div>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      onClick={() => { setDropdownOpen(false); handleLogout() }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-surface p-4 md:p-6 content-area">
          {role === 'owner' ? (
            <Routes>
              <Route index element={<OwnerDashboard />} />
              <Route path="pos" element={<POSPage />} />
              <Route path="drugs" element={<DrugListPage />} />
              <Route path="drugs/new" element={<DrugFormPage />} />
              <Route path="drugs/:id" element={<DrugDetailPage />} />
              <Route path="drugs/:id/edit" element={<DrugFormPage />} />
              <Route path="categories" element={<CategoryListPage />} />
              <Route path="stock-movements" element={<StockMovementsPage />} />
              <Route path="low-stock" element={<LowStockPage />} />
              <Route path="expiring-soon" element={<ExpiringSoonPage />} />
              <Route path="orders" element={<OrderListPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="prescriptions" element={<PrescriptionListPage />} />
              <Route path="prescriptions/new" element={<PrescriptionFormPage />} />
              <Route path="prescriptions/:id" element={<PrescriptionDetailPage />} />
              <Route path="customers" element={<CustomerListPage />} />
              <Route path="customers/new" element={<CustomerFormPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="customers/:id/edit" element={<CustomerFormPage />} />
              <Route path="expenses" element={<ExpenseListPage />} />
              <Route path="expenses/new" element={<ExpenseFormPage />} />
              <Route path="expenses/:id/edit" element={<ExpenseFormPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="chart-of-accounts" element={<ChartOfAccountsPage />} />
              <Route path="journal-entries" element={<JournalEntriesPage />} />
              <Route path="bank-management" element={<BankManagementPage />} />
              <Route path="budgets" element={<BudgetPage />} />
              <Route path="tax-management" element={<TaxManagementPage />} />
              <Route path="financial-reports" element={<FinancialReportsPage />} />
              <Route path="employees" element={<EmployeeListPage />} />
              <Route path="employees/new" element={<EmployeeFormPage />} />
              <Route path="employees/:id" element={<EmployeeDetailPage />} />
              <Route path="employees/:id/edit" element={<EmployeeFormPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="leaves" element={<LeavePage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="performance" element={<PerformancePage />} />
              <Route path="deliveries" element={<DeliveryListPage />} />
              <Route path="suppliers" element={<SupplierListPage />} />
              <Route path="suppliers/:id" element={<SupplierDetailPage />} />
              <Route path="purchase-orders" element={<PurchaseOrderListPage />} />
              <Route path="purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
              <Route path="goods-received" element={<GoodsReceivedPage />} />
              <Route path="stock-transfers" element={<StockTransferPage />} />
              <Route path="stock-returns" element={<StockReturnsPage />} />
              <Route path="damaged-goods" element={<DamagedGoodsPage />} />
              <Route path="controlled-substances" element={<ControlledSubstancePage />} />
              <Route path="licenses" element={<LicenseManagementPage />} />
              <Route path="drug-recalls" element={<DrugRecallPage />} />
              <Route path="regulatory-reports" element={<RegulatoryReportsPage />} />
              <Route path="barcode" element={<BarcodePage />} />
              <Route path="export" element={<ExportPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="reviews" element={<PharmacyReviewsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/pharmacies/new" element={<AddPharmacyPage />} />
              <Route path="chats" element={<PharmacyChatListPage />} />
              <Route path="chats/:customerId" element={<PharmacyChatPage />} />
              <Route path="support" element={<OwnerSupportPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          ) : role === 'seller' ? (
            <Routes>
              <Route index element={<SellerDashboard />} />
              <Route path="pos" element={<POSPage />} />
              <Route path="drugs" element={<DrugListPage />} />
              <Route path="drugs/new" element={<DrugFormPage />} />
              <Route path="drugs/:id" element={<DrugDetailPage />} />
              <Route path="drugs/:id/edit" element={<DrugFormPage />} />
              <Route path="categories" element={<CategoryListPage />} />
              <Route path="stock-movements" element={<StockMovementsPage />} />
              <Route path="low-stock" element={<LowStockPage />} />
              <Route path="expiring-soon" element={<ExpiringSoonPage />} />
              <Route path="orders" element={<OrderListPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="prescriptions" element={<PrescriptionListPage />} />
              <Route path="prescriptions/new" element={<PrescriptionFormPage />} />
              <Route path="prescriptions/:id" element={<PrescriptionDetailPage />} />
              <Route path="customers" element={<CustomerListPage />} />
              <Route path="customers/new" element={<CustomerFormPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="customers/:id/edit" element={<CustomerFormPage />} />
              <Route path="chats" element={<PharmacyChatListPage />} />
              <Route path="chats/:customerId" element={<PharmacyChatPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          ) : (
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="pending-approvals" element={<AdminPendingApprovalsPage />} />
              <Route path="pharmacies" element={<AdminPharmaciesPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="drug-database" element={<AdminDrugDatabasePage />} />
              <Route path="revenue" element={<AdminRevenuePage />} />
              <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="support" element={<AdminSupportPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="marketing" element={<AdminMarketingPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="platform-settings" element={<AdminPlatformSettingsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="pharmacies/new" element={<AdminPharmacyFormPage />} />
              <Route path="pharmacies/:id" element={<AdminPharmacyShowPage />} />
              <Route path="pharmacies/:id/approval" element={<AdminPharmacyApprovalPage />} />
              <Route path="pharmacies/:id/edit" element={<AdminPharmacyFormPage />} />
              <Route path="users/new" element={<AdminUserFormPage />} />
              <Route path="users/:id" element={<AdminUserShowPage />} />
              <Route path="users/:id/edit" element={<AdminUserFormPage />} />
              <Route path="subscriptions/new" element={<AdminSubscriptionFormPage />} />
              <Route path="subscriptions/:id" element={<AdminSubscriptionShowPage />} />
              <Route path="subscriptions/:id/edit" element={<AdminSubscriptionFormPage />} />
              <Route path="support/new" element={<AdminSupportFormPage />} />
              <Route path="support/:id" element={<AdminSupportShowPage />} />
              <Route path="support/:id/edit" element={<AdminSupportFormPage />} />
              <Route path="content/new" element={<AdminContentFormPage />} />
              <Route path="content/:id" element={<AdminContentShowPage />} />
              <Route path="content/:id/edit" element={<AdminContentFormPage />} />
              <Route path="marketing/new" element={<AdminMarketingFormPage />} />
              <Route path="marketing/:id" element={<AdminMarketingShowPage />} />
              <Route path="marketing/:id/edit" element={<AdminMarketingFormPage />} />
              <Route path="revenue/new" element={<AdminRevenueFormPage />} />
              <Route path="revenue/:id" element={<AdminRevenueShowPage />} />
              <Route path="revenue/:id/edit" element={<AdminRevenueFormPage />} />
              <Route path="drug-database/new" element={<AdminDrugFormPage />} />
              <Route path="drug-database/:id" element={<AdminDrugShowPage />} />
              <Route path="drug-database/:id/edit" element={<AdminDrugFormPage />} />
              <Route path="jobs" element={<AdminJobsPage />} />
              <Route path="jobs/new" element={<AdminJobFormPage />} />
              <Route path="jobs/:id" element={<AdminJobShowPage />} />
              <Route path="jobs/:id/edit" element={<AdminJobFormPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="broadcasts" element={<AdminBroadcastPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          )}
        </main>
      </div>
    </div>
  )
}
