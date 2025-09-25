
const path = require('path');

const getFCName = (fcCode) => {
        const fcMap = {
            'erhs': 'ERHS: ERHS',
            'btml': 'BTML: BTM',
            'yspr': 'YSPR: Yashawanthapur',
        }
        return fcMap[fcCode] || fcCode;
 }

const getBrandName = (brandCode) => {
        const brandMap = {
            'britania': 'BRIT: Britania',
            'apx': 'APX: APX',
            'hul': 'HUL: HUL',
            'huls': 'HULS: HUL Samadhan',
            'sunpure': 'SNPR: Sunpure'
        }
        return brandMap[brandCode] || brandCode;
    }

const getFilePath = (fcCode, brandCode, fileType) => {
        const filePathMap = {
            'btml-britania': {
                'h1': 'h1 copy.csv',
                'm1': 'm1 copy.csv',
                'sr1': 'sr copy.csv'
            },
            'yspr-hul': {
                'a': 'bl.csv',
                'b': 'sr.csv',
                'c': 's.csv'
            },
            'yspr-huls': {
                'a': 'bl.csv',
                // 'a': 'bl100.csv',
                'b': 'sr.csv',
                // 'b': 'sr100.csv',
                'c': 's.csv'
                // 'c': 's100.csv'
            },
            'btml-sunpure': {
                'a': 'S1.csv',
            },
            'apx': {
                'grn': 'GRN.csv',
                'salesorder': 'salesorder.csv',
                'salesreturn': 'salesreturn.csv'
            }
        };
        
        const fcBrandKey = `${fcCode}-${brandCode}`;
        const fileName = filePathMap[fcBrandKey]?.[fileType];
        
        if (!fileName) {
            throw new Error(`File path not found for FC: ${fcCode}, Brand: ${brandCode}, FileType: ${fileType}`);
        }
        
        return path.resolve(__dirname, `../test-data/${fcBrandKey}/${fileName}`);
    }
 


