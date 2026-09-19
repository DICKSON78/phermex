// Central plan levels and feature-to-plan mapping.
// Levels: higher number = more features.
export const PLAN_LEVELS = {
  trial: 2,          // trial gives STARTER access during trial window
  basic: 1,          // legacy
  starter: 2,
  professional: 3,
  pro: 3,
  enterprise: 4,
}

export const PLAN_LABELS = {
  trial: 'Trial',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

export function planLevel(plan) {
  if (!plan) return 0
  const key = String(plan).toLowerCase()
  return PLAN_LEVELS[key] ?? 0
}

export function hasPlanAccess(currentPlan, requiredPlan) {
  if (!requiredPlan) return true
  return planLevel(currentPlan) >= planLevel(requiredPlan)
}

// Feature gate map — key = route path prefix or feature name.
export const FEATURE_PLAN = {
  // SALES extra
  chats: 'professional',
  reviews: 'professional',
  telemedicine: 'professional',
  loyalty: 'professional',

  // INSURANCE
  insurance: 'professional',

  // FINANCE / REPORTING
  reportsAdvanced: 'professional',          // financial-reports
  consolidatedReports: 'enterprise',

  // ACCOUNTING
  accounting: 'professional',              // chart-of-accounts, journal, bank, budgets, tax
  // consolidated already enterprise

  // HR
  attendance: 'professional',
  leaves: 'professional',
  payroll: 'professional',
  performance: 'enterprise',

  // DELIVERY
  deliveries: 'professional',

  // SUPPLY CHAIN — premium parts
  stockTransfers: 'professional',
  stockReturns: 'professional',
  damagedGoods: 'professional',
  supplierIntegration: 'professional',

  // COMPLIANCE
  controlledSubstances: 'professional',
  licenses: 'professional',
  drugRecalls: 'professional',
  regulatoryReports: 'enterprise',

  // AI / ML — currently via professional reports, enterprise outbreak
  aiInventory: 'professional',
  outbreakPrediction: 'enterprise',

  // SUPPORT
  troubleshooting: 'professional',
  prioritySupport: 'professional',
  support24x7: 'enterprise',

  // SETTINGS
  advancedSettings: 'professional',

  // Pharmacy count
  multiplePharmacies: 'starter', // starter up to 3, professional unlimited handled separately
}

// Quick lookup for nav items by path.
export function requiredPlanForPath(path) {
  if (!path) return null
  const p = path.toLowerCase()
  if (p.includes('/chats') || p.includes('/messages')) return FEATURE_PLAN.chats
  if (p.includes('/reviews')) return FEATURE_PLAN.reviews
  if (p.includes('/telemedicine')) return FEATURE_PLAN.telemedicine
  if (p.includes('/loyalty')) return FEATURE_PLAN.loyalty
  if (p.includes('/insurance')) return FEATURE_PLAN.insurance
  if (p.includes('/consolidated-reports')) return FEATURE_PLAN.consolidatedReports
  if (p.includes('/financial-reports')) return FEATURE_PLAN.reportsAdvanced
  if (p.includes('/chart-of-accounts') || p.includes('/journal-entries') || p.includes('/bank-management') || p.includes('/budgets') || p.includes('/tax-management')) return FEATURE_PLAN.accounting
  if (p.includes('/attendance')) return FEATURE_PLAN.attendance
  if (p.includes('/leaves')) return FEATURE_PLAN.leaves
  if (p.includes('/payroll')) return FEATURE_PLAN.payroll
  if (p.includes('/performance')) return FEATURE_PLAN.performance
  if (p.includes('/deliveries')) return FEATURE_PLAN.deliveries
  if (p.includes('/stock-transfers')) return FEATURE_PLAN.stockTransfers
  if (p.includes('/stock-returns')) return FEATURE_PLAN.stockReturns
  if (p.includes('/damaged-goods')) return FEATURE_PLAN.damagedGoods
  if (p.includes('/controlled-substances')) return FEATURE_PLAN.controlledSubstances
  if (p.includes('/licenses')) return FEATURE_PLAN.licenses
  if (p.includes('/drug-recalls')) return FEATURE_PLAN.drugRecalls
  if (p.includes('/regulatory-reports')) return FEATURE_PLAN.regulatoryReports
  return null
}

export const PHARMACY_LIMIT = {
  starter: 3,
  professional: Infinity,
  enterprise: Infinity,
  trial: 3,
}
