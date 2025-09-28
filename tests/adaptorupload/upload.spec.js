const { test, expect } = require('@playwright/test');
const { Uploadfile } = require('../../pages/Aupload.page');
const config = require('../../config/base.config');

// test('Upload GRN file', async ({ page }) => {
//     const uploadfile = new Uploadfile(page);

//     await page.goto(config.baseURL43);
//     const result = await uploadfile.Upload(config.credentials.username, config.credentials.password, 'Purchase Order', 'GRN');
//     expect(result).toBeTruthy();
// });



// test('Upload salesOrder file', async ({ page }) => {
//     const uploadfile = new Uploadfile(page);

//     await page.goto(config.baseURL43);
//     const result = await uploadfile.Upload(config.credentials.username, config.credentials.password, 'Sales Order', 'salesorder');
//     expect(result).toBeTruthy();
// });

// test('Upload SalesReturn file', async ({ page }) => {
//     const uploadfile = new Uploadfile(page);

//     await page.goto(config.baseURL43);
//     const result = await uploadfile.Upload(config.credentials.username, config.credentials.password, 'Sales Return', 'salesreturn');
//     expect(result).toBeTruthy();
// });

// test('Upload BTML:BRIT sales order file', async ({ page }) => {
//     const uploadfile = new Uploadfile(page);

//     await page.goto(config.baseURL43);
//     const result = await uploadfile.UploadSalesOrder(config.credentials.username, config.credentials.password, 'Sales Order', 'btml', 'britania');
//     expect(result).toBeTruthy();
// });

test('Upload BTML:BRIT sales order file', async ({ page }) => {
    const uploadfile = new Uploadfile(page);

    await page.goto(config.baseURL43);
    const result = await uploadfile.UploadSalesOrder(config.credentials.username, config.credentials.password, 'Sales Order', 'peenya', 'nestle');
    expect(result).toBeTruthy();
});

// test('Upload BTML:nivea sales order file', async ({ page }) => {
//     const uploadfile = new Uploadfile(page);

//     await page.goto(config.baseURL43);
//     const result = await uploadfile.UploadSalesOrdertwo(config.credentials.username, config.credentials.password, 'Sales Order', 'btml', 'nivea');
//     expect(result).toBeTruthy();
// });

// test('Upload MDPT:Godrej sales order file', async ({ page }) => {
//     const uploadfile = new Uploadfile(page);

//     await page.goto(config.baseURL43);
//     const result = await uploadfile.UploadSalesOrdertwo(config.credentials.username, config.credentials.password, 'Sales Order', 'mdpt', 'godrej');
//     expect(result).toBeTruthy();
// });

// test('Upload HRMV:Dabur sales order file', async ({ page }) => {
//     const uploadfile = new Uploadfile(page);

//     await page.goto(config.baseURL43);
//     const result = await uploadfile.UploadSalesOrdertwo(config.credentials.username, config.credentials.password, 'Sales Order', 'hrmv', 'dabur');
//     expect(result).toBeTruthy();
// });

// test('Upload YSPR:HUL sales order file', async ({ page }) => {
//     const uploadfile = new Uploadfile(page);

//     await page.goto(config.baseURL43);
//     const result = await uploadfile.UploadSalesOrder(config.credentials.username, config.credentials.password, 'Sales Order', 'yspr', 'hul');
//     expect(result).toBeTruthy();
// });

// test('Upload YSPR:HULS sales order file', async ({ page }) => {
//     const uploadfile = new Uploadfile(page);

//     await page.goto(config.baseURL43);
//     const result = await uploadfile.UploadSalesOrder(config.credentials.username, config.credentials.password, 'Sales Order', 'yspr', 'huls');
//     expect(result).toBeTruthy();
// });
