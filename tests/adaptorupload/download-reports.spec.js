const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

/**
 * Download Reports – CDMS Preprod
 *
 * Report types and their required / optional fields:
 *
 *  Sales Order (Invoice Wise)       – From/To Invoice Date*, Store(s), FC(s), Brand(s), Vehicle No
 *  Sales Order (Product Wise)       – From/To Invoice Date*, Store(s), FC(s), Brand(s), Vehicle No
 *  Returns Report                   – From/To Return Date*, Vehicle No, FC(s), Brand(s)
 *  Collection Detail                – From/To Collection Date*, From/To Cashier Verification Date*, FC(s), Brand(s)
 *  Cheque Bounce Recovery Report    – From/To Bounced Date*, Aging, FC(s), Brand(s)
 *  Stockone RFC Report              – Vehicle Allocation Date*, FC*, Brand*
 *  Salesman Assigned Invoices       – From/To Invoice Assignment Date*, FC(s), Brand(s)
 *  Salesman GPS Data                – From/To Collection Date*, FC(s), Brand(s)
 *  OBC Difference Report            – From/To Invoice Date*, FC(s)
 *  Market Return Report             – From/To Return Date*, Return-verified From/To Date*, FC(s), Brand(s)
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Return day-of-month n days ago. */
function dayNumAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.getDate();
}

const YESTERDAY_DAY = dayNumAgo(1);          // e.g. 15 – safe TO date (some reports disable today)
const WEEK_AGO_DAY  = dayNumAgo(7);          // e.g. 9

async function loginAndGoToDownloads(page) {
    const loginPage = new LoginPage(page);
    await page.goto(config.baseURLpreprod);
    await loginPage.login(config.credentials.username, config.credentials.password);
    await page.getByRole('link', { name: 'Downloads' }).click();
    await page.waitForLoadState('networkidle');
}

/** Open the Download Reports modal and choose a report type. */
async function openReport(page, reportType) {
    await page.getByRole('button', { name: 'Download Reports' }).click();
    await page.waitForTimeout(600);
    await page.getByRole('combobox', { name: /Report Type/i }).click();
    await page.waitForTimeout(400);
    await page.getByText(reportType, { exact: true }).click();
    // Wait for any async form fields (e.g. Store(s)) to finish loading
    await page.waitForFunction(
        () => !document.querySelector('.ant-modal-content')?.innerText.includes('Loading...'),
        { timeout: 15000 }
    );
    await page.waitForTimeout(400);
}

/**
 * Pick a date by clicking the nth picker input and selecting the day in the calendar.
 * pickerIndex addresses ALL .ant-picker-input > input elements in the modal.
 * Waits for the input to be enabled first (handles dependent fields like
 * Collection Detail's Cashier Verification dates that start disabled).
 */
async function pickDate(page, pickerIndex, dayNumber) {
    const input = page.locator('.ant-modal-content .ant-picker-input > input').nth(pickerIndex);
    await expect(input).toBeEnabled({ timeout: 15_000 });
    await input.click();
    await page.waitForTimeout(500);
    await page.locator('.ant-picker-dropdown:visible .ant-picker-cell:not(.ant-picker-cell-disabled)')
        .filter({ hasText: new RegExp(`^${dayNumber}$`) })
        .first()
        .click();
    await page.waitForTimeout(300);
}

/** Pick a from/to date pair using the calendar. */
async function pickDatePair(page, fromPickerIndex, fromDay, toDay) {
    await pickDate(page, fromPickerIndex,     fromDay);
    await pickDate(page, fromPickerIndex + 1, toDay);
}

/**
 * Click a select inside a form-item whose label contains labelText,
 * then pick the first available option.
 */
async function selectFirstOption(page, labelText) {
    const formItem = page.locator('.ant-modal-content .ant-form-item')
        .filter({ has: page.locator(`label:has-text("${labelText}")`) });
    await formItem.locator('.ant-select-selector').click();
    await page.waitForTimeout(600);
    const firstOpt = page.locator('.ant-select-dropdown:visible .ant-select-item-option').first();
    await firstOpt.click();
    await page.waitForTimeout(400);
}

