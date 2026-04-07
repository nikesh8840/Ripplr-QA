const uploadLocators = (page) => ({
    // Navigation
    adapterUploadsLink:     page.getByRole('link', { name: 'Adapter Uploads' }),

    // Upload modal - open
    uploadButton:           page.getByRole('button', { name: 'Upload' }),
    uploadCsvLabel:         page.getByLabel('Upload Csv').locator('label span').nth(1),

    // Upload form - FC/Brand (dynamic methods, used in UploadSalesOrder / UploadSalesOrdertwo)
    fcInput:                page.locator('.cuNTTY:first-child .ant-form-item-control input'),
    brandCombobox:          page.getByRole('combobox', { name: '*Brand' }),

    // Upload form - FC/Brand (legacy, used in Upload / UploadSinglefile)
    fcInputLegacy5:         page.locator('#rc_select_5'),
    fcInputLegacy6:         page.locator('#rc_select_6'),
    fcTypeFilter:           page.locator('div').filter({ hasText: /^Fc Type$/ }).nth(4),

    // File inputs
    fileInput:              page.locator('input[type="file"]'),
    fileInputNth: (n)    => page.locator('div.ant-space.ant-space-horizontal.ant-space-align-center input[type="file"]').nth(n),

    // Actions
    submitButton:           page.getByRole('button', { name: 'Submit' }),
    searchButton:           page.getByRole('button', { name: 'Search' }),
    closeButton:            page.getByRole('button', { name: 'Close' }),

    // Search/filter panel
    fileTypeCombobox:       page.getByRole('combobox', { name: 'Select File Types' }),
    fcFilterCombobox:       page.getByRole('combobox', { name: 'FC Select FC' }),
    brandFilterLabel:       page.locator('label').filter({ hasText: 'Brand(s) Select Brand(s)' }).locator('div').nth(2),
    brandFilterCombobox:    page.getByRole('combobox', { name: 'Brand(s) Select Brand(s)' }),

    // Results table
    uploadedTimeCell:       page.locator('tr:first-child td:nth-child(6) div:nth-child(2) span'),
    syncIcon:               page.locator('tr:first-child .anticon-sync'),
    eyeIcon:                page.locator("tr:first-child img[src*='eye-icon']"),

    // Processing modal
    progressCount:          page.locator('.ant-tag-blue strong'),
    modalRefreshButton:     page.locator("div[class='ant-modal-body'] div[class='sc-bczRLJ sc-gsnTZi hRYqBu jnFvAE']"),
});

module.exports = uploadLocators;
