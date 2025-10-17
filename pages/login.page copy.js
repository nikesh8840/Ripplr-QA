// pages/login.page.js
exports.LoginPage = class LoginPage {
    constructor(page) {
        this.page = page;
        
        // Define all locators as constants
        this.BASE_URL = 'https://cdms-staging.ripplr.in/';
        this.USER_ID_INPUT = this.page.getByRole('textbox', { name: 'User ID User ID' });
        this.PASSWORD_INPUT = this.page.getByRole('textbox', { name: 'Password Password' });
        this.LOGIN_BUTTON = this.page.getByRole('button', { name: 'Login' });
        this.DASHBOARD_TEXT = this.page.locator('text=Dashboard');
    }

    // Step: Open the base URL
    async openbaseURL() {
        await this.page.goto(this.BASE_URL);
    }

    // Step: Get user ID input element
    userIdInput() {
        return this.USER_ID_INPUT;
    }

    // Step: Get password input element
    passwordInput() {
        return this.PASSWORD_INPUT;
    }

    // Step: Get login button element
    loginButton() {
        return this.LOGIN_BUTTON;
    }

    // Step: Wait for dashboard to appear
    async waitForDashboard() {
        await this.page.waitForSelector('text=Dashboard', { timeout: 10000 });
    }

    // Step: Get dashboard element
    dashboardText() {
        return this.DASHBOARD_TEXT;
    }

    // Step: Verify dashboard is visible
    async verifyDashboardVisible() {
        return await this.dashboardText();
    }
};
