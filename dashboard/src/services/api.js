import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pharmex_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pharmex_token')
      localStorage.removeItem('pharmex_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const auth = {
  login: (data) => api.post('/login', data),
  register: (data) => api.post('/register', data),
  logout: () => api.post('/logout'),
  getMe: () => api.get('/user'),
  updateProfile: (data) => api.put('/user/profile', data),
}

export const pharmacies = {
  getAll: (params) => api.get('/pharmacies', { params }),
  getById: (id) => api.get(`/pharmacies/${id}`),
  update: (id, data) => api.put(`/pharmacies/${id}`, data),
  getStats: (id) => api.get(`/pharmacies/${id}/stats`),
  switchPharmacy: (id) => api.post(`/pharmacies/${id}/switch`),
}

export const drugs = {
  getAll: (params) => api.get('/drugs', { params }),
  getById: (id) => api.get(`/drugs/${id}`),
  create: (data) => api.post('/drugs', data),
  update: (id, data) => api.put(`/drugs/${id}`, data),
  delete: (id) => api.delete(`/drugs/${id}`),
  lowStock: (params) => api.get('/drugs/low-stock', { params }),
  expiringSoon: (params) => api.get('/drugs/expiring-soon', { params }),
  search: (query) => api.get('/drugs/search', { params: { q: query } }),
}

export const drugCategories = {
  getAll: (params) => api.get('/drug-categories', { params }),
  create: (data) => api.post('/drug-categories', data),
  update: (id, data) => api.put(`/drug-categories/${id}`, data),
  delete: (id) => api.delete(`/drug-categories/${id}`),
}

export const drugMovements = {
  getAll: (params) => api.get('/drug-movements', { params }),
  create: (data) => api.post('/drug-movements', data),
}

export const customers = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  purchaseHistory: (id) => api.get(`/customers/${id}/purchases`),
}

export const pharmacists = {
  getAll: (params) => api.get('/pharmacists', { params }),
  getById: (id) => api.get(`/pharmacists/${id}`),
  create: (data) => api.post('/pharmacists', data),
  update: (id, data) => api.put(`/pharmacists/${id}`, data),
  delete: (id) => api.delete(`/pharmacists/${id}`),
  toggleActive: (id) => api.patch(`/pharmacists/${id}/toggle-active`),
}

export const prescriptions = {
  getAll: (params) => api.get('/prescriptions', { params }),
  getById: (id) => api.get(`/prescriptions/${id}`),
  create: (data) => api.post('/prescriptions', data),
  dispense: (id, data) => api.post(`/prescriptions/${id}/dispense`, data),
}

export const orders = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  dailyReport: (params) => api.get('/orders/daily-report', { params }),
}

export const expenses = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  monthlySummary: (params) => api.get('/expenses/monthly-summary', { params }),
}

export const deliveries = {
  getAll: (params) => api.get('/deliveries', { params }),
  create: (data) => api.post('/deliveries', data),
  updateStatus: (id, data) => api.put(`/deliveries/${id}/status`, data),
  assignDriver: (id, data) => api.post(`/deliveries/${id}/assign-driver`, data),
}

export const notifications = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
}

export const dashboard = {
  ownerDashboard: () => api.get('/dashboard/owner'),
  adminDashboard: () => api.get('/dashboard/admin'),
  pharmacistDashboard: () => api.get('/dashboard/pharmacist'),
}

export const reports = {
  sales: (params) => api.get('/reports/sales', { params }),
  inventory: (params) => api.get('/reports/inventory', { params }),
  financial: (params) => api.get('/reports/financial', { params }),
  customers: (params) => api.get('/reports/customers', { params }),
}

export const employees = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getStats: (params) => api.get('/employees/stats', { params }),
  toggleStatus: (id) => api.patch(`/employees/${id}/toggle-status`),
}

