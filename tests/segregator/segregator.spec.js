const { test, expect } = require('@playwright/test');

// Segregator uses staging URL with separate credentials
const STAGING_URL = 'https://cdms-staging.ripplr.in/login';
const SEG_USER    = 'seg4@ripplr.in';
const SEG_PASS    = 'Ripplr@123';

test.describe('Segregator Flows', () => {

    test('Segregator login and verify item (green tick → Save)', async ({ page }) => {
        test.setTimeout(120000);

        await page.goto(STAGING_URL);
        await page.getByRole('textbox', { name: /User ID/i }).fill(SEG_USER);
        await page.getByRole('textbox', { name: /Password/i }).fill(SEG_PASS);
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForURL('**/dashboard', { timeout: 15000 });

        await page.getByRole('link', { name: 'Verification' }).click();
        await page.waitForLoadState('networkidle');

        // Find first item in "Ready for verification" state
        const readyRow = page.getByRole('table').getByText('Ready for verification').first();
        await readyRow.waitFor({ state: 'visible', timeout: 10000 });
        await readyRow.click();

        await page.getByRole('button', { name: 'Start Verification' }).click();
        await page.waitForLoadState('networkidle');

        // Click green tick to mark as verified
        await page.getByRole('img', { name: 'greenTick' }).first().click();

        await page.getByRole('button', { name: 'Save' }).click();
        await page.waitForTimeout(3000);

        console.log('Segregator verify flow completed');
    });

    test('Segregator login and reject item', async ({ page }) => {
        test.setTimeout(120000);

        await page.goto(STAGING_URL);
        await page.getByRole('textbox', { name: /User ID/i }).fill(SEG_USER);
        await page.getByRole('textbox', { name: /Password/i }).fill(SEG_PASS);
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForURL('**/dashboard', { timeout: 15000 });

        await page.getByRole('link', { name: 'Verification' }).click();
        await page.waitForLoadState('networkidle');

        // Find first item in "Ready for verification" state
        const readyRow = page.getByRole('table').getByText('Ready for verification').first();
        await readyRow.waitFor({ state: 'visible', timeout: 10000 });
        await readyRow.click();

        await page.getByRole('button', { name: 'Start Verification' }).click();
        await page.waitForLoadState('networkidle');

        // Click red/reject icon (cross/X) to mark as rejected
        const rejectIcon = page.getByRole('img', { name: /red|reject|cross/i }).first();
        if (await rejectIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
            await rejectIcon.click();
        } else {
            // Fallback: click second icon per row (reject is typically after green)
            await page.locator('img').nth(1).click();
        }

        await page.getByRole('button', { name: 'Save' }).click();
        await page.waitForTimeout(3000);

        console.log('Segregator reject flow completed');
    });

    test('Segregator login lands on Dashboard', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto(STAGING_URL);
        await page.getByRole('textbox', { name: /User ID/i }).fill(SEG_USER);
        await page.getByRole('textbox', { name: /Password/i }).fill(SEG_PASS);
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForURL('**/dashboard', { timeout: 15000 });

        await expect(page).toHaveURL(/\/dashboard/);
    });

});
