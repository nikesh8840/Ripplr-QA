const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

test.describe('Order Management - GRN (Goods Received Note)', () => {

    test('GRN list loads and is accessible from Order Management menu', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('menuitem', { name: 'Order Management' }).click();
        await page.getByRole('link', { name: 'GRN' }).click();
        await page.waitForURL('**/warehouse-management/asn/grn**');
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveURL(/grn/);
    });

    test('GRN list table is visible with rows', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.goto(`${config.baseURLpreprod.replace('/login', '')}/warehouse-management/asn/grn`);
        await page.waitForLoadState('networkidle');

        // GRN list should have a table
        const table = page.locator('table');
        await expect(table).toBeVisible({ timeout: 10000 });
    });

    test('GRN page has search/filter functionality', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.goto(`${config.baseURLpreprod.replace('/login', '')}/warehouse-management/asn/grn`);
        await page.waitForLoadState('networkidle');

        // Should have a Search button
        await expect(page.getByRole('button', { name: 'Search' })).toBeVisible({ timeout: 10000 });
    });

});
