import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://cdms-staging.ripplr.in/login');
  await page.getByRole('textbox', { name: 'User ID User ID' }).click();
  await page.getByRole('textbox', { name: 'User ID User ID' }).fill('seg4@ripplr.in');
  await page.getByRole('textbox', { name: 'Password Password' }).click();
  await page.getByRole('textbox', { name: 'Password Password' }).fill('Ripplr@123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Verification' }).click();
  await page.getByRole('table').getByText('Ready for verification').click();
  await page.getByRole('button', { name: 'Start Verification' }).click();
  await page.getByRole('img', { name: 'greenTick' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(5000);
});