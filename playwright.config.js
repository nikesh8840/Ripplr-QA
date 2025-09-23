
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  timeout: 60000,
  retries: 0,
  testDir: './tests',
  use: {
    headless: true,
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  reporter: [['html', { outputFolder: 'reports', open: 'never' }]]
});


// export default {
//   testDir: './tests',     // your test folder
//   timeout: 90000,
//   use: {
//     headless: true,      // optional, defaults to true
//     reporter : 'html'
//   },
// };
