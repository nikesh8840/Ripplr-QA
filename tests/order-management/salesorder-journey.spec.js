const { test, expect } = require('@playwright/test');
const config = require('../../config/base.config');
const { SalesOrderPage } = require('../../pages/salesOrder.page');

test('View Sales Order - Order Journey', async ({ page }) => {
    const salesOrderPage = new SalesOrderPage(page);
    const result = await salesOrderPage.viewOrderJourney(
        config.credentials.username,
        config.credentials.password,
        config.baseURLpreprod
    );
    expect(result).toBeTruthy();
});
