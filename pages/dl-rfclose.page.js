
const path = require('path');
const { markRowAsDelivered, markRowAsPartialDelivered, markRowAsDeliveryAttempted, rfcClose } = require('../utils/delivery-actions.utils');
const { login } = require('./login.page');

exports.DlAndRFClosePage = class DlAndRFClosePage {
    constructor(page) {
        this.page = page;
    }

    async dlrfclose(username, password) {
      try {     
        const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
        await this.page.getByRole("textbox", { name: "User ID User ID" }).click();
        await this.page.getByRole("textbox", { name: "User ID User ID" }).fill(username);
        await this.page.getByRole("button", { name: "Login" }).click();
        await this.page.getByRole("textbox", { name: "Password Password" }).click();
        await this.page.getByRole("textbox", { name: "Password Password" }).fill(password);
        await this.page.getByRole("button", { name: "Login" }).click();
        await this.page.getByText("Logistics Management").click();
        await this.page.getByRole("link", { name: "Return To Fc" }).click();
        await this.page.locator("tr .ccyvke a").nth(0).click();
        console.log('step 1 done');
        await this.page.waitForTimeout(3000); // Wait for any dynamic loading
        // await this.page.waitForSelector('tbody tr', { timeout: 10000 });
        console.log('step 2 done');
        await this.page.waitForTimeout(2000);
        const rowCount1 = await this.page.locator('tbody tr').count();
        const allRows = await this.page.locator('tbody tr').all();
        console.log('step 3 done');
        console.log(`tbody tr count: ${rowCount1} and allRows length: ${allRows.length}`);
        await this.processDeliveryItems(Math.max(rowCount1-1, allRows.length-1));
        console.log('All delivery items processed and out of loop');
        // await this.page.locator('.bEwzzI').click();
        await this.page.locator('button:has-text("Upload Inv & Other Doc")').click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        // await this.page.locator('.bWEHjs').click();
        await this.page.locator('button.giRYTO .iVToiv').click();
        console.log('first file Uploaded');
        await this.page.locator('button:has-text("Upload Inv & Other Doc")').click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        await this.page.locator('button.giRYTO .iVToiv').click();
        console.log('second file Uploaded');
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('button', { name: 'Verify' }).click();
        console.log('Delivered and RFC process completed successfully');
        return true;
      } catch (err) {
        console.error('Delivered process failed:');
        return false;
        }
      }
      
    async processDeliveryItems(itemCount) {
        console.log(`Processing step 1`);
        try {
            console.log(`step 2 and len ` + itemCount);
            for(let i = 0; i < itemCount; i++) {
                const status = await this.page.locator(`tr:nth-child(${i+2}) td:nth-child(7) .ant-select-selector`).innerText();
                console.log('===========================',status);
                if(status == "Delivered"){
                    continue;
                }
                
                // if(i%2==0){
                //     await this.page.locator(`tr:nth-child(${i+1}) td:nth-child(8) .ant-select-selector`).click();
                // await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                // await this.page.locator('.ant-select-dropdown .ant-select-item:has-text("Delivered"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)').first().click();
                // await this.page.getByRole("button", { name: "OK" }).click();
                // await this.page.getByRole("button", { name: "Yes" }).click();
                // await this.page.getByRole("button", { name: "right Delivery Details" }).click();
                // await this.page.getByRole("button", { name: "Update" }).click();
                // await this.page.getByRole("radio", { name: "Invoice Returned" }).check();
                // await this.page.getByRole("button", { name: "right Collection Details:" }).click();
                // await this.page.getByRole("button", { name: "Update" }).click();
                // await this.page.getByRole('link', {name: 'Invoice List'}).click();
                // await this.page.waitForTimeout(700);
                // await this.page.locator(`tr:nth-child(${i+1}) td .fAmufx`).nth(3).click();
                // }
                // else{
                await this.page.locator(`tr:nth-child(${i+2}) td:nth-child(7) .ant-select-selector`).click();
                await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                await this.page.locator('.ant-select-dropdown .ant-select-item:has-text("Delivered"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)').first().click();
                await this.page.getByRole("button", { name: "OK" }).click();
                await this.page.getByRole("button", { name: "Yes" }).click();
                await this.page.getByRole("button", { name: "Delivery Details" }).click();
                await this.page.getByRole("button", { name: "Update" }).click();
                await this.page.getByRole("radio", { name: "Invoice Returned" }).check();
                let collectableamount = await this.page.locator(`div[class='sc-bczRLJ sc-gsnTZi jkiZmR jnFvAE'] div:nth-child(2) div:nth-child(2) span:nth-child(1)`).innerText();
                collectableamount = collectableamount.replace('₹', '').replace(',', '');
                collectableamount = (collectableamount);
                console.log('collectableamount type',typeof collectableamount);
                console.log('collectableamount',collectableamount);
                await this.page.locator("input[name='cash']").click();
                await this.page.locator("input[name='cash']").fill(String(Math.ceil(collectableamount/4)));
                await this.page.getByRole("button", { name: "Collection Details" }).click();
                await this.page.getByRole("button", { name: "Update" }).click();
                await this.page.getByRole('link', {name: 'Invoice List'}).click();
                await this.page.waitForTimeout(700);
                await this.page.locator(`tr:nth-child(${i+2}) td .fAmufx`).nth(3).click();
                const addImageBtn = await this.page.locator('.ant-modal-content button .iVToiv');
                if(await addImageBtn.count() > 0) {
                    console.log('Add More Image button found, proceeding to upload file');
                    const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
                    await addImageBtn.click();
                    // await this.page.locator('.ant-upload-drag-container .jCxLyX').click();
                    await this.page.setInputFiles('input[type="file"]', filePath);
                    await this.page.locator('.ant-modal-body button:has-text("Upload")').click();
                    await this.page.getByRole('dialog').filter({ hasText: 'Proof of DeliveryVerify Proof' }).getByLabel('Close', { exact: true }).click();
                    await this.page.locator(`tr:nth-child(${i+2}) td .fAmufx`).nth(4).click();
                }else{
                    console.log('Add More Image button not found');
                }
                // }
            }
            return true;
        } catch (err) {
            console.error('Error processing delivery items:', err);
            return false;
        }
    }
    
    async dlrfclosefullcollection(username, password) {
      try {     
        const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
        await this.page.getByRole("textbox", { name: "User ID User ID" }).click();
        await this.page.getByRole("textbox", { name: "User ID User ID" }).fill(username);
        await this.page.getByRole("button", { name: "Login" }).click();
        await this.page.getByRole("textbox", { name: "Password Password" }).click();
        await this.page.getByRole("textbox", { name: "Password Password" }).fill(password);
        await this.page.getByRole("button", { name: "Login" }).click();
        await this.page.getByText("Logistics Management").click();
        await this.page.getByRole("link", { name: "Return To Fc" }).click();
        await this.page.locator("tr .ccyvke a").nth(0).click();
        console.log('step 1 done');
        await this.page.waitForTimeout(3000); // Wait for any dynamic loading
        // await this.page.waitForSelector('tbody tr', { timeout: 10000 });
        console.log('step 2 done');
        await this.page.waitForTimeout(2000);
        const rowCount1 = await this.page.locator('tbody tr').count();
        const allRows = await this.page.locator('tbody tr').all();
        console.log('step 3 done');
        console.log(`tbody tr count: ${rowCount1} and allRows length: ${allRows.length}`);
        await this.processDeliveryItemsfullcollection(Math.max(rowCount1-1, allRows.length-1));
        console.log('All delivery items processed and out of loop');
        // await this.page.locator('.bEwzzI').click();
        await this.page.locator('button:has-text("Upload Inv & Other Doc")').click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        // await this.page.locator('.bWEHjs').click();
        await this.page.locator('button.giRYTO .iVToiv').click();
        console.log('first file Uploaded');
        await this.page.locator('button:has-text("Upload Inv & Other Doc")').click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        await this.page.locator('button.giRYTO .iVToiv').click();
        console.log('second file Uploaded');
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('button', { name: 'Verify' }).click();
        console.log('Delivered and RFC process completed successfully');
        return true;
      } catch (err) {
        console.error('Delivered process failed:');
        return false;
        }
      }
    
    async processDeliveryItemsfullcollection(itemCount) {
        console.log(`Processing step 1`);
        try {
            console.log(`step 2 and len ` + itemCount);
            for(let i = 0; i < itemCount; i++) {
                const status = await this.page.locator(`tr:nth-child(${i+2}) td:nth-child(7) .ant-select-selector`).innerText();
                console.log('===========================',status);
                if(status == "Delivered"){
                    continue;
                }
                
                // if(i%2==0){
                //     await this.page.locator(`tr:nth-child(${i+1}) td:nth-child(8) .ant-select-selector`).click();
                // await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                // await this.page.locator('.ant-select-dropdown .ant-select-item:has-text("Delivered"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)').first().click();
                // await this.page.getByRole("button", { name: "OK" }).click();
                // await this.page.getByRole("button", { name: "Yes" }).click();
                // await this.page.getByRole("button", { name: "right Delivery Details" }).click();
                // await this.page.getByRole("button", { name: "Update" }).click();
                // await this.page.getByRole("radio", { name: "Invoice Returned" }).check();
                // await this.page.getByRole("button", { name: "right Collection Details:" }).click();
                // await this.page.getByRole("button", { name: "Update" }).click();
                // await this.page.getByRole('link', {name: 'Invoice List'}).click();
                // await this.page.waitForTimeout(700);
                // await this.page.locator(`tr:nth-child(${i+1}) td .fAmufx`).nth(3).click();
                // }
                // else{
                await this.page.locator(`tr:nth-child(${i+2}) td:nth-child(7) .ant-select-selector`).click();
                await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                await this.page.locator('.ant-select-dropdown .ant-select-item:has-text("Delivered"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)').first().click();
                await this.page.getByRole("button", { name: "OK" }).click();
                await this.page.getByRole("button", { name: "Yes" }).click();
                await this.page.getByRole("button", { name: "Delivery Details" }).click();
                await this.page.getByRole("button", { name: "Update" }).click();
                await this.page.getByRole("radio", { name: "Invoice settled" }).check();
                let collectableamount = await this.page.locator(`.ant-col-xs-6:nth-child(12) .sc-kOZHUs`).innerText();
                collectableamount = collectableamount.replace('₹', '').replace(',', '');
                collectableamount = (collectableamount);
                console.log('collectableamount type',typeof collectableamount);
                console.log('collectableamount',collectableamount);
                await this.page.locator("input[name='cash']").click();
                await this.page.locator("input[name='cash']").fill(String(Math.ceil(collectableamount)));
                await this.page.getByRole("button", { name: "Collection Details" }).click();
                await this.page.getByRole("button", { name: "Update" }).click();
                await this.page.getByRole('link', {name: 'Invoice List'}).click();
                await this.page.waitForTimeout(700);
                await this.page.locator(`tr:nth-child(${i+2}) td .fAmufx`).nth(3).click();
                const addImageBtn = await this.page.locator('.ant-modal-content button .iVToiv');
                if(await addImageBtn.count() > 0) {
                    console.log('Add More Image button found, proceeding to upload file');
                    const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
                    await addImageBtn.click();
                    // await this.page.locator('.ant-upload-drag-container .jCxLyX').click();
                    await this.page.setInputFiles('input[type="file"]', filePath);
                    await this.page.locator('.ant-modal-body button:has-text("Upload")').click();
                    await this.page.getByRole('dialog').filter({ hasText: 'Proof of DeliveryVerify Proof' }).getByLabel('Close', { exact: true }).click();
                    await this.page.locator(`tr:nth-child(${i+2}) td .fAmufx`).nth(4).click();
                }else{
                    console.log('Add More Image button not found');
                }
                // }
            }
            return true;
        } catch (err) {
            console.error('Error processing delivery items:', err);
            return false;
        }
    }
    
     async PartialDeliveredFullCollectionRfcClose(username, password) {
      try {     
        const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
        await this.page.getByRole("textbox", { name: "User ID User ID" }).click();
        await this.page.getByRole("textbox", { name: "User ID User ID" }).fill(username);
        await this.page.getByRole("button", { name: "Login" }).click();
        await this.page.getByRole("textbox", { name: "Password Password" }).click();
        await this.page.getByRole("textbox", { name: "Password Password" }).fill(password);
        await this.page.getByRole("button", { name: "Login" }).click();
        await this.page.getByText("Logistics Management").click();
        await this.page.getByRole("link", { name: "Return To Fc" }).click();
        await this.page.locator("tr .ccyvke a").nth(0).click();
        console.log('step 1 done');
        await this.page.waitForTimeout(3000); // Wait for any dynamic loading
        // await this.page.waitForSelector('tbody tr', { timeout: 10000 });
        console.log('step 2 done');
        await this.page.waitForTimeout(2000);
        const rowCount1 = await this.page.locator('tbody tr').count();
        const allRows = await this.page.locator('tbody tr').all();
        console.log('step 3 done');
        console.log(`tbody tr count: ${rowCount1} and allRows length: ${allRows.length}`);
        await this.processartialDlPartialCollection(Math.max(rowCount1-1, allRows.length-1));
        console.log('All delivery items processed and out of loop');
        // await this.page.locator('.bEwzzI').click();
        await this.page.locator('button:has-text("Upload Inv & Other Doc")').click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        // await this.page.locator('.bWEHjs').click();
        await this.page.locator('button.giRYTO .iVToiv').click();
        console.log('first file Uploaded');
        await this.page.locator('button:has-text("Upload Inv & Other Doc")').click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        await this.page.locator('button.giRYTO .iVToiv').click();
        console.log('second file Uploaded');
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('button', { name: 'Verify' }).click();
        console.log('Delivered and RFC process completed successfully');
        return true;
      } catch (err) {
        console.error('Delivered process failed:');
        return false;
        }
      }
    
    async processartialDlPartialCollection(itemCount) {
        console.log(`Processing step 1`);
        try {
            console.log(`step 2 and len ` + itemCount);
            for(let i = 0; i < itemCount; i++) {
                const status = await this.page.locator(`tr:nth-child(${i+2}) td:nth-child(7) .ant-select-selector`).innerText();
                console.log('===========================',status);
                if(status == "Delivered" || status == "Partial Delivered" || status == "Delivery Attempted"){
                    continue;
                }
                
                await this.page.locator(`tr:nth-child(${i+2}) td:nth-child(7) .ant-select-selector`).click();
                await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                await this.page.locator('.ant-select-dropdown .ant-select-item:has-text("Partial Delivered"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)').first().click();
                await this.page.getByRole("button", { name: "OK" }).click();
                await this.page.getByRole("button", { name: "Yes" }).click();
                
                let PickedQty = await this.page.locator('tr td.ant-table-cell:nth-child(3) .sc-bczRLJ').first().innerText();
                console.log('PickedQty', PickedQty);
                let halfPickedQty = Math.ceil(Number(PickedQty)/2);
                if (halfPickedQty < 1) {
                    halfPickedQty=1;
                }
                await this.page.locator('tr td.ant-table-cell:nth-child(5) input').click();
                await this.page.locator('tr td.ant-table-cell:nth-child(5) input').fill(String(halfPickedQty));
                await this.page.locator('#return_reason0').click();
                await this.page.getByText('Product Not Required').click();
                
                await this.page.getByRole("button", { name: "Delivery Details" }).click();
                await this.page.getByRole("button", { name: "Update" }).click();
                await this.page.getByRole("radio", { name: "Invoice settled" }).check();
                let collectableamount = await this.page.locator(`.ant-col-xs-6:nth-child(12) .sc-kOZHUs`).innerText();
                collectableamount = collectableamount.replace('₹', '').replace(',', '');
                collectableamount = (collectableamount);
                console.log('collectableamount type',typeof collectableamount);
                console.log('collectableamount',collectableamount);
                await this.page.locator("input[name='cash']").click();
                await this.page.locator("input[name='cash']").fill(String(Math.ceil(collectableamount)));
                await this.page.getByRole("button", { name: "Collection Details" }).click();
                await this.page.getByRole("button", { name: "Update" }).click();
                await this.page.getByRole('link', {name: 'Invoice List'}).click();
                await this.page.waitForTimeout(700);
                await this.page.locator(`tr:nth-child(${i+2}) td .fAmufx`).nth(3).click();
                const addImageBtn = await this.page.locator('.ant-modal-content button .iVToiv');
                if(await addImageBtn.count() > 0) {
                    console.log('Add More Image button found, proceeding to upload file');
                    const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
                    await addImageBtn.click();
                    await this.page.setInputFiles('input[type="file"]', filePath);
                    await this.page.locator('.ant-modal-body button:has-text("Upload")').click();
                    await this.page.getByRole('dialog').filter({ hasText: 'Proof of DeliveryVerify Proof' }).getByLabel('Close', { exact: true }).click();
                    await this.page.locator(`tr:nth-child(${i+2}) td .fAmufx`).nth(4).click();
                }else{
                    console.log('Add More Image button not found');
                }
                // }
            }
            return true;
        } catch (err) {
            console.error('Error processing delivery items:', err);
            return false;
        }
    }
    
     async DeliveryAttemptRfcClose(username, password) {
      try {     
        const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
        await this.page.getByRole("textbox", { name: "User ID User ID" }).click();
        await this.page.getByRole("textbox", { name: "User ID User ID" }).fill(username);
        await this.page.getByRole("button", { name: "Login" }).click();
        await this.page.getByRole("textbox", { name: "Password Password" }).click();
        await this.page.getByRole("textbox", { name: "Password Password" }).fill(password);
        await this.page.getByRole("button", { name: "Login" }).click();
        await this.page.getByText("Logistics Management").click();
        await this.page.getByRole("link", { name: "Return To Fc" }).click();
        await this.page.locator("tr .ccyvke a").nth(0).click();
        console.log('step 1 done');
        await this.page.waitForTimeout(3000);
        console.log('step 2 done');
        await this.page.waitForTimeout(2000);
        const rowCount1 = await this.page.locator('tbody tr').count();
        const allRows = await this.page.locator('tbody tr').all();
        console.log('step 3 done');
        console.log(`tbody tr count: ${rowCount1} and allRows length: ${allRows.length}`);
        await this.processDliveryAttempt(Math.max(rowCount1-1, allRows.length-1));
        console.log('All delivery items processed and out of loop');
        await this.page.getByRole('button', { name: 'Verify' }).click();
        console.log('Delivery Attempt and RFC process completed successfully');
        return true;
      } catch (err) {
        console.error('Delivery Attempt process failed:');
        return false;
        }
      }
    
    async processDliveryAttempt(itemCount) {
        console.log(`Processing step 1`);
        try {
            console.log(`step 2 and len ` + itemCount);
            for(let i = 0; i < itemCount; i++) {
                const status = await this.page.locator(`tr:nth-child(${i+2}) td:nth-child(7) .ant-select-selector`).innerText();
                console.log('==============',status);
                if(status == "Delivered" || status == "Partial Delivered" || status == "Delivery Attempted"){
                    continue;
                }
                await this.page.locator(`tr:nth-child(${i+2}) td:nth-child(7) .ant-select-selector`).click();
                await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                await this.page.locator('.ant-select-dropdown .ant-select-item:has-text("Delivery Attempted"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)').first().click();
                await this.page.getByRole("button", { name: "OK" }).click();
                await this.page.getByRole("button", { name: "Yes" }).click();
                await this.page.locator('#reason').click();
                await this.page.getByText('Shop Closed').click();
                await this.page.getByRole("button", { name: "Delivery Details" }).click();
                await this.page.getByRole("button", { name: "Update" }).click();
                await this.page.waitForTimeout(700);
                await this.page.locator(`tr:nth-child(${i+2}) td .fAmufx`).nth(4).click();
            }
            return true;
        } catch (err) {
            console.error('Error processing delivery items:', err);
            return false;
        }
    }
    async DeliveryActionOnEachRow(username, password) {
      try {     
        const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
        await this.page.getByRole("textbox", { name: "User ID User ID" }).click();
        await this.page.getByRole("textbox", { name: "User ID User ID" }).fill(username);
        await this.page.getByRole("button", { name: "Login" }).click();
        await this.page.getByRole("textbox", { name: "Password Password" }).click();
        await this.page.getByRole("textbox", { name: "Password Password" }).fill(password);
        await this.page.getByRole("button", { name: "Login" }).click();
        await this.page.getByText("Logistics Management").click();
        await this.page.getByRole("link", { name: "Return To Fc" }).click();
        await this.page.locator("tr .ccyvke a").nth(0).click();
        await this.page.waitForTimeout(2000);
        const rowCount1 = await this.page.locator('tbody tr').count();
        const allRows = await this.page.locator('tbody tr').all();
        console.log(`tbody tr count: ${rowCount1} and allRows length: ${allRows.length}`);
        await this.ActionOnEachRow(Math.max(rowCount1-1, allRows.length-1));
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
        console.log(`Processing step 1`);
        try {
            console.log(`step 2 and len ` + itemCount);
            for(let i = 0; i < itemCount; i++) {
                const rowNumber = i + 1;
                const status = await this.page.locator(`tr:nth-child(${i+2}) td:nth-child(7) .ant-select-selector`).innerText();
                if(status == "Delivered" || status == "Partial Delivered" || status == "Delivery Attempted"){
                    console.log(`${status} skipped`);
                    continue;
                }
                if(i % 3 == 0){
                    console.log(`Row ${rowNumber}: marking as Delivered`);
                    await markRowAsDelivered(this.page, rowNumber);
                } else if(i % 3 == 1){
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

