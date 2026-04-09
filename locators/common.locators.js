/**
 * Common / Shared Locators
 * Reusable patterns that appear across multiple pages
 */
const commonLocators = (page) => ({

    // ── AntD Dropdown (visible overlay only) ─────────────────────────────────
    visibleDropdown:            page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)'),
    visibleDropdownOption: (text) =>
        page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
            .locator('.ant-select-item-option-content', { hasText: text })
            .first(),

    // ── AntD Form fields by label ─────────────────────────────────────────────
    formItemByLabel: (label) =>
        page.locator('.ant-form-item')
            .filter({ has: page.locator('.ant-form-item-label', { hasText: label }) }),
    formSelectByLabel: (label) =>
        page.locator('.ant-form-item')
            .filter({ has: page.locator('.ant-form-item-label', { hasText: label }) })
            .locator('.ant-select-selector'),
    formInputByLabel: (label) =>
        page.locator('.ant-form-item')
            .filter({ has: page.locator('.ant-form-item-label', { hasText: label }) })
            .locator('input'),

    // ── AntD Modal ────────────────────────────────────────────────────────────
    modalBody:                  page.locator('.ant-modal-body').last(),
    modalTitle:                 page.locator('.ant-modal-title'),
    modalOkButton:              page.getByRole('button', { name: 'OK' }),
    modalCancelButton:          page.getByRole('button', { name: 'Cancel' }),
    modalCloseButton:           page.locator('.ant-modal-close'),
    confirmButton:              page.getByRole('button', { name: 'Confirm' }),
    yesButton:                  page.getByRole('button', { name: 'Yes' }),
    okButton:                   page.getByRole('button', { name: 'OK' }),

    // ── AntD Notification / Toast ─────────────────────────────────────────────
    successNotification:        page.locator('.ant-notification-notice-success'),
    errorNotification:          page.locator('.ant-notification-notice-error'),
    toastMessage:               page.locator('.ant-message-notice').last(),

    // ── Generic Table ─────────────────────────────────────────────────────────
    tableBody:                  page.locator('table tbody'),
    tableFirstRow:              page.locator('table tbody tr').first(),
    tableRowNth:         (n)    => page.locator('table tbody tr').nth(n),
    tableRowByText:     (text)  => page.locator(`table tbody tr:has-text("${text}")`),
    tableRowCheckboxNth: (n)    => page.locator('table tbody tr').nth(n).locator('.ant-checkbox-wrapper'),

    // ── Pagination ────────────────────────────────────────────────────────────
    prevPageButton:             page.getByRole('button', { name: 'left' }),
    nextPageButton:             page.getByRole('button', { name: 'right' }),
    pageSizeCombobox:           page.getByRole('combobox', { name: 'Page Size' }),
    pageNth:             (n)    => page.getByRole('listitem', { name: String(n) }),

    // ── Date Pickers ─────────────────────────────────────────────────────────
    fromDateInput:              page.getByPlaceholder('From Date'),
    toDateInput:                page.getByPlaceholder('To Date'),

    // ── Breadcrumb ────────────────────────────────────────────────────────────
    homeLink:                   page.getByRole('link', { name: 'home' }).first(),

    // ── Search ────────────────────────────────────────────────────────────────
    searchButton:               page.getByRole('button', { name: 'Search' }),
    submitButton:               page.getByRole('button', { name: 'Submit' }),
    saveButton:                 page.getByRole('button', { name: 'Save' }),
    cancelButton:               page.getByRole('button', { name: 'Cancel' }),
});

module.exports = commonLocators;
