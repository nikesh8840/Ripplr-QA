const vehicleAllocationLocators = (page) => ({
    // --- Navigation ---
    logisticsManagementMenu:    page.getByRole('menuitem', { name: 'Logistics Management' }),
    deliveryAllocationLink:     page.getByRole('link', { name: 'Delivery Allocation' }),
    createDeliveryAllocationButton: page.getByRole('button', { name: 'Create Delivery Allocation' }),

    // --- Invoice search ---
    invoiceSearchInput:         page.getByPlaceholder('Search by invoice number'),
    searchButton:               page.getByRole('button', { name: 'Search' }),
    invoiceRowCheckbox:  (inv)  => page.locator(`tr:has-text("${inv}")`).locator('.ant-checkbox-wrapper'),

    // --- FC / Brand filters ---
    fcFilterCombobox:           page.getByRole('combobox', { name: 'FC(s) Select FC(s)' }),
    brandFilterCombobox:        page.getByRole('combobox', { name: 'Brands Select Brand(s)' }),

    // --- Dropdown option scoped to visible AntD overlay (avoids page-wide text matches) ---
    visibleDropdownOption: (text) =>
        page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
            .locator('.ant-select-item-option-content', { hasText: text })
            .first(),

    // --- Table row checkboxes (row-scoped, not positional) ---
    tableRowCheckbox:    (n)    => page.locator('table tbody tr').nth(n).locator('.ant-checkbox-wrapper'),

    // --- Allocate vehicle button + modal actions ---
    allocateVehicleButton:      page.getByRole('button', { name: 'Allocate Vehicle' }),
    skipButton:                 page.getByRole('button', { name: 'Skip' }),
    submitButton:               page.getByRole('button', { name: 'Submit' }),
    confirmButton:              page.getByRole('button', { name: 'Confirm' }),

    // --- Vehicle form: dropdowns located by form-item label ---
    formItemSelect: (label)     =>
        page.locator('.ant-form-item')
            .filter({ has: page.locator('.ant-form-item-label', { hasText: label }) })
            .locator('.ant-select-selector'),

    formItemInput: (label)      =>
        page.locator('.ant-form-item')
            .filter({ has: page.locator('.ant-form-item-label', { hasText: label }) })
            .locator('input'),

    // --- EWB number on the Delivery Allocation Details review modal ---
    ewbOnReviewPage:            page.locator('.ant-modal-body').locator('text=/E-?Way Bill/i').locator('xpath=..').locator('span, div, td').last(),

    // --- EWB number verification (allocation list, first row) ---
    ewbNumberFirstRow:          page.locator('table tbody tr').first().locator('td').filter({ hasText: /[A-Z0-9]{8,}/ }).first(),

    // --- Vehicle form: text inputs ---
    vehicleNumberInput:         page.getByRole('textbox', { name: 'Vehicle Number*' }),
    driverNameInput:            page.getByRole('textbox', { name: 'Driver Name *', exact: true }),
    vendorNameInput:            page.getByRole('textbox', { name: 'Vendor Name *' }),
    driverNumberInput:          page.getByRole('textbox', { name: 'Driver Number *' }),
});

module.exports = vehicleAllocationLocators;
