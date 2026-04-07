const { loginAndNavigateToSubModule } = require('../utils/loginUtils');

exports.SalesOrderPage = class SalesOrderPage {
    constructor(page) {
        this.page = page;
    }

    async viewOrderJourney(username, password, baseURL) {
        await this.page.goto(baseURL);
        await loginAndNavigateToSubModule(this.page, username, password, 'Order Management', 'Sales Order');
        await this.page.locator('.sc-bczRLJ.VVTgw').first().click();
        await this.page.getByRole('tab', { name: 'Order Journey' }).click();
        await this.page.getByRole('button', { name: 'right Order Details: Store' }).click();
        return true;
    }
};
