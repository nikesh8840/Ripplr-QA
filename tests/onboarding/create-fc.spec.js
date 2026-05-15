/**
 * Fulfillment Center (FC) — E2E Test Suite (Onboarding > FC)
 *
 * Run all    :  npx playwright test tests/onboarding/create-fc.spec.js --headed
 * Run one    :  npx playwright test tests/onboarding/create-fc.spec.js --headed -g "should create"
 * Run smoke  :  npx playwright test tests/onboarding/create-fc.spec.js --headed --grep @smoke
 * Run regr.  :  npx playwright test tests/onboarding/create-fc.spec.js --headed --grep @regression
 *
 * Auth: login once in beforeAll → session saved to .auth/fc-state.json → reused per test
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

// ── Constants ─────────────────────────────────────────────────────────────────
const BASE_URL  = config.baseURLpreprod.replace(/\/login\/?$/, '');
const LIST_URL  = `${BASE_URL}/onboarding/fc`;
const ADD_URL   = `${BASE_URL}/onboarding/fc/add`;
const AUTH_FILE = path.join(__dirname, '../../.auth/fc-state.json');

// Unique 3-letter suffix per run (derived from timestamp) — keeps name/code unique
const TS    = Date.now();
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SFX   = ALPHA[TS % 26] + ALPHA[Math.floor(TS / 26) % 26] + ALPHA[Math.floor(TS / 676) % 26];

// Test data for create tests
const TEST_FC_NAME  = `AutoFC${SFX}`;      // e.g. "AutoFCXCB"
const TEST_FC_CODE  = `F${SFX}`;           // e.g. "FXCB"   — 4 chars (field max is 4)
const TEST_LAT      = '12.9165';
const TEST_LNG      = '77.6101';
const TEST_RADIUS   = '5';
const TEST_ADDRESS  = 'BTM Layout 2nd Stage';
const TEST_GST      = '29AABCU9603R1ZX';   // 15-char GSTIN format
const TEST_CLIENT   = 'Intelligent Retail Pvt Ltd';

// FC list columns — no hidden checkbox column on this page
// Visible order: Name | Code | Brands | Latitude | Longitude | Created At | (edit icon)
const COL = { NAME: 0, CODE: 1, BRANDS: 2, LAT: 3, LNG: 4, CREATED_AT: 5, ACTIONS: 6 };

const EXPECTED_COLUMNS = ['Name', 'Code', 'Brands', 'Latitude', 'Longitude', 'Created At'];

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

// Returns the first matching column header (AntD may duplicate thead for sticky tables)
function colHeader(page, name) {
    return page.locator('thead th').filter({ hasText: name }).first();
}

// Picks the first option from an open AntD dropdown and returns its text
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

// Selects the Pincode field (AntD Select) and picks the first available pincode
async function selectPincodeDropdown(page) {
    const wrapper = page.locator('.ant-select').filter({ has: page.locator('#pincode_id') });
    await wrapper.click();
    await page.waitForTimeout(500);
    const items = page.locator(
        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content',
    );
    await items.first().waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    const pincode = ((await items.first().textContent()) ?? '').trim();
    await items.first().evaluate(el => el.closest('.ant-select-item').click());
    await page.waitForTimeout(300);
    return pincode;
}

// Selects the Client field (AntD Select) with type-to-search
async function selectClientFC(page, clientName) {
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

// Selects the Brand field (AntD Select) — picks the first available brand
async function selectFirstBrand(page) {
    const wrapper = page.locator('.ant-select').filter({ has: page.locator('[id^="brands"]') });
    await wrapper.first().click();
    await page.waitForTimeout(500);
    const items = page.locator(
        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content',
    );
    await items.first().waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    const brand = ((await items.first().textContent()) ?? '').trim();
    await items.first().evaluate(el => el.closest('.ant-select-item').click());
    await page.waitForTimeout(300);
    return brand;
}

// Fills all required form fields for Add FC. Skips a field when its value is null.
async function fillFCForm(page, opts = {}) {
    const name   = 'name'   in opts ? opts.name   : TEST_FC_NAME;
    const code   = 'code'   in opts ? opts.code   : TEST_FC_CODE;
    const lat    = 'lat'    in opts ? opts.lat    : TEST_LAT;
    const lng    = 'lng'    in opts ? opts.lng    : TEST_LNG;
    const radius = 'radius' in opts ? opts.radius : TEST_RADIUS;
    const addr   = 'addr'   in opts ? opts.addr   : TEST_ADDRESS;
    const gst    = 'gst'    in opts ? opts.gst    : TEST_GST;
    const client = 'client' in opts ? opts.client : TEST_CLIENT;

    if (name   !== null) await page.locator('#name').pressSequentially(name, { delay: 80 });
    if (code   !== null) await page.locator('#code').pressSequentially(code, { delay: 80 });
    if (lat    !== null) await page.locator('#latitude').pressSequentially(lat, { delay: 80 });
    if (lng    !== null) await page.locator('#longitude').pressSequentially(lng, { delay: 80 });
    if (radius !== null) await page.locator('#proximityRadius').pressSequentially(radius, { delay: 80 });
    if (addr   !== null) await page.locator('#address').pressSequentially(addr, { delay: 80 });
    if (gst    !== null) await page.locator('#gst_number').pressSequentially(gst, { delay: 80 });
    if (client !== null) await selectClientFC(page, client);
    await selectPincodeDropdown(page);
    await selectFirstBrand(page);
}

// ── Suite ──────────────────────────────────────────────────────────────────────

test.describe('Onboarding — FC', () => {

    // Serial mode: one worker → beforeAll runs exactly once
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async ({ browser }) => {
        fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
        const ctx  = await browser.newContext();
        const page = await ctx.newPage();
        // Navigate to login — ignore the load event (external resources can hang indefinitely)
        await page.goto(config.baseURLpreprod, { waitUntil: 'commit', timeout: 60_000 }).catch(() => {});
        // Wait for the login form inputs to be interactive (React render complete)
        await page.waitForSelector('input', { timeout: 90_000 });
        await page.waitForTimeout(800);
        await new LoginPage(page).login(config.credentials.username, config.credentials.password);
        // Wait for sidebar menu — confirms login redirect completed and session is active
        await page.waitForSelector('.ant-menu-item', { timeout: 30_000 }).catch(() => {});
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
        await page.waitForTimeout(500);
        await ctx.storageState({ path: AUTH_FILE });
        await ctx.close();
    });

    test.use({ storageState: AUTH_FILE });

    // ── 1 · Page Load ─────────────────────────────────────────────────────────

    test.describe('Page Load', () => {

        test('should display all required columns when the FC list page loads',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(60_000);
                await test.step('Navigate to FC list', async () => {
                    await showStep(page, 'Navigating to Onboarding > FC…');
                    await goTo(page, LIST_URL);
                });
                await test.step('Verify all column headers are visible', async () => {
                    await showStep(page, 'Checking column headers…');
                    for (const col of EXPECTED_COLUMNS) {
                        const header = colHeader(page, col);
                        await highlight(header);
                        await expect(header, `Column "${col}" must be visible`).toBeVisible({ timeout: 8_000 });
                    }
                });
                await test.step('Verify at least one data row is present', async () => {
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'At least one FC row must exist').toBeVisible({ timeout: 8_000 });
                    expect(await rows.count(), 'Row count must be > 0').toBeGreaterThan(0);
                });
            },
        );

        test('should display the "+ Add FC" button on the FC list page',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(60_000);
                await test.step('Navigate to FC list', async () => {
                    await goTo(page, LIST_URL);
                });
                await test.step('Verify "+ Add FC" button is visible and enabled', async () => {
                    const addBtn = page.getByRole('button', { name: /add fc/i });
                    await highlight(addBtn);
                    await expect(addBtn, '"+ Add FC" must be visible').toBeVisible({ timeout: 8_000 });
                    await expect(addBtn, '"+ Add FC" must be enabled').toBeEnabled();
                });
            },
        );

    }); // Page Load

    // ── 2 · Action Buttons ────────────────────────────────────────────────────

    test.describe('Action Buttons', () => {

        test('should navigate to the Add FC form when "+ Add FC" is clicked',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to FC list', async () => {
                    await showStep(page, 'Navigating to FC list…');
                    await goTo(page, LIST_URL);
                });
                await test.step('Click "+ Add FC" and verify navigation to add form', async () => {
                    const addBtn = page.getByRole('button', { name: /add fc/i });
                    await highlight(addBtn);
                    await addBtn.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(500);
                    await expect(page, 'URL must contain /add').toHaveURL(/\/onboarding\/fc\/add/);
                    await showStep(page, `Navigated to: ${page.url()}`);
                });
            },
        );

    }); // Action Buttons

    // ── 3 · Filters ───────────────────────────────────────────────────────────

    test.describe('Filters', () => {

        test('should show only matching FCs when an FC is selected in the FC(s) filter',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                let selectedFC = '';
                await test.step('Navigate to FC list', async () => {
                    await showStep(page, 'Navigating to FC list for FC(s) filter test…');
                    await goTo(page, LIST_URL);
                });
                await test.step('Open FC(s) dropdown and pick first option', async () => {
                    // FC(s) is combobox[0] on the listing page
                    const fcCombo = page.getByRole('combobox').first();
                    await highlight(fcCombo);
                    await fcCombo.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(400);
                    const optionText = await pickFirstOpenOption(page);
                    // Dropdown shows "CODE: Name" format — extract just the Name part for table assertion
                    selectedFC = optionText.includes(': ') ? optionText.split(': ').slice(1).join(': ') : optionText;
                    await showStep(page, `Selected FC: "${selectedFC}"`);
                    expect(selectedFC.length, 'Must have selected a non-empty FC name').toBeGreaterThan(0);
                });
                await test.step('Click Search and verify results', async () => {
                    await clickSearch(page);
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'Results must be visible').toBeVisible({ timeout: 8_000 });
                    expect(await rows.count(), 'At least one row expected after filter').toBeGreaterThan(0);
                    await expect(
                        rows.first().locator('td').nth(COL.NAME),
                        `First result must contain "${selectedFC}"`,
                    ).toContainText(selectedFC, { timeout: 5_000 });
                });
            },
        );

        test('should show only FCs with a matching brand when the Brands filter is applied',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                // "HP" is a confirmed brand in preprod (visible in the FC list screenshot)
                const FILTER_BRAND = 'HP';
                await test.step('Navigate to FC list', async () => {
                    await showStep(page, 'Navigating to FC list for Brands filter test…');
                    await goTo(page, LIST_URL);
                });
                await test.step(`Type "${FILTER_BRAND}" in the Brands filter and select from dropdown`, async () => {
                    // Brands filter is combobox[1] — requires typing to trigger suggestions
                    const brandCombo = page.getByRole('combobox').nth(1);
                    await highlight(brandCombo);
                    await brandCombo.click();
                    await page.waitForTimeout(400);
                    await page.keyboard.type(FILTER_BRAND);
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(500);
                    const items = page.locator(
                        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content',
                    );
                    await items.first().waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
                    if ((await items.count()) === 0) {
                        await page.keyboard.press('Escape');
                        test.skip(true, `No brand options appeared for "${FILTER_BRAND}"`);
                        return;
                    }
                    // Prefer exact match, fall back to first result
                    const exact = items.filter({ hasText: new RegExp(`^${FILTER_BRAND}(:|$)`) });
                    if (await exact.count() > 0) {
                        await exact.first().evaluate(el => el.closest('.ant-select-item').click());
                    } else {
                        await items.first().evaluate(el => el.closest('.ant-select-item').click());
                    }
                    await page.waitForTimeout(300);
                    await showStep(page, `Brands filter set to: "${FILTER_BRAND}"`);
                });
                await test.step('Click Search and verify all results contain the selected brand', async () => {
                    await clickSearch(page);
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'Results must be visible').toBeVisible({ timeout: 8_000 });
                    expect(await rows.count(), 'At least one row expected').toBeGreaterThan(0);
                    const count = await rows.count();
                    for (let i = 0; i < count; i++) {
                        await expect(
                            rows.nth(i).locator('td').nth(COL.BRANDS),
                            `Row ${i}: Brands column must contain "${FILTER_BRAND}"`,
                        ).toContainText(FILTER_BRAND, { timeout: 5_000 });
                    }
                });
            },
        );

    }); // Filters

    // ── 4 · Pagination ────────────────────────────────────────────────────────

    test.describe('Pagination', () => {

        test('should load different FCs on the next page and return to page 1 on previous',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to FC list', async () => {
                    await showStep(page, 'Navigating to FC list for pagination test…');
                    await goTo(page, LIST_URL);
                });
                let firstPageFCName = '';
                await test.step('Capture page-1 first FC name and navigate to page 2', async () => {
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'First page must have rows').toBeVisible({ timeout: 8_000 });
                    const firstCell = rows.first().locator('td').nth(COL.NAME);
                    await expect(firstCell, 'Name cell must have content').not.toBeEmpty({ timeout: 8_000 });
                    firstPageFCName = ((await firstCell.textContent()) ?? '').trim();

                    const nextBtn = page.locator('li[title="Next Page"] button, button[aria-label="right"]').first();
                    const isDisabled = await nextBtn.isDisabled().catch(() => true);
                    if (isDisabled) {
                        test.skip(true, 'Only one page of FCs — next button is disabled');
                        return;
                    }
                    await highlight(nextBtn);
                    await nextBtn.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(600);

                    const page2Name = ((await rows.first().locator('td').nth(COL.NAME).textContent()) ?? '').trim();
                    expect(page2Name, 'Page 2 must show different FCs than page 1').not.toBe(firstPageFCName);
                });
                await test.step('Navigate back to page 1 and verify page 1 indicator is active', async () => {
                    const prevBtn = page.locator('li[title="Previous Page"] button, button[aria-label="left"]').first();
                    await highlight(prevBtn);
                    await prevBtn.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(500);

                    const activePager = page.locator('.ant-pagination-item-active');
                    await expect(activePager, 'Page 1 indicator must be visible').toBeVisible({ timeout: 5_000 });
                    const activePageNum = ((await activePager.textContent()) ?? '').trim();
                    expect(activePageNum, 'Active page must be "1"').toBe('1');
                });
            },
        );

        test('should update the row count when the page size selector is changed',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to FC list', async () => {
                    await goTo(page, LIST_URL);
                });
                await test.step('Change page size and verify row count updates', async () => {
                    const pageSizeSelector = page.locator('.ant-pagination-options .ant-select');
                    if (!(await pageSizeSelector.isVisible().catch(() => false))) {
                        test.skip(true, 'No page-size selector on FC list');
                        return;
                    }
                    const rowsBefore = await page.locator('table tbody tr').count();
                    await pageSizeSelector.click();
                    await page.waitForTimeout(400);
                    const sizeOptions = page.locator(
                        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content',
                    );
                    if ((await sizeOptions.count()) < 2) { await page.keyboard.press('Escape'); return; }
                    await sizeOptions.nth(1).evaluate(el => el.closest('.ant-select-item').click());
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(600);
                    const rowsAfter = await page.locator('table tbody tr').count();
                    expect(rowsAfter, 'Row count must change after page-size change').not.toBe(rowsBefore);
                });
            },
        );

    }); // Pagination

    // ── 5 · Detail Navigation ─────────────────────────────────────────────────

    test.describe('Detail Navigation', () => {

        test('should open the FC edit form when the edit (pencil) icon is clicked',
            { tag: ['@smoke'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to FC list', async () => {
                    await showStep(page, 'Navigating to FC list…');
                    await goTo(page, LIST_URL);
                });
                let firstFCName = '';
                await test.step('Capture first FC name and click edit icon', async () => {
                    const rows = page.locator('table tbody tr');
                    await expect(rows.first(), 'At least one FC row must exist').toBeVisible({ timeout: 8_000 });
                    const nameCell = rows.first().locator('td').nth(COL.NAME);
                    await expect(nameCell, 'Name cell must have content').not.toBeEmpty({ timeout: 8_000 });
                    firstFCName = ((await nameCell.textContent()) ?? '').trim();
                    await showStep(page, `Clicking edit icon for FC: "${firstFCName}"`);

                    const editIcon = rows.first().locator('td').nth(COL.ACTIONS).locator('img, svg, .anticon, a').first();
                    await highlight(editIcon);
                    await editIcon.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(800);
                });
                await test.step('Verify URL is the FC edit page and FC name is pre-filled', async () => {
                    await expect(page, 'URL must contain /edit').toHaveURL(/\/edit/);
                    const nameInput = page.locator('#name');
                    await expect(nameInput, 'FC Name must be pre-filled on edit page').toHaveValue(firstFCName);
                });
            },
        );

    }); // Detail Navigation

    // ── 6 · Create FC ─────────────────────────────────────────────────────────

    test.describe('Create FC', () => {

        test('should successfully create a new FC with all required fields filled',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(120_000);
                await test.step('Navigate to Add FC form', async () => {
                    await showStep(page, `Creating FC "${TEST_FC_NAME}" (${TEST_FC_CODE})…`);
                    await goTo(page, ADD_URL);
                });
                await test.step('Fill all required fields', async () => {
                    await showStep(page, 'Filling FC form…');
                    await fillFCForm(page);
                });
                await test.step('Click Save and verify success', async () => {
                    const saveBtn = page.getByRole('button', { name: /^save$/i });
                    await expect(saveBtn, '"Save" button must be visible').toBeVisible({ timeout: 8_000 });
                    await highlight(saveBtn);
                    await saveBtn.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(1000);

                    // Accept either: redirect back to list OR success notification
                    const onList = page.url().match(/\/onboarding\/fc(\?|$)/);
                    const toast  = page.locator('.ant-message-notice, .ant-notification-notice');
                    if (onList) {
                        await showStep(page, 'Redirected to FC list — create successful');
                        await expect(page.getByRole('table').first(), 'Table must be visible after save').toBeVisible();
                    } else if (await toast.first().isVisible().catch(() => false)) {
                        await showStep(page, 'Success notification appeared');
                        await expect(toast.first(), 'Success toast must be visible').toBeVisible();
                    } else {
                        // Fallback: should not still be on the add page with a form error
                        const formError = page.locator('.ant-form-item-explain-error');
                        expect(
                            await formError.count(),
                            'No form validation errors must remain after successful save',
                        ).toBe(0);
                    }
                });
            },
        );

        test('should show the newly created FC in the FC list after creation',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to FC list', async () => {
                    await showStep(page, `Searching for "${TEST_FC_NAME}" in FC list…`);
                    await goTo(page, LIST_URL);
                });
                await test.step('Find the newly created FC in the list', async () => {
                    // Use the FC(s) filter to search for the newly created FC
                    const fcCombo = page.getByRole('combobox').first();
                    await fcCombo.click();
                    await page.waitForTimeout(400);
                    await page.keyboard.type(TEST_FC_NAME.slice(0, 6));
                    await page.waitForTimeout(500);
                    const items = page.locator(
                        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content',
                    );
                    const matched = items.filter({ hasText: new RegExp(TEST_FC_NAME, 'i') });
                    if (await matched.count() > 0) {
                        await matched.first().evaluate(el => el.closest('.ant-select-item').click());
                    } else {
                        await page.keyboard.press('Escape');
                    }
                    await page.waitForTimeout(300);
                    await clickSearch(page);

                    const rows = page.locator('table tbody tr');
                    await expect(
                        rows.first(),
                        'FC list must have rows after search',
                    ).toBeVisible({ timeout: 8_000 });

                    const found = page.locator('table tbody tr').filter({ hasText: TEST_FC_NAME });
                    await expect(found.first(), `"${TEST_FC_NAME}" must appear in FC list`).toBeVisible({ timeout: 8_000 });
                });
            },
        );

    }); // Create FC

    // ── 7 · Negative Scenarios ────────────────────────────────────────────────

    test.describe('Negative Scenarios', () => {

        test('should keep the Save button disabled when the Add FC form is completely empty',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(60_000);
                await test.step('Navigate to Add FC form', async () => {
                    await showStep(page, 'Navigating to empty Add FC form…');
                    await goTo(page, ADD_URL);
                });
                await test.step('Verify Save button is disabled before any input', async () => {
                    const saveBtn = page.getByRole('button', { name: /^save$/i });
                    await highlight(saveBtn);
                    await expect(saveBtn, '"Save" must be disabled on empty form').toBeDisabled();
                });
            },
        );

        test('should show a validation error when FC Name is missing',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Add FC form', async () => {
                    await goTo(page, ADD_URL);
                });
                await test.step('Fill all fields except FC Name', async () => {
                    await showStep(page, 'Filling all fields except FC Name…');
                    await fillFCForm(page, { name: null });
                });
                await test.step('Click FC Name field and Tab away to trigger validation', async () => {
                    const nameInput = page.locator('#name');
                    await nameInput.click();
                    await page.keyboard.press('Tab');
                    await page.waitForTimeout(400);
                    const error = page.locator('.ant-form-item-explain-error').first();
                    await expect(error, 'Validation error for FC Name must appear').toBeVisible({ timeout: 5_000 });
                });
                await test.step('Verify Save button remains disabled', async () => {
                    const saveBtn = page.getByRole('button', { name: /^save$/i });
                    await expect(saveBtn, '"Save" must stay disabled without FC Name').toBeDisabled();
                });
            },
        );

        test('should show a validation error when FC Code is missing',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Add FC form', async () => {
                    await goTo(page, ADD_URL);
                });
                await test.step('Fill all fields except FC Code', async () => {
                    await showStep(page, 'Filling all fields except FC Code…');
                    await fillFCForm(page, { code: null });
                });
                await test.step('Click FC Code field and Tab away to trigger validation', async () => {
                    const codeInput = page.locator('#code');
                    await codeInput.click();
                    await page.keyboard.press('Tab');
                    await page.waitForTimeout(400);
                    const error = page.locator('.ant-form-item-explain-error').first();
                    await expect(error, 'Validation error for FC Code must appear').toBeVisible({ timeout: 5_000 });
                });
                await test.step('Verify Save button remains disabled', async () => {
                    const saveBtn = page.getByRole('button', { name: /^save$/i });
                    await expect(saveBtn, '"Save" must stay disabled without FC Code').toBeDisabled();
                });
            },
        );

        test('should show a validation error when Client is not selected',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Add FC form', async () => {
                    await goTo(page, ADD_URL);
                });
                await test.step('Fill all fields except Client', async () => {
                    await showStep(page, 'Filling all fields except Client…');
                    // Fill name, code, numbers, address, gst — skip client; pincode & brand still needed
                    await page.locator('#name').pressSequentially(`NoClientFC${SFX}`, { delay: 80 });
                    await page.locator('#code').pressSequentially(`N${SFX}`, { delay: 80 });
                    await page.locator('#latitude').pressSequentially(TEST_LAT, { delay: 80 });
                    await page.locator('#longitude').pressSequentially(TEST_LNG, { delay: 80 });
                    await page.locator('#proximityRadius').pressSequentially(TEST_RADIUS, { delay: 80 });
                    await page.locator('#address').pressSequentially(TEST_ADDRESS, { delay: 80 });
                    await page.locator('#gst_number').pressSequentially(TEST_GST, { delay: 80 });
                });
                await test.step('Open Client dropdown and Tab away to trigger validation', async () => {
                    const clientWrapper = page.locator('.ant-select').filter({ has: page.locator('#client_id') });
                    await clientWrapper.click();
                    await page.waitForTimeout(400);
                    // Tab fires blur on AntD Select → shows validation error
                    await page.keyboard.press('Tab');
                    await page.waitForTimeout(400);
                    const error = page.locator('.ant-form-item-explain-error').first();
                    await expect(error, 'Validation error for Client must appear').toBeVisible({ timeout: 5_000 });
                });
                await test.step('Verify Save button remains disabled', async () => {
                    const saveBtn = page.getByRole('button', { name: /^save$/i });
                    await expect(saveBtn, '"Save" must stay disabled without Client').toBeDisabled();
                });
            },
        );

        test('should show a validation error when Pincode is not selected',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Add FC form', async () => {
                    await goTo(page, ADD_URL);
                });
                await test.step('Fill all fields except Pincode', async () => {
                    await showStep(page, 'Filling all fields except Pincode…');
                    await page.locator('#name').pressSequentially(`NoPincodeFC${SFX}`, { delay: 80 });
                    await page.locator('#code').pressSequentially(`P${SFX}`, { delay: 80 });
                    await page.locator('#latitude').pressSequentially(TEST_LAT, { delay: 80 });
                    await page.locator('#longitude').pressSequentially(TEST_LNG, { delay: 80 });
                    await page.locator('#proximityRadius').pressSequentially(TEST_RADIUS, { delay: 80 });
                    await page.locator('#address').pressSequentially(TEST_ADDRESS, { delay: 80 });
                    await page.locator('#gst_number').pressSequentially(TEST_GST, { delay: 80 });
                    await selectClientFC(page, TEST_CLIENT);
                });
                await test.step('Open Pincode dropdown and Tab away to trigger validation', async () => {
                    const pincodeWrapper = page.locator('.ant-select').filter({ has: page.locator('#pincode_id') });
                    await pincodeWrapper.click();
                    await page.waitForTimeout(400);
                    await page.keyboard.press('Tab');
                    await page.waitForTimeout(400);
                    const error = page.locator('.ant-form-item-explain-error').first();
                    await expect(error, 'Validation error for Pincode must appear').toBeVisible({ timeout: 5_000 });
                });
            },
        );

    }); // Negative Scenarios

    // ── 8 · Edge Cases ────────────────────────────────────────────────────────

    test.describe('Edge Cases', () => {

        test('should load the FC list correctly when navigated to directly via URL',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(60_000);
                await test.step('Navigate directly to FC list URL', async () => {
                    await goTo(page, LIST_URL);
                    await expect(page, 'URL must be the FC list path').toHaveURL(/\/onboarding\/fc/);
                });
                await test.step('Verify page renders table and Search button', async () => {
                    await expect(page.getByRole('button', { name: 'Search' }), '"Search" must be visible').toBeVisible();
                    await expect(page.getByRole('table').first(), 'Table must be visible').toBeVisible();
                });
            },
        );

        test('should show the Add FC form correctly when navigated to directly via URL',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(60_000);
                await test.step('Navigate directly to Add FC URL', async () => {
                    await goTo(page, ADD_URL);
                    await expect(page, 'URL must be the add FC path').toHaveURL(/\/onboarding\/fc\/add/);
                });
                await test.step('Verify all required form fields are present', async () => {
                    await expect(page.locator('#name'),           'FC Name field must be visible').toBeVisible();
                    await expect(page.locator('#code'),           'FC Code field must be visible').toBeVisible();
                    await expect(page.locator('#latitude'),       'Latitude field must be visible').toBeVisible();
                    await expect(page.locator('#longitude'),      'Longitude field must be visible').toBeVisible();
                    await expect(page.locator('#proximityRadius'),'Proximity Radius field must be visible').toBeVisible();
                    await expect(page.locator('#address'),        'Address field must be visible').toBeVisible();
                    await expect(page.locator('#gst_number'),     'GST Number field must be visible').toBeVisible();
                });
            },
        );

        test('should stay on the FC list page after a hard reload',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(60_000);
                await test.step('Navigate to FC list', async () => { await goTo(page, LIST_URL); });
                await test.step('Reload the page', async () => {
                    await page.reload();
                    await page.waitForLoadState('networkidle').catch(() => {});
                });
                await test.step('Verify FC list is still visible after reload', async () => {
                    await expect(page.getByRole('button', { name: 'Search' }), '"Search" must be visible after reload')
                        .toBeVisible({ timeout: 10_000 });
                    await expect(page.getByRole('table').first(), 'Table must be visible after reload').toBeVisible();
                });
            },
        );

        test('should show the Add FC form still accessible after a page reload',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(60_000);
                await test.step('Navigate to Add FC form', async () => { await goTo(page, ADD_URL); });
                await test.step('Reload the page', async () => {
                    await page.reload();
                    await page.waitForLoadState('networkidle').catch(() => {});
                });
                await test.step('Verify form fields are still accessible after reload', async () => {
                    await expect(page.locator('#name'), 'FC Name field must be accessible after reload')
                        .toBeVisible({ timeout: 10_000 });
                    await expect(page.getByRole('button', { name: /^save$/i }), '"Save" must be visible after reload')
                        .toBeVisible();
                });
            },
        );

        test('should allow Onboarding > FC navigation via the sidebar menu',
            { tag: ['@regression'] },
            async ({ page }) => {
                test.setTimeout(90_000);
                await test.step('Navigate to Dashboard first', async () => {
                    await goTo(page, BASE_URL + '/dashboard');
                });
                await test.step('Click Onboarding in sidebar and then FC', async () => {
                    await showStep(page, 'Opening Onboarding > FC via sidebar…');
                    const onboarding = page.getByRole('menuitem', { name: 'Onboarding' });
                    await onboarding.waitFor({ state: 'visible', timeout: 10_000 });
                    await onboarding.click();
                    await page.waitForTimeout(500);
                    const fcLink = page.getByRole('link', { name: /^FC$/ });
                    await fcLink.waitFor({ state: 'visible', timeout: 8_000 });
                    await highlight(fcLink);
                    await fcLink.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(500);
                });
                await test.step('Verify FC list page is displayed', async () => {
                    await expect(page, 'URL must be the FC list path').toHaveURL(/\/onboarding\/fc/);
                    await expect(page.getByRole('table').first(), 'FC list table must be visible').toBeVisible({ timeout: 8_000 });
                });
            },
        );

    }); // Edge Cases

}); // Onboarding — FC