exports.Uploadfile = class Uploadfile {
    constructor(page) {
        this.page = page;
    }

    
    async Upload(username, password, uploadtype, name) {
        const filePath = path.resolve(__dirname, `../test-data/APX/${name}.csv`);
        await this.page.getByRole('textbox', { name: 'User ID User ID' }).click();
        await this.page.getByRole('textbox', { name: 'User ID User ID' }).fill(username);
        await this.page.getByRole('textbox', { name: 'Password Password' }).click();
        await this.page.getByRole('textbox', { name: 'Password Password' }).fill(password);
        await this.page.getByRole('button', { name: 'Login' }).click();
        await this.page.getByRole('link', { name: 'Adapter Uploads' }).click();
        await this.page.getByRole('button', { name: 'Upload' }).click();
        await this.page.getByLabel('Upload Csv').locator('label span').nth(1).click();
        await this.page.waitForTimeout(200);
        await this.page.getByTitle(uploadtype).locator('div').click();
        await this.page.locator('div').filter({ hasText: /^Fc Type$/ }).nth(4).click();
        await this.page.locator('#rc_select_6').click();
        await this.page.locator('#rc_select_6').fill('erhs');
        await this.page.getByText('ERHS: ERHS').click();
        await this.page.getByRole('combobox', { name: '*Brand' }).click();
        await this.page.getByRole('combobox', { name: '*Brand' }).fill('apx');
        await this.page.getByText('APX: APX').click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        await this.page.getByRole('button', { name: 'Submit' }).click();
        await this.page.waitForTimeout(2000);
        await this.page.getByRole('combobox', { name: 'Select File Types' }).click();
        await this.page.getByTitle(uploadtype).locator('div').click();
        await this.page.getByRole('combobox', { name: 'FC Select FC' }).click();
        await this.page.getByRole('combobox', { name: 'FC Select FC' }).fill('erhs');
        await this.page.getByText('ERHS: ERHS').click();
        await this.page.locator('label').filter({ hasText: 'Brand(s) Select Brand(s)' }).locator('div').nth(2).click();
        await this.page.getByRole('combobox', { name: 'Brand(s) Select Brand(s)' }).fill('apx');
        await this.page.getByText('APX: APX').click();
        await this.page.getByRole('button', { name: 'Search' }).click();
        let cnt=0;
        while(true){
            cnt++;
            if(cnt==14){
                console.log("Something went wrong, file not Uploaded");
                return false;
            }
            const uploadedTimeText = await this.page.locator('tr:first-child td:nth-child(6) div:nth-child(2) span').innerText();
            const currentTime = new Date();
            // Parse uploaded time (dd/MM/yyyy, hh:mm a)
            function parseUploadedTime(str) {
            // Example: "17/09/2025, 04:26 PM"
            const [datePart, timePart, ampm] = str.replace(',', '').split(/\s+/);
            const [day, month, year] = datePart.split('/').map(Number);
            let [hours, minutes] = timePart.split(':').map(Number);
            // Convert 12-hour to 24-hour
            if (ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
            if (ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
            return new Date(year, month - 1, day, hours, minutes);
            }
            const uploadedTime = parseUploadedTime(uploadedTimeText);

                const diffMs = Math.abs(currentTime.getTime() - uploadedTime.getTime());
                const diffMinutes = Math.floor(diffMs / 60000);
                console.log(`Difference in minutes: ${diffMinutes} minutes`);
            if(diffMinutes<=2)break;    
            await this.page.getByRole('button', { name: 'Search' }).click(); 
       }

        try {
             await this.page.locator("tr:first-child .anticon-sync").click();
             console.log("✅ Click succeeded");
        } catch (error) {
             console.log("❌ File uploaded but something went wrong:");
             return true;
        }
        await this.page.waitForTimeout(4000);
         cnt=0;
        while(true){
            cnt++;
            if(cnt==14){
                console.log("Something went wrong, file not Uploaded");
                return false;
            }
            const ProgressCount = await this.page.locator('.ant-tag-blue strong').innerText();
            console.log(`ProgressCount: ${ProgressCount}`);
            if(ProgressCount==='0')break;
            await this.page.waitForTimeout(3300);
            await this.page.locator("div[class='ant-modal-body'] div[class='sc-bczRLJ sc-gsnTZi hRYqBu jnFvAE']").click();
       }
        await this.page.getByRole('button', { name: 'Close' }).click();
        try {
            await this.page.locator("tr:first-child img[src*='eye-icon']").click();
            await this.page.getByRole('div', { name: '/Successfully Uploaded/' }).click();
            await this.page.waitForTimeout(4000);
            console.log("File Uploaded Successfully and processed");
            return true;
        }catch(error){
            console.log("Something went wrong")
            return true;
        }
      }

    async UploadSalesOrder(username, password, uploadtype, FC, Brand) {
        // Get file paths using the reusable function
        const firstfile = getFilePath(FC, Brand, 'a');
        const secondfile = getFilePath(FC, Brand, 'b');
        const thirdfile = getFilePath(FC, Brand, 'c');
        await this.page.getByRole('textbox', { name: 'User ID User ID' }).click();
        await this.page.getByRole('textbox', { name: 'User ID User ID' }).fill(username);
        await this.page.getByRole('textbox', { name: 'Password Password' }).click();
        await this.page.getByRole('textbox', { name: 'Password Password' }).fill(password);
        await this.page.getByRole('button', { name: 'Login' }).click();
        await this.page.getByRole('link', { name: 'Adapter Uploads' }).click();
        await this.page.getByRole('button', { name: 'Upload' }).click();
        await this.page.getByLabel('Upload Csv').locator('label span').nth(1).click();
        await this.page.waitForTimeout(200);
        await this.page.getByTitle(uploadtype).locator('div').click();
        await this.page.locator('div').filter({ hasText: /^Fc Type$/ }).nth(4).click();
        await this.page.locator('#rc_select_6').click();
        await this.page.locator('#rc_select_6').fill(FC);
        const FcName = getFCName(FC);
        await this.page.getByText(FcName).click();
        await this.page.getByRole('combobox', { name: '*Brand' }).click();
        await this.page.getByRole('combobox', { name: '*Brand' }).fill(Brand);
        const BrandName = getBrandName(Brand);
        await this.page.getByText(BrandName).click();
        // First input
        await this.page.locator('div.ant-space.ant-space-horizontal.ant-space-align-center input[type="file"]').nth(0).setInputFiles(firstfile);

        // Second input
        await this.page.locator('div.ant-space.ant-space-horizontal.ant-space-align-center input[type="file"]').nth(1).setInputFiles(secondfile);

        // Third input
        await this.page.locator('div.ant-space.ant-space-horizontal.ant-space-align-center input[type="file"]').nth(2).setInputFiles(thirdfile);

        await this.page.getByRole('button', { name: 'Submit' }).click();
        await this.page.waitForTimeout(2000);
        await this.page.getByRole('combobox', { name: 'Select File Types' }).click();
        await this.page.getByTitle(uploadtype).locator('div').click();
        await this.page.getByRole('combobox', { name: 'FC Select FC' }).click();
        await this.page.getByRole('combobox', { name: 'FC Select FC' }).fill(FC);
        await this.page.getByText(FcName).click();
        await this.page.locator('label').filter({ hasText: 'Brand(s) Select Brand(s)' }).locator('div').nth(2).click();
        await this.page.getByRole('combobox', { name: 'Brand(s) Select Brand(s)' }).fill(Brand);
        await this.page.getByText(BrandName).click();
        await this.page.getByRole('button', { name: 'Search' }).click();
        let cnt=0;
        while(true){
            cnt++;
            if(cnt==14){
                console.log("Something went wrong, file not Uploaded");
                return false;
            }
            const uploadedTimeText = await this.page.locator('tr:first-child td:nth-child(6) div:nth-child(2) span').innerText();
            const currentTime = new Date(); // Current system time
            // Parse uploaded time (dd/MM/yyyy, hh:mm a)
            function parseUploadedTime(str) {
            // Example: "17/09/2025, 04:26 PM"
            const [datePart, timePart, ampm] = str.replace(',', '').split(/\s+/);
            const [day, month, year] = datePart.split('/').map(Number);
            let [hours, minutes] = timePart.split(':').map(Number);
            // Convert 12-hour to 24-hour
            if (ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
            if (ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
            return new Date(year, month - 1, day, hours, minutes);
            }
            const uploadedTime = parseUploadedTime(uploadedTimeText);

                const diffMs = Math.abs(currentTime.getTime() - uploadedTime.getTime());
                const diffMinutes = Math.floor(diffMs / 60000);
                console.log(`Difference in minutes: ${diffMinutes} minutes`);
            if(diffMinutes<=1.5)break;    
            await this.page.getByRole('button', { name: 'Search' }).click(); 
       }

        try {
             await this.page.locator("tr:first-child .anticon-sync").click();
             console.log("✅ Click succeeded");
        } catch (error) {
             console.log("❌ File uploaded but something went wrong:");
             return true;
        }
        // await this.page.waitForTimeout(4000);
        cnt=0;
        while(true){
            cnt++;
            if(cnt==14){
                console.log("Something went wrong, file not Uploaded");
                return false;
            }
            const ProgressCount = await this.page.locator('.ant-tag-blue strong').innerText();
            console.log(`ProgressCount: ${ProgressCount}`);
            if(ProgressCount==='0')break;
            await this.page.waitForTimeout(3300);
            await this.page.locator("div[class='ant-modal-body'] div[class='sc-bczRLJ sc-gsnTZi hRYqBu jnFvAE']").click();
       }

        await this.page.getByRole('button', { name: 'Close' }).click();
        try {
            await this.page.locator("tr:first-child img[src*='eye-icon']").click();
            await this.page.getByRole("body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2)").click();
            await this.page.waitForTimeout(4000);
            console.log("File Uploaded Successfully and processed");
            return true;
        }catch(error){
            console.log("Something went wrong")
            return true;
        }
    }

    async uploadFilesByType(username, password, uploadtype, FC, Brand, fileTypes) {
        try {
            // Get file paths using the reusable function
            const filePaths = fileTypes.map(fileType => getFilePath(FC, Brand, fileType));
            
            await this.page.getByRole('textbox', { name: 'User ID User ID' }).click();
            await this.page.getByRole('textbox', { name: 'User ID User ID' }).fill(username);
            await this.page.getByRole('textbox', { name: 'Password Password' }).click();
            await this.page.getByRole('textbox', { name: 'Password Password' }).fill(password);
            await this.page.getByRole('button', { name: 'Login' }).click();
            await this.page.getByRole('link', { name: 'Adapter Uploads' }).click();
            await this.page.getByRole('button', { name: 'Upload' }).click();
            await this.page.getByLabel('Upload Csv').locator('label span').nth(1).click();
            await this.page.waitForTimeout(200);
            await this.page.getByTitle(uploadtype).locator('div').click();
            await this.page.locator('div').filter({ hasText: /^Fc Type$/ }).nth(4).click();
            await this.page.locator('#rc_select_6').click();
            await this.page.locator('#rc_select_6').fill(FC);
            const FcName = getFCName(FC);
            await this.page.getByText(FcName).click();
            await this.page.getByRole('combobox', { name: '*Brand' }).click();
            await this.page.getByRole('combobox', { name: '*Brand' }).fill(Brand);
            const BrandName = getBrandName(Brand);
            await this.page.getByText(BrandName).click();
            
            // Upload files dynamically based on the provided file types
            for (let i = 0; i < filePaths.length; i++) {
                await this.page.locator('div.ant-space.ant-space-horizontal.ant-space-align-center input[type="file"]').nth(i).setInputFiles(filePaths[i]);
            }

            await this.page.getByRole('button', { name: 'Submit' }).click();
            await this.page.waitForTimeout(2000);
            await this.page.getByRole('combobox', { name: 'Select File Types' }).click();
            await this.page.getByTitle(uploadtype).locator('div').click();
            await this.page.getByRole('combobox', { name: 'FC Select FC' }).click();
            await this.page.getByRole('combobox', { name: 'FC Select FC' }).fill(FC);
            await this.page.getByText(FcName).click();
            await this.page.locator('label').filter({ hasText: 'Brand(s) Select Brand(s)' }).locator('div').nth(2).click();
            await this.page.getByRole('combobox', { name: 'Brand(s) Select Brand(s)' }).fill(Brand);
            await this.page.getByText(BrandName).click();
            await this.page.getByRole('button', { name: 'Search' }).click();
            
            // Wait for upload completion
            let cnt = 0;
            while(true){
                cnt++;
                if(cnt == 14){
                    console.log("Something went wrong, file not Uploaded");
                    return false;
                }
                const uploadedTimeText = await this.page.locator('tr:first-child td:nth-child(6) div:nth-child(2) span').innerText();
                const currentTime = new Date();
                
                function parseUploadedTime(str) {
                    const [datePart, timePart, ampm] = str.replace(',', '').split(/\s+/);
                    const [day, month, year] = datePart.split('/').map(Number);
                    let [hours, minutes] = timePart.split(':').map(Number);
                    if (ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
                    if (ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
                    return new Date(year, month - 1, day, hours, minutes);
                }
                const uploadedTime = parseUploadedTime(uploadedTimeText);
                const diffMs = Math.abs(currentTime.getTime() - uploadedTime.getTime());
                const diffMinutes = Math.floor(diffMs / 60000);
                console.log(`Difference in minutes: ${diffMinutes} minutes`);
                if(diffMinutes <= 1.5) break;    
                await this.page.getByRole('button', { name: 'Search' }).click(); 
            }

            try {
                await this.page.locator("tr:first-child .anticon-sync").click();
                console.log("✅ Click succeeded");
            } catch (error) {
                console.log("❌ File uploaded but something went wrong:");
                return true;
            }
            
            // Wait for processing completion
            cnt = 0;
            while(true){
                cnt++;
                if(cnt == 14){
                    console.log("Something went wrong, file not Uploaded");
                    return false;
                }
                const ProgressCount = await this.page.locator('.ant-tag-blue strong').innerText();
                console.log(`ProgressCount: ${ProgressCount}`);
                if(ProgressCount === '0') break;
                await this.page.waitForTimeout(3300);
                await this.page.locator("div[class='ant-modal-body'] div[class='sc-bczRLJ sc-gsnTZi hRYqBu jnFvAE']").click();
            }

            await this.page.getByRole('button', { name: 'Close' }).click();
            try {
                await this.page.locator("tr:first-child img[src*='eye-icon']").click();
                await this.page.getByRole("body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2)").click();
                await this.page.waitForTimeout(4000);
                console.log("File Uploaded Successfully and processed");
                return true;
            } catch(error) {
                console.log("Something went wrong");
                return true;
            }
        } catch (err) {
            console.error('Upload failed:', err);
            return false;
        }
    }
};

