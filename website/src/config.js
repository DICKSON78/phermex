export const DASHBOARD_URL = '/dashboard'

export const SITE = {
  name: 'Helix',
  subline: 'Pharmacy Management',
  tagline: 'Pharmacy management software built for African pharmacies.',
  contact: {
    email: 'support@helix.co.tz',
    /** Every number Helix answers on, in display order. */
    phones: [{ key: 'phone', number: '+255 669 254 444', href: 'tel:+255669254444' }],
  },
}

/**
 * Nav targets only. Labels come from the dictionaries so the navbar follows
 * the active language, so each entry carries a `site.nav.*` key.
 */
export const NAV_LINKS = [
  { key: 'home', to: '/' },
  { key: 'about', to: '/about' },
  { key: 'products', to: '/products' },
  { key: 'packages', to: '/packages' },
  { key: 'careers', to: '/careers' },
  { key: 'newsroom', to: '/newsroom' },
  { key: 'faq', to: '/faq' },
  { key: 'contact', to: '/contact' },
]