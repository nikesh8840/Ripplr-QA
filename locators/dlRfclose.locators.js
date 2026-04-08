const dlRfcloseLocators = (page) => ({
    // --- Navigation ---
    logisticsManagementMenu:            page.getByText('Logistics Management'),
    returnToFcLink:                     page.getByRole('link', { name: 'Return To Fc' }),
    invoiceListLink:                    page.getByRole('link', { name: 'Invoice List' }),

    // --- Delivery list ---
    firstDeliveryRow:                   page.locator('tr .ccyvke a').nth(0),
    allBodyRows:                        page.locator('tbody tr'),

    // --- Per-row: status dropdown (parameterised by DOM row index, 1-based offset by 2) ---
    statusDropdownNth: (n)           => page.locator(`tr:nth-child(${n}) td:nth-child(7) .ant-select-selector`),

    // --- Status dropdown options ---
    selectDropdownMenu:                 page.locator('.ant-select-dropdown'),
    deliveredStatusOption:              page.locator('.ant-select-dropdown .ant-select-item:has-text("Delivered"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)').first(),
    partialDeliveredOption:             page.locator('.ant-select-dropdown .ant-select-item:has-text("Partial Delivered"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)').first(),
    deliveryAttemptedOption:            page.locator('.ant-select-dropdown .ant-select-item:has-text("Delivery Attempted"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)').first(),

    // --- Confirmation dialogs ---
    okButton:                           page.getByRole('button', { name: 'OK' }),
    yesButton:                          page.getByRole('button', { name: 'Yes' }),

    // --- Delivery details panel ---
    deliveryDetailsButton:              page.getByRole('button', { name: 'Delivery Details' }),
    updateButton:                       page.getByRole('button', { name: 'Update' }),
    invoiceReturnedRadio:               page.getByRole('radio', { name: 'Invoice Returned' }),
    invoiceSettledRadio:                page.getByRole('radio', { name: 'Invoice settled' }),

    // --- Collection details panel ---
    collectionDetailsButton:            page.getByRole('button', { name: 'Collection Details' }),
    collectableAmountCell:              page.locator("div[class='sc-bczRLJ sc-gsnTZi jkiZmR jnFvAE'] div:nth-child(2) div:nth-child(2) span:nth-child(1)"),
    collectableAmountCellV2:            page.locator('.ant-col-xs-6:nth-child(12) .sc-kOZHUs'),
    cashInput:                          page.locator("input[name='cash']"),

    // --- Partial delivery fields ---
    pickedQtyCell:                      page.locator('tr td.ant-table-cell:nth-child(3) .sc-bczRLJ').first(),
    deliveredQtyInput:                  page.locator('tr td.ant-table-cell:nth-child(5) input'),
    returnReasonDropdown:               page.locator('#return_reason0'),
    productNotRequiredOption:           page.getByText('Product Not Required'),

    // --- Delivery attempt fields ---
    attemptReasonDropdown:              page.locator('#reason'),
    shopClosedOption:                   page.getByText('Shop Closed'),

    // --- Per-row: action icons (parameterised) ---
    rowActionIconNth: (rowN, colN)   => page.locator(`tr:nth-child(${rowN}) td .fAmufx`).nth(colN),

    // --- POD / image upload modal ---
    addImageBtn:                        page.locator('.ant-modal-content button .iVToiv'),
    modalFileInput:                     page.locator('input[type="file"]'),
    modalUploadButton:                  page.locator('.ant-modal-body button:has-text("Upload")'),
    podDialogCloseButton:               page.getByRole('dialog').filter({ hasText: 'Proof of DeliveryVerify Proof' }).getByLabel('Close', { exact: true }),

    // --- Document upload (RFC close) ---
    uploadInvDocButton:                 page.locator('button:has-text("Upload Inv & Other Doc")'),
    uploadConfirmButton:                page.locator('button.giRYTO .iVToiv'),
    verifyButton:                       page.getByRole('button', { name: 'Verify' }),
});

module.exports = dlRfcloseLocators;
