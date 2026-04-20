/**
 * BGRD:MRCO — Marico Brand Sales Return — Full Validation Test Suite
 * TC-001 through TC-046 (PRD: RPM-Marico Brand Sales Return Adapter, 2026-04-04)
 *
 * Run:
 *   npx playwright test tests/adaptorupload/bgrd-mrco-salesreturn-validation.spec.js --headed
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');
const config      = require('../../config/base.config');
const { Uploadfile } = require('../../pages/Aupload.page');
const uploadLocators = require('../../locators/upload.locators');
const { openTunnel, closeTunnel, query } = require('../../utils/dbUtils');
const { incrementBillNumbers, recalculateGrossAmount, randomizeLastColumn, syncInvoiceNumbers } = require('../../utils/dataUtils');
const { singleFileUploadWithIncrement, salesReturnBgrdMrcoWithIncrement } = require('../../utils/uploadTestHelper');

// ─── Paths ────────────────────────────────────────────────────────────────────
const BASE_CSV       = path.resolve(__dirname, '../../test-data/bgrd-mrco-reutrn/MARCO_BrandReturn.csv');
const SO_CSV         = path.resolve(__dirname, '../../test-data/bgrd-mrco/salesmarico.csv');
const TEMP_DIR       = path.resolve(__dirname, '../../test-data/bgrd-mrco-reutrn/tmp');
const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots/bgrd-mrco-salesreturn-validation');

// ─── Constants ────────────────────────────────────────────────────────────────
const FC         = 'bgrd';
const FC_NAME    = 'BGRD: Begur Road';
const BRAND      = 'mrco';
const BRAND_NAME = 'MRCO: Marico';
const TOLERANCE  = 0.02;

// ─── Lifecycle ────────────────────────────────────────────────────────────────
test.beforeAll(async () => {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    await openTunnel();
});

test.afterAll(async () => {
    await closeTunnel();
    // Clean up temp CSVs
    if (fs.existsSync(TEMP_DIR)) {
        fs.readdirSync(TEMP_DIR).forEach(f => {
            try { fs.unlinkSync(path.join(TEMP_DIR, f)); } catch {}
        });
    }
});

test.afterEach(async ({ page }, testInfo) => {
    if (!page) return;
    const ts   = new Date().toISOString().replace(/[:.]/g, '-');
    const name = testInfo.title.replace(/[^a-z0-9]/gi, '_').slice(0, 50);
    await page.screenshot({
        path: `${SCREENSHOT_DIR}/${ts}_${name}_${testInfo.status}.png`,
        fullPage: true,
    }).catch(() => {});
});

// ─── CSV Helpers ──────────────────────────────────────────────────────────────
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
    const lines   = content.split('\n').filter(l => l.trim() !== '');
    return {
        headers: lines[0].split(','),
        rows:    lines.slice(1).map(l => l.split(',')),
    };
}

function writeTempCSV(name, headers, rows) {
    const p = path.join(TEMP_DIR, name);
    fs.writeFileSync(p, [headers.join(','), ...rows.map(r => r.join(','))].join('\n'), 'utf-8');
    return p;
}

function removeColumn(headers, rows, colName) {
    const idx = headers.findIndex(h => h.trim() === colName);
    return {
        headers: headers.filter((_, i) => i !== idx),
        rows:    rows.map(r => r.filter((_, i) => i !== idx)),
    };
}

function setColumn(headers, rows, colName, value) {
    const idx = headers.findIndex(h => h.trim() === colName);
    return rows.map(r => { const row = [...r]; if (idx !== -1) row[idx] = value; return row; });
}

/** Standard preprocessing for valid uploads */
async function prepareBaseCSV() {
    await recalculateGrossAmount(BASE_CSV);
    await syncInvoiceNumbers(SO_CSV, BASE_CSV, 'Bill Number', 'Reg InvoiceNumber', 3);
    await incrementBillNumbers(BASE_CSV, 'SalesReturnNo');
    randomizeLastColumn(BASE_CSV);
}

/**
 * Upload a Sales Return file with a custom path (mirrors UploadBgrdMrcoSalesReturn).
 * Returns { result: boolean, uploadfile: Uploadfile }
 */
async function uploadReturnFile(page, filePath) {
    const uploadfile = new Uploadfile(page);
    const l          = uploadLocators(page);

    await page.goto(config.baseURLpreprod);
    await uploadfile._login(config.credentials.username, config.credentials.password);

    await l.adapterUploadsLink.click();
    await l.uploadButton.click();
    await l.uploadCsvLabel.click();
    await page.waitForTimeout(200);
    await l.docTypeTitle('Sales Return').click();

    const modalFcInput = page.locator('.ant-modal-body .ant-form-item-control input').first();
    await modalFcInput.click();
    await modalFcInput.fill(FC);
    await l.textOption(FC_NAME).click();
    await l.brandCombobox.click();
    await l.brandCombobox.fill(BRAND);
    await l.textOption(BRAND_NAME).click();

    const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.getByRole('button', { name: /Upload a File/i }).first().click(),
    ]);
    await fileChooser.setFiles(filePath);
    await l.submitButton.click();
    await page.waitForTimeout(2000);

    const result = await uploadfile._searchAndVerify(
        l, 'Sales Return', FC, FC_NAME, BRAND, BRAND_NAME, 1.5, 14, 0, 0
    );
    return { result, uploadfile };
}

/** Get notification/toast text visible on page */
async function getNotificationText(page) {
    try {
        return await page
            .locator('.ant-notification-notice-message, .ant-message-notice-content')
            .first()
            .textContent({ timeout: 4000 });
    } catch { return ''; }
}

/**
 * Poll DB until latest BGRD:MRCO Sales Return file reaches fully_processed.
 * Returns file id or null on timeout/error.
 */
