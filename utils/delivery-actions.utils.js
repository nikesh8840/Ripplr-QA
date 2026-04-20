
const path = require('path');

const FILE_PATH = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');

/**
 * Marks a specific table row as Delivered.
 * @param {import('@playwright/test').Page} page
 * @param {number} rowNumber - 1-based row index (1 = first data row)
 */
async function markRowAsDelivered(page, rowNumber) {
    try {
        console.log(`markRowAsDelivered: row ${rowNumber}`);
        await page.locator(`tr:nth-child(${rowNumber + 1}) td:nth-child(7) .ant-select-selector`).click();
        await page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
        await page.locator('.ant-select-dropdown .ant-select-item:has-text("Delivered"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)').first().click();
        await page.getByRole("button", { name: "OK" }).click();
        await page.getByRole("button", { name: "Yes" }).click();
        await page.getByRole("button", { name: "Delivery Details" }).click();
        await page.getByRole("button", { name: "Update" }).click();
        await page.getByRole("radio", { name: "Invoice Returned" }).check();
        let collectableamount = await page.locator(`div[class='sc-bczRLJ sc-gsnTZi jkiZmR jnFvAE'] div:nth-child(2) div:nth-child(2) span:nth-child(1)`).innerText();
        collectableamount = collectableamount.replace('₹', '').replace(',', '');
        console.log('collectableamount', collectableamount);
        await page.locator("input[name='cash']").click();
        await page.locator("input[name='cash']").fill(String(Math.ceil(collectableamount / 4)));
        await page.getByRole("button", { name: "Collection Details" }).click();
        await page.getByRole("button", { name: "Update" }).click();
        await page.getByRole('link', { name: 'Invoice List' }).click();
        await page.waitForTimeout(1000);
        // Click epod icon for this row (may or may not open popup depending on verify flag)
        const epodIcon = page.locator(`tr:nth-child(${rowNumber + 1}) td .fAmufx`).nth(3);
        if (await epodIcon.count() > 0) {
            await epodIcon.click();
            await page.waitForTimeout(500);
            const addImageBtn = page.locator('.ant-modal-content button .iVToiv');
            if (await addImageBtn.count() > 0) {
                console.log('Add More Image button found, uploading file');
                await addImageBtn.click();
                await page.setInputFiles('input[type="file"]', FILE_PATH);
                await page.locator('.ant-modal-body button:has-text("Upload")').click();
                await page.waitForTimeout(2000);
                const closeBtn = page.locator('.ant-modal-wrap:not([style*="display: none"]) .ant-modal-close').first();
                if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await closeBtn.click();
                }
                await page.waitForTimeout(500);
            } else {
                console.log('Epod popup not opened (verify flag may be disabled) — skipping');
            }
        }
        // Click verify/tick icon if it exists
        const verifyIcon = page.locator(`tr:nth-child(${rowNumber + 1}) td .fAmufx`).nth(4);
        if (await verifyIcon.count() > 0) {
            await verifyIcon.click();
            await page.waitForTimeout(500);
        }
        console.log(`Row ${rowNumber} marked as Delivered`);
        return true;
    } catch (err) {
        console.error(`markRowAsDelivered row ${rowNumber} failed:`, err);
        return false;
    }
}

/**
 * Marks a specific table row as Partial Delivered.
 * @param {import('@playwright/test').Page} page
 * @param {number} rowNumber - 1-based row index (1 = first data row)
 */
