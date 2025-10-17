const { test, expect } = require('@playwright/test');
const { DlAndRFClosePage } = require('../../pages/dl-rfclose.page');
const config = require('../../config/base.config');

test('deliver and rfc close ', async ({ page }) => {
    const dlandrfclose = new DlAndRFClosePage(page);

    await page.goto(config.baseURL);
    const result = await dlandrfclose.dlrfclose(config.credentials.username, config.credentials.password);
    expect(result).toBeTruthy();
});

// test('Allocate vehicle', async ({ page }) => {
//     const dlandrfclose = new DlAndRFClosePage(page);

//     await page.goto(config.baseURLpreprod);
//     const result = await dlandrfclose.dlrfclose(config.credentials.username, config.credentials.password);
//     expect(result).toBeTruthy();
// });