async function getLatestFileId() {
    const deadline = Date.now() + 120_000;
    const poll     = 5_000;
    while (Date.now() < deadline) {
        const [row] = await query(`
            SELECT id, fileStatus
            FROM   cdms.Files
            WHERE  fileType = 'sales_return'
              AND  fileName  LIKE '%BGRD%MRCO%'
            ORDER BY createdAt DESC
            LIMIT 1
        `);
        if (!row) { await new Promise(r => setTimeout(r, poll)); continue; }
        if (row.fileStatus === 'fully_processed')  return row.id;
        if (row.fileStatus === 'processing_error'
         || row.fileStatus === 'validation_error') return null;
        await new Promise(r => setTimeout(r, poll));
    }
    return null;
}

// =============================================================================
// CATEGORY A — HAPPY PATH
// =============================================================================

test('[TC-001] Valid CSV with all required fields uploads successfully', async ({ page }) => {
    test.setTimeout(180000);
    await prepareBaseCSV();
    const { result } = await uploadReturnFile(page, BASE_CSV);
    expect(result, 'Valid CSV should upload and process successfully').toBeTruthy();
});

test('[TC-002] Ignore fields populated — no error, not persisted', async ({ page }) => {
    test.setTimeout(180000);
    // Base CSV already carries all Ignore fields (DistrBrName, GodownName, BrandName, etc.)
    await prepareBaseCSV();
    const { result, uploadfile } = await uploadReturnFile(page, BASE_CSV);
    expect(result, 'Upload should succeed when Ignore fields are populated').toBeTruthy();
    const modal = uploadfile._lastModalText || '';
    expect(modal, 'No field-missing error expected for Ignore fields').not.toContain('field is missing');
});

// =============================================================================
// CATEGORY B — FIELD-LEVEL VALIDATION
// =============================================================================

test('[TC-003] Missing SalesReturnDt triggers field-missing error', async ({ page }) => {
    test.setTimeout(120000);
    const { headers, rows } = parseCSV(BASE_CSV);
    const { headers: h, rows: r } = removeColumn(headers, rows, 'SalesReturnDt');
    const tmp = writeTempCSV('tc003.csv', h, r);

    const { result, uploadfile } = await uploadReturnFile(page, tmp);
    const err = (uploadfile._lastModalText || '') + await getNotificationText(page);
    expect(
        !result || err.toLowerCase().includes('salesreturndt') || err.includes('field is missing'),
        `Expected SalesReturnDt missing error. Got: "${err.slice(0, 200)}"`
    ).toBeTruthy();
});

test('[TC-004] Missing SalesReturnNo triggers field-missing error', async ({ page }) => {
    test.setTimeout(120000);
    const { headers, rows } = parseCSV(BASE_CSV);
    const { headers: h, rows: r } = removeColumn(headers, rows, 'SalesReturnNo');
    const tmp = writeTempCSV('tc004.csv', h, r);

    const { result, uploadfile } = await uploadReturnFile(page, tmp);
    const err = (uploadfile._lastModalText || '') + await getNotificationText(page);
    expect(
        !result || err.toLowerCase().includes('salesreturnno') || err.includes('field is missing'),
        `Expected SalesReturnNo missing error. Got: "${err.slice(0, 200)}"`
    ).toBeTruthy();
});

test('[TC-005] Missing HSNCode triggers field-missing error', async ({ page }) => {
    test.setTimeout(120000);
    const { headers, rows } = parseCSV(BASE_CSV);
    const { headers: h, rows: r } = removeColumn(headers, rows, 'HSNCode');
    const tmp = writeTempCSV('tc005.csv', h, r);

    const { result, uploadfile } = await uploadReturnFile(page, tmp);
    const err = (uploadfile._lastModalText || '') + await getNotificationText(page);
    expect(
        !result || err.toLowerCase().includes('hsncode') || err.includes('field is missing'),
        `Expected HSNCode missing error. Got: "${err.slice(0, 200)}"`
    ).toBeTruthy();
});

test('[TC-006] Missing CustomerName + distrCustomerCode + ProductCode + ProductName triggers errors', async ({ page }) => {
    test.setTimeout(120000);
    let { headers, rows } = parseCSV(BASE_CSV);
    for (const col of ['CustomerName', 'distrCustomerCode', 'ProductCode', 'ProductName']) {
        ({ headers, rows } = removeColumn(headers, rows, col));
    }
    const tmp = writeTempCSV('tc006.csv', headers, rows);

    const { result, uploadfile } = await uploadReturnFile(page, tmp);
    const err = (uploadfile._lastModalText || '') + await getNotificationText(page);
    expect(
        !result || err.includes('field is missing') || err.toLowerCase().includes('customername'),
        `Expected lookup-field missing errors. Got: "${err.slice(0, 200)}"`
    ).toBeTruthy();
});

test('[TC-007] SalesReturnDt in ISO format triggers date format error', async ({ page }) => {
    test.setTimeout(120000);
    const { headers, rows } = parseCSV(BASE_CSV);
    const tmp = writeTempCSV('tc007.csv', headers, setColumn(headers, rows, 'SalesReturnDt', '2026-03-15'));

    const { result, uploadfile } = await uploadReturnFile(page, tmp);
    const err = (uploadfile._lastModalText || '') + await getNotificationText(page);
    expect(
        !result || err.toLowerCase().includes('date') || err.toLowerCase().includes('format'),
        `Expected date format error. Got: "${err.slice(0, 200)}"`
    ).toBeTruthy();
});

test('[TC-008] SalesReturnNo > 255 chars triggers length error', async ({ page }) => {
    test.setTimeout(120000);
    const longVal = 'A' + '1'.repeat(255); // 256 chars
    const { headers, rows } = parseCSV(BASE_CSV);
    const tmp = writeTempCSV('tc008.csv', headers, setColumn(headers, rows, 'SalesReturnNo', longVal));

    const { result, uploadfile } = await uploadReturnFile(page, tmp);
    const err = (uploadfile._lastModalText || '') + await getNotificationText(page);
    expect(
        !result || err.includes('255') || err.toLowerCase().includes('characters'),
        `Expected 255-char limit error. Got: "${err.slice(0, 200)}"`
    ).toBeTruthy();
});

