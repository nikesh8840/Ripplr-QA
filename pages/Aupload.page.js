
const path = require('path');

exports.Uploadfile = class Uploadfile {
    constructor(page) {
        this.page = page;
    }

    async Upload(username, password, uploadtype, name) {
        const filePath = path.resolve(__dirname, `../test-data/APX/${name}.csv`);
        await this.page.getByRole('textbox', { name: 'User ID User ID' }).click();
        await this.page.getByRole('textbox', { name: 'User ID User ID' }).fill(username);
        await this.page.getByRole('textbox', { name: 'Password Password' }).click();
        await this.page.getByRole('textbox', { name: 'Password Password' }).fill(password);
        await this.page.getByRole('button', { name: 'Login' }).click();
        await this.page.getByRole('link', { name: 'Adapter Uploads' }).click();
        await this.page.getByRole('button', { name: 'Upload' }).click();
        await this.page.getByLabel('Upload Csv').locator('label span').nth(1).click();
        await this.page.waitForTimeout(200);
        // await this.page.getByText(uploadtype).click();
        await this.page.getByTitle(uploadtype).locator('div').click();
        await this.page.locator('div').filter({ hasText: /^Fc Type$/ }).nth(4).click();
        await this.page.locator('#rc_select_6').click();
        await this.page.locator('#rc_select_6').fill('erhs');
        await this.page.getByText('ERHS: ERHS').click();
        await this.page.getByRole('combobox', { name: '*Brand' }).click();
        await this.page.getByRole('combobox', { name: '*Brand' }).fill('apx');
        await this.page.getByText('APX: APX').click();
        // await this.page.locator('button').filter({ hasText: 'Upload a File', exact: true }).click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        // await this.page.locator('button').filter({ hasText: 'Upload a File', exact: true }).click();
        await this.page.getByRole('button', { name: 'Submit' }).click();
        await this.page.waitForTimeout(4000);
        await this.page.getByRole('combobox', { name: 'Select File Types' }).click();
        await this.page.getByTitle(uploadtype).locator('div').click();
        await this.page.getByRole('combobox', { name: 'FC Select FC' }).click();
        await this.page.getByRole('combobox', { name: 'FC Select FC' }).fill('erhs');
        await this.page.getByText('ERHS: ERHS').click();
        await this.page.locator('label').filter({ hasText: 'Brand(s) Select Brand(s)' }).locator('div').nth(2).click();
        await this.page.getByRole('combobox', { name: 'Brand(s) Select Brand(s)' }).fill('apx');
        await this.page.getByText('APX: APX').click();
        await this.page.getByRole('button', { name: 'Search' }).click();
        for (let i = 0; i < 5; i++) { // max 5 retries (20 seconds total)
            try {
                await this.page.locator("td[class='ant-table-cell ant-table-cell-row-hover'] span[aria-label='sync'] svg").click({ timeout: 2000 });
                console.log("✅ Click succeeded");
                break; // exit loop if click worked
            } catch (error) {
                console.log(`⚠️ Attempt ${i + 1} failed, retrying in 4s...`);
                await this.page.waitForTimeout(2000);
            }
        }

        await this.page.waitForTimeout(3000);
        // await this.page.locator('.ant-table-cell.ant-table-cell-row-hover > .sc-bczRLJ.sc-gsnTZi > div:nth-child(4)').click();
        await this.page.getByRole('button', { name: 'Refresh' }).click();
        await this.page.getByRole('button', { name: 'Close' }).click();
        await this.page.waitForTimeout(10000);   
        return true;

      }
};
