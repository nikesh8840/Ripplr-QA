const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');
const { handleLocationDialog } = require('../../utils/locationHandler');

let loginPage;

test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await page.goto(config.baseURLpreprod);
    // await handleLocationDialog(page);
});

test('Login with valid credentials', async ({ page }) => {
    const result = await loginPage.login(config.credentials.username, config.credentials.password);
    expect(result).toBeTruthy();
});

test('Login with invalid email and valid password', async ({ page }) => {
    const result = await loginPage.login('invalid-username', config.credentials.password);
    expect(result).toBeFalsy();
});

test('Login with valid email and invalid password', async ({ page }) => {
    const result = await loginPage.login(config.credentials.username, 'invalid-password');
    expect(result).toBeFalsy();
});

test('Login with invalid credentials', async ({ page }) => {
    const result = await loginPage.login('invalid-username', 'invalid-password');
    expect(result).toBeFalsy();
});
