const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

test.describe('Authentication - Login', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(config.baseURLpreprod);
    });

    test('Login with valid credentials navigates to Dashboard', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const result = await loginPage.login(config.credentials.username, config.credentials.password);
        expect(result).toBeTruthy();
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Login with invalid email returns failure', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const result = await loginPage.login('notauser@ripplr.in', config.credentials.password);
        expect(result).toBeFalsy();
    });

    test('Login with invalid password returns failure', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const result = await loginPage.login(config.credentials.username, 'WrongPass@99');
        expect(result).toBeFalsy();
    });

    test('Login with both invalid credentials returns failure', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const result = await loginPage.login('nobody@ripplr.in', 'WrongPass@99');
        expect(result).toBeFalsy();
    });

    test('Login form shows User ID and Password fields', async ({ page }) => {
        await expect(page.getByRole('textbox', { name: /User ID/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /Password/i })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    });

    test('Login button is visible and enabled on load', async ({ page }) => {
        const loginBtn = page.getByRole('button', { name: 'Login' });
        await expect(loginBtn).toBeVisible();
        await expect(loginBtn).toBeEnabled();
    });

});
