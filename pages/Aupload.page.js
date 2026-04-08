
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
        await l.fcFilterCombobox.fill(FC);
        await l.textOption(FcName).click();
        await l.brandFilterLabel.click();
        await l.brandFilterCombobox.fill(Brand);
        await l.textOption(BrandName).click();
        await l.searchButton.click();

        const uploadOk = await this._waitForUploadCompletion(l, diffLimit, maxRetries);
        if (!uploadOk) return false;

        try {
            await l.syncIcon.click();
            console.log("✅ Click succeeded");
        } catch (error) {
            console.log("❌ File uploaded but something went wrong:");
            return true;
        }

        if (syncDelay) await this.page.waitForTimeout(syncDelay);

        const processOk = await this._waitForProcessing(l, processExtraDelay);
        if (!processOk) return false;

        await l.closeButton.click();
        try {
            await l.eyeIcon.click();
            await this.page.waitForTimeout(4000);
            console.log("File Uploaded Successfully and processed");
            return true;
        } catch (error) {
            console.log("Something went wrong");
            return true;
        }
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
            1.5, 14, 0, 0
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
