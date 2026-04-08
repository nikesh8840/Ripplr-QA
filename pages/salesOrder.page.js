const { loginAndNavigateToSubModule } = require('../utils/loginUtils');
const salesOrderLocators = require('../locators/salesOrder.locators');

exports.SalesOrderPage = class SalesOrderPage {
    constructor(page) {
        this.page = page;
    }

    async viewOrderJourney(username, password, baseURL) {
        const l = salesOrderLocators(this.page);
        await this.page.goto(baseURL);
        await loginAndNavigateToSubModule(this.page, username, password, 'Order Management', 'Sales Order');
        await l.firstSalesOrderRow.click();
        await l.orderJourneyTab.click();
        await l.orderDetailsStoreButton.click();
        return true;
    }
};
