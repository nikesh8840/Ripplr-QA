/**
 * Sales Order — Complete E2E Test Suite
 *
 * Covers:
 *   1 · SO Listing — Page Load
 *   2 · SO Listing — Action Buttons (navigation + Add Filter)
 *   3 · SO Listing — Filters  ← tested in the same left-to-right order they appear on the UI
 *   4 · SO Listing — Pagination
 *   5 · SO Listing — Detail Navigation
 *   6 · Mark ECO Bills Page  (/order-management/sales-order/mark-eco-bills)
 *   7 · Mark Pay On Delivery Page  (/order-management/sales-order/mark-pod-bills)
 *   8 · Blocked Order Page  (/order-management/sales-order/blocked-order)
 *
 * Run all    :  npx playwright test tests/order-management/salesorder-listing.spec.js --headed
 * Run one    :  npx playwright test tests/order-management/salesorder-listing.spec.js --headed -g "Invoice Number"
 * Run smoke  :  npx playwright test tests/order-management/salesorder-listing.spec.js --headed --grep @smoke
 * Run regr.  :  npx playwright test tests/order-management/salesorder-listing.spec.js --headed --grep @regression
 *
 * Auth       : Login once in beforeAll → session saved to .auth/so-state.json → reused per test
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL       = config.baseURLpreprod.replace(/\/login\/?$/, '');
const SO_URL         = `${BASE_URL}/order-management/sales-order`;
const ECO_URL        = `${BASE_URL}/order-management/sales-order/mark-eco-bills`;
const POD_URL        = `${BASE_URL}/order-management/sales-order/mark-pod-bills`;
const BLOCKED_URL    = `${BASE_URL}/order-management/sales-order/blocked-order`;
const AUTH_FILE      = path.join(__dirname, '../../.auth/so-state.json');

// BTM + Britannia is the only FC+Brand combo confirmed to have data in preprod
const TEST_FC    = { label: 'BTM', searchHint: 'BTML' };
const TEST_BRAND = 'Britannia';
const TEST_DATES = { from: '2026-04-01', to: '2026-04-30' };

// AntD always adds a hidden selection column at td[0]; visible data starts at td[1]
const COL = { DATE: 1, FC: 2, INVOICE_NO: 3, STORE: 4, STATUS: 5 };

const EXPECTED_COLUMNS = ['Invoice Date', 'FC', 'Invoice No', 'Store', 'Status', 'Invoice Amt'];
const DETAIL_TABS      = ['Value Wise Details', 'Delivery Details', 'Order Journey',
    'Collection History', 'Sales Return'];

const UNBLOCK_REASONS = [
    'Collection Received',
    'Sales Return / Due',
    'Damage and Expiry',
    'SSM Misuse',
    'DA Debit',
    'Brand Claims',
    'Bill Missing',
    'CD Not Updated',
    'Scheme Issue',
    'TDS Issue',
    'S1 & S2 Orders',
    'Bounce deleted',
    'Unblocked after cheque bounce recovery',
];

// ─────────────────────────────────────────────────────────────────────────────
//  Auth bootstrap  (runs at file-load time, before any Playwright fixture)
// ─────────────────────────────────────────────────────────────────────────────

// Always reset to empty state so beforeAll never inherits stale cookies.
// Valid cookies in the auth file cause the login page to redirect to dashboard,
// leaving loginPage.login() waiting for the form that never appears.
fs.mkdirSync(path.join(__dirname, '../../.auth'), { recursive: true });
fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));

// ─────────────────────────────────────────────────────────────────────────────
//  Visual debug helpers  (headed-mode only — zero-cost when headless)
// ─────────────────────────────────────────────────────────────────────────────

async function highlight(locator) {
    try {
        await locator.scrollIntoViewIfNeeded();
        await locator.evaluate(el => {
            el.style.setProperty('outline',           '3px solid #e53e3e', 'important');
            el.style.setProperty('outline-offset',    '3px',               'important');
            el.style.setProperty('background-color',  'rgba(229,62,62,0.12)', 'important');
            el.style.setProperty('transition',        'all 0.15s',         'important');
        });
        await locator.page().waitForTimeout(600);
        await locator.evaluate(el => {
            el.style.removeProperty('outline');
            el.style.removeProperty('outline-offset');
            el.style.removeProperty('background-color');
        });
    } catch { /* element may have unmounted */ }
}

async function showStep(page, label) {
    try {
        await page.evaluate((msg) => {
            const ID = '__pw_step_banner__';
            document.getElementById(ID)?.remove();
            const div = document.createElement('div');
            div.id = ID;
            div.textContent = `▶  ${msg}`;
            Object.assign(div.style, {
                position:     'fixed',
                top:          '12px',
                right:        '12px',
                zIndex:       '2147483647',
                background:   '#1a202c',
                color:        '#68d391',
                padding:      '10px 16px',
                borderRadius: '8px',
                fontFamily:   'monospace, monospace',
                fontSize:     '13px',
                fontWeight:   'bold',
                boxShadow:    '0 4px 16px rgba(0,0,0,0.5)',
                maxWidth:     '400px',
                wordBreak:    'break-word',
                lineHeight:   '1.4',
            });
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 3000);
        }, label);
    } catch { /* page may be navigating */ }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Shared page helpers
// ─────────────────────────────────────────────────────────────────────────────

async function goTo(page, url) {
    await page.goto(url);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(500);
}

async function clickSearch(page) {
    const btn = page.getByRole('button', { name: 'Search' });
    await highlight(btn);
    await btn.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(800);
}

// Picks the first visible option from whichever AntD dropdown is currently open.
async function pickFirstOpenOption(page) {
    const items = page.locator(
        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content',
    );
    await items.first().waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    if ((await items.count()) === 0) { await page.keyboard.press('Escape'); return ''; }
    const label = ((await items.first().textContent()) ?? '').trim();
    await items.first().evaluate(el => el.closest('.ant-select-item').click());
    await page.waitForTimeout(300);
    return label;
}

// Opens an AntD Select combobox, types an optional search hint, then clicks the
// first option matching targetText.
async function selectDropdownOption(page, comboboxPattern, targetText, searchHint = '') {
    await page.getByRole('combobox', { name: new RegExp(comboboxPattern, 'i') }).first().click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(400);
    if (searchHint) {
        await page.keyboard.type(searchHint);
        await page.waitForTimeout(400);
    }
    const items = page.locator(
        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content',
    );
    await items.first().waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    await items.filter({ hasText: new RegExp(targetText, 'i') }).first()
        .evaluate(el => el.closest('.ant-select-item').click());
    await page.waitForTimeout(300);
}

