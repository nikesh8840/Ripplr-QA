const { test, expect } = require('@playwright/test');
const { DlAndRFClosePage } = require('../../pages/dl-rfclose.page');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

test.describe('Logistics - Return to FC', () => {

    test('Return to FC list is accessible from Logistics Management menu', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('menuitem', { name: 'Logistics Management' }).click();
        await page.getByRole('link', { name: 'Return To FC' }).click();
        await page.waitForURL('**/return-to-fc**');
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveURL(/return-to-fc/);
    });

    test('Delivery Attempt and RFC Close', async ({ page }) => {
        test.setTimeout(180000);
        const dlandrfclose = new DlAndRFClosePage(page);
        await page.goto(config.baseURLpreprod);
        const result = await dlandrfclose.DeliveryAttemptRfcClose(
            config.credentials.username,
            config.credentials.password
        );
        expect(result).toBeTruthy();
    });

    test('Delivered with full collection and RFC Close', async ({ page }) => {
        test.setTimeout(180000);
        const dlandrfclose = new DlAndRFClosePage(page);
        await page.goto(config.baseURLpreprod);
        const result = await dlandrfclose.dlrfclosefullcollection(
            config.credentials.username,
            config.credentials.password
        );
        expect(result).toBeTruthy();
    });

    test('Delivered with partial collection and RFC Close', async ({ page }) => {
        test.setTimeout(180000);
        const dlandrfclose = new DlAndRFClosePage(page);
        await page.goto(config.baseURLpreprod);
        const result = await dlandrfclose.dlrfclose(
            config.credentials.username,
            config.credentials.password
        );
        expect(result).toBeTruthy();
    });

    test('Partial Delivered Full Collection and RFC Close', async ({ page }) => {
        test.setTimeout(180000);
        const dlandrfclose = new DlAndRFClosePage(page);
        await page.goto(config.baseURLpreprod);
        const result = await dlandrfclose.PartialDeliveredFullCollectionRfcClose(
            config.credentials.username,
            config.credentials.password
        );
        expect(result).toBeTruthy();
    });

    test('Delivery Action on each row (mixed statuses)', async ({ page }) => {
        test.setTimeout(180000);
        const dlandrfclose = new DlAndRFClosePage(page);
        await page.goto(config.baseURLpreprod);
        const result = await dlandrfclose.DeliveryActionOnEachRow(
            config.credentials.username,
            config.credentials.password
        );
        expect(result).toBeTruthy();
    });

});
