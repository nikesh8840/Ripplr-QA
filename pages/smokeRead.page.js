const loginLocators = require('../locators/login.locators');
const smokeReadLocators = require('../locators/smokeRead.locators');

exports.SmokeReadPage = class SmokeReadPage {
    constructor(page) {
        this.page = page;
    }

    async smokeRead(username, password) {
        try {
            const login = loginLocators(this.page);
            const l = smokeReadLocators(this.page);

            await login.usernameInput.click();
            await login.usernameInput.fill(username);
            await login.passwordInput.click();
            await login.passwordInput.fill(password);
            await login.loginButton.click();

            await l.salesOrderLink.click();
            await l.dashboardLink.click();
            await l.returnsMenu.click();
            await l.dashboardLink.click();
            await l.deliveryAllocationMenu.click();
            await l.dashboardLink.click();
            await l.returnToFcMenu.click();
            await l.dashboardLink.click();
            await l.goodsReceivedNoteMenu.click();
            await l.dashboardLink.click();
            await l.onboardingMenu.click();
            await l.dashboardLink.click();
            await l.adapterUploadsMenu.click();
            await l.dashboardLink.click();
            await l.downloadsMenu.click();
            await l.dashboardLink.click();
            await l.wmsLogsMenu.click();
            await l.dashboardLink.click();
            await l.chequeBounceMenu.click();
            await l.dashboardLink.click();
            await l.retailerLedgerMenu.click();
            await l.dashboardLink.click();
            await l.finOpsMenu.click();
            await l.finOpsSearchInput.click();
            await l.finOpsSearchInput.fill('3');
            await l.submitButton.click();
            await l.dashboardLink.click();
            await l.orderManagementMenu.click();
            await l.salesOrderLink.click();
            await l.returnsLink.click();
            await l.addSalesReturnButton.click();
            await l.returnsMenuItem.click();
            await l.brandSalesReturnsLink.click();
            await l.orderManagementMenuItem.click();
            await l.logisticsManagementMenu.click();
            await l.deliveryAllocationLink.click();
            await l.createDeliveryAllocButton.click();
            await l.returnToFcLink.click();
            await l.retailerVerificationLink.click();
            await l.datePickerInput.click();
            await l.prevMonthButton.click();
            await l.day26.click();
            await l.searchButton.click();
            await l.warehouseManagementMenu.click();
            await l.wmsLogsLink.click();
            await l.poLogsLink.click();
            await l.asnLink.click();
            await l.goodsReceivedNoteMenu.click();
            await l.onboardingTopMenu.click();
            await l.companyLink.click();
            await l.addCompanyButton.click();
            await l.companyLinkNth1.click();
            await l.firstRowLastCell.click();
            await l.companyLinkNth1.click();
            await l.clientLink.click();
            await l.brandLink.click();
            await l.fcLink.click();
            await l.storeLink.click();
            await l.storeCategoryLink.click();
            await l.userLink.click();
            await l.salesmanLink.click();
            await l.mastersMenu.click();
            await l.bankLink.click();
            await l.pincodeLink.click();
            await l.packMasterLink.click();
            await l.onboardingTopMenu.click();
            await l.financeManagementMenu.click();
            await l.retailerLedgerLink.click();
            await l.finOpsLink.click();
            await l.financeManagementMenuItem.click();
            await l.chequeBounceTopMenu.click();
            await l.chequeBounceListLink.click();
            await l.adapterUploadsLink.click();
            await l.downloadsLink.click();
            await l.downloadReportsButton.click();
            await l.reportTypeCombobox.click();
            await l.salesOrderInvoiceOption.click();
            return true;
        } catch (err) {
            console.error('Login failed or Dashboard not found.');
            return false;
        }
    }
};