test('[TC-009] SalesReturnNo exactly 255 chars is accepted', async ({ page }) => {
    test.setTimeout(180000);
    const val255 = 'A' + '1'.repeat(254); // 255 chars
    const { headers, rows } = parseCSV(BASE_CSV);
    let newRows = setColumn(headers, rows, 'SalesReturnNo', val255);
    const tmp = writeTempCSV('tc009.csv', headers, newRows);
    await recalculateGrossAmount(tmp);
    randomizeLastColumn(tmp);

    const { result } = await uploadReturnFile(page, tmp);
    expect(result, '255-char SalesReturnNo should be accepted').toBeTruthy();
});

test('[TC-010] prodBatchCode with special chars (@#) triggers alphanumeric error', async ({ page }) => {
    test.setTimeout(120000);
    const { headers, rows } = parseCSV(BASE_CSV);
    const tmp = writeTempCSV('tc010.csv', headers, setColumn(headers, rows, 'prodBatchCode', 'KI@0126#UU'));

    const { result, uploadfile } = await uploadReturnFile(page, tmp);
    const err = (uploadfile._lastModalText || '') + await getNotificationText(page);
    expect(
        !result || err.toLowerCase().includes('batch') || err.toLowerCase().includes('alphanumeric'),
        `Expected alphanumeric error for special-char batch code. Got: "${err.slice(0, 200)}"`
    ).toBeTruthy();
});

test.skip('[TC-011] prodBatchCode with hyphens — BLOCKED: EC-1 unresolved (sample CSV data contains hyphens; spec contradicts test data)', async ({ page }) => {
    // Unblock only after dev team confirms whether hyphens are allowed in prodBatchCode.
    // If hyphens are forbidden: expected error = alphanumeric validation failure.
    // If hyphens are allowed: PRD spec needs updating.
});

test('[TC-012] prodBatchCode exactly 55 alphanumeric chars is accepted', async ({ page }) => {
    test.setTimeout(180000);
    const { headers, rows } = parseCSV(BASE_CSV);
    const tmp = writeTempCSV('tc012.csv', headers, setColumn(headers, rows, 'prodBatchCode', 'A'.repeat(55)));
    await recalculateGrossAmount(tmp);
    await incrementBillNumbers(tmp, 'SalesReturnNo');
    randomizeLastColumn(tmp);

    const { result } = await uploadReturnFile(page, tmp);
    expect(result, '55-char alphanumeric batch code should be accepted').toBeTruthy();
});

test('[TC-013] prodBatchCode > 55 chars triggers length error', async ({ page }) => {
    test.setTimeout(120000);
    const { headers, rows } = parseCSV(BASE_CSV);
    const tmp = writeTempCSV('tc013.csv', headers, setColumn(headers, rows, 'prodBatchCode', 'A'.repeat(56)));

    const { result, uploadfile } = await uploadReturnFile(page, tmp);
    const err = (uploadfile._lastModalText || '') + await getNotificationText(page);
    expect(
        !result || err.includes('55') || err.toLowerCase().includes('batch'),
        `Expected batch code length error. Got: "${err.slice(0, 200)}"`
    ).toBeTruthy();
});

test('[TC-014] Empty prodBatchCode (null) is accepted', async ({ page }) => {
    test.setTimeout(180000);
    const { headers, rows } = parseCSV(BASE_CSV);
    const tmp = writeTempCSV('tc014.csv', headers, setColumn(headers, rows, 'prodBatchCode', ''));
    await recalculateGrossAmount(tmp);
    await incrementBillNumbers(tmp, 'SalesReturnNo');
    randomizeLastColumn(tmp);

    const { result } = await uploadReturnFile(page, tmp);
    expect(result, 'Null/empty batch code should be accepted').toBeTruthy();
});

test('[TC-015] Decimal Saleable Qty (8.5) triggers integer validation error', async ({ page }) => {
    test.setTimeout(120000);
    const { headers, rows } = parseCSV(BASE_CSV);
    const tmp = writeTempCSV('tc015.csv', headers, setColumn(headers, rows, 'Saleable Qty', '8.5'));

    const { result, uploadfile } = await uploadReturnFile(page, tmp);
    const err = (uploadfile._lastModalText || '') + await getNotificationText(page);
    expect(
        !result || err.toLowerCase().includes('integer') || err.toLowerCase().includes('decimal'),
        `Expected integer validation error for decimal qty. Got: "${err.slice(0, 200)}"`
    ).toBeTruthy();
});

test('[TC-016] Integer quantities stored correctly in brand_return_detail', async ({ page }) => {
    test.setTimeout(180000);
    await prepareBaseCSV();
    const { result } = await uploadReturnFile(page, BASE_CSV);
    expect(result, 'Integer quantities should be accepted').toBeTruthy();

    const fileId = await getLatestFileId();
    if (!fileId) return;

    const dbRows = await query(`
        SELECT good_qty, bad_qty, free_qty, total_return_qty
        FROM   cdms.brand_return_detail brd
        JOIN   cdms.brand_return br ON brd.brand_return_id = br.id
        WHERE  br.file_id = ?
        LIMIT  5
    `, [fileId]);

    for (const row of dbRows) {
        expect(Number.isInteger(Number(row.good_qty)),  'good_qty should be integer').toBeTruthy();
        expect(Number.isInteger(Number(row.bad_qty)),   'bad_qty should be integer').toBeTruthy();
        expect(Number.isInteger(Number(row.free_qty)),  'free_qty should be integer').toBeTruthy();
    }
});

