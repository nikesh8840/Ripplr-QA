/**
 * GRN (Goods Received Note) Locators
 * URL: /warehouse-management/asn/grn
 */
const grnLocators = (page) => ({

    // ── Navigation ────────────────────────────────────────────────────────────
    orderManagementMenu:    page.getByRole('menuitem', { name: 'Order Management' }),
    grnLink:                page.getByRole('link', { name: 'GRN' }),

    // ── Filters ───────────────────────────────────────────────────────────────
    fcCombobox:             page.getByRole('combobox', { name: /FC\(s\) Select FC\(s\)/i }),
    brandsCombobox:         page.getByRole('combobox', { name: 'Brands' }),
    invoiceNoInput:         page.getByPlaceholder('Search by invoice no.'),
    invoiceUploadPendingSwitch: page.getByRole('switch', { name: 'Invoice Upload Pending' }),
    searchButton:           page.getByRole('button', { name: 'Search' }),

    // ── Table ─────────────────────────────────────────────────────────────────
    tableBody:              page.locator('table tbody'),
    firstRow:               page.locator('table tbody tr').first(),
    // Columns: Brand GRN Date, FC, Brand, GRN No, GRN Value, Invoice No, Uploaded By, Updated At
    firstRowGrnNo:          page.locator('table tbody tr').first().locator('td').nth(3),
    firstRowInvoiceNo:      page.locator('table tbody tr').first().locator('td').nth(5),
    rowByGrnNo:     (grn)   => page.locator(`table tbody tr:has-text("${grn}")`),

    // ── Pagination ────────────────────────────────────────────────────────────
    prevPageButton:         page.getByRole('button', { name: 'left' }),
    nextPageButton:         page.getByRole('button', { name: 'right' }),
    pageSizeCombobox:       page.getByRole('combobox', { name: 'Page Size' }),
});

module.exports = grnLocators;
