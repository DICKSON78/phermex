export const SELLER_ROLES = ['pharmacist', 'cashier', 'delivery']

export function dashboardBase(role) {
  if (role === 'customer') return '/app'
  return '/dashboard'
}

export function currentBase() {
  return '/dashboard'
}
