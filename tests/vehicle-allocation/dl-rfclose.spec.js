const { test, expect } = require('@playwright/test');
const { DlAndRFClosePage } = require('../../pages/dl-rfclose.page');
const config = require('../../config/base.config');

test('Delivered , full collection  and RFC close', async ({ page }) => {
    const dlandrfclose = new DlAndRFClosePage(page);

    await page.goto(config.baseURLpreprod);
    const result = await dlandrfclose.DeliveryAttemptRfcClose(config.credentials.username, config.credentials.password);
    expect(result).toBeTruthy();
});
