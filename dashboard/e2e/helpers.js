// @ts-check
import { expect } from '@playwright/test'

export const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8002'

const ROLES = {
  owner: { login: 'owner@pharmex.com', password: 'password', present: 'Payroll', absent: 'Pending Approvals' },
  admin: { login: 'admin@pharmex.com', password: 'password', present: 'Pending Approvals', absent: 'Point of Sale' },
  pharmacist: { login: 'amina@pharmex.com', password: 'password', present: 'Point of Sale', absent: 'Payroll' },
  cashier: { login: 'cashier@pharmex.com', password: 'password', present: 'Point of Sale', absent: 'Payroll' },
  delivery: { login: 'delivery@pharmex.com', password: 'password', present: 'Point of Sale', absent: 'Payroll' },
}

// Allowed index paths mirrored from dashboard/src/components/DashboardLayout.jsx navGroups
const ALLOWED = {
  owner: [
    '/dashboard', '/dashboard/pos', '/dashboard/drugs', '/dashboard/categories',
    '/dashboard/stock-movements', '/dashboard/low-stock', '/dashboard/expiring-soon',
    '/dashboard/orders', '/dashboard/prescriptions', '/dashboard/customers', '/dashboard/chats',
    '/dashboard/reviews', '/dashboard/telemedicine', '/dashboard/loyalty',
    '/dashboard/insurance/providers', '/dashboard/insurance/patients', '/dashboard/insurance/claims',
    '/dashboard/expenses', '/dashboard/reports', '/dashboard/chart-of-accounts',
    '/dashboard/journal-entries', '/dashboard/bank-management', '/dashboard/budgets',
    '/dashboard/tax-management', '/dashboard/financial-reports', '/dashboard/consolidated-reports',
    '/dashboard/employees', '/dashboard/attendance', '/dashboard/leaves', '/dashboard/payroll',
    '/dashboard/performance', '/dashboard/deliveries', '/dashboard/suppliers',
    '/dashboard/purchase-orders', '/dashboard/goods-received', '/dashboard/stock-transfers',
    '/dashboard/stock-returns', '/dashboard/damaged-goods', '/dashboard/controlled-substances',
    '/dashboard/licenses', '/dashboard/drug-recalls', '/dashboard/regulatory-reports',
    '/dashboard/barcode', '/dashboard/export', '/dashboard/support', '/dashboard/notifications',
    '/dashboard/profile', '/dashboard/settings', '/dashboard/subscriptions',
  ],
  admin: [
    '/dashboard', '/dashboard/pending-approvals', '/dashboard/pharmacies', '/dashboard/users',
    '/dashboard/drug-database', '/dashboard/revenue', '/dashboard/subscriptions', '/dashboard/reports',
    '/dashboard/support', '/dashboard/content', '/dashboard/marketing', '/dashboard/reviews',
    '/dashboard/broadcasts', '/dashboard/jobs', '/dashboard/audit-logs', '/dashboard/settings',
  ],
  seller: [
    '/dashboard', '/dashboard/pos', '/dashboard/drugs', '/dashboard/categories',
    '/dashboard/stock-movements', '/dashboard/low-stock', '/dashboard/expiring-soon',
    '/dashboard/orders', '/dashboard/prescriptions', '/dashboard/customers', '/dashboard/chats',
    '/dashboard/telemedicine', '/dashboard/loyalty', '/dashboard/insurance/providers',
    '/dashboard/insurance/patients', '/dashboard/insurance/claims', '/dashboard/notifications',
    '/dashboard/profile',
  ],
}

// Paths that exist in another role's route set but must redirect to /dashboard via the `*` catch-all
const FORBIDDEN_DASHBOARD = {
  owner: ['/dashboard/pending-approvals', '/dashboard/pharmacies', '/dashboard/users', '/dashboard/revenue', '/dashboard/audit-logs', '/dashboard/content'],
  admin: ['/dashboard/pos', '/dashboard/drugs', '/dashboard/payroll', '/dashboard/employees', '/dashboard/prescriptions'],
  pharmacist: ['/dashboard/payroll', '/dashboard/attendance', '/dashboard/employees', '/dashboard/expenses', '/dashboard/pending-approvals'],
  cashier: ['/dashboard/payroll', '/dashboard/attendance', '/dashboard/expenses', '/dashboard/pending-approvals', '/dashboard/employees'],
  delivery: ['/dashboard/payroll', '/dashboard/pending-approvals', '/dashboard/expenses', '/dashboard/employees'],
}

// Role-gated top-level routes (off-dashboard). Non-authorized roles bounce /login -> GuestRoute -> /dashboard
const FORBIDDEN_TOP_LEVEL = {
  owner: ['/app'],
  admin: ['/subscribe', '/pending-approval', '/app'],
  pharmacist: ['/subscribe', '/pending-approval', '/app'],
  cashier: ['/subscribe', '/pending-approval', '/app'],
  delivery: ['/subscribe', '/pending-approval', '/app'],
}

async function login(page, roleKey) {
  const creds = ROLES[roleKey]
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('example@gmail.com').fill(creds.login)
  await page.getByPlaceholder('••••••••').fill(creds.password)
  await page.getByRole('button', { name: /^SIGN IN$/ }).click()
  await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 30000 })
  const brand = page.locator('aside').getByText('HELIX')
  await expect(brand).toBeVisible({ timeout: 20000 })
  await expect(page.locator('aside').getByText(creds.present, { exact: false })).toBeVisible({ timeout: 20000 })
  await expect(page.locator('aside').getByText(creds.absent, { exact: false })).toHaveCount(0)
}

async function expectPageRendered(page) {
  await expect(page.getByText('Something went wrong')).toHaveCount(0)
  await expect(page.locator('aside').getByText('HELIX')).toBeVisible()
}

// Collects every /api/* response with HTTP status >= 400 on this page.
// Call before navigating so page-init fetches are captured too.
function trackApiErrors(page) {
  const errors = []
  page.__apiErrors = errors
  if (!page.__apiErrorListener) {
    page.__apiErrorListener = (resp) => {
      const url = new URL(resp.url())
      if (url.pathname.startsWith('/api/') && resp.status() >= 400 && resp.status() !== 0) {
        ;(page.__apiErrors || []).push({ status: resp.status(), method: resp.request().method(), url: url.pathname })
      }
    }
    page.on('response', page.__apiErrorListener)
  }
  return errors
}

// Full functional smoke of a rendered page: no ErrorBoundary, sidebar present,
// real content painted in <main>, and no failing API call during the page load.
async function expectPageHealthy(page, path) {
  await expect(page.getByText('Something went wrong')).toHaveCount(0, { timeout: 10000 })
  await expect(page.locator('aside').getByText('HELIX')).toBeVisible({ timeout: 10000 })
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 20000 })
  await page.waitForFunction(() => {
    const main = document.querySelector('main.content-area')
    return main && main.innerText && main.innerText.trim().length > 0
  }, null, { timeout: 45000 })
  const errors = page.__apiErrors || []
  if (errors.length) {
    throw new Error(`API errors while loading ${path}: ${JSON.stringify(errors)}`)
  }
  await expect(page.getByText('Something went wrong')).toHaveCount(0)
}

export { ROLES, ALLOWED, FORBIDDEN_DASHBOARD, FORBIDDEN_TOP_LEVEL, login, expectPageRendered, expectPageHealthy, trackApiErrors }