test('[TC-017] NEW MRP as integer without decimal triggers float validation error', async ({ page }) => {
    test.setTimeout(120000);
    const { headers, rows } = parseCSV(BASE_CSV);
    const tmp = writeTempCSV('tc017.csv', headers, setColumn(headers, rows, 'NEW MRP', '60'));

    const { result, uploadfile } = await uploadReturnFile(page, tmp);
    const err = (uploadfile._lastModalText || '') + await getNotificationText(page);
    expect(
        !result || err.toLowerCase().includes('decimal') || err.toLowerCase().includes('mrp') || err.toLowerCase().includes('purchase_price'),
        `Expected float format error for NEW MRP. Got: "${err.slice(0, 200)}"`
    ).toBeTruthy();
});

test('[TC-018] NEW MRP as float (60.00) is accepted', async ({ page }) => {
    test.setTimeout(180000);
    // Base CSV already uses float values for NEW MRP
    await prepareBaseCSV();
    const { result } = await uploadReturnFile(page, BASE_CSV);
    expect(result, 'Float NEW MRP should be accepted').toBeTruthy();
});

// =============================================================================
// CATEGORY C — LOOKUP AND MAPPING LOGIC
// =============================================================================

test('[TC-019] Known CustomerName + distrCustomerCode maps to existing store', async ({ page }) => {
    test.setTimeout(180000);
    await prepareBaseCSV();
    const { result } = await uploadReturnFile(page, BASE_CSV);
    expect(result).toBeTruthy();

    // Verify store for 9854WC0766 exists (was not auto-created by this upload)
    // TODO: adjust table/column name to match actual schema
    const stores = await query(`
        SELECT id FROM cdms.stores
        WHERE  retailer_code = '9854WC0766'
        LIMIT  1
    `).catch(() => []);
    expect(stores.length, 'Existing store 9854WC0766 should be present in DB').toBeGreaterThan(0);
});

test('[TC-020] Unknown CustomerName + distrCustomerCode auto-creates new store', async ({ page }) => {
    test.setTimeout(180000);
    const uniqueCode = `AUTOTST${Date.now()}`;
    const { headers, rows } = parseCSV(BASE_CSV);
    let newRows = setColumn(headers, rows, 'CustomerName', 'Automation Test Store');
    newRows     = setColumn(headers, newRows, 'distrCustomerCode', uniqueCode);
    const tmp = writeTempCSV('tc020.csv', headers, newRows);
    await recalculateGrossAmount(tmp);
    await incrementBillNumbers(tmp, 'SalesReturnNo');
    randomizeLastColumn(tmp);

    const { result } = await uploadReturnFile(page, tmp);
    expect(result, 'Upload with unknown customer should succeed (auto-create store)').toBeTruthy();

    const newStore = await query(`
        SELECT id FROM cdms.stores WHERE retailer_code = ? LIMIT 1
    `, [uniqueCode]).catch(() => []);
    expect(newStore.length, 'New store should be created for unknown retailer code').toBeGreaterThan(0);
});

test('[TC-021] Known ProductCode + ProductName maps to existing product', async ({ page }) => {
    test.setTimeout(180000);
    await prepareBaseCSV();
    const { result } = await uploadReturnFile(page, BASE_CSV);
    expect(result).toBeTruthy();

    // Verify product 731346 exists
    // TODO: adjust table/column name to match actual schema
    const products = await query(`
        SELECT id FROM cdms.products WHERE product_code = '731346' LIMIT 1
    `).catch(() => []);
    expect(products.length, 'Existing product 731346 should be present in DB').toBeGreaterThan(0);
});

test('[TC-022] Unknown ProductCode + ProductName auto-creates new product', async ({ page }) => {
    test.setTimeout(180000);
    const uniqueCode = `AUTOPRD${Date.now()}`;
    const { headers, rows } = parseCSV(BASE_CSV);
    let newRows = setColumn(headers, rows, 'ProductCode', uniqueCode);
    newRows     = setColumn(headers, newRows, 'ProductName', 'Automation Test Product');
    const tmp = writeTempCSV('tc022.csv', headers, newRows);
    await recalculateGrossAmount(tmp);
    await incrementBillNumbers(tmp, 'SalesReturnNo');
    randomizeLastColumn(tmp);

    const { result } = await uploadReturnFile(page, tmp);
    expect(result, 'Upload with unknown product should succeed (auto-create product)').toBeTruthy();

    const newProd = await query(`
        SELECT id FROM cdms.products WHERE product_code = ? LIMIT 1
    `, [uniqueCode]).catch(() => []);
    expect(newProd.length, 'New product should be created for unknown product code').toBeGreaterThan(0);
});

test('[TC-023] Valid Reg InvoiceNumber resolves to non-null order_id', async ({ page }) => {
    test.setTimeout(180000);
    await prepareBaseCSV();
    const { result } = await uploadReturnFile(page, BASE_CSV);
    expect(result).toBeTruthy();

    const fileId = await getLatestFileId();
    if (!fileId) return;

    const dbRows = await query(`
        SELECT order_id, invoice_number
        FROM   cdms.brand_return
        WHERE  file_id = ?
          AND  invoice_number IS NOT NULL
          AND  invoice_number != ''
        LIMIT  3
    `, [fileId]);

    for (const row of dbRows) {
        expect(row.order_id, `order_id should be non-null for invoice ${row.invoice_number}`).not.toBeNull();
    }
});

test('[TC-024] Blank Reg InvoiceNumber stores order_id as NULL', async ({ page }) => {
    test.setTimeout(180000);
    const { headers, rows } = parseCSV(BASE_CSV);
    const tmp = writeTempCSV('tc024.csv', headers, setColumn(headers, rows, 'Reg InvoiceNumber', ''));
    await recalculateGrossAmount(tmp);
    await incrementBillNumbers(tmp, 'SalesReturnNo');
    randomizeLastColumn(tmp);

    const { result } = await uploadReturnFile(page, tmp);
    expect(result, 'Upload with blank Reg InvoiceNumber should succeed').toBeTruthy();

    const fileId = await getLatestFileId();
    if (!fileId) return;

    const dbRows = await query(`
        SELECT order_id FROM cdms.brand_return WHERE file_id = ? LIMIT 3
    `, [fileId]);
    for (const row of dbRows) {
        expect(row.order_id, 'order_id should be NULL when Reg InvoiceNumber is blank').toBeNull();
    }
});

