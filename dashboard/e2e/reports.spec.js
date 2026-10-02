// @ts-check
import { test, expect } from '@playwright/test'
import { login, trackApiErrors } from './helpers.js'

const TABS = ['sales', 'inventory', 'financial', 'customers']

test.describe('owner Reports page tabs', () => {
  test.describe.configure({ mode: 'serial' })

  let page
  let context

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    await login(page, 'owner')
  })

  test.afterAll(async () => {
    await context.close()
  })

  for (const tab of TABS) {
    test(`renders ${tab} report without errors`, async () => {
      trackApiErrors(page)
      await page.goto('/dashboard/reports', { waitUntil: 'domcontentloaded' })
      const labels = { sales: 'Sales', inventory: 'Inventory', financial: 'Financial', customers: 'Customers' }
      await page.getByRole('button', { name: new RegExp(`^${labels[tab]}$`), exact: true }).click()
      await expect(page.getByText('Something went wrong')).toHaveCount(0, { timeout: 10000 })
      await page.waitForFunction(() => {
        const main = document.querySelector('main.content-area')
        return main && main.innerText && main.innerText.trim().length > 0
      }, null, { timeout: 45000 })
      const errors = page.__apiErrors || []
      expect(errors, `no API errors on reports ${tab}`).toEqual([])
      expect(page.getByText('Something went wrong')).toHaveCount(0)
    })
  }

  test('date range + export controls are interactive', async () => {
    await page.goto('/dashboard/reports', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'This Quarter', exact: true }).click()
    await expect(page.getByText('Something went wrong')).toHaveCount(0, { timeout: 10000 })
    await page.waitForTimeout(1200)
    await expect(page.getByText('Something went wrong')).toHaveCount(0)
    const exportBtn = page.getByRole('button', { name: /Export/i })
    await expect(exportBtn).toBeVisible()
    await exportBtn.click()
    await page.waitForTimeout(300)
    await expect(page.getByText('Something went wrong')).toHaveCount(0)
  })
})