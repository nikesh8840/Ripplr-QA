
const path = require('path');

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
        await this.processDeliveryItems(Math.max(rowCount1, allRows.length));
        console.log('All delivery items processed and out of loop');
        // await this.page.locator('.bEwzzI').click();
        await this.page.locator('.kZVmvt').click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        // await this.page.locator('.bWEHjs').click();
        await this.page.locator('.jicgDe').click();
        await this.page.locator('.bEwzzI').click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        await this.page.locator('.jicgDe').click(); 
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('button', { name: 'Verify' }).click();
        return true;
      } catch (err) {
        console.error('Delivered process failed:');
        return false;
        }
      }

    async processDeliveryItems(itemCount) {
        try {
            for(let i = 0; i < itemCount; i++) {
                const status = await this.page.locator(`tr:nth-child(${i+2}) td:nth-child(7) .ant-select-selector`).innerText();
                console.log('===========================',status);
                if(status == "Delivered"){
                    continue;
                }
                const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
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
                await this.page.getByRole("button", { name: "right Delivery Details" }).click();
                await this.page.getByRole("button", { name: "Update" }).click();
                await this.page.getByRole("radio", { name: "Invoice Returned" }).check();
                let collectableamount = await this.page.locator(`div[class='sc-bczRLJ sc-gsnTZi jkiZmR jnFvAE'] div:nth-child(2) div:nth-child(2) span:nth-child(1)`).innerText();
                collectableamount = collectableamount.replace('₹', '').replace(',', '');
                collectableamount = (collectableamount);
                console.log('collectableamount type',typeof collectableamount);
                console.log('collectableamount',collectableamount);
                await this.page.locator("input[name='cash']").click();
                await this.page.locator("input[name='cash']").fill(String(Math.ceil(collectableamount/4)));
                await this.page.getByRole("button", { name: "right Collection Details:" }).click();
                await this.page.getByRole("button", { name: "Update" }).click();
                await this.page.getByRole('link', {name: 'Invoice List'}).click();
                await this.page.waitForTimeout(700);
                await this.page.locator(`tr:nth-child(${i+2}) td .fAmufx`).nth(3).click();
                const addImageBtn = await this.page.locator('.ant-modal-content button .iVToiv');
                if(await addImageBtn.count() > 0) {
                    console.log('Add More Image button found, proceeding to upload file');
                    await addImageBtn.click();
                    await this.page.locator('.ant-upload-drag-container .jCxLyX').click();
                    await this.page.setInputFiles('input[type="file"]', filePath);
                    await this.page.locator('.ant-modal-body button').click();
                    await this.page.locator('.ant-modal-content button.ant-modal-close').click();
                    await this.page.locator(`tr:nth-child(${i+2}) td .fAmufx`).nth(3).click();
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
};


