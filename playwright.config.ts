import { defineConfig } from '@playwright/test';

const base = (process.env.SITE_BASE_PATH || '/').replace(/\/?$/, '/');
export default defineConfig({
  testDir: './tests',
  use: { baseURL: `http://localhost:4321${base}`, browserName: 'chromium' },
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: `http://localhost:4321${base}`,
    reuseExistingServer: false,
  },
});
