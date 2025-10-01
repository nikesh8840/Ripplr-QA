const { test, expect } = require('@playwright/test');
const { ReturnPage } = require('../../pages/salesreturn.page');
const config = require('../../config/base.config');

test('Create Sales Return', async ({ page }) => {
    const returnPage = new ReturnPage(page);

    await page.goto(config.baseURLil);
    const result = await returnPage.createReturn(config.credentials.username, config.credentials.password);
    expect(result).toBeTruthy();
});