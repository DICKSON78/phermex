import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import SessionTimeout from './components/SessionTimeout'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import RegisterOwnerPage from './pages/auth/RegisterOwnerPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import PendingApprovalPage from './pages/auth/PendingApprovalPage'
import SubscriptionPlansPage from './pages/auth/SubscriptionPlansPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import UseAppPage from './pages/UseAppPage'
import NotFoundPage from './pages/NotFoundPage'
import DashboardLayout from './components/DashboardLayout'
import { SELLER_ROLES } from './utils/roles'

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
    if (user.role === 'customer') return <Navigate to="/app" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (user?.role === 'customer') return <Navigate to="/app" replace />
  return <Navigate to="/dashboard" replace />
}

function DashboardApp() {
  const { user } = useAuth()
  const role = user?.role === 'admin' ? 'admin' : SELLER_ROLES.includes(user?.role) ? 'seller' : 'owner'
  return <DashboardLayout role={role} />
}

export default function App() {
  return (
    <ErrorBoundary>
      <SessionTimeout />
      <Routes>
      {/* Public guest routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/register/owner" element={<GuestRoute><RegisterOwnerPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/verify-email" element={<ProtectedRoute><VerifyEmailPage /></ProtectedRoute>} />

      {/* Owner-only routes (no role check — login handles redirect) */}
      <Route path="/pending-approval" element={<ProtectedRoute allowedRoles={['owner']}><PendingApprovalPage /></ProtectedRoute>} />
      <Route path="/subscribe" element={<ProtectedRoute allowedRoles={['owner']}><SubscriptionPlansPage /></ProtectedRoute>} />

      {/* Role redirect from root */}
      <Route path="/home" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

      {/* Customer mobile-app redirect (customers use the native app) */}
      <Route path="/app" element={<ProtectedRoute allowedRoles={['customer']}><UseAppPage /></ProtectedRoute>} />

      {/* Unified dashboard for all roles (owner / admin / seller) */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'pharmacist', 'cashier', 'delivery']}><DashboardApp /></ProtectedRoute>} />
      <Route path="/dashboard/*" element={<ProtectedRoute allowedRoles={['owner', 'admin', 'pharmacist', 'cashier', 'delivery']}><DashboardApp /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </ErrorBoundary>
  )
}
