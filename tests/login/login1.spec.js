const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/login.page copy');
const config = require('../../config/base.config');

test('Login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Test steps - granular actions
    await loginPage.openbaseURL();
    await loginPage.userIdInput().click();
    await loginPage.userIdInput().fill(config.credentials.username);
    await loginPage.passwordInput().click();
    await loginPage.passwordInput().fill(config.credentials.password);
    await loginPage.loginButton().click();
    await loginPage.waitForDashboard();
    
    const isDashboardVisible = await loginPage.verifyDashboardVisible();
    expect(isDashboardVisible).toBeTruthy();
});

// test('Login with invalid emial and valid password', async ({ page }) => {
//     const loginPage = new LoginPage(page);

//     await page.goto(config.baseURL);
//     const result = await loginPage.login('invalid-username', config.credentials.password);
//     expect(result).toBeFalsy();
// }); 

// test('Login with valid email and invalid password', async ({ page }) => {
//     const loginPage = new LoginPage(page);

//     await page.goto(config.baseURL);
//     const result = await loginPage.login(config.credentials.username, 'invalid-password');
//     expect(result).toBeFalsy();
// }); 

// test('Login with invalid credentials', async ({ page }) => {
//     const loginPage = new LoginPage(page);

//     await page.goto(config.baseURL);
//     const result = await loginPage.login('invalid-username', 'invalid-password');
//     expect(result).toBeFalsy();
// });

