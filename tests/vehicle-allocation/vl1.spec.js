const { test, expect } = require('@playwright/test');
const { VehicleAllocationPage } = require('../../pages/vehicleAllocationPage');
const config = require('../../config/base.config');

test('Allocate vehicle', async ({ page }) => {
    const vehicleAllocationPage = new VehicleAllocationPage(page);

    await page.goto(config.baseURL);
    const result = await vehicleAllocationPage.allocateVehicle(config.credentials.username, config.credentials.password);
    expect(result).toBeTruthy();
});