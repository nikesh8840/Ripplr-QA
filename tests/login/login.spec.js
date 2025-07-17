
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import data from '../../test-data/loginData.json';

test('User can login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(data.valid.username, data.valid.password);
  await expect(page).toHaveURL(/dashboard/);
});