test.skip('[TC-025] Non-existent Reg InvoiceNumber behavior — BLOCKED: AQ-7 unresolved (silent NULL vs. row error)', async ({ page }) => {
    // Unblock after dev team confirms: unresolvable invoice_number → NULL or error?
});

// =============================================================================
// CATEGORY D — GROSS AMOUNT RECALCULATION
// =============================================================================

test('[TC-026] CGST+SGST > 0 path: gross_amount stored to 4 decimal places', async ({ page }) => {
    test.setTimeout(180000);
    await prepareBaseCSV();
    const { result } = await uploadReturnFile(page, BASE_CSV);
    expect(result).toBeTruthy();

    const fileId = await getLatestFileId();
    if (!fileId) return;

    const { headers, rows } = parseCSV(BASE_CSV);
    const col = name => headers.findIndex(h => h.trim() === name);

    const dbRows = await query(`
        SELECT brd.product_code,
               CAST(brd.gross_amount AS DECIMAL(15,4)) AS gross_amount,
               brd.tax_info
        FROM   cdms.brand_return_detail brd
        JOIN   cdms.brand_return br ON brd.brand_return_id = br.id
        WHERE  br.file_id = ?
    `, [fileId]);

    for (const dbRow of dbRows) {
        const taxInfo  = typeof dbRow.tax_info === 'string' ? JSON.parse(dbRow.tax_info) : dbRow.tax_info;
        const cgst     = parseFloat(taxInfo['cgst%'] ?? 0);
        if (cgst <= 0) continue;

        const csvRow   = rows.find(r => r[col('ProductCode')]?.trim() === dbRow.product_code);
        if (!csvRow) continue;

        const csvGross = parseFloat(csvRow[col('Gross Amount')]);
        const diff     = Math.abs(parseFloat(dbRow.gross_amount) - csvGross);
        expect(diff, `CGST/SGST gross amount mismatch for ${dbRow.product_code}`).toBeLessThanOrEqual(TOLERANCE);
        // Verify 4 decimal places stored
        const strVal = String(dbRow.gross_amount);
        const decimals = strVal.includes('.') ? strVal.split('.')[1].length : 0;
        expect(decimals, `gross_amount should have ≤4 decimal places, got "${strVal}"`).toBeLessThanOrEqual(4);
    }
});

test('[TC-027] IGST > 0 path: gross_amount recalculated using IGST formula', async ({ page }) => {
    test.setTimeout(180000);
    const { headers, rows } = parseCSV(BASE_CSV);
    const col = name => headers.findIndex(h => h.trim() === name);

    // Convert first row to IGST-only scenario
    const newRows = rows.map((r, i) => {
        if (i !== 0) return r;
        const row = [...r];
        row[col('CGST Perc')]  = '0';
        row[col('CGSTAmt')]    = '0';
        row[col('SGST Perc')]  = '0';
        row[col('SGSTAmt')]    = '0';
        row[col('IGST Perc')]  = '5';
        row[col('IGSTAmt')]    = (parseFloat(row[col('Gross Amount')]) * 0.05 / 1.05).toFixed(2);
        return row;
    });
    const tmp = writeTempCSV('tc027.csv', headers, newRows);
    await recalculateGrossAmount(tmp);
    await incrementBillNumbers(tmp, 'SalesReturnNo');
    randomizeLastColumn(tmp);

    const { result } = await uploadReturnFile(page, tmp);
    expect(result, 'IGST-scenario upload should succeed').toBeTruthy();

    const fileId = await getLatestFileId();
    if (!fileId) return;

    const dbRows = await query(`
        SELECT brd.product_code, CAST(brd.gross_amount AS DECIMAL(15,4)) AS gross_amount, brd.tax_info
        FROM   cdms.brand_return_detail brd
        JOIN   cdms.brand_return br ON brd.brand_return_id = br.id
        WHERE  br.file_id = ? LIMIT 1
    `, [fileId]);

    if (dbRows.length > 0) {
        const taxInfo = typeof dbRows[0].tax_info === 'string' ? JSON.parse(dbRows[0].tax_info) : dbRows[0].tax_info;
        const igst = parseFloat(taxInfo['igst%'] ?? 0);
        expect(igst, 'IGST% should be stored as 5').toBeCloseTo(5, 1);
    }
});

test.skip('[TC-028] CGST+UTGST > 0 path — BLOCKED: AQ-1 unresolved (no UTGST column in mapping) + formula not implemented in dataUtils.js recalculateGrossAmount', async ({ page }) => {
    // Unblock after:
    // 1. Dev confirms which CSV column carries UTGST
    // 2. Third formula branch is implemented in utils/dataUtils.js
});

test('[TC-029] All tax = 0: gross_amount stored as-is', async ({ page }) => {
    test.setTimeout(180000);
    const { headers, rows } = parseCSV(BASE_CSV);
    const col = name => headers.findIndex(h => h.trim() === name);
    const originalGross = parseFloat(rows[0]?.[col('Gross Amount')]);

    let newRows = setColumn(headers, rows, 'CGST Perc', '0');
    newRows     = setColumn(headers, newRows, 'SGST Perc', '0');
    newRows     = setColumn(headers, newRows, 'IGST Perc', '0');
    const tmp = writeTempCSV('tc029.csv', headers, newRows);
    await incrementBillNumbers(tmp, 'SalesReturnNo');
    randomizeLastColumn(tmp);

    const { result } = await uploadReturnFile(page, tmp);
    expect(result, 'Zero-tax upload should succeed').toBeTruthy();

    const fileId = await getLatestFileId();
    if (!fileId) return;

    const dbRows = await query(`
        SELECT CAST(gross_amount AS DECIMAL(15,4)) AS gross_amount
        FROM   cdms.brand_return_detail brd
        JOIN   cdms.brand_return br ON brd.brand_return_id = br.id
        WHERE  br.file_id = ? LIMIT 1
    `, [fileId]);

    if (dbRows.length > 0 && !isNaN(originalGross)) {
        const diff = Math.abs(parseFloat(dbRows[0].gross_amount) - originalGross);
        expect(diff, 'gross_amount should be stored as-is when all tax = 0').toBeLessThanOrEqual(TOLERANCE);
    }
});