export const attendance = {
  getAll: (params) => api.get('/attendance', { params }),
  create: (data) => api.post('/attendance', data),
  clockIn: (data) => api.post('/attendance/clock-in', data),
  clockOut: (data) => api.post('/attendance/clock-out', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  getReport: (params) => api.get('/attendance/report', { params }),
}

export const leaves = {
  getAll: (params) => api.get('/leaves', { params }),
  getById: (id) => api.get(`/leaves/${id}`),
  create: (data) => api.post('/leaves', data),
  approve: (id, data) => api.post(`/leaves/${id}/approve`, data),
  reject: (id, data) => api.post(`/leaves/${id}/reject`, data),
  cancel: (id) => api.post(`/leaves/${id}/cancel`),
  getBalance: (params) => api.get('/leaves/balance', { params }),
  getCalendar: (params) => api.get('/leaves/calendar', { params }),
}

export const payroll = {
  getAll: (params) => api.get('/payroll', { params }),
  getById: (id) => api.get(`/payroll/${id}`),
  create: (data) => api.post('/payroll', data),
  approve: (id) => api.post(`/payroll/${id}/approve`),
  pay: (id, data) => api.post(`/payroll/${id}/pay`, data),
  cancel: (id) => api.post(`/payroll/${id}/cancel`),
  getSummary: (params) => api.get('/payroll/summary', { params }),
  getPayslip: (id) => api.get(`/payroll/${id}/payslip`),
}

export const performance = {
  getAll: (params) => api.get('/performance', { params }),
  getById: (id) => api.get(`/performance/${id}`),
  create: (data) => api.post('/performance', data),
  update: (id, data) => api.put(`/performance/${id}`, data),
  submit: (id) => api.post(`/performance/${id}/submit`),
  acknowledge: (id) => api.post(`/performance/${id}/acknowledge`),
  getSummary: (params) => api.get('/performance/summary', { params }),
}

export const accounts = {
  getAll: (params) => api.get('/accounts', { params }),
  create: (data) => api.post('/accounts', data),
  getById: (id) => api.get(`/accounts/${id}`),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
  getTree: (params) => api.get('/accounts/tree', { params }),
  getBalances: (params) => api.get('/accounts/balances', { params }),
}

export const journal = {
  getAll: (params) => api.get('/journal', { params }),
  create: (data) => api.post('/journal', data),
  getById: (id) => api.get(`/journal/${id}`),
  post: (id) => api.post(`/journal/${id}/post`),
  reverse: (id, data) => api.post(`/journal/${id}/reverse`, data),
  getTrialBalance: (params) => api.get('/journal/trial-balance', { params }),
  getGeneralLedger: (params) => api.get('/journal/general-ledger', { params }),
}

export const bank = {
  getAll: (params) => api.get('/bank', { params }),
  create: (data) => api.post('/bank', data),
  getById: (id) => api.get(`/bank/${id}`),
  getTransactions: (id, params) => api.get(`/bank/${id}/transactions`, { params }),
  reconcile: (id, data) => api.post(`/bank/${id}/reconcile`, data),
  getSummary: (params) => api.get('/bank/summary', { params }),
  transfer: (data) => api.post('/bank/transfer', data),
}

export const budgets = {
  getAll: (params) => api.get('/budgets', { params }),
  create: (data) => api.post('/budgets', data),
  getById: (id) => api.get(`/budgets/${id}`),
  getSummary: (params) => api.get('/budgets/summary', { params }),
  getVariance: (params) => api.get('/budgets/variance', { params }),
}

export const taxes = {
  getAll: (params) => api.get('/tax', { params }),
  create: (data) => api.post('/tax', data),
  calculate: (data) => api.post('/tax/calculate', data),
  file: (id) => api.post(`/tax/${id}/file`),
  markPaid: (id, data) => api.post(`/tax/${id}/pay`, data),
  getCalendar: (params) => api.get('/tax/calendar', { params }),
  getSummary: (params) => api.get('/tax/summary', { params }),
}

export const admin = {
  getPharmacies: (params) => api.get('/admin/pharmacies', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  updatePharmacyStatus: (id, status) => api.patch(`/admin/pharmacies/${id}/status`, { status }),
  toggleUserActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
}

export const suppliers = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getStats: (params) => api.get('/suppliers/stats', { params }),
  getTop: (params) => api.get('/suppliers/top', { params }),
}

export const purchaseOrders = {
  getAll: (params) => api.get('/purchase-orders', { params }),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  approve: (id) => api.post(`/purchase-orders/${id}/approve`),
  receive: (id, data) => api.post(`/purchase-orders/${id}/receive`, data),
  cancel: (id) => api.post(`/purchase-orders/${id}/cancel`),
  getStats: (params) => api.get('/purchase-orders/stats', { params }),
}

export const goodsReceived = {
  getAll: (params) => api.get('/goods-received', { params }),
  getById: (id) => api.get(`/goods-received/${id}`),
  create: (data) => api.post('/goods-received', data),
  qualityCheck: (id, data) => api.post(`/goods-received/${id}/quality-check`, data),
}

export const stockTransfers = {
  getAll: (params) => api.get('/stock-transfers', { params }),
  getById: (id) => api.get(`/stock-transfers/${id}`),
  create: (data) => api.post('/stock-transfers', data),
  approve: (id) => api.post(`/stock-transfers/${id}/approve`),
  ship: (id) => api.post(`/stock-transfers/${id}/ship`),
  receive: (id, data) => api.post(`/stock-transfers/${id}/receive`, data),
  cancel: (id) => api.post(`/stock-transfers/${id}/cancel`),
}

export const stockReturns = {
  getAll: (params) => api.get('/stock-returns', { params }),
  getById: (id) => api.get(`/stock-returns/${id}`),
  create: (data) => api.post('/stock-returns', data),
  approve: (id) => api.post(`/stock-returns/${id}/approve`),
  ship: (id) => api.post(`/stock-returns/${id}/ship`),
  refund: (id) => api.post(`/stock-returns/${id}/refund`),
}

export const damagedGoods = {
  getAll: (params) => api.get('/damaged-goods', { params }),
  getById: (id) => api.get(`/damaged-goods/${id}`),
  create: (data) => api.post('/damaged-goods', data),
  process: (id, data) => api.post(`/damaged-goods/${id}/process`, data),
  getReport: (params) => api.get('/damaged-goods/report', { params }),
}

export const controlledSubstances = {
  getAll: (params) => api.get('/controlled-substances', { params }),
  getById: (id) => api.get(`/controlled-substances/${id}`),
  create: (data) => api.post('/controlled-substances', data),
  issue: (id, data) => api.post(`/controlled-substances/${id}/issue`, data),
  getRegister: (params) => api.get('/controlled-substances/register', { params }),
  getAuditTrail: (params) => api.get('/controlled-substances/audit-trail', { params }),
  getBalanceReport: (params) => api.get('/controlled-substances/balance-report', { params }),
}

export const licenses = {
  getAll: (params) => api.get('/licenses', { params }),
  create: (data) => api.post('/licenses', data),
  update: (id, data) => api.put(`/licenses/${id}`, data),
  renew: (id, data) => api.post(`/licenses/${id}/renew`, data),
  getExpiryAlert: (params) => api.get('/licenses/expiry-alert', { params }),
}

export const regulatoryReports = {
  getAll: (params) => api.get('/regulatory-reports', { params }),
  getById: (id) => api.get(`/regulatory-reports/${id}`),
  create: (data) => api.post('/regulatory-reports', data),
  submit: (id, data) => api.post(`/regulatory-reports/${id}/submit`, data),
  getTemplates: () => api.get('/regulatory-reports/templates'),
}

export const drugRecalls = {
  getAll: (params) => api.get('/drug-recalls', { params }),
  getById: (id) => api.get(`/drug-recalls/${id}`),
  create: (data) => api.post('/drug-recalls', data),
  acknowledge: (id) => api.post(`/drug-recalls/${id}/acknowledge`),
  process: (id) => api.post(`/drug-recalls/${id}/process`),
  getActive: (params) => api.get('/drug-recalls/active', { params }),
}

export default api
