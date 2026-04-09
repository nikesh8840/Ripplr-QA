const { test, expect } = require('@playwright/test');
const { SmokeReadPage } = require('../../pages/smokeRead.page');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

test.describe('Smoke - Full Navigation', () => {

    test('Smoke test - navigate all modules and verify no 404s', async ({ page }) => {
        test.setTimeout(300000);
        const smokeReadPage = new SmokeReadPage(page);
        await page.goto(config.baseURLpreprod);
        const result = await smokeReadPage.smokeRead(
            config.credentials.username,
            config.credentials.password
        );
        expect(result).toBeTruthy();
    });

    test('All main menu items are visible after login', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        const menus = [
            'Order Management',
            'Logistics Management',
            'Onboarding',
            'Finance Management',
            'Automations',
            'Cheque Bounce',
            'Adapter Uploads',
            'Downloads',
            'Integration Logs',
        ];
        for (const menu of menus) {
            await expect(page.getByRole('menuitem', { name: menu })).toBeVisible({ timeout: 5000 });
        }
    });

    test('Dashboard quick-links render correctly', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);
        await page.waitForURL('**/dashboard');

        const quickLinks = [
            'Sales Order',
            'Returns',
            'Delivery Allocation',
            'Return To FC',
            'Goods Received Note',
            'Onboarding',
            'Adapter Uploads',
        ];
        for (const link of quickLinks) {
            await expect(page.getByText(link).first()).toBeVisible({ timeout: 5000 });
        }
    });

    test('Order Management sub-menu expands with correct links', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('menuitem', { name: 'Order Management' }).click();
        await expect(page.getByRole('link', { name: 'GRN' })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('link', { name: 'Sales Order' })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('link', { name: 'Returns' })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('link', { name: 'Brand Sales Return' })).toBeVisible({ timeout: 5000 });
    });

    test('Logistics Management sub-menu expands with correct links', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('menuitem', { name: 'Logistics Management' }).click();
        await expect(page.getByRole('link', { name: 'Delivery Allocation' })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('link', { name: 'Return To FC' })).toBeVisible({ timeout: 5000 });
    });

    test('Adapter Uploads page loads correctly', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('link', { name: 'Adapter Uploads' }).click();
        await page.waitForURL('**/adapter-uploads**');
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveURL(/adapter-uploads/);
    });

    test('Downloads page loads correctly', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('link', { name: 'Downloads' }).click();
        await page.waitForURL('**/downloads**');
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveURL(/downloads/);
    });

});
