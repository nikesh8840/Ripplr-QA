const { test, expect } = require('@playwright/test');
const config = require('../../config/base.config');
const { CreateSalesmanPage } = require('../../pages/createSalesman.page');

/**
 * Onboarding – Create Salesman
 *
 * Tests the dedicated Salesman creation flow at Onboarding > Salesman > Add Salesman.
 * This is different from creating a "Salesman" user type via Onboarding > User > Add User.
 *
 * Form fields:  Name | Code | Phone Number | FC:Brands(s)
 * Add URL:      /onboarding/salesman/add
 * List URL:     /onboarding/salesman
 *
 * FC:Brand:  BTML : Britannia MT  (searched by "Britannia", matched by "BTML: Britannia")
 */

const ts = Date.now();

// FC:Brand selection config — options appear as "FC: Brand" e.g. "BTML: Britannia MT"
const FC_BRAND_SEARCH = 'Britannia';        // typed into the filter input
const FC_BRAND_OPTION = 'BTML: Britannia';  // partial text of the option to click

/**
 * Convert a number to a short unique alphabetic string (a–z).
 * Used to make the Name field unique across runs while keeping it letters-only.
 * The Name field only accepts alphabets (no digits, no spaces).
 */
const toAlpha = (n) => {
    let s = '';
    let v = n;
    do {
        s = String.fromCharCode(97 + (v % 26)) + s;
        v = Math.floor(v / 26);
    } while (v > 0);
    return s;
};

test.describe('Onboarding – Create Salesman', () => {

    test('should navigate to Add Salesman page', async ({ page }) => {
        test.setTimeout(60_000);
        const salesmanPage = new CreateSalesmanPage(page);

        await salesmanPage.navigateToAddSalesman(
            config.baseURLpreprod,
            config.credentials.username,
            config.credentials.password,
        );

        await expect(page).toHaveURL(/\/onboarding\/salesman\/add/);
    });

    test('Save button is disabled on empty Add Salesman form', async ({ page }) => {
        test.setTimeout(60_000);
        const salesmanPage = new CreateSalesmanPage(page);
        const createSalesmanLocators = require('../../locators/createSalesman.locators');

        await salesmanPage.navigateToAddSalesman(
            config.baseURLpreprod,
            config.credentials.username,
            config.credentials.password,
        );

        const l = createSalesmanLocators(page);
        await expect(l.saveButton).toBeDisabled();
    });

    test('should create a Salesman successfully', async ({ page }) => {
        test.setTimeout(120_000);
        const salesmanPage = new CreateSalesmanPage(page);

        const salesmanData = {
            // Name field accepts ONLY alphabets — convert timestamp to letters for uniqueness
            name:           `Auto${toAlpha(ts)}`,
            code:           `SL${ts}`,
            mobile:         `9${String(ts).slice(-9)}`,
            fcBrandSearch:  FC_BRAND_SEARCH,
            fcBrandOption:  FC_BRAND_OPTION,
        };

        const result = await salesmanPage.createSalesman(
            config.baseURLpreprod,
            config.credentials.username,
            config.credentials.password,
            salesmanData,
        );

        expect(result, 'Salesman should appear in the list after creation').toBeTruthy();
    });

});
