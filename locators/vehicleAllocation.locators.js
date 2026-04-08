const vehicleAllocationLocators = (page) => ({
    // --- Navigation ---
    logisticsManagementMenu:            page.getByText('Logistics Management'),
    deliveryAllocationLink:             page.getByRole('link', { name: 'Delivery Allocation' }),
    createDeliveryAllocationButton:     page.getByRole('button', { name: 'Create Delivery Allocation' }),

    // --- Invoice search ---
    invoiceSearchInput:                 page.locator("input[placeholder='Search by invoice number']"),
    searchButton:                       page.getByRole('button', { name: 'Search' }),
    invoiceRowCheckbox: (invoice)    => page.locator(`tr:has-text("${invoice}")`).locator('.ant-checkbox'),

    // --- FC / Brand filters ---
    fcFilterCombobox:                   page.getByRole('combobox', { name: 'FC(s) Select FC(s)' }),
    brandFilterCombobox:                page.getByRole('combobox', { name: 'Brands Select Brand(s)' }),
    fcText: (name)                   => page.getByText(name),
    brandText: (name)                => page.getByText(name),

    // --- Row checkboxes ---
    checkboxNth: (n)                 => page.locator('.ant-checkbox').nth(n),

    // --- Allocate vehicle ---
    allocateVehicleButton:              page.getByRole('button', { name: 'Allocate Vehicle' }),
    skipButton:                         page.getByRole('button', { name: 'Skip' }),
    submitButton:                       page.getByRole('button', { name: 'Submit' }),
    confirmButton:                      page.getByRole('button', { name: 'Confirm' }),

    // --- Vehicle form: dropdowns ---
    deliveryTypeDropdown:               page.locator('.ant-form-item-control-input-content').first(),
    bothOption:                         page.getByTitle('Both').locator('div'),
    vehicleTypeDropdown:                page.locator('.ant-form-item-control-input-content').nth(1),
    regularOption:                      page.getByTitle('Regular').locator('div'),
    vehicleSubTypeDropdown:             page.locator('.ant-form-item-control-input-content').nth(2),
    regularText:                        page.getByText('Regular').nth(4),
    deliveryBoyDropdownLast:            page.locator('.ant-form-item-control-input-content').last(),
    deliveryBoyInputLast:               page.locator('.ant-form-item-control-input-content input').last(),
    deliveryBoyOption:                  page.getByTitle('Delivery Boy').locator('div'),

    // --- Vehicle form: text inputs (legacy labels) ---
    vehicleNumberInput:                 page.getByRole('textbox', { name: '*Vehicle No' }),
    driverInput:                        page.getByRole('textbox', { name: '*Driver', exact: true }),
    vendorInput:                        page.getByRole('textbox', { name: '*Vendor' }),
    driverMobileLabel:                  page.locator('div').filter({ hasText: /^\*Driver Mobile Number$/ }).nth(2),
    driverMobileInput:                  page.getByRole('textbox', { name: '*Driver Mobile Number' }),

    // --- Vehicle form: text inputs (updated labels) ---
    vehicleNumberInputV2:               page.getByRole('textbox', { name: 'Vehicle Number*' }),
    driverNameInputV2:                  page.getByRole('textbox', { name: 'Driver Name *', exact: true }),
    vendorNameInputV2:                  page.getByRole('textbox', { name: 'Vendor Name *' }),
    driverNumberInputV2:                page.getByRole('textbox', { name: 'Driver Number *' }),
});

module.exports = vehicleAllocationLocators;
