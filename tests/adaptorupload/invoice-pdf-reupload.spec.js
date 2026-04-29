const { test, expect } = require('@playwright/test');
const config = require('../../config/base.config');
const { invoicePdfReUpload } = require('../../utils/uploadTestHelper');
const { FC_CODES } = require('../../utils/fcbrands');

// Usage: npx playwright test tests/adaptorupload/invoice-pdf-reupload.spec.js --headed -g "BTML-BRIT"
//
// Invoice numbers are sourced from test-data/Orders/{brand}/m1.csv via
// test-data/InvoicePdfUpload/{brand}.js, then injected into the matching
// {brand}.pdf in place before upload.

const BRANDS = ['brit'];

for (const fc of FC_CODES) {
    for (const brand of BRANDS) {
        test.describe(`${fc.toUpperCase()}-${brand.toUpperCase()}`, () => {
            test('Invoice PDF Re-Upload', async ({ page }) => {
                test.setTimeout(300_000);
                const result = await invoicePdfReUpload(page, config.baseURLpreprod, fc, brand);
                expect(result).toBeTruthy();
            });
        });
    }
}
