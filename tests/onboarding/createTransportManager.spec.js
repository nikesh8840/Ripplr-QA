const { test, expect } = require('@playwright/test');
const config = require('../../config/base.config');
const { CreateUserPage } = require('../../pages/createUser.page');

// ─── Test Data ────────────────────────────────────────────────────────────────
// Timestamp suffix ensures unique email/empId on every run
const ts = Date.now();
const transportManagerData = {
    userType:     'Transport Manager',
    firstName:    'TestTransport',
    lastName:     'Manager',
    empId:        `TM${ts}`,
    phoneNumber:  `9${String(ts).slice(-9)}`,  // unique 10-digit number
    email:        `test.tm.${ts}@ripplr.in`,
    password:     'Test@1234',
    fcBrand:      'Godrej',  // uncomment and set if FC:Brand assignment is needed
};
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Onboarding - Create Transport Manager User', () => {

    test('should create a Transport Manager user successfully', async ({ page }) => {
        const createUserPage = new CreateUserPage(page);

        const result = await createUserPage.createTransportManager(
            config.baseURLpreprod,
            config.credentials.username,
            config.credentials.password,
            transportManagerData
        );

        expect(result).toBeTruthy();
    });

    test('should navigate to Add User page', async ({ page }) => {
        const createUserPage = new CreateUserPage(page);

        await createUserPage.navigateToAddUser(
            config.baseURLpreprod,
            config.credentials.username,
            config.credentials.password
        );

        await expect(page).toHaveURL(/\/onboarding\/user\/add/);
    });

    test('should have Save button disabled until all required fields are filled', async ({ page }) => {
        const createUserPage = new CreateUserPage(page);
        const createUserLocators = require('../../locators/createUser.locators');

        await createUserPage.navigateToAddUser(
            config.baseURLpreprod,
            config.credentials.username,
            config.credentials.password
        );

        // Save should be disabled on empty form
        const l = createUserLocators(page);
        await expect(l.saveButton).toBeDisabled();
    });

});
