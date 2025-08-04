exports.VehicleAllocationPage = class VehicleAllocationPage {
    constructor(page) {
        this.page = page;
    }

    async allocateVehicle(username, password) {
        try {
            await this.page.getByRole('textbox', { name: 'User ID User ID' }).click();
            await this.page.getByRole('textbox', { name: 'User ID User ID' }).fill(username);
            await this.page.getByRole('textbox', { name: 'Password Password' }).click();
            await this.page.getByRole('textbox', { name: 'Password Password' }).fill(password);
            await this.page.getByRole('button', { name: 'Login' }).click();

            await this.page.getByText('Logistics Management').click();
            await this.page.getByRole('link', { name: 'Delivery Allocation' }).click();
            await this.page.getByRole('button', { name: 'Create Delivery Allocation' }).click();

            // ✅ FC Filter with Wait
            await this.page.getByRole('combobox', { name: 'FC(s) Select FC(s)' }).click();
            await this.page.getByRole('combobox', { name: 'FC(s) Select FC(s)' }).fill('btml');
            await this.page.waitForSelector('text=BTML: BTM', { timeout: 5000 });
            await this.page.getByText('BTML: BTM').click();

            // ✅ Brand Filter with Wait
            // await this.page.locator('label').filter({ hasText: 'Brands Select Brand(s)' }).locator('div').nth(2).click();
            await this.page.getByRole('combobox', { name: 'Brands Select Brand(s)' }).click();
            await this.page.getByRole('combobox', { name: 'Brands Select Brand(s)' }).fill('bri');
            await this.page.waitForSelector('text=BRIT: Britania', { timeout: 5000 });
            await this.page.getByText('BRIT: Britania').click();

            await this.page.getByRole('button', { name: 'Search' }).click();
            await this.page.getByRole('listitem', { name: '2' }).locator('a').click();
            await this.page.locator('.ant-checkbox').nth(8).click();
            // await this.page.locator('.ant-checkbox').nth(9).click();
            // await this.page.locator('.ant-checkbox').nth(10).click();

            await this.page.getByRole('button', { name: 'Allocate Vehicle' }).click();

            await this.page.locator('.ant-form-item-control-input-content').first().click();
            await this.page.getByTitle('Both').locator('div').click();

            await this.page.locator('.ant-form-item-control-input-content').nth(1).click();
            await this.page.getByTitle('Regular').locator('div').click();

            await this.page.locator('.ant-form-item-control-input-content').nth(2).click();
            await this.page.waitForSelector('div[title="Regular"]', { timeout: 5000 });
            await this.page.getByText('Regular').nth(4).click();

            await this.page.getByRole('textbox', { name: '*Vehicle No' }).click();
            await this.page.getByRole('textbox', { name: '*Vehicle No' }).fill('KA8JD9302');

            await this.page.getByRole('textbox', { name: '*Driver', exact: true }).click();
            await this.page.getByRole('textbox', { name: '*Driver', exact: true }).fill('Nikesh A');

            await this.page.getByRole('textbox', { name: '*Vendor' }).click();
            await this.page.getByRole('textbox', { name: '*Vendor' }).fill('dfs');

            await this.page.locator('div').filter({ hasText: /^\*Driver Mobile Number$/ }).nth(2).click();
            await this.page.getByRole('textbox', { name: '*Driver Mobile Number' }).click();
            await this.page.getByRole('textbox', { name: '*Driver Mobile Number' }).fill('8840576893');

            await this.page.locator('.ant-form-item-control-input-content').last().click();
            await this.page.locator('.ant-form-item-control-input-content input').last().fill('del');
            await this.page.getByTitle('Delivery Boy').locator('div').click();

            await this.page.getByRole('button', { name: 'Submit' }).click();
            await this.page.waitForTimeout(3000);

            return true;
        } catch (err) {
            console.error('Login failed or form interaction issue:', err);
            return false;
        }
    }
};
