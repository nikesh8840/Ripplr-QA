exports.LoginPage = class LoginPage {
    constructor(page) {
        this.page = page;
    }

    async login(username, password) {
        
        await this.page.getByRole('textbox', { name: 'User ID User ID' }).click();
        await this.page.getByRole('textbox', { name: 'User ID User ID' }).fill(username);
        await this.page.getByRole('textbox', { name: 'Password Password' }).click();
        await this.page.getByRole('textbox', { name: 'Password Password' }).fill(password);
        await this.page.getByRole('button', { name: 'Login' }).click();

          try {
            await this.page.waitForSelector('text=Dashboard', { timeout: 5000 });
            return true;  // return something truthy
        } catch (err) {
            console.error('Login failed or Dashboard not found.');
            return false;
        }
    }
};
