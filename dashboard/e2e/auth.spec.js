// @ts-check
import { test, expect } from '@playwright/test'
import { BASE_URL } from './helpers.js'

test.describe('Guest / auth flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('unauthenticated visitor to /home is bounced to /login', async ({ page }) => {
    await page.goto('/home')
    await expect(page).toHaveURL(`${BASE_URL}/login`)
    await expect(page.getByPlaceholder('example@gmail.com')).toBeVisible()
  })

  test('unauthenticated visitor to /dashboard is bounced to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(`${BASE_URL}/login`)
    await expect(page.getByRole('button', { name: /^SIGN IN$/ })).toBeVisible()
  })

  test('login page shows sign in form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByPlaceholder('example@gmail.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
    await expect(page.getByRole('button', { name: /^SIGN IN$/ })).toBeVisible()
  })

  test('register page renders', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveURL(`${BASE_URL}/register`)
    await expect(page.getByText('How Many Pharmacies?')).toBeVisible()
  })

  test('invalid credentials keep the user on /login (no session created)', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('example@gmail.com').fill('nobody@pharmex.com')
    await page.getByPlaceholder('••••••••').fill('wrong-password')
    await page.getByRole('button', { name: /^SIGN IN$/ }).click()
    await expect(page).toHaveURL(`${BASE_URL}/login`)
    await expect(page.getByRole('button', { name: /^SIGN IN$/ })).toBeVisible()
  })
})