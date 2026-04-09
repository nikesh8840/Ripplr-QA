const { Uploadfile } = require('../pages/Aupload.page');
const config = require('../config/base.config');
const { incrementBillNumbers, syncInvoiceNumbers, recalculateGrossAmount } = require('./dataUtils');
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

// Helper for APX-folder single file uploads with bill number increment
async function singleFileUploadAPXWithIncrement(page, baseURL, documentType, fileKey, uploadMethod, columnHeader) {
    const filePath = path.resolve(__dirname, `../test-data/APX/${fileKey}.csv`);
    await incrementBillNumbers(filePath, columnHeader);
    const uploadfile = new Uploadfile(page);
    await page.goto(baseURL);
    const result = await uploadfile[uploadMethod](config.credentials.username, config.credentials.password, documentType, fileKey);
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
async function twoFileUploadWithIncrement(page, baseURL, fc, brand, csvFileNames = ['salesmarico.csv', 'credit.csv'], columnHeaders = ['Bill Number', 'CN_Adjusted_Bill_No']) {
    const dataPath = path.resolve(__dirname, `../test-data/${fc}-${brand}`);
    
    for (let i = 0; i < csvFileNames.length; i++) {
        const filePath = path.join(dataPath, csvFileNames[i]);
        await incrementBillNumbers(filePath, columnHeaders[i]);
    }
    
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

// Helper for BGRD:MRCO Sales Return upload with SalesReturnNo increment
async function salesReturnBgrdMrcoWithIncrement(page, baseURL) {
    const salesOrderPath = path.resolve(__dirname, '../test-data/bgrd-mrco/salesmarico.csv');
    const filePath = path.resolve(
        __dirname,
        '../test-data/bgrd-mrco-reutrn/MARCO_BrandReturn.csv'
    );

    // Step 1: Recalculate Gross Amount based on tax percentages (CGST/SGST or IGST)
    await recalculateGrossAmount(filePath);

    // Step 2: Sync Reg InvoiceNumber (first 3 rows) with Bill Number from sales order
    await syncInvoiceNumbers(salesOrderPath, filePath, 'Bill Number', 'Reg InvoiceNumber', 3);

    // Step 3: Increment SalesReturnNo to avoid duplicate-file rejection
    await incrementBillNumbers(filePath, 'SalesReturnNo');

    const uploadfile = new Uploadfile(page);
    await page.goto(config.baseURLpreprod);
    const result = await uploadfile.UploadBgrdMrcoSalesReturn(
        config.credentials.username,
        config.credentials.password
    );
    return result;
}

module.exports = {
    simpleUpload,
    singleFileUpload,
    fcBrandUpload,
    singleFileUploadAPXWithIncrement,
    singleFileUploadWithIncrement,
    twoFileUploadWithIncrement,
    threeFileUploadWithIncrement,
    salesReturnBgrdMrcoWithIncrement
};