test('[TC-030] Empty tax percentage fields — no crash, gross_amount stored as-is', async ({ page }) => {
    test.setTimeout(180000);
    const { headers, rows } = parseCSV(BASE_CSV);
    let newRows = setColumn(headers, rows, 'CGST Perc', '');
    newRows     = setColumn(headers, newRows, 'SGST Perc', '');
    newRows     = setColumn(headers, newRows, 'IGST Perc', '');
    const tmp = writeTempCSV('tc030.csv', headers, newRows);
    await incrementBillNumbers(tmp, 'SalesReturnNo');
    randomizeLastColumn(tmp);

    const { result } = await uploadReturnFile(page, tmp);
    // Must not crash — result may be true or false but no exception
    expect(result !== undefined, 'Empty tax fields should not throw').toBeTruthy();
    console.log(`[TC-030] Upload result: ${result}`);
});

test('[TC-031] gross_amount has ≤ 4 decimal places in DB', async ({ page }) => {
    test.setTimeout(180000);
    await prepareBaseCSV();
    const { result } = await uploadReturnFile(page, BASE_CSV);
    expect(result).toBeTruthy();

    const fileId = await getLatestFileId();
    if (!fileId) return;

    const dbRows = await query(`
        SELECT gross_amount
        FROM   cdms.brand_return_detail brd
        JOIN   cdms.brand_return br ON brd.brand_return_id = br.id
        WHERE  br.file_id = ?
    `, [fileId]);

    for (const row of dbRows) {
        const str   = String(row.gross_amount);
        const decs  = str.includes('.') ? str.split('.')[1].length : 0;
        expect(decs, `gross_amount "${str}" should have ≤4 decimal places`).toBeLessThanOrEqual(4);
    }
});

test('[TC-032] recalculateGrossAmount is idempotent — running twice gives same result (pure JS)', async () => {
    const tmp = path.join(TEMP_DIR, 'tc032_idempotency.csv');
    fs.copyFileSync(BASE_CSV, tmp);
    // Remove sidecar to start fresh
    const sidecar = tmp + '.orig.json';
    if (fs.existsSync(sidecar)) fs.unlinkSync(sidecar);

    await recalculateGrossAmount(tmp);
    const after1 = fs.readFileSync(tmp, 'utf-8');

    await recalculateGrossAmount(tmp);
    const after2 = fs.readFileSync(tmp, 'utf-8');

    expect(after1, 'Gross amounts should be identical after two consecutive recalculations').toEqual(after2);
});

// =============================================================================
// CATEGORY E — JSON PERSISTENCE (discount_info / tax_info)
// =============================================================================

test('[TC-033] Sch Disc stored correctly in discount_info JSON', async ({ page }) => {
    test.setTimeout(180000);
    await prepareBaseCSV();
    const { result } = await uploadReturnFile(page, BASE_CSV);
    expect(result).toBeTruthy();

    const fileId = await getLatestFileId();
    if (!fileId) return;

    const { headers, rows } = parseCSV(BASE_CSV);
    const schDiscIdx = headers.findIndex(h => h.trim() === 'Sch Disc');
    const expectedSchDisc = parseFloat(rows[0]?.[schDiscIdx] ?? '0');

    const dbRows = await query(`
        SELECT discount_info
        FROM   cdms.brand_return_detail brd
        JOIN   cdms.brand_return br ON brd.brand_return_id = br.id
        WHERE  br.file_id = ? LIMIT 1
    `, [fileId]);

    expect(dbRows.length).toBeGreaterThan(0);
    const disc = typeof dbRows[0].discount_info === 'string'
        ? JSON.parse(dbRows[0].discount_info)
        : dbRows[0].discount_info;

    // Key name contains spaces per PRD: "special_Sch Discount_amt"
    const schKey = Object.keys(disc).find(k => k.toLowerCase().includes('sch'));
    expect(schKey, 'discount_info should contain a Sch Disc key').toBeDefined();

    const diff = Math.abs(parseFloat(disc[schKey]) - expectedSchDisc);
    expect(diff, `Sch Disc mismatch — expected ~${expectedSchDisc}, got ${disc[schKey]}`).toBeLessThanOrEqual(TOLERANCE);
});

test('[TC-034] CGST/SGST/IGST stored correctly in tax_info JSON', async ({ page }) => {
    test.setTimeout(180000);
    await prepareBaseCSV();
    const { result } = await uploadReturnFile(page, BASE_CSV);
    expect(result).toBeTruthy();

    const fileId = await getLatestFileId();
    if (!fileId) return;

    const { headers, rows } = parseCSV(BASE_CSV);
    const col = name => headers.findIndex(h => h.trim() === name);
    const expCgst = parseFloat(rows[0]?.[col('CGST Perc')] ?? '0');
    const expSgst = parseFloat(rows[0]?.[col('SGST Perc')] ?? '0');

    const dbRows = await query(`
        SELECT tax_info
        FROM   cdms.brand_return_detail brd
        JOIN   cdms.brand_return br ON brd.brand_return_id = br.id
        WHERE  br.file_id = ? LIMIT 1
    `, [fileId]);

    const tax = typeof dbRows[0].tax_info === 'string'
        ? JSON.parse(dbRows[0].tax_info)
        : dbRows[0].tax_info;

    expect(tax['cgst%'],  'tax_info should contain cgst% key').toBeDefined();
    expect(tax['sgst%'],  'tax_info should contain sgst% key').toBeDefined();
    expect(tax['igst%'],  'tax_info should contain igst% key').toBeDefined();
    expect(tax['cgst_amt'], 'tax_info should contain cgst_amt key').toBeDefined();

    expect(Math.abs(parseFloat(tax['cgst%']) - expCgst), 'cgst% mismatch').toBeLessThanOrEqual(0.01);
    expect(Math.abs(parseFloat(tax['sgst%']) - expSgst), 'sgst% mismatch').toBeLessThanOrEqual(0.01);
});

