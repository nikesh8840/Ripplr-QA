/**
 * Brand — E2E Test Suite (Onboarding > Brand)
 *
 * Run all    :  npx playwright test tests/onboarding/create-brand.spec.js --headed
 * Run one    :  npx playwright test tests/onboarding/create-brand.spec.js --headed -g "should create"
 * Run smoke  :  npx playwright test tests/onboarding/create-brand.spec.js --headed --grep @smoke
 * Run regr.  :  npx playwright test tests/onboarding/create-brand.spec.js --headed --grep @regression
 *
 * Auth: login once in beforeAll → session saved to .auth/brand-state.json → reused per test
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

// ── Constants ─────────────────────────────────────────────────────────────────
const BASE_URL  = config.baseURLpreprod.replace(/\/login\/?$/, '');
const LIST_URL  = `${BASE_URL}/onboarding/brand`;
const ADD_URL   = `${BASE_URL}/onboarding/brand/add`;
const AUTH_FILE = path.join(__dirname, '../../.auth/brand-state.json');

// Client option confirmed available in preprod
const TEST_CLIENT = 'Intelligent Retail Pvt Ltd';

// Generate a 3-letter alphabetic suffix unique per test run.
// Brand Name: only alphabets allowed (no underscores/numbers/specials).
// Brand Code: alphanumeric, max ~6 chars (validated by the form).
const TS     = Date.now();
const ALPHA  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SFX    = ALPHA[TS % 26] + ALPHA[Math.floor(TS / 26) % 26] + ALPHA[Math.floor(TS / 676) % 26];

const TEST_BRAND_NAME = `AutoBrand${SFX}`;   // e.g. "AutoBrandXCB" — letters only ✓
const TEST_BRAND_CODE = `AT${SFX}`;          // e.g. "ATXCB"        — ≤6 chars, letters only ✓

// Brand list has no checkbox selection column.
// Visible column order: Name | Code | Created At | Actions
const COL = { NAME: 0, CODE: 1, CREATED_AT: 2, ACTIONS: 3 };

const EXPECTED_COLUMNS = ['Name', 'Code', 'Created At', 'Actions'];

// ── Auth bootstrap ─────────────────────────────────────────────────────────────
fs.mkdirSync(path.join(__dirname, '../../.auth'), { recursive: true });
fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));

// ── Visual debug helpers ───────────────────────────────────────────────────────

async function highlight(locator) {
    try {
        // Short timeout so highlight never blocks the test for 30 s when element is absent
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
    } catch { /* element may have unmounted or not yet appeared */ }
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
    // Use domcontentloaded (faster than 'load') with an explicit 45 s cap
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

// Returns the column header locator without exact-match so AntD sort icons don't break the lookup.
function colHeader(page, name) {
    return page.locator('thead th').filter({ hasText: name });
}

async function selectClientDropdown(page, clientName) {
    // Click the AntD select wrapper that contains the client search input
    const wrapper = page.locator('.ant-select').filter({ has: page.locator('#client_id') });
    await wrapper.click();
    await page.waitForTimeout(400);
    await page.keyboard.type(clientName.slice(0, 5));
    await page.waitForTimeout(500);
    const items = page.locator(
        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content',
    );
    await items.first().waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    const target = items.filter({ hasText: new RegExp(clientName, 'i') });
    if (await target.count() > 0) {
        await target.first().evaluate(el => el.closest('.ant-select-item').click());
    } else {
        await items.first().evaluate(el => el.closest('.ant-select-item').click());
    }
    await page.waitForTimeout(300);
}

// ── Suite ──────────────────────────────────────────────────────────────────────

