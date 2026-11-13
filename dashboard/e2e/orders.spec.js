// @ts-check
import { test, expect } from '@playwright/test'
import { BASE_URL, login, expectPageHealthy, trackApiErrors } from './helpers.js'

/**
 * Stepwise order flows across every role that touches them.
 *
 * These tests tolerate an empty production-like database: the page must still
 * render its empty state without API errors. When rows exist, the shared
 * OrderFlowProgress stepper and the detail drill-down are exercised.
 */

const CASES = [
  {
    role: 'manufacturer',
    paths: [
      '/dashboard/manufacturer/wholesale-orders',
      '/dashboard/manufacturer/wholesale-orders',
    ],
    detailLabel: 'Order progress',
  },
  {
    role: 'wholesaler',
    paths: [
      '/dashboard/wholesaler/orders',
      '/dashboard/wholesaler/purchase-orders',
    ],
    detailLabel: 'Order progress',
  },
  {
    role: 'admin',
    paths: [
      '/dashboard/customer-orders-admin',
      '/dashboard/wholesale-orders-admin',
      '/dashboard/manufacturer-orders-admin',
    ],
    detailLabel: 'Order progress',
  },
]

for (const testCase of CASES) {
  test.describe(`${testCase.role} order flows`, () => {
    test.describe.configure({ mode: 'serial' })

    let context
    let page

    test.beforeAll(async ({ browser }) => {
      context = await browser.newContext()
      page = await context.newPage()
      await login(page, testCase.role)
    })

    test.afterAll(async () => {
      await context.close()
    })

    for (const path of [...new Set(testCase.paths)]) {
      test(`renders ${path}`, async () => {
        trackApiErrors(page)
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await expectPageHealthy(page, path)
        await expect(page.locator('main.content-area')).toContainText(/order/i)
      })
    }

    test('opens an order detail when one exists', async () => {
      const listPath = testCase.paths[0]
      await page.goto(listPath, { waitUntil: 'domcontentloaded' })
      await expectPageHealthy(page, listPath)

      const firstRow = page.locator('main.content-area [role="button"]').first()
      if ((await firstRow.count()) === 0) {
        test.info().annotations.push({
          type: 'empty-dataset',
          description: `No ${testCase.role} orders exist; detail drill-down skipped.`,
        })
        return
      }

      await firstRow.click()
      await expect(page).toHaveURL(new RegExp(`${listPath}/\\d+`), { timeout: 20000 })
      await expectPageHealthy(page, `${listPath}/:id`)
      await expect(page.getByText(testCase.detailLabel).first()).toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/Timeline/i).first()).toBeVisible()
    })

    test('has no broken admin report links', async () => {
      test.skip(testCase.role !== 'admin', 'Admin-only navigation check')

      await page.goto('/dashboard/reports', { waitUntil: 'domcontentloaded' })
      await expectPageHealthy(page, '/dashboard/reports')
      await page.getByText('Order Analytics').click()
      await expect(page).toHaveURL(`${BASE_URL}/dashboard/customer-orders-admin`, { timeout: 20000 })
      await expectPageHealthy(page, '/dashboard/customer-orders-admin')
    })
  })
}
