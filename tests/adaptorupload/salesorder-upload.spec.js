const { test, expect } = require('@playwright/test');
const config = require('../../config/base.config');
const { salesOrderUpload, SALES_ORDER_BRAND_CONFIG } = require('../../utils/uploadTestHelper');
const { FC_CODES } = require('../../utils/fcbrands');

// Usage: npx playwright test tests/adaptorupload/salesorder-upload.spec.js --headed -g "BTML-BRIT "
// Add a trailing space in quotes for exact match (prevents BRIT matching BRITIS/BRITRW)
// npx playwright test tests/adaptorupload/salesorder-upload.spec.js --headed -g "BTML-BRIT "
// npx playwright test tests/adaptorupload/salesorder-upload.spec.js --headed -g "BTML-BRITIS "
// npx playwright test tests/adaptorupload/salesorder-upload.spec.js --headed -g "BTML-BRITRW "
// npx playwright test tests/adaptorupload/salesorder-upload.spec.js --headed -g "BYTI-GDJ "
// npx playwright test tests/adaptorupload/salesorder-upload.spec.js --headed -g "BYTI-GDJGT "
// npx playwright test tests/adaptorupload/salesorder-upload.spec.js --headed -g "BYTI-GDJMT "
// npx playwright test tests/adaptorupload/salesorder-upload.spec.js --headed -g "TLBL-HUL "
// npx playwright test tests/adaptorupload/salesorder-upload.spec.js --headed -g "TLBL-HULS "
// npx playwright test tests/adaptorupload/salesorder-upload.spec.js --headed -g BGRD-MRCO
// npx playwright test tests/adaptorupload/salesorder-upload.spec.js --headed -g MDPT-NESL
// npx playwright test tests/adaptorupload/salesorder-upload.spec.js --headed -g BGRD-SNPR
// npx playwright test tests/adaptorupload/salesorder-upload.spec.js --headed -g BGRD-SNPRGT
// For brands without prefix conflicts (MRCO, NESL, SNPR, SNPRGT) quotes are optional


const brands = Object.keys(SALES_ORDER_BRAND_CONFIG);

for (const fc of FC_CODES) {
    for (const brand of brands) {
        test.describe(`${fc.toUpperCase()}-${brand.toUpperCase()}`, () => {
            test('Upload SalesOrder', async ({ page }) => {
                test.setTimeout(300_000);
                const result = await salesOrderUpload(page, config.baseURLpreprod, fc, brand);
                expect(result).toBeTruthy();
            });
        });
    }
}
