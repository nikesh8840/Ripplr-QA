/**
 * Sales Returns Locators
 * List URL:   /order-management/returns
 * Create via: "Add Sales return" button on list page
 */
const salesReturnLocators = (page) => ({

    // ── Navigation ────────────────────────────────────────────────────────────
    orderManagementMenu:    page.getByRole('menuitem', { name: 'Order Management' }),
    returnsLink:            page.getByRole('link', { name: 'Returns' }),

    // ── List Page – Filters ───────────────────────────────────────────────────
    invoiceNoInput:         page.getByPlaceholder('Search by Invoice No'),
    fcCombobox:             page.getByRole('combobox', { name: /FC\(s\) Select FC\(s\)/i }),
    brandsCombobox:         page.getByRole('combobox', { name: 'Brands' }),
    typeCombobox:           page.getByRole('combobox', { name: /Select Type/i }),
    statusCombobox:         page.getByRole('combobox', { name: /Status\(s\)/i }),
    fromDateInput:          page.getByPlaceholder('From Date'),
    toDateInput:            page.getByPlaceholder('To Date'),
    searchButton:           page.getByRole('button', { name: 'Search' }),

    // ── List Page – Actions ───────────────────────────────────────────────────
    addSalesReturnButton:   page.getByRole('button', { name: 'Add Sales return' }),

    // ── List Page – Table ─────────────────────────────────────────────────────
    tableBody:              page.locator('table tbody'),
    firstRow:               page.locator('table tbody tr').first(),
    firstRowEditLink:       page.locator('table tbody tr').first().locator('a[href*="/returns/"]'),
    rowByReturnNo: (ret)    => page.locator(`table tbody tr:has-text("${ret}")`),

    // ── Create Return – Invoice Search Modal ──────────────────────────────────
    invoiceSearchInput:     page.getByRole('textbox', { name: /Search.*Invoice/i }).first(),
    productSearchInput:     page.getByRole('textbox', { name: /search icon/i }).first(),
    firstReturnItem:        page.locator('tbody tr').first(),
    firstCheckbox:          page.locator('input[type="checkbox"]').nth(0),

    // ── Create Return – Qty fields ────────────────────────────────────────────
    returnableQtyCell:      page.locator('tbody tr td:nth-child(2)').first(),
    returnQtyInput:         page.locator('tbody tr td:nth-child(3) .ant-input-number input').first(),
    addButton:              page.locator('td button[type="button"]').filter({ hasText: 'Add' }).first(),

    // ── Create Return – Reason dropdown ──────────────────────────────────────
    reasonDropdown:         page.locator('tbody tr td .ant-select-selection-item').first(),
    reasonDropdownMenu:     page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)'),
    notFastMovingOption:    page.getByTitle('Not Fast Moving').locator('div'),

    // ── Create Return – Summary ───────────────────────────────────────────────
    qtySummaryInput:        page.getByRole('spinbutton', { name: 'Qty*' }),
    saveButton:             page.getByRole('button', { name: 'Save' }),
    closeButton:            page.getByRole('button', { name: '×' }),

    // ── Return Detail – Status ────────────────────────────────────────────────
    firstRowThumbnail:      page.locator('tbody tr:first-child td img').first(),
    expandButton:           page.locator('button').filter({ hasText: /Expand|expand/i }).first(),
    returnStatusCell:       page.locator('tbody tr:first-child td').last(),
});

module.exports = salesReturnLocators;
