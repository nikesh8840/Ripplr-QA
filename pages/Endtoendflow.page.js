
const path = require('path');
const { incrementBillNumbers } = require('../utils/dataUtils');
const { getFCName, getBrandName, getFilePath } = require('../utils/fcbrands');
 


exports.Uploadfile = class Uploadfile {
    constructor(page) {
        this.page = page;
    }

    async UploadSalesOrdertwo(username, password, uploadtype, FC, Brand) {
        // Get file paths using the reusable function
        const firstfile = getFilePath(FC, Brand, 'a');
        const secondfile = getFilePath(FC, Brand, 'b');
        // const thirdfile = getFilePath(FC, Brand, 'c');
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
        await this.page.locator('.cuNTTY:first-child .ant-form-item-control input').click();
        await this.page.locator('.cuNTTY:first-child .ant-form-item-control input').fill(FC);
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
        // await this.page.locator('div.ant-space.ant-space-horizontal.ant-space-align-center input[type="file"]').nth(2).setInputFiles(thirdfile);

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

    async allocateVehiclewithfcbrand(username, password, FC, Brand) {
        try {
            // Navigate (already logged in from upload step)
            await this.page.getByText('Logistics Management').click();
            await this.page.getByRole('link', { name: 'Delivery Allocation' }).click();
            await this.page.getByRole('button', { name: 'Create Delivery Allocation' }).click();
            await this.page.waitForTimeout(2000);

            // ✅ FC Filter with Wait and Retry - Clear field and retry 3 times
            const fcName = getFCName(FC);
            let fcSelected = false;
            let fcRetryCount = 0;
            const maxFcRetries = 3;
            
            while (!fcSelected && fcRetryCount < maxFcRetries) {
                try {
                    fcRetryCount++;
                    console.log(`FC selection attempt ${fcRetryCount}...`);
                    
                    const fcCombobox = this.page.getByRole('combobox', { name: 'FC(s) Select FC(s)' });
                    await fcCombobox.click();
                    await this.page.waitForTimeout(500);
                    
                    // Clear and write FC
                    await fcCombobox.fill('');
                    await this.page.waitForTimeout(300);
                    await fcCombobox.fill(FC);
                    await this.page.waitForTimeout(800);
                    
                    // Wait for dropdown and select
                    await this.page.waitForSelector(`text=${fcName}`, { timeout: 5000 });
                    await this.page.getByText(fcName).click();
                    await this.page.waitForTimeout(800);
                    
                    fcSelected = true;
                    console.log(`✅ FC selection successful on attempt ${fcRetryCount}`);
                } catch (error) {
                    console.log(`❌ FC selection failed on attempt ${fcRetryCount}: ${error.message}`);
                    if (fcRetryCount >= maxFcRetries) {
                        console.error(`FC selection failed after ${maxFcRetries} attempts`);
                        throw error;
                    }
                    await this.page.waitForTimeout(1500);
                }
            }

            // Brand Selection with Retry - Clear field and retry 3 times
            const brandName = getBrandName(Brand);
            let brandSelected = false;
            let brandRetryCount = 0;
            const maxBrandRetries = 3;
            
            while (!brandSelected && brandRetryCount < maxBrandRetries) {
                try {
                    brandRetryCount++;
                    console.log(`Brand selection attempt ${brandRetryCount}...`);
                    
                    const brandCombobox = this.page.getByRole('combobox', { name: 'Brands Select Brand(s)' });
                    await brandCombobox.click();
                    await this.page.waitForTimeout(500);
                    
                    // Clear and write Brand
                    await brandCombobox.fill('');
                    await this.page.waitForTimeout(300);
                    await brandCombobox.fill(Brand);
                    await this.page.waitForTimeout(800);
                    
                    // Wait for dropdown and select
                    await this.page.waitForSelector(`text=${brandName}`, { timeout: 5000 });
                    await this.page.getByText(brandName).click();
                    await this.page.waitForTimeout(800);
                    
                    brandSelected = true;
                    console.log(`✅ Brand selection successful on attempt ${brandRetryCount}`);
                } catch (error) {
                    console.log(`❌ Brand selection failed on attempt ${brandRetryCount}: ${error.message}`);
                    if (brandRetryCount >= maxBrandRetries) {
                        console.error(`Brand selection failed after ${maxBrandRetries} attempts`);
                        throw error;
                    }
                    await this.page.waitForTimeout(1500);
                }
            }

            await this.page.waitForTimeout(3000);
            await this.page.getByRole('button', { name: 'Search' }).click();
            await this.page.waitForTimeout(1500);
            
            await this.page.locator('.ant-checkbox').nth(1).click();
            await this.page.locator('.ant-checkbox').nth(2).click();

            await this.page.getByRole('button', { name: 'Allocate Vehicle' }).click();
            
            // Skip button is optional - wait only 2 seconds for it to appear
            try {
                const skipButton = this.page.getByRole('button', { name: 'Skip' });
                await skipButton.waitFor({ state: 'visible', timeout: 2000 });
                await skipButton.click();
                console.log('Skip button found and clicked');
            } catch (error) {
                console.log('Skip button did not appear within 2 seconds, continuing...');
            }

            await this.page.locator('.ant-form-item-control-input-content').first().click();
            await this.page.getByTitle('Both').locator('div').click();

            await this.page.locator('.ant-form-item-control-input-content').nth(1).click();
            await this.page.getByTitle('Regular').locator('div').click();

            await this.page.locator('.ant-form-item-control-input-content').nth(2).click();
            await this.page.waitForSelector('div[title="Regular"]', { timeout: 5000 });
            await this.page.getByText('Regular').nth(4).click();

            await this.page.getByRole('textbox', { name: 'Vehicle Number*' }).click();
            await this.page.getByRole('textbox', { name: 'Vehicle Number*' }).fill('KA8JD9302');

            await this.page.getByRole('textbox', { name: 'Driver Name *', exact: true }).click();
            await this.page.getByRole('textbox', { name: 'Driver Name *', exact: true }).fill('NIKesHh A');

            await this.page.getByRole('textbox', { name: 'Vendor Name *' }).click();
            await this.page.getByRole('textbox', { name: 'Vendor Name *' }).fill('Test Vendor');

            await this.page.getByRole('textbox', { name: 'Driver Number *' }).click();
            await this.page.getByRole('textbox', { name: 'Driver Number *' }).fill('8840576893');

            await this.page.locator('.ant-form-item-control-input-content').last().click();
            await this.page.locator('.ant-form-item-control-input-content input').last().fill('del');
            await this.page.getByTitle('Delivery Boy').locator('div').click();

            await this.page.getByRole('button', { name: 'Submit' }).click();
            await this.page.getByRole('button', { name: 'Confirm' }).click();
            await this.page.getByRole('button', { name: 'Confirm' }).click();
            await this.page.waitForTimeout(3000);

            return true;
        } catch (err) {
            console.error('Vehicle allocation failed:', err);
            return false;
        }
    }

    async incrementBillNumbersForFCBrand(FC, Brand) {
        try {
            const dataPath = path.resolve(__dirname, `../test-data/${FC}-${Brand}`);
            
            // Default file names for two-file upload
            const csvFileNames = ['salesmarico.csv', 'credit.csv'];
            
            const file1Path = path.join(dataPath, csvFileNames[0]);
            const file2Path = path.join(dataPath, csvFileNames[1]);
            
            console.log(`Incrementing bill numbers for ${FC}-${Brand}...`);
            await incrementBillNumbers(file1Path, 'Bill Number');
            console.log(`✓ Incremented ${csvFileNames[0]}`);
            
            await incrementBillNumbers(file2Path, 'Bill Number');
            console.log(`✓ Incremented ${csvFileNames[1]}`);
            
            return true;
        } catch (err) {
            console.error('Error incrementing bill numbers:', err);
            return false;
        }
    }

    async runE2EFlow(username, password, baseURL, FC, Brand) {
        try {
            console.log('='.repeat(50));
            console.log(`Starting E2E Flow for ${FC}:${Brand}`);
            console.log('='.repeat(50));

            // Step 0: Increment Bill Numbers
            console.log('\n--- Step 0: Increment Bill Numbers ---');
            await this.incrementBillNumbersForFCBrand(FC, Brand);
            console.log('✅ Bill numbers incremented successfully');

            // Step 1: Upload Sales Order
            console.log('\n--- Step 1: Upload Sales Order ---');
            await this.page.goto(baseURL);
            const uploadSuccess = await this.UploadSalesOrdertwo(username, password, 'Sales Order', FC, Brand);
            if (!uploadSuccess) {
                console.error('Upload failed');
                return false;
            }
            console.log('✅ Upload completed successfully');

            // Step 2: Allocate Vehicle
            console.log('\n--- Step 2: Allocate Vehicle ---');
            await this.page.goto(baseURL);
            const vehicleAllocationSuccess = await this.allocateVehiclewithfcbrand(username, password, FC, Brand);
            if (!vehicleAllocationSuccess) {
                console.error('Vehicle allocation failed');
                return false;
            }
            console.log('✅ Vehicle allocation completed successfully');

            // Step 3: Deliver and RFC Close
            console.log('\n--- Step 3: Deliver and RFC Close ---');
            await this.page.goto(baseURL);
            const deliverySuccess = await this.PartialDeliveredFullCollectionRfcClose(username, password);
            if (!deliverySuccess) {
                console.error('Delivery and RFC close failed');
                return false;
            }
            console.log('✅ Delivery and RFC Close completed successfully');

            console.log('\n' + '='.repeat(50));
            console.log('✅ E2E Flow completed successfully!');
            console.log('='.repeat(50));
            return true;

        } catch (err) {
            console.error('E2E Flow failed:', err);
            return false;
        }
    }

    async PartialDeliveredFullCollectionRfcClose(username, password) {
        try {
            const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
            // Navigate (already logged in from upload step)
            await this.page.getByText('Logistics Management').click();
            await this.page.getByRole('link', { name: 'Return To Fc' }).click();
            await this.page.locator('tr .ccyvke a').nth(0).click();
            console.log('step 1 done');
            await this.page.waitForTimeout(3000);
            console.log('step 2 done');
            await this.page.waitForTimeout(2000);
            const rowCount1 = await this.page.locator('tbody tr').count();
            const allRows = await this.page.locator('tbody tr').all();
            console.log('step 3 done');
            console.log(`tbody tr count: ${rowCount1} and allRows length: ${allRows.length}`);
            const processSuccess = await this.processPartialDlPartialCollection(Math.max(rowCount1 - 1, allRows.length - 1));
            if (!processSuccess) {
                console.error('❌ Delivery items processing failed');
                return false;
            }
            console.log('All delivery items processed and out of loop');
            await this.page.locator('button:has-text("Upload Inv & Other Doc")').click();
            await this.page.setInputFiles('input[type="file"]', filePath);
            await this.page.locator('button.giRYTO .iVToiv').click();
            console.log('first file Uploaded');
            await this.page.locator('button:has-text("Upload Inv & Other Doc")').click();
            await this.page.setInputFiles('input[type="file"]', filePath);
            await this.page.locator('button.giRYTO .iVToiv').click();
            console.log('second file Uploaded');
            await this.page.waitForTimeout(1000);
            await this.page.getByRole('button', { name: 'Verify' }).click();
            console.log('Delivered and RFC process completed successfully');
            return true;
        } catch (err) {
            console.error('Delivered process failed:', err);
            return false;
        }
    }

    async processPartialDlPartialCollection(itemCount) {
        console.log(`Processing ${itemCount} delivery items`);
        try {
            for (let i = 0; i < itemCount; i++) {
                const status = await this.page.locator(`tr:nth-child(${i + 2}) td:nth-child(7) .ant-select-selector`).innerText();
                console.log('===========================', status);
                if (status == 'Delivered' || status == 'Partial Delivered' || status == 'Delivery Attempted') {
                    continue;
                }

                // Set all deliveries to Partial Delivered
                const statusToSelect = 'Partial Delivered';
                console.log(`Item ${i + 1}: Setting status to ${statusToSelect}`);

                // Retry logic for clicking the status selector
                let statusClicked = false;
                let statusRetryCount = 0;
                const maxStatusRetries = 3;

                while (!statusClicked && statusRetryCount < maxStatusRetries) {
                    try {
                        statusRetryCount++;
                        await this.page.locator(`tr:nth-child(${i + 2}) td:nth-child(7) .ant-select-selector`).click({ timeout: 5000 });
                        statusClicked = true;
                    } catch (error) {
                        console.log(`⚠️ Attempt ${statusRetryCount} failed to click status selector: ${error.message}`);
                        if (statusRetryCount >= maxStatusRetries) {
                            throw new Error(`Critical: Failed to click status selector after ${maxStatusRetries} attempts`);
                        }
                        await this.page.waitForTimeout(1500); // Wait 1.5 seconds before retrying
                    }
                }
                await this.page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
                await this.page.locator(`.ant-select-dropdown .ant-select-item:has-text("${statusToSelect}"):not([disabled]):not([hidden]):not(.ant-select-item-option-disabled)`).first().click();
                await this.page.getByRole('button', { name: 'OK' }).click();
                await this.page.getByRole('button', { name: 'Yes' }).click();

                // Fill in the partial delivery details
                let PickedQty = await this.page.locator('tr td.ant-table-cell:nth-child(3) .sc-bczRLJ').first().innerText();
                console.log('PickedQty', PickedQty);
                let halfPickedQty = Math.ceil(Number(PickedQty) / 2);
                if (halfPickedQty < 1) {
                    halfPickedQty = 1;
                }
                await this.page.locator('tr td.ant-table-cell:nth-child(5) input').click();
                await this.page.locator('tr td.ant-table-cell:nth-child(5) input').fill(String(halfPickedQty));
                await this.page.locator('#return_reason0').click();
                await this.page.getByText('Product Not Required').click();

                await this.page.getByRole('button', { name: 'Delivery Details' }).click();
                await this.page.getByRole('button', { name: 'Update' }).click();
                await this.page.getByRole('radio', { name: 'Invoice Returned' }).check();
                let collectableamount = await this.page.locator(`.ant-col-xs-6:nth-child(12) .sc-kOZHUs`).innerText();
                collectableamount = collectableamount.replace('₹', '').replace(',', '');
                collectableamount = (collectableamount);
                console.log('collectableamount type', typeof collectableamount);
                console.log('collectableamount', collectableamount);
                await this.page.locator("input[name='cash']").click();
                await this.page.locator("input[name='cash']").fill(String(Math.ceil(collectableamount-1)));
                await this.page.getByRole('button', { name: 'Collection Details' }).click();
                await this.page.getByRole('button', { name: 'Update' }).click();
                await this.page.getByRole('link', { name: 'Invoice List' }).click();
                await this.page.waitForTimeout(1500); // Increased wait for list stability
                await this.page.locator(`tr:nth-child(${i + 2}) td .fAmufx`).nth(3).click();
                const addImageBtn = await this.page.locator('.ant-modal-content button .iVToiv');
                if (await addImageBtn.count() > 0) {
                    console.log('Add More Image button found, proceeding to upload file');
                    const filePath = path.resolve(__dirname, '../test-data/BILLS (1) (1).pdf');
                    await addImageBtn.click();
                    await this.page.setInputFiles('input[type="file"]', filePath);
                    await this.page.locator('.ant-modal-body button:has-text("Upload")').click();
                    await this.page.getByRole('dialog').filter({ hasText: 'Proof of DeliveryVerify Proof' }).getByLabel('Close', { exact: true }).click();
                    // Retry logic for clicking the nth(4) element
                    let nth4Clicked = false;
                    let nth4RetryCount = 0;
                    const maxNth4Retries = 5;

                    while (!nth4Clicked && nth4RetryCount < maxNth4Retries) {
                        try {
                            nth4RetryCount++;
                            await this.page.locator(`tr:nth-child(${i + 2}) td .fAmufx`).nth(4).click();
                            nth4Clicked = true;
                            console.log(`✅ Success: Clicked nth(4) .fAmufx on attempt ${nth4RetryCount}`);
                        } catch (error) {
                            console.log(`⚠️ Attempt ${nth4RetryCount} failed to click nth(4) .fAmufx: ${error.message}`);
                            if (nth4RetryCount >= maxNth4Retries) {
                                throw new Error(`Critical: Failed to click nth(4) .fAmufx after ${maxNth4Retries} attempts`);
                            }
                            await this.page.waitForTimeout(1000); // Wait 1 second before retrying
                        }
                    }
                } else {
                    console.log('Add More Image button not found');
                }
            }
            return true;
        } catch (err) {
            console.error('Error processing delivery items:', err);
            return false;
        }
    }
};

