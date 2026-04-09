const { test, expect } = require('@playwright/test');
const config = require('../../config/base.config');
const { simpleUpload, singleFileUpload, fcBrandUpload, singleFileUploadAPXWithIncrement, singleFileUploadWithIncrement, twoFileUploadWithIncrement, threeFileUploadWithIncrement } = require('../../utils/uploadTestHelper');

// Simple Upload Tests
// test('Upload GRN file', async ({ page }) => {
//     const result = await simpleUpload(page, config.baseURL43, 'Purchase Order', 'GRN');
//     expect(result).toBeTruthy();
// });

// test('Upload salesOrder file', async ({ page }) => {
//     const result = await simpleUpload(page, config.baseURL43, 'Sales Order', 'salesorder');
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

// test('Upload salesOrder file - Preprod', async ({ page }) => {
//     const result = await simpleUpload(page, config.baseURLpreprod, 'Sales Order', 'salesorder');
//     expect(result).toBeTruthy();
// });

// test('Upload SalesReturn file', async ({ page }) => {
//     const result = await simpleUpload(page, config.baseURL43, 'Sales Return', 'salesreturn');
//     expect(result).toBeTruthy();
// });

// // FC-Brand Uploads
// test('Upload BNDP:NBO sales order file', async ({ page }) => {
//     const result = await fcBrandUpload(page, config.baseURL43, 'Sales Order', 'bndp', 'nbo');
//     expect(result).toBeTruthy();
// });

// test('Upload BTML:BRIT sales order file', async ({ page }) => {
//     const result = await threeFileUploadWithIncrement(
//         page, config.baseURLpreprod, 'btml', 'britannia',
//         ['m1.csv', 'h1.csv', 'sr.csv'],
//         ['Invoice No', 'Invoice No', 'Invoice No']
//     );
//     expect(result).toBeTruthy();
// });

// test('Upload plvm:nestle sales order file', async ({ page }) => {
//     const result = await threeFileUploadWithIncrement(
//         page, config.baseURLpreprod, 'plvm', 'nestle',
//         ['ms3.csv', 'bl3.csv', 'ss3.csv'],
//         ['Bill Number / Sales Return Number', 'Sales Invoice Number', 'Bill Number']
//     );
//     expect(result).toBeTruthy();
// });

// test('Upload PLVM:BRIT sales order file', async ({ page }) => {
//     const result = await fcBrandUpload(page, config.baseURLpreprod, 'Sales Order', 'plvm', 'britannia');
//     expect(result).toBeTruthy();
// });

// test('Upload PEENYA:NESTLE sales order file', async ({ page }) => {
//     const result = await fcBrandUpload(page, config.baseURLpreprod, 'Sales Order', 'peenya', 'nestle');
//     expect(result).toBeTruthy();
// });

// Two-File Uploads with Bill Increment
test('Upload BGRD:MARICO sales order file', async ({ page }) => {
    const result = await singleFileUploadWithIncrement(page, config.baseURLpreprod, 'bgrd', 'mrco');
    expect(result).toBeTruthy();
});

// test('Upload BYTI:GDJGT sales order file', async ({ page }) => {
//     const result = await twoFileUploadWithIncrement(page, config.baseURLpreprod, 'byti', 'gdj',
//         ['u.csv', 'c.csv'],
//         ['Bill No', 'CN_Adjusted_Bill_No']
//     );
//     expect(result).toBeTruthy();
// });

// test('Upload BTML:NIVEA sales order file', async ({ page }) => {
//     const result = await twoFileUploadWithIncrement(page, config.baseURLpreprod, 'btml', 'nivea');
//     expect(result).toBeTruthy();
// });

// test('Upload MDPT:GODREJ sales order file', async ({ page }) => {
//     const result = await twoFileUploadWithIncrement(page, config.baseURL43, 'mdpt', 'godrej');
//     expect(result).toBeTruthy();
// });

// test('Upload HRMV:DABUR sales order file', async ({ page }) => {
//     const result = await twoFileUploadWithIncrement(page, config.baseURL43, 'hrmv', 'dabur');
//     expect(result).toBeTruthy();
// });

// test('Upload TLBL:MRCO sales order file', async ({ page }) => {
//     const result = await twoFileUploadWithIncrement(page, config.baseURLpreprod, 'tlbl', 'mrco');
//     expect(result).toBeTruthy();
// });

// Three-File Uploads with Bill Increment
// test('Upload YSPR:HUL sales order file', async ({ page }) => {
//     const result = await threeFileUploadWithIncrement(page, config.baseURLpreprod, 'yspr', 'hul');
//     expect(result).toBeTruthy();
// });

// test('Upload YSPR:HULS sales order file', async ({ page }) => {
//     const result = await threeFileUploadWithIncrement(page, config.baseURLpreprod, 'yspr', 'huls');
//     expect(result).toBeTruthy();
// });

// test('Upload TLBL:HUL sales order file', async ({ page }) => {
//     const result = await threeFileUploadWithIncrement(page, config.baseURLpreprod, 'tlbl', 'hul');
//     expect(result).toBeTruthy();
// });