test.describe('Onboarding — Brand', () => {

    // Serial mode: one worker → beforeAll runs exactly once.
    // 180 s timeout for every hook and test in this describe (network can be slow on preprod).
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async ({ browser }) => {
        fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
        const ctx  = await browser.newContext();
        const page = await ctx.newPage();
        await page.goto(config.baseURLpreprod, { waitUntil: 'load', timeout: 90_000 });
        await new LoginPage(page).login(config.credentials.username, config.credentials.password);
        // Wait for the sidebar menu — confirms we're on the dashboard and session is active.
        await page.waitForSelector('.ant-menu-item', { timeout: 30_000 }).catch(() => {});
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
        await page.waitForTimeout(500);
        await ctx.storageState({ path: AUTH_FILE });
        await ctx.close();
    });

    test.use({ storageState: AUTH_FILE });

    // ── 1 · Page Load ─────────────────────────────────────────────────────────

    test.describe('Page Load', () => {

        test('should display all required columns when the Brand list page loads',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Brand list', async () => {
                    await showStep(page, 'Navigating to Onboarding > Brand…');
                    await goTo(page, LIST_URL);
                });
                await test.step('Verify all column headers are visible', async () => {
                    await showStep(page, 'Checking all column headers…');
                    for (const col of EXPECTED_COLUMNS) {
                        // Use text-filter locator — avoids AntD sort-icon text breaking exact match
                        const header = colHeader(page, col);
                        await highlight(header);
                        await expect(header, `Column "${col}" must be visible`).toBeVisible({ timeout: 8_000 });
                    }
                });
                await test.step('Verify at least one data row is present', async () => {
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'Brand list must have at least one row').toBeVisible({ timeout: 8_000 });
                    expect(await rows.count(), 'At least one brand must exist').toBeGreaterThan(0);
                });
            },
        );

        test('should display the "+ Add Brand" button on the Brand list page',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Brand list', async () => {
                    await goTo(page, LIST_URL);
                });
                await test.step('Verify "+ Add Brand" button is visible and enabled', async () => {
                    const addBtn = page.getByRole('button', { name: /add brand/i });
                    await highlight(addBtn);
                    await expect(addBtn, '"Add Brand" button must be visible').toBeVisible();
                    await expect(addBtn, '"Add Brand" button must be enabled').toBeEnabled();
                });
            },
        );

    }); // Page Load

    // ── 2 · Action Buttons ────────────────────────────────────────────────────

    test.describe('Action Buttons', () => {

        test('should navigate to the Add Brand form when "+ Add Brand" is clicked',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Brand list', async () => {
                    await showStep(page, 'Navigating to Brand list…');
                    await goTo(page, LIST_URL);
                });
                await test.step('Click "+ Add Brand" and verify navigation', async () => {
                    const addBtn = page.getByRole('button', { name: /add brand/i });
                    await highlight(addBtn);
                    await addBtn.click();
                    await page.waitForURL(/\/onboarding\/brand\/add/, { timeout: 10_000 });
                    await expect(page, 'URL must contain /onboarding/brand/add').toHaveURL(/\/onboarding\/brand\/add/);
                });
                await test.step('Verify "Add Brand Details" heading is present', async () => {
                    const heading = page.getByText('Add Brand Details');
                    await expect(heading, '"Add Brand Details" heading must be visible').toBeVisible();
                });
            },
        );

    }); // Action Buttons

    // ── 3 · Filters ───────────────────────────────────────────────────────────

    test.describe('Filters', () => {

        test('should return matching brands when a brand name is typed in the Search By filter',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                let seedName = '';
                await test.step('Seed: extract a brand name from the first row', async () => {
                    await showStep(page, 'Seeding — extracting an existing brand name…');
                    await goTo(page, LIST_URL);
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'Must have at least one brand to seed from').toBeVisible({ timeout: 8_000 });
                    // Wait for cell to have content — API response may arrive after networkidle
                    const nameCell = rows.first().locator('td').nth(COL.NAME);
                    await expect(nameCell, 'Name cell must have content').not.toBeEmpty({ timeout: 8_000 });
                    seedName = ((await nameCell.textContent()) ?? '').trim();
                    expect(seedName.length, 'Seed brand name must not be empty').toBeGreaterThan(0);
                    await showStep(page, `Seeded brand name: "${seedName}"`);
                });
                await test.step('Type the seed name into the Search By filter', async () => {
                    await showStep(page, `Typing "${seedName}" into Search By filter…`);
                    const searchCombo = page.locator('.ant-select').first();
                    await highlight(searchCombo);
                    await searchCombo.click();
                    await page.waitForTimeout(400);
                    await page.keyboard.type(seedName, { delay: 100 });
                    await page.waitForTimeout(500);
                    const opts = page.locator(
                        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content',
                    );
                    if (await opts.count() > 0) {
                        await opts.filter({ hasText: seedName }).first()
                            .evaluate(el => el.closest('.ant-select-item').click()).catch(async () => {
                                await opts.first().evaluate(el => el.closest('.ant-select-item').click());
                            });
                        await page.waitForTimeout(300);
                    }
                });
                await test.step('Click Search and verify results contain the searched brand', async () => {
                    await clickSearch(page);
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'Result must not show "No Data"').not.toContainText('No Data', { timeout: 8_000 });
                    expect(await rows.count(), 'At least one result row expected').toBeGreaterThan(0);
                    await expect(rows.first().locator('td').nth(COL.NAME),
                        `First result must contain "${seedName}"`).toContainText(seedName);
                });
            },
        );

    }); // Filters

    // ── 4 · Pagination ────────────────────────────────────────────────────────

    test.describe('Pagination', () => {

        test('should load different brands on next page and return to page 1 on previous',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Brand list', async () => {
                    await showStep(page, 'Navigating to Brand list for pagination test…');
                    await goTo(page, LIST_URL);
                });
                let firstPageBrandName = '';
                await test.step('Capture page-1 first brand name and navigate to page 2', async () => {
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'First page must have rows').toBeVisible({ timeout: 8_000 });
                    const firstNameCell = rows.first().locator('td').nth(COL.NAME);
                    await expect(firstNameCell, 'Name cell must have content').not.toBeEmpty({ timeout: 8_000 });
                    firstPageBrandName = ((await firstNameCell.textContent()) ?? '').trim();

                    const nextBtn = page.locator('li[title="Next Page"] button, button[aria-label="right"]').first();
                    const isDisabled = await nextBtn.isDisabled().catch(() => true);
                    if (isDisabled) {
                        test.skip(true, 'Only one page of brands — next button is disabled');
                        return;
                    }
                    await highlight(nextBtn);
                    await nextBtn.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(600);

                    const page2Name = ((await rows.first().locator('td').nth(COL.NAME).textContent()) ?? '').trim();
                    expect(page2Name, 'Page 2 must show different brands than page 1').not.toBe(firstPageBrandName);
                });
                await test.step('Navigate back to page 1 and verify page 1 indicator is active', async () => {
                    const prevBtn = page.locator('li[title="Previous Page"] button, button[aria-label="left"]').first();
                    await highlight(prevBtn);
                    await prevBtn.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(500);

                    // Verify pagination shows page 1 as active — don't compare row text
                    // because insertion of new brands during testing can shift sort order
                    const activePager = page.locator('.ant-pagination-item-active');
                    await expect(activePager, 'Page 1 active indicator must be visible').toBeVisible({ timeout: 5_000 });
                    const activePageNum = ((await activePager.textContent()) ?? '').trim();
                    expect(activePageNum, 'Active page must be "1"').toBe('1');

                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'Table must show rows on page 1').toBeVisible();
                });
            },
        );

        test('should update the row count when the page size selector is changed',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Brand list', async () => {
                    await goTo(page, LIST_URL);
                    // Wait for table + pagination to fully render
                    await expect(page.locator('table tbody tr').first(), 'Rows must load').toBeVisible({ timeout: 8_000 });
                });
                await test.step('Change page size and verify row count changes', async () => {
                    // AntD pagination page-size selector is the last .ant-select in .ant-pagination
                    const pageSizeSelector = page.locator('.ant-pagination .ant-select').last();
                    const isVisible = await pageSizeSelector.isVisible({ timeout: 3_000 }).catch(() => false);
                    if (!isVisible) {
                        test.skip(true, 'No page-size selector found on Brand list page');
                        return;
                    }
                    const rowsBefore = await page.locator('table tbody tr').count();
                    await highlight(pageSizeSelector);
                    await pageSizeSelector.click();
                    await page.waitForTimeout(400);

                    const sizeOptions = page.locator(
                        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content',
                    );
                    const optCount = await sizeOptions.count();
                    if (optCount < 2) { await page.keyboard.press('Escape'); return; }
                    const secondOption = ((await sizeOptions.nth(1).textContent()) ?? '').trim();
                    await sizeOptions.nth(1).evaluate(el => el.closest('.ant-select-item').click());
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(600);

                    const rowsAfter = await page.locator('table tbody tr').count();
                    await showStep(page, `Page size changed: ${rowsBefore} → ${rowsAfter} rows (selected: ${secondOption})`);
                    expect(rowsAfter, 'Row count must change after page-size change').not.toBe(rowsBefore);
                });
            },
        );

    }); // Pagination

    // ── 5 · Detail Navigation ─────────────────────────────────────────────────

    test.describe('Detail Navigation', () => {

        test('should open the brand view page when the eye icon is clicked on a row',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Brand list', async () => {
                    await showStep(page, 'Navigating to Brand list…');
                    await goTo(page, LIST_URL);
                });
                await test.step('Click the eye icon on the first brand row', async () => {
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'At least one brand row must exist').toBeVisible({ timeout: 8_000 });
                    const eyeIcon = rows.first().locator('td').nth(COL.ACTIONS).locator('img, svg, .anticon').first();
                    await highlight(eyeIcon);
                    await eyeIcon.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(800);
                });
                await test.step('Verify URL changed to brand detail/view page', async () => {
                    await expect(page, 'URL must navigate away from list').not.toHaveURL(/\/onboarding\/brand(\?|$)/);
                    await showStep(page, `Navigated to: ${page.url()}`);
                });
            },
        );

        test('should open the brand edit form when the edit (pencil) icon is clicked',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Brand list', async () => {
                    await showStep(page, 'Navigating to Brand list…');
                    await goTo(page, LIST_URL);
                });
                let firstBrandName = '';
                await test.step('Capture first brand name and click edit icon', async () => {
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'At least one brand row must exist').toBeVisible({ timeout: 8_000 });
                    const nameCell = rows.first().locator('td').nth(COL.NAME);
                    await expect(nameCell, 'Name cell must have content').not.toBeEmpty({ timeout: 8_000 });
                    firstBrandName = ((await nameCell.textContent()) ?? '').trim();
                    const actionCell = rows.first().locator('td').nth(COL.ACTIONS);
                    const icons = actionCell.locator('img, svg, .anticon, a');
                    const iconCount = await icons.count();
                    await highlight(icons.nth(iconCount - 1));
                    await icons.nth(iconCount - 1).click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(800);
                });
                await test.step('Verify URL is the brand edit page and brand name is pre-filled', async () => {
                    await expect(page, 'URL must contain /edit').toHaveURL(/\/edit/);
                    const nameInput = page.locator('#name, input[name="name"]');
                    await expect(nameInput, 'Brand Name must be pre-filled on edit page').toHaveValue(firstBrandName);
                });
            },
        );

    }); // Detail Navigation

    // ── 6 · Create Brand ──────────────────────────────────────────────────────

    test.describe('Create Brand', () => {

        test('should successfully create a new brand with all required fields filled',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(120_000);
                await test.step('Navigate to Add Brand form', async () => {
                    await showStep(page, `Navigating to Add Brand form… (Name: ${TEST_BRAND_NAME})`);
                    await goTo(page, ADD_URL);
                    await expect(page.getByText('Add Brand Details'), '"Add Brand Details" must be visible').toBeVisible();
                });
                await test.step('Fill in Brand Name', async () => {
                    await showStep(page, `Filling Brand Name: "${TEST_BRAND_NAME}"`);
                    const nameInput = page.locator('#name, input[name="name"]');
                    await highlight(nameInput);
                    await nameInput.click();
                    await nameInput.pressSequentially(TEST_BRAND_NAME, { delay: 80 });
                    await expect(nameInput, `Brand Name must be "${TEST_BRAND_NAME}"`).toHaveValue(TEST_BRAND_NAME);
                });
                await test.step('Fill in Brand Code', async () => {
                    await showStep(page, `Filling Brand Code: "${TEST_BRAND_CODE}"`);
                    const codeInput = page.locator('#code, input[name="code"]');
                    await highlight(codeInput);
                    await codeInput.click();
                    await codeInput.pressSequentially(TEST_BRAND_CODE, { delay: 80 });
                    await expect(codeInput, `Brand Code must be "${TEST_BRAND_CODE}"`).toHaveValue(TEST_BRAND_CODE);
                });
                await test.step(`Select Client: "${TEST_CLIENT}"`, async () => {
                    await showStep(page, `Selecting Client: "${TEST_CLIENT}"`);
                    await selectClientDropdown(page, TEST_CLIENT);
                    const clientDisplay = page.locator('.ant-select-selection-item');
                    await expect(clientDisplay.first(), `Client must show "${TEST_CLIENT}"`).toContainText(TEST_CLIENT, { timeout: 5_000 });
                });
                await test.step('Click Add and verify success', async () => {
                    await showStep(page, 'Clicking Add…');
                    const addBtn = page.getByRole('button', { name: /^add$/i });
                    await expect(addBtn, '"Add" button must be visible').toBeVisible();
                    await expect(addBtn, '"Add" button must be enabled').toBeEnabled({ timeout: 5_000 });
                    await highlight(addBtn);
                    await addBtn.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(800);

                    const redirectedToList = page.url().includes('/onboarding/brand') && !page.url().includes('/add');
                    const successMsg = page.locator('.ant-message-notice, .ant-notification-notice');
                    const successVisible = await successMsg.first().isVisible().catch(() => false);

                    expect(
                        redirectedToList || successVisible,
                        'After creating brand: must redirect to list or show success notification',
                    ).toBe(true);
                    await showStep(page, `Brand created ✅  Name: ${TEST_BRAND_NAME}, Code: ${TEST_BRAND_CODE}`);
                });
            },
        );

        test('should show the newly created brand in the Brand list after creation',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(120_000);
                // Use a distinct suffix so this brand doesn't conflict with the first create test
                const SFX2       = ALPHA[(TS + 1) % 26] + ALPHA[Math.floor((TS + 1) / 26) % 26] + ALPHA[Math.floor((TS + 1) / 676) % 26];
                const verifyName = `AutoBrandV${SFX2}`;  // letters only
                const verifyCode = `ATV${SFX2}`;         // ≤6 chars, letters only

                await test.step('Navigate to Add Brand form', async () => {
                    await showStep(page, 'Creating a brand to verify it appears in list…');
                    await goTo(page, ADD_URL);
                });
                await test.step('Fill all fields and submit', async () => {
                    await page.locator('#name, input[name="name"]').click();
                    await page.locator('#name, input[name="name"]').pressSequentially(verifyName, { delay: 80 });
                    await page.locator('#code, input[name="code"]').click();
                    await page.locator('#code, input[name="code"]').pressSequentially(verifyCode, { delay: 80 });
                    await selectClientDropdown(page, TEST_CLIENT);
                    const addBtn = page.getByRole('button', { name: /^add$/i });
                    await expect(addBtn, '"Add" must be enabled before submitting').toBeEnabled({ timeout: 5_000 });
                    await addBtn.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(1000);
                });
                await test.step('Navigate to Brand list and search for the new brand', async () => {
                    await goTo(page, LIST_URL);
                    const searchCombo = page.locator('.ant-select').first();
                    await searchCombo.click();
                    await page.waitForTimeout(300);
                    await page.keyboard.type(verifyName, { delay: 100 });
                    await page.waitForTimeout(500);
                    const opts = page.locator(
                        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content',
                    );
                    if (await opts.count() > 0) {
                        await opts.first().evaluate(el => el.closest('.ant-select-item').click());
                        await page.waitForTimeout(300);
                    }
                    await clickSearch(page);
                });
                await test.step('Verify the new brand appears in the results', async () => {
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'New brand must appear in list').not.toContainText('No Data', { timeout: 10_000 });
                    await highlight(rows.first().locator('td').nth(COL.NAME));
                    await expect(rows.first().locator('td').nth(COL.NAME),
                        `Brand Name must be "${verifyName}"`).toContainText(verifyName);
                    await expect(rows.first().locator('td').nth(COL.CODE),
                        `Brand Code must be "${verifyCode}"`).toContainText(verifyCode);
                });
            },
        );

    }); // Create Brand

    // ── 7 · Negative Scenarios ────────────────────────────────────────────────

    test.describe('Negative Scenarios', () => {

        test('should keep the Add button disabled when the form is completely empty',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Add Brand form', async () => {
                    await showStep(page, 'Navigating to empty Add Brand form…');
                    await goTo(page, ADD_URL);
                });
                await test.step('Verify Add button is disabled before any input', async () => {
                    const addBtn = page.getByRole('button', { name: /^add$/i });
                    await highlight(addBtn);
                    await expect(addBtn, '"Add" button must be disabled on empty form').toBeDisabled();
                });
            },
        );

        test('should show a validation error when Brand Name is missing on submit',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Add Brand form', async () => {
                    await goTo(page, ADD_URL);
                });
                await test.step('Fill Brand Code and Client but leave Brand Name empty', async () => {
                    await showStep(page, 'Filling Code + Client only — leaving Brand Name empty…');
                    // Use a short valid code: ≤6 alpha chars
                    await page.locator('#code, input[name="code"]').click();
                    await page.locator('#code, input[name="code"]').pressSequentially('TST', { delay: 80 });
                    await selectClientDropdown(page, TEST_CLIENT);
                });
                await test.step('Click Brand Name and blur without typing to trigger validation', async () => {
                    const nameInput = page.locator('#name, input[name="name"]');
                    await nameInput.click();
                    await page.keyboard.press('Tab');
                    await page.waitForTimeout(400);
                    const error = page.locator('.ant-form-item-explain-error').first();
                    await expect(error, 'Validation error for Brand Name must appear').toBeVisible({ timeout: 5_000 });
                });
                await test.step('Verify Add button remains disabled', async () => {
                    const addBtn = page.getByRole('button', { name: /^add$/i });
                    await expect(addBtn, '"Add" must remain disabled without Brand Name').toBeDisabled();
                });
            },
        );

        test('should show a validation error when Brand Code is missing on submit',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Add Brand form', async () => {
                    await goTo(page, ADD_URL);
                });
                await test.step('Fill Brand Name and Client but leave Brand Code empty', async () => {
                    await showStep(page, 'Filling Name + Client only — leaving Brand Code empty…');
                    await page.locator('#name, input[name="name"]').click();
                    await page.locator('#name, input[name="name"]').pressSequentially('NoCodeBrand', { delay: 80 });
                    await selectClientDropdown(page, TEST_CLIENT);
                });
                await test.step('Click Brand Code and blur without typing to trigger validation', async () => {
                    const codeInput = page.locator('#code, input[name="code"]');
                    await codeInput.click();
                    await page.keyboard.press('Tab');
                    await page.waitForTimeout(400);
                    const error = page.locator('.ant-form-item-explain-error').first();
                    await expect(error, 'Validation error for Brand Code must appear').toBeVisible({ timeout: 5_000 });
                });
                await test.step('Verify Add button remains disabled', async () => {
                    const addBtn = page.getByRole('button', { name: /^add$/i });
                    await expect(addBtn, '"Add" must remain disabled without Brand Code').toBeDisabled();
                });
            },
        );

        test('should show a validation error when Client is not selected on submit',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Add Brand form', async () => {
                    await goTo(page, ADD_URL);
                });
                await test.step('Fill Brand Name and Brand Code but leave Client unselected', async () => {
                    await showStep(page, 'Filling Name + Code only — leaving Client empty…');
                    await page.locator('#name, input[name="name"]').click();
                    await page.locator('#name, input[name="name"]').pressSequentially('NoClientBrand', { delay: 80 });
                    await page.locator('#code, input[name="code"]').click();
                    await page.locator('#code, input[name="code"]').pressSequentially('TCL', { delay: 80 });
                });
                await test.step('Click Client dropdown and tab away to trigger validation', async () => {
                    const clientWrapper = page.locator('.ant-select').filter({ has: page.locator('#client_id') });
                    await clientWrapper.click();
                    await page.waitForTimeout(400);
                    // Tab triggers blur on AntD Select (Escape does not fire blur)
                    await page.keyboard.press('Tab');
                    await page.waitForTimeout(400);
                    const error = page.locator('.ant-form-item-explain-error').first();
                    await expect(error, 'Validation error for Client must appear').toBeVisible({ timeout: 5_000 });
                });
                await test.step('Verify Add button remains disabled', async () => {
                    const addBtn = page.getByRole('button', { name: /^add$/i });
                    await expect(addBtn, '"Add" must remain disabled without Client').toBeDisabled();
                });
            },
        );

        test('should show an error when a Brand Code that already exists is submitted',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                let existingCode = '';
                await test.step('Seed: extract an existing brand code from the list', async () => {
                    await showStep(page, 'Seeding — extracting an existing brand code…');
                    await goTo(page, LIST_URL);
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'Must have brands to seed from').toBeVisible({ timeout: 8_000 });
                    // Wait for cell content — API response may arrive after networkidle
                    const codeCell = rows.first().locator('td').nth(COL.CODE);
                    await expect(codeCell, 'Code cell must have content').not.toBeEmpty({ timeout: 8_000 });
                    existingCode = ((await codeCell.textContent()) ?? '').trim();
                    expect(existingCode.length, 'Seeded code must not be empty').toBeGreaterThan(0);
                    await showStep(page, `Using existing code: "${existingCode}"`);
                });
                await test.step('Navigate to Add Brand form and fill with the duplicate code', async () => {
                    await goTo(page, ADD_URL);
                    // Brand Name: letters only, unique
                    await page.locator('#name, input[name="name"]').click();
                    await page.locator('#name, input[name="name"]').pressSequentially(`DupCode${SFX}`, { delay: 80 });
                    await page.locator('#code, input[name="code"]').click();
                    await page.locator('#code, input[name="code"]').pressSequentially(existingCode, { delay: 80 });
                    await selectClientDropdown(page, TEST_CLIENT);
                });
                await test.step('Submit and verify an error message appears', async () => {
                    const addBtn = page.getByRole('button', { name: /^add$/i });
                    if (await addBtn.isEnabled({ timeout: 3_000 }).catch(() => false)) {
                        await highlight(addBtn);
                        await addBtn.click();
                        await page.waitForLoadState('networkidle').catch(() => {});
                        await page.waitForTimeout(800);
                        const errorFeedback = page.locator(
                            '.ant-message-error, .ant-notification-error, .ant-form-item-explain-error',
                        );
                        await expect(errorFeedback.first(),
                            'An error must appear for duplicate Brand Code').toBeVisible({ timeout: 8_000 });
                        await expect(page,
                            'Must stay on Add Brand form after duplicate error').toHaveURL(/\/onboarding\/brand\/add/);
                    } else {
                        await expect(addBtn,
                            '"Add" must remain disabled for duplicate input').toBeDisabled();
                    }
                });
            },
        );

    }); // Negative Scenarios

    // ── 8 · Edge Cases ────────────────────────────────────────────────────────

    test.describe('Edge Cases', () => {

        test('should load the Add Brand form correctly when navigated to directly via URL',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate directly to the Add Brand URL', async () => {
                    await showStep(page, 'Navigating directly to Add Brand URL…');
                    await goTo(page, ADD_URL);
                    await expect(page, 'URL must be the add form URL').toHaveURL(/\/onboarding\/brand\/add/);
                });
                await test.step('Verify all required form fields are visible', async () => {
                    await expect(page.locator('#name, input[name="name"]'), 'Brand Name input must be visible').toBeVisible();
                    await expect(page.locator('#code, input[name="code"]'), 'Brand Code input must be visible').toBeVisible();
                    await expect(page.locator('#client_id'), 'Client input must be visible').toBeVisible();
                    await expect(page.getByRole('button', { name: /^add$/i }), '"Add" button must be visible').toBeVisible();
                });
            },
        );

        test('should show the form still accessible after a page reload on the Add Brand page',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Add Brand form', async () => {
                    await showStep(page, 'Navigating to Add Brand form before reload…');
                    await goTo(page, ADD_URL);
                    await expect(page.locator('#name, input[name="name"]'), 'Name input must load').toBeVisible({ timeout: 8_000 });
                });
                await test.step('Hard-reload the page', async () => {
                    await page.reload();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(500);
                });
                await test.step('Verify the form is still accessible after reload', async () => {
                    await expect(page, 'Must remain on Add Brand form after reload').toHaveURL(/\/onboarding\/brand\/add/);
                    await expect(page.locator('#name, input[name="name"]'),
                        'Brand Name input must still be visible after reload').toBeVisible({ timeout: 8_000 });
                    await expect(page.getByRole('button', { name: /^add$/i }),
                        '"Add" button must still be visible after reload').toBeVisible();
                });
            },
        );

        test('should stay on the Brand list page after a hard reload',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Brand list', async () => {
                    await goTo(page, LIST_URL);
                });
                await test.step('Reload the page', async () => {
                    await page.reload();
                    await page.waitForLoadState('networkidle').catch(() => {});
                });
                await test.step('Verify the list still renders with table and buttons', async () => {
                    await expect(page.getByRole('button', { name: 'Search' }),
                        '"Search" button must be visible after reload').toBeVisible({ timeout: 8_000 });
                    await expect(page.getByRole('button', { name: /add brand/i }),
                        '"Add Brand" button must be visible after reload').toBeVisible();
                    await expect(page.locator('table tbody tr').first(),
                        'Brand table must have rows after reload').toBeVisible({ timeout: 8_000 });
                });
            },
        );

        test('should allow Onboarding > Brand navigation via the sidebar menu',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Start from Dashboard and use sidebar to reach Brand list', async () => {
                    await showStep(page, 'Navigating via sidebar: Dashboard → Onboarding → Brand…');
                    await goTo(page, `${BASE_URL}/dashboard`);
                    await page.getByRole('menuitem', { name: 'Onboarding' }).click();
                    await page.waitForTimeout(500);
                    await page.getByRole('link', { name: /^Brand$/i }).click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(500);
                });
                await test.step('Verify Brand list page loaded via sidebar navigation', async () => {
                    await expect(page, 'URL must contain /onboarding/brand').toHaveURL(/\/onboarding\/brand/);
                    // Use text-filter locator — avoids AntD sort-icon text breaking exact match
                    for (const col of EXPECTED_COLUMNS) {
                        await expect(colHeader(page, col),
                            `Column "${col}" must be visible after sidebar navigation`).toBeVisible({ timeout: 5_000 });
                    }
                });
            },
        );

    }); // Edge Cases

}); // Onboarding — Brand
