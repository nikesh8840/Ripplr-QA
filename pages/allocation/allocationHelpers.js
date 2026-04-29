const fs = require('fs');
const path = require('path');
const vaLocators = require('../../locators/vehicleAllocation.locators');

const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots/vehicle-allocation');

async function screenshot(page, name) {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
    if (page.isClosed()) return;
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    if (page.isClosed()) return;
    await page.waitForTimeout(500);
    if (page.isClosed()) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(SCREENSHOT_DIR, `${name}-${timestamp}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Screenshot saved: ${filePath}`);
}

async function selectDropdownOption(page, label, optionText) {
    const l = vaLocators(page);
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
        .waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    await l.formItemSelect(label).click();
    const option = l.visibleDropdownOption(optionText);
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.scrollIntoViewIfNeeded();
    await option.click();
}

function parseAllocationDate(dateText) {
    const match = dateText.match(/(\d{2})\/(\d{2})\/(\d{4}),\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    const [, day, month, year, rawHour, minutes, ampm] = match;
    let hour = parseInt(rawHour, 10);
    if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour, parseInt(minutes), 0);
}

async function verifyLatestAllocation(page) {
    try {
        await page.waitForURL('**/delivery-allocation*', { timeout: 15000 });
        await page.waitForFunction(
            () => !window.location.href.includes('/create'),
            { timeout: 10000 }
        );
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(500);

        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const todayPrefix = `${dd}/${mm}/${yyyy}`;

        const firstRow = page.locator('table tbody tr').first();
        await firstRow.waitFor({ state: 'visible', timeout: 10000 });

        const dateCell = firstRow.locator(`td:has-text("${todayPrefix}")`).first();
        const dateText = (await dateCell.textContent({ timeout: 5000 })).trim();

        const allocationDate = parseAllocationDate(dateText);
        if (!allocationDate) {
            console.warn(`Allocation verification: could not parse date "${dateText}"`);
            return false;
        }

        const diffMs = now - allocationDate;
        const diffMinutes = diffMs / (1000 * 60);

        if (diffMinutes >= 0 && diffMinutes <= 1) {
            console.log(`Allocation verified: "${dateText}" is within 1 minute of now`);
            return true;
        } else {
            console.warn(`Allocation verification failed: "${dateText}" is ${diffMinutes.toFixed(2)} minute(s) away from now`);
            return false;
        }
    } catch (err) {
        console.error('Allocation verification error:', err.message);
        return false;
    }
}

async function fillCrateCountsIfPresent(page) {
    const l = vaLocators(page);
    for (const label of ['Crate Count', 'Case Count']) {
        try {
            const input = l.formItemInput(label);
            await input.waitFor({ state: 'visible', timeout: 1500 });
            await input.fill('1');
            console.log(`Crate tracking field "${label}" found and filled with 1`);
        } catch {
            // Field not present — skip
        }
    }
}

async function selectFirstDropdownResult(page, label, searchText) {
    const l = vaLocators(page);
    await l.formItemSelect(label).click();
    await l.formItemInput(label).pressSequentially(searchText, { delay: 50 });
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content')
        .first().waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content')
        .first().click();
}

async function processSelectionInvoice(page) {
    const invoiceData = require('../../test-data/allocation/vehicleallocationdata');
    const invoices = invoiceData.invoiceData;
    const l = vaLocators(page);
    try {
        for (let i = 0; i < invoices.length; i++) {
            console.log(`Processing invoice: ${invoices[i]}`);
            await l.invoiceSearchInput.click();
            await l.invoiceSearchInput.clear();
            await l.invoiceSearchInput.fill(invoices[i]);
            await l.searchButton.click();
            await page.waitForSelector(`tr:has-text("${invoices[i]}")`, { timeout: 10000 });
            await l.invoiceRowCheckbox(invoices[i]).click();
            console.log(`Successfully selected invoice: ${invoices[i]}`);
            await l.invoiceSearchInput.clear();
        }
        return true;
    } catch (err) {
        console.error('Error processing invoice selection:', err);
        return false;
    }
}

// Extract EWB number from the Delivery Allocation Details review modal (before clicking Confirm)
// Uses .last() to target the topmost modal when multiple ant-modal-body elements exist
async function verifyEWBOnReviewPage(page) {
    try {
        // Get the text of the topmost (last) modal body
        const modalText = await page.locator('.ant-modal-body').last().textContent({ timeout: 5000 });

        // Consolidated EWB: "Consolidated E-Way Bill Number :<digits>"
        const consolidatedMatch = modalText.match(/Consolidated[^\d]*(\d{8,})/i);
        const consolidatedEwbNumber = consolidatedMatch ? consolidatedMatch[1] : null;

        // Regular EWB: "E Way Bill number :141012016888" — strip consolidated section first
        const textWithoutConsolidated = modalText.replace(/Consolidated[^\d]*\d{8,}/i, '');
        const ewbMatch = textWithoutConsolidated.match(/E[\s-]?Way Bill[^\d]*(\d{8,})/i);
        const ewbNumber = ewbMatch ? ewbMatch[1] : null;

        if (ewbNumber || consolidatedEwbNumber) {
            console.log(`EWB number: ${ewbNumber}, Consolidated EWB: ${consolidatedEwbNumber}`);
            return {
                verified: true,
                ewbNumber,
                consolidatedEwbNumber,
            };
        }

        console.warn(`EWB numbers not found on review page. Modal text: ${modalText.slice(0, 300)}`);
        return { verified: false, ewbNumber: null, consolidatedEwbNumber: null };
    } catch (err) {
        console.error('EWB review page verification error:', err.message);
        return { verified: false, ewbNumber: null, consolidatedEwbNumber: null };
    }
}

// Called after navigation to the list is already complete
async function verifyEWBGenerated(page) {
    try {
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(1000);

        const firstRow = page.locator('table tbody tr').first();
        await firstRow.waitFor({ state: 'visible', timeout: 10000 });

        const ewbCell = firstRow.locator('td').filter({ hasText: /\d{8,}/ }).first();
        const ewbText = (await ewbCell.textContent({ timeout: 10000 })).trim();

        if (ewbText && /\d{8,}/.test(ewbText)) {
            console.log(`EWB number verified: ${ewbText}`);
            return { verified: true, ewbNumber: ewbText };
        } else {
            console.warn(`EWB verification failed: cell text was "${ewbText}"`);
            return { verified: false, ewbNumber: null };
        }
    } catch (err) {
        console.error('EWB verification error:', err.message);
        return { verified: false, ewbNumber: null };
    }
}

module.exports = {
    screenshot,
    selectDropdownOption,
    parseAllocationDate,
    verifyLatestAllocation,
    verifyEWBOnReviewPage,
    verifyEWBGenerated,
    fillCrateCountsIfPresent,
    selectFirstDropdownResult,
    processSelectionInvoice,
};
