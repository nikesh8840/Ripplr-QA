const smokeReadLocators = (page) => ({
    // --- Top-level sidebar menu items (text clicks) ---
    orderManagementMenu:        page.getByRole('menu').getByText('Order Management'),
    logisticsManagementMenu:    page.getByText('Logistics Management'),
    warehouseManagementMenu:    page.getByText('Warehouse Management'),
    onboardingMenu:             page.getByText('Onboarding').nth(1),
    onboardingTopMenu:          page.getByText('Onboarding'),
    financeManagementMenu:      page.getByText('Finance Management'),
    financeManagementMenuItem:  page.getByRole('menu').getByText('Finance Management'),
    chequeBounceMenu:           page.getByText('Cheque bounce', { exact: true }),
    chequeBounceTopMenu:        page.getByText('Cheque Bounce', { exact: true }),
    finOpsMenu:                 page.getByText('finOps', { exact: true }),
    mastersMenu:                page.getByText('Masters'),

    // --- Sidebar shortcut clicks (text, not links) ---
    returnsMenu:                page.getByText('Returns').nth(2),
    deliveryAllocationMenu:     page.getByText('Delivery Allocation'),
    returnToFcMenu:             page.getByText('Return To FC', { exact: true }),
    goodsReceivedNoteMenu:      page.getByText('Goods Received Note'),
    adapterUploadsMenu:         page.getByText('Adapter Uploads').nth(1),
    downloadsMenu:              page.getByText('Downloads').nth(1),
    wmsLogsMenu:                page.getByText('WMS Logs').nth(1),
    retailerLedgerMenu:         page.getByText('Retailer Ledger'),

    // --- Common nav links ---
    dashboardLink:              page.getByRole('link', { name: 'Dashboard' }),
    salesOrderLink:             page.getByRole('link', { name: 'Sales Order' }),
    returnsLink:                page.getByRole('link', { name: 'Returns', exact: true }),
    returnsMenuItem:            page.getByRole('menuitem', { name: 'Returns', exact: true }).getByRole('link'),
    brandSalesReturnsLink:      page.getByRole('link', { name: 'Brand Sales Returns' }),
    orderManagementMenuItem:    page.getByRole('menu').getByText('Order Management'),
    deliveryAllocationLink:     page.getByRole('link', { name: 'Delivery Allocation' }),
    returnToFcLink:             page.getByRole('link', { name: 'Return To Fc' }),
    retailerVerificationLink:   page.getByRole('link', { name: 'Retailer Verification' }),
    wmsLogsLink:                page.getByRole('link', { name: 'WMS Logs' }),
    poLogsLink:                 page.getByRole('link', { name: 'PO Logs' }),
    asnLink:                    page.getByRole('link', { name: 'ASN' }),
    companyLink:                page.getByRole('link', { name: 'Company' }),
    companyLinkNth1:            page.getByRole('link', { name: 'Company' }).nth(1),
    clientLink:                 page.getByRole('link', { name: 'Client' }),
    brandLink:                  page.getByRole('link', { name: 'Brand' }),
    fcLink:                     page.getByRole('link', { name: 'FC' }),
    storeLink:                  page.getByRole('link', { name: 'Store', exact: true }),
    storeCategoryLink:          page.getByRole('link', { name: 'Store Category' }),
    userLink:                   page.getByRole('link', { name: 'User' }),
    salesmanLink:               page.getByRole('link', { name: 'Salesman' }),
    bankLink:                   page.getByRole('link', { name: 'Bank' }),
    pincodeLink:                page.getByRole('link', { name: 'Pincode' }),
    packMasterLink:             page.getByRole('link', { name: 'Pack Master' }),
    retailerLedgerLink:         page.getByRole('link', { name: 'Retailer Ledger' }),
    finOpsLink:                 page.getByRole('link', { name: 'FinOps' }),
    chequeBounceListLink:       page.getByRole('link', { name: 'Cheque Bounce List' }),
    adapterUploadsLink:         page.getByRole('link', { name: 'Adapter Uploads' }),
    downloadsLink:              page.getByRole('link', { name: 'Downloads' }),

    // --- Actions ---
    addSalesReturnButton:       page.getByRole('button', { name: 'Add Sales return' }),
    createDeliveryAllocButton:  page.getByRole('button', { name: 'Create Delivery Allocation' }),
    addCompanyButton:           page.getByRole('button', { name: 'Add Company' }),
    downloadReportsButton:      page.getByRole('button', { name: 'Download Reports' }),
    searchButton:               page.getByRole('button', { name: 'Search' }),
    submitButton:               page.getByRole('button', { name: 'Submit' }),

    // --- Date picker ---
    datePickerInput:            page.locator('.ant-picker-input'),
    prevMonthButton:            page.locator('.ant-picker-header-prev-btn'),
    day26:                      page.getByText('26', { exact: true }),

    // --- Filters / search ---
    finOpsSearchInput:          page.getByRole('textbox', { name: 'Search', exact: true }),
    reportTypeCombobox:         page.getByRole('combobox', { name: 'Report Type Select Report Type' }),
    salesOrderInvoiceOption:    page.getByText('Sales Order (Invoice Wise)'),

    // --- Table ---
    firstRowLastCell:           page.locator('td:nth-child(9)').first(),
});

module.exports = smokeReadLocators;
