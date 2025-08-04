const { test, expect } = require('@playwright/test');
const { DeliveredPage } = require('../../pages/delivered.page');
const config = require('../../config/base.config');

test('Allocate vehicle', async ({ page }) => {
    const deliveredPage = new DeliveredPage(page);

    await page.goto(config.baseURL);
    const result = await deliveredPage.delivered(config.credentials.username, config.credentials.password);
    expect(result).toBeTruthy();
});