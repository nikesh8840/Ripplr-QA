const qcPicklistLocators = (page) => ({

    // --- Navigation ---
    logisticsManagementMenu:    page.getByRole('menuitem', { name: 'Logistics Management' }),
    qcPicklistLink:             page.getByRole('link', { name: 'QC Picklist' }),

    // --- List page filters ---
    searchPicklistId:           page.getByPlaceholder('Picklist ID'),
    searchInvoiceNumber:        page.getByPlaceholder('Search'),
    fcFilterCombobox:           page.getByRole('combobox', { name: /FC/i }),
    brandFilterCombobox:        page.getByRole('combobox', { name: /Brand/i }),
    searchButton:               page.getByRole('button', { name: 'Search' }),
    clearAllFiltersButton:      page.getByRole('button', { name: 'Clear All Filters' }),

    // --- Generate Picklist button ---
    generatePicklistButton:     page.getByRole('button', { name: 'Generate Picklist' }),

    // --- Generate Modal ---
    modal:                      page.locator('.ant-modal-content'),
    modalFcSelector:            page.locator('.ant-modal-content .ant-form-item').filter({ hasText: 'FC' }).locator('.ant-select-selector'),
    modalBrandSelector:         page.locator('.ant-modal-content .ant-form-item').filter({ hasText: 'Brand' }).locator('.ant-select-selector'),
    proceedButton:              page.getByRole('button', { name: 'Proceed' }),
    cancelButton:               page.getByRole('button', { name: 'Cancel' }),

    // --- Dropdown option (shared - scoped to visible AntD overlay) ---
    visibleDropdownOption: (text) =>
        page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
            .locator('.ant-select-item-option-content')
            .filter({ hasText: text })
            .first(),

    // --- Select Orders page ---
    selectOrdersHeading:        page.getByText('Select Orders for Picklist'),
    noPicklistMessage:          page.getByText('No PickList is available for the selected filters'),
    createPicklistButton:       page.getByRole('button', { name: /Create Picklist/ }),
    selectOrdersCancelButton:   page.getByRole('button', { name: 'Cancel' }),

    // --- Select Orders: filters ---
    invDateFilter:              page.getByPlaceholder('All Dates'),
    invoiceNoFilter:            page.getByPlaceholder('Search...'),
    beatFilter:                 page.locator('.ant-select').filter({ hasText: 'Select Beat' }),
    salesmanFilter:             page.locator('.ant-select').filter({ hasText: 'Select Salesman' }),

    // --- Select Orders: table ---
    selectAllCheckbox:          page.locator('thead .ant-checkbox-wrapper').first(),
    orderRowCheckbox:    (n) => page.locator('tbody tr').nth(n).locator('.ant-checkbox-wrapper'),
    orderRows:                  page.locator('tbody tr'),
});

module.exports = qcPicklistLocators;
