const { login } = require('../utils/loginUtils');
const createUserLocators = require('../locators/createUser.locators');
const { expect } = require('@playwright/test');
const { takeScreenshot } = require('../utils/screenshotHelper');

exports.CreateUserPage = class CreateUserPage {
    constructor(page) {
        this.page = page;
    }

    /**
     * Navigate to Onboarding > User > Add User
     */
    async navigateToAddUser(baseURL, username, password) {
        await this.page.goto(baseURL);
        await login(this.page, username, password);
        await this.page.waitForSelector('text=Dashboard', { timeout: 15000 });

        const l = createUserLocators(this.page);

        // Use menuitem role to avoid strict-mode clash with dashboard tiles
        await l.onboardingMenu.click();
        await l.userMenuLink.click();
        await this.page.waitForURL('**/onboarding/user**');

        await l.addUserButton.click();
        await this.page.waitForURL('**/onboarding/user/add');
        await takeScreenshot(this.page, 'add-user-form');
        console.log('Navigated to Add User page');
    }

    /**
     * Fill and submit the Add User form
     * @param {Object} userData
     * @param {string} userData.userType       - e.g. 'Transport Manager'
     * @param {string} userData.firstName
     * @param {string} userData.lastName
     * @param {string} userData.empId
     * @param {string} userData.phoneNumber
     * @param {string} userData.email
     * @param {string} userData.password
     * @param {string} [userData.fcBrand]      - optional e.g. 'Byrathi: Godrej'
     */
    async createUser(userData) {
        const l = createUserLocators(this.page);

        // Select User Type — keyboard navigation is most reliable for AntD Select
        await l.userTypeDropdown.click();
        await l.userTypeDropdown.pressSequentially(userData.userType, { delay: 50 });
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
        // Wait for visible dropdown overlay to close (exclude already-hidden dropdowns)
        await this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').waitFor({ state: 'hidden', timeout: 5000 });
        console.log(`Selected user type: ${userData.userType}`);

        // Personal Details — click before fill to ensure React onChange fires
        await l.firstNameInput.click();
        await l.firstNameInput.fill(userData.firstName);
        await l.lastNameInput.click();
        await l.lastNameInput.fill(userData.lastName);
        await l.empIdInput.click();
        await l.empIdInput.fill(userData.empId);
        await l.phoneNumberInput.click();
        await l.phoneNumberInput.fill(userData.phoneNumber);

        // Work Details
        await l.emailInput.click();
        await l.emailInput.fill(userData.email);
        await l.passwordInput.click();
        await l.passwordInput.fill(userData.password);

        // FC:Brands (optional but may be required for certain user types)
        if (userData.fcBrand) {
            await l.fcBrandsDropdown.click();
            await l.fcBrandsDropdown.pressSequentially(userData.fcBrand, { delay: 50 });
            await this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').waitFor({ state: 'visible', timeout: 5000 });
            await this.page.locator('.ant-select-item-option-content', { hasText: userData.fcBrand }).first().click();
            // FC:Brands is multi-select — dropdown stays open after selection; press Escape to close
            await this.page.keyboard.press('Escape');
            await this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').waitFor({ state: 'hidden', timeout: 5000 });
            console.log(`Selected FC:Brand: ${userData.fcBrand}`);
        }

        // Click neutral area to trigger final form validation
        await this.page.locator('text=Add User Details').click();

        // Screenshot of fully filled form before submitting
        await takeScreenshot(this.page, 'add-user-filled-form');

        // Submit — force click to bypass disabled state and let the form respond
        await l.saveButton.click({ force: true });
        console.log('Save button clicked');
    }

    /**
     * Verify the user was created by searching for their email on the user list page,
     * confirming their row is visible, then taking a screenshot of the result.
     * @param {Object} userData - same object passed to createUser()
     */
    async verifyUserCreated(userData) {
        const l = createUserLocators(this.page);
        try {
            // Wait for redirect to user list after successful save
            await this.page.waitForURL('**/onboarding/user**', { timeout: 10000 });

            // Search for the newly created user by email
            await l.searchByEmailInput.fill(userData.email);
            await l.searchButton.click();

            // Wait for the user's row to appear in the table
            const userRow = l.userRowByEmail(userData.email);
            await userRow.waitFor({ state: 'visible', timeout: 10000 });

            // Take screenshot of the user list showing the newly created user
            await takeScreenshot(this.page, `user-created-${userData.firstName}-${userData.lastName}`);
            console.log(`User "${userData.firstName} ${userData.lastName}" verified in user list`);
            return true;
        } catch (err) {
            console.error('User verification failed:', err.message);
            await takeScreenshot(this.page, 'user-created-verification-failed');
            return false;
        }
    }

    /**
     * Full flow: navigate + create + verify
     */
    async createTransportManager(baseURL, username, password, userData) {
        await this.navigateToAddUser(baseURL, username, password);
        await this.createUser(userData);
        return await this.verifyUserCreated(userData);
    }
};
