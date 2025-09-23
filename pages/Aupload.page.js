
const path = require('path');

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
        // await this.page.getByText(uploadtype).click();
        await this.page.getByTitle(uploadtype).locator('div').click();
        await this.page.locator('div').filter({ hasText: /^Fc Type$/ }).nth(4).click();
        await this.page.locator('#rc_select_6').click();
        await this.page.locator('#rc_select_6').fill('erhs');
        await this.page.getByText('ERHS: ERHS').click();
        await this.page.getByRole('combobox', { name: '*Brand' }).click();
        await this.page.getByRole('combobox', { name: '*Brand' }).fill('apx');
        await this.page.getByText('APX: APX').click();
        // await this.page.locator('button').filter({ hasText: 'Upload a File', exact: true }).click();
        await this.page.setInputFiles('input[type="file"]', filePath);
        // await this.page.locator('button').filter({ hasText: 'Upload a File', exact: true }).click();
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

    async UploadSalesOrder(username, password, uploadtype) {
        const h1 = path.resolve(__dirname, `../test-data/btml-britania/h1.csv`);
        const m1 = path.resolve(__dirname, `../test-data/btml-britania/m1.csv`);
        const sr1 = path.resolve(__dirname, `../test-data/btml-britania/sr.csv`);
        await this.page.getByRole('textbox', { name: 'User ID User ID' }).click();
        await this.page.getByRole('textbox', { name: 'User ID User ID' }).fill(username);
        await this.page.getByRole('textbox', { name: 'Password Password' }).click();
        await this.page.getByRole('textbox', { name: 'Password Password' }).fill(password);
        await this.page.getByRole('button', { name: 'Login' }).click();
        await this.page.getByRole('link', { name: 'Adapter Uploads' }).click();
        await this.page.getByRole('button', { name: 'Upload' }).click();
        await this.page.getByLabel('Upload Csv').locator('label span').nth(1).click();
        await this.page.waitForTimeout(200);
        // await this.page.getByText(uploadtype).click();
        await this.page.getByTitle(uploadtype).locator('div').click();
        await this.page.locator('div').filter({ hasText: /^Fc Type$/ }).nth(4).click();
        await this.page.locator('#rc_select_6').click();
        await this.page.locator('#rc_select_6').fill('btml');
        await this.page.getByText('BTML: BTM').click();
        await this.page.getByRole('combobox', { name: '*Brand' }).click();
        await this.page.getByRole('combobox', { name: '*Brand' }).fill('Britania');
        await this.page.getByText('BRIT: Britania').click();
        // await this.page.locator('button').filter({ hasText: 'Upload a File', exact: true }).click();
        // First input
        await this.page.locator('div.ant-space.ant-space-horizontal.ant-space-align-center input[type="file"]').nth(0).setInputFiles(m1);

        // Second input
        await this.page.locator('div.ant-space.ant-space-horizontal.ant-space-align-center input[type="file"]').nth(1).setInputFiles(h1);

        // Third input
        await this.page.locator('div.ant-space.ant-space-horizontal.ant-space-align-center input[type="file"]').nth(2).setInputFiles(sr1);

        // await this.page.locator('button').filter({ hasText: 'Upload a File', exact: true }).click();
        await this.page.getByRole('button', { name: 'Submit' }).click();
        await this.page.waitForTimeout(2000);
        await this.page.getByRole('combobox', { name: 'Select File Types' }).click();
        await this.page.getByTitle(uploadtype).locator('div').click();
        await this.page.getByRole('combobox', { name: 'FC Select FC' }).click();
        await this.page.getByRole('combobox', { name: 'FC Select FC' }).fill('btml');
        await this.page.getByText('BTML: BTM').click();
        await this.page.locator('label').filter({ hasText: 'Brand(s) Select Brand(s)' }).locator('div').nth(2).click();
        await this.page.getByRole('combobox', { name: 'Brand(s) Select Brand(s)' }).fill('Britania');
        await this.page.getByText('BRIT: Britania').click();
        await this.page.getByRole('button', { name: 'Search' }).click();
        for (let i = 0; i < 5; i++) { // max 5 retries (20 seconds total)
            try {
                await this.page.locator("td[class='ant-table-cell ant-table-cell-row-hover'] span[aria-label='sync'] svg").click({ timeout: 1000 });
                console.log("✅ Click succeeded");
                break; // exit loop if click worked
            } catch (error) {
                console.log(`⚠️ Attempt ${i + 1} failed, retrying in 4s...`);
                await this.page.waitForTimeout(2000);
            }
        }

        await this.page.waitForTimeout(3000);
        // await this.page.locator('.ant-table-cell.ant-table-cell-row-hover > .sc-bczRLJ.sc-gsnTZi > div:nth-child(4)').click();
        await this.page.getByRole('button', { name: 'Refresh' }).click();
        await this.page.getByRole('button', { name: 'Close' }).click();
        await this.page.waitForTimeout(10000);   
        return true;

      }  
};

