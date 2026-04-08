const loginLocators = require('../locators/login.locators');
const deliveredLocators = require('../locators/delivered.locators');

exports.DeliveredPage = class DeliveredPage {
    constructor(page) {
        this.page = page;
    }

    async delivered(username, password) {
        try {
            const login = loginLocators(this.page);
            const l = deliveredLocators(this.page);

            await login.usernameInput.click();
            await login.usernameInput.fill(username);
            await login.loginButton.click();
            await login.passwordInput.click();
            await login.passwordInput.fill(password);
            await login.loginButton.click();

            await l.logisticsManagementMenu.click();
            await l.returnToFcLink.click();
            await l.firstDeliveryRow.click();
            await l.vehicleAllocatedStatus.click();
            await l.deliveredOption.click();
            await l.okButton.click();
            await l.yesButton.click();
            await l.deliveryDetailsButton.click();
            await l.updateButton.click();
            await l.invoiceReturnedRadio.check();
            await l.collectionDetailsButton.click();
            await l.updateButton.click();
            await this.page.waitForTimeout(1000);
            return true;
        } catch (err) {
            console.error('Delivered process failed:');
            return false;
        }
    }
};