/** Submit and assert the modal closes (report queued). */
async function requestReport(page, reportType) {
    await page.getByRole('button', { name: 'Request Report' }).click();
    await expect(page.locator('.ant-modal-content')).toBeHidden({ timeout: 15_000 });
    console.log(`[download-reports] ✓ ${reportType}`);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Download Reports – CDMS Preprod', () => {
    test.setTimeout(120_000);

    // ── 1. Sales Order (Invoice Wise) ──────────────────────────────────────
    // Fields: From Invoice Date [0], To Invoice Date [1]
    // Optional: Store(s), FC(s), Brand(s), Vehicle No
    test('Sales Order (Invoice Wise)', async ({ page }) => {
        await loginAndGoToDownloads(page);
        await openReport(page, 'Sales Order (Invoice Wise)');
        await pickDatePair(page, 0, WEEK_AGO_DAY, YESTERDAY_DAY);
        await requestReport(page, 'Sales Order (Invoice Wise)');
    });

    // ── 2. Sales Order (Product Wise) ─────────────────────────────────────
    // Fields: From Invoice Date [0], To Invoice Date [1]
    // Optional: Store(s), FC(s), Brand(s), Vehicle No
    test('Sales Order (Product Wise)', async ({ page }) => {
        await loginAndGoToDownloads(page);
        await openReport(page, 'Sales Order (Product Wise)');
        await pickDatePair(page, 0, WEEK_AGO_DAY, YESTERDAY_DAY);
        await requestReport(page, 'Sales Order (Product Wise)');
    });

    // ── 3. Returns Report ─────────────────────────────────────────────────
    // Fields: From Return Date [0], To Return Date [1]
    // Optional: Vehicle No, FC(s), Brand(s)
    test('Returns Report', async ({ page }) => {
        await loginAndGoToDownloads(page);
        await openReport(page, 'Returns Report');
        await pickDatePair(page, 0, WEEK_AGO_DAY, YESTERDAY_DAY);
        await requestReport(page, 'Returns Report');
    });

    // ── 4. Collection Detail ──────────────────────────────────────────────
    // Fields: From Collection Date [0], To Collection Date [1],
    //         From Cashier Verification Date [2], To Cashier Verification Date [3]
    // Optional: FC(s), Brand(s)
    test('Collection Detail', async ({ page }) => {
        await loginAndGoToDownloads(page);
        await openReport(page, 'Collection Detail');
        await pickDatePair(page, 0, WEEK_AGO_DAY, YESTERDAY_DAY);   // Collection Date
        // Cashier Verification Date fields are disabled by default; submit with Collection Date only
        await requestReport(page, 'Collection Detail');
    });

    // ── 5. Cheque Bounce Recovery Report ──────────────────────────────────
    // Fields: From Bounced Date [0], To Bounced Date [1]
    // Optional: Aging (0-7 Days / 8-15 Days / 16-23 Days / 24-30 Days / 31+ Days), FC(s), Brand(s)
    test('Cheque Bounce Recovery Report', async ({ page }) => {
        await loginAndGoToDownloads(page);
        await openReport(page, 'Cheque Bounce Recovery Report');
        await pickDatePair(page, 0, WEEK_AGO_DAY, YESTERDAY_DAY);
        await requestReport(page, 'Cheque Bounce Recovery Report');
    });

    // ── 6. Stockone RFC Report ────────────────────────────────────────────
    // Fields: Vehicle Allocation Date [0] (required, single date),
    //         FC* (required select), Brand* (required select, depends on FC)
    test('Stockone RFC Report', async ({ page }) => {
        await loginAndGoToDownloads(page);
        await openReport(page, 'Stockone RFC Report');

        await pickDate(page, 0, YESTERDAY_DAY);             // Vehicle Allocation Date

        await selectFirstOption(page, 'FC');            // Required FC
        await page.waitForTimeout(600);                 // Brand depends on FC
        await selectFirstOption(page, 'Brand');         // Required Brand

        await requestReport(page, 'Stockone RFC Report');
    });

    // ── 7. Salesman Assigned Invoices ─────────────────────────────────────
    // Fields: From Invoice Assignment Date [0], To Invoice Assignment Date [1]
    // Optional: FC(s), Brand(s)
    test('Salesman Assigned Invoices', async ({ page }) => {
        await loginAndGoToDownloads(page);
        await openReport(page, 'Salesman Assigned Invoices');
        await pickDatePair(page, 0, WEEK_AGO_DAY, YESTERDAY_DAY);
        await requestReport(page, 'Salesman Assigned Invoices');
    });

    // ── 8. Salesman GPS Data ──────────────────────────────────────────────
    // Fields: From Collection Date [0], To Collection Date [1]
    // Optional: FC(s), Brand(s)
    test('Salesman GPS Data', async ({ page }) => {
        await loginAndGoToDownloads(page);
        await openReport(page, 'Salesman GPS Data');
        await pickDatePair(page, 0, WEEK_AGO_DAY, YESTERDAY_DAY);
        await requestReport(page, 'Salesman GPS Data');
    });

    // ── 9. OBC Difference Report ──────────────────────────────────────────
    // Fields: From Invoice Date [0], To Invoice Date [1]
    // Optional: FC(s)
    test('OBC Difference Report', async ({ page }) => {
        await loginAndGoToDownloads(page);
        await openReport(page, 'OBC Difference Report');
        await pickDatePair(page, 0, WEEK_AGO_DAY, YESTERDAY_DAY);
        await requestReport(page, 'OBC Difference Report');
    });

    // ── 10. Market Return Report ──────────────────────────────────────────
    // Fields: From Return Date [0], To Return Date [1],
    //         Return-verified From Date [2], Return-verified To Date [3]
    // Optional: FC(s), Brand(s)
    test('Market Return Report', async ({ page }) => {
        await loginAndGoToDownloads(page);
        await openReport(page, 'Market Return Report');
        await pickDatePair(page, 0, WEEK_AGO_DAY, YESTERDAY_DAY);   // Return Date
        // Return-verified Date fields are disabled by default; submit with Return Date only
        await requestReport(page, 'Market Return Report');
    });
});
