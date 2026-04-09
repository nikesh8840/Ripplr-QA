const { test, expect } = require('@playwright/test');
const { ReturnPage } = require('../../pages/salesreturn.page');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

test.describe('Order Management - Sales Returns', () => {

    test('Returns list loads with correct columns', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('menuitem', { name: 'Order Management' }).click();
        await page.getByRole('link', { name: 'Returns' }).click();
        await page.waitForURL('**/order-management/returns**');
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('columnheader', { name: 'Return No.' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Brand' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'FC' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Invoice No' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    });

    test('Returns list has Add Sales return button', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('menuitem', { name: 'Order Management' }).click();
        await page.getByRole('link', { name: 'Returns' }).click();
        await page.waitForURL('**/order-management/returns**');

        await expect(page.getByRole('button', { name: 'Add Sales return' })).toBeVisible();
    });

    test('Returns search filters include FC and Brand dropdowns', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('menuitem', { name: 'Order Management' }).click();
        await page.getByRole('link', { name: 'Returns' }).click();
        await page.waitForURL('**/order-management/returns**');

        await expect(page.getByRole('combobox', { name: /FC\(s\)/i })).toBeVisible();
        await expect(page.getByRole('combobox', { name: 'Brands' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
    });

    test('Create Sales Return via page object (preprod)', async ({ page }) => {
        test.setTimeout(180000);
        const returnPage = new ReturnPage(page);
        await page.goto(config.baseURLpreprod);
        const result = await returnPage.createReturn(config.credentials.username, config.credentials.password);
        expect(result).toBeTruthy();
    });

});
