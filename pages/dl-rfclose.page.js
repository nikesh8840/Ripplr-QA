const path = require('path');
const { markRowAsDelivered, markRowAsPartialDelivered, markRowAsDeliveryAttempted, rfcClose } = require('../utils/delivery-actions.utils');
const loginLocators = require('../locators/login.locators');
const dlLocators = require('../locators/dlRfclose.locators');

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
        await l.modalFileInput.setInputFiles(filePath);
        await l.uploadConfirmButton.click();
        console.log('first file Uploaded');
        await l.uploadInvDocButton.click();
        await l.modalFileInput.setInputFiles(filePath);
        await l.uploadConfirmButton.click();
        console.log('second file Uploaded');
        await this.page.waitForTimeout(1000);
        await l.verifyButton.click();
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
};
