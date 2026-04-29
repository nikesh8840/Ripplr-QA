const { test, expect } = require('@playwright/test');
const { DlAndRFClosePage } = require('../../pages/dl-rfclose.page');
const config = require('../../config/base.config');
const { FC_CODES } = require('../../utils/fcbrands');
const { SALES_ORDER_BRAND_CONFIG } = require('../../utils/uploadTestHelper');
const { openTunnel, closeTunnel, queryOne } = require('../../utils/dbUtils');

// DL = full delivery, PD = partial delivered, DA = delivery attempt, CA = cancel
// DB verification runs for DL and PD (collection amount entered for those only)
//
// Usage:
//   npx playwright test tests/vehicle-allocation/delivery.spec.js --headed -g "BGRD-MRCO-DL"
//   npx playwright test tests/vehicle-allocation/delivery.spec.js --headed -g "BGRD-SNPR-PD"
//   npx playwright test tests/vehicle-allocation/delivery.spec.js --headed -g "BTML-BRIT-DA"
//   npx playwright test tests/vehicle-allocation/delivery.spec.js --headed -g "BYTI-GDJ-CA"

const ACTION_CODES = ['DL', 'PD', 'DA', 'CA'];
const brands = Object.keys(SALES_ORDER_BRAND_CONFIG);

test.beforeAll(async () => {
    await openTunnel();
});

test.afterAll(async () => {
    await closeTunnel();
});

for (const fc of FC_CODES) {
    for (const brand of brands) {
        const brandCfg = SALES_ORDER_BRAND_CONFIG[brand];
        const brandCode = brandCfg.brand || brand;

        for (const action of ACTION_CODES) {
            test(`${fc.toUpperCase()}-${brand.toUpperCase()}-${action}`, async ({ page }) => {
                test.setTimeout(300_000);
                const dlPage = new DlAndRFClosePage(page);
                await page.goto(config.baseURLpreprod);

                const result = await dlPage.deliveryFlowWithFcBrand(
                    config.credentials.username, config.credentials.password,
                    fc, brandCode, [action]
                );
                expect(result.success).toBeTruthy();

                // DB verification only for DL and PD (collection amount is entered for these)
                if (['DL', 'PD'].includes(action)) {
                    console.log('\n========== DB VERIFICATION ==========');
                    console.log(`Action: ${action} | Total rows processed: ${result.rows.length}`);
                    console.log('UI-entered data:', JSON.stringify(result.rows, null, 2));
                    console.log('=====================================\n');

                    for (const row of result.rows) {
                        if (!row.invoiceNo || row.collectedAmount === 0) continue;

                        console.log(`\n---------- Invoice: ${row.invoiceNo} ----------`);
                        console.log(`[UI] Amount entered in cash field: ₹${row.collectedAmount}`);

                        // ── Table 1: collection_invoices (multiple rows per invoice, pick latest) ──
                        console.log(`\n[TABLE: cdms.collection_invoices] Query: WHERE invoice_no = '${row.invoiceNo}' ORDER BY id DESC LIMIT 1`);
                        const ciRow = await queryOne(
                            'SELECT id, invoice_no, collected_amount, current_outstanding_amount FROM cdms.collection_invoices WHERE invoice_no = ? ORDER BY id DESC LIMIT 1',
                            [row.invoiceNo]
                        );
                        console.log(`[TABLE: cdms.collection_invoices] Latest row:`, ciRow);
                        expect(ciRow, `No collection_invoices entry found for invoice_no=${row.invoiceNo}`).not.toBeNull();
                        const ciAmt = Number(ciRow.collected_amount);
                        console.log(`[TABLE: cdms.collection_invoices] collected_amount = ${ciAmt} | expected = ${row.collectedAmount} | match = ${ciAmt === row.collectedAmount ? '✓' : '✗'}`);
                        console.log(`[TABLE: cdms.collection_invoices] current_outstanding_amount = ${ciRow.current_outstanding_amount}`);
                        expect(ciAmt).toBe(row.collectedAmount);

                        // ── Table 2: ChampOutstandingInvoices (one row per invoice, cumulative) ──
                        console.log(`\n[TABLE: cdms.ChampOutstandingInvoices] Query: WHERE invoice_no = '${row.invoiceNo}'`);
                        const champRow = await queryOne(
                            'SELECT invoice_no, collected_amount, current_outstanding_amount FROM cdms.ChampOutstandingInvoices WHERE invoice_no = ?',
                            [row.invoiceNo]
                        );
                        console.log(`[TABLE: cdms.ChampOutstandingInvoices] Row:`, champRow);
                        expect(champRow, `No ChampOutstandingInvoices entry found for invoice_no=${row.invoiceNo}`).not.toBeNull();
                        const champAmt = Number(champRow.collected_amount);
                        console.log(`[TABLE: cdms.ChampOutstandingInvoices] collected_amount = ${champAmt} | expected ≥ ${row.collectedAmount} | pass = ${champAmt >= row.collectedAmount ? '✓' : '✗'}`);
                        console.log(`[TABLE: cdms.ChampOutstandingInvoices] current_outstanding_amount = ${champRow.current_outstanding_amount}`);
                        expect(champAmt).toBeGreaterThanOrEqual(row.collectedAmount);

                        console.log(`---------- Invoice ${row.invoiceNo} verified ----------\n`);
                    }
                }
            });
        }
    }
}
