const { test, expect } = require('@playwright/test');
const { QCPicklistPage, readInvoiceNumbersFromCSV } = require('../../pages/qcPicklist.page');
const config = require('../../config/base.config');
const { FC_CODES } = require('../../utils/fcbrands');
const { SALES_ORDER_BRAND_CONFIG } = require('../../utils/uploadTestHelper');

// Usage:
// npx playwright test tests/logistics/qc-picklist.spec.js --headed -g "BTML-BRIT-3"    (pick 3 latest)
// npx playwright test tests/logistics/qc-picklist.spec.js --headed -g "BGRD-MRCO-all"  (select all)
// npx playwright test tests/logistics/qc-picklist.spec.js --headed -g "BGRD-MRCO-csv"  (from Orders CSV)

const COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'all', 'csv'];
const brands = Object.keys(SALES_ORDER_BRAND_CONFIG);

for (const fc of FC_CODES) {
    for (const brand of brands) {
        const brandCfg = SALES_ORDER_BRAND_CONFIG[brand];
        const brandCode = brandCfg.brand || brand;
        const tag = `${fc.toUpperCase()}-${brand.toUpperCase()}`;

        for (const count of COUNTS) {
            test(`${tag}-${count}`, async ({ page }) => {
                test.setTimeout(300_000);

                let pickOption;
                if (count === 'csv') {
                    const invoices = readInvoiceNumbersFromCSV(brand);
                    pickOption = invoices.length > 0 ? invoices : 0;
                    console.log(`Mode: from Orders/${brand}/ CSV → ${invoices.length > 0 ? invoices.join(', ') : 'none found, will select all'}`);
                } else if (count === 'all') {
                    pickOption = 0;
                    console.log('Mode: select all invoices');
                } else {
                    pickOption = count;
                    console.log(`Mode: pick ${count} latest invoice(s)`);
                }

                const qcPage = new QCPicklistPage(page);
                await page.goto(config.baseURLpreprod);
                const result = await qcPage.generatePicklist(
                    config.credentials.username, config.credentials.password,
                    fc, brandCode, pickOption
                );
                expect(result).toBeTruthy();
            });
        }
    }
}
