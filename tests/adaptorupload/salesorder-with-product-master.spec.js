/**
 * BGRD:MARICO — Sales Order with Auto Product Master
 *
 * Flow:
 *  1. Increment bill numbers & upload the sales order file
 *  2. After processing, scan the eye view for "product not found" errors
 *  3. If any products are missing:
 *       a. Extract those products from the sales order CSV
 *       b. Build product master CSV using config/ProductMaster.js column mapping
 *          (only mapped columns change; rest copied from template row)
 *       c. Upload and process the product master
 *       d. Re-increment bill numbers & re-upload sales order
 *  4. Assert the final upload succeeded
 *
 * Run:
 *   npx playwright test tests/adaptorupload/salesorder-with-product-master.spec.js --headed
 */

const { test, expect }  = require('@playwright/test');
const config             = require('../../config/base.config');
const pmBrandConfig      = require('../../config/ProductMaster');
const { Uploadfile }     = require('../../pages/Aupload.page');
const { incrementBillNumbers } = require('../../utils/dataUtils');
const {
    extractProductsFromSalesOrderCSV,
    filterFailedProducts,
    buildProductMasterCSV,
} = require('../../utils/productMasterUtils');
const path = require('path');

// ── Config ───────────────────────────────────────────────────────────────────
const FC    = 'bgrd';
const BRAND = 'mrco';

const SALES_ORDER_CSV = path.resolve(__dirname, '../../test-data/bgrd-mrco/salesmarico.csv');

// Brand-specific product master config (column mapping + template/output paths)
const brandPmCfg = pmBrandConfig[BRAND];

// Column names in the sales order CSV to extract product info from
const soCols = config.productMaster.salesOrderCols;

// ── Test ─────────────────────────────────────────────────────────────────────

test('BGRD:MARICO Sales Order — auto Product Master if needed', async ({ page }) => {
    test.setTimeout(300_000); // 5 min — covers two upload cycles if needed

    const { username, password } = config.credentials;
    const uploadPage = new Uploadfile(page);

    // ── Step 1: Increment bill numbers ───────────────────────────────────────
    console.log('\n[Step 1] Incrementing bill numbers');
    await incrementBillNumbers(SALES_ORDER_CSV, 'Bill Number');

    // ── Step 2: Upload sales order ───────────────────────────────────────────
    console.log('\n[Step 2] Uploading sales order');
    await page.goto(config.baseURLpreprod);
    const firstUploadOk = await uploadPage.UploadSinglefileFcBrand(
        username, password, 'Sales Order', FC, BRAND
    );

    // ── Step 3: Scan eye view for product not found errors ───────────────────
    console.log('\n[Step 3] Scanning for product not found errors');
    const failedCodes = await uploadPage.scanForProductNotFoundErrors();

    if (failedCodes.size === 0 && firstUploadOk) {
        console.log('\n✅ Sales order uploaded — no product master needed');
        expect(firstUploadOk).toBeTruthy();
        return;
    }

    // ── Step 4: Extract products from sales order CSV ────────────────────────
    console.log(`\n[Step 4] Extracting product info (${failedCodes.size || 'all'} products)`);
    const allProducts     = extractProductsFromSalesOrderCSV(SALES_ORDER_CSV, soCols);
    const missingProducts = filterFailedProducts(allProducts, failedCodes);

    console.log(`Products to add: ${missingProducts.map(p => p.code).join(', ')}`);
    expect(missingProducts.length, 'No products extracted for product master').toBeGreaterThan(0);

    // ── Step 5: Build product master CSV using template + column mapping ──────
    // Only columns defined in config/ProductMaster.js[brand].columnMap are updated.
    // All other columns (distributor info, stock qty, etc.) are copied from the
    // first data row of the template file.
    console.log('\n[Step 5] Building product master CSV from template');
    const pmOutputPath = buildProductMasterCSV(missingProducts, brandPmCfg);

    // ── Step 6: Upload product master ────────────────────────────────────────
    console.log('\n[Step 6] Uploading product master');
    await page.goto(config.baseURLpreprod);
    const pmOk = await uploadPage.uploadProductMasterFcBrand(
        username, password, FC, BRAND, pmOutputPath
    );
    expect(pmOk, 'Product master upload failed').toBeTruthy();
    console.log('✅ Product master uploaded and processed');

    // ── Step 7: Re-increment & re-upload sales order ─────────────────────────
    console.log('\n[Step 7] Re-incrementing bill numbers and re-uploading sales order');
    await incrementBillNumbers(SALES_ORDER_CSV, 'Bill Number');
    await page.goto(config.baseURLpreprod);
    const secondUploadOk = await uploadPage.UploadSinglefileFcBrand(
        username, password, 'Sales Order', FC, BRAND
    );

    // ── Step 8: Confirm no remaining product errors ───────────────────────────
    console.log('\n[Step 8] Confirming no product errors remain');
    const remaining = await uploadPage.scanForProductNotFoundErrors();
    if (remaining.size > 0) {
        console.warn(`⚠️  Still missing after fix: ${[...remaining].join(', ')}`);
    }

    expect(secondUploadOk, 'Sales order re-upload failed after product master fix').toBeTruthy();
    console.log('\n✅ Sales order uploaded successfully after product master fix');
});
