const path = require('path');
const { markRowAsDelivered, markRowAsPartialDelivered, markRowAsDeliveryAttempted, rfcClose } = require('../utils/delivery-actions.utils');
const loginLocators = require('../locators/login.locators');
const dlLocators = require('../locators/dlRfclose.locators');
const { getFCName, getBrandName } = require('../utils/fcbrands');

exports.DlAndRFClosePage = class DlAndRFClosePage {
    constructor(page) {
        this.page = page;
    }

    async _login(username, password) {
        const login = loginLocators(this.page);
        await login.usernameInput.click();
        await login.usernameInput.fill(username);
        await login.loginButton.click();
        await login.passwordInput.click();
        await login.passwordInput.fill(password);
        await login.loginButton.click();
    }

    async _navigateToFirstDelivery() {
        const l = dlLocators(this.page);
        await l.logisticsManagementMenu.click();
        await l.returnToFcLink.click();
        await l.firstDeliveryRow.click();
    }

    async _uploadRfcDocs() {
        const l = dlLocators(this.page);
        const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
        await l.uploadInvDocButton.click();
        await this.page.waitForTimeout(500);
        await l.modalFileInput.setInputFiles(filePath);
        await l.uploadConfirmButton.click();
        await this.page.waitForTimeout(2000);
        console.log('first file Uploaded');
        await l.uploadInvDocButton.click();
        await this.page.waitForTimeout(500);
        await l.modalFileInput.setInputFiles(filePath);
        await l.uploadConfirmButton.click();
        await this.page.waitForTimeout(2000);
        console.log('second file Uploaded');
    }

    async dlrfclose(username, password) {
        try {
            await this._login(username, password);
            await this._navigateToFirstDelivery();
            console.log('step 1 done');
            await this.page.waitForTimeout(3000);
            console.log('step 2 done');
            await this.page.waitForTimeout(2000);
            const l = dlLocators(this.page);
            const rowCount1 = await l.allBodyRows.count();
            const allRows = await l.allBodyRows.all();
            console.log(`tbody tr count: ${rowCount1} and allRows length: ${allRows.length}`);
            await this.processDeliveryItems(Math.max(rowCount1 - 1, allRows.length - 1));
            console.log('All delivery items processed and out of loop');
            await this._uploadRfcDocs();
            console.log('Delivered and RFC process completed successfully');
            return true;
        } catch (err) {
            console.error('Delivered process failed:');
            return false;
        }
    }

    async processDeliveryItems(itemCount) {
        const l = dlLocators(this.page);
        const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
        console.log(`Processing step 1`);
        try {
            for (let i = 0; i < itemCount; i++) {
                const status = await l.statusDropdownNth(i + 2).innerText();
                console.log('===========================', status);
                if (status === 'Delivered') continue;

                await l.statusDropdownNth(i + 2).click();
                await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                await l.deliveredStatusOption.click();
                await l.okButton.click();
                await l.yesButton.click();
                await l.deliveryDetailsButton.click();
                await l.updateButton.click();
                await l.invoiceReturnedRadio.check();

                let collectableamount = await l.collectableAmountCell.innerText();
                collectableamount = collectableamount.replace('₹', '').replace(',', '');
                await l.cashInput.click();
                await l.cashInput.fill(String(Math.ceil(collectableamount / 4)));
                await l.collectionDetailsButton.click();
                await l.updateButton.click();
                await l.invoiceListLink.click();
                await this.page.waitForTimeout(700);
                await l.rowActionIconNth(i + 2, 3).click();

                const addImageBtn = l.addImageBtn;
                if (await addImageBtn.count() > 0) {
                    console.log('Add More Image button found, proceeding to upload file');
                    await addImageBtn.click();
                    await l.modalFileInput.setInputFiles(filePath);
                    await l.modalUploadButton.click();
                    await l.podDialogCloseButton.click();
                    await l.rowActionIconNth(i + 2, 4).click();
                } else {
                    console.log('Add More Image button not found');
                }
            }
            return true;
        } catch (err) {
            console.error('Error processing delivery items:', err);
            return false;
        }
    }

    async dlrfclosefullcollection(username, password) {
        try {
            await this._login(username, password);
            await this._navigateToFirstDelivery();
            console.log('step 1 done');
            await this.page.waitForTimeout(3000);
            await this.page.waitForTimeout(2000);
            const l = dlLocators(this.page);
            const rowCount1 = await l.allBodyRows.count();
            const allRows = await l.allBodyRows.all();
            console.log(`tbody tr count: ${rowCount1} and allRows length: ${allRows.length}`);
            await this.processDeliveryItemsfullcollection(Math.max(rowCount1 - 1, allRows.length - 1));
            console.log('All delivery items processed and out of loop');
            await this._uploadRfcDocs();
            console.log('Delivered and RFC process completed successfully');
            return true;
        } catch (err) {
            console.error('Delivered process failed:');
            return false;
        }
    }

    async processDeliveryItemsfullcollection(itemCount) {
        const l = dlLocators(this.page);
        const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
        console.log(`Processing step 1`);
        try {
            for (let i = 0; i < itemCount; i++) {
                const status = await l.statusDropdownNth(i + 2).innerText();
                console.log('===========================', status);
                if (status === 'Delivered') continue;

                await l.statusDropdownNth(i + 2).click();
                await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                await l.deliveredStatusOption.click();
                await l.okButton.click();
                await l.yesButton.click();
                await l.deliveryDetailsButton.click();
                await l.updateButton.click();
                await l.invoiceSettledRadio.check();

                let collectableamount = await l.collectableAmountCellV2.innerText();
                collectableamount = collectableamount.replace('₹', '').replace(',', '');
                await l.cashInput.click();
                await l.cashInput.fill(String(Math.ceil(collectableamount)));
                await l.collectionDetailsButton.click();
                await l.updateButton.click();
                await l.invoiceListLink.click();
                await this.page.waitForTimeout(700);
                await l.rowActionIconNth(i + 2, 3).click();

                const addImageBtn = l.addImageBtn;
                if (await addImageBtn.count() > 0) {
                    console.log('Add More Image button found, proceeding to upload file');
                    await addImageBtn.click();
                    await l.modalFileInput.setInputFiles(filePath);
                    await l.modalUploadButton.click();
                    await l.podDialogCloseButton.click();
                    await l.rowActionIconNth(i + 2, 4).click();
                } else {
                    console.log('Add More Image button not found');
                }
            }
            return true;
        } catch (err) {
            console.error('Error processing delivery items:', err);
            return false;
        }
    }

    async PartialDeliveredFullCollectionRfcClose(username, password) {
        try {
            await this._login(username, password);
            await this._navigateToFirstDelivery();
            console.log('step 1 done');
            await this.page.waitForTimeout(3000);
            await this.page.waitForTimeout(2000);
            const l = dlLocators(this.page);
            const rowCount1 = await l.allBodyRows.count();
            const allRows = await l.allBodyRows.all();
            console.log(`tbody tr count: ${rowCount1} and allRows length: ${allRows.length}`);
            await this.processartialDlPartialCollection(Math.max(rowCount1 - 1, allRows.length - 1));
            console.log('All delivery items processed and out of loop');
            await this._uploadRfcDocs();
            console.log('Delivered and RFC process completed successfully');
            return true;
        } catch (err) {
            console.error('Delivered process failed:');
            return false;
        }
    }

    async processartialDlPartialCollection(itemCount) {
        const l = dlLocators(this.page);
        const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
        console.log(`Processing step 1`);
        try {
            for (let i = 0; i < itemCount; i++) {
                const status = await l.statusDropdownNth(i + 2).innerText();
                console.log('===========================', status);
                if (['Delivered', 'Partial Delivered', 'Delivery Attempted'].includes(status)) continue;

                await l.statusDropdownNth(i + 2).click();
                await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                await l.partialDeliveredOption.click();
                await l.okButton.click();
                await l.yesButton.click();

                let PickedQty = await l.pickedQtyCell.innerText();
                let halfPickedQty = Math.max(1, Math.ceil(Number(PickedQty) / 2));
                await l.deliveredQtyInput.click();
                await l.deliveredQtyInput.fill(String(halfPickedQty));
                await l.returnReasonDropdown.click();
                await l.productNotRequiredOption.click();

                await l.deliveryDetailsButton.click();
                await l.updateButton.click();
                await l.invoiceSettledRadio.check();

                let collectableamount = await l.collectableAmountCellV2.innerText();
                collectableamount = collectableamount.replace('₹', '').replace(',', '');
                await l.cashInput.click();
                await l.cashInput.fill(String(Math.ceil(collectableamount)));
                await l.collectionDetailsButton.click();
                await l.updateButton.click();
                await l.invoiceListLink.click();
                await this.page.waitForTimeout(700);
                await l.rowActionIconNth(i + 2, 3).click();

                const addImageBtn = l.addImageBtn;
                if (await addImageBtn.count() > 0) {
                    console.log('Add More Image button found, proceeding to upload file');
                    await addImageBtn.click();
                    await l.modalFileInput.setInputFiles(filePath);
                    await l.modalUploadButton.click();
                    await l.podDialogCloseButton.click();
                    await l.rowActionIconNth(i + 2, 4).click();
                } else {
                    console.log('Add More Image button not found');
                }
            }
            return true;
        } catch (err) {
            console.error('Error processing delivery items:', err);
            return false;
        }
    }

    async DeliveryAttemptRfcClose(username, password) {
        try {
            await this._login(username, password);
            await this._navigateToFirstDelivery();
            console.log('step 1 done');
            await this.page.waitForTimeout(3000);
            await this.page.waitForTimeout(2000);
            const l = dlLocators(this.page);
            const rowCount1 = await l.allBodyRows.count();
            const allRows = await l.allBodyRows.all();
            console.log(`tbody tr count: ${rowCount1} and allRows length: ${allRows.length}`);
            await this.processDliveryAttempt(Math.max(rowCount1 - 1, allRows.length - 1));
            console.log('All delivery items processed and out of loop');
            await l.verifyButton.click();
            console.log('Delivery Attempt and RFC process completed successfully');
            return true;
        } catch (err) {
            console.error('Delivery Attempt process failed:');
            return false;
        }
    }

    async processDliveryAttempt(itemCount) {
        const l = dlLocators(this.page);
        console.log(`Processing step 1`);
        try {
            for (let i = 0; i < itemCount; i++) {
                const status = await l.statusDropdownNth(i + 2).innerText();
                console.log('==============', status);
                if (['Delivered', 'Partial Delivered', 'Delivery Attempted'].includes(status)) continue;

                await l.statusDropdownNth(i + 2).click();
                await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                await l.deliveryAttemptedOption.click();
                await l.okButton.click();
                await l.yesButton.click();
                await l.attemptReasonDropdown.click();
                await l.shopClosedOption.click();
                await l.deliveryDetailsButton.click();
                await l.updateButton.click();
                await this.page.waitForTimeout(700);
                await l.rowActionIconNth(i + 2, 4).click();
            }
            return true;
        } catch (err) {
            console.error('Error processing delivery items:', err);
            return false;
        }
    }

    async DeliveryActionOnEachRow(username, password) {
        try {
            await this._login(username, password);
            await this._navigateToFirstDelivery();
            await this.page.waitForTimeout(2000);
            const l = dlLocators(this.page);
            const rowCount1 = await l.allBodyRows.count();
            const allRows = await l.allBodyRows.all();
            console.log(`tbody tr count: ${rowCount1} and allRows length: ${allRows.length}`);
            await this.ActionOnEachRow(Math.max(rowCount1 - 1, allRows.length - 1));
            console.log('All delivery items processed and out of loop');
            await rfcClose(this.page);
            console.log('Delivered and RFC process completed successfully');
            return true;
        } catch (err) {
            console.error('Delivered process failed:');
            return false;
        }
    }

    async ActionOnEachRow(itemCount) {
        const l = dlLocators(this.page);
        console.log(`Processing step 1`);
        try {
            for (let i = 0; i < itemCount; i++) {
                const rowNumber = i + 1;
                const status = await l.statusDropdownNth(i + 2).innerText();
                if (['Delivered', 'Partial Delivered', 'Delivery Attempted'].includes(status)) {
                    console.log(`${status} skipped`);
                    continue;
                }
                if (i % 3 === 0) {
                    console.log(`Row ${rowNumber}: marking as Delivered`);
                    await markRowAsDelivered(this.page, rowNumber);
                } else if (i % 3 === 1) {
                    console.log(`Row ${rowNumber}: marking as Partial Delivered`);
                    await markRowAsPartialDelivered(this.page, rowNumber);
                } else {
                    console.log(`Row ${rowNumber}: marking as Delivery Attempted`);
                    await markRowAsDeliveryAttempted(this.page, rowNumber);
                }
            }
            return true;
        } catch (err) {
            console.error('Error processing delivery items:', err);
            return false;
        }
    }

    /**
     * Unified delivery flow: login → navigate to Return To FC → filter by FC/brand →
     * open first delivery → apply action (DL/PD/DA/CA) on all rows → RFC close.
     *
     * @param {string} username
     * @param {string} password
     * @param {string} fc       - FC code (e.g. 'bgrd')
     * @param {string} brand    - Brand code (e.g. 'snpr')
     * @param {string[]} actionSeq - array of action codes e.g. ['DL','PD','DA','CA'], cycles for more rows
     */
    async deliveryFlowWithFcBrand(username, password, fc, brand, actionSeq = ['DL']) {
        const l = dlLocators(this.page);
        try {
            await this._login(username, password);

            // Navigate to Return To FC
            await l.logisticsManagementMenu.click();
            await l.returnToFcLink.click();
            await this.page.waitForTimeout(2000);

            // Filter by FC
            const fcName = getFCName(fc);
            await l.fcFilterCombobox.click();
            await l.fcFilterCombobox.pressSequentially(fc, { delay: 50 });
            await l.visibleDropdownOption(fcName).waitFor({ state: 'visible', timeout: 5000 });
            await l.visibleDropdownOption(fcName).click();
            console.log(`FC selected: ${fcName}`);

            // Filter by Brand
            const brandName = getBrandName(brand);
            await l.brandFilterCombobox.click();
            await l.brandFilterCombobox.pressSequentially(brand, { delay: 50 });
            await l.visibleDropdownOption(brandName).waitFor({ state: 'visible', timeout: 5000 });
            await l.visibleDropdownOption(brandName).click();
            console.log(`Brand selected: ${brandName}`);

            // Dismiss any open dropdown before clicking Search
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(300);

            await l.searchButton.click();
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            await this.page.waitForTimeout(1000);

            // Open first delivery
            await l.firstDeliveryRow.click();
            await this.page.waitForTimeout(3000);

            const rowCount = await l.allBodyRows.count();
            const itemCount = Math.max(rowCount - 1, 0);
            console.log(`Found ${itemCount} invoice row(s), sequence: ${actionSeq.join(' → ')} (cycles)`);

            // Process each row with the action from the sequence (cycling)
            let needsDocUpload = false;
            for (let i = 0; i < itemCount; i++) {
                const rowNumber = i + 1;
                const action = actionSeq[i % actionSeq.length];
                const status = (await l.statusDropdownNth(i + 2).innerText()).trim();
                const doneStatuses = ['Delivered', 'Partial Delivered', 'Partial Delivery', 'Delivery Attempted', 'Cancelled'];

                if (doneStatuses.some(s => status.includes(s))) {
                    console.log(`Row ${rowNumber}: already "${status}" — skipped`);
                    continue;
                }

                console.log(`Row ${rowNumber}: ${action}`);
                if (action === 'DL') {
                    await markRowAsDelivered(this.page, rowNumber);
                    needsDocUpload = true;
                } else if (action === 'PD') {
                    await markRowAsPartialDelivered(this.page, rowNumber);
                    needsDocUpload = true;
                } else if (action === 'DA') {
                    await markRowAsDeliveryAttempted(this.page, rowNumber);
                } else if (action === 'CA') {
                    await l.statusDropdownNth(i + 2).click();
                    await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                    await l.cancelledOption.click();
                    await l.okButton.click();
                    await l.yesButton.click();
                    await l.attemptReasonDropdown.click();
                    await l.shopClosedOption.click();
                    await l.deliveryDetailsButton.click();
                    await l.updateButton.click();
                    await this.page.waitForTimeout(700);
                    await l.rowActionIconNth(i + 2, 4).click();
                    console.log(`Row ${rowNumber} marked as Cancelled`);
                }
            }

            // Navigate to Invoice List to ensure we're on the right page
            try {
                await l.invoiceListLink.click();
                await this.page.waitForTimeout(1000);
            } catch {
                // Already on Invoice List
            }

            // Upload docs if any row was DL or PD
            if (needsDocUpload) {
                const uploadBtn = l.uploadInvDocButton;
                try {
                    await uploadBtn.waitFor({ state: 'visible', timeout: 15000 });
                    await this.page.waitForTimeout(2000);
                    if (await uploadBtn.isDisabled()) {
                        console.log('Upload Inv & Other Doc still disabled — skipping doc upload');
                    } else {
                        await this._uploadRfcDocs();
                    }
                } catch {
                    console.log('Upload Inv & Other Doc button not found — skipping');
                }
            }

            // Try to click Verify if enabled
            try {
                await l.verifyButton.waitFor({ state: 'visible', timeout: 5000 });
                const isDisabled = await l.verifyButton.isDisabled();
                if (!isDisabled) {
                    await l.verifyButton.click();
                    console.log('Verify clicked — RFC closed');
                } else {
                    console.log('Verify button is disabled — some rows may need prior action completion');
                }
            } catch {
                console.log('Verify button not found — skipping RFC close');
            }

            console.log(`Delivery flow completed: ${actionSeq.join(',')}`);
            return true;
        } catch (err) {
            console.error(`Delivery flow failed:`, err);
            return false;
        }
    }

    async _processCancelled(itemCount) {
        const l = dlLocators(this.page);
        try {
            for (let i = 0; i < itemCount; i++) {
                const status = await l.statusDropdownNth(i + 2).innerText();
                console.log(`Row ${i + 1} status: ${status}`);
                if (['Delivered', 'Partial Delivered', 'Delivery Attempted', 'Cancelled'].includes(status)) continue;

                await l.statusDropdownNth(i + 2).click();
                await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                await l.cancelledOption.click();
                await l.okButton.click();
                await l.yesButton.click();
                await l.attemptReasonDropdown.click();
                await l.shopClosedOption.click();
                await l.deliveryDetailsButton.click();
                await l.updateButton.click();
                await this.page.waitForTimeout(700);
                await l.rowActionIconNth(i + 2, 4).click();
                console.log(`Row ${i + 1} marked as Cancelled`);
            }
            return true;
        } catch (err) {
            console.error('Error processing cancelled items:', err);
            return false;
        }
    }

    /**
     * Mixed delivery: cycles through DL, PD, DA, CA for each row.
     * Row 1 → Delivered, Row 2 → Partial Delivered, Row 3 → Delivery Attempted, Row 4 → Cancelled, Row 5 → Delivered...
     */
    async _processMixed(itemCount) {
        const MIXED_ORDER = ['DL', 'PD', 'DA', 'CA'];
        try {
            for (let i = 0; i < itemCount; i++) {
                const rowNumber = i + 1;
                const actionType = MIXED_ORDER[i % 4];
                const l = dlLocators(this.page);
                const status = await l.statusDropdownNth(i + 2).innerText();
                if (['Delivered', 'Partial Delivered', 'Delivery Attempted', 'Cancelled'].includes(status)) {
                    console.log(`Row ${rowNumber}: already ${status} — skipped`);
                    continue;
                }

                console.log(`Row ${rowNumber}: marking as ${actionType}`);
                if (actionType === 'DL') {
                    await markRowAsDelivered(this.page, rowNumber);
                } else if (actionType === 'PD') {
                    await markRowAsPartialDelivered(this.page, rowNumber);
                } else if (actionType === 'DA') {
                    await markRowAsDeliveryAttempted(this.page, rowNumber);
                } else if (actionType === 'CA') {
                    // Cancel follows same pattern as DA but with Cancelled option
                    await l.statusDropdownNth(i + 2).click();
                    await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                    await l.cancelledOption.click();
                    await l.okButton.click();
                    await l.yesButton.click();
                    await l.attemptReasonDropdown.click();
                    await l.shopClosedOption.click();
                    await l.deliveryDetailsButton.click();
                    await l.updateButton.click();
                    await this.page.waitForTimeout(700);
                    await l.rowActionIconNth(i + 2, 4).click();
                    console.log(`Row ${rowNumber} marked as Cancelled`);
                }
            }
            return true;
        } catch (err) {
            console.error('Error processing mixed delivery:', err);
            return false;
        }
    }
};
