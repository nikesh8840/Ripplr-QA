const dlRfcloseLocators = (page) => ({
    // Navigation
    logisticsManagementMenu:    page.getByText('Logistics Management'),
    returnToFcLink:             page.getByRole('link', { name: 'Return To Fc' }),

    // Delivery list
    firstDeliveryRow:           page.locator('tr .ccyvke a').nth(0),
    allBodyRows:                page.locator('tbody tr'),
    bodyRowNth: (n)          => page.locator(`tr:nth-child(${n})`),

    // Per-row status dropdown
    statusDropdownNth: (n)   => page.locator(`tr:nth-child(${n}) td:nth-child(7) .ant-select-selector`),

    // Delivery status options
    deliveredOption:            page.locator('.ant-select-dropdown .ant-select-item:has-text("Delivered"):not([disabled]):not(.ant-select-item-option-disabled)').first(),
    okButton:                   page.getByRole('button', { name: 'OK' }),
    yesButton:                  page.getByRole('button', { name: 'Yes' }),

    // Delivery details panel
    deliveryDetailsButton:      page.getByRole('button', { name: 'right Delivery Details' }),
    updateButton:               page.getByRole('button', { name: 'Update' }),
    invoiceReturnedRadio:       page.getByRole('radio', { name: 'Invoice Returned' }),
    collectionDetailsButton:    page.getByRole('button', { name: 'right Collection Details:' }),

    // Document upload
    uploadInvDocButton:         page.locator('button:has-text("Upload Inv & Other Doc")'),
    fileInput:                  page.locator('input[type="file"]'),
    uploadConfirmButton:        page.locator('button.giRYTO .iVToiv'),

    // Verify
    verifyButton:               page.getByRole('button', { name: 'Verify' }),
});

module.exports = dlRfcloseLocators;
