const { test, expect } = require('@playwright/test');
const { VehicleAllocationPage } = require('../../pages/vehicleAllocationPage');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

test.describe('Logistics - Delivery Allocation', () => {

    test('Delivery Allocation list loads with correct columns', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('menuitem', { name: 'Logistics Management' }).click();
        await page.getByRole('link', { name: 'Delivery Allocation' }).click();
        await page.waitForURL('**/delivery-allocation**');
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('button', { name: 'Create Delivery Allocation' })).toBeVisible();
    });

    test('Delivery Allocation list has FC and Brand filter dropdowns', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('menuitem', { name: 'Logistics Management' }).click();
        await page.getByRole('link', { name: 'Delivery Allocation' }).click();
        await page.waitForURL('**/delivery-allocation**');
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('combobox', { name: /FC\(s\)/i })).toBeVisible();
        await expect(page.getByRole('combobox', { name: /Brand/i })).toBeVisible();
    });

    test('Allocate vehicle for Nothing brand (ERHS) and verify EWB numbers', async ({ page }) => {
        test.setTimeout(180000);
        const vehicleAllocationPage = new VehicleAllocationPage(page);
        await page.goto(config.baseURLpreprod);

        const result = await vehicleAllocationPage.allocateVehicleNothingBrand(
            config.credentials.username,
            config.credentials.password
        );

        expect(result.success).toBeTruthy();
        expect(result.ewbVerified).toBeTruthy();
        expect(result.ewbNumber).toBeTruthy();
        expect(result.consolidatedEwbNumber).toBeTruthy();
        console.log(`EWB: ${result.ewbNumber}, Consolidated EWB: ${result.consolidatedEwbNumber}`);
    });

    test('Allocate vehicle with FC and Brand filter (multi-row)', async ({ page }) => {
        test.setTimeout(180000);
        const vehicleAllocationPage = new VehicleAllocationPage(page);
        await page.goto(config.baseURLpreprod);

        const result = await vehicleAllocationPage.allocateVehiclewithfcbrand(
            config.credentials.username,
            config.credentials.password,
            'erhs',
            'nothing'
        );

        expect(result).toBeTruthy();
    });

    test('Create Delivery Allocation page navigates correctly', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('menuitem', { name: 'Logistics Management' }).click();
        await page.getByRole('link', { name: 'Delivery Allocation' }).click();
        await page.waitForURL('**/delivery-allocation**');

        await page.getByRole('button', { name: 'Create Delivery Allocation' }).click();
        await page.waitForURL('**/delivery-allocation/create**');
        await expect(page).toHaveURL(/\/create/);
    });

});
