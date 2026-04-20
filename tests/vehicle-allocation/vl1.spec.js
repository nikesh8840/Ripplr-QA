const { test, expect } = require('@playwright/test');
const { VehicleAllocationPage } = require('../../pages/vehicleAllocationPage');
const config = require('../../config/base.config');

test('Preprod Allocate vehicle with fc and brand', async ({ page }) => {
    const vehicleAllocationPage = new VehicleAllocationPage(page);

    await page.goto(config.baseURLpreprod);
    const result = await vehicleAllocationPage.allocateVehiclewithfcbrand(config.credentials.username, config.credentials.password, 'bgrd', 'marico');
    expect(result).toBeTruthy();
});
