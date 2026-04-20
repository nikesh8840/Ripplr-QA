const { login } = require('../utils/loginUtils');
const createSalesmanLocators = require('../locators/createSalesman.locators');
const { takeScreenshot } = require('../utils/screenshotHelper');

exports.CreateSalesmanPage = class CreateSalesmanPage {
    constructor(page) {
        this.page = page;
    }

    /**
     * Navigate to Onboarding > Salesman > Add Salesman
     */
    async navigateToAddSalesman(baseURL, username, password) {
        await this.page.goto(baseURL);
        await login(this.page, username, password);
        await this.page.waitForSelector('text=Dashboard', { timeout: 15000 });

        const l = createSalesmanLocators(this.page);
        await l.onboardingMenu.click();
        await l.salesmanLink.click();
        await this.page.waitForURL('**/onboarding/salesman**');

        await l.addSalesmanButton.click();
        await this.page.waitForURL('**/onboarding/salesman/add');
        await this.page.waitForLoadState('networkidle');
        await takeScreenshot(this.page, 'add-salesman-form');
        console.log('Navigated to Add Salesman page');
    }

    /**
     * Select an FC:Brand from the dropdown.
     *
     * The FC:Brands field is an AntD Select whose internal input (`#brand_id`)
     * receives typed characters once focused. Options appear as "FC: Brand" strings
     * (e.g. "BTML: Britannia MT").
     *
     * @param {string} searchText  Text to type into the filter (e.g. 'Britannia')
     * @param {string} optionText  Partial text to match the target option (e.g. 'BTML: Britannia')
     */
    async selectFcBrand(searchText, optionText) {
        const l = createSalesmanLocators(this.page);

        // 1. Wait for the AntD selector container to be visible
        //    Hierarchy: input#brand_id → span.ant-select-selection-search → div.ant-select-selector
        const selectorContainer = this.page.locator('.ant-select-selector');
        await selectorContainer.waitFor({ state: 'visible', timeout: 8000 });

        // 2. Click the selector container to open the dropdown
        await selectorContainer.click();

        // 3. Wait for the dropdown overlay to appear
        const dropdown = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
        await dropdown.waitFor({ state: 'visible', timeout: 8000 });

        // 4. Type the search term into the focused brand_id input
        await this.page.keyboard.type(searchText, { delay: 60 });

        // 5. Wait for a matching option to render after filtering
        const optionLocator = this.page.locator('.ant-select-item-option-content', { hasText: optionText });
        await optionLocator.first().waitFor({ state: 'visible', timeout: 8000 });

        // 6. Click the first matching option
        await optionLocator.first().click();

        // 7. Dropdown closes automatically for single-select; press Escape as safety net
        await dropdown.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
            return this.page.keyboard.press('Escape');
        });

        console.log(`Selected FC:Brand matching "${optionText}"`);
    }

    /**
     * Fill the Add Salesman form fields.
     * @param {Object} data
     * @param {string} data.name
     * @param {string} data.code
     * @param {string} data.mobile
     * @param {string} data.fcBrandSearch  Search term typed into the FC:Brands filter
     * @param {string} data.fcBrandOption  Partial option text to click (e.g. 'BTML: Britannia')
     */
    async fillForm(data) {
        const l = createSalesmanLocators(this.page);

        await l.nameInput.click();
        await l.nameInput.fill(data.name);

        await l.codeInput.click();
        await l.codeInput.fill(data.code);

        await l.mobileInput.click();
        await l.mobileInput.fill(data.mobile);

        await this.selectFcBrand(data.fcBrandSearch, data.fcBrandOption);

        // Click a neutral heading to trigger final form validation
        await this.page.locator('text=Add Salesman').first().click().catch(() => {});

        await takeScreenshot(this.page, 'add-salesman-filled-form');
    }

    /**
     * Verify the created salesman by searching in the list.
     * @param {Object} data - same object passed to fillForm()
     * @returns {boolean}
     */
    async verifySalesmanCreated(data) {
        const l = createSalesmanLocators(this.page);
        try {
            // Match list page (/onboarding/salesman or /onboarding/salesman?...)
            // but NOT the add form (/onboarding/salesman/add)
            await this.page.waitForURL(/\/onboarding\/salesman(\?|$)/, { timeout: 15000 });
            await this.page.waitForLoadState('networkidle');
            await l.searchByMobileInput.fill(data.mobile);
            await l.searchButton.click();

            const row = l.rowByMobile(data.mobile);
            await row.waitFor({ state: 'visible', timeout: 10000 });

            await takeScreenshot(this.page, `salesman-created-${data.code}`);
            console.log(`Salesman "${data.name}" (${data.code}) verified in list`);
            return true;
        } catch (err) {
            console.error('Salesman verification failed:', err.message);
            await takeScreenshot(this.page, 'salesman-creation-verification-failed');
            return false;
        }
    }

    /**
     * Full flow: navigate → fill form → save → verify
     */
    async createSalesman(baseURL, username, password, data) {
        await this.navigateToAddSalesman(baseURL, username, password);
        await this.fillForm(data);

        const l = createSalesmanLocators(this.page);
        await l.saveButton.click({ force: true });
        console.log('Save button clicked');

        return await this.verifySalesmanCreated(data);
    }
};
