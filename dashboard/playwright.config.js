// @ts-check
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:8002',
    headless: true,
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    actionTimeout: 15000,
    navigationTimeout: 45000,
    trace: 'retain-on-failure',
  },
})