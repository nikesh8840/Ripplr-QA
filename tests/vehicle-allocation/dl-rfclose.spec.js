const { test, expect } = require('@playwright/test');
const { DlAndRFClosePage } = require('../../pages/dl-rfclose.page');
const config = require('../../config/base.config');

// test('deliver and rfc close ', async ({ page }) => {
//     const dlandrfclose = new DlAndRFClosePage(page);

//     await page.goto(config.baseURL);
//     const result = await dlandrfclose.dlrfclose(config.credentials.username, config.credentials.password);
//     expect(result).toBeTruthy();
// });

// test('Delivered and partial collect with RFC close', async ({ page }) => {
//     const dlandrfclose = new DlAndRFClosePage(page);

//     await page.goto(config.baseURLpreprod);
//     const result = await dlandrfclose.dlrfclose(config.credentials.username, config.credentials.password);
//     expect(result).toBeTruthy();
// });

// test('Delivered , full collection  and RFC close', async ({ page }) => {
//     const dlandrfclose = new DlAndRFClosePage(page);

//     await page.goto(config.baseURLpreprod);
//     const result = await dlandrfclose.dlrfclosefullcollection(config.credentials.username, config.credentials.password);
//     expect(result).toBeTruthy();
// });


// test('Delivered , full collection  and RFC close', async ({ page }) => {
//     const dlandrfclose = new DlAndRFClosePage(page);

//     await page.goto(config.baseURLpreprod);
//     const result = await dlandrfclose.PartialDeliveredFullCollectionRfcClose(config.credentials.username, config.credentials.password);
//     expect(result).toBeTruthy();
// });

test('Delivered , full collection  and RFC close', async ({ page }) => {
    const dlandrfclose = new DlAndRFClosePage(page);

    await page.goto(config.baseURLpreprod);
    const result = await dlandrfclose.DeliveryAttemptRfcClose(config.credentials.username, config.credentials.password);
    expect(result).toBeTruthy();
});

// test('Delivered , full collection  and RFC close', async ({ page }) => {
//     const dlandrfclose = new DlAndRFClosePage(page);

//     await page.goto(config.baseURLpreprod);
//     const result = await dlandrfclose.DeliveryActionOnEachRow(config.credentials.username, config.credentials.password);
//     expect(result).toBeTruthy();
// });