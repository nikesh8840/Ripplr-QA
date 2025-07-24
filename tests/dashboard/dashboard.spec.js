const { test, expect } = require('@playwright/test');
const { DashboardPage } = require('../../pages/dashboardPage');
const config = require('../../config/config');

test('Dashboard is visible after login', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await page.goto(`${config.baseURL}/dashboard`);
    expect(await dashboardPage.isDashboardLoaded()).toBeTruthy();
});
