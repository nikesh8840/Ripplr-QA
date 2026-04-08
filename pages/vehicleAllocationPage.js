const invoiceData = require('../test-data/allocation/vehicleallocationdata');
const { getFCName, getBrandName } = require('../utils/fcbrands');
const loginLocators = require('../locators/login.locators');
const vaLocators = require('../locators/vehicleAllocation.locators');

exports.VehicleAllocationPage = class VehicleAllocationPage {
    constructor(page) {
        this.page = page;
    }

    async processSelectionInvoice() {
        const invoices = invoiceData.invoiceData;
        const l = vaLocators(this.page);
        try {
            for (let i = 0; i < invoices.length; i++) {
                console.log(`Processing invoice: ${invoices[i]}`);
                await l.invoiceSearchInput.click();
                await l.invoiceSearchInput.clear();
                await l.invoiceSearchInput.fill(invoices[i]);
                await l.searchButton.click();
                await this.page.waitForTimeout(2000);
                await this.page.waitForSelector(`tr:has-text("${invoices[i]}")`, { timeout: 10000 });
                await l.invoiceRowCheckbox(invoices[i]).click();
                console.log(`Successfully selected invoice: ${invoices[i]}`);
                await l.invoiceSearchInput.clear();
            }
            return true;
        } catch (err) {
            console.error('Error processing invoice selection:', err);
            return false;
        }
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

            await l.logisticsManagementMenu.click();
            await l.deliveryAllocationLink.click();
            await l.createDeliveryAllocationButton.click();

            await this.processSelectionInvoice();

            await l.checkboxNth(1).click();

            await l.allocateVehicleButton.click();

            await l.deliveryTypeDropdown.click();
            await l.bothOption.click();

            await l.vehicleTypeDropdown.click();
            await l.regularOption.click();

            await l.vehicleSubTypeDropdown.click();
            await this.page.waitForSelector('div[title="Regular"]', { timeout: 5000 });
            await l.regularText.click();

            await l.vehicleNumberInput.click();
            await l.vehicleNumberInput.fill('KA8JD9302');

            await l.driverInput.click();
            await l.driverInput.fill('NIKesHh A');

            await l.vendorInput.click();
            await l.vendorInput.fill('dfs');

            await l.driverMobileLabel.click();
            await l.driverMobileInput.click();
            await l.driverMobileInput.fill('8840576893');

            await l.deliveryBoyDropdownLast.click();
            await l.deliveryBoyInputLast.fill('del');
            await l.deliveryBoyOption.click();

            await l.submitButton.click();
            await this.page.waitForTimeout(3000);
            return true;
        } catch (err) {
            console.error('Login failed or form interaction issue:', err);
            return false;
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

            await l.logisticsManagementMenu.click();
            await l.deliveryAllocationLink.click();
            await l.createDeliveryAllocationButton.click();

            const fcName = getFCName(fc);
            let fcSelected = false;
            let fcRetryCount = 0;
            while (!fcSelected && fcRetryCount < 3) {
                try {
                    await l.fcFilterCombobox.click();
                    await l.fcFilterCombobox.fill(fc);
                    await this.page.waitForSelector(`text=${fcName}`, { timeout: 5000 });
                    await l.fcText(fcName).click();
                    fcSelected = true;
                    console.log(`FC selection successful on attempt ${fcRetryCount + 1}`);
                } catch (error) {
                    fcRetryCount++;
                    console.log(`FC selection failed on attempt ${fcRetryCount}, retrying...`);
                    if (fcRetryCount >= 3) throw error;
                    await this.page.waitForTimeout(1000);
                }
            }

            const brandName = getBrandName(brand);
            let brandSelected = false;
            let retryCount = 0;
            while (!brandSelected && retryCount < 3) {
                try {
                    await l.brandFilterCombobox.click();
                    await l.brandFilterCombobox.fill(brand);
                    await this.page.waitForSelector(`text=${brandName}`, { timeout: 5000 });
                    await l.brandText(brandName).click();
                    brandSelected = true;
                    console.log(`Brand selection successful on attempt ${retryCount + 1}`);
                } catch (error) {
                    retryCount++;
                    console.log(`Brand selection failed on attempt ${retryCount}, retrying...`);
                    if (retryCount >= 3) throw error;
                    await this.page.waitForTimeout(1000);
                }
            }

            await this.page.waitForTimeout(3000);
            await l.searchButton.click();
            await l.checkboxNth(1).click();
            await l.checkboxNth(2).click();
            await l.checkboxNth(3).click();

            await l.allocateVehicleButton.click();

            try {
                await l.skipButton.waitFor({ state: 'visible', timeout: 2000 });
                await l.skipButton.click();
                console.log('Skip button found and clicked');
            } catch (error) {
                console.log('Skip button did not appear within 2 seconds, continuing...');
            }

            await l.deliveryTypeDropdown.click();
            await l.bothOption.click();

            await l.vehicleTypeDropdown.click();
            await l.regularOption.click();

            await l.vehicleSubTypeDropdown.click();
            await this.page.waitForSelector('div[title="Regular"]', { timeout: 5000 });
            await l.regularText.click();

            await l.vehicleNumberInputV2.click();
            await l.vehicleNumberInputV2.fill('KA8JD9302');

            await l.driverNameInputV2.click();
            await l.driverNameInputV2.fill('NIKesHh A');

            await l.vendorNameInputV2.click();
            await l.vendorNameInputV2.fill('Test Vendor');

            await l.driverNumberInputV2.click();
            await l.driverNumberInputV2.fill('8840576893');

            await l.deliveryBoyDropdownLast.click();
            await l.deliveryBoyInputLast.fill('del');
            await l.deliveryBoyOption.click();

            await l.submitButton.click();
            await l.confirmButton.click();
            await l.confirmButton.click();
            await this.page.waitForTimeout(3000);
            return true;
        } catch (err) {
            console.error('Login failed or form interaction issue:', err);
            return false;
        }
    }
};
