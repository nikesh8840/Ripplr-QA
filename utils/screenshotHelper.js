const fs   = require('fs');
const path = require('path');

// Root folder where all screenshots are stored
const SCREENSHOT_ROOT = path.resolve(__dirname, '..', 'screenshots');

// Screenshots older than this many days are auto-deleted
const RETENTION_DAYS = 7;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns today's date string formatted as YYYY-MM-DD.
 */
function todayFolder() {
    return new Date().toISOString().slice(0, 10); // e.g. "2026-04-08"
}

/**
 * Returns current time formatted as HH-MM-SS (safe for filenames).
 */
function timeStamp() {
    return new Date().toTimeString().slice(0, 8).replace(/:/g, '-'); // e.g. "14-35-22"
}

/**
 * Ensures a directory exists, creating it (and all parents) if needed.
 * @param {string} dir - Absolute path to directory
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// ─── Auto-cleanup ────────────────────────────────────────────────────────────

/**
 * Deletes screenshot date-folders that are older than RETENTION_DAYS days.
 * Called silently every time a screenshot is taken.
 */
function cleanupOldScreenshots() {
    if (!fs.existsSync(SCREENSHOT_ROOT)) return;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    const folders = fs.readdirSync(SCREENSHOT_ROOT);

    for (const folder of folders) {
        // Only process YYYY-MM-DD folders
        if (!/^\d{4}-\d{2}-\d{2}$/.test(folder)) continue;

        const folderDate = new Date(folder);
        if (isNaN(folderDate)) continue;

        if (folderDate < cutoff) {
            const folderPath = path.join(SCREENSHOT_ROOT, folder);
            fs.rmSync(folderPath, { recursive: true, force: true });
            console.log(`[screenshotHelper] Deleted old screenshots folder: ${folder}`);
        }
    }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Takes a screenshot and saves it under screenshots/YYYY-MM-DD/{name}_{HH-MM-SS}.png
 * Also auto-purges any folders older than 7 days.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} name  - Descriptive name for the screenshot (e.g. 'login', 'add-user-form')
 * @param {object} [options]
 * @param {boolean} [options.fullPage=true]  - Capture full scrollable page
 * @returns {Promise<string>} Absolute path of the saved screenshot
 *
 * @example
 * const { takeScreenshot } = require('../utils/screenshotHelper');
 * await takeScreenshot(page, 'order-details');
 * await takeScreenshot(page, 'add-user-form', { fullPage: false });
 */
async function takeScreenshot(page, name, options = {}) {
    const { fullPage = true } = options;

    // Sanitise name — replace spaces / special chars with hyphens
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();

    const dateDir  = path.join(SCREENSHOT_ROOT, todayFolder());
    const fileName = `${safeName}_${timeStamp()}.png`;
    const filePath = path.join(dateDir, fileName);

    ensureDir(dateDir);

    // Auto-delete screenshots older than RETENTION_DAYS
    cleanupOldScreenshots();

    await page.screenshot({ path: filePath, fullPage });

    console.log(`[screenshotHelper] Saved: screenshots/${todayFolder()}/${fileName}`);
    return filePath;
}

module.exports = { takeScreenshot, cleanupOldScreenshots, SCREENSHOT_ROOT };
