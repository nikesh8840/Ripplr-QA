const invoiceData = require('../test-data/allocation/vehicleallocationdata');
const { getFCName, getBrandName } = require('../utils/fcbrands');
const loginLocators = require('../locators/login.locators');
const vaLocators = require('../locators/vehicleAllocation.locators');
const {
    screenshot,
    selectDropdownOption,
    verifyLatestAllocation,
    verifyEWBOnReviewPage,
    verifyEWBGenerated,
    fillCrateCountsIfPresent,
    selectFirstDropdownResult,
    processSelectionInvoice,
} = require('./allocation/allocationHelpers');

exports.VehicleAllocationPage = class VehicleAllocationPage {
    constructor(page) {
        this.page = page;
    }

    async allocateVehicle(username, password) {
        const login = loginLocators(this.page);
        const l = vaLocators(this.page);
        console.log('invoiceData', invoiceData);
        try {
            await login.usernameInput.click();
            await login.usernameInput.fill(username);
            await login.passwordInput.click();
            await login.passwordInput.fill(password);
            await login.loginButton.click();
            await screenshot(this.page, '01-after-login');

            await l.logisticsManagementMenu.click();
            await l.deliveryAllocationLink.click();
            await l.createDeliveryAllocationButton.click();
            await screenshot(this.page, '02-create-allocation-page');

            await processSelectionInvoice(this.page);
            await screenshot(this.page, '03-invoices-selected');

            await l.tableRowCheckbox(0).click();

            await l.allocateVehicleButton.click();
            await screenshot(this.page, '04-allocate-vehicle-modal');

            await selectDropdownOption(this.page, 'Pickup Type', 'Both');
            await selectDropdownOption(this.page, 'Vehicle Type', 'Regular');
            await selectDropdownOption(this.page, 'Allocation Type', 'Regular');

            await l.vehicleNumberInput.click();
            await l.vehicleNumberInput.fill('KA8JD9302');

            await l.driverNameInput.click();
            await l.driverNameInput.fill('NIKesHh A');

            await l.vendorNameInput.click();
            await l.vendorNameInput.fill('dfs');

            await l.driverNumberInput.click();
            await l.driverNumberInput.fill('8840576893');

            await selectFirstDropdownResult(this.page, 'Delivery Boy', 'del');
            await fillCrateCountsIfPresent(this.page);
            await screenshot(this.page, '05-form-filled');

            await l.submitButton.click();
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            await screenshot(this.page, '06-after-submit');
            return true;
        } catch (err) {
            console.error('Login failed or form interaction issue:', err);
            await screenshot(this.page, 'error-allocateVehicle');
            return false;
        }
    }

    async allocateVehicleNothingBrand(username, password) {
        const login = loginLocators(this.page);
        const l = vaLocators(this.page);
        const fc = 'erhs';
        const brand = 'nothing';
        const fcName = getFCName(fc);
        const brandName = getBrandName(brand);
        try {
            await login.usernameInput.click();
            await login.usernameInput.fill(username);
            await login.passwordInput.click();
            await login.passwordInput.fill(password);
            await login.loginButton.click();
            await screenshot(this.page, 'ntng-01-after-login');

            await l.logisticsManagementMenu.click();
            await l.deliveryAllocationLink.click();
            await l.createDeliveryAllocationButton.click();

            // --- FC filter ---
            await l.fcFilterCombobox.click();
            await l.fcFilterCombobox.pressSequentially(fc, { delay: 50 });
            await l.visibleDropdownOption(fcName).waitFor({ state: 'visible', timeout: 5000 });
            await l.visibleDropdownOption(fcName).click();
            console.log(`FC selected: ${fcName}`);

            // --- Brand filter ---
            await l.brandFilterCombobox.click();
            await l.brandFilterCombobox.pressSequentially(brand, { delay: 50 });
            await l.visibleDropdownOption(brandName).waitFor({ state: 'visible', timeout: 5000 });
            await l.visibleDropdownOption(brandName).click();
            console.log(`Brand selected: ${brandName}`);

            await l.searchButton.click();
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            await screenshot(this.page, 'ntng-02-filtered-results');

            await l.tableRowCheckbox(0).click();
            await screenshot(this.page, 'ntng-03-row-selected');

            await l.allocateVehicleButton.click();

            try {
                await l.skipButton.waitFor({ state: 'visible', timeout: 2000 });
                await l.skipButton.click();
                console.log('Skip button found and clicked');
            } catch {
                console.log('Skip button did not appear, continuing...');
            }

            await screenshot(this.page, 'ntng-04-allocate-modal');

            await selectDropdownOption(this.page, 'Pickup Type', 'Both');
            await selectDropdownOption(this.page, 'Vehicle Type', 'Regular');
            await selectDropdownOption(this.page, 'Allocation Type', 'Regular');

            await l.vehicleNumberInput.click();
            await l.vehicleNumberInput.fill('DL12AB1234');

            await l.driverNameInput.click();
            await l.driverNameInput.fill('NIKesHh A');

            await l.vendorNameInput.click();
            await l.vendorNameInput.fill('Test Vendor');

            await l.driverNumberInput.click();
            await l.driverNumberInput.fill('8840576893');

            await selectFirstDropdownResult(this.page, 'Delivery Boy', 'delivery boy');
            await fillCrateCountsIfPresent(this.page);
            await screenshot(this.page, 'ntng-05-form-filled');

            await l.submitButton.click();

            // Step 1: Wait for first Confirm (may be a warning dialog e.g. "Delivery boy already assigned")
            await l.confirmButton.waitFor({ state: 'visible', timeout: 15000 });
            await screenshot(this.page, 'ntng-06-first-confirm');
            await l.confirmButton.click();
            await this.page.waitForTimeout(1500);

            // Step 2: Wait for Delivery Allocation Details review page (second Confirm)
            await l.confirmButton.waitFor({ state: 'visible', timeout: 10000 });
            await screenshot(this.page, 'ntng-07-details-review');

            // Extract EWB and Consolidated EWB from the details review page
            const ewbResult = await verifyEWBOnReviewPage(this.page);
            console.log(`EWB: ${ewbResult.ewbNumber}, Consolidated EWB: ${ewbResult.consolidatedEwbNumber}`);

            await l.confirmButton.click();

            await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
            await this.page.waitForTimeout(1000);
            await screenshot(this.page, 'ntng-08-after-confirm');

            return {
                success: true,
                ewbVerified: ewbResult.verified,
                ewbNumber: ewbResult.ewbNumber,
                consolidatedEwbNumber: ewbResult.consolidatedEwbNumber,
            };
        } catch (err) {
            console.error('Nothing brand allocation failed:', err);
            await screenshot(this.page, 'ntng-error');
            return { success: false, ewbVerified: false, ewbNumber: null, consolidatedEwbNumber: null };
        }
    }

    async allocateVehiclewithfcbrand(username, password, fc, brand) {
        const login = loginLocators(this.page);
        const l = vaLocators(this.page);
        try {
            await login.usernameInput.click();
            await login.usernameInput.fill(username);
            await login.passwordInput.click();
            await login.passwordInput.fill(password);
            await login.loginButton.click();
            await screenshot(this.page, '01-after-login');

            await l.logisticsManagementMenu.click();
            await l.deliveryAllocationLink.click();
            await l.createDeliveryAllocationButton.click();

            // --- FC filter ---
            const fcName = getFCName(fc);
            await l.fcFilterCombobox.click();
            await l.fcFilterCombobox.pressSequentially(fc, { delay: 50 });
            await l.visibleDropdownOption(fcName).waitFor({ state: 'visible', timeout: 5000 });
            await l.visibleDropdownOption(fcName).click();
            console.log(`FC selected: ${fcName}`);

            // --- Brand filter ---
            const brandName = getBrandName(brand);
            await l.brandFilterCombobox.click();
            await l.brandFilterCombobox.pressSequentially(brand, { delay: 50 });
            await l.visibleDropdownOption(brandName).waitFor({ state: 'visible', timeout: 5000 });
            await l.visibleDropdownOption(brandName).click();
            console.log(`Brand selected: ${brandName}`);

            await l.searchButton.click();
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            await screenshot(this.page, '02-filtered-results');

            await l.tableRowCheckbox(0).click();
            await l.tableRowCheckbox(1).click();
            await l.tableRowCheckbox(2).click();
            await screenshot(this.page, '03-rows-selected');

            await l.allocateVehicleButton.click();

            try {
                await l.skipButton.waitFor({ state: 'visible', timeout: 2000 });
                await l.skipButton.click();
                console.log('Skip button found and clicked');
            } catch (error) {
                console.log('Skip button did not appear within 2 seconds, continuing...');
            }

            await screenshot(this.page, '04-allocate-vehicle-modal');

            await selectDropdownOption(this.page, 'Pickup Type', 'Both');
            await selectDropdownOption(this.page, 'Vehicle Type', 'Regular');
            await selectDropdownOption(this.page, 'Allocation Type', 'Regular');

            await l.vehicleNumberInput.click();
            await l.vehicleNumberInput.fill('KA8JD9302');

            await l.driverNameInput.click();
            await l.driverNameInput.fill('NIKesHh A');

            await l.vendorNameInput.click();
            await l.vendorNameInput.fill('Test Vendor');

            await l.driverNumberInput.click();
            await l.driverNumberInput.fill('8840576893');

            await selectFirstDropdownResult(this.page, 'Delivery Boy', 'del');
            await fillCrateCountsIfPresent(this.page);
            await screenshot(this.page, '05-form-filled');

            await l.submitButton.click();
            await l.confirmButton.click();
            try {
                await l.confirmButton.waitFor({ state: 'visible', timeout: 2000 });
                await l.confirmButton.click();
            } catch {
                // No second confirm dialog — continue
            }
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            await verifyLatestAllocation(this.page);
            await screenshot(this.page, '06-after-submit');
            return true;
        } catch (err) {
            console.error('Login failed or form interaction issue:', err);
            await screenshot(this.page, 'error-allocateVehiclewithfcbrand');
            return false;
        }
    }
};
