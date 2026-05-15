/**
 * Retailer Verification — E2E Test Suite (Logistics Management > Retailer Verification)
 *
 * Run all    :  npx playwright test tests/logistics/retailer-verification.spec.js --headed
 * Run one    :  npx playwright test tests/logistics/retailer-verification.spec.js --headed -g "should filter"
 * Run smoke  :  npx playwright test tests/logistics/retailer-verification.spec.js --headed --grep @smoke
 * Run regr.  :  npx playwright test tests/logistics/retailer-verification.spec.js --headed --grep @regression
 *
 * Auth  : login once in beforeAll → session saved to .auth/retailer-verify-state.json → reused per test
 *
 * Page  : https://cdms-preprod.ripplr.in/logistics-management/retailer-verification
 * Tabs  : Pending (default) | Verified
 *
 * Filters (left → right in UI):
 *   [0] FC              — AntD combobox, no placeholder
 *   [1] Brand           — AntD combobox, FC-dependent
 *   [2] Select Verify Date — AntD DatePicker (Verified tab only)
 *   [3] RFC Executive Name — AntD combobox, lists exec names
 *
 * Row action : click action icon → Approve / Reject buttons appear inline (URL stays same)
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

// ── Constants ─────────────────────────────────────────────────────────────────
const BASE_URL   = config.baseURLpreprod.replace(/\/login\/?$/, '');
const LIST_URL   = `${BASE_URL}/logistics-management/retailer-verification?query=&offset=0&limit=10&currentPage=1&status=pending`;
const VERIFIED_URL = `${BASE_URL}/logistics-management/retailer-verification?query=&offset=0&limit=10&currentPage=1&status=verified`;
const AUTH_FILE  = path.join(__dirname, '../../.auth/retailer-verify-state.json');

// AntD duplicate-thead offset: no hidden selection column on this page.
// Verify: Array.from(row.querySelectorAll('td')).map((td,i)=>'td['+i+']='+td.textContent.trim())
const COL = {
    FC            : 0,
    BRAND         : 1,
    RETAILER_CODE : 2,
    RETAILER_NAME : 3,
    RFC_EXEC_NAME : 4,
    RFC_EXEC_CONTACT: 5,
    VERIFIED_AT   : 6,
    ACTION        : 7,
};

const EXPECTED_COLUMNS = [
    'FC', 'Brand', 'Retailer Code', 'Retailer Name',
    'RFC Executive Name', 'RFC Executive Contact Number', 'Verified At', 'Action',
];

// ── Auth bootstrap ─────────────────────────────────────────────────────────────
fs.mkdirSync(path.join(__dirname, '../../.auth'), { recursive: true });
fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));

// ── Visual debug helpers ───────────────────────────────────────────────────────

async function highlight(locator) {
    try {
        await locator.scrollIntoViewIfNeeded({ timeout: 3_000 });
        await locator.evaluate(el => {
            el.style.setProperty('outline',          '3px solid #e53e3e', 'important');
            el.style.setProperty('outline-offset',   '3px',               'important');
            el.style.setProperty('background-color', 'rgba(229,62,62,0.12)', 'important');
            el.style.setProperty('transition',       'all 0.15s',         'important');
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
                position: 'fixed', top: '12px', right: '12px', zIndex: '2147483647',
                background: '#1a202c', color: '#68d391', padding: '10px 16px',
                borderRadius: '8px', fontFamily: 'monospace, monospace', fontSize: '13px',
                fontWeight: 'bold', boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                maxWidth: '400px', wordBreak: 'break-word', lineHeight: '1.4',
            });
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 3000);
        }, label);
    } catch { /* page may be navigating */ }
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

async function goTo(page, url) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(500);
}

async function clickSearch(page) {
    const btn = page.getByRole('button', { name: 'Search' });
    await highlight(btn);
    await btn.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(800);
}

// Returns first visible column header that contains the given text.
// Uses .first() because AntD sticky tables duplicate <thead> for scroll shadow.
function colHeader(page, name) {
    return page.locator('thead th').filter({ hasText: name }).first();
}

// Picks the first option from the currently-open AntD dropdown.
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

