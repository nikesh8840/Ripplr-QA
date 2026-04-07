const salesOrderLocators = (page) => ({
    // Navigation
    orderManagementMenu:        page.getByText('Order Management'),
    salesOrderLink:             page.getByRole('link', { name: 'Sales Order' }),

    // Sales order list
    firstSalesOrderRow:         page.locator('.sc-bczRLJ.VVTgw').first(),

    // Order detail tabs
    orderJourneyTab:            page.getByRole('tab', { name: 'Order Journey' }),

    // Order journey panel
    orderDetailsStoreButton:    page.getByRole('button', { name: 'right Order Details: Store' }),
});

module.exports = salesOrderLocators;
