const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

// Usage:
//   npx playwright test tests/market-returns/market-returns-edit-draft.spec.js --headed

const MR_URL = config.baseURLpreprod.replace(/\/login\/?$/, '') + '/order-management/market-return-report';

async function goToMarketReturns(page) {
    const loginPage = new LoginPage(page);
    await page.goto(config.baseURLpreprod);
    await loginPage.login(config.credentials.username, config.credentials.password);
    await page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {});
    await page.goto(MR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
}

async function clickSearch(page) {
    await page.locator('button').filter({ hasText: /^search$/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
}

test('Edit draft market return — fill store/salesman (upper save), select product, verify row, save when all ready', async ({ page }) => {
    test.setTimeout(180_000);
    await goToMarketReturns(page);
    await clickSearch(page);

    // Scan all listing pages for a Draft return that has something to fix:
    // empty Store/Salesman (blue-outline selects) OR NEED FIX product rows.
    const listRows = page.locator('table tbody tr');
    const needFixRows = page.locator('table tbody tr').filter({ hasText: 'NEED FIX' });

    // Detect empty header selects by their placeholder text (visible when no value selected)
    const storeSelect = page.locator('.ant-select').filter({ hasText: 'Select store' });
    const salesmanSelect = page.locator('.ant-select').filter({ hasText: 'Select sales man' });

    let foundDraft = false;
    const MAX_PAGES = 10;

    pageLoop: for (let pg = 0; pg < MAX_PAGES; pg++) {
        const listCount = await listRows.count();
        for (let i = 0; i < listCount; i++) {
            const rowText = await listRows.nth(i).textContent();
            if (!rowText.includes('Draft')) continue;

            await listRows.nth(i).locator('[data-icon="eye"]').click();
            await page.waitForURL(/\/view\/\d+/, { timeout: 15000 });
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const storeEmpty = await storeSelect.count() > 0;
            const salesmanEmpty = await salesmanSelect.count() > 0;
            const productNeedFix = await needFixRows.count() > 0;

            if (storeEmpty || salesmanEmpty || productNeedFix) {
                foundDraft = true;
                break pageLoop;
            }

            // Nothing to fix — go back and keep scanning
            await page.goto(MR_URL);
            await page.waitForLoadState('networkidle');
            await clickSearch(page);
        }

        // Advance to next listing page
        const nextBtn = page.locator('button[aria-label="right"], li[title="Next Page"] button');
        if (await nextBtn.count() === 0 || await nextBtn.isDisabled()) break;
        await nextBtn.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(800);
    }

    expect(foundDraft, 'Expected at least one Draft return with empty Store/Salesman or NEED FIX product rows').toBe(true);

    // ── Step 1: Header fields — Store & Salesman ──────────────────────────────
    // Empty selects show a placeholder text (blue outline). Detect by placeholder,
    // fill with the first available option, then click the upper Save button.
    // Store selection may trigger an API reload of Salesman options — wait for
    // the dropdown to populate before picking, rather than using a fixed timeout.
    let headerChanged = false;

    for (const emptySelect of [storeSelect, salesmanSelect]) {
        if (await emptySelect.count() === 0) continue;

        await emptySelect.first().click();
        // Wait for any network call triggered by opening the dropdown (e.g. Salesman
        // list loading after Store is set) and for the popup to render its options.
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(300);

        const dropdownItems = page.locator(
            '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content'
        );
        await dropdownItems.first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});

        if (await dropdownItems.count() === 0) {
            // No options loaded — close dropdown and skip this field
            await page.keyboard.press('Escape');
            continue;
        }

        await dropdownItems.first().evaluate(el => el.closest('.ant-select-item').click());
        await page.waitForTimeout(500);
        headerChanged = true;
    }

    if (headerChanged) {
        const upperSave = page.locator('button').filter({ hasText: /^Save$/ }).first();
        await expect(upperSave).toBeEnabled({ timeout: 5000 });
        await upperSave.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
    }

    // ── Step 2: Products section ──────────────────────────────────────────────
    // For each NEED FIX product row:
    //   1. Select first option from any enabled dropdown in the row (product or reason).
    //   2. Some rows auto-transition to "Ready" on selection; others require a
    //      manual click on the verify <div> in cell 7. Check the row text after
    //      selection and only click verify if still NEED FIX.
    //
    // Use a stable index-based row reference instead of the NEED FIX filter —
    // the filter-based locator loses the row the moment its text changes to "Ready".

    const allProductRows = page.locator('table tbody tr');
    let iterations = 0;
    while (iterations++ < 20) {
        // Find first NEED FIX row by index in the full row list
        let needFixIdx = -1;
        const rowCount = await allProductRows.count();
        for (let r = 0; r < rowCount; r++) {
            if ((await allProductRows.nth(r).textContent() || '').includes('NEED FIX')) {
                needFixIdx = r;
                break;
            }
        }
        if (needFixIdx < 0) break;

        const row = allProductRows.nth(needFixIdx); // stable — bound by position, not text

        // Select the first enabled dropdown in this row (product name or return reason)
        const productSelect = row.locator('.ant-select:not(.ant-select-disabled)').first();
        if (await productSelect.count() > 0) {
            await productSelect.click();
            await page.waitForTimeout(600);
            await page.locator('.ant-select-item-option-content').first()
                .evaluate(el => el.closest('.ant-select-item').click());
            await page.waitForTimeout(800);
        }

        // Row may have auto-transitioned to Ready; only click verify if still NEED FIX
        const currentText = await row.textContent().catch(() => '');
        if (currentText.includes('NEED FIX')) {
            const verifyBtn = row.locator('td:nth-child(7) div');
            await expect(verifyBtn).toBeVisible({ timeout: 5000 });
            await verifyBtn.click();
            await page.waitForTimeout(500);
        }
    }

    // All product rows must now show "Ready"
    await expect(page.locator('table tbody tr').filter({ hasText: 'NEED FIX' })).toHaveCount(0, { timeout: 10000 });

    // Lower Save button (products section) is now enabled — click it
    const lowerSave = page.locator('button').filter({ hasText: /^Save$/ }).last();
    await expect(lowerSave).toBeEnabled({ timeout: 5000 });
    await lowerSave.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Detail page must still be visible (no crash / unexpected redirect)
    await expect(page.getByText('Return No.')).toBeVisible();
});