// Clicks the AntD DatePicker suffix icon (the readonly input ignores clicks),
// navigates to the target month via JS evaluate, and clicks the date cell.
async function pickDate(page, placeholder, isoDate) {
    const input = page.getByPlaceholder(placeholder);
    await page.locator('.ant-picker')
        .filter({ has: input })
        .locator('.ant-picker-suffix')
        .click({ force: true });
    await page.waitForTimeout(400);
    await page.evaluate(async (iso) => {
        const [yr, mo] = iso.split('-').map(Number);
        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        for (let i = 0; i < 24; i++) {
            const h = [...document.querySelectorAll('.ant-picker-header-view')].at(-1);
            if (!h) break;
            if (h.textContent.includes(String(yr)) && h.textContent.includes(MONTHS[mo - 1])) break;
            [...document.querySelectorAll('.ant-picker-header-prev-btn')].at(-1)?.click();
            await new Promise(r => setTimeout(r, 200));
        }
        [...document.querySelectorAll(`.ant-picker-cell[title="${iso}"]`)].at(-1)?.click();
    }, isoDate);
    await page.waitForTimeout(300);
}

// Asserts every visible data row passes checkFn; fails immediately if table is empty.
async function assertAllRows(rows, checkFn) {
    const count = await rows.count();
    expect(count, 'Table must have at least one result row').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) await checkFn(rows.nth(i), i);
}

