/**
 * Adapter Uploads Locators
 * URL: /adapter-uploads
 *
 * NOTE: upload.locators.js has detailed modal + form locators for the upload flow.
 *       This file covers the list/search page.
 */
const adapterUploadsLocators = (page) => ({

    // ── Navigation ────────────────────────────────────────────────────────────
    adapterUploadsLink:     page.getByRole('link', { name: 'Adapter Uploads' }),

    // ── List Page – Filters ───────────────────────────────────────────────────
    fcCombobox:             page.getByRole('combobox', { name: /FC/i }).first(),
    brandsCombobox:         page.getByRole('combobox', { name: /Brand/i }).first(),
    fileTypeCombobox:       page.getByRole('combobox', { name: /File Type/i }),
    searchButton:           page.getByRole('button', { name: 'Search' }),

    // ── Upload Action ─────────────────────────────────────────────────────────
    uploadButton:           page.getByRole('button', { name: /Upload/i }).first(),

    // ── Table ─────────────────────────────────────────────────────────────────
    tableBody:              page.locator('table tbody'),
    firstRow:               page.locator('table tbody tr').first(),
    firstRowStatus:         page.locator('table tbody tr').first().locator('td').nth(4),

    // ── Upload Modal ──────────────────────────────────────────────────────────
    modalFcInput:           page.locator('.ant-modal-body').locator('input').first(),
    modalBrandCombobox:     page.locator('.ant-modal-body').getByRole('combobox', { name: /Brand/i }),
    modalFileInput:         page.locator('input[type="file"]').first(),
    modalSubmitButton:      page.locator('.ant-modal-body').getByRole('button', { name: 'Submit' }),
    modalCloseButton:       page.locator('.ant-modal-close'),

    // ── Pagination ────────────────────────────────────────────────────────────
    prevPageButton:         page.getByRole('button', { name: 'left' }),
    nextPageButton:         page.getByRole('button', { name: 'right' }),
    pageSizeCombobox:       page.getByRole('combobox', { name: 'Page Size' }),
});

module.exports = adapterUploadsLocators;
