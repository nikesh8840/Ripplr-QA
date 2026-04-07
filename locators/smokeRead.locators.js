const smokeReadLocators = (page) => ({
    // Top-level menu items
    orderManagementMenu:        page.getByText('Order Management'),
    logisticsManagementMenu:    page.getByText('Logistics Management'),
    warehouseManagementMenu:    page.getByText('Warehouse Management'),
    onboardingMenu:             page.getByText('Onboarding').nth(1),
    financeManagementMenu:      page.getByText('Finance Management'),
    chequeBounceMenu:           page.getByText('Cheque bounce', { exact: true }),
    finOpsMenu:                 page.getByText('finOps', { exact: true }),

    // Common nav links
    dashboardLink:              page.getByRole('link', { name: 'Dashboard' }),
    salesOrderLink:             page.getByRole('link', { name: 'Sales Order' }),
    returnsLink:                page.getByRole('link', { name: 'Returns', exact: true }),
    brandSalesReturnsLink:      page.getByRole('link', { name: 'Brand Sales Returns' }),
    deliveryAllocationLink:     page.getByRole('link', { name: 'Delivery Allocation' }),
    returnToFcLink:             page.getByRole('link', { name: 'Return To Fc' }),
    retailerVerificationLink:   page.getByRole('link', { name: 'Retailer Verification' }),
    wmsLogsLink:                page.getByRole('link', { name: 'WMS Logs' }),
    poLogsLink:                 page.getByRole('link', { name: 'PO Logs' }),
    asnLink:                    page.getByRole('link', { name: 'ASN' }),
    companyLink:                page.getByRole('link', { name: 'Company' }),
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

    // Actions
    addSalesReturnButton:       page.getByRole('button', { name: 'Add Sales return' }),
    createDeliveryAllocButton:  page.getByRole('button', { name: 'Create Delivery Allocation' }),
    addCompanyButton:           page.getByRole('button', { name: 'Add Company' }),
    downloadReportsButton:      page.getByRole('button', { name: 'Download Reports' }),
    searchButton:               page.getByRole('button', { name: 'Search' }),
    submitButton:               page.getByRole('button', { name: 'Submit' }),

    // Filters
    datePickerInput:            page.locator('.ant-picker-input'),
    prevMonthButton:            page.locator('.ant-picker-header-prev-btn'),
    finOpsSearchInput:          page.getByRole('textbox', { name: 'Search', exact: true }),
    reportTypeCombobox:         page.getByRole('combobox', { name: 'Report Type Select Report Type' }),
    salesOrderInvoiceOption:    page.getByText('Sales Order (Invoice Wise)'),

    // Table
    firstRowLastCell:           page.locator('td:nth-child(9)').first(),
});

module.exports = smokeReadLocators;
