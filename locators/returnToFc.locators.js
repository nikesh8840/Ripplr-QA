/**
 * Return to FC (new) Locators
 * URL: /logistics-management/return-to-fc-new
 *
 * NOTE: DlAndRFClose page object uses dlRfclose.locators.js for the delivery action form.
 *       This file covers the Return to FC list/search page.
 */
const returnToFcLocators = (page) => ({

    // ── Navigation ────────────────────────────────────────────────────────────
    logisticsManagementMenu: page.getByRole('menuitem', { name: 'Logistics Management' }),
    returnToFcLink:          page.getByRole('link', { name: 'Return to FC' }),

    // ── Filters (common pattern from other list pages) ────────────────────────
    searchButton:            page.getByRole('button', { name: 'Search' }),
    fcCombobox:              page.getByRole('combobox', { name: /FC\(s\) Select FC\(s\)/i }),
    brandsCombobox:          page.getByRole('combobox', { name: 'Brands' }),

    // ── Table ─────────────────────────────────────────────────────────────────
    tableBody:               page.locator('table tbody'),
    firstRow:                page.locator('table tbody tr').first(),
    allRows:                 page.locator('table tbody tr'),
    firstRowEditIcon:        page.locator('table tbody tr').first().locator('img[alt="edit-icon"]'),

    // ── Pagination ────────────────────────────────────────────────────────────
    prevPageButton:          page.getByRole('button', { name: 'left' }),
    nextPageButton:          page.getByRole('button', { name: 'right' }),
    pageSizeCombobox:        page.getByRole('combobox', { name: 'Page Size' }),
});

module.exports = returnToFcLocators;
