const invoiceData = require('../test-data/allocation/vehicleallocationdata');
const { getFCName, getBrandName } = require('../utils/fcbrands');
exports.VehicleAllocationPage = class VehicleAllocationPage {
    constructor(page) {
        this.page = page;
    }


    async processSelectionInvoice() {
        const invoices = invoiceData.invoiceData;
        try {
            for(let i = 0; i < invoices.length; i++) {
                console.log(`Processing invoice: ${invoices[i]}`);
                
                // Clear and fill search field
                await this.page.locator("input[placeholder='Search by invoice number']").click();
                await this.page.locator("input[placeholder='Search by invoice number']").clear();
                await this.page.locator("input[placeholder='Search by invoice number']").fill(invoices[i]);
                
                // Click search button
                await this.page.getByRole('button', { name: 'Search' }).click();
                
                // Wait for search results to load
                await this.page.waitForTimeout(2000);
                
                // Wait for the specific row with the invoice to appear
                await this.page.waitForSelector(`tr:has-text("${invoices[i]}")`, { timeout: 10000 });
                
                // Find and click the checkbox for the specific invoice row
                const invoiceRow = this.page.locator(`tr:has-text("${invoices[i]}")`);
                await invoiceRow.locator('.ant-checkbox').click();
                
                console.log(`Successfully selected invoice: ${invoices[i]}`);
                
                // Clear search field for next iteration
                await this.page.locator("input[placeholder='Search by invoice number']").clear();
            }
            return true;
        } catch (err) {
            console.error('Error processing invoice selection:', err);
            return false;
        }
    }

    

    async allocateVehicle(username, password) {
        console.log('invoiceData', invoiceData);
        try {
            await this.page.getByRole('textbox', { name: 'User ID User ID' }).click();
            await this.page.getByRole('textbox', { name: 'User ID User ID' }).fill(username);
            await this.page.getByRole('textbox', { name: 'Password Password' }).click();
            await this.page.getByRole('textbox', { name: 'Password Password' }).fill(password);
            await this.page.getByRole('button', { name: 'Login' }).click();

            await this.page.getByText('Logistics Management').click();
            await this.page.getByRole('link', { name: 'Delivery Allocation' }).click();
            await this.page.getByRole('button', { name: 'Create Delivery Allocation' }).click();


            await this.processSelectionInvoice();

            // ✅ FC Filter with Wait
            // await this.page.getByRole('combobox', { name: 'FC(s) Select FC(s)' }).click();
            // await this.page.getByRole('combobox', { name: 'FC(s) Select FC(s)' }).fill('btml');
            // await this.page.waitForSelector('text=BTML: BTM', { timeout: 5000 });
            // await this.page.getByText('BTML: BTM').click();

            // ✅ Invoice Filter 
            // await this.page.getByRole('combobox', { name: 'Search Search by invoice number' }).click();
            // await this.page.getByRole('combobox', { name: 'Search Search by invoice number' }).fill('btml');
            // await this.page.waitForSelector('text=BTML: BTM', { timeout: 5000 });
            // await this.page.getByText('BTML: BTM').click();

            // ✅ Brand Filter with Wait
            // await this.page.locator('label').filter({ hasText: 'Brands Select Brand(s)' }).locator('div').nth(2).click();
            // await this.page.getByRole('combobox', { name: 'Brands Select Brand(s)' }).click();
            // await this.page.getByRole('combobox', { name: 'Brands Select Brand(s)' }).fill('bri');
            // await this.page.waitForSelector('text=BRIT: Britania', { timeout: 5000 });
            // await this.page.getByText('BRIT: Britania').click();

            // await this.page.getByRole('button', { name: 'Search' }).click();
            // await this.page.getByRole('listitem', { name: '2' }).locator('a').click();
            // await this.page.locator('.ant-checkbox').nth(1).click();
            // await this.page.locator('.ant-checkbox').nth(2).click();
            // await this.page.locator('.ant-checkbox').nth(3).click();
            // await this.page.locator('.ant-checkbox').nth(4).click();
            // await this.page.locator('.ant-checkbox').nth(5).click();
            // await this.page.locator('.ant-checkbox').nth(6).click();
            // await this.page.locator('.ant-checkbox').nth(7).click();
            // await this.page.locator('.ant-checkbox').nth(8).click();
            // await this.page.locator('.ant-checkbox').nth(9).click();

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
    async allocateVehiclewithfcbrand(username, password, fc, brand) {
        try {
            await this.page.getByRole('textbox', { name: 'User ID User ID' }).click();
            await this.page.getByRole('textbox', { name: 'User ID User ID' }).fill(username);
            await this.page.getByRole('textbox', { name: 'Password Password' }).click();
            await this.page.getByRole('textbox', { name: 'Password Password' }).fill(password);
            await this.page.getByRole('button', { name: 'Login' }).click();

            await this.page.getByText('Logistics Management').click();
            await this.page.getByRole('link', { name: 'Delivery Allocation' }).click();
            await this.page.getByRole('button', { name: 'Create Delivery Allocation' }).click();


            // ✅ FC Filter with Wait and Retry
            const fcName = getFCName(fc);
            let fcSelected = false;
            let fcRetryCount = 0;
            const maxFcRetries = 3;
            
            while (!fcSelected && fcRetryCount < maxFcRetries) {
                try {
                    await this.page.getByRole('combobox', { name: 'FC(s) Select FC(s)' }).click();
                    await this.page.getByRole('combobox', { name: 'FC(s) Select FC(s)' }).fill(fc);
                    await this.page.waitForSelector(`text=${fcName}`, { timeout: 5000 });
                    await this.page.getByText(fcName).click();
                    fcSelected = true;
                    console.log(`FC selection successful on attempt ${fcRetryCount + 1}`);
                } catch (error) {
                    fcRetryCount++;
                    console.log(`FC selection failed on attempt ${fcRetryCount}, retrying...`);
                    if (fcRetryCount >= maxFcRetries) {
                        console.error(`FC selection failed after ${maxFcRetries} attempts:`, error);
                        throw error;
                    }
                    await this.page.waitForTimeout(1000); // Wait 1 second before retry
                }
            }

            const brandName = getBrandName(brand);
            let brandSelected = false;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (!brandSelected && retryCount < maxRetries) {
                try {
                    await this.page.getByRole('combobox', { name: 'Brands Select Brand(s)' }).click();
                    await this.page.getByRole('combobox', { name: 'Brands Select Brand(s)' }).fill(brand);
                    await this.page.waitForSelector(`text=${brandName}`, { timeout: 5000 });
                    await this.page.getByText(brandName).click();
                    brandSelected = true;
                    console.log(`Brand selection successful on attempt ${retryCount + 1}`);
                } catch (error) {
                    retryCount++;
                    console.log(`Brand selection failed on attempt ${retryCount}, retrying...`);
                    if (retryCount >= maxRetries) {
                        console.error(`Brand selection failed after ${maxRetries} attempts:`, error);
                        throw error;
                    }
                    await this.page.waitForTimeout(1000); // Wait 1 second before retry
                }
            }

            await this.page.waitForTimeout(3000);

            await this.page.getByRole('button', { name: 'Search' }).click();
            await this.page.locator('.ant-checkbox').nth(1).click();
            await this.page.locator('.ant-checkbox').nth(2).click();
            await this.page.locator('.ant-checkbox').nth(3).click();
            await this.page.locator('.ant-checkbox').nth(4).click();

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
