const { test, expect } = require('@playwright/test');
const path = require('path');
const config = require('../../config/base.config');
const { simpleUpload, singleFileUpload, fcBrandUpload, singleFileUploadAPXWithIncrement, singleFileUploadWithIncrement, twoFileUploadWithIncrement, threeFileUploadWithIncrement, returnRequestPdfUpload } = require('../../utils/uploadTestHelper');

// Simple Upload Tests
// test('Upload GRN file', async ({ page }) => {
//     const result = await simpleUpload(page, config.baseURLpreprod, 'Purchase Order', 'GRN');
//     expect(result).toBeTruthy();
// });

// test('Upload salesOrder file - Google', async ({ page }) => {
//     const result = await singleFileUpload(page, config.baseURL43, 'Sales Order', 'salesordergoogle');
//     expect(result).toBeTruthy();
// });

// test('Upload salesOrder file - Nothing', async ({ page }) => {
//     test.setTimeout(180000);
//     const result = await singleFileUploadAPXWithIncrement(page, config.baseURLpreprod, 'Sales Order', 'nothing', 'UploadSinglefileforerhsNTNG', 'Doc. No.');
//     expect(result).toBeTruthy();
// });

// test('Upload salesOrder file - Samsung', async ({ page }) => {
//     const result = await singleFileUpload(page, config.baseURL43, 'Sales Order', 'salesorderSamsung', 'UploadSinglefileforermkSMSNG');
//     expect(result).toBeTruthy();
// });


// test('Upload SalesReturn file', async ({ page }) => {
//     const result = await simpleUpload(page, config.baseURL43, 'Sales Return', 'salesreturn');
//     expect(result).toBeTruthy();
// });
