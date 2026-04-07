const { Uploadfile } = require('../pages/Aupload.page');
const config = require('../config/base.config');
const { incrementBillNumbers } = require('./dataUtils');
const path = require('path');

// Helper for simple uploads without bill increment
async function simpleUpload(page, baseURL, documentType, fileKey) {
    const uploadfile = new Uploadfile(page);
    await page.goto(baseURL);
    const result = await uploadfile.Upload(config.credentials.username, config.credentials.password, documentType, fileKey);
    return result;
}

// Helper for single file uploads
async function singleFileUpload(page, baseURL, documentType, fileKey, uploadMethod = 'UploadSinglefile') {
    const uploadfile = new Uploadfile(page);
    await page.goto(baseURL);
    const result = await uploadfile[uploadMethod](config.credentials.username, config.credentials.password, documentType, fileKey);
    return result;
}

// Helper for FC-Brand uploads (Sales Order / Sales Return)
async function fcBrandUpload(page, baseURL, documentType, fc, brand, uploadMethod = 'UploadSalesOrder') {
    const uploadfile = new Uploadfile(page);
    await page.goto(baseURL);
    const result = await uploadfile[uploadMethod](config.credentials.username, config.credentials.password, documentType, fc, brand);
    return result;
}

// Helper for single file uploads with bill number increment
async function singleFileUploadWithIncrement(page, baseURL, fc, brand, csvFileName = 'salesmarico.csv', columnHeader = 'Bill Number') {
    const dataPath = path.resolve(__dirname, `../test-data/${fc}-${brand}`);
    const filePath = path.join(dataPath, csvFileName);
    
    // Increment bill numbers for the file
    await incrementBillNumbers(filePath, columnHeader);
    
    // Perform upload
    const uploadfile = new Uploadfile(page);
    await page.goto(baseURL);
    const result = await uploadfile.UploadSinglefileFcBrand(config.credentials.username, config.credentials.password, 'Sales Order', fc, brand);
    return result;
}

// Helper for 2-file uploads with bill number increment (e.g., sales order + adjustment)
async function twoFileUploadWithIncrement(page, baseURL, fc, brand, csvFileNames = ['salesmarico.csv', 'credit.csv']) {
    const dataPath = path.resolve(__dirname, `../test-data/${fc}-${brand}`);
    
    // Increment bill numbers for both files
    const file1Path = path.join(dataPath, csvFileNames[0]);
    const file2Path = path.join(dataPath, csvFileNames[1]);
    
    await incrementBillNumbers(file1Path, 'Bill Number');
    await incrementBillNumbers(file2Path, 'Bill Number');
    
    // Perform upload
    const uploadfile = new Uploadfile(page);
    await page.goto(baseURL);
    const result = await uploadfile.UploadSalesOrdertwo(config.credentials.username, config.credentials.password, 'Sales Order', fc, brand);
    return result;
}

// Helper for 3-file uploads with bill number increment (e.g., bl, sr, s)
async function threeFileUploadWithIncrement(page, baseURL, fc, brand, csvFileNames = ['bl.csv', 'sr.csv', 's.csv'], columnHeaders = ['Bill Number', 'BillRefNo', 'BILL_NUMBER']) {
    const dataPath = path.resolve(__dirname, `../test-data/${fc}-${brand}`);
    
    // Increment bill numbers for all files
    for (let i = 0; i < csvFileNames.length; i++) {
        const filePath = path.join(dataPath, csvFileNames[i]);
        await incrementBillNumbers(filePath, columnHeaders[i]);
    }
    
    // Perform upload
    const uploadfile = new Uploadfile(page);
    await page.goto(baseURL);
    const result = await uploadfile.UploadSalesOrder(config.credentials.username, config.credentials.password, 'Sales Order', fc, brand);
    return result;
}

module.exports = {
    simpleUpload,
    singleFileUpload,
    fcBrandUpload,
    singleFileUploadWithIncrement,
    twoFileUploadWithIncrement,
    threeFileUploadWithIncrement
};
