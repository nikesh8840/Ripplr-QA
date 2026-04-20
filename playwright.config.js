
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

// Parse custom KEY=VALUE args from the end of the command line
// e.g. npx playwright test ... SEQ=DL,PD,DA,CA  or  ... COUNT=4
for (const arg of process.argv) {
  const match = arg.match(/^([A-Z_]+)=(.+)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2];
  }
}


export default defineConfig({
  timeout: 100000,
  retries: 0,
  testDir: './tests',
  use: {
    headless: true,
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    permissions: ['geolocation'],
  },
  reporter: [['html', { outputFolder: 'reports', open: 'never' }]],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchArgs: ['--force-device-scale-factor=0.7'],
      },
    },
  ],
});


// export default {
//   testDir: './tests',     // your test folder
//   timeout: 90000,
//   use: {
//     headless: true,      // optional, defaults to true
//     reporter : 'html'
//   },
// };
