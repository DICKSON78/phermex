// @ts-check
import { test, expect } from '@playwright/test'
import { login, trackApiErrors } from './helpers.js'

const UNIQUE = `E2E${Date.now()}`
let createdDrugName = ''

// Real write flows executed through the UI. Each test logs in fresh so state
// (cart, forms) never leaks; assertions always re-read the server data (reload)
// so optimistic UI updates can't mask a failing API call.
test.describe.serial('write flows (owner) — create records through the UI', () => {
  test('creates a drug category that persists', async ({ page }) => {
    trackApiErrors(page)
    await login(page, 'owner')

    const name = `Cat ${UNIQUE}`
    await page.goto('/dashboard/categories')
    await page.getByRole('button', { name: 'Add Category' }).click()
    await page.getByPlaceholder('e.g. Antibiotics').fill(name)
    await page.getByPlaceholder('Brief description').fill('Created by e2e suite')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 15000 })
    await page.reload()
    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 15000 })
    expect(page.__apiErrors).toEqual([])
  })

  test('creates a drug that persists', async ({ page }) => {
    trackApiErrors(page)
    await login(page, 'owner')

    createdDrugName = `Amox E2E ${UNIQUE}`
    await page.goto('/dashboard/drugs/new')
    await expect(page.getByRole('heading', { name: 'Create New Drug' })).toBeVisible()

    await page.getByPlaceholder('e.g. Amoxicillin 500mg').fill(createdDrugName)
    await page.getByPlaceholder('0.00').first().fill('1000')
    await page.getByPlaceholder('0.00').nth(1).fill('2000')
    await page.getByPlaceholder('0', { exact: true }).fill('100')
    await page.locator('input[type="date"]').fill('2031-12-31')
    await page.getByRole('button', { name: 'Create Drug' }).click()

    await expect(page).toHaveURL(/\/dashboard\/drugs$/, { timeout: 20000 })
    await page.getByPlaceholder('Search drugs...').fill(createdDrugName)
    await expect(page.getByText(createdDrugName, { exact: true })).toBeVisible({ timeout: 15000 })
    await page.reload()
    await page.getByPlaceholder('Search drugs...').fill(createdDrugName)
    await expect(page.getByText(createdDrugName, { exact: true })).toBeVisible({ timeout: 15000 })
    expect(page.__apiErrors).toEqual([])
  })

  test('sells the created drug through POS (real POST /api/orders success)', async ({ page }) => {
    test.skip(!createdDrugName, 'requires the drug create test to have run')

    trackApiErrors(page)
    await login(page, 'owner')

    await page.goto('/dashboard/pos')
    await page.getByPlaceholder('Scan barcode or search drug name...').fill(createdDrugName)
    await expect(page.locator('main').getByText(createdDrugName, { exact: true })).toBeVisible({ timeout: 15000 })

    const stockText = await page
      .locator('main')
      .getByRole('button', { name: new RegExp(createdDrugName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
      .innerText()
    const stockBefore = (stockText.match(/(\d+) in stock/) || [])[1]

    await page.locator('main').getByRole('button', { name: new RegExp(createdDrugName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click()
    await page.locator('main').getByRole('button', { name: /Mobile Money/ }).click()
    await expect(page.locator('main').getByRole('button', { name: /Complete Sale/ })).toBeEnabled()

    const [orderResp] = await Promise.all([
      page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/api/orders'), { timeout: 20000 }),
      page.locator('main').getByRole('button', { name: /Complete Sale/ }).click(),
    ])
    expect(orderResp.status()).toBeGreaterThanOrEqual(200)
    expect(orderResp.status()).toBeLessThan(300)

    await expect(page.getByRole('heading', { name: 'Sale Complete!' })).toBeVisible({ timeout: 15000 })

    // Stock must have been decremented server-side (1 sold from the created drug).
    await page.reload()
    await page.getByPlaceholder('Scan barcode or search drug name...').fill(createdDrugName)
    await expect(page.locator('main').getByText(createdDrugName, { exact: true })).toBeVisible({ timeout: 15000 })
    const stockAfterText = await page
      .locator('main')
      .getByRole('button', { name: new RegExp(createdDrugName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
      .innerText()
    const stockAfter = (stockAfterText.match(/(\d+) in stock/) || [])[1]
    expect(stockAfter).not.toBe(stockBefore)
    expect(page.__apiErrors).toEqual([])
  })

  test('creates a customer that persists', async ({ page }) => {
    trackApiErrors(page)
    await login(page, 'owner')

    const name = `Customer E2E ${UNIQUE}`
    await page.goto('/dashboard/customers/new')
    await expect(page.getByRole('heading', { name: 'Create New Customer' })).toBeVisible()

    await page.getByPlaceholder('Enter full name').fill(name)
    await page.getByPlaceholder('+256...').fill('+256700123456')
    await page.locator('select').first().selectOption('Female')
    await page.getByRole('button', { name: 'Create Customer' }).click()

    await expect(page).toHaveURL(/\/dashboard\/customers$/, { timeout: 20000 })
    await page.getByPlaceholder('Search by name, phone, email, or code...').fill(name)
    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 15000 })
    await page.reload()
    await page.getByPlaceholder('Search by name, phone, email, or code...').fill(name)
    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 15000 })
    expect(page.__apiErrors).toEqual([])
  })

  test('creates a supplier that persists', async ({ page }) => {
    trackApiErrors(page)
    await login(page, 'owner')

    const name = `Supplier E2E ${UNIQUE}`
    await page.goto('/dashboard/suppliers')
    await page.getByRole('button', { name: 'Add Supplier' }).click()

    const form = page.locator('form')
    await form.locator('input').nth(0).fill(name)
    await form.locator('input').nth(1).fill('Contact E2E')
    await form.locator('input').nth(3).fill('supplier@e2e.test')
    await form.locator('input').nth(4).fill('+256700000001')
    await form.locator('input').nth(5).fill('Kampala')
    await form.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 15000 })
    await page.reload()
    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 15000 })
    expect(page.__apiErrors).toEqual([])
  })
})