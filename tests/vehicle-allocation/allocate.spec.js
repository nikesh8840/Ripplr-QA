const { test, expect } = require('@playwright/test');
const { VehicleAllocationPage } = require('../../pages/vehicleAllocationPage');
const config = require('../../config/base.config');
const { FC_CODES } = require('../../utils/fcbrands');
const { SALES_ORDER_BRAND_CONFIG } = require('../../utils/uploadTestHelper');

// Usage: npx playwright test tests/vehicle-allocation/allocate.spec.js --headed -g "BGRD-MRCO-4"
// Format: FC-BRAND-COUNT  (count = number of invoices to allocate)
//
// npx playwright test tests/vehicle-allocation/allocate.spec.js --headed -g "BGRD-SNPR-1"
// npx playwright test tests/vehicle-allocation/allocate.spec.js --headed -g "BGRD-MRCO-4"
// npx playwright test tests/vehicle-allocation/allocate.spec.js --headed -g "BTML-BRIT-2"
// npx playwright test tests/vehicle-allocation/allocate.spec.js --headed -g "BYTI-GDJ-3"

const COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const brands = Object.keys(SALES_ORDER_BRAND_CONFIG);

for (const fc of FC_CODES) {
    for (const brand of brands) {
        const brandCfg = SALES_ORDER_BRAND_CONFIG[brand];
        const brandCode = brandCfg.brand || brand;

        for (const count of COUNTS) {
            test(`${fc.toUpperCase()}-${brand.toUpperCase()}-${count}`, async ({ page }) => {
                test.setTimeout(300_000);
                const vehicleAllocationPage = new VehicleAllocationPage(page);
                await page.goto(config.baseURLpreprod);
                const result = await vehicleAllocationPage.allocateVehiclewithfcbrand(
                    config.credentials.username, config.credentials.password,
                    fc, brandCode, count
                );
                expect(result).toBeTruthy();
            });
        }
    }
}
