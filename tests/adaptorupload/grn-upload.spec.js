const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const config = require('../../config/base.config');
const { grnUpload } = require('../../utils/uploadTestHelper');
const { FC_CODES } = require('../../utils/fcbrands');
const { LoginPage } = require('../../pages/login.page');

// Usage: npx playwright test tests/adaptorupload/grn-upload.spec.js --headed -g BGRD-SNPR
// The -g flag filters by FCcode-BrandCode (e.g. BGRD-SNPR, MDPT-NESL, BTML-BRIT)

const GRN_DIR    = path.resolve(__dirname, '../../test-data/GRN');
const brandFiles = fs.readdirSync(GRN_DIR).filter(f => f.endsWith('.csv'));

const MRP_TOLERANCE = 0.01;

// Per-brand CSV column mapping. `grn: null` means the brand's CSV has no GRN
// Number column, so the post-upload UI verification is skipped.
const BRAND_CONFIG = {
    hul:  { grn: null,         invoice: 'Invoice Number', code: 'Item Code',    mrp: 'MRP', qty: 'Receipt Units' },
    brit: { grn: null,         invoice: 'Invoice No',     code: 'Material',     mrp: 'MRP', qty: 'Good Qty' },
    gdj:  { grn: null,         invoice: 'Invoice_ID',     code: 'Sku Code',     mrp: 'MRP', qty: 'Grn Qty(Pcs)' },
    dbr:  { grn: 'GRN Number', invoice: 'Invoice Number', code: 'Product Code', mrp: 'MRP', qty: 'Received Good Qty' },
    gldp: { grn: 'GRN Number', invoice: 'Invoice Number', code: 'Product Code', mrp: 'MRP', qty: 'Quantity' },
    snpr: { grn: 'GRN Number', invoice: 'Invoice Number', code: 'Product Code', mrp: 'MRP', qty: 'Received Good Quantity' },
    mrco: { grn: 'GRNNumber',  invoice: 'InvoiceNumber',  code: 'Product Code', mrp: 'MRP', qty: 'Received Good Quantity' },
    nesl: { grn: 'GRNNumber',  invoice: 'Invoice Number', code: 'Product Code', mrp: 'MRP', qty: 'Received Good Quantity' },
};

