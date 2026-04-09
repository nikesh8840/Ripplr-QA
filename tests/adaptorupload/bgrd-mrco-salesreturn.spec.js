const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const config = require('../../config/base.config');
const { salesReturnBgrdMrcoWithIncrement } = require('../../utils/uploadTestHelper');
const { openTunnel, closeTunnel, query } = require('../../utils/dbUtils');

/**
 * BGRD:MARICO — Sales Return Upload
 *
 * Uploads the Marico Brand Sales Return CSV from
 * test-data/bgrd-mrco-reutrn/ to Adapter Uploads on preprod.
 *
 * Before each run the SalesReturnNo column is incremented so the
 * upload is always treated as a new batch by CDMS.
 *
 * Run:
 *   npx playwright test tests/adaptorupload/bgrd-mrco-salesreturn.spec.js --headed
 */

const screenshotDir = path.resolve(__dirname, '../../screenshots/bgrd-mrco-salesreturn');
const RETURN_CSV    = path.resolve(__dirname, '../../test-data/bgrd-mrco-reutrn/MARCO_BrandReturn.csv');

// Tolerance for floating-point comparison (±0.02)
const TOLERANCE = 0.02;

test.beforeAll(async () => {
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    await openTunnel();
});

test.afterAll(async () => {
    await closeTunnel();
});

test('Upload BGRD:MARICO Sales Return file', async ({ page }) => {
    test.setTimeout(180000);

    const ts = () => new Date().toISOString().replace(/[:.]/g, '-');

    const result = await salesReturnBgrdMrcoWithIncrement(page, config.baseURLpreprod);

    // Screenshot after upload completes (pass or fail state visible)
    await page.screenshot({ path: `${screenshotDir}/${ts()}_upload-result.png`, fullPage: true });

    expect(result).toBeTruthy();
});

