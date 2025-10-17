const { test, expect } = require('@playwright/test');
const { VehicleAllocationPage } = require('../../pages/vehicleAllocationPage');
const config = require('../../config/base.config');

// test('Allocate vehicle', async ({ page }) => {
//     const vehicleAllocationPage = new VehicleAllocationPage(page);

//     await page.goto(config.baseURL);
//     const result = await vehicleAllocationPage.allocateVehicle(config.credentials.username, config.credentials.password);
//     expect(result).toBeTruthy();
// });

test('Allocate vehicle with fc and brand', async ({ page }) => {
    const vehicleAllocationPage = new VehicleAllocationPage(page);

    await page.goto(config.baseURL);
    const result = await vehicleAllocationPage.allocateVehiclewithfcbrand(config.credentials.username, config.credentials.password, 'btml', 'britania');
    expect(result).toBeTruthy();
});

// test('Allocate vehicle with fc and brand', async ({ page }) => {
//     const vehicleAllocationPage = new VehicleAllocationPage(page);

//     await page.goto(config.baseURL);
//     const result = await vehicleAllocationPage.allocateVehiclewithfcbrand(config.credentials.username, config.credentials.password, 'peenya', 'nestle');
//     expect(result).toBeTruthy();
// });

// test('Preprod Allocate vehicle with fc and brand', async ({ page }) => {
//     const vehicleAllocationPage = new VehicleAllocationPage(page);

//     await page.goto(config.baseURLpreprod);
//     const result = await vehicleAllocationPage.allocateVehiclewithfcbrand(config.credentials.username, config.credentials.password, 'btml', 'britannia');
//     expect(result).toBeTruthy();
// });

// test('Allocate vehicle with fc and brand', async ({ page }) => {
//     const vehicleAllocationPage = new VehicleAllocationPage(page);
//     await page.goto(config.baseURL);
//     const result = await vehicleAllocationPage.allocateVehiclewithfcbrand(config.credentials.username, config.credentials.password, 'yspr', 'hul');
//     expect(result).toBeTruthy();
// });

// test('Allocate vehicle with fc and brand', async ({ page }) => {
//     const vehicleAllocationPage = new VehicleAllocationPage(page);
//     await page.goto(config.baseURL);
//     const result = await vehicleAllocationPage.allocateVehiclewithfcbrand(config.credentials.username, config.credentials.password, 'yspr', 'huls');
//     expect(result).toBeTruthy();
// });