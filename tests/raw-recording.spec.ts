import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://cdms-preprod.ripplr.in/');
  await page.getByRole('textbox', { name: 'User ID User ID' }).click();
  await page.getByRole('textbox', { name: 'User ID User ID' }).fill('admin@ripplr.in');
  await page.getByRole('textbox', { name: 'Password Password' }).click();
  await page.getByRole('textbox', { name: 'Password Password' }).fill('M@ver!ck');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('Order Management').click();
  await page.getByRole('link', { name: 'Sales Order' }).click();
  await page.locator('.sc-bczRLJ.VVTgw').first().click();
  await page.getByRole('tab', { name: 'Order Journey' }).click();
  await page.getByRole('button', { name: 'right Order Details: Store' }).click();
});