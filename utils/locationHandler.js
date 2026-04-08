/**
 * Handles the Google location options dialog that appears on staging before login.
 * Clicks the first available location option. Safe to call on any page —
 * does nothing if the dialog is not present.
 */
async function handleLocationDialog(page) {
    try {
        // Wait up to 4 seconds for any location option to appear
        await page.waitForSelector('.pac-item, [class*="pac-item"], [role="option"]', { timeout: 4000 });
        await page.locator('.pac-item, [class*="pac-item"], [role="option"]').first().click();
        console.log('Location option selected');
    } catch {
        // Dialog did not appear — continue without action
    }
}

module.exports = { handleLocationDialog };
