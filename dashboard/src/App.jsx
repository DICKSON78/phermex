import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import SessionTimeout from './components/SessionTimeout'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import RegisterOwnerPage from './pages/auth/RegisterOwnerPage'
import RegisterCustomerPage from './pages/auth/RegisterCustomerPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import PendingApprovalPage from './pages/auth/PendingApprovalPage'
import SubscriptionPlansPage from './pages/auth/SubscriptionPlansPage'
import NotFoundPage from './pages/NotFoundPage'
import DashboardLayout from './components/DashboardLayout'

import CustomerHomePage from './pages/customer/CustomerHomePage'
import PharmacyDetailPage from './pages/customer/PharmacyDetailPage'
import DrugCatalogPage from './pages/customer/DrugCatalogPage'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import CustomerOrdersListPage from './pages/customer/CustomerOrdersListPage'
import CustomerOrderDetailPage from './pages/customer/CustomerOrderDetailPage'
import CustomerPrescriptionsPage from './pages/customer/CustomerPrescriptionsPage'
import CustomerProfilePage from './pages/customer/CustomerProfilePage'
import CustomerChatListPage from './pages/customer/CustomerChatListPage'
import CustomerChatPage from './pages/customer/CustomerChatPage'
import CustomerNotificationsPage from './pages/customer/CustomerNotificationsPage'
import DeliveryTrackingPage from './pages/customer/DeliveryTrackingPage'

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#f5f7f5] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#0FD452] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (user) {
    if (user.role === 'owner') return <Navigate to="/owner" replace />
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/" replace />
  }
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (user?.role === 'owner') return <Navigate to="/owner" replace />
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <SessionTimeout />
      <Routes>
      {/* Public guest routes */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/register/owner" element={<GuestRoute><RegisterOwnerPage /></GuestRoute>} />
      <Route path="/register/customer" element={<GuestRoute><RegisterCustomerPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

      {/* Owner-only routes (no role check — login handles redirect) */}
      <Route path="/pending-approval" element={<ProtectedRoute allowedRoles={['owner']}><PendingApprovalPage /></ProtectedRoute>} />
      <Route path="/subscribe" element={<ProtectedRoute allowedRoles={['owner']}><SubscriptionPlansPage /></ProtectedRoute>} />

      {/* Role redirect from root */}
      <Route path="/home" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

      {/* Customer PWA routes */}
      <Route path="/" element={<ProtectedRoute allowedRoles={['customer']}><CustomerHomePage /></ProtectedRoute>} />
      <Route path="/pharmacy/:id" element={<ProtectedRoute allowedRoles={['customer']}><PharmacyDetailPage /></ProtectedRoute>} />
      <Route path="/pharmacy/:id/drugs" element={<ProtectedRoute allowedRoles={['customer']}><DrugCatalogPage /></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute allowedRoles={['customer']}><CartPage /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute allowedRoles={['customer']}><CheckoutPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute allowedRoles={['customer']}><CustomerOrdersListPage /></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute allowedRoles={['customer']}><CustomerOrderDetailPage /></ProtectedRoute>} />
      <Route path="/prescriptions" element={<ProtectedRoute allowedRoles={['customer']}><CustomerPrescriptionsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute allowedRoles={['customer']}><CustomerProfilePage /></ProtectedRoute>} />
      <Route path="/chats" element={<ProtectedRoute allowedRoles={['customer']}><CustomerChatListPage /></ProtectedRoute>} />
      <Route path="/chat/:pharmacyId" element={<ProtectedRoute allowedRoles={['customer']}><CustomerChatPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute allowedRoles={['customer']}><CustomerNotificationsPage /></ProtectedRoute>} />
      <Route path="/orders/:id/track" element={<ProtectedRoute allowedRoles={['customer']}><DeliveryTrackingPage /></ProtectedRoute>} />

      {/* Owner dashboard routes */}
      <Route path="/owner" element={<ProtectedRoute allowedRoles={['owner']}><DashboardLayout role="owner" /></ProtectedRoute>} />
      <Route path="/owner/*" element={<ProtectedRoute allowedRoles={['owner']}><DashboardLayout role="owner" /></ProtectedRoute>} />

      {/* Admin dashboard routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout role="admin" /></ProtectedRoute>} />
      <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout role="admin" /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </ErrorBoundary>
  )
}
