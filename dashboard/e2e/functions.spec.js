// @ts-check
import { test } from '@playwright/test'
import {
  ROLES, ALLOWED, login, expectPageHealthy, trackApiErrors,
} from './helpers.js'

const ROLE_KEYS = ['owner', 'admin', 'pharmacist', 'cashier', 'delivery']

const allowedFor = (roleKey) => (roleKey === 'owner' ? ALLOWED.owner : roleKey === 'admin' ? ALLOWED.admin : ALLOWED.seller)

for (const roleKey of ROLE_KEYS) {
  test.describe(`${roleKey} functional (${ROLES[roleKey].login})`, () => {
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
      test(`loads ${path} without errors`, async () => {
        trackApiErrors(page)
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await expectPageHealthy(page, path)
      })
    }
  })
}