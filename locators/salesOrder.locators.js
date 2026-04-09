/**
 * Sales Order Locators
 * List URL:   /order-management/sales-order
 * Detail URL: /order-management/sales-order/:id
 */
const salesOrderLocators = (page) => ({

    // ── Navigation ────────────────────────────────────────────────────────────
    orderManagementMenu:    page.getByRole('menuitem', { name: 'Order Management' }),
    salesOrderLink:         page.getByRole('link', { name: 'Sales Order' }),

    // ── List Page – Search Filters ────────────────────────────────────────────
    invoiceNumberInput:     page.getByPlaceholder('Search by Invoice Number'),
    serialNumberInput:      page.getByPlaceholder('Search by Serial Number'),
    storeCombobox:          page.getByRole('combobox', { name: /Store\(s\)/i }),
    fcCombobox:             page.getByRole('combobox', { name: /FC\(s\) Select FC\(s\)/i }),
    brandsCombobox:         page.getByRole('combobox', { name: 'Brands' }),
    statusCombobox:         page.getByRole('combobox', { name: /Status\(s\)/i }),
    fromDateInput:          page.getByPlaceholder('From Date'),
    toDateInput:            page.getByPlaceholder('To Date'),
    invoiceUploadStatusCombobox: page.getByRole('combobox', { name: /Invoice Upload Status/i }),
    quidDeliveriesSwitch:   page.getByRole('switch', { name: 'Quid Deliveries' }),

    // ── List Page – Action Buttons ────────────────────────────────────────────
    searchButton:           page.getByRole('button', { name: 'Search' }),
    markEcoBillsButton:     page.getByRole('button', { name: 'Mark ECO Bills' }),
    addFilterButton:        page.getByRole('button', { name: 'Add Filter' }),
    markPayOnDeliveryButton: page.getByRole('button', { name: 'Mark Pay On Delivery' }),
    blockedOrderButton:     page.getByRole('button', { name: 'Blocked Order' }),

    // ── List Page – Table ─────────────────────────────────────────────────────
    tableBody:              page.locator('table tbody'),
    firstRow:               page.locator('table tbody tr').first(),
    firstRowEditIcon:       page.locator('table tbody tr').first().locator('img[alt="edit-icon"]'),
    editIconNth:     (n)    => page.locator('table tbody tr').nth(n).locator('img[alt="edit-icon"]'),
    rowByInvoice:   (inv)   => page.locator(`table tbody tr:has-text("${inv}")`),
    firstSalesOrderRow:     page.locator('table tbody tr').first(),  // legacy alias

    // ── List Page – Pagination ────────────────────────────────────────────────
    prevPageButton:         page.getByRole('button', { name: 'left' }),
    nextPageButton:         page.getByRole('button', { name: 'right' }),
    pageSizeCombobox:       page.getByRole('combobox', { name: 'Page Size' }),

    // ── Detail Page – Header ──────────────────────────────────────────────────
    viewInvoiceCopyButton:  page.getByRole('button', { name: 'View Invoice Copy' }),
    orderDetailsBanner:     page.getByRole('button', { name: /Order Details/i }),  // collapsible header

    // ── Detail Page – Tabs ────────────────────────────────────────────────────
    valueWiseDetailsTab:    page.getByRole('tab', { name: 'Value Wise Details' }),
    deliveryDetailsTab:     page.getByRole('tab', { name: 'Delivery Details' }),
    serialDetailsTab:       page.getByRole('tab', { name: 'Serial Details' }),
    proofOfDeliveryTab:     page.getByRole('tab', { name: 'Proof of Delivery' }),
    orderJourneyTab:        page.getByRole('tab', { name: 'Order Journey' }),
    collectionHistoryTab:   page.getByRole('tab', { name: 'Collection History' }),
    salesReturnTab:         page.getByRole('tab', { name: 'Sales Return' }),

    // ── Detail Page – Legacy alias ────────────────────────────────────────────
    orderDetailsStoreButton: page.getByRole('button', { name: /right Order Details/i }),
});

module.exports = salesOrderLocators;
