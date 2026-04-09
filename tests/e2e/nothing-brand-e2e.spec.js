const { test, expect } = require('@playwright/test');
const { VehicleAllocationPage } = require('../../pages/vehicleAllocationPage');
const { incrementBillNumbers } = require('../../utils/dataUtils');
const { Uploadfile } = require('../../pages/Aupload.page');
const config = require('../../config/base.config');
const path = require('path');

// Nothing brand E2E: Upload → Allocate Vehicle → Verify EWB
test.describe('E2E - Nothing Brand (ERHS) Full Flow', () => {

    test('Upload Nothing Sales Order CSV, allocate vehicle, verify EWB', async ({ page }) => {
        test.setTimeout(300000);

        // Step 1: Increment Doc. No. in nothing.csv before upload
        const nothingCsvPath = path.resolve(__dirname, '../../test-data/APX/nothing.csv');
        await incrementBillNumbers(nothingCsvPath, 'Doc. No.');
        console.log('Step 1: Bill numbers incremented in nothing.csv');

        // Step 2: Upload the file
        const uploadPage = new Uploadfile(page);
        await page.goto(config.baseURLpreprod);
        const uploadResult = await uploadPage.UploadSinglefileforerhsNTNG(
            config.credentials.username,
            config.credentials.password,
            'Sales Order',
            'nothing'
        );
        expect(uploadResult).toBeTruthy();
        console.log('Step 2: Nothing CSV uploaded successfully');

        // Step 3: Allocate vehicle for ERHS / Nothing brand and verify EWB
        await page.goto(config.baseURLpreprod);
        const vehicleAllocationPage = new VehicleAllocationPage(page);
        const allocationResult = await vehicleAllocationPage.allocateVehicleNothingBrand(
            config.credentials.username,
            config.credentials.password
        );

        expect(allocationResult.success).toBeTruthy();
        expect(allocationResult.ewbVerified).toBeTruthy();
        expect(allocationResult.ewbNumber).toBeTruthy();
        expect(allocationResult.consolidatedEwbNumber).toBeTruthy();

        console.log('Step 3: Vehicle allocated');
        console.log(`  EWB Number: ${allocationResult.ewbNumber}`);
        console.log(`  Consolidated EWB: ${allocationResult.consolidatedEwbNumber}`);
    });

    test('Upload Nothing Sales Order only (increment + upload)', async ({ page }) => {
        test.setTimeout(180000);

        const nothingCsvPath = path.resolve(__dirname, '../../test-data/APX/nothing.csv');
        await incrementBillNumbers(nothingCsvPath, 'Doc. No.');

        const uploadPage = new Uploadfile(page);
        await page.goto(config.baseURLpreprod);
        const result = await uploadPage.UploadSinglefileforerhsNTNG(
            config.credentials.username,
            config.credentials.password,
            'Sales Order',
            'nothing'
        );
        expect(result).toBeTruthy();
    });

    test('Allocate vehicle for Nothing brand and verify both EWB numbers', async ({ page }) => {
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
    });

});
