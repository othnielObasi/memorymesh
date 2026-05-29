import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: process.env.MEMORYMESH_E2E_BASE_URL || 'http://127.0.0.1:4179',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.MEMORYMESH_E2E_BASE_URL
    ? undefined
    : {
        command: 'corepack pnpm exec vite --host 127.0.0.1 --port 4179 --strictPort',
        url: 'http://127.0.0.1:4179',
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
