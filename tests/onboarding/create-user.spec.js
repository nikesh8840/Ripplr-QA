const { test, expect } = require('@playwright/test');
const { CreateUserPage } = require('../../pages/createUser.page');
const { LoginPage } = require('../../pages/login.page');
const config = require('../../config/base.config');

// Unique suffix per run to avoid duplicate email / empId
const ts = Date.now();

test.describe('Onboarding - Create Users', () => {

    test('Navigate to Add User page', async ({ page }) => {
        test.setTimeout(60000);
        const createUserPage = new CreateUserPage(page);
        await createUserPage.navigateToAddUser(
            config.baseURLpreprod,
            config.credentials.username,
            config.credentials.password
        );
        await expect(page).toHaveURL(/\/onboarding\/user\/add/);
    });

    test('Save button is disabled on empty Add User form', async ({ page }) => {
        test.setTimeout(60000);
        const createUserPage = new CreateUserPage(page);
        const createUserLocators = require('../../locators/createUser.locators');

        await createUserPage.navigateToAddUser(
            config.baseURLpreprod,
            config.credentials.username,
            config.credentials.password
        );
        const l = createUserLocators(page);
        await expect(l.saveButton).toBeDisabled();
    });

    test('Create Transport Manager user successfully', async ({ page }) => {
        test.setTimeout(120000);
        const createUserPage = new CreateUserPage(page);

        const result = await createUserPage.createTransportManager(
            config.baseURLpreprod,
            config.credentials.username,
            config.credentials.password,
            {
                userType:    'Transport Manager',
                firstName:   'AutoTM',
                lastName:    `User${ts}`,
                empId:       `TM${ts}`,
                phoneNumber: `9${String(ts).slice(-9)}`,
                email:       `auto.tm.${ts}@ripplr.in`,
                password:    'Test@1234',
            }
        );
        expect(result).toBeTruthy();
    });

    test('Create Delivery Boy user successfully', async ({ page }) => {
        test.setTimeout(120000);
        const createUserPage = new CreateUserPage(page);
        const ts2 = ts + 1;

        const result = await createUserPage.createTransportManager(
            config.baseURLpreprod,
            config.credentials.username,
            config.credentials.password,
            {
                userType:    'Delivery Boy',
                firstName:   'AutoDB',
                lastName:    `User${ts2}`,
                empId:       `DB${ts2}`,
                phoneNumber: `8${String(ts2).slice(-9)}`,
                email:       `auto.db.${ts2}@ripplr.in`,
                password:    'Test@1234',
            }
        );
        expect(result).toBeTruthy();
    });

    test('User list loads with search capability', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await page.goto(config.baseURLpreprod);
        await loginPage.login(config.credentials.username, config.credentials.password);

        await page.getByRole('menuitem', { name: 'Onboarding' }).click();
        await page.getByRole('link', { name: 'User' }).click();
        await page.waitForURL('**/onboarding/user**');
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('button', { name: /Add User/i })).toBeVisible();
        await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });
    });

});
