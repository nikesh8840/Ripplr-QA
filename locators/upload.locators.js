const uploadLocators = (page) => ({
    // --- Navigation ---
    adapterUploadsLink:         page.getByRole('link', { name: 'Adapter Uploads' }).first(),

    // --- Open upload modal ---
    uploadButton:               page.getByRole('button', { name: 'Upload' }),
    uploadCsvLabel:             page.getByLabel('Upload Csv').locator('label span').nth(1),

    // --- Upload form: document type ---
    docTypeTitle: (type)     => page.getByTitle(type).locator('div').first(),

    // --- Upload form: FC/Brand — dynamic methods (UploadSalesOrder / UploadSalesOrdertwo / UploadSinglefileFcBrand) ---
    fcInput:                    page.locator('.cuNTTY:first-child .ant-form-item-control input'),
    brandCombobox:              page.getByRole('combobox', { name: '*Brand' }),

    // --- Upload form: FC/Brand — legacy fixed selectors (Upload / UploadSinglefile / UploadSinglefileforermkSMSNG) ---
    fcTypeFilter:               page.locator('div').filter({ hasText: /^Fc Type$/ }).nth(4),
    fcInputLegacy5:             page.locator('#rc_select_5'),
    fcInputLegacy6:             page.locator('#rc_select_6'),

    // --- Dynamic text options (FC name / Brand name resolved at runtime) ---
    // Scoped to the visible AntD dropdown overlay to avoid accidentally matching
    // table rows or navigation links that contain the same text (e.g. brand names
    // that also appear in the upload history table).
    textOption: (text)       => page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByText(text),

    // --- File inputs ---
    // fileInputNth covers both UI layouts:
    //   1. Multi-file ant-space layout (3-file / 2-file uploads — ant-space wraps each input)
    //   2. Single-file AntD Upload dragger layout (e.g. BGRD:SNPR — no ant-space wrapper)
    // Scoped to modal/drawer body so stray hidden inputs elsewhere on the page are excluded.
    singleFileInput:            page.locator('input[type="file"]'),
    fileInputNth: (n)        => page.locator('.ant-modal-body input[type="file"], .ant-drawer-body input[type="file"]').nth(n),

    // --- Form actions ---
    submitButton:               page.getByRole('button', { name: 'Submit' }),
    searchButton:               page.getByRole('button', { name: 'Search' }),
    closeButton:                page.getByRole('button', { name: 'Close' }),

    // --- Search/filter panel ---
    fileTypeCombobox:           page.getByRole('combobox', { name: 'Select File Types' }),
    fcFilterCombobox:           page.getByRole('combobox', { name: 'FC Select FC' }),
    brandFilterLabel:           page.locator('label').filter({ hasText: 'Brand(s) Select Brand(s)' }).locator('div').nth(2),
    brandFilterCombobox:        page.getByRole('combobox', { name: 'Brand(s) Select Brand(s)' }),

    // --- Results table ---
    uploadedTimeCell:           page.locator('.ant-table-tbody tr').first().locator('td:nth-child(6) div:nth-child(2) span'),
    syncIcon:                   page.locator('.ant-table-tbody tr').first().locator('.anticon-sync'),
    eyeIcon:                    page.locator(".ant-table-tbody tr").first().locator("img[src*='eye-icon']"),

    // --- Processing modal ---
    progressCount:              page.locator('.ant-tag-blue strong'),
    modalRefreshButton:         page.locator("div[class='ant-modal-body'] div[class='sc-bczRLJ sc-gsnTZi hRYqBu jnFvAE']"),
});

module.exports = uploadLocators;
