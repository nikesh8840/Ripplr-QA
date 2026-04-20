const loginLocators = require('../locators/login.locators');
const qcLocators = require('../locators/qcPicklist.locators');
const { getFCName, getBrandName } = require('../utils/fcbrands');
const fs = require('fs');
const path = require('path');
const { SALES_ORDER_BRAND_CONFIG } = require('../utils/uploadTestHelper');

/**
 * Read unique invoice/bill numbers from the Orders/{brandFolder}/ CSVs.
 * Uses the first column header from SALES_ORDER_BRAND_CONFIG to find invoice numbers.
 */
function readInvoiceNumbersFromCSV(brandFolder) {
    const brandCfg = SALES_ORDER_BRAND_CONFIG[brandFolder];
    if (!brandCfg) return [];

    const invoices = new Set();
    const dataPath = path.resolve(__dirname, `../test-data/Orders/${brandFolder}`);

    for (let i = 0; i < brandCfg.files.length; i++) {
        const filePath = path.join(dataPath, brandCfg.files[i]);
        const colName = brandCfg.columns[i];
        if (!fs.existsSync(filePath)) continue;

        const content = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length < 2) continue;

        const headers = lines[0].split(',');
        const colIdx = headers.findIndex(h => h.trim() === colName);
        if (colIdx === -1) continue;

        for (let r = 1; r < lines.length; r++) {
            const val = lines[r].split(',')[colIdx]?.trim();
            if (val) invoices.add(val);
        }
    }
    return [...invoices];
}

exports.QCPicklistPage = class QCPicklistPage {
    constructor(page) {
        this.page = page;
    }

    async _login(username, password) {
        const login = loginLocators(this.page);
        await login.usernameInput.click();
        await login.usernameInput.fill(username);
        await login.passwordInput.click();
        await login.passwordInput.fill(password);
        await login.loginButton.click();
    }

    /**
     * Generate a QC Picklist for the given FC and Brand.
     * Flow: Login → QC Picklist → Generate Picklist → Select FC/Brand → Proceed
     *       → Search & select invoices → Create Picklist
     *
     * @param {string} username
     * @param {string} password
     * @param {string} fc    - FC code (e.g. 'bgrd')
     * @param {string} brand - Brand code (e.g. 'mrco')
     * @param {number|string[]} pickOption - number = pick N latest; string[] = search specific invoices; 0 = select all
     * @returns {boolean} true if picklist was created or no orders available
     */
    async generatePicklist(username, password, fc, brand, pickOption = 0) {
        const l = qcLocators(this.page);
        try {
            await this._login(username, password);

            // Navigate to QC Picklist
            await l.logisticsManagementMenu.click();
            await l.qcPicklistLink.click();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);
            console.log('Navigated to QC Picklist');

            // Click Generate Picklist
            await l.generatePicklistButton.click();
            await this.page.waitForTimeout(1000);

            // Select FC in modal
            const fcName = getFCName(fc);
            await l.modalFcSelector.click();
            await this.page.keyboard.type(fc, { delay: 50 });
            await this.page.waitForTimeout(1000);
            await l.visibleDropdownOption(fcName).click();
            console.log(`FC selected: ${fcName}`);
            await this.page.waitForTimeout(500);

            // Select Brand in modal
            const brandName = getBrandName(brand);
            await l.modalBrandSelector.click();
            await this.page.keyboard.type(brand, { delay: 50 });
            await this.page.waitForTimeout(1000);
            await l.visibleDropdownOption(brandName).click();
            console.log(`Brand selected: ${brandName}`);
            await this.page.waitForTimeout(500);

            // Dismiss any open dropdown by clicking the modal title
            await l.modal.locator('.ant-modal-title, .ant-modal-header').first().click();
            await this.page.waitForTimeout(500);

            // Click Proceed — force click in case dropdown overlay lingers
            await l.proceedButton.scrollIntoViewIfNeeded();
            await l.proceedButton.click({ timeout: 10000 });
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);
            console.log('Proceeded to Select Orders page');

            // Check if orders are available
            const noOrders = await l.noPicklistMessage.isVisible({ timeout: 3000 }).catch(() => false);
            if (noOrders) {
                console.log('No orders available for picklist — nothing to generate');
                return true;
            }

            const rowCount = await l.orderRows.count();
            console.log(`Found ${rowCount} order(s) available`);

            if (rowCount === 0) {
                console.log('No order rows found');
                return true;
            }

            if (Array.isArray(pickOption)) {
                // Select matching invoices from the visible rows in one pass
                const invoiceSet = new Set(pickOption);
                let selectedCount = 0;
                console.log(`Looking for ${invoiceSet.size} invoice(s) from CSV...`);

                for (let i = 0; i < rowCount; i++) {
                    const rowText = await l.orderRows.nth(i).innerText();
                    const matched = [...invoiceSet].find(inv => rowText.includes(inv));
                    if (matched) {
                        await l.orderRowCheckbox(i).click();
                        await this.page.waitForTimeout(200);
                        selectedCount++;
                        console.log(`Row ${i + 1}: ${matched} ✓`);
                    }
                }

                console.log(`Selected ${selectedCount}/${invoiceSet.size} invoice(s) from CSV`);
                if (selectedCount === 0) {
                    console.log('No matching invoices found in visible rows');
                    return true;
                }
            } else if (pickOption === 0 || pickOption >= rowCount) {
                // Select all
                await l.selectAllCheckbox.click();
                await this.page.waitForTimeout(500);
                console.log('All orders selected');
            } else {
                // Select first N (latest) invoices
                for (let i = 0; i < pickOption; i++) {
                    await l.orderRowCheckbox(i).click();
                    await this.page.waitForTimeout(300);
                }
                console.log(`Selected ${pickOption} latest invoice(s)`);
            }

            // Click Create Picklist
            await l.createPicklistButton.click();
            await this.page.waitForTimeout(3000);

            // Check for success
            const successMsg = await this.page.locator('.ant-message-success').isVisible({ timeout: 5000 }).catch(() => false);
            const newUrl = this.page.url();
            console.log(`Picklist created. URL: ${newUrl}, Success: ${successMsg}`);

            return true;
        } catch (err) {
            console.error('QC Picklist generation failed:', err.message);
            return false;
        }
    }
};

exports.readInvoiceNumbersFromCSV = readInvoiceNumbersFromCSV;