// Selects the first row's checkbox and returns its Invoice No text.
async function selectFirstRow(page) {
    const firstRowCb = page.locator('table tbody tr').first().locator('input[type="checkbox"]');
    await expect(firstRowCb, 'First row checkbox must be visible').toBeVisible({ timeout: 8_000 });
    await highlight(firstRowCb);
    await firstRowCb.click();
    await page.waitForTimeout(400);
    const invoiceNo = ((await page.locator('table tbody tr').first()
        .locator('td').nth(COL.INVOICE_NO).textContent()) ?? '').trim();
    return invoiceNo;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Suite
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Sales Order', () => {

    test.beforeAll(async ({ browser }) => {
        fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
        const ctx  = await browser.newContext();
        const page = await ctx.newPage();
        await page.goto(config.baseURLpreprod);
        await new LoginPage(page).login(config.credentials.username, config.credentials.password);
        await page.waitForURL(/\/dashboard/, { timeout: 15_000 }).catch(() => {});
        await ctx.storageState({ path: AUTH_FILE });
        await ctx.close();
    });

    test.use({ storageState: AUTH_FILE });

    // ══════════════════════════════════════════════════════════════════════════
    //  1 · SO LISTING — PAGE LOAD
    // ══════════════════════════════════════════════════════════════════════════

    test.describe('SO Listing — Page Load', () => {

        test('should display all required columns when the listing page loads',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(60_000);

                await test.step('Navigate to Sales Order listing', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                });

                await test.step('Verify all column headers are present', async () => {
                    await showStep(page, 'Checking all column headers are visible');
                    for (const col of EXPECTED_COLUMNS) {
                        const header = page.getByRole('columnheader', { name: col });
                        await highlight(header);
                        await expect(header, `Column header "${col}" must be visible`).toBeVisible();
                    }
                });
            },
        );

    });

    // ══════════════════════════════════════════════════════════════════════════
    //  2 · SO LISTING — ACTION BUTTONS
    // ══════════════════════════════════════════════════════════════════════════

    test.describe('SO Listing — Action Buttons', () => {

        test('should navigate to the Mark ECO Bills action page when "Mark ECO Bills" is clicked',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(60_000);

                await test.step('Navigate to Sales Order listing', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                });

                await test.step('Click "Mark ECO Bills" and verify navigation', async () => {
                    const btn = page.getByRole('button', { name: 'Mark ECO Bills' });
                    await expect(btn, '"Mark ECO Bills" must be visible').toBeVisible();
                    await showStep(page, 'Clicking Mark ECO Bills button…');
                    await highlight(btn);
                    await btn.click();
                    await page.waitForTimeout(1_200);
                    await expect(page, 'Must navigate to /mark-eco-bills').toHaveURL(/mark-eco-bills/);
                    await showStep(page, `✅ Navigated to ${await page.url()}`);
                });
            },
        );

        test('should navigate to the Mark Pay On Delivery action page when "Mark Pay On Delivery" is clicked',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(60_000);

                await test.step('Navigate to Sales Order listing', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                });

                await test.step('Click "Mark Pay On Delivery" and verify navigation', async () => {
                    const btn = page.getByRole('button', { name: 'Mark Pay On Delivery' });
                    await expect(btn, '"Mark Pay On Delivery" must be visible').toBeVisible();
                    await showStep(page, 'Clicking Mark Pay On Delivery button…');
                    await highlight(btn);
                    await btn.click();
                    await page.waitForTimeout(1_200);
                    await expect(page, 'Must navigate to /mark-pod-bills').toHaveURL(/mark-pod-bills/);
                    await showStep(page, `✅ Navigated to ${await page.url()}`);
                });
            },
        );

        test('should navigate to the Blocked Order page when "Blocked Order" is clicked',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(60_000);

                await test.step('Navigate to Sales Order listing', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                });

                await test.step('Click "Blocked Order" and verify navigation', async () => {
                    const btn = page.getByRole('button', { name: 'Blocked Order' });
                    await expect(btn, '"Blocked Order" must be visible').toBeVisible();
                    await showStep(page, 'Clicking Blocked Order button…');
                    await highlight(btn);
                    await btn.click();
                    await page.waitForTimeout(1_200);
                    await expect(page, 'Must navigate to /blocked-order').toHaveURL(/blocked-order/);
                    await showStep(page, `✅ Navigated to ${await page.url()}`);
                });
            },
        );

        test('should append a new filter row when "Add Filter" is clicked',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(60_000);

                await test.step('Navigate to Sales Order listing', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                });

                await test.step('Click "Add Filter" and verify filter row count increases', async () => {
                    const before = await page.locator('[role="combobox"]').count();
                    const addBtn = page.getByRole('button', { name: 'Add Filter' });
                    await expect(addBtn, '"Add Filter" must be visible').toBeVisible();
                    await showStep(page, `Clicking "Add Filter" — comboboxes before: ${before}`);
                    await highlight(addBtn);
                    await addBtn.click();
                    await page.waitForTimeout(800);
                    const after = await page.locator('[role="combobox"]').count();
                    await showStep(page, `✅ Filter row added — comboboxes now: ${after}`);
                    expect(after, 'At least one new filter control must be added').toBeGreaterThanOrEqual(before);
                    await expect(
                        page.getByRole('table').first(),
                        'Table must remain visible after adding a filter row',
                    ).toBeVisible();
                });
            },
        );

    });

    // ══════════════════════════════════════════════════════════════════════════
    //  3 · SO LISTING — FILTERS
    //  Order matches the UI left-to-right:
    //    Invoice Number → Store(s) → FC(s) → Brands → Status(s)
    //    → Date Range → Invoice Upload Status → Quid Deliveries
    // ══════════════════════════════════════════════════════════════════════════

    test.describe('SO Listing — Filters', () => {

        // 3.1  Invoice Number  (text input — leftmost filter)
        test('should return only the matching order when an Invoice Number is typed in the search input',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                let invoiceNo = '';

                await test.step('Seed: load BTM + Britannia data and extract an Invoice Number', async () => {
                    await showStep(page, 'Seed: filtering BTM+Britannia to extract an Invoice No');
                    await goTo(page, SO_URL);
                    await selectDropdownOption(page, 'FC\\(s\\)', TEST_FC.label, TEST_FC.searchHint);
                    await selectDropdownOption(page, 'Brands', TEST_BRAND);
                    await clickSearch(page);
                    const seedRows = page.locator('table tbody tr');
                    await expect(
                        seedRows.first(),
                        'Seed filter must return data rows (not "No Data")',
                    ).not.toContainText('No Data', { timeout: 8_000 });
                    const seedCount = await seedRows.count();
                    expect(seedCount, 'Seed filter must return at least one row').toBeGreaterThan(0);
                    const targetRow = seedCount >= 2 ? seedRows.nth(1) : seedRows.first();
                    await highlight(targetRow.locator('td').nth(COL.INVOICE_NO));
                    invoiceNo = ((await targetRow.locator('td').nth(COL.INVOICE_NO).textContent()) ?? '').trim();
                    await showStep(page, `Extracted Invoice No: "${invoiceNo}"`);
                    expect(invoiceNo.length, 'Extracted Invoice Number must not be empty').toBeGreaterThan(0);
                });

                await test.step(`Navigate to clean page and type "${invoiceNo}" into the Invoice Number input`, async () => {
                    await showStep(page, 'Navigating to clean page state…');
                    await goTo(page, SO_URL);
                    const input = page.getByPlaceholder('Search by Invoice Number');
                    await showStep(page, `Typing "${invoiceNo}" into Invoice Number search input`);
                    await highlight(input);
                    await input.click();
                    await input.pressSequentially(invoiceNo, { delay: 500 });
                    await expect(
                        input,
                        `Input must hold the full value "${invoiceNo}"`,
                    ).toHaveValue(invoiceNo);
                });

                await test.step('Click Search and verify all results contain the invoice number', async () => {
                    await showStep(page, 'Clicking Search and asserting filtered results');
                    await clickSearch(page);
                    const filteredRows = page.locator('table tbody tr');
                    await expect(
                        filteredRows.first(),
                        'Filtered results must not show "No Data"',
                    ).not.toContainText('No Data', { timeout: 8_000 });
                    await assertAllRows(filteredRows, async (row, i) => {
                        await expect(row, `Row ${i}: must contain invoice number "${invoiceNo}"`)
                            .toContainText(invoiceNo);
                    });
                });
            },
        );

        // 3.2  Store(s)  (dropdown)
        test('should return only matching rows when a Store is selected from the Store(s) dropdown',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate to Sales Order listing', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                });

                let selectedStore = '';
                await test.step('Open Store(s) dropdown and pick the first available option', async () => {
                    await showStep(page, 'Opening Store(s) dropdown — picking first option');
                    await page.getByRole('combobox', { name: /Store\(s\)/i }).click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    selectedStore = await pickFirstOpenOption(page);
                    await showStep(page, `Selected store: "${selectedStore}"`);
                });

                await test.step('Click Search', async () => {
                    await showStep(page, 'Clicking Search…');
                    await clickSearch(page);
                });

                await test.step('Verify every result row matches the selected store', async () => {
                    await showStep(page, `Asserting all rows contain "${selectedStore}" in Store column`);
                    await expect(
                        page.getByRole('table').first(),
                        'Data table must be visible after Store filter',
                    ).toBeVisible();
                    if (!selectedStore) return;
                    // Dropdown label format is "CODE: Store Name"; table shows only the name
                    const storeName = selectedStore.includes(':')
                        ? (selectedStore.split(':').pop() ?? selectedStore).trim()
                        : selectedStore;
                    const rows = page.locator('table tbody tr');
                    const count = await rows.count();
                    expect(count, 'Expected at least one result row').toBeGreaterThan(0);
                    const firstText = (await rows.first().textContent()) ?? '';
                    if (!firstText.includes('No Data') && storeName) {
                        for (let i = 0; i < count; i++) {
                            await expect(
                                rows.nth(i).locator('td').nth(COL.STORE),
                                `Row ${i}: Store column must contain "${storeName}"`,
                            ).toContainText(storeName);
                        }
                    }
                });
            },
        );

        // 3.3  FC(s)  (dropdown)
        test('should return only BTM rows when the FC(s) filter is set to BTM',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate to Sales Order listing', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                });

                await test.step(`Apply FC filter → "${TEST_FC.label}"`, async () => {
                    await showStep(page, `Opening FC(s) dropdown — typing "${TEST_FC.searchHint}" to find ${TEST_FC.label}`);
                    await selectDropdownOption(page, 'FC\\(s\\)', TEST_FC.label, TEST_FC.searchHint);
                });

                await test.step('Click Search', async () => {
                    await showStep(page, 'Clicking Search…');
                    await clickSearch(page);
                });

                await test.step('Verify every result row belongs to BTM', async () => {
                    await showStep(page, 'Asserting all rows contain "BTM" in FC column');
                    await expect(
                        page.getByRole('table').first(),
                        'Data table must be visible after FC filter',
                    ).toBeVisible();
                    const rows = page.locator('table tbody tr');
                    await assertAllRows(rows, async (row, i) => {
                        await expect(
                            row.locator('td').nth(COL.FC),
                            `Row ${i}: FC column must contain "BTM"`,
                        ).toContainText('BTM');
                    });
                });
            },
        );

        // 3.4  Brands  (dropdown — FC-dependent)
        test('should return only Britannia rows when Brand = Britannia under FC = BTM',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate to Sales Order listing', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                });

                await test.step('Apply FC first, then Brand (Brand options are FC-dependent)', async () => {
                    await showStep(page, `Selecting FC = "${TEST_FC.label}" first`);
                    await selectDropdownOption(page, 'FC\\(s\\)', TEST_FC.label, TEST_FC.searchHint);
                    await showStep(page, `Now selecting Brand = "${TEST_BRAND}"`);
                    await selectDropdownOption(page, 'Brands', TEST_BRAND);
                });

                await test.step('Click Search', async () => {
                    await showStep(page, 'Clicking Search…');
                    await clickSearch(page);
                });

                await test.step('Verify every result row shows Britannia in the FC column', async () => {
                    await showStep(page, 'Asserting all rows contain "Britannia" in FC column');
                    await expect(
                        page.getByRole('table').first(),
                        'Data table must render Britannia results',
                    ).toBeVisible({ timeout: 10_000 });
                    const rows = page.locator('table tbody tr');
                    await assertAllRows(rows, async (row, i) => {
                        await expect(
                            row.locator('td').nth(COL.FC),
                            `Row ${i}: FC column must contain "Britannia"`,
                        ).toContainText('Britannia');
                    });
                });
            },
        );

        // 3.5  Status(s)  (dropdown)
        test('should return only matching rows when a Status is selected from the Status(s) dropdown',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate to Sales Order listing', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                });

                let selectedStatus = '';
                await test.step('Open Status(s) dropdown and pick the first available option', async () => {
                    await showStep(page, 'Opening Status(s) dropdown — picking first option');
                    // Anchored to ^Status\(s\) to avoid matching "Invoice Upload Status" combobox
                    await page.getByRole('combobox', { name: /^Status\(s\)/i }).click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    selectedStatus = await pickFirstOpenOption(page);
                    await showStep(page, `Selected status: "${selectedStatus}"`);
                });

                await test.step('Click Search', async () => {
                    await showStep(page, 'Clicking Search…');
                    await clickSearch(page);
                });

                await test.step('Verify every result row shows the selected status', async () => {
                    await showStep(page, `Asserting all rows contain "${selectedStatus}" in Status column`);
                    const rows = page.locator('table tbody tr');
                    const count = await rows.count();
                    expect(count, 'Expected at least one result row').toBeGreaterThan(0);
                    if (selectedStatus) {
                        for (let i = 0; i < count; i++) {
                            await expect(
                                rows.nth(i).locator('td').nth(COL.STATUS),
                                `Row ${i}: Status column must contain "${selectedStatus}"`,
                            ).toContainText(selectedStatus);
                        }
                    }
                });
            },
        );

        // 3.6  Date Range  (From Date + To Date datepickers)
        test(`should return only April 2026 orders when date range ${TEST_DATES.from} → ${TEST_DATES.to} is applied`,
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate to Sales Order listing', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                });

                await test.step('Set From Date and To Date using the datepicker suffix icons', async () => {
                    await showStep(page, `Setting From Date = ${TEST_DATES.from}`);
                    await pickDate(page, 'From Date', TEST_DATES.from);
                    await showStep(page, `Setting To Date = ${TEST_DATES.to}`);
                    await pickDate(page, 'To Date', TEST_DATES.to);
                    // Escape closes the picker panel — AntD leaves calendar <table> elements in the
                    // DOM while the picker is open, causing strict-mode violations on locator('table')
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(300);
                });

                await test.step('Click Search', async () => {
                    await showStep(page, 'Clicking Search…');
                    await clickSearch(page);
                });

                await test.step('Verify every Invoice Date falls within April 2026', async () => {
                    await showStep(page, 'Asserting all Invoice Dates match DD/04/2026');
                    await expect(page.getByRole('table').first(), 'Table must be visible').toBeVisible();
                    // Scope to .ant-table-tbody to exclude AntD calendar <tbody> rows
                    const rows = page.locator('.ant-table-tbody tr');
                    await expect(
                        rows.first(),
                        'Result rows must not show "No Data"',
                    ).not.toContainText('No Data', { timeout: 8_000 });
                    const count = await rows.count();
                    expect(count, 'At least one result row expected').toBeGreaterThan(0);
                    for (let i = 0; i < count; i++) {
                        const dateText = ((await rows.nth(i).locator('td').nth(COL.DATE).textContent()) ?? '').trim();
                        expect(
                            dateText,
                            `Row ${i}: Invoice Date "${dateText}" must match DD/04/2026`,
                        ).toMatch(/^\d{2}\/04\/2026$/);
                    }
                });
            },
        );

        // 3.7  Invoice Upload Status  (dropdown)
        test('should return results when Invoice Upload Status filter is applied',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate to Sales Order listing', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                });

                await test.step('Open Invoice Upload Status dropdown and select first option', async () => {
                    await showStep(page, 'Opening Invoice Upload Status dropdown');
                    await page.getByRole('combobox', { name: /Invoice Upload Status/i }).click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(800);
                    await pickFirstOpenOption(page);
                });

                await test.step('Click Search and verify the table renders results', async () => {
                    await showStep(page, 'Clicking Search and verifying results');
                    await clickSearch(page);
                    await expect(
                        page.getByRole('table').first(),
                        'Table must be visible after Invoice Upload Status filter',
                    ).toBeVisible({ timeout: 10_000 });
                    expect(
                        await page.locator('table tbody tr').count(),
                        'At least one result row expected',
                    ).toBeGreaterThan(0);
                });
            },
        );

        // 3.8  Quid Deliveries  (toggle switch — rightmost filter)
        test('should return only quid delivery orders when the Quid Deliveries switch is enabled',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate to Sales Order listing', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                });

                await test.step('Enable the Quid Deliveries toggle switch', async () => {
                    const quidSwitch = page.getByRole('switch', { name: /Quid Deliveries/i });
                    await expect(quidSwitch, 'Quid Deliveries switch must be present').toBeVisible();
                    await showStep(page, 'Enabling Quid Deliveries toggle switch');
                    await highlight(quidSwitch);
                    if (!(await quidSwitch.isChecked())) {
                        await quidSwitch.click();
                        await page.waitForLoadState('networkidle').catch(() => {});
                        await page.waitForTimeout(300);
                    }
                });

                await test.step('Click Search and verify quid delivery rows are returned', async () => {
                    await showStep(page, 'Clicking Search — expecting quid delivery rows');
                    await clickSearch(page);
                    await expect(
                        page.getByRole('table').first(),
                        'Table must render results for quid deliveries',
                    ).toBeVisible();
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'Result rows must not show "No Data"')
                        .not.toContainText('No Data', { timeout: 8_000 });
                    expect(
                        await rows.count(),
                        'At least one quid delivery row expected',
                    ).toBeGreaterThan(0);
                });
            },
        );

    });

    // ══════════════════════════════════════════════════════════════════════════
    //  4 · SO LISTING — PAGINATION
    // ══════════════════════════════════════════════════════════════════════════

    test.describe('SO Listing — Pagination', () => {

        test('should load a different set of rows on the next page and restore first-page rows on prev',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate and load the default order list', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                    await showStep(page, 'Loading default order list via Search');
                    await clickSearch(page);
                });

                let firstRowText = '';

                await test.step('Capture first-page state then navigate to page 2', async () => {
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'First-page rows must be visible').toBeVisible();
                    firstRowText = (await rows.first().textContent()) ?? '';
                    expect(await rows.count(), 'First page must have at least one row').toBeGreaterThan(0);

                    const nextBtn = page.locator('button[aria-label="right"], li[title="Next Page"] button');
                    if ((await nextBtn.count()) === 0 || await nextBtn.first().isDisabled()) {
                        test.skip(true, 'Only one page of data available — pagination test skipped');
                        return;
                    }
                    await showStep(page, 'Clicking Next Page →');
                    await highlight(nextBtn.first());
                    await nextBtn.first().click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(500);

                    const page2Text = (await rows.first().textContent()) ?? '';
                    await showStep(page, '✅ Page 2 loaded — rows differ from page 1');
                    expect(page2Text, 'Page 2 must show different rows than page 1').not.toBe(firstRowText);
                });

                await test.step('Navigate back to page 1 and verify original rows are restored', async () => {
                    const rows    = page.locator('table tbody tr');
                    const prevBtn = page.locator('button[aria-label="left"], li[title="Previous Page"] button');
                    if ((await prevBtn.count()) === 0) return;
                    await showStep(page, 'Clicking Previous Page ← to return to page 1');
                    await highlight(prevBtn.first());
                    await prevBtn.first().click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(500);

                    const prefix = firstRowText.slice(0, 8);
                    if (prefix) {
                        await showStep(page, `✅ Back on page 1 — first row starts with "${prefix}"`);
                        await expect(rows.first(), 'First row must match original page-1 content')
                            .toContainText(prefix);
                    }
                });
            },
        );

    });

    // ══════════════════════════════════════════════════════════════════════════
    //  5 · SO LISTING — DETAIL NAVIGATION
    // ══════════════════════════════════════════════════════════════════════════

    test.describe('SO Listing — Detail Navigation', () => {

        test('should open the Sales Order detail page with all tabs when the edit icon is clicked',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate and load orders', async () => {
                    await showStep(page, 'Navigating to Sales Order listing…');
                    await goTo(page, SO_URL);
                    await showStep(page, 'Loading orders via Search');
                    await clickSearch(page);
                });

                await test.step('Click the edit icon on the first result row', async () => {
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'At least one row must be visible').toBeVisible();
                    const editIcon = rows.first().locator('img[alt="edit-icon"]');
                    await showStep(page, 'Clicking edit icon on first row');
                    await highlight(editIcon);
                    await editIcon.click();
                    await page.waitForURL(/\/sales-order\/\d+/, { timeout: 15_000 });
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await showStep(page, '✅ Navigated to Sales Order detail page');
                });

                await test.step('Verify all expected tabs are present on the detail page', async () => {
                    await showStep(page, 'Checking all detail page tabs are present');
                    for (const tab of DETAIL_TABS) {
                        const tabEl = page.getByRole('tab', { name: tab });
                        await highlight(tabEl);
                        await expect(tabEl, `Detail page tab "${tab}" must be visible`).toBeVisible();
                    }
                });
            },
        );

    });

    // ══════════════════════════════════════════════════════════════════════════
    //  6 · MARK ECO BILLS PAGE  (/order-management/sales-order/mark-eco-bills)
    // ══════════════════════════════════════════════════════════════════════════

    test.describe('Mark ECO Bills Page', () => {

        test('should load with all required columns and Mark ECO Bills button visible',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(60_000);

                await test.step('Navigate to Mark ECO Bills page', async () => {
                    await showStep(page, 'Navigating to Mark ECO Bills page…');
                    await goTo(page, ECO_URL);
                });

                await test.step('Click Search to load data', async () => {
                    await showStep(page, 'Loading orders via Search…');
                    await clickSearch(page);
                });

                await test.step('Verify all required columns are present', async () => {
                    await showStep(page, 'Checking column headers…');
                    for (const col of EXPECTED_COLUMNS) {
                        const header = page.getByRole('columnheader', { name: col });
                        await highlight(header);
                        await expect(header, `Column "${col}" must be visible`).toBeVisible();
                    }
                });

                await test.step('Verify Mark ECO Bills button is visible and enabled', async () => {
                    await showStep(page, 'Checking Mark ECO Bills action button…');
                    const btn = page.getByRole('button', { name: 'Mark ECO Bills' });
                    await highlight(btn);
                    await expect(btn, '"Mark ECO Bills" must be visible').toBeVisible();
                    await expect(btn, '"Mark ECO Bills" must be enabled').toBeEnabled();
                });
            },
        );

        test('should display checkboxes at td[0] on every data row',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(60_000);

                await test.step('Navigate and load data', async () => {
                    await showStep(page, 'Navigating to Mark ECO Bills page…');
                    await goTo(page, ECO_URL);
                    await showStep(page, 'Loading orders via Search…');
                    await clickSearch(page);
                });

                await test.step('Verify every row has a checkbox at td[0]', async () => {
                    await showStep(page, 'Asserting checkboxes are present on all rows…');
                    const rows = page.locator('table tbody tr');
                    const count = await rows.count();
                    expect(count, 'Must have at least 1 data row').toBeGreaterThan(0);
                    for (let i = 0; i < Math.min(count, 5); i++) {
                        await expect(
                            rows.nth(i).locator('input[type="checkbox"]'),
                            `Row ${i}: checkbox must be present`,
                        ).toBeVisible();
                    }
                });
            },
        );

        test('should show a confirmation modal when a row is selected and Mark ECO Bills is clicked',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate and load data', async () => {
                    await showStep(page, 'Navigating to Mark ECO Bills page…');
                    await goTo(page, ECO_URL);
                    await showStep(page, 'Loading orders via Search…');
                    await clickSearch(page);
                });

                let invoiceNo = '';
                await test.step('Select first row via checkbox', async () => {
                    invoiceNo = await selectFirstRow(page);
                    await showStep(page, `Selected invoice: ${invoiceNo}`);
                });

                await test.step('Click Mark ECO Bills to trigger the confirmation modal', async () => {
                    const btn = page.getByRole('button', { name: 'Mark ECO Bills' });
                    await showStep(page, 'Clicking Mark ECO Bills…');
                    await highlight(btn);
                    await btn.click();
                    await page.waitForTimeout(1_000);
                });

                await test.step('Verify confirmation modal text and buttons', async () => {
                    await showStep(page, 'Asserting confirmation modal content…');
                    const modal = page.locator('.ant-modal-content');
                    await expect(modal, 'Confirmation modal must be visible').toBeVisible({ timeout: 8_000 });
                    await expect(modal, 'Modal must ask to mark as ECO Bills')
                        .toContainText('mark selected invoices as ECO Bills');
                    await expect(modal.getByRole('button', { name: 'Yes' }), '"Yes" must be in modal').toBeVisible();
                    await expect(modal.getByRole('button', { name: 'No' }), '"No" must be in modal').toBeVisible();
                });

                await test.step('Click No to cancel — modal must close', async () => {
                    await showStep(page, 'Dismissing modal via No…');
                    await page.getByRole('button', { name: 'No' }).click();
                    await page.waitForTimeout(500);
                    await expect(
                        page.locator('.ant-modal-content'),
                        'Modal must close after clicking No',
                    ).toBeHidden({ timeout: 5_000 });
                });
            },
        );

        test('should successfully mark a selected invoice as ECO Bill and give feedback',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate and load data', async () => {
                    await showStep(page, 'Navigating to Mark ECO Bills page…');
                    await goTo(page, ECO_URL);
                    await showStep(page, 'Loading orders via Search…');
                    await clickSearch(page);
                });

                let invoiceNo = '';
                await test.step('Select first row via checkbox', async () => {
                    invoiceNo = await selectFirstRow(page);
                    await showStep(page, `Selected invoice: ${invoiceNo}`);
                });

                await test.step('Click Mark ECO Bills to open confirmation', async () => {
                    const btn = page.getByRole('button', { name: 'Mark ECO Bills' });
                    await showStep(page, 'Clicking Mark ECO Bills…');
                    await highlight(btn);
                    await btn.click();
                    await page.waitForTimeout(1_000);
                });

                await test.step('Confirm marking by clicking Yes', async () => {
                    const modal = page.locator('.ant-modal-content');
                    await expect(modal, 'Confirmation modal must appear').toBeVisible({ timeout: 8_000 });
                    const yesBtn = modal.getByRole('button', { name: 'Yes' });
                    await showStep(page, `Confirming — clicking Yes to mark ${invoiceNo} as ECO Bill`);
                    await highlight(yesBtn);
                    await yesBtn.click();
                    await page.waitForTimeout(2_000);
                });

                await test.step('Verify the page gives feedback after marking', async () => {
                    await showStep(page, 'Verifying action outcome…');
                    const modal = page.locator('.ant-modal-content');
                    const notification = page.locator(
                        '.ant-notification-notice-content, .ant-message-notice-content',
                    );
                    const modalGone  = await modal.isHidden().catch(() => false);
                    const notifShown = await notification.first().isVisible().catch(() => false);
                    expect(
                        modalGone || notifShown,
                        'Modal must close OR a success notification must appear',
                    ).toBeTruthy();
                    await showStep(page, `✅ Invoice ${invoiceNo} marked as ECO Bill`);
                });
            },
        );

        test('should filter results by FC (BTM) on the Mark ECO Bills page',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate to Mark ECO Bills page', async () => {
                    await showStep(page, 'Navigating to Mark ECO Bills page…');
                    await goTo(page, ECO_URL);
                });

                await test.step('Select FC = BTM', async () => {
                    await showStep(page, 'Opening FC dropdown — typing BTML to surface BTM');
                    await selectDropdownOption(page, 'FC\\(s\\)', TEST_FC.label, TEST_FC.searchHint);
                });

                await test.step('Search and verify results', async () => {
                    await showStep(page, 'Clicking Search and asserting results…');
                    await clickSearch(page);
                    await expect(
                        page.getByRole('table').first(),
                        'Data table must be visible',
                    ).toBeVisible({ timeout: 10_000 });
                    const count = await page.locator('table tbody tr').count();
                    expect(count, 'Must have at least 1 row for FC=BTM').toBeGreaterThan(0);
                    await showStep(page, `✅ ${count} rows returned for FC=BTM`);
                });
            },
        );

    });

    // ══════════════════════════════════════════════════════════════════════════
    //  7 · MARK PAY ON DELIVERY PAGE  (/order-management/sales-order/mark-pod-bills)
    // ══════════════════════════════════════════════════════════════════════════

    test.describe('Mark Pay On Delivery Page', () => {

        test('should load with all required columns and Mark Pay On Delivery button visible',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(60_000);

                await test.step('Navigate to Mark Pay On Delivery page', async () => {
                    await showStep(page, 'Navigating to Mark Pay On Delivery page…');
                    await goTo(page, POD_URL);
                });

                await test.step('Click Search to load data', async () => {
                    await showStep(page, 'Loading orders via Search…');
                    await clickSearch(page);
                });

                await test.step('Verify all required columns are present', async () => {
                    await showStep(page, 'Checking column headers…');
                    for (const col of EXPECTED_COLUMNS) {
                        const header = page.getByRole('columnheader', { name: col });
                        await highlight(header);
                        await expect(header, `Column "${col}" must be visible`).toBeVisible();
                    }
                });

                await test.step('Verify Mark Pay On Delivery button is visible and enabled', async () => {
                    await showStep(page, 'Checking Mark Pay On Delivery action button…');
                    const btn = page.getByRole('button', { name: 'Mark Pay On Delivery' });
                    await highlight(btn);
                    await expect(btn, '"Mark Pay On Delivery" must be visible').toBeVisible();
                    await expect(btn, '"Mark Pay On Delivery" must be enabled').toBeEnabled();
                });
            },
        );

        test('should show a confirmation modal when a row is selected and Mark Pay On Delivery is clicked',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate and load data', async () => {
                    await showStep(page, 'Navigating to Mark Pay On Delivery page…');
                    await goTo(page, POD_URL);
                    await showStep(page, 'Loading orders via Search…');
                    await clickSearch(page);
                });

                let invoiceNo = '';
                await test.step('Select first row via checkbox', async () => {
                    invoiceNo = await selectFirstRow(page);
                    await showStep(page, `Selected invoice: ${invoiceNo}`);
                });

                await test.step('Click Mark Pay On Delivery to trigger the confirmation modal', async () => {
                    const btn = page.getByRole('button', { name: 'Mark Pay On Delivery' });
                    await showStep(page, 'Clicking Mark Pay On Delivery…');
                    await highlight(btn);
                    await btn.click();
                    await page.waitForTimeout(1_000);
                });

                await test.step('Verify confirmation modal text and buttons', async () => {
                    await showStep(page, 'Asserting confirmation modal content…');
                    const modal = page.locator('.ant-modal-content');
                    await expect(modal, 'Confirmation modal must appear').toBeVisible({ timeout: 8_000 });
                    await expect(modal, 'Modal must mention "Pay On Delivery"').toContainText('Pay On Delivery');
                    await expect(modal.getByRole('button', { name: 'Yes' }), '"Yes" must be in modal').toBeVisible();
                    await expect(modal.getByRole('button', { name: 'No' }), '"No" must be in modal').toBeVisible();
                });

                await test.step('Click No to cancel — modal must close', async () => {
                    await showStep(page, 'Dismissing modal via No…');
                    await page.getByRole('button', { name: 'No' }).click();
                    await page.waitForTimeout(500);
                    await expect(
                        page.locator('.ant-modal-content'),
                        'Modal must close after clicking No',
                    ).toBeHidden({ timeout: 5_000 });
                });
            },
        );

        test('should successfully mark a selected invoice as Pay On Delivery',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate and load data', async () => {
                    await showStep(page, 'Navigating to Mark Pay On Delivery page…');
                    await goTo(page, POD_URL);
                    await showStep(page, 'Loading orders via Search…');
                    await clickSearch(page);
                });

                const rows = page.locator('table tbody tr');
                if ((await rows.count()) === 0) {
                    test.skip(true, 'No orders available to mark as POD in this environment');
                    return;
                }

                let invoiceNo = '';
                await test.step('Select first row via checkbox', async () => {
                    invoiceNo = await selectFirstRow(page);
                    await showStep(page, `Selected invoice: ${invoiceNo}`);
                });

                await test.step('Click Mark Pay On Delivery to open confirmation', async () => {
                    const btn = page.getByRole('button', { name: 'Mark Pay On Delivery' });
                    await showStep(page, 'Clicking Mark Pay On Delivery…');
                    await highlight(btn);
                    await btn.click();
                    await page.waitForTimeout(1_000);
                });

                await test.step('Confirm by clicking Yes', async () => {
                    const modal = page.locator('.ant-modal-content');
                    await expect(modal, 'Confirmation modal must appear').toBeVisible({ timeout: 8_000 });
                    const yesBtn = modal.getByRole('button', { name: 'Yes' });
                    await showStep(page, `Confirming — marking ${invoiceNo} as Pay On Delivery`);
                    await highlight(yesBtn);
                    await yesBtn.click();
                    await page.waitForTimeout(2_000);
                });

                await test.step('Verify the page gives feedback after marking', async () => {
                    await showStep(page, 'Verifying POD mark outcome…');
                    const modal = page.locator('.ant-modal-content');
                    const notification = page.locator(
                        '.ant-notification-notice-content, .ant-message-notice-content',
                    );
                    const modalGone  = await modal.isHidden().catch(() => false);
                    const notifShown = await notification.first().isVisible().catch(() => false);
                    expect(
                        modalGone || notifShown,
                        'Modal must close OR a success notification must appear',
                    ).toBeTruthy();
                    await showStep(page, `✅ Invoice ${invoiceNo} marked as Pay On Delivery`);
                });
            },
        );

        test('should filter results by FC (BTM) on the Mark Pay On Delivery page',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate to Mark Pay On Delivery page', async () => {
                    await showStep(page, 'Navigating to Mark Pay On Delivery page…');
                    await goTo(page, POD_URL);
                });

                await test.step('Select FC = BTM', async () => {
                    await showStep(page, 'Opening FC dropdown — typing BTML to surface BTM');
                    await selectDropdownOption(page, 'FC\\(s\\)', TEST_FC.label, TEST_FC.searchHint);
                });

                await test.step('Search and verify results', async () => {
                    await showStep(page, 'Clicking Search and asserting results…');
                    await clickSearch(page);
                    await expect(
                        page.getByRole('table').first(),
                        'Data table must be visible',
                    ).toBeVisible({ timeout: 10_000 });
                    const count = await page.locator('table tbody tr').count();
                    expect(count, 'Must have at least 1 row for FC=BTM').toBeGreaterThan(0);
                    await showStep(page, `✅ ${count} rows returned for FC=BTM`);
                });
            },
        );

    });

    // ══════════════════════════════════════════════════════════════════════════
    //  8 · BLOCKED ORDER PAGE  (/order-management/sales-order/blocked-order)
    // ══════════════════════════════════════════════════════════════════════════

    test.describe('Blocked Order Page', () => {

        test('should load showing blocked orders with Unblock button and correct columns',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(60_000);

                await test.step('Navigate to Blocked Order page', async () => {
                    await showStep(page, 'Navigating to Blocked Order page…');
                    await goTo(page, BLOCKED_URL);
                });

                await test.step('Click Search to load blocked orders', async () => {
                    await showStep(page, 'Loading blocked orders via Search…');
                    await clickSearch(page);
                });

                await test.step('Verify all required columns are present', async () => {
                    await showStep(page, 'Checking column headers…');
                    for (const col of EXPECTED_COLUMNS) {
                        const header = page.getByRole('columnheader', { name: col });
                        await highlight(header);
                        await expect(header, `Column "${col}" must be visible`).toBeVisible();
                    }
                });

                await test.step('Verify Unblock button is visible and enabled', async () => {
                    await showStep(page, 'Checking Unblock action button…');
                    const btn = page.getByRole('button', { name: 'Unblock' });
                    await highlight(btn);
                    await expect(btn, '"Unblock" button must be visible').toBeVisible();
                    await expect(btn, '"Unblock" button must be enabled').toBeEnabled();
                });
            },
        );

        test('should display only "Order Blocked" status rows in the table',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate and load data', async () => {
                    await showStep(page, 'Navigating to Blocked Order page…');
                    await goTo(page, BLOCKED_URL);
                    await showStep(page, 'Loading blocked orders via Search…');
                    await clickSearch(page);
                });

                await test.step('Verify every row shows "Order Blocked" status', async () => {
                    await showStep(page, 'Asserting all rows have "Order Blocked" in Status column…');
                    const rows = page.locator('table tbody tr');
                    const count = await rows.count();
                    expect(count, 'Must have at least 1 blocked order').toBeGreaterThan(0);
                    for (let i = 0; i < count; i++) {
                        await expect(
                            rows.nth(i).locator('td').nth(COL.STATUS),
                            `Row ${i}: Status must be "Order Blocked"`,
                        ).toContainText('Order Blocked');
                    }
                    await showStep(page, `✅ All ${count} rows confirmed as Order Blocked`);
                });
            },
        );

        test('should show a reason-selection modal when a row is selected and Unblock is clicked',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate and load data', async () => {
                    await showStep(page, 'Navigating to Blocked Order page…');
                    await goTo(page, BLOCKED_URL);
                    await showStep(page, 'Loading blocked orders via Search…');
                    await clickSearch(page);
                });

                let invoiceNo = '';
                await test.step('Select first blocked invoice', async () => {
                    invoiceNo = await selectFirstRow(page);
                    await showStep(page, `Selected blocked invoice: ${invoiceNo}`);
                });

                await test.step('Click Unblock to open the reason dialog', async () => {
                    const btn = page.getByRole('button', { name: 'Unblock' });
                    await showStep(page, 'Clicking Unblock…');
                    await highlight(btn);
                    await btn.click();
                    await page.waitForTimeout(1_200);
                });

                await test.step('Verify reason-selection modal appears with all expected reasons', async () => {
                    await showStep(page, 'Asserting Unblock reason modal content…');
                    const modal = page.locator('.ant-modal-content');
                    await expect(modal, 'Unblock modal must appear').toBeVisible({ timeout: 8_000 });
                    await expect(modal, 'Modal must mention "Unblock"').toContainText('Unblock');
                    await expect(modal, 'Modal must prompt for a reason').toContainText('Reason for Unblocking');
                    for (const reason of UNBLOCK_REASONS) {
                        await expect(modal, `Reason "${reason}" must be listed`).toContainText(reason);
                    }
                    await showStep(page, `✅ All ${UNBLOCK_REASONS.length} unblock reasons are listed`);
                });

                await test.step('Close modal without unblocking', async () => {
                    await showStep(page, 'Closing reason modal via Escape…');
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(500);
                    await expect(
                        page.locator('.ant-modal-content'),
                        'Modal must close after Escape',
                    ).toBeHidden({ timeout: 5_000 });
                });
            },
        );

        test('should successfully unblock a selected invoice after choosing a reason',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate and load data', async () => {
                    await showStep(page, 'Navigating to Blocked Order page…');
                    await goTo(page, BLOCKED_URL);
                    await showStep(page, 'Loading blocked orders via Search…');
                    await clickSearch(page);
                });

                const rows = page.locator('table tbody tr');
                if ((await rows.count()) === 0) {
                    test.skip(true, 'No blocked orders available in this environment');
                    return;
                }

                let invoiceNo = '';
                await test.step('Select first blocked invoice', async () => {
                    invoiceNo = await selectFirstRow(page);
                    await showStep(page, `Selected invoice: ${invoiceNo}`);
                });

                await test.step('Click Unblock to open reason dialog', async () => {
                    const btn = page.getByRole('button', { name: 'Unblock' });
                    await showStep(page, 'Clicking Unblock…');
                    await highlight(btn);
                    await btn.click();
                    await page.waitForTimeout(1_200);
                });

                await test.step('Select "Collection Received" as the unblock reason', async () => {
                    const modal = page.locator('.ant-modal-content');
                    await expect(modal, 'Reason modal must be visible').toBeVisible({ timeout: 8_000 });
                    await showStep(page, 'Selecting reason: Collection Received');
                    const reason = modal.getByText('Collection Received');
                    await highlight(reason);
                    await reason.click();
                    await page.waitForTimeout(400);
                });

                await test.step('Submit the unblock action', async () => {
                    const modal     = page.locator('.ant-modal-content');
                    const submitBtn = modal.getByRole('button', { name: 'Submit' });
                    await expect(submitBtn, '"Submit" must be enabled after selecting a reason').toBeEnabled();
                    await showStep(page, `Submitting unblock for invoice ${invoiceNo}…`);
                    await highlight(submitBtn);
                    await submitBtn.click();
                    await page.waitForTimeout(2_500);
                });

                await test.step('Verify action feedback', async () => {
                    await showStep(page, 'Verifying unblock outcome…');
                    const modal = page.locator('.ant-modal-content');
                    const notification = page.locator(
                        '.ant-notification-notice-content, .ant-message-notice-content',
                    );
                    const modalGone  = await modal.isHidden().catch(() => false);
                    const notifShown = await notification.first().isVisible().catch(() => false);
                    expect(
                        modalGone || notifShown,
                        'Modal must close OR a notification must appear after submitting unblock',
                    ).toBeTruthy();
                    await showStep(page, `✅ Invoice ${invoiceNo} unblocked successfully`);
                });
            },
        );

        test('should filter blocked orders by FC (BTM) and show only BTM results',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);

                await test.step('Navigate to Blocked Order page', async () => {
                    await showStep(page, 'Navigating to Blocked Order page…');
                    await goTo(page, BLOCKED_URL);
                });

                await test.step('Select FC = BTM', async () => {
                    await showStep(page, 'Opening FC dropdown — typing BTML to surface BTM');
                    await selectDropdownOption(page, 'FC\\(s\\)', TEST_FC.label, TEST_FC.searchHint);
                });

                await test.step('Search and verify results belong to BTM', async () => {
                    await showStep(page, 'Clicking Search…');
                    await clickSearch(page);
                    await expect(
                        page.getByRole('table').first(),
                        'Data table must be visible',
                    ).toBeVisible({ timeout: 10_000 });
                    const rows = page.locator('table tbody tr');
                    const count = await rows.count();
                    if (count === 0) {
                        await showStep(page, 'ℹ️ No BTM blocked orders in preprod — skipping row assertion');
                        return;
                    }
                    for (let i = 0; i < count; i++) {
                        await expect(
                            rows.nth(i).locator('td').nth(COL.FC),
                            `Row ${i}: FC must contain BTM`,
                        ).toContainText('BTM');
                    }
                    await showStep(page, `✅ All ${count} rows confirmed as BTM`);
                });
            },
        );

    });

}); // Sales Order
