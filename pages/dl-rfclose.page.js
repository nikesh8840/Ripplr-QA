
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
        await this.page.waitForTimeout(3000); // Wait for any dynamic loading
        await this.page.waitForSelector('tbody tr', { timeout: 10000 });
        await this.page.waitForTimeout(2000);
        const rowCount1 = await this.page.locator('tbody tr').count();
        const allRows = await this.page.locator('tbody tr').all();
        console.log(`tbody tr count: ${rowCount1} and allRows length: ${allRows.length}`);
        await this.processDeliveryItems(Math.max(rowCount1, allRows.length));
        await this.page.locator('.bEwzzI').click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        await this.page.locator('.bWEHjs').click();
        await this.page.locator('.bEwzzI').click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        await this.page.locator('.bWEHjs').click(); 
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
                const status = await this.page.locator(`tr:nth-child(${i+1}) td:nth-child(8) .ant-select-selector`).innerText();
                console.log('===========================',status);
                if(status == "Delivered"){
                    continue;
                }
                await this.page.locator(`tr:nth-child(${i+1}) td:nth-child(8) .ant-select-selector`).click();
                await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                await this.page.locator('.ant-select-dropdown .ant-select-item:has-text("Delivered"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)').first().click();
                await this.page.getByRole("button", { name: "OK" }).click();
                await this.page.getByRole("button", { name: "Yes" }).click();
                await this.page.getByRole("button", { name: "right Delivery Details" }).click();
                await this.page.getByRole("button", { name: "Update" }).click();
                await this.page.getByRole("radio", { name: "Invoice Returned" }).check();
                await this.page.getByRole("button", { name: "right Collection Details:" }).click();
                await this.page.getByRole("button", { name: "Update" }).click();
                await this.page.getByRole('link', {name: 'Invoice List'}).click();
                await this.page.waitForTimeout(700);
                await this.page.locator(`tr:nth-child(${i+1}) td .fAmufx`).nth(3).click();
            }
            return true;
        } catch (err) {
            console.error('Error processing delivery items:', err);
            return false;
        }
    }
};


