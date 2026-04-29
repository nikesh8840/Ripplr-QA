const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

// Usage:
//   npx playwright test tests/market-returns/market-returns-filters.spec.js --headed
//   npx playwright test tests/market-returns/market-returns-filters.spec.js --headed -g "Filter by Return No"

const MR_URL = config.baseURLpreprod.replace(/\/login\/?$/, '') + '/order-management/market-return-report';

async function goToMarketReturns(page) {
    const loginPage = new LoginPage(page);
    await page.goto(config.baseURLpreprod);
    await loginPage.login(config.credentials.username, config.credentials.password);
    await page.waitForLoadState('networkidle');
    await page.goto(MR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
}

// ── Test 1: Filter by Return No ───────────────────────────────────────────────
test('Filter by Return No shows only the matching return', async ({ page }) => {
    test.setTimeout(90_000);
    await goToMarketReturns(page);

    await page.getByRole('textbox', { name: /Return No/i }).fill('RTN597');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('RTN597');
});
