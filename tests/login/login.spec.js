const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/loginPage');
const { DashboardPage } = require('../../pages/dashboardPage');
const config = require('../../config/config');

test('Login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await page.goto(config.baseURL);
    await loginPage.login(config.credentials.username, config.credentials.password);
    expect(await dashboardPage.isDashboardLoaded()).toBeTruthy();
});
