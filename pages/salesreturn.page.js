const invoiceData = require('../test-data/return/SalesreturnInvoices');
const { loginAndNavigateToSubModule } = require('../utils/loginUtils');
const salesReturnLocators = require('../locators/salesReturn.locators');

exports.ReturnPage = class ReturnPage {
    constructor(page) {
        this.page = page;
    }

    async createReturn(username, password) {
        try {
            const invoices = invoiceData.invoiceData;
            const l = salesReturnLocators(this.page);

            const loginSuccess = await loginAndNavigateToSubModule(
                this.page, username, password, 'Order Management', 'Returns'
            );
            if (!loginSuccess) {
                console.error('Login or navigation failed');
                return false;
            }

            await l.addSalesReturnButton.click();
            await l.invoiceSearchInput.click();
            await l.invoiceSearchInput.fill(invoices[0]);
            await l.searchButton.click();
            await l.firstReturnItem.click();
            await l.productSearchInput.click();
            await l.firstCheckbox.check();

            const returnableQty = await l.returnableQtyCell.innerText();
            const returnQty = Math.ceil(returnableQty / 2);

            await l.returnQtyInput.click();
            await l.returnQtyInput.fill(returnQty.toString());
            await l.addButton.click();
            await this.page.waitForTimeout(2000);

            await this.page.waitForSelector('tbody tr td .ant-select-selection-item', { timeout: 5000 });
            await l.reasonDropdown.click();
            await this.page.waitForTimeout(1000);

            await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
            await l.notFastMovingOption.click();
            await this.page.waitForTimeout(1000);

            await l.qtySummaryInput.click();
            await l.qtySummaryInput.fill(returnQty.toString());
            await this.page.waitForTimeout(1000);
            await l.saveButton.click();

            await l.firstRowThumbnail.click();
            await this.page.waitForTimeout(1000);
            await l.expandButton.click();
            await this.page.waitForTimeout(1000);
            await l.closeButton.click();

            const returnstatus = await l.returnStatusCell.innerText();
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
