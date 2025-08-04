const { test, expect } = require('@playwright/test');
const { SmokeReadPage } = require('../../pages/smokeRead.page');
const config = require('../../config/base.config');

test('Allocate vehicle', async ({ page }) => {
    const smokeReadPage = new SmokeReadPage(page);

    await page.goto(config.baseURL);
    const result = await smokeReadPage.smokeRead(config.credentials.username, config.credentials.password);
    expect(result).toBeTruthy();
});