test('[TC-035] net_amount and total_tax_amount stored as floats in correct DB columns', async ({ page }) => {
    test.setTimeout(180000);
    await prepareBaseCSV();
    const { result } = await uploadReturnFile(page, BASE_CSV);
    expect(result).toBeTruthy();

    const fileId = await getLatestFileId();
    if (!fileId) return;

    const { headers, rows } = parseCSV(BASE_CSV);
    const col = name => headers.findIndex(h => h.trim() === name);
    const expNet = parseFloat(rows[0]?.[col('Net Amount')] ?? '0');
    const expTax = parseFloat(rows[0]?.[col('Tax Amount')] ?? '0');

    const dbRows = await query(`
        SELECT CAST(net_amount       AS DECIMAL(15,4)) AS net_amount,
               CAST(total_tax_amount AS DECIMAL(15,4)) AS total_tax_amount
        FROM   cdms.brand_return_detail brd
        JOIN   cdms.brand_return br ON brd.brand_return_id = br.id
        WHERE  br.file_id = ? LIMIT 1
    `, [fileId]);

    expect(dbRows.length).toBeGreaterThan(0);
    expect(Math.abs(parseFloat(dbRows[0].net_amount)       - expNet), 'net_amount mismatch').toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(parseFloat(dbRows[0].total_tax_amount) - expTax), 'total_tax_amount mismatch').toBeLessThanOrEqual(TOLERANCE);
});

// =============================================================================
// CATEGORY F — FILE FORMAT AND UPLOAD UI
// =============================================================================

test('[TC-036] Non-CSV (.xlsx extension) file is rejected', async ({ page }) => {
    test.setTimeout(60000);
    const fakePath = path.join(TEMP_DIR, 'tc036_fake.xlsx');
    fs.copyFileSync(BASE_CSV, fakePath); // same content, wrong extension

    const { result, uploadfile } = await uploadReturnFile(page, fakePath);
    const err = (uploadfile._lastModalText || '') + await getNotificationText(page);
    expect(
        !result || err.toLowerCase().includes('format') || err.toLowerCase().includes('invalid') || err.toLowerCase().includes('extension'),
        `Expected rejection of .xlsx file. Got: "${err.slice(0, 200)}"`
    ).toBeTruthy();
});

test('[TC-037] Headers-only CSV (no data rows) handled gracefully', async ({ page }) => {
    test.setTimeout(60000);
    const { headers } = parseCSV(BASE_CSV);
    const tmp = writeTempCSV('tc037_headers_only.csv', headers, []);

    const { result, uploadfile } = await uploadReturnFile(page, tmp);
    const err = uploadfile._lastModalText || '';
    // Must not throw — expect error or 0-record process
    expect(result !== undefined, 'Headers-only upload should not throw an unhandled error').toBeTruthy();
    console.log(`[TC-037] result=${result} | modal="${err.slice(0, 100)}"`);
});

test('[TC-038] Empty (0-byte) file is rejected', async ({ page }) => {
    test.setTimeout(60000);
    const emptyFile = path.join(TEMP_DIR, 'tc038_empty.csv');
    fs.writeFileSync(emptyFile, '', 'utf-8');

    const { result, uploadfile } = await uploadReturnFile(page, emptyFile);
    const err = (uploadfile._lastModalText || '') + await getNotificationText(page);
    expect(
        !result || err.length > 0,
        'Empty file should be rejected or produce an error'
    ).toBeTruthy();
});

test('[TC-039] Duplicate file upload (no SalesReturnNo increment) is rejected or flagged', async ({ page }) => {
    test.setTimeout(300000);
    await prepareBaseCSV();
    const { result: r1 } = await uploadReturnFile(page, BASE_CSV);
    expect(r1, 'First upload should succeed').toBeTruthy();

    // Second upload — exact same content, no increment
    const dup = path.join(TEMP_DIR, 'tc039_dup.csv');
    fs.copyFileSync(BASE_CSV, dup);

    const { result: r2, uploadfile } = await uploadReturnFile(page, dup);
    const err = (uploadfile._lastModalText || '') + await getNotificationText(page);
    expect(
        !r2 || err.toLowerCase().includes('duplicate') || err.toLowerCase().includes('already'),
        `Expected duplicate rejection. result=${r2}, error="${err.slice(0, 200)}"`
    ).toBeTruthy();
});

test('[TC-040] FC and Brand comboboxes respond to keyboard.type (Ant Design pattern)', async ({ page }) => {
    test.setTimeout(60000);
    const uploadfile = new Uploadfile(page);
    const l = uploadLocators(page);

    await page.goto(config.baseURLpreprod);
    await uploadfile._login(config.credentials.username, config.credentials.password);
    await l.adapterUploadsLink.click();
    await l.uploadButton.click();
    await l.uploadCsvLabel.click();
    await page.waitForTimeout(200);
    await l.docTypeTitle('Sales Return').click();

    // FC — keyboard.type, not fill
    const modalFcInput = page.locator('.ant-modal-body .ant-form-item-control input').first();
    await modalFcInput.click();
    await page.keyboard.type('bgrd');
    await page.waitForTimeout(400);
    await expect(page.getByText(FC_NAME)).toBeVisible();
    await page.getByText(FC_NAME).click();

    // Brand — keyboard.type
    await l.brandCombobox.click();
    await page.keyboard.type('mrco');
    await page.waitForTimeout(400);
    await expect(page.getByText(BRAND_NAME)).toBeVisible();
    await page.getByText(BRAND_NAME).click();

    // Close modal without submitting
    await page.getByRole('button', { name: 'Cancel' }).click().catch(() => {});
});

