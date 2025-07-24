import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://collection-staging.ripplr.in/login');
  await page.getByRole('spinbutton', { name: 'Salesman Phone Number' }).click();
  await page.getByRole('spinbutton', { name: 'Salesman Phone Number' }).fill('9945693825');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('textbox', { name: 'PIN Number' }).click();
  await page.getByRole('textbox', { name: 'PIN Number' }).fill('1234');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByText('Thu 24th Jul').click();
  await page.locator('input[type="text"]').click();
  await page.getByRole('cell', { name: '24' }).click();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await page.getByRole('img', { name: 'downArrow' }).click();
  await page.locator('label').filter({ hasText: 'Auto' }).locator('span').nth(1).click();
  await page.getByRole('button', { name: 'Update' }).click();
  await page.getByRole('button', { name: 'Submit Collection' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();
});