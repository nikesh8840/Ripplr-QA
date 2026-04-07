const deliveredLocators = (page) => ({
    // Navigation
    logisticsManagementMenu:    page.getByText('Logistics Management'),
    returnToFcLink:             page.getByRole('link', { name: 'Return To Fc' }),

    // Delivery list
    firstDeliveryRow:           page.locator('tr .ccyvke a').nth(0),
    vehicleAllocatedStatus:     page.getByText('vehicle allocated').first(),

    // Status dropdown
    deliveredOption:            page.getByText('Delivered', { exact: true }),
    okButton:                   page.getByRole('button', { name: 'OK' }),
    yesButton:                  page.getByRole('button', { name: 'Yes' }),

    // Delivery details panel
    deliveryDetailsButton:      page.getByRole('button', { name: 'right Delivery Details' }),
    updateButton:               page.getByRole('button', { name: 'Update' }),
    invoiceReturnedRadio:       page.getByRole('radio', { name: 'Invoice Returned' }),

    // Collection details panel
    collectionDetailsButton:    page.getByRole('button', { name: 'right Collection Details:' }),
});

module.exports = deliveredLocators;
