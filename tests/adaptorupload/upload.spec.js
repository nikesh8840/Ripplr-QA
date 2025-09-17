const { test, expect } = require('@playwright/test');
const { Uploadfile } = require('../../pages/Aupload.page');
const config = require('../../config/base.config');

test('Upload GRN file', async ({ page }) => {
    const uploadfile = new Uploadfile(page);

    await page.goto(config.baseURL43);
    const result = await uploadfile.Upload(config.credentials.username, config.credentials.password, 'Purchase Order', 'GRN');
    expect(result).toBeTruthy();
});



test('Upload salesOrder file', async ({ page }) => {
    const uploadfile = new Uploadfile(page);

    await page.goto(config.baseURL43);
    const result = await uploadfile.Upload(config.credentials.username, config.credentials.password, 'Sales Order', 'salesorder');
    expect(result).toBeTruthy();
});

test('Upload SalesReturn file', async ({ page }) => {
    const uploadfile = new Uploadfile(page);

    await page.goto(config.baseURL43);
    const result = await uploadfile.Upload(config.credentials.username, config.credentials.password, 'Sales Return', 'salesreturn');
    expect(result).toBeTruthy();
});
