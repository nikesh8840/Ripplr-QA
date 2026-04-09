const { test, expect } = require('@playwright/test');
const { SalesOrderPage } = require('../../pages/salesOrder.page');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

test.describe('Order Management - Sales Order', () => {

    test('Sales Order list loads with correct columns', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('menuitem', { name: 'Order Management' }).click();
        await page.getByRole('link', { name: 'Sales Order' }).click();
        await page.waitForURL('**/order-management/sales-order**');

        await expect(page.getByRole('columnheader', { name: 'Invoice Date' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'FC' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Invoice No' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Store' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Invoice Amt' })).toBeVisible();
    });

    test('Sales Order list has search filters', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.goto(`${config.baseURLpreprod.replace('/login', '')}/order-management/sales-order`);
        await page.waitForLoadState('networkidle');

        await expect(page.getByPlaceholder('Search by Invoice Number')).toBeVisible();
        await expect(page.getByRole('combobox', { name: /FC\(s\)/i })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
    });

    test('Search Sales Order by Invoice Number', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.goto(`${config.baseURLpreprod.replace('/login', '')}/order-management/sales-order`);
        await page.waitForLoadState('networkidle');

        await page.getByPlaceholder('Search by Invoice Number').fill('ERHS-INV5783');
        await page.getByRole('button', { name: 'Search' }).click();
        await page.waitForLoadState('networkidle');

        const rows = page.locator('table tbody tr');
        await expect(rows.first()).toBeVisible({ timeout: 10000 });
        const rowText = await rows.first().textContent();
        expect(rowText).toContain('ERHS-INV5783');
    });

    test('View Order Journey tab from Sales Order detail', async ({ page }) => {
        test.setTimeout(120000);
        const salesOrderPage = new SalesOrderPage(page);
        const result = await salesOrderPage.viewOrderJourney(
            config.credentials.username,
            config.credentials.password,
            config.baseURLpreprod
        );
        expect(result).toBeTruthy();
    });

    test('Sales Order detail has all tabs', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.goto(`${config.baseURLpreprod.replace('/login', '')}/order-management/sales-order`);
        await page.waitForLoadState('networkidle');

        // Click first order's edit icon
        await page.locator('table tbody tr').first().locator('img[alt="edit-icon"]').click();
        await page.waitForURL('**/sales-order/**');

        await expect(page.getByRole('tab', { name: 'Value Wise Details' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Delivery Details' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Order Journey' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Collection History' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Sales Return' })).toBeVisible();
    });

    test('Mark ECO Bills button is visible on Sales Order list', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.goto(`${config.baseURLpreprod.replace('/login', '')}/order-management/sales-order`);
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('button', { name: 'Mark ECO Bills' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Mark Pay On Delivery' })).toBeVisible();
    });

});
