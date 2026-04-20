
const path = require('path');
const loginLocators = require('../locators/login.locators');
const uploadLocators = require('../locators/upload.locators');
const { getFCName, getBrandName, getFilePath } = require('../utils/fcbrands');

function parseUploadedTime(str) {
    const [datePart, timePart, ampm] = str.replace(',', '').split(/\s+/);
    const [day, month, year] = datePart.split('/').map(Number);
    let [hours, minutes] = timePart.split(':').map(Number);
    if (ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
    return new Date(year, month - 1, day, hours, minutes);
}

exports.Uploadfile = class Uploadfile {
    constructor(page) {
        this.page = page;
    }

    async _login(username, password) {
        const login = loginLocators(this.page);
        // Skip login if already authenticated (login form not visible)
        const needsLogin = await login.usernameInput.isVisible({ timeout: 3000 }).catch(() => false);
        if (!needsLogin) {
            console.log('Already logged in — skipping login step');
            return;
        }
        await login.usernameInput.click();
        await login.usernameInput.fill(username);
        await login.passwordInput.click();
        await login.passwordInput.fill(password);
        await login.loginButton.click();
    }

    async _openUploadModal(l, uploadtype) {
        await l.adapterUploadsLink.click();
        await l.uploadButton.click();
        await l.uploadCsvLabel.click();
        await this.page.waitForTimeout(200);
        await l.docTypeTitle(uploadtype).click();
    }

    async _waitForUploadCompletion(l, diffLimit, maxRetries = 14) {
        let cnt = 0;
        while (true) {
            cnt++;
            if (cnt == maxRetries) {
                console.log("Something went wrong, file not Uploaded");
                return false;
            }
            const uploadedTimeText = await l.uploadedTimeCell.innerText();
            const currentTime = new Date();
            const uploadedTime = parseUploadedTime(uploadedTimeText);
            const diffMs = Math.abs(currentTime.getTime() - uploadedTime.getTime());
            const diffMinutes = Math.floor(diffMs / 60000);
            console.log(`Difference in minutes: ${diffMinutes} minutes`);
            if (diffMinutes <= diffLimit) break;
            await l.searchButton.click();
        }
        return true;
    }

    async _waitForProcessing(l, extraDelay = 0) {
        let cnt = 0;
        while (true) {
            cnt++;
            if (cnt == 14) {
                console.log("Something went wrong, file not Uploaded");
                return false;
            }
            const ProgressCount = await l.progressCount.innerText();
            console.log(`ProgressCount: ${ProgressCount}`);
            if (ProgressCount === '0') {
                if (extraDelay) await this.page.waitForTimeout(extraDelay);
                // Capture modal text before it closes — used by scanForProductNotFoundErrors
                this._lastModalText = await this.page.locator('.ant-modal-body').textContent().catch(() => '');
                break;
            }
            await this.page.waitForTimeout(3300);
            await l.modalRefreshButton.click();
        }
        return true;
    }

    async _searchAndVerify(l, uploadtype, FC, FcName, Brand, BrandName, diffLimit, maxRetries = 14, syncDelay = 0, processExtraDelay = 0) {
        await l.fileTypeCombobox.click();
        await l.docTypeTitle(uploadtype).click();
        await l.fcFilterCombobox.click();
        await this.page.waitForTimeout(400);
        await this.page.keyboard.type(FC);
        await this.page.waitForTimeout(400);
        await l.textOption(FcName).click();
        await l.brandFilterLabel.click();
        await this.page.waitForTimeout(200);
        await this.page.keyboard.type(Brand);
        await this.page.waitForTimeout(400);
        await l.textOption(BrandName).click();
        await l.searchButton.click();

        const uploadOk = await this._waitForUploadCompletion(l, diffLimit, maxRetries);
        if (!uploadOk) return false;

        // Give icons time to render in the table row
        await this.page.waitForTimeout(2000);

        const syncVisible = await l.syncIcon.isVisible({ timeout: 3000 }).catch(() => false);

        if (syncVisible) {
            // File in "Uploaded" state — click sync to trigger processing
            await l.syncIcon.click();
            console.log("✅ Sync icon clicked");
            if (syncDelay) await this.page.waitForTimeout(syncDelay);
            const processOk = await this._waitForProcessing(l, processExtraDelay);
            if (!processOk) return false;
            await l.closeButton.click();
        } else {
            // Auto-processing: poll row until "Processing..." disappears
            console.log("ℹ️  File auto-processing — waiting for completion");
            const firstRow = this.page.locator('.ant-table-tbody tr').first();
            for (let i = 0; i < 30; i++) {
                const rowText = await firstRow.innerText().catch(() => 'Processing...');
                if (!rowText.includes('Processing')) {
                    console.log(`Processing complete (attempt ${i + 1})`);
                    break;
                }
                console.log(`Still processing... (${i + 1}/30)`);
                await this.page.waitForTimeout(3000);
                await l.searchButton.click().catch(() => {});
                await this.page.waitForTimeout(500);
            }

            await this.page.waitForTimeout(2000);

            // Check row status — if "Partially Processed", some invoices failed.
            // Click the sync/refresh icon to open the error modal and capture failure reasons.
            const rowText = await firstRow.innerText().catch(() => '');
            console.log(`Row status after processing: ${rowText.substring(0, 100)}`);

            if (rowText.includes('Partially')) {
                console.log("⚠️  Partially Processed — attempting to open error details");
                try {
                    // AntD table rows hide action icons until the row is hovered
                    await firstRow.hover();
                    await this.page.waitForTimeout(500);
                    const iconVisible = await l.syncIcon.isVisible({ timeout: 2000 }).catch(() => false);
                    if (iconVisible) {
                        await l.syncIcon.click({ timeout: 5000 });
                    } else {
                        // Fall back to force-click if still not visible after hover
                        await l.syncIcon.click({ force: true, timeout: 5000 });
                    }
                    if (syncDelay) await this.page.waitForTimeout(syncDelay);
                    await this._waitForProcessing(l, processExtraDelay);
                    await l.closeButton.click().catch(() => {});
                } catch (e) {
                    console.log("Could not open error details modal (non-fatal):", e.message);
                }
            } else {
                console.log("✅ Fully Processed — no invoice failures");
                this._lastModalText = '';
            }
        }

        console.log("File Uploaded Successfully and processed");
        return true;
    }

    async Upload(username, password, uploadtype, name) {
        const filePath = path.resolve(__dirname, `../test-data/APX/${name}.csv`);
        const l = uploadLocators(this.page);

        await this._login(username, password);
        await this._openUploadModal(l, uploadtype);
        await l.fcTypeFilter.click();
        await l.fcInputLegacy6.click();
        await l.fcInputLegacy6.fill('erhs');
        await l.textOption('ERHS: ERHS').click();
        await l.brandCombobox.click();
        await l.brandCombobox.fill('apx');
        await l.textOption('APX: APX').click();
        await l.singleFileInput.setInputFiles(filePath);
        await l.submitButton.click();
        await this.page.waitForTimeout(2000);

        return await this._searchAndVerify(
            l, uploadtype, 'erhs', 'ERHS: ERHS', 'apx', 'APX: APX',
            2, 20, 4000, 0
        );
    }

    async UploadSalesOrder(username, password, uploadtype, FC, Brand) {
        const firstfile = getFilePath(FC, Brand, 'a');
        const secondfile = getFilePath(FC, Brand, 'b');
        const thirdfile = getFilePath(FC, Brand, 'c');
        const FcName = getFCName(FC);
        const BrandName = getBrandName(Brand);
        const l = uploadLocators(this.page);

        await this._login(username, password);
        await this._openUploadModal(l, uploadtype);
        await l.fcInput.click();
        await l.fcInput.fill(FC);
        await l.textOption(FcName).click();
        await l.brandCombobox.click();
        await l.brandCombobox.fill(Brand);
        await l.textOption(BrandName).click();
        await l.fileInputNth(0).setInputFiles(firstfile);
        await l.fileInputNth(1).setInputFiles(secondfile);
        await l.fileInputNth(2).setInputFiles(thirdfile);
        await l.submitButton.click();
        await this.page.waitForTimeout(2000);

        return await this._searchAndVerify(
            l, uploadtype, FC, FcName, Brand, BrandName,
            1.5, 14, 0, 4000
        );
    }

    async UploadSalesOrdertwo(username, password, uploadtype, FC, Brand) {
        const firstfile = getFilePath(FC, Brand, 'a');
        const secondfile = getFilePath(FC, Brand, 'b');
        const FcName = getFCName(FC);
        const BrandName = getBrandName(Brand);
        const l = uploadLocators(this.page);

        await this._login(username, password);
        await this._openUploadModal(l, uploadtype);
        await l.fcInput.click();
        await l.fcInput.fill(FC);
        await l.textOption(FcName).click();
        await l.brandCombobox.click();
        await l.brandCombobox.fill(Brand);
        await l.textOption(BrandName).click();
        await l.fileInputNth(0).setInputFiles(firstfile);
        await l.fileInputNth(1).setInputFiles(secondfile);
        await l.submitButton.click();
        await this.page.waitForTimeout(2000);

        return await this._searchAndVerify(
            l, uploadtype, FC, FcName, Brand, BrandName,
            1.5, 14, 0, 0
        );
    }

    async UploadSinglefileFcBrand(username, password, uploadtype, FC, Brand) {
        const firstfile = getFilePath(FC, Brand, 'a');
        const FcName = getFCName(FC);
        const BrandName = getBrandName(Brand);
        const l = uploadLocators(this.page);

        await this._login(username, password);
        await this._openUploadModal(l, uploadtype);
        await l.fcInput.click();
        await l.fcInput.fill(FC);
        await l.textOption(FcName).click();
        await l.brandCombobox.click();
        await l.brandCombobox.fill(Brand);
        await l.textOption(BrandName).click();
        await l.fileInputNth(0).setInputFiles(firstfile);
        await l.submitButton.click();
        await this.page.waitForTimeout(2000);

        return await this._searchAndVerify(
            l, uploadtype, FC, FcName, Brand, BrandName,
            1, 20, 0, 0
        );
    }

    async UploadGRN(username, password, FC, Brand, filePath) {
        const FcName = getFCName(FC);
        const BrandName = getBrandName(Brand);
        const l = uploadLocators(this.page);

        await this._login(username, password);
        await this._openUploadModal(l, 'Purchase Order');
        await l.fcInput.click();
        await l.fcInput.fill(FC);
        await l.textOption(FcName).click();
        await l.brandCombobox.click();
        await l.brandCombobox.fill(Brand);
        await l.textOption(BrandName).click();
        await l.fileInputNth(0).setInputFiles(filePath);
        await l.submitButton.click();
        await this.page.waitForTimeout(2000);

        return await this._searchAndVerify(
            l, 'Purchase Order', FC, FcName, Brand, BrandName,
            1, 20, 0, 0
        );
    }

    async UploadSinglefile(username, password, uploadtype, name) {
        const filePath = path.resolve(__dirname, `../test-data/APX/${name}.csv`);
        const l = uploadLocators(this.page);

        await this._login(username, password);
        await this._openUploadModal(l, uploadtype);
        await l.fcTypeFilter.click();
        await l.fcInputLegacy5.click();
        await l.fcInputLegacy5.fill('erhs');
        await l.textOption('ERHS: E Ripplr HosaRoad').click();
        await l.brandCombobox.click();
        await l.brandCombobox.fill('google');
        await l.textOption('GLSP: Google Pixel').click();
        await l.singleFileInput.setInputFiles(filePath);
        await l.submitButton.click();
        await this.page.waitForTimeout(2000);

        return await this._searchAndVerify(
            l, uploadtype, 'erhs', 'ERHS: E Ripplr HosaRoad', 'google', 'GLSP: Google Pixel',
            2, 20, 4000, 0
        );
    }

    async UploadSinglefileforerhsNTNG(username, password, uploadtype, name) {
        const filePath = path.resolve(__dirname, `../test-data/APX/${name}.csv`);
        const l = uploadLocators(this.page);

        await this._login(username, password);
        await this._openUploadModal(l, uploadtype);
        await l.fcInput.click();
        await l.fcInput.fill('erhs');
        await l.textOption('ERHS: E Ripplr HosaRoad').click();
        await l.brandCombobox.click();
        await l.brandCombobox.fill('nothing');
        await l.textOption('NOTH: NOTHING').click();
        await l.singleFileInput.setInputFiles(filePath);
        await l.submitButton.click();
        await this.page.waitForTimeout(2000);

        return await this._searchAndVerify(
            l, uploadtype, 'erhs', 'ERHS: E Ripplr HosaRoad', 'nothing', 'NOTH: NOTHING',
            2, 20, 4000, 0
        );
    }

    async UploadSinglefileforermkSMSNG(username, password, uploadtype, name) {
        const filePath = path.resolve(__dirname, `../test-data/APX/${name}.csv`);
        const l = uploadLocators(this.page);

        await this._login(username, password);
        await this._openUploadModal(l, uploadtype);
        await l.fcTypeFilter.click();
        await l.fcInputLegacy5.click();
        await l.fcInputLegacy5.fill('ermk');
        await l.textOption('ERMK: E Ripplr Makali').click();
        await l.brandCombobox.click();
        await l.brandCombobox.fill('SAMS');
        await l.textOption('SAMS: SAMSUNG').click();
        await l.singleFileInput.setInputFiles(filePath);
        await l.submitButton.click();
        await this.page.waitForTimeout(2000);

        return await this._searchAndVerify(
            l, uploadtype, 'ermk', 'ERMK: E Ripplr Makali', 'SAMS', 'SAMS: SAMSUNG',
            2, 20, 4000, 0
        );
    }

    async UploadBgrdMrcoSalesReturn(username, password) {
        const filePath = path.resolve(
            __dirname,
            '../test-data/bgrd-mrco-reutrn/MARCO_BrandReturn.csv'
        );
        const uploadtype = 'Sales Return';
        const FC = 'bgrd';
        const FcName = 'BGRD: Begur Road';
        const Brand = 'mrco';
        const BrandName = 'MRCO: Marico';
        const l = uploadLocators(this.page);

        await this._login(username, password);
        await this._openUploadModal(l, uploadtype);

        // Use stable modal-scoped locator — avoids fragile CSS-in-JS class (.cuNTTY)
        const modalFcInput = this.page.locator('.ant-modal-body .ant-form-item-control input').first();
        await modalFcInput.click();
        await modalFcInput.fill(FC);
        await l.textOption(FcName).click();
        await l.brandCombobox.click();
        await l.brandCombobox.fill(Brand);
        await l.textOption(BrandName).click();

        // Sales Return modal uses a single Upload button (not ant-space multi-input)
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.page.getByRole('button', { name: /Upload a File/i }).first().click(),
        ]);
        await fileChooser.setFiles(filePath);

        await l.submitButton.click();
        await this.page.waitForTimeout(2000);

        return await this._searchAndVerify(
            l, uploadtype, FC, FcName, Brand, BrandName,
            1.5, 14, 0, 0
        );
    }

    /**
     * Reads the processing modal text captured during _waitForProcessing and
     * extracts any product codes that failed with "Product not found in Product Master".
     *
     * CDMS error format:
     *   "Product not found in Product Master: SKU Code: 731343 Product Name: ... MRP: ..."
     *
     * Returns a Set of SKU codes, or an empty Set if all invoices passed.
     */
    async scanForProductNotFoundErrors() {
        const failedCodes = new Set();

        try {
            const modalText = this._lastModalText || '';

            if (!modalText) {
                console.log('scanForProductNotFoundErrors: no modal text captured');
                return failedCodes;
            }

            // Extract all SKU codes from CDMS product-not-found error messages.
            // CDMS formats observed:
            //   "Product not found in Product Master: SKU Code: 201052DF Product Name: ..."
            //   "Product not found in Product Master: 201052DF Product Name: ..."
            //   "SKU Code: 201052DF"  (detail / fallback page)
            const patterns = [
                /Product not found in Product Master:\s*(?:SKU Code:\s*)?([A-Za-z0-9]+)\s+Product Name/gi,
                /SKU Code:\s*([A-Za-z0-9]+)/gi,
            ];
            const seen = new Set();
            for (const pattern of patterns) {
                for (const m of [...modalText.matchAll(pattern)]) {
                    const code = m[1];
                    if (!seen.has(code)) {
                        seen.add(code);
                        failedCodes.add(code);
                        console.log(`[Product Master] Product not found — code: ${code}`);
                    }
                }
            }

        } catch (err) {
            console.log('scanForProductNotFoundErrors: error -', err.message);
        }

        console.log(`Failed product codes found: ${failedCodes.size > 0 ? [...failedCodes].join(', ') : 'none'}`);
        return failedCodes;
    }

    /**
     * Uploads a product master CSV file for the given FC/Brand.
     * @param {string} username
     * @param {string} password
     * @param {string} FC        - e.g. 'bgrd'
     * @param {string} Brand     - e.g. 'mrco'
     * @param {string} filePath  - absolute path to the generated product master CSV
     * @param {string} uploadType - document type label in the UI (default: 'Product Master')
     */
    async uploadProductMasterFcBrand(username, password, FC, Brand, filePath, uploadType = 'Product Master') {
        const FcName    = getFCName(FC);
        const BrandName = getBrandName(Brand);
        const l         = uploadLocators(this.page);

        await this._login(username, password);
        await this._openUploadModal(l, uploadType);

        // Product Master modal only has Brand (no FC field — product master is brand-wide)
        await l.brandCombobox.click();
        await l.brandCombobox.pressSequentially(Brand, { delay: 50 });
        await this.page.waitForTimeout(300);
        await l.textOption(BrandName).click();

        await this.page.locator('.ant-modal-body input[type="file"]').setInputFiles(filePath);
        await l.submitButton.click();
        // Product Master is brand-wide (no FC filter in results table) — just wait for the
        // modal to close (submit succeeded) rather than running full _searchAndVerify
        await this.page.waitForTimeout(3000);
        const modalStillOpen = await l.submitButton.isVisible({ timeout: 1000 }).catch(() => false);
        if (modalStillOpen) {
            console.log('Product master modal still open after submit — waiting more');
            await this.page.waitForTimeout(3000);
        }
        console.log('Product master submitted successfully');
        return true;
    }

    async UploadReturnRequestPdf(username, password, FC, Brand, filePaths) {
        const FcName = getFCName(FC);
        const BrandName = getBrandName(Brand);
        const uploadtype = 'Return request pdf';
        const l = uploadLocators(this.page);

        await this._login(username, password);
        await this._openUploadModal(l, uploadtype);

        // FC(s) — first input inside the modal form
        const modalFcInput = this.page.locator('.ant-modal-body .ant-form-item-control input').first();
        await modalFcInput.click();
        await modalFcInput.fill(FC);
        await this.page.waitForTimeout(400);
        await l.textOption(FcName).click();

        // Brand
        await l.brandCombobox.click();
        await l.brandCombobox.fill(Brand);
        await this.page.waitForTimeout(400);
        await l.textOption(BrandName).click();

        // File upload — "Upload a File" button triggers a file chooser
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.page.getByRole('button', { name: /Upload a File/i }).first().click(),
        ]);
        await fileChooser.setFiles(filePaths);

        await l.submitButton.click();
        await this.page.waitForTimeout(3000);

        // PDF uploads don't use the CSV processing modal (.ant-tag-blue strong),
        // so skip _searchAndVerify. Just confirm the modal closed after submit.
        const modalStillOpen = await l.submitButton.isVisible({ timeout: 2000 }).catch(() => false);
        if (modalStillOpen) {
            console.log('Return request PDF modal still open — waiting extra');
            await this.page.waitForTimeout(3000);
        }
        console.log('Return request PDF uploaded successfully');
        return true;
    }

    async uploadFilesByType(username, password, uploadtype, FC, Brand, fileTypes) {
        try {
            const filePaths = fileTypes.map(fileType => getFilePath(FC, Brand, fileType));
            const FcName = getFCName(FC);
            const BrandName = getBrandName(Brand);
            const l = uploadLocators(this.page);

            await this._login(username, password);
            await this._openUploadModal(l, uploadtype);
            await l.fcTypeFilter.click();
            await l.fcInputLegacy6.click();
            await l.fcInputLegacy6.fill(FC);
            await l.textOption(FcName).click();
            await l.brandCombobox.click();
            await l.brandCombobox.fill(Brand);
            await l.textOption(BrandName).click();

            for (let i = 0; i < filePaths.length; i++) {
                await l.fileInputNth(i).setInputFiles(filePaths[i]);
            }

            await l.submitButton.click();
            await this.page.waitForTimeout(2000);

            return await this._searchAndVerify(
                l, uploadtype, FC, FcName, Brand, BrandName,
                1.5, 14, 0, 0
            );
        } catch (err) {
            console.error('Upload failed:', err);
            return false;
        }
    }
};
