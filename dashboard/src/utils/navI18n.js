// Maps a sidebar nav item path to its i18n key so nav labels can be translated
// without rewriting every nav group definition by hand.
const PATH_KEYS = {
  '/dashboard': 'nav.items.dashboard',
  '/dashboard/pos': 'nav.items.pos',
  '/dashboard/orders': 'nav.items.orders',
  '/dashboard/customers': 'nav.items.customers',
  '/dashboard/prescriptions': 'nav.items.prescriptions',
  '/dashboard/drugs': 'nav.items.drugs',
  '/dashboard/categories': 'nav.items.categories',
  '/dashboard/inventory': 'nav.items.inventoryValuation',
  '/dashboard/stock-movements': 'nav.items.stockMovements',
  '/dashboard/low-stock': 'nav.items.lowStock',
  '/dashboard/expiring': 'nav.items.expiringSoon',
  '/dashboard/suppliers': 'nav.items.suppliers',
  '/dashboard/purchase-orders': 'nav.items.purchaseOrders',
  '/dashboard/goods-received': 'nav.items.goodsReceived',
  '/dashboard/stock-transfers': 'nav.items.stockTransfers',
  '/dashboard/stock-returns': 'nav.items.stockReturns',
  '/dashboard/damaged-goods': 'nav.items.damagedGoods',
  '/dashboard/barcode': 'nav.items.barcode',
  '/dashboard/export': 'nav.items.export',
  '/dashboard/chart-of-accounts': 'nav.items.chartOfAccounts',
  '/dashboard/journal-entries': 'nav.items.journalEntries',
  '/dashboard/bank-management': 'nav.items.bankManagement',
  '/dashboard/budgets': 'nav.items.budgets',
  '/dashboard/tax-management': 'nav.items.taxManagement',
  '/dashboard/financial-reports': 'nav.items.financialReports',
  '/dashboard/consolidated-reports': 'nav.items.consolidatedReports',
  '/dashboard/expenses': 'nav.items.expenses',
  '/dashboard/revenue': 'nav.items.revenue',
  '/dashboard/employees': 'nav.items.employees',
  '/dashboard/attendance': 'nav.items.attendance',
  '/dashboard/leaves': 'nav.items.leaves',
  '/dashboard/payroll': 'nav.items.payroll',
  '/dashboard/performance': 'nav.items.performance',
  '/dashboard/deliveries': 'nav.items.deliveries',
  '/dashboard/controlled-substances': 'nav.items.controlledSubstances',
  '/dashboard/licenses': 'nav.items.licenses',
  '/dashboard/drug-recalls': 'nav.items.drugRecalls',
  '/dashboard/regulatory-reports': 'nav.items.regulatoryReports',
  '/dashboard/support': 'nav.items.supportTickets',
  '/dashboard/settings': 'nav.items.pharmacySettings',
  '/dashboard/subscriptions': 'nav.items.subscriptionBilling',
  '/dashboard/insurance/providers': 'nav.items.insuranceProviders',
  '/dashboard/insurance/patients': 'nav.items.patientInsurance',
  '/dashboard/insurance/claims': 'nav.items.insuranceClaims',
  '/dashboard/loyalty': 'nav.items.loyaltyProgram',
  '/dashboard/telemedicine': 'nav.items.telemedicine',
  '/dashboard/chats': 'nav.items.messages',
  '/dashboard/reviews': 'nav.items.reviews',
  '/dashboard/pharmacies': 'nav.items.pharmacies',
  '/dashboard/users': 'nav.items.users',
  '/dashboard/drug-database': 'nav.items.drugDatabase',
  '/dashboard/reports': 'nav.items.reportsAnalytics',
  '/dashboard/content': 'nav.items.content',
  '/dashboard/marketing': 'nav.items.marketing',
  '/dashboard/broadcasts': 'nav.items.broadcasts',
  '/dashboard/jobs': 'nav.items.jobListings',
  '/dashboard/audit-logs': 'nav.items.auditLogs',
  '/dashboard/pending-approvals': 'nav.items.pendingApprovals',
}

const GROUP_KEYS = {
  MAIN: 'nav.main',
  SALES: 'nav.sales',
  INVENTORY: 'nav.inventory',
  CUSTOMERS: 'nav.customers',
  PRESCRIPTIONS: 'nav.prescriptions',
  ACCOUNTING: 'nav.accounting',
  'HUMAN RESOURCE': 'nav.hr',
  DELIVERIES: 'nav.deliveries',
  'SUPPLY CHAIN': 'nav.supplyChain',
  COMPLIANCE: 'nav.compliance',
  TOOLS: 'nav.tools',
  SUPPORT: 'nav.support',
  MANAGEMENT: 'nav.management',
  'FINANCE & BILLING': 'nav.financeBilling',
  ANALYTICS: 'nav.analytics',
  ENGAGEMENT: 'nav.engagement',
  CAREERS: 'nav.careers',
  SYSTEM: 'nav.system',
}

export function navKeyForPath(path) {
  if (!path) return null
  if (PATH_KEYS[path]) return PATH_KEYS[path]
  // longest-prefix match so detail routes fall back to their list key
  const match = Object.keys(PATH_KEYS)
    .filter((p) => path.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0]
  return match ? PATH_KEYS[match] : null
}

export function groupKeyForLabel(label) {
  if (!label) return null
  return GROUP_KEYS[label] || null
}