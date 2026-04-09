const { test, expect } = require('@playwright/test');
const { VehicleAllocationPage } = require('../../pages/vehicleAllocationPage');
const config = require('../../config/base.config');

test('Allocate vehicle for Nothing brand (ERHS) and verify EWB number', async ({ page }) => {
    test.setTimeout(180000);

    const vehicleAllocationPage = new VehicleAllocationPage(page);
    await page.goto(config.baseURLpreprod);

    const result = await vehicleAllocationPage.allocateVehicleNothingBrand(
        config.credentials.username,
        config.credentials.password
    );

    expect(result.success).toBeTruthy();
    expect(result.ewbVerified).toBeTruthy();
    expect(result.ewbNumber).toBeTruthy();
    expect(result.consolidatedEwbNumber).toBeTruthy();
    console.log(`EWB Number: ${result.ewbNumber}`);
    console.log(`Consolidated EWB Number: ${result.consolidatedEwbNumber}`);
});
