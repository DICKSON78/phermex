// @ts-check
import { test, expect } from '@playwright/test'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { login, trackApiErrors, BASE_URL } from './helpers.js'

const U = Date.now()
const DB_PATH = process.env.DB_DATABASE || resolve(process.cwd(), '../database/testing.sqlite')

async function token(page) {
  return page.evaluate(() => localStorage.getItem('pharmex_token'))
}

test.describe('write-flow 2 — order status, drug edit/delete, expense, employee, admin pharmacy approval', () => {
  /* ------------------------------------------------------------------ */
  /* 1. Order status update (owner)                                      */
  /* ------------------------------------------------------------------ */
  test('order: create via API then advance status through UI', async ({ page }) => {
    trackApiErrors(page)
    await login(page, 'owner')

    const auth = { Authorization: `Bearer ${await token(page)}` }

    // Create a dedicated drug + order via API so we know the exact IDs.
    const drugName = `Order Drug ${U}`
    const drugRes = await page.request.post(`${BASE_URL}/api/drugs`, {
      headers: auth,
      data: { name: drugName, buying_price: 1000, selling_price: 2000, quantity: 50, expiry_date: '2031-12-31', unit: 'tablets' },
    })
    expect(drugRes.ok()).toBeTruthy()
    const drugId = (await drugRes.json()).drug?.id

    const orderRes = await page.request.post(`${BASE_URL}/api/orders`, {
      headers: auth,
      data: { items: [{ drug_id: drugId, quantity: 1 }], payment_status: 'unpaid' },
    })
    expect(orderRes.ok()).toBeTruthy()
    const orderId = (await orderRes.json()).order?.id

    // Open the order in the UI.
    await page.goto(`/dashboard/orders/${orderId}`)
    await expect(page.getByRole('heading', { name: 'Order Details' })).toBeVisible({ timeout: 20000 })

    // Advance pending → confirmed.
    const [confirmResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/orders/') && r.url().includes('/status') && r.request().method() === 'PUT', { timeout: 15000 }),
      page.getByRole('button', { name: 'Confirm Order' }).click(),
    ])
    expect(confirmResp.status()).toBeGreaterThanOrEqual(200)
    expect(confirmResp.status()).toBeLessThan(300)
    await expect(page.locator('span').filter({ hasText: /^confirmed$/ }).first()).toBeVisible({ timeout: 10000 })

    // Status change persists across reload.
    await page.goto(`/dashboard/orders/${orderId}`)
    await expect(page.locator('span').filter({ hasText: /^confirmed$/ }).first()).toBeVisible({ timeout: 15000 })
    expect(page.__apiErrors).toEqual([])
  })

  /* ------------------------------------------------------------------ */
  /* 2. Drug edit + delete (owner)                                       */
  /* ------------------------------------------------------------------ */
  test('drug: edit selling price then delete via UI', async ({ page }) => {
    trackApiErrors(page)
    await login(page, 'owner')

    const auth = { Authorization: `Bearer ${await token(page)}` }
    const name = `EdDel Drug ${U}`
    const createRes = await page.request.post(`${BASE_URL}/api/drugs`, {
      headers: auth,
      data: { name, buying_price: 1000, selling_price: 2000, quantity: 50, expiry_date: '2031-12-31', unit: 'tablets' },
    })
    expect(createRes.ok()).toBeTruthy()
    const drugId = (await createRes.json()).drug?.id

    // --- edit --------------------------------------------------------
    await page.goto('/dashboard/drugs')
    await page.getByPlaceholder('Search drugs...').fill(name)
    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 15000 })
    await page.getByTitle('Edit').click()
    await expect(page.getByRole('heading', { name: 'Edit Drug' })).toBeVisible()

    await page.getByPlaceholder('0.00').nth(1).fill('2500')
    const [putResp] = await Promise.all([
      page.waitForResponse(r => r.request().method() === 'POST' && r.url().includes(`/api/drugs/${drugId}`), { timeout: 15000 }),
      page.getByRole('button', { name: 'Update Drug' }).click(),
    ])
    expect(putResp.status()).toBeGreaterThanOrEqual(200)
    expect(putResp.status()).toBeLessThan(300)

    await expect(page).toHaveURL(/\/dashboard\/drugs$/, { timeout: 20000 })
    const verifyRes = await page.request.get(`${BASE_URL}/api/drugs/${drugId}`, { headers: auth })
    expect(verifyRes.ok()).toBeTruthy()
    expect((await verifyRes.json()).drug?.selling_price).toBe('2500.00')

    // --- delete ------------------------------------------------------
    await page.getByPlaceholder('Search drugs...').fill(name)
    await page.getByTitle('Delete').click()
    await expect(page.getByRole('heading', { name: 'Delete Drug' })).toBeVisible()

    const [delResp] = await Promise.all([
      page.waitForResponse(r => r.request().method() === 'DELETE' && r.url().includes(`/api/drugs/${drugId}`), { timeout: 15000 }),
      page.getByRole('button', { name: 'Delete', exact: true }).last().click(),
    ])
    expect(delResp.status()).toBeGreaterThanOrEqual(200)
    expect(delResp.status()).toBeLessThan(300)

    await page.getByPlaceholder('Search drugs...').fill(name)
    await expect(page.getByText(name, { exact: true })).toHaveCount(0, { timeout: 15000 })
    expect(page.__apiErrors).toEqual([])
  })

  /* ------------------------------------------------------------------ */
  /* 3. Expense create (owner)                                           */
  /* ------------------------------------------------------------------ */
  test('expense: create via UI then verify on reload', async ({ page }) => {
    trackApiErrors(page)
    await login(page, 'owner')

    const desc = `Utilities bill ${U}`
    await page.goto('/dashboard/expenses/new')
    await expect(page.getByRole('heading', { name: 'Create New Expense' })).toBeVisible()

    await page.getByPlaceholder('What was this expense for?').fill(desc)
    // Select a built-in category — click the select, pick first non-empty option.
    await page.locator('select').first().selectOption({ index: 1 })
    await page.getByPlaceholder('0', { exact: true }).fill('85000')
    await page.locator('input[type="date"]').fill('2026-09-10')

    const [postResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/expenses') && r.request().method() === 'POST', { timeout: 15000 }),
      page.getByRole('button', { name: 'Create Expense' }).click(),
    ])
    expect(postResp.status()).toBeGreaterThanOrEqual(200)
    expect(postResp.status()).toBeLessThan(300)

    await expect(page).toHaveURL(/\/dashboard\/expenses$/, { timeout: 20000 })
    await page.getByPlaceholder('Search expenses...').fill(desc)
    await expect(page.getByText(desc, { exact: true })).toBeVisible({ timeout: 15000 })
    await page.reload()
    await page.getByPlaceholder('Search expenses...').fill(desc)
    await expect(page.getByText(desc, { exact: true })).toBeVisible({ timeout: 15000 })
    expect(page.__apiErrors).toEqual([])
  })

  /* ------------------------------------------------------------------ */
  /* 4. Employee create (owner)                                          */
  /* ------------------------------------------------------------------ */
  test('employee: create via wizard then verify on reload', async ({ page }) => {
    trackApiErrors(page)
    await login(page, 'owner')

    const firstName = `Emp ${U}`
    const email = `emp${U}@e2e.test`

    await page.goto('/dashboard/employees/new')
    await expect(page.getByRole('heading', { name: 'Create New Employee' })).toBeVisible()

    // Step 1 — Personal info
    await page.getByPlaceholder('Enter first name').fill(firstName)
    await page.getByPlaceholder('Enter last name').fill('Tester')
    await page.getByPlaceholder('email@example.com').fill(email)
    await page.getByPlaceholder('+255...').fill('+255700000000')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 2 — Employment (position, department, type, hire date, salary)
    await page.getByPlaceholder('e.g. Pharmacist').fill('Pharmacist')
    await page.locator('select').first().selectOption('pharmacy')
    await page.locator('select').nth(1).selectOption('full_time')
    await page.locator('input[type="date"]').fill('2026-01-01')
    await page.getByPlaceholder('0.00').first().fill('1500000')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3 — Emergency contact (all optional) → Next
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 4 — Login account (leave unchecked) → Submit
    const [postResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/employees') && r.request().method() === 'POST', { timeout: 15000 }),
      page.getByRole('button', { name: 'Create Employee' }).click(),
    ])
    expect(postResp.status()).toBeGreaterThanOrEqual(200)
    expect(postResp.status()).toBeLessThan(300)

    await expect(page).toHaveURL(/\/dashboard\/employees$/, { timeout: 20000 })
    await page.getByPlaceholder('Search employees...').fill(firstName)
    await expect(page.getByText(`${firstName} Tester`, { exact: false })).toBeVisible({ timeout: 15000 })
    await page.reload()
    await page.getByPlaceholder('Search employees...').fill(firstName)
    await expect(page.getByText(`${firstName} Tester`, { exact: false })).toBeVisible({ timeout: 15000 })
    expect(page.__apiErrors).toEqual([])
  })

  /* ------------------------------------------------------------------ */
  /* 5. Admin pharmacy approval                                          */
  /* ------------------------------------------------------------------ */
  test('admin: approve pending pharmacy through UI', async ({ page }) => {
    // Seed a pending pharmacy for this run.
    const uniqueSuffix = U
    const pharmacyName = `E2E Pending Pharmacy ${uniqueSuffix}`
    const pharmacyCode = `PHME2E${uniqueSuffix}`
    execSync(
      `sqlite3 "${DB_PATH}" "DELETE FROM pharmacies WHERE pharmacy_name LIKE 'E2E Pending Pharmacy %'; ` +
      `INSERT INTO pharmacies (owner_id, pharmacy_name, pharmacy_code, status, application_status, payment_status, is_published, created_at, updated_at) ` +
      `VALUES ((SELECT id FROM users WHERE email='admin@pharmex.com'), '${pharmacyName}', '${pharmacyCode}', 'pending', 'pending', 'unpaid', 0, datetime('now'), datetime('now'));"`,
      { stdio: 'pipe' },
    )

    trackApiErrors(page)
    await login(page, 'admin')

    await page.goto('/dashboard/pending-approvals')
    await expect(page.getByText(pharmacyName, { exact: true }).first()).toBeVisible({ timeout: 20000 })

    // Click the row's quick Approve action (title="Approve") → modal → confirm.
    await page.getByTitle('Approve').click()
    await expect(page.getByRole('heading', { name: 'Approve Application' })).toBeVisible()

    const [patchResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/admin/pharmacies/') && r.url().includes('/approve') && r.request().method() === 'PATCH', { timeout: 15000 }),
      page.getByRole('button', { name: 'Approve', exact: true }).last().click(),
    ])
    expect(patchResp.status()).toBeGreaterThanOrEqual(200)
    expect(patchResp.status()).toBeLessThan(300)
    await expect(page.getByText('Pharmacy approved')).toBeVisible({ timeout: 10000 })

    // Reload → the pharmacy should still appear (filter=all) with an Approved badge.
    await page.reload()
    await expect(page.getByText(pharmacyName, { exact: true }).first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('span').filter({ hasText: /approved/i }).first()).toBeVisible({ timeout: 10000 })

    // Verify server-side the approval persisted.
    const auth = { Authorization: `Bearer ${await token(page)}` }
    const listRes = await page.request.get(`${BASE_URL}/api/admin/pharmacies?per_page=50`, { headers: auth })
    expect(listRes.ok()).toBeTruthy()
    const rows = (await listRes.json()).data || []
    const target = rows.find(r => r.pharmacy_name === pharmacyName)
    expect(target).toBeTruthy()
    expect(target.application_status).toBe('approved')
    expect(page.__apiErrors).toEqual([])
  })
})