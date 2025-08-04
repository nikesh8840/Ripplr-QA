exports.DeliveredPage = class DeliveredPage {
    constructor(page) {
        this.page = page;
    }

    async delivered(username, password) {
      try {
        await this.page.getByRole('textbox', { name: 'User ID User ID' }).click();
        await this.page.getByRole('textbox', { name: 'User ID User ID' }).fill(username);
        await this.page.getByRole('button', { name: 'Login' }).click();
        await this.page.getByRole('textbox', { name: 'Password Password' }).click();
        await this.page.getByRole('textbox', { name: 'Password Password' }).fill(password);
        await this.page.getByRole('button', { name: 'Login' }).click();
        await this.page.getByText('Logistics Management').click();
        await this.page.getByRole('link', { name: 'Return To Fc' }).click();
        await this.page.locator('tr .ccyvke a').nth(0).click();
        await this.page.getByText('vehicle allocated').first().click();
        await this.page.getByText('Delivered', { exact: true }).click();
        await this.page.getByRole('button', { name: 'OK' }).click();
        await this.page.getByRole('button', { name: 'Yes' }).click();
        await this.page.getByRole('button', { name: 'right Delivery Details' }).click();
        await this.page.getByRole('button', { name: 'Update' }).click();
        await this.page.getByRole('radio', { name: 'Invoice Returned' }).check();
        await this.page.getByRole('button', { name: 'right Collection Details:' }).click();
        await this.page.getByRole('button', { name: 'Update' }).click();
        return true;
      } catch (err) {
        console.error('Delivered process failed:');
        return false;
        }
      }
};


