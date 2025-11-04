import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  testDir: './e2e/dev',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    // CI sets PLAYWRIGHT_BASE_URL for branch-specific deployments
    // Or use API_URL_MAIN from .env, or fallback to hardcoded default
    baseURL: process.env.PLAYWRIGHT_BASE_URL || process.env.API_URL_MAIN || 'https://dottie-api-v7hdajoteq-nw.a.run.app',
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'x-test-env': 'prod'
    }
  },

  testMatch: '**/*.api.pw.spec.{js,ts}',

  globalSetup: join(__dirname, 'e2e/setup/global-setup-prod.ts'),

  projects: [
    {
      name: 'api',
      use: {
        // No browser needed for API tests
      },
    }
  ],
});