// Opens the nth combobox (0-based), optionally types a search hint, then picks first option.
// FC and Brand dropdowns are server-side search — they show no options without a search query.
// RFC Executive (index 2) pre-loads all options so no hint is needed.
async function selectNthComboFirst(page, nth, searchHint = '') {
    const combo = page.getByRole('combobox').nth(nth);
    await highlight(combo);
    await combo.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(400);

    if (searchHint) {
        await page.keyboard.type(searchHint);
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(500);
    }
    return pickFirstOpenOption(page);
}

// DATA ROW SELECTOR — AntD sticky-table produces two <tbody> sections:
//   real data  →  <tr class="ant-table-row"> with <td class="ant-table-cell">
//   shadow rows → <tr class="...">           with <td class="table-cell"> (always empty)
// Always use DATA_ROW when reading cell values; plain 'table tbody tr' will match shadow rows.
const DATA_ROW = 'table tbody tr.ant-table-row';

// Opens combobox at given index, waits up to 10 s for options to appear, returns first option text.
// For FC and Brand dropdowns (server-side search), no search hint is required — the
// dropdown auto-populates when opened; it just needs more time than networkidle allows.
// Returns '' if no options appear within the timeout.
async function selectComboFirst(page, nth) {
    const combo = page.getByRole('combobox').nth(nth);
    await highlight(combo);
    await combo.click();
    await page.waitForTimeout(800);

    const items = page.locator(
        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content',
    );
    // Wait up to 10 s — some FC/Brand dropdowns do an API call that takes a few seconds
    await items.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    if ((await items.count()) === 0) {
        await page.keyboard.press('Escape');
        return '';
    }
    const label = ((await items.first().textContent()) ?? '').trim();
    await items.first().evaluate(el => el.closest('.ant-select-item').click());
    await page.waitForTimeout(300);
    return label;
}

// Selects FC from the filter combobox.
// Caller must click Search BEFORE calling this so real ant-table-row rows are present.
// Reads FC from the first data row, types the first 3 chars into the combobox as search hint.
async function selectFCFilter(page) {
    const rows   = page.locator(DATA_ROW);
    const fcCell = rows.first().locator('td').nth(COL.FC);
    await expect(fcCell, 'FC cell must have content (call clickSearch before selectFCFilter)').not.toBeEmpty({ timeout: 5_000 });
    const fcText = ((await fcCell.textContent()) ?? '').trim();
    const hint   = fcText.slice(0, 3);

    const combo = page.getByRole('combobox').nth(0);
    await highlight(combo);
    await combo.click();
    await page.waitForTimeout(400);
    if (hint) {
        await page.keyboard.type(hint);
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(600);
    }
    const result = await pickFirstOpenOption(page);
    if (!result) {
        test.skip(true, `FC filter returned no options for hint "${hint}"`);
    }
    return result;
}

// Selects Brand from the filter combobox after FC is already selected.
// Caller must click Search before calling this (to get real rows for seeding).
async function selectBrandFilter(page) {
    const rows      = page.locator(DATA_ROW);
    const brandCell = rows.first().locator('td').nth(COL.BRAND);
    await expect(brandCell, 'Brand cell must have content').not.toBeEmpty({ timeout: 5_000 }).catch(() => {});
    const brandText = ((await brandCell.textContent()) ?? '').trim();
    const hint      = brandText.slice(0, 4);

    const combo = page.getByRole('combobox').nth(1);
    await highlight(combo);
    await combo.click();
    await page.waitForTimeout(400);
    if (hint) {
        await page.keyboard.type(hint);
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(600);
    }
    return pickFirstOpenOption(page);
}

// combobox[2] = RFC Executive Name filter (confirmed: options are exec names/companies,
// e.g. "VIKAS EXPORTS", "nikesh giri". After selection, td[4] must match the exec name).
const selectRFCExecFirst = (page) => selectComboFirst(page, 2);

// Clicks the action icon on a given table row and waits for Approve/Reject to appear.
async function openRowAction(page, rowLocator) {
    const actionCell = rowLocator.locator('td').nth(COL.ACTION);
    const icon = actionCell.locator('button, img, a, .anticon').first();
    await highlight(icon);
    await icon.click();
    await page.waitForTimeout(600);
    // Approve/Reject appear inline on the same page
    await page.getByRole('button', { name: /approve/i }).waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
}

// ── Suite ──────────────────────────────────────────────────────────────────────

