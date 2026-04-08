const loginLocators = require('../locators/login.locators');

exports.LoginPage = class LoginPage {
    constructor(page) {
        this.page = page;
    }

    async login(username, password) {
        const login = loginLocators(this.page);
        await login.usernameInput.click();
        await login.usernameInput.fill(username);
        await login.passwordInput.click();
        await login.passwordInput.fill(password);
        await login.loginButton.click();
        try {
            await this.page.waitForTimeout(10000); // Wait for 10 seconds
            console.log('Login successful, waiting for Dashboard to load...');
            await this.page.waitForSelector('text=Dashboard', { timeout: 5000 });
            return true;
        } catch (err) {
            console.error('Login failed or Dashboard not found.');
            return false;
        }
    }
};
