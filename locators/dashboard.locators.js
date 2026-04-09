/**
 * Dashboard Locators
 * URL: /dashboard
 */
const dashboardLocators = (page) => ({

    // ── Navigation Menu ───────────────────────────────────────────────────────
    dashboardMenu:          page.getByRole('menuitem', { name: 'Dashboard' }),
    orderManagementMenu:    page.getByRole('menuitem', { name: 'Order Management' }),
    logisticsManagementMenu: page.getByRole('menuitem', { name: 'Logistics Management' }),
    onboardingMenu:         page.getByRole('menuitem', { name: 'Onboarding' }),
    financeManagementMenu:  page.getByRole('menuitem', { name: 'Finance Management' }),
    automationsMenu:        page.getByRole('menuitem', { name: 'Automations' }),
    chequeBounceMenu:       page.getByRole('menuitem', { name: 'Cheque Bounce' }),
    adapterUploadsLink:     page.getByRole('link', { name: 'Adapter Uploads' }),
    downloadsLink:          page.getByRole('link', { name: 'Downloads' }),
    integrationLogsMenu:    page.getByRole('menuitem', { name: 'Integration Logs' }),

    // ── Order Management Sub-links (visible when expanded) ────────────────────
    grnLink:                page.getByRole('link', { name: 'GRN' }),
    salesOrderLink:         page.getByRole('link', { name: 'Sales Order' }),
    returnsLink:            page.getByRole('link', { name: 'Returns' }),
    brandSalesReturnLink:   page.getByRole('link', { name: 'Brand Sales Return' }),

    // ── Logistics Management Sub-links ────────────────────────────────────────
    deliveryAllocationLink:  page.getByRole('link', { name: 'Delivery Allocation' }),
    returnToFcLink:          page.getByRole('link', { name: 'Return to FC' }),
    returnVerificationLink:  page.getByRole('link', { name: 'Return Verification' }),
    returnAllocationLink:    page.getByRole('link', { name: 'Return Allocation' }),
    retailerVerificationLink: page.getByRole('link', { name: 'Retailer Verification' }),
    qcPicklistLink:          page.getByRole('link', { name: 'QC Picklist' }),

    // ── Onboarding Sub-links ──────────────────────────────────────────────────
    companyLink:            page.getByRole('link', { name: 'Company' }),
    clientLink:             page.getByRole('link', { name: 'Client' }),
    brandLink:              page.getByRole('link', { name: 'Brand' }),
    fcLink:                 page.getByRole('link', { name: 'FC' }),
    storeLink:              page.getByRole('link', { name: 'Store' }),
    storeCategoryLink:      page.getByRole('link', { name: 'Store Category' }),
    userLink:               page.getByRole('link', { name: 'User' }),
    salesmanLink:           page.getByRole('link', { name: 'Salesman' }),

    // ── Dashboard Quick-link Cards ────────────────────────────────────────────
    salesOrderCard:         page.getByText('Sales Order').first(),
    returnsCard:            page.getByText('Returns').first(),
    deliveryAllocationCard: page.getByText('Delivery Allocation').first(),
    returnToFcCard:         page.getByText('Return To FC').first(),
    grnCard:                page.getByText('Goods Received Note').first(),
    onboardingCard:         page.getByText('Onboarding').first(),
    adapterUploadsCard:     page.getByText('Adapter Uploads').first(),
    downloadsCard:          page.getByText('Downloads').first(),
    wmsLogsCard:            page.getByText('WMS Logs').first(),
    chequeBounceCard:       page.getByText('Cheque bounce').first(),
    retailerLedgerCard:     page.getByText('Retailer Ledger').first(),
    collectionAutomationCard: page.getByText('Collection Automation').first(),
    reportExtractionCard:   page.getByText('Report Extraction').first(),
    chequeSummaryCard:      page.getByText('Cheque Summary').first(),
    finOpsCard:             page.getByText('finOps').first(),
    salesReturnAutomationCard: page.getByText('Sales Return Automation').first(),

    // ── Top Bar ───────────────────────────────────────────────────────────────
    userProfile:            page.locator('[cursor=pointer]').filter({ hasText: 'admin@ripplr.in' }),
    collapseButton:         page.getByRole('button', { name: /Collapse/i }),

    // ── Sidebar Collapse/Expand ───────────────────────────────────────────────
    sidebarToggle:          page.getByRole('button', { name: /Collapse|right/i }).first(),
});

module.exports = dashboardLocators;
