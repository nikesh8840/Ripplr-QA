/**
 * Reusable login utility functions for Playwright tests
 */

/**
 * Performs login with username and password
 * @param {Page} page - Playwright page object
 * @param {string} username - Username to login with
 * @param {string} password - Password to login with
 * @returns {Promise<boolean>} - Returns true if login successful, false otherwise
 */
async function login(page, username, password) {
    try {
        console.log('Starting login process...');
        
        // Fill username
        await page.getByRole('textbox', { name: 'User ID User ID' }).click();
        await page.getByRole('textbox', { name: 'User ID User ID' }).fill(username);
        
        // Fill password
        await page.getByRole('textbox', { name: 'Password Password' }).click();
        await page.getByRole('textbox', { name: 'Password Password' }).fill(password);
        
        // Click login button
        await page.getByRole('button', { name: 'Login' }).click();
        
        // Wait for login to complete (you can adjust this based on your app's behavior)
        await page.waitForTimeout(2000);
        
        console.log('Login completed successfully');
        return true;
        
    } catch (error) {
        console.error('Login failed:', error);
        return false;
    }
}

/**
 * Performs login and navigates to a specific module
 * @param {Page} page - Playwright page object
 * @param {string} username - Username to login with
 * @param {string} password - Password to login with
 * @param {string} moduleName - Name of the module to navigate to (e.g., 'Logistics Management', 'Order Management')
 * @returns {Promise<boolean>} - Returns true if login and navigation successful, false otherwise
 */
async function loginAndNavigateToModule(page, username, password, moduleName) {
    try {
        const loginSuccess = await login(page, username, password);
        if (!loginSuccess) {
            return false;
        }
        
        // Navigate to the specified module
        await page.getByText(moduleName).click();
        console.log(`Navigated to ${moduleName} module`);
        
        return true;
        
    } catch (error) {
        console.error('Login and navigation failed:', error);
        return false;
    }
}

/**
 * Performs login and navigates to a specific module and sub-module
 * @param {Page} page - Playwright page object
 * @param {string} username - Username to login with
 * @param {string} password - Password to login with
 * @param {string} moduleName - Name of the main module
 * @param {string} subModuleName - Name of the sub-module/link
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
async function loginAndNavigateToSubModule(page, username, password, moduleName, subModuleName) {
    try {
        const loginSuccess = await login(page, username, password);
        if (!loginSuccess) {
            return false;
        }
        
        // Navigate to the main module
        await page.getByText(moduleName).click();
        console.log(`Navigated to ${moduleName} module`);
        
        // Navigate to the sub-module
        await page.getByRole('link', { name: subModuleName }).click();
        console.log(`Navigated to ${subModuleName} sub-module`);
        
        return true;
        
    } catch (error) {
        console.error('Login and navigation failed:', error);
        return false;
    }
}

module.exports = {
    login,
    loginAndNavigateToModule,
    loginAndNavigateToSubModule
};
