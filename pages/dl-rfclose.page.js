
const path = require('path');

exports.DlAndRFClosePage = class DlAndRFClosePage {
    constructor(page) {
        this.page = page;
    }

    async dlrfclose(username, password) {
      try {     
        const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
        await this.page.getByRole("textbox", { name: "User ID User ID" }).click();
        await this.page.getByRole("textbox", { name: "User ID User ID" }).fill(username);
        await this.page.getByRole("button", { name: "Login" }).click();
        await this.page.getByRole("textbox", { name: "Password Password" }).click();
        await this.page.getByRole("textbox", { name: "Password Password" }).fill(password);
        await this.page.getByRole("button", { name: "Login" }).click();
        await this.page.getByText("Logistics Management").click();
        await this.page.getByRole("link", { name: "Return To Fc" }).click();
        await this.page.locator("tr .ccyvke a").nth(0).click();
        await this.page.getByText("vehicle allocated").first().click();
        await this.page.getByText("Delivered", { exact: true }).click();
        await this.page.getByRole("button", { name: "OK" }).click();
        await this.page.getByRole("button", { name: "Yes" }).click();
        await this.page.getByRole("button", { name: "right Delivery Details" }).click();
        await this.page.getByRole("button", { name: "Update" }).click();
        await this.page.getByRole("radio", { name: "Invoice Returned" }).check();
        await this.page.getByRole("button", { name: "right Collection Details:" }).click();
        await this.page.getByRole("button", { name: "Update" }).click();
        await this.page.getByRole('link', {name: 'Invoice List'}).click();
        await this.page.waitForTimeout(700);
        await this.page.locator("td .fAmufx").nth(3).click();
        await this.page.getByRole("button", { name: "Verify" }).click();
        await this.page.getByRole("button", { name: "Upload", exact: true }).click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        await this.page.getByRole("button", { name: "Upload", exact: true }).click();
        await this.page.getByRole("button", { name: "Verify" }).click();
        await this.page.getByRole("button", { name: "Upload", exact: true }).click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        await this.page.getByRole("button", { name: "Upload", exact: true }).click();
        await page.waitForTimeout(1000);
        await page.getByRole('button', { name: 'Verify' }).click();
        return true;
      } catch (err) {
        console.error('Delivered process failed:');
        return false;
        }
      }
};


