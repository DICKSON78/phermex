// @ts-check
import { test, expect } from '@playwright/test'
import {
  BASE_URL, ROLES, ALLOWED, FORBIDDEN_DASHBOARD, FORBIDDEN_TOP_LEVEL, login, expectPageRendered,
} from './helpers.js'

const ROLE_KEYS = ['owner', 'admin', 'pharmacist', 'cashier', 'delivery']

const allowedFor = (roleKey) => (roleKey === 'owner' ? ALLOWED.owner : roleKey === 'admin' ? ALLOWED.admin : ALLOWED.seller)

for (const roleKey of ROLE_KEYS) {
  test.describe(`${roleKey} (${ROLES[roleKey].login})`, () => {
    test.describe.configure({ mode: 'serial' })

    let page
    let context

    test.beforeAll(async ({ browser }) => {
      context = await browser.newContext()
      page = await context.newPage()
      await login(page, roleKey)
    })

    test.afterAll(async () => {
      await context.close()
    })

    for (const path of allowedFor(roleKey)) {
      test(`renders ${path}`, async () => {
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await expectPageRendered(page)
        const pathname = new URL(page.url()).pathname
        expect(pathname === path || pathname.startsWith(path + '/')).toBeTruthy()
      })
    }

    for (const path of FORBIDDEN_DASHBOARD[roleKey]) {
      test(`blocks ${path} -> /dashboard`, async () => {
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 20000 })
        await expectPageRendered(page)
      })
    }

    for (const path of FORBIDDEN_TOP_LEVEL[roleKey]) {
      test(`blocks ${path} -> /dashboard`, async () => {
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 20000 })
        await expectPageRendered(page)
      })
    }
  })
}