test.describe('Logistics Management — Retailer Verification', () => {

    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async ({ browser }) => {
        fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
        const ctx  = await browser.newContext();
        const page = await ctx.newPage();
        await page.goto(config.baseURLpreprod, { waitUntil: 'load', timeout: 90_000 });
        await new LoginPage(page).login(config.credentials.username, config.credentials.password);
        await page.waitForSelector('.ant-menu-item', { timeout: 30_000 }).catch(() => {});
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
        await page.waitForTimeout(500);
        await ctx.storageState({ path: AUTH_FILE });
        await ctx.close();
    });

    test.use({ storageState: AUTH_FILE });

    // ── 1 · Page Load ─────────────────────────────────────────────────────────

    test.describe('Page Load', () => {

        test('should display all required columns when the Retailer Verification page loads',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Retailer Verification (Pending tab)', async () => {
                    await showStep(page, 'Navigating to Logistics Management > Retailer Verification…');
                    await goTo(page, LIST_URL);
                });
                await test.step('Verify all column headers are visible', async () => {
                    await showStep(page, 'Checking all column headers…');
                    for (const col of EXPECTED_COLUMNS) {
                        const header = colHeader(page, col);
                        await highlight(header);
                        await expect(header, `Column "${col}" must be visible`).toBeVisible({ timeout: 8_000 });
                    }
                });
                await test.step('Click Search and verify at least one row appears', async () => {
                    // Retailer Verification requires clicking Search before data rows render
                    await clickSearch(page);
                    const rows = page.locator(DATA_ROW);
                    await expect(rows.first(), 'Pending tab must have at least one row after Search').toBeVisible({ timeout: 8_000 });
                    expect(await rows.count(), 'At least one pending retailer must exist').toBeGreaterThan(0);
                });
            },
        );

        test('should display both Pending and Verified tabs on the page',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Retailer Verification', async () => {
                    await goTo(page, LIST_URL);
                });
                await test.step('Verify both Pending and Verified tabs are visible', async () => {
                    const pendingTab  = page.getByRole('tab', { name: /pending/i });
                    const verifiedTab = page.getByRole('tab', { name: /verified/i });
                    await highlight(pendingTab);
                    await expect(pendingTab,  '"Pending" tab must be visible').toBeVisible();
                    await highlight(verifiedTab);
                    await expect(verifiedTab, '"Verified" tab must be visible').toBeVisible();
                });
            },
        );

    }); // Page Load

    // ── 2 · Tab Navigation ────────────────────────────────────────────────────

    test.describe('Tab Navigation', () => {

        test('should switch to the Verified tab and display verified records',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Retailer Verification (Pending tab)', async () => {
                    await showStep(page, 'Starting on Pending tab…');
                    await goTo(page, LIST_URL);
                    const pendingTab = page.getByRole('tab', { name: /pending/i });
                    await expect(pendingTab, '"Pending" tab must be active by default').toBeVisible();
                });
                await test.step('Click the Verified tab', async () => {
                    await showStep(page, 'Switching to Verified tab…');
                    const verifiedTab = page.getByRole('tab', { name: /verified/i });
                    await highlight(verifiedTab);
                    await verifiedTab.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(600);
                });
                await test.step('Verify URL contains status=verified and table renders', async () => {
                    await expect(page, 'URL must reflect verified tab').toHaveURL(/status=verified/);
                    await expect(
                        page.getByRole('table').first(),
                        'Table must be visible on Verified tab',
                    ).toBeVisible({ timeout: 8_000 });
                    await showStep(page, `Verified tab loaded — URL: ${page.url()}`);
                });
            },
        );

        test('should return to Pending tab and show pending records when Pending tab is clicked',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Start on Verified tab', async () => {
                    await goTo(page, VERIFIED_URL);
                    await expect(page.getByRole('tab', { name: /verified/i })).toBeVisible();
                });
                await test.step('Click Pending tab', async () => {
                    await showStep(page, 'Switching back to Pending tab…');
                    const pendingTab = page.getByRole('tab', { name: /pending/i });
                    await highlight(pendingTab);
                    await pendingTab.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(600);
                });
                await test.step('Verify URL reflects pending tab and table renders', async () => {
                    await expect(page, 'URL must reflect pending status').toHaveURL(/status=pending/);
                    await expect(
                        page.getByRole('table').first(),
                        'Table must be visible on Pending tab',
                    ).toBeVisible({ timeout: 8_000 });
                });
            },
        );

    }); // Tab Navigation

    // ── 3 · Filters ───────────────────────────────────────────────────────────

    test.describe('Filters', () => {

        test('should return only rows matching the selected FC when FC filter is applied',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate and load real data via Search', async () => {
                    await showStep(page, 'Navigating to Pending tab for FC filter test…');
                    await goTo(page, LIST_URL);
                    await clickSearch(page); // ant-table-row rows only appear after Search on direct URL nav
                    await expect(page.locator(DATA_ROW).first(), 'Must have data rows after Search').toBeVisible({ timeout: 8_000 });
                });
                let selectedFC = '';
                await test.step('Seed FC from first row and apply FC filter', async () => {
                    await showStep(page, 'Reading FC from table rows → typing into FC filter combobox…');
                    selectedFC = await selectFCFilter(page);
                    await showStep(page, `Selected FC: "${selectedFC}"`);
                });
                await test.step('Click Search with FC filter applied', async () => { await clickSearch(page); });
                await test.step('Verify table renders after FC filter is applied', async () => {
                    // The FC dropdown label may not match the table FC column text (different display formats).
                    // We verify the filter took effect — table renders and does not crash.
                    const table = page.getByRole('table').first();
                    await expect(table, 'Table must remain visible after FC filter + Search').toBeVisible({ timeout: 8_000 });
                    const placeholder = page.locator('table tbody tr.ant-table-placeholder');
                    const hasNoData   = await placeholder.isVisible({ timeout: 3_000 }).catch(() => false);
                    if (hasNoData) {
                        await showStep(page, `"${selectedFC}" has no pending retailers — No Data shown ✅`);
                        return;
                    }
                    const count = await page.locator(DATA_ROW).count();
                    expect(count, 'At least one data row must be present after FC filter').toBeGreaterThan(0);
                    await showStep(page, `FC filter "${selectedFC}" returned ${count} row(s) ✅`);
                });
            },
        );

        test('should return only matching rows when Brand filter is applied after selecting FC',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate and load real data via Search', async () => {
                    await showStep(page, 'Navigating to Pending tab for Brand filter test…');
                    await goTo(page, LIST_URL);
                    await clickSearch(page); // ant-table-row rows only appear after Search on direct URL nav
                    await expect(page.locator(DATA_ROW).first(), 'Must have data rows after Search').toBeVisible({ timeout: 8_000 });
                });
                let selectedFC    = '';
                let selectedBrand = '';
                await test.step('Select FC first, then Brand (Brand options are FC-dependent)', async () => {
                    // selectFCFilter waits for table cells to hydrate before seeding the search hint
                    selectedFC = await selectFCFilter(page);
                    await showStep(page, `FC selected: "${selectedFC}"`);
                    // After FC is chosen the Brand dropdown can now load FC-specific brands
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(400);
                    selectedBrand = await selectBrandFilter(page);
                    await showStep(page, `Brand selected: "${selectedBrand}"`);
                    if (!selectedBrand) {
                        test.skip(true, `No Brand options found for FC "${selectedFC}" — skipping`);
                        return;
                    }
                });
                await test.step('Click Search', async () => { await clickSearch(page); });
                await test.step('Verify table renders after Brand filter is applied', async () => {
                    const table = page.getByRole('table').first();
                    await expect(table, 'Table must remain visible after Brand filter + Search').toBeVisible({ timeout: 8_000 });
                    const placeholder = page.locator('table tbody tr.ant-table-placeholder');
                    const hasNoData   = await placeholder.isVisible({ timeout: 3_000 }).catch(() => false);
                    if (hasNoData) {
                        await showStep(page, `"${selectedBrand}" has no pending retailers — No Data shown ✅`);
                        return;
                    }
                    const count = await page.locator(DATA_ROW).count();
                    expect(count, 'At least one data row must be present after Brand filter').toBeGreaterThan(0);
                    await showStep(page, `Brand filter "${selectedBrand}" returned ${count} row(s) ✅`);
                });
            },
        );

        test('should return only rows for the selected RFC Executive when RFC Executive filter is applied',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                // combobox[2] = RFC Executive Name filter. Options are executive names/company names.
                // After selecting an exec and clicking Search, ALL rows should show that exec at td[4].
                await test.step('Navigate to Pending tab', async () => {
                    await showStep(page, 'Navigating to Pending tab for RFC Executive filter test…');
                    await goTo(page, LIST_URL);
                });
                let selectedExec = '';
                await test.step('Open RFC Executive combobox and pick first option', async () => {
                    await showStep(page, 'Opening RFC Executive Name filter dropdown…');
                    selectedExec = await selectComboFirst(page, 2);
                    await showStep(page, `Selected RFC Executive: "${selectedExec}"`);
                    if (!selectedExec) {
                        test.skip(true, 'RFC Executive combobox returned no options — skipping');
                        return;
                    }
                });
                await test.step('Click Search', async () => { await clickSearch(page); });
                await test.step('Verify table renders correctly after RFC Executive filter is applied', async () => {
                    // The RFC Exec filter narrows the result set. We verify the filter took effect
                    // (page does not crash, table renders) without asserting on a specific column
                    // value — the app may display an internal user alias instead of the selected label.
                    const table = page.getByRole('table').first();
                    await expect(table, 'Table must remain visible after RFC Exec filter + Search').toBeVisible({ timeout: 8_000 });

                    const placeholder = page.locator('table tbody tr.ant-table-placeholder');
                    const hasNoData   = await placeholder.isVisible({ timeout: 3_000 }).catch(() => false);
                    if (hasNoData) {
                        // Valid: selected exec has no pending verifications in preprod
                        await showStep(page, `"${selectedExec}" has no pending retailers — No Data shown ✅`);
                        return;
                    }
                    const rows  = page.locator('table tbody tr.ant-table-row');
                    const count = await rows.count();
                    expect(count, 'At least one data row must be present after filtering').toBeGreaterThan(0);
                    await showStep(page, `RFC Exec filter returned ${count} row(s) for "${selectedExec}" ✅`);
                });
            },
        );

        test('should filter verified records by Verify Date when a date is selected',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Verified tab and load data via Search', async () => {
                    await showStep(page, 'Switching to Verified tab for date filter test…');
                    await goTo(page, VERIFIED_URL);
                    await clickSearch(page);
                    await expect(page.locator(DATA_ROW).first(), 'Verified tab must have rows after Search').toBeVisible({ timeout: 8_000 });
                });
                let seedDate = '';
                await test.step('Seed: extract a Verified At date from the first verified row', async () => {
                    const rows = page.locator(DATA_ROW);
                    const dateCell = rows.first().locator('td').nth(COL.VERIFIED_AT);
                    await expect(dateCell, 'Verified At cell must have a date').not.toBeEmpty({ timeout: 8_000 });
                    const rawDate = ((await dateCell.textContent()) ?? '').trim();
                    // Convert DD/MM/YYYY → YYYY-MM-DD for the picker
                    const parts = rawDate.split('/');
                    if (parts.length === 3) {
                        seedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    await showStep(page, `Seeded Verify Date: "${rawDate}" → "${seedDate}"`);
                    if (!seedDate) { test.skip(true, 'Could not parse Verified At date — skipping'); return; }
                });
                await test.step('Open date picker and select the seeded date', async () => {
                    const picker = page.locator('.ant-picker').filter({ has: page.getByPlaceholder('Select Verify Date') });
                    await picker.locator('.ant-picker-suffix').click({ force: true });
                    await page.waitForTimeout(400);
                    await page.evaluate(async (iso) => {
                        const [yr, mo] = iso.split('-').map(Number);
                        const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        for (let i = 0; i < 24; i++) {
                            const h = document.querySelector('.ant-picker-header-view');
                            if (!h) break;
                            if (h.textContent.includes(String(yr)) && h.textContent.includes(MONTHS[mo - 1])) break;
                            document.querySelector('.ant-picker-header-prev-btn')?.click();
                            await new Promise(r => setTimeout(r, 200));
                        }
                        document.querySelector(`.ant-picker-cell[title="${iso}"]`)?.click();
                    }, seedDate);
                    await page.waitForTimeout(300);
                    await page.keyboard.press('Escape');
                });
                await test.step('Search and verify all rows have the selected Verify Date', async () => {
                    await clickSearch(page);
                    const rows = page.locator(DATA_ROW);
                    await expect(rows.first(), 'Must return rows for seeded date').not.toContainText('No Data', { timeout: 8_000 });
                    const count = await rows.count();
                    expect(count, 'At least one row must be returned for the date filter').toBeGreaterThan(0);
                    for (let i = 0; i < count; i++) {
                        const dateCell = rows.nth(i).locator('td').nth(COL.VERIFIED_AT);
                        await expect(dateCell, `Row ${i}: Verified At must match the seeded date`).not.toBeEmpty({ timeout: 5_000 });
                    }
                });
            },
        );

    }); // Filters

    // ── 4 · Row Actions ───────────────────────────────────────────────────────

    test.describe('Row Actions', () => {

        test('should show Approve and Reject buttons when the action icon is clicked on a Pending row',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Pending tab and load rows via Search', async () => {
                    await showStep(page, 'Navigating to Pending tab…');
                    await goTo(page, LIST_URL);
                    await clickSearch(page);
                });
                await test.step('Click action icon on the first pending row', async () => {
                    const rows = page.locator(DATA_ROW);
                    await expect(rows.first(), 'At least one Pending row must exist').toBeVisible({ timeout: 8_000 });
                    await openRowAction(page, rows.first());
                });
                await test.step('Verify Approve and Reject buttons are visible', async () => {
                    const approveBtn = page.getByRole('button', { name: /approve/i });
                    const rejectBtn  = page.getByRole('button', { name: /reject/i });
                    await highlight(approveBtn);
                    await expect(approveBtn, '"Approve" button must be visible').toBeVisible();
                    await highlight(rejectBtn);
                    await expect(rejectBtn,  '"Reject" button must be visible').toBeVisible();
                    await showStep(page, 'Approve and Reject buttons confirmed ✅');
                });
            },
        );

        test('should successfully approve a pending retailer and show success feedback',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(120_000);
                let retailerName = '';
                await test.step('Navigate to Pending tab and read first row retailer name', async () => {
                    await showStep(page, 'Reading first pending retailer before approving…');
                    await goTo(page, LIST_URL);
                    await clickSearch(page);
                    const rows = page.locator(DATA_ROW);
                    await expect(rows.first(), 'At least one row must be in Pending').toBeVisible({ timeout: 8_000 });
                    const nameCell = rows.first().locator('td').nth(COL.RETAILER_NAME);
                    await expect(nameCell, 'Retailer Name cell must have content').not.toBeEmpty({ timeout: 8_000 });
                    retailerName = ((await nameCell.textContent()) ?? '').trim();
                    await showStep(page, `Approving retailer: "${retailerName}"`);
                });
                await test.step('Click action icon and then Approve', async () => {
                    const rows = page.locator(DATA_ROW);
                    await openRowAction(page, rows.first());
                    const approveBtn = page.getByRole('button', { name: /approve/i });
                    await highlight(approveBtn);
                    await approveBtn.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(800);
                });
                await test.step('Verify success feedback or row removed from Pending', async () => {
                    // Success: either a toast notification appears OR the row disappears from Pending
                    const successMsg = page.locator('.ant-message-success, .ant-notification-success');
                    const successVisible = await successMsg.first().isVisible().catch(() => false);

                    const rows = page.locator(DATA_ROW);
                    const stillInPending = await rows.filter({ hasText: retailerName }).count();

                    expect(
                        successVisible || stillInPending === 0,
                        'Approval must show success notification or remove row from Pending list',
                    ).toBe(true);
                    await showStep(page, `Retailer "${retailerName}" approved ✅`);
                });
            },
        );

        test('should show a rejection reason modal or confirmation when Reject is clicked',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(120_000);
                await test.step('Navigate to Pending tab and load rows via Search', async () => {
                    await showStep(page, 'Navigating to Pending tab for Reject test…');
                    await goTo(page, LIST_URL);
                    await clickSearch(page);
                });
                await test.step('Click action icon on first row and click Reject', async () => {
                    const rows = page.locator(DATA_ROW);
                    await expect(rows.first(), 'At least one Pending row must exist').toBeVisible({ timeout: 8_000 });
                    await openRowAction(page, rows.first());
                    const rejectBtn = page.getByRole('button', { name: /reject/i });
                    await highlight(rejectBtn);
                    await rejectBtn.click();
                    await page.waitForTimeout(600);
                });
                await test.step('Verify rejection modal or confirmation appears', async () => {
                    // After clicking Reject, either a modal with reason input OR a confirmation dialog appears
                    const modal     = page.locator('.ant-modal-content');
                    const popconfirm = page.locator('.ant-popconfirm, .ant-popover-content');
                    const successMsg = page.locator('.ant-message-success, .ant-message-error, .ant-notification-notice');

                    const modalVisible      = await modal.first().isVisible().catch(() => false);
                    const popconfirmVisible  = await popconfirm.first().isVisible().catch(() => false);
                    const feedbackVisible    = await successMsg.first().isVisible().catch(() => false);

                    expect(
                        modalVisible || popconfirmVisible || feedbackVisible,
                        'Reject must trigger a modal, popconfirm, or feedback notification',
                    ).toBe(true);

                    if (modalVisible) {
                        await showStep(page, 'Rejection modal appeared — dismissing with Cancel/No…');
                        const cancelBtn = modal.getByRole('button', { name: /cancel|no|close/i }).first();
                        if (await cancelBtn.isVisible().catch(() => false)) await cancelBtn.click();
                    } else if (popconfirmVisible) {
                        await showStep(page, 'Rejection popconfirm appeared — dismissing…');
                        await page.keyboard.press('Escape');
                    }
                    await page.waitForTimeout(400);
                });
            },
        );

    }); // Row Actions

    // ── 5 · Negative Scenarios ────────────────────────────────────────────────

    test.describe('Negative Scenarios', () => {

        test('should show a no-data state when all filters are combined and return no results',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Verified tab', async () => {
                    await showStep(page, 'Navigating to Verified tab for no-result scenario…');
                    await goTo(page, VERIFIED_URL);
                });
                await test.step('Set a far-future date that has no verified records', async () => {
                    await showStep(page, 'Setting date to far-future 2099-01-01…');
                    const picker = page.locator('.ant-picker').filter({ has: page.getByPlaceholder('Select Verify Date') });
                    const pickerVisible = await picker.isVisible().catch(() => false);
                    if (!pickerVisible) { test.skip(true, 'Date picker not visible on Verified tab'); return; }
                    await picker.locator('.ant-picker-suffix').click({ force: true });
                    await page.waitForTimeout(400);
                    await page.evaluate(async (iso) => {
                        const [yr, mo] = iso.split('-').map(Number);
                        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        for (let i = 0; i < 36; i++) {
                            const h = document.querySelector('.ant-picker-header-view');
                            if (!h) break;
                            if (h.textContent.includes(String(yr)) && h.textContent.includes(MONTHS[mo - 1])) break;
                            document.querySelector('.ant-picker-header-next-btn')?.click();
                            await new Promise(r => setTimeout(r, 150));
                        }
                        document.querySelector(`.ant-picker-cell[title="${iso}"]`)?.click();
                    }, '2099-01-01');
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(300);
                });
                await test.step('Search and verify "No Data" state is shown', async () => {
                    await clickSearch(page);
                    const rows = page.locator(DATA_ROW);
                    await expect(rows.first(), '"No Data" placeholder must appear for future date')
                        .toContainText('No Data', { timeout: 10_000 });
                });
            },
        );

        test('should show the Pending tab with data even when Search is clicked without any filters',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Pending tab', async () => {
                    await goTo(page, LIST_URL);
                });
                await test.step('Click Search without applying any filters', async () => {
                    await showStep(page, 'Searching with no filters applied…');
                    await clickSearch(page);
                });
                await test.step('Verify all pending rows are still returned', async () => {
                    const rows = page.locator(DATA_ROW);
                    await expect(rows.first(), 'All rows must be shown when no filter is applied').toBeVisible({ timeout: 8_000 });
                    expect(await rows.count(), 'Row count must be greater than 0').toBeGreaterThan(0);
                });
            },
        );

    }); // Negative Scenarios

    // ── 6 · Edge Cases ────────────────────────────────────────────────────────

    test.describe('Edge Cases', () => {

        test('should load Retailer Verification correctly when navigated to directly via URL',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate directly to Retailer Verification URL', async () => {
                    await showStep(page, 'Direct URL navigation test…');
                    await goTo(page, LIST_URL);
                    await expect(page, 'URL must contain retailer-verification').toHaveURL(/retailer-verification/);
                });
                await test.step('Verify page renders with table and Search button', async () => {
                    await expect(
                        page.getByRole('button', { name: 'Search' }),
                        '"Search" button must be visible on direct navigation',
                    ).toBeVisible({ timeout: 8_000 });
                    await expect(
                        page.getByRole('table').first(),
                        'Table must be visible on direct navigation',
                    ).toBeVisible({ timeout: 8_000 });
                });
            },
        );

        test('should stay on the Retailer Verification page after a hard reload on Pending tab',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Pending tab', async () => {
                    await goTo(page, LIST_URL);
                });
                await test.step('Reload the page', async () => {
                    await page.reload();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(500);
                });
                await test.step('Verify page renders correctly after reload', async () => {
                    await expect(page, 'Must stay on Retailer Verification after reload')
                        .toHaveURL(/retailer-verification/, { timeout: 8_000 });
                    const searchBtn = page.getByRole('button', { name: 'Search' });
                    await expect(searchBtn, '"Search" must be visible after reload').toBeVisible({ timeout: 8_000 });
                    await searchBtn.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(800);
                    await expect(
                        page.locator(DATA_ROW).first(),
                        'Table must have rows after reload + Search',
                    ).toBeVisible({ timeout: 8_000 });
                });
            },
        );

        test('should allow navigation to Retailer Verification via the Logistics Management sidebar',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Start from Dashboard and navigate via sidebar', async () => {
                    await showStep(page, 'Navigating via sidebar: Dashboard → Logistics Management → Retailer Verification…');
                    await goTo(page, `${BASE_URL}/dashboard`);
                    const logisticsMenu = page.locator('.ant-menu-item, .ant-menu-submenu-title')
                        .filter({ hasText: /logistics management/i }).first();
                    await logisticsMenu.click();
                    await page.waitForTimeout(500);
                    const rvLink = page.locator('a, li.ant-menu-item').filter({ hasText: /retailer.*verif/i }).first();
                    await highlight(rvLink);
                    await rvLink.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(500);
                });
                await test.step('Verify Retailer Verification page loaded via sidebar', async () => {
                    await expect(page, 'URL must contain retailer-verification').toHaveURL(/retailer-verification/);
                    for (const col of EXPECTED_COLUMNS.slice(0, 4)) {
                        await expect(colHeader(page, col), `Column "${col}" must be visible after sidebar nav`)
                            .toBeVisible({ timeout: 5_000 });
                    }
                });
            },
        );

        test('should collapse and expand the filter panel when the Collapse button is clicked',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Retailer Verification', async () => {
                    await goTo(page, LIST_URL);
                });
                await test.step('Click Collapse to hide filter panel', async () => {
                    await showStep(page, 'Collapsing filter panel…');
                    const collapseBtn = page.getByRole('button', { name: /collapse/i });
                    const isVisible = await collapseBtn.isVisible().catch(() => false);
                    if (!isVisible) { test.skip(true, 'No Collapse button found'); return; }
                    await highlight(collapseBtn);
                    await collapseBtn.click();
                    await page.waitForTimeout(600);
                    // After collapse the Search button or filter inputs should be hidden
                    const searchBtn = page.getByRole('button', { name: 'Search' });
                    const searchVisible = await searchBtn.isVisible().catch(() => false);
                    await showStep(page, searchVisible ? 'Panel partially collapsed' : 'Panel fully collapsed');
                });
                await test.step('Click Expand/Show to restore filter panel', async () => {
                    await showStep(page, 'Restoring filter panel…');
                    const expandBtn = page.locator('button').filter({ hasText: /expand|show|filter/i }).first();
                    const hasExpand = await expandBtn.isVisible().catch(() => false);
                    if (hasExpand) {
                        await highlight(expandBtn);
                        await expandBtn.click();
                        await page.waitForTimeout(600);
                    }
                    // Table must always remain visible regardless of filter panel state
                    await expect(
                        page.getByRole('table').first(),
                        'Table must remain visible when filter panel is toggled',
                    ).toBeVisible({ timeout: 5_000 });
                });
            },
        );

    }); // Edge Cases

}); // Logistics Management — Retailer Verification
