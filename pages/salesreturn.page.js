
const invoiceData = require('../test-data/return/SalesreturnInvoices');
const { loginAndNavigateToSubModule } = require('../utils/loginUtils');

exports.ReturnPage = class ReturnPage {
    constructor(page) {
        this.page = page;
    }

    async createReturn(username, password) {
        try {
            const invoices = invoiceData.invoiceData;
            
            // Use the reusable login function
            const loginSuccess = await loginAndNavigateToSubModule(
                this.page, 
                username, 
                password, 
                'Order Management', 
                'Returns'
            );
            
            if (!loginSuccess) {
                console.error('Login or navigation failed');
                return false;
            }
        await this.page.getByRole('button', { name: 'Add Sales return' }).click();
        await this.page.getByRole('textbox', { name: 'Search search icon' }).click();
        await this.page.getByRole('textbox', { name: 'Search search icon' }).fill(invoices[0]);
        await this.page.getByRole('button', { name: 'Search' }).click();
        await this.page.locator('.bSLZcG').nth(0).click();
        await this.page.getByRole('textbox', { name: 'search icon' }).click();
        await this.page.locator('input[type="checkbox"]').nth(0).check();
        const returnableQty =await this.page.locator('tbody tr td:nth-child(2) .sc-bczRLJ').innerText();
       const returnQty = Math.ceil(returnableQty / 2);

        // Click on the input number component and fill the value
        await this.page.locator('tbody tr td:nth-child(3) .ant-input-number input').click();
        await this.page.locator('tbody tr td:nth-child(3) .ant-input-number input').fill(returnQty.toString());
        
        await this.page.locator('td button[type="button"]:has-text("Add")').click();
        // await this.page.locator('td button[type="button"]:has-text("Add")').click();
        await this.page.waitForTimeout(2000);
        // Wait for dropdown to appear and click on reason dropdown
        await this.page.waitForSelector('tbody tr td .ant-select-selection-item', { timeout: 5000 });
        await this.page.locator('tbody tr td .ant-select-selection-item').click();
        await this.page.waitForTimeout(1000);
        
        // Wait for dropdown options to appear and select "Not Fast Moving"
        await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
        await this.page.getByTitle('Not Fast Moving').locator('div').click();
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('spinbutton', { name: 'Qty*' }).click();
        await this.page.getByRole('spinbutton', { name: 'Qty*' }).fill(returnQty.toString());
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('button', { name: 'Save' }).click();
        await this.page.locator('tbody tr:first-child td img').click();
        await this.page.waitForTimeout(1000);
        await this.page.locator('.gCJfbe').click();
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('button', { name: '×' }).click();
        // await this.page.getByText('Completed').first().click();

            // Check return status
            const returnstatus = await this.page.locator('tbody tr:first-child td .hYzLpj').innerText();
            console.log('Return Status:', returnstatus);
            if (returnstatus.includes('Completed') || returnstatus.includes('WMS Failed')) {
                console.log('Return process completed successfully.');
                return true;
            } else {
                console.error('Return process did not complete as expected.');
                return false;
            }
            
        } catch (err) {
            console.error('Return process failed:', err);
            return false;
        }
          }
};