test('Verify Gross Amount in DB after upload', async () => {
    test.setTimeout(180000);

    // ── Step 1: Read expected gross amounts from CSV (already recalculated before upload) ──
    const csvContent = fs.readFileSync(RETURN_CSV, 'utf-8');
    const csvLines   = csvContent.split('\n').filter(l => l.trim() !== '');
    const header     = csvLines[0].split(',');

    const col = (name) => header.findIndex(h => h.trim() === name);
    const grossIdx   = col('Gross Amount');
    const cgstPIdx   = col('CGST Perc');
    const sgstPIdx   = col('SGST Perc');
    const igstPIdx   = col('IGST Perc');
    const prodIdx    = col('ProductCode');

    const csvRows = csvLines.slice(1).map(line => {
        const c = line.split(',');
        return {
            productCode: c[prodIdx]?.trim(),
            grossAmount: parseFloat(c[grossIdx]),
            cgstPerc:    parseFloat(c[cgstPIdx]),
            sgstPerc:    parseFloat(c[sgstPIdx]),
            igstPerc:    parseFloat(c[igstPIdx]),
        };
    });

    console.log('\n=== CSV expected values ===');
    csvRows.forEach((r, i) =>
        console.log(`  Row ${i + 1} [${r.productCode}] gross=${r.grossAmount} CGST=${r.cgstPerc}% SGST=${r.sgstPerc}% IGST=${r.igstPerc}%`)
    );

    // ── Step 2: Poll DB until the latest upload is fully_processed ──
    let fileId = null;
    const maxWaitMs  = 120_000;
    const pollMs     = 5_000;
    const deadline   = Date.now() + maxWaitMs;

    console.log('\nPolling DB for fully_processed file...');
    while (Date.now() < deadline) {
        const [latestFile] = await query(`
            SELECT id, fileStatus, createdAt
            FROM cdms.Files
            WHERE fileType = 'sales_return'
              AND fileName LIKE '%BGRD%MRCO%'
            ORDER BY createdAt DESC
            LIMIT 1
        `);

        if (!latestFile) {
            await new Promise(r => setTimeout(r, pollMs));
            continue;
        }

        console.log(`  file_id=${latestFile.id} fileStatus=${latestFile.fileStatus}`);

        if (latestFile.fileStatus === 'fully_processed') {
            fileId = latestFile.id;
            break;
        }
        if (latestFile.fileStatus === 'processing_error' || latestFile.fileStatus === 'validation_error') {
            throw new Error(`Upload failed in DB: fileStatus='${latestFile.fileStatus}' for file_id=${latestFile.id}`);
        }

        await new Promise(r => setTimeout(r, pollMs));
    }

    expect(fileId, 'File never reached fully_processed within 2 minutes').not.toBeNull();
    console.log(`\nFile ${fileId} is fully_processed`);

    // ── Step 3: Fetch brand_return_detail rows for this upload ──
    const dbRows = await query(`
        SELECT
            br.credit_note_no,
            brd.product_code,
            CAST(brd.gross_amount AS DECIMAL(15,4))    AS gross_amount,
            CAST(brd.taxable_amount AS DECIMAL(15,4))  AS taxable_amount,
            brd.tax_info
        FROM cdms.brand_return br
        JOIN cdms.brand_return_detail brd ON brd.brand_return_id = br.id
        WHERE br.file_id = ?
        ORDER BY brd.id
    `, [fileId]);

    console.log(`\nDB rows found: ${dbRows.length}`);
    expect(dbRows.length, 'No brand_return_detail rows found for uploaded file').toBeGreaterThan(0);

    // ── Step 4: Verify gross amount for each row ──
    const withTax    = [];
    const withoutTax = [];

    for (const dbRow of dbRows) {
        const taxInfo   = typeof dbRow.tax_info === 'string' ? JSON.parse(dbRow.tax_info) : dbRow.tax_info;
        const cgstPerc  = parseFloat(taxInfo['cgst%'] ?? 0);
        const sgstPerc  = parseFloat(taxInfo['sgst%'] ?? 0);
        const igstPerc  = parseFloat(taxInfo['igst%'] ?? 0);
        const dbGross   = parseFloat(dbRow.gross_amount);

        // Match to CSV row by product_code
        const csvRow = csvRows.find(r => r.productCode === dbRow.product_code);

        const hasTax = cgstPerc > 0 || igstPerc > 0;
        const entry  = { credit_note_no: dbRow.credit_note_no, product_code: dbRow.product_code, dbGross, cgstPerc, sgstPerc, igstPerc, csvGross: csvRow?.grossAmount };

        if (hasTax) {
            withTax.push(entry);
        } else {
            withoutTax.push(entry);
        }

        console.log(`\n  [${dbRow.product_code}] CGST=${cgstPerc}% SGST=${sgstPerc}% IGST=${igstPerc}%`);
        console.log(`    DB gross_amount : ${dbGross}`);
        if (csvRow) {
            console.log(`    CSV Gross Amount: ${csvRow.grossAmount}`);
            const diff = Math.abs(dbGross - csvRow.grossAmount);
            console.log(`    Difference      : ${diff.toFixed(4)} (tolerance ±${TOLERANCE})`);
            expect(diff, `Gross amount mismatch for product ${dbRow.product_code}: DB=${dbGross} CSV=${csvRow.grossAmount}`)
                .toBeLessThanOrEqual(TOLERANCE);
        }
    }

    // ── Step 5: Summary assertions ──
    console.log(`\n=== Summary ===`);
    console.log(`  Rows WITH  CGST/SGST or IGST : ${withTax.length}`);
    console.log(`  Rows WITHOUT tax              : ${withoutTax.length}`);

    withTax.forEach(r => {
        const taxLabel = r.igstPerc > 0 ? `IGST ${r.igstPerc}%` : `CGST ${r.cgstPerc}% + SGST ${r.sgstPerc}%`;
        console.log(`    ✓ [${r.product_code}] ${taxLabel} → DB gross=${r.dbGross} (CSV expected=${r.csvGross})`);
    });

    withoutTax.forEach(r => {
        console.log(`    ✓ [${r.product_code}] no tax → DB gross=${r.dbGross} (CSV expected=${r.csvGross})`);
    });

    expect(withTax.length + withoutTax.length).toEqual(dbRows.length);
});

test.afterEach(async ({ page }, testInfo) => {
    if (!page) return; // DB-only test has no page
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `${screenshotDir}/${ts}_final-${testInfo.status}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${screenshotPath}`);
});