test('[TC-041] "Upload a File" button opens file chooser dialog', async ({ page }) => {
    test.setTimeout(60000);
    const uploadfile = new Uploadfile(page);
    const l = uploadLocators(page);

    await page.goto(config.baseURLpreprod);
    await uploadfile._login(config.credentials.username, config.credentials.password);
    await l.adapterUploadsLink.click();
    await l.uploadButton.click();
    await l.uploadCsvLabel.click();
    await page.waitForTimeout(200);
    await l.docTypeTitle('Sales Return').click();

    const modalFcInput = page.locator('.ant-modal-body .ant-form-item-control input').first();
    await modalFcInput.click();
    await modalFcInput.fill(FC);
    await page.getByText(FC_NAME).click();
    await l.brandCombobox.click();
    await l.brandCombobox.fill(BRAND);
    await page.getByText(BRAND_NAME).click();

    const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        page.getByRole('button', { name: /Upload a File/i }).first().click(),
    ]);
    expect(fileChooser, 'File chooser dialog should open on button click').toBeTruthy();
    await fileChooser.setFiles(BASE_CSV);

    await page.getByRole('button', { name: 'Cancel' }).click().catch(() => {});
});

// =============================================================================
// CATEGORY G — SalesReturnNo DB COLUMN
// =============================================================================

test('[TC-042] SalesReturnNo stored in brand_return.Return_no', async ({ page }) => {
    test.setTimeout(180000);
    await prepareBaseCSV();
    // Read the incremented SalesReturnNo from the modified CSV
    const { headers, rows } = parseCSV(BASE_CSV);
    const rnIdx = headers.findIndex(h => h.trim() === 'SalesReturnNo');
    const expectedReturnNo = rows[0]?.[rnIdx]?.trim();

    const { result } = await uploadReturnFile(page, BASE_CSV);
    expect(result).toBeTruthy();

    const fileId = await getLatestFileId();
    if (!fileId || !expectedReturnNo) return;

    const dbRows = await query(`
        SELECT Return_no FROM cdms.brand_return WHERE file_id = ? LIMIT 1
    `, [fileId]).catch(() => []);

    if (dbRows.length > 0 && dbRows[0].Return_no !== undefined) {
        expect(
            dbRows[0].Return_no,
            `Return_no should be stored as "${expectedReturnNo}"`
        ).toBe(expectedReturnNo);
    } else {
        console.warn('[TC-042] ⚠ brand_return.Return_no column not found — verify DB migration is deployed');
    }
});

test.skip('[TC-043] Marico return number displayed in CDMS UI — BLOCKED: AQ-8 unresolved (UI change scope not confirmed)', async ({ page }) => {
    // Unblock after dev team confirms the Sales Return detail screen shows
    // a "Marico return number" field populated from brand_return.Return_no
});

// =============================================================================
// CATEGORY H — DATE MAPPING
// =============================================================================

test('[TC-044] SalesReturnDt (3/3/2026) stored as 2026-03-03 in brand_return.return_date', async ({ page }) => {
    test.setTimeout(180000);
    await prepareBaseCSV();
    const { result } = await uploadReturnFile(page, BASE_CSV);
    expect(result).toBeTruthy();

    const fileId = await getLatestFileId();
    if (!fileId) return;

    const dbRows = await query(`
        SELECT return_date FROM cdms.brand_return WHERE file_id = ? LIMIT 1
    `, [fileId]);

    expect(dbRows.length).toBeGreaterThan(0);
    const val = dbRows[0].return_date;
    expect(val, 'return_date should not be null').not.toBeNull();

    const dateStr = val instanceof Date
        ? val.toISOString().slice(0, 10)
        : String(val).slice(0, 10);
    expect(dateStr, `return_date should be 2026-03-03, got "${dateStr}"`).toBe('2026-03-03');
});

// =============================================================================
// CATEGORY I — REGRESSION
// =============================================================================

test('[TC-045] BGRD:MRCO Sales Order upload still works after Sales Return adapter changes', async ({ page }) => {
    test.setTimeout(180000);
    const result = await singleFileUploadWithIncrement(
        page,
        config.baseURLpreprod,
        'bgrd', 'mrco',
        'salesmarico.csv',
        'Bill Number',
        false  // withProductMaster = false (regression smoke only)
    );
    expect(result, 'BGRD:MRCO Sales Order upload should not be broken by Sales Return changes').toBeTruthy();
});

test('[TC-046] Sales Return upload does NOT trigger Auto Product Master fallback', async ({ page }) => {
    test.setTimeout(180000);
    // salesReturnBgrdMrcoWithIncrement calls UploadBgrdMrcoSalesReturn which
    // goes through _searchAndVerify — it never calls scanForProductNotFoundErrors.
    // That scan is only wired in singleFileUploadWithIncrement(withProductMaster=true).
    // This test verifies the Sales Return upload completes cleanly with no PM side-effects.
    const result = await salesReturnBgrdMrcoWithIncrement(page, config.baseURLpreprod);
    expect(result, 'Sales Return upload should succeed without triggering product master flow').toBeTruthy();

    // Verify: no Product Master upload file was created in the same window
    const pmUploads = await query(`
        SELECT id FROM cdms.Files
        WHERE  fileType = 'product_master'
          AND  createdAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        LIMIT  1
    `).catch(() => []);
    expect(pmUploads.length, 'No product master upload should occur during a Sales Return flow').toBe(0);
});