function readGrnLineItems(csvPath, cfg) {
    const content = fs.readFileSync(csvPath, 'utf-8').replace(/^﻿/, '');
    const lines   = content.split('\n').filter(l => l.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    const idx     = (name) => headers.findIndex(h => h === name);

    const grnIdx = idx(cfg.grn);
    const invIdx = idx(cfg.invoice);
    const codIdx = idx(cfg.code);
    const mrpIdx = idx(cfg.mrp);
    const qtyIdx = idx(cfg.qty);

    return lines.slice(1).map(line => {
        const c = line.split(',');
        return {
            grnNumber:   c[grnIdx]?.trim(),
            invoiceNo:   c[invIdx]?.trim(),
            productCode: c[codIdx]?.trim(),
            mrp:         parseFloat(c[mrpIdx]),
            qty:         parseInt(c[qtyIdx], 10),
        };
    });
}

function groupByGrn(items) {
    const map = new Map();
    for (const it of items) {
        if (!it.grnNumber) continue;
        if (!map.has(it.grnNumber)) map.set(it.grnNumber, []);
        map.get(it.grnNumber).push(it);
    }
    return map;
}

for (const fc of FC_CODES) {
    for (const file of brandFiles) {
        const brand = path.basename(file, '.csv');

        // ── Test 1: Upload the GRN file via the Adapter Uploads flow ──────────
        test(`Upload GRN ${fc.toUpperCase()}-${brand.toUpperCase()}`, async ({ page }) => {
            test.setTimeout(300_000);
            const result = await grnUpload(page, config.baseURLpreprod, fc, brand);
            expect(result).toBeTruthy();
        });

        // ── Test 2: Verify each GRN Number appears on the GRN page and that
        //           its line items (Product Code, MRP, Qty) match the CSV ────
        test(`Verify GRN ${fc.toUpperCase()}-${brand.toUpperCase()} on UI`, async ({ page }) => {
            test.setTimeout(240_000);
            const cfg = BRAND_CONFIG[brand];

            test.skip(!cfg || !cfg.grn,
                `${brand}.csv has no GRN Number column — UI verification not applicable`);

            // 1. Read all line items grouped by GRN Number from the CSV
            const csvPath  = path.resolve(GRN_DIR, file);
            const allItems = readGrnLineItems(csvPath, cfg);
            const groups   = groupByGrn(allItems);

            expect(groups.size, `${file} should contain at least 1 GRN Number`).toBeGreaterThan(0);

            console.log(`\n=== ${file}: ${groups.size} GRN(s), ${allItems.length} line item(s) ===`);
            for (const [grnNo, items] of groups) {
                console.log(`  GRN ${grnNo}  (inv ${items[0].invoiceNo})  → ${items.length} line(s)`);
            }

            // 2. Login (reach any authenticated page first)
            const loginPage = new LoginPage(page);
            await page.goto(config.baseURLpreprod);
            await loginPage.login(config.credentials.username, config.credentials.password);

            // GRN listing reads its filters from the URL (?invoice_no=...). The
            // AntD Search form fights Playwright — typed values don't always
            // get committed before the button click. Direct URL navigation
            // is foolproof.
            const grnBaseUrl = config.baseURLpreprod.replace(/\/login\/?$/, '')
                + '/warehouse-management/asn/grn';

            // Give the GRN backend a moment to commit the just-uploaded record
            await page.waitForTimeout(5000);

            // 3. For every GRN Number in the CSV: navigate filtered by invoice_no → find row → drill in → verify
            for (const [grnNo, items] of groups) {
                const invoiceNo = items[0].invoiceNo;

                await page.goto(`${grnBaseUrl}?invoice_no=${encodeURIComponent(invoiceNo)}`);
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1500);

                // Find the row for this GRN Number (case-insensitive — UI uppercases display)
                const grnRow = page
                    .locator('table tbody tr')
                    .filter({ hasText: new RegExp(grnNo, 'i') })
                    .first();

                const rowFound = await grnRow.isVisible({ timeout: 10000 }).catch(() => false);
                if (!rowFound) {
                    const visibleRows = await page.locator('table tbody tr').allInnerTexts();
                    console.log(`\n[DEBUG] GRN "${grnNo}" not found. Visible rows (${visibleRows.length}):`);
                    visibleRows.slice(0, 8).forEach((t, i) =>
                        console.log(`  ${i + 1}. ${t.replace(/\s+/g, ' ').slice(0, 200)}`)
                    );
                }
                await expect(
                    grnRow,
                    `Row for GRN "${grnNo}" should be visible after upload`
                ).toBeVisible({ timeout: 5000 });

                // Drill into the GRN detail via the eye icon
                await grnRow.hover();
                await page.waitForTimeout(300);
                const detailLink = grnRow.locator('a[href*="/grn/"][href*="/show"]').first();
                await expect(detailLink, 'GRN detail eye icon should be visible').toBeVisible({ timeout: 5000 });
                await detailLink.click();
                await page.waitForURL('**/warehouse-management/asn/grn/**/show**');
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1500);

                // Expand the "GRN Details:" collapsible section so line items are visible
                const grnDetailsBtn = page.getByRole('button', { name: /GRN Details/i });
                if (await grnDetailsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await grnDetailsBtn.click();
                    await page.waitForTimeout(500);
                }

                // 4. For each CSV line item: find its detail row by Product Code
                //    and assert MRP + Qty match. The detail page renders rows as
                //    "Product Name (Product Code)" — Product Name shown is the
                //    canonical name from the products table, not the CSV's name,
                //    so we match by Product Code in parens.
                for (const item of items) {
                    const detailRow = page
                        .locator('tr')
                        .filter({ hasText: `(${item.productCode})` })
                        .first();

                    await expect(
                        detailRow,
                        `Detail row for Product Code "${item.productCode}" should be visible`
                    ).toBeVisible({ timeout: 15000 });

                    const rowText = (await detailRow.innerText()).replace(/\s+/g, ' ').trim();
                    const numbers = (rowText.replace(/[₹,]/g, '').match(/(\d+(?:\.\d+)?)/g) || [])
                        .map(n => parseFloat(n));

                    const mrpHit = numbers.some(n => Math.abs(n - item.mrp) <= MRP_TOLERANCE);
                    expect(
                        mrpHit,
                        `MRP ${item.mrp} should appear in row for code ${item.productCode}. Numbers: [${numbers.join(', ')}]`
                    ).toBeTruthy();

                    const qtyHit = numbers.some(n => Number.isInteger(n) && n === item.qty);
                    expect(
                        qtyHit,
                        `Qty ${item.qty} should appear in row for code ${item.productCode}. Numbers: [${numbers.join(', ')}]`
                    ).toBeTruthy();

                    console.log(`  ✓ GRN ${grnNo}  code=${item.productCode}  MRP=${item.mrp}  Qty=${item.qty}`);
                }
            }
        });
    }
}
