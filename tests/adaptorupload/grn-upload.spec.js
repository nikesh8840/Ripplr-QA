const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const config = require('../../config/base.config');
const { grnUpload } = require('../../utils/uploadTestHelper');
const { FC_CODES } = require('../../utils/fcbrands');

// Usage: npx playwright test tests/adaptorupload/grn-upload.spec.js --headed -g BGRD-SNPR
// The -g flag filters by FCcode-BrandCode (e.g. BGRD-SNPR, MDPT-NESL, BTML-BRIT)

const GRN_DIR = path.resolve(__dirname, '../../test-data/GRN');
const brandFiles = fs.readdirSync(GRN_DIR).filter(f => f.endsWith('.csv'));

for (const fc of FC_CODES) {
    for (const file of brandFiles) {
        const brand = path.basename(file, '.csv');

        test(`Upload GRN ${fc.toUpperCase()}-${brand.toUpperCase()}`, async ({ page }) => {
            test.setTimeout(300_000);
            const result = await grnUpload(page, config.baseURLpreprod, fc, brand);
            expect(result).toBeTruthy();
        });
    }
}