async function markRowAsPartialDelivered(page, rowNumber) {
    try {
        console.log(`markRowAsPartialDelivered: row ${rowNumber}`);
        await page.locator(`tr:nth-child(${rowNumber + 1}) td:nth-child(7) .ant-select-selector`).click();
        await page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
        await page.locator('.ant-select-dropdown .ant-select-item:has-text("Partial Delivered"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)').first().click();
        await page.getByRole("button", { name: "OK" }).click();
        await page.getByRole("button", { name: "Yes" }).click();
        let pickedQty = await page.locator('tr td.ant-table-cell:nth-child(3) .sc-bczRLJ').first().innerText();
        let halfPickedQty = Math.ceil(Number(pickedQty) / 2);
        if (halfPickedQty < 1) halfPickedQty = 1;
        console.log(`pickedQty: ${pickedQty}, halfPickedQty: ${halfPickedQty}`);
        await page.locator('tr td.ant-table-cell:nth-child(5) input').click();
        await page.locator('tr td.ant-table-cell:nth-child(5) input').fill(String(halfPickedQty));
        await page.locator('#return_reason0').click();
        await page.getByText('Product Not Required').click();
        await page.getByRole("button", { name: "Delivery Details" }).click();
        await page.getByRole("button", { name: "Update" }).click();
        await page.getByRole("radio", { name: "Invoice Returned" }).check();
        let collectableamount = await page.locator(`div[class='sc-bczRLJ sc-gsnTZi jkiZmR jnFvAE'] div:nth-child(2) div:nth-child(2) span:nth-child(1)`).innerText();
        collectableamount = collectableamount.replace('₹', '').replace(',', '');
        console.log('collectableamount', collectableamount);
        await page.locator("input[name='cash']").click();
        await page.locator("input[name='cash']").fill(String(Math.ceil(collectableamount / 4)));
        await page.getByRole("button", { name: "Collection Details" }).click();
        await page.getByRole("button", { name: "Update" }).click();
        await page.getByRole('link', { name: 'Invoice List' }).click();
        await page.waitForTimeout(1000);
        const pdEpodIcon = page.locator(`tr:nth-child(${rowNumber + 1}) td .fAmufx`).nth(3);
        if (await pdEpodIcon.count() > 0) {
            await pdEpodIcon.click();
            await page.waitForTimeout(500);
            const addImageBtn = page.locator('.ant-modal-content button .iVToiv');
            if (await addImageBtn.count() > 0) {
                console.log('Add More Image button found, uploading file');
                await addImageBtn.click();
                await page.setInputFiles('input[type="file"]', FILE_PATH);
                await page.locator('.ant-modal-body button:has-text("Upload")').click();
                await page.waitForTimeout(2000);
                const closeBtn = page.locator('.ant-modal-wrap:not([style*="display: none"]) .ant-modal-close').first();
                if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await closeBtn.click();
                }
                await page.waitForTimeout(500);
            } else {
                console.log('Epod popup not opened (verify flag may be disabled) — skipping');
            }
        }
        const pdVerifyIcon = page.locator(`tr:nth-child(${rowNumber + 1}) td .fAmufx`).nth(4);
        if (await pdVerifyIcon.count() > 0) {
            await pdVerifyIcon.click();
            await page.waitForTimeout(500);
        }
        console.log(`Row ${rowNumber} marked as Partial Delivered`);
        return true;
    } catch (err) {
        console.error(`markRowAsPartialDelivered row ${rowNumber} failed:`, err);
        return false;
    }
}

/**
 * Marks a specific table row as Delivery Attempted.
 * @param {import('@playwright/test').Page} page
 * @param {number} rowNumber - 1-based row index (1 = first data row)
 */
async function markRowAsDeliveryAttempted(page, rowNumber) {
    try {
        console.log(`markRowAsDeliveryAttempted: row ${rowNumber}`);
        await page.locator(`tr:nth-child(${rowNumber + 1}) td:nth-child(7) .ant-select-selector`).click();
        await page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
        await page.locator('.ant-select-dropdown .ant-select-item:has-text("Delivery Attempted"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)').first().click();
        await page.getByRole("button", { name: "OK" }).click();
        await page.getByRole("button", { name: "Yes" }).click();
        await page.locator('#reason').click();
        await page.getByText('Shop Closed').click();
        await page.getByRole("button", { name: "Delivery Details" }).click();
        await page.getByRole("button", { name: "Update" }).click();
        await page.waitForTimeout(700);
        await page.locator(`tr:nth-child(${rowNumber + 1}) td .fAmufx`).nth(4).click();
        console.log(`Row ${rowNumber} marked as Delivery Attempted`);
        return true;
    } catch (err) {
        console.error(`markRowAsDeliveryAttempted row ${rowNumber} failed:`, err);
        return false;
    }
}

/**
 * Uploads the invoice document twice and clicks Verify to close the RFC.
 * Call this after all row-level delivery actions are done.
 * @param {import('@playwright/test').Page} page
 */
async function rfcClose(page) {
    try {
        console.log('rfcClose: uploading documents and verifying');
        await page.locator('button:has-text("Upload Inv & Other Doc")').click();
        await page.setInputFiles('input[type="file"]', FILE_PATH);
        await page.locator('button.giRYTO .iVToiv').click();
        console.log('First file uploaded');
        await page.locator('button:has-text("Upload Inv & Other Doc")').click();
        await page.setInputFiles('input[type="file"]', FILE_PATH);
        await page.locator('button.giRYTO .iVToiv').click();
        console.log('Second file uploaded');
        await page.waitForTimeout(1000);
        await page.getByRole('button', { name: 'Verify' }).click();
        console.log('RFC closed successfully');
        return true;
    } catch (err) {
        console.error('rfcClose failed:', err);
        return false;
    }
}

module.exports = { markRowAsDelivered, markRowAsPartialDelivered, markRowAsDeliveryAttempted, rfcClose };
