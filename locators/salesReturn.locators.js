const salesReturnLocators = (page) => ({
    // --- Actions ---
    addSalesReturnButton:       page.getByRole('button', { name: 'Add Sales return' }),
    searchButton:               page.getByRole('button', { name: 'Search' }),
    saveButton:                 page.getByRole('button', { name: 'Save' }),
    closeButton:                page.getByRole('button', { name: '×' }),
    addButton:                  page.locator('td button[type="button"]:has-text("Add")'),

    // --- Invoice / product search ---
    invoiceSearchInput:         page.getByRole('textbox', { name: 'Search search icon' }),
    productSearchInput:         page.getByRole('textbox', { name: 'search icon' }),

    // --- Return list ---
    firstReturnItem:            page.locator('.bSLZcG').nth(0),
    firstCheckbox:              page.locator('input[type="checkbox"]').nth(0),

    // --- Qty fields ---
    returnableQtyCell:          page.locator('tbody tr td:nth-child(2) .sc-bczRLJ'),
    returnQtyInput:             page.locator('tbody tr td:nth-child(3) .ant-input-number input'),

    // --- Reason dropdown ---
    reasonDropdown:             page.locator('tbody tr td .ant-select-selection-item'),
    reasonDropdownMenu:         page.locator('.ant-select-dropdown'),
    notFastMovingOption:        page.getByTitle('Not Fast Moving').locator('div'),

    // --- Summary qty ---
    qtySummaryInput:            page.getByRole('spinbutton', { name: 'Qty*' }),

    // --- Row actions ---
    firstRowThumbnail:          page.locator('tbody tr:first-child td img'),
    expandButton:               page.locator('.gCJfbe'),

    // --- Status ---
    returnStatusCell:           page.locator('tbody tr:first-child td .hYzLpj'),
});

module.exports = salesReturnLocators;
