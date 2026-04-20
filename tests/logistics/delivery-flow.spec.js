const { test, expect } = require('@playwright/test');
const { DlAndRFClosePage } = require('../../pages/dl-rfclose.page');
const config = require('../../config/base.config');
const { FC_CODES } = require('../../utils/fcbrands');
const { SALES_ORDER_BRAND_CONFIG } = require('../../utils/uploadTestHelper');

// npx playwright test tests/logistics/delivery-flow.spec.js --headed -g BGRD-MRCO SEQ=DL,PD,DA,CA
// SEQ = comma-separated action sequence (cycles if more invoices than actions)
//   DL=Delivered, PD=Partial Delivery, DA=Delivery Attempt, CA=Cancel
//
// npx playwright test tests/logistics/delivery-flow.spec.js --headed -g BGRD-SNPR SEQ=DL
// npx playwright test tests/logistics/delivery-flow.spec.js --headed -g BGRD-SNPR SEQ=PD,DL
// npx playwright test tests/logistics/delivery-flow.spec.js --headed -g BGRD-MRCO SEQ=DA,DL
// npx playwright test tests/logistics/delivery-flow.spec.js --headed -g "BTML-BRIT " SEQ=DL

const seq = (process.env.SEQ || 'DL').toUpperCase().split(',');
console.log(`Action sequence: ${seq.join(' → ')} (cycles for more invoices)`);

const brands = Object.keys(SALES_ORDER_BRAND_CONFIG);

for (const fc of FC_CODES) {
    for (const brand of brands) {
        const brandCfg = SALES_ORDER_BRAND_CONFIG[brand];
        const brandCode = brandCfg.brand || brand;

        test.describe(`${fc.toUpperCase()}-${brand.toUpperCase()}`, () => {
            test('Delivery flow', async ({ page }) => {
                test.setTimeout(300_000);
                const dlPage = new DlAndRFClosePage(page);
                await page.goto(config.baseURLpreprod);
                const result = await dlPage.deliveryFlowWithFcBrand(
                    config.credentials.username, config.credentials.password,
                    fc, brandCode, seq
                );
                expect(result).toBeTruthy();
            });
        });
    }
}
