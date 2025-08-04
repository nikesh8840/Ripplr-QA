exports.SmokeReadPage = class SmokeReadPage {
    constructor(page) {
        this.page = page;
    }

    async smokeRead(username, password) {
        try {
            await this.page.getByRole('textbox', { name: 'User ID User ID' }).click();
            await this.page.getByRole('textbox', { name: 'User ID User ID' }).fill(username);
            await this.page.getByRole('textbox', { name: 'Password Password' }).click();
            await this.page.getByRole('textbox', { name: 'Password Password' }).fill(password);
            await this.page.getByRole('img', { name: 'eye-invisible' }).locator('path').first().click();
            await this.page.getByRole('button', { name: 'Login' }).click();
            await this.page.getByText('Sales Order').click();
            await this.page.getByRole('link', { name: 'Dashboard' }).click();
            await this.page.getByText('Returns').nth(2).click();
            await this.page.getByRole('link', { name: 'Dashboard' }).click();
            await this.page.getByText('Delivery Allocation').click();
            await this.page.getByRole('link', { name: 'Dashboard' }).click();
            await this.page.getByText('Return To FC', { exact: true }).click();
            await this.page.getByRole('link', { name: 'Dashboard' }).click();
            await this.page.getByText('Goods Received Note').click();
            await this.page.getByRole('link', { name: 'Dashboard' }).click();
            await this.page.getByText('Onboarding').nth(1).click();
            await this.page.getByRole('link', { name: 'Dashboard' }).click();
            await this.page.getByText('Adapter Uploads').nth(1).click();
            await this.page.getByRole('link', { name: 'Dashboard' }).click();
            await this.page.getByText('Downloads').nth(1).click();
            await this.page.getByRole('link', { name: 'Dashboard' }).click();
            await this.page.getByText('WMS Logs').nth(1).click();
            await this.page.getByRole('link', { name: 'Dashboard' }).click();
            await this.page.getByText('Cheque bounce', { exact: true }).click();
            await this.page.getByRole('link', { name: 'Dashboard' }).click();
            await this.page.getByText('Retailer Ledger').click();
            await this.page.getByRole('link', { name: 'Dashboard' }).click();
            await this.page.getByText('finOps', { exact: true }).click();
            await this.page.getByRole('textbox', { name: 'Search', exact: true }).click();
            await this.page.getByRole('textbox', { name: 'Search', exact: true }).fill('3');
            await this.page.getByRole('button', { name: 'Submit' }).click();
            await this.page.getByRole('link', { name: 'Dashboard' }).click();
            await this.page.getByText('Order Management').click();
            await this.page.getByRole('link', { name: 'Sales Order' }).click();
            await this.page.getByRole('link', { name: 'Returns', exact: true }).click();
            await this.page.getByRole('button', { name: 'Add Sales return' }).click();
            await this.page.getByRole('menuitem', { name: 'Returns', exact: true }).getByRole('link').click();
            await this.page.getByRole('link', { name: 'Brand Sales Returns' }).click();
            await this.page.getByRole('menu').getByText('Order Management').click();
            await this.page.getByText('Logistics Management').click();
            await this.page.getByRole('link', { name: 'Delivery Allocation' }).click();
            await this.page.getByRole('button', { name: 'Create Delivery Allocation' }).click();
            await this.page.getByRole('link', { name: 'Return To Fc' }).click();
            await this.page.getByRole('link', { name: 'Retailer Verification' }).click();
            await this.page.locator('.ant-picker-input').click();
            await this.page.locator('.ant-picker-header-prev-btn').click();
            await this.page.getByText('26', { exact: true }).click();
            await this.page.getByRole('button', { name: 'Search' }).click();
            await this.page.getByText('Warehouse Management').click();
            await this.page.getByRole('link', { name: 'WMS Logs' }).click();
            await this.page.getByRole('link', { name: 'PO Logs' }).click();
            await this.page.getByRole('link', { name: 'ASN' }).click();
            await this.page.getByText('Goods Received Note').click();
            await this.page.getByText('Onboarding').click();
            await this.page.getByRole('link', { name: 'Company' }).click();
            await this.page.getByRole('button', { name: 'Add Company' }).click();
            await this.page.getByRole('link', { name: 'Company' }).nth(1).click();
            await this.page.locator('td:nth-child(9)').first().click();
            await this.page.getByRole('link', { name: 'Company' }).nth(1).click();
            await this.page.getByRole('link', { name: 'Client' }).click();
            await this.page.getByRole('link', { name: 'Brand' }).click();
            await this.page.getByRole('link', { name: 'FC' }).click();
            await this.page.getByRole('link', { name: 'Store', exact: true }).click();
            await this.page.getByRole('link', { name: 'Store Category' }).click();
            await this.page.getByRole('link', { name: 'User' }).click();
            await this.page.getByRole('link', { name: 'Salesman' }).click();
            await this.page.getByText('Masters').click();
            await this.page.getByRole('link', { name: 'Bank' }).click();
            await this.page.getByRole('link', { name: 'Pincode' }).click();
            await this.page.getByRole('link', { name: 'Pack Master' }).click();
            await this.page.getByText('Onboarding').click();
            await this.page.getByText('Finance Management').click();
            await this.page.getByRole('link', { name: 'Retailer Ledger' }).click();
            await this.page.getByRole('link', { name: 'FinOps' }).click();
            await this.page.getByRole('menu').getByText('Finance Management').click();
            await this.page.getByText('Cheque Bounce', { exact: true }).click();
            await this.page.getByRole('link', { name: 'Cheque Bounce List' }).click();
            await this.page.getByRole('link', { name: 'Adapter Uploads' }).click();
            await this.page.getByRole('link', { name: 'Downloads' }).click();
            await this.page.getByRole('button', { name: 'Download Reports' }).click();
            await this.page.getByRole('combobox', { name: 'Report Type Select Report Type' }).click();
            await this.page.getByText('Sales Order (Invoice Wise)').click();
            return true;  // return something truthy
        } catch (err) {
            console.error('Login failed or Dashboard not found.');
            return false;
        }
    }
};
