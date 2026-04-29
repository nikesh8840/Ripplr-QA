const { Uploadfile } = require('../pages/Aupload.page');
const config = require('../config/base.config');
const { incrementSrnInPdf, replaceInvoiceNumbersInPdf } = require('./pdfUtils');
const { incrementSalesReturnNoInPdf } = require('./pdfUtilsColumnSrn');
const pmBrandConfig = require('../config/ProductMaster');
const { incrementBillNumbers, syncInvoiceNumbers, recalculateGrossAmount, randomizeLastColumn, refreshDatesWithin15Days } = require('./dataUtils');
const { extractProductsFromSalesOrderCSV, filterFailedProducts, buildProductMasterCSV } = require('./productMasterUtils');
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

// Helper for single file uploads with bill number increment.
// Pass withProductMaster = true to enable auto product master fallback.
// Config is resolved automatically from config/ProductMaster.js using the brand key.
async function singleFileUploadWithIncrement(page, baseURL, fc, brand, csvFileName = 'salesmarico.csv', columnHeader = 'Bill Number', withProductMaster = false) {
    const dataPath = path.resolve(__dirname, `../test-data/${fc}-${brand}`);
    const filePath = path.join(dataPath, csvFileName);
    const uploadfile = new Uploadfile(page);

    // Increment bill numbers & randomize dummy column to prevent duplicate-file rejection
    await incrementBillNumbers(filePath, columnHeader);
    await page.goto(baseURL);
    const result = await uploadfile.UploadSinglefileFcBrand(
        config.credentials.username, config.credentials.password, 'Sales Order', fc, brand
    );

    if (!withProductMaster) return result;

    // Scan eye view for product not found errors
    const failedCodes = await uploadfile.scanForProductNotFoundErrors();
    if (failedCodes.size === 0) return result;

    console.log(`\n[Product Master] ${failedCodes.size} missing product(s) — auto-fixing...`);

    // Resolve config automatically from brand key
    const brandPmCfg = pmBrandConfig[brand];
    if (!brandPmCfg) {
        console.warn(`[Product Master] No config found for brand "${brand}" in config/ProductMaster.js`);
        return result;
    }

    // Extract products from sales order CSV, filter to only failed ones
    // Brand config may override salesOrderCols (e.g. different MRP column name)
    const salesOrderCols  = brandPmCfg.salesOrderCols || config.productMaster.salesOrderCols;
    const allProducts     = extractProductsFromSalesOrderCSV(filePath, salesOrderCols);
    const missingProducts = filterFailedProducts(allProducts, failedCodes);

    if (missingProducts.length === 0) {
        console.warn('[Product Master] No matching products found in CSV for failed codes');
        return result;
    }

    console.log(`[Product Master] Products to add: ${missingProducts.map(p => p.code).join(', ')}`);

    // Build product master CSV (only mapped columns updated, rest from template row)
    const pmPath = buildProductMasterCSV(missingProducts, brandPmCfg);

    // Reset page state before product master upload (eye icon may have navigated away)
    await page.goto(baseURL);
    await uploadfile.uploadProductMasterFcBrand(
        config.credentials.username, config.credentials.password, fc, brand, pmPath
    );
    console.log('[Product Master] Uploaded and processed');

    // Re-increment bill numbers & re-upload sales order
    randomizeLastColumn(filePath);
    await page.goto(baseURL);
    return await uploadfile.UploadSinglefileFcBrand(
        config.credentials.username, config.credentials.password, 'Sales Order', fc, brand
    );
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
    const salesOrderPath = path.resolve(__dirname, '../test-data/Orders/mrco/mrco.csv');
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

// Helper for Return request pdf uploads (Damage / Expiry PDFs).
// Increments the SRN No in each PDF before uploading to avoid duplicate rejection.
async function returnRequestPdfUpload(page, baseURL, FC, Brand, filePaths) {
    for (const fp of filePaths) {
        await incrementSrnInPdf(fp);
    }
    const uploadfile = new Uploadfile(page);
    await page.goto(baseURL);
    const result = await uploadfile.UploadReturnRequestPdf(
        config.credentials.username, config.credentials.password, FC, Brand, filePaths
    );
    return result;
}

// Helper for Return request pdf uploads where the PDF uses a "Sales Return No"
// column header layout (Marico). Increments via the column-aware helper instead
// of the URN/Salvage-Ref-No path used by returnRequestPdfUpload.
async function returnRequestPdfUploadColumnSrn(page, baseURL, FC, Brand, filePaths) {
    for (const fp of filePaths) {
        await incrementSalesReturnNoInPdf(fp);
    }
    const uploadfile = new Uploadfile(page);
    await page.goto(baseURL);
    const result = await uploadfile.UploadReturnRequestPdf(
        config.credentials.username, config.credentials.password, FC, Brand, filePaths
    );
    return result;
}

// Helper for Invoice PDF Re-Upload. Patches test-data/InvoicePdfUpload/{brand}.pdf in
// place with invoice numbers sourced from test-data/InvoicePdfUpload/{brand}.js (which
// reads them from test-data/Orders/{brand}/m1.csv), then uploads the PDF.
async function invoicePdfReUpload(page, baseURL, FC, brandFolder) {
    const pdfPath = await replaceInvoiceNumbersInPdf(brandFolder);
    const brandCode = (SALES_ORDER_BRAND_CONFIG[brandFolder] && SALES_ORDER_BRAND_CONFIG[brandFolder].brand) || brandFolder;
    const uploadfile = new Uploadfile(page);
    await page.goto(baseURL);
    const result = await uploadfile.UploadInvoicePdfReUpload(
        config.credentials.username, config.credentials.password, FC, brandCode, pdfPath
    );
    return result;
}

// Helper for GRN (Purchase Order) uploads from test-data/GRN/{brand}.csv
async function grnUpload(page, baseURL, fc, brand) {
    const filePath = path.resolve(__dirname, `../test-data/GRN/${brand}.csv`);
    refreshDatesWithin15Days(filePath);

    // Brand-specific bill/GRN column header
    const billColumnMap = {
        'gdj':  'Bill No',
        'nesl': 'Invoice Number',
        'mrco': 'GRNNumber',
    };
    const columnHeader = billColumnMap[brand] || 'GRN Number';
    await incrementBillNumbers(filePath, columnHeader);
    const uploadfile = new Uploadfile(page);
    await page.goto(baseURL);
    const result = await uploadfile.UploadGRN(
        config.credentials.username, config.credentials.password, fc, brand, filePath
    );
    return result;
}

// Brand-specific config for Sales Order uploads from test-data/Orders/{brand}/
// Each brand lists its CSV files (in upload order) and the bill column header per file.
const SALES_ORDER_BRAND_CONFIG = {
    'brit': {
        files:   ['m1.csv', 'h1.csv', 'sr.csv'],
        columns: ['Invoice No', 'Invoice No', 'Invoice No'],
        brand:   'britannia',
    },
    'britis': {
        files:   ['m1.csv', 'h1.csv', 'sr.csv'],
        columns: ['Invoice No', 'Invoice No', 'Invoice No'],
    },
    'britrw': {
        files:   ['m1.csv', 'h1.csv', 'sr.csv'],
        columns: ['Invoice No', 'Invoice No', 'Invoice No'],
    },
    'gdj': {
        files:   ['u.csv', 'c.csv'],
        columns: ['Bill No', 'CN_Adjusted_Bill_No'],
    },
    'gdjgt': {
        files:   ['u.csv', 'c.csv'],
        columns: ['Bill No', 'CN_Adjusted_Bill_No'],
    },
    'gdjmt': {
        files:   ['u.csv', 'c.csv'],
        columns: ['Bill No', 'CN_Adjusted_Bill_No'],
    },
    'hul': {
        files:   ['bl.csv', 'sr.csv', 's.csv'],
        columns: ['Bill Number', 'BillRefNo', 'BILL_NUMBER'],
    },
    'huls': {
        files:   ['bl.csv', 'sr.csv', 's.csv'],
        columns: ['Bill Number', 'BillRefNo', 'BILL_NUMBER'],
    },
    'mrco': {
        files:   ['mrco.csv'],
        columns: ['Bill Number'],
    },
    'nesl': {
        files:   ['ms3.csv', 'bl3.csv', 'ss3.csv'],
        columns: ['Bill Number / Sales Return Number', 'Sales Invoice Number', 'Bill Number'],
        brand:   'nestle',
    },
    'snpr': {
        files:   ['sunpure.csv'],
        columns: ['Sales Invoice No'],
    },
};

// Helper for Sales Order uploads from test-data/Orders/{brand}/
// Auto-picks single/two/three file upload method based on file count.
async function salesOrderUpload(page, baseURL, fc, brandFolder) {
    const brandCfg = SALES_ORDER_BRAND_CONFIG[brandFolder];
    if (!brandCfg) {
        throw new Error(`No sales order config for brand "${brandFolder}". Add it to SALES_ORDER_BRAND_CONFIG in uploadTestHelper.js`);
    }

    const dataPath = path.resolve(__dirname, `../test-data/Orders/${brandFolder}`);
    const { files, columns } = brandCfg;
    const brand = brandCfg.brand || brandFolder;

    // Refresh dates & increment bill numbers for each file
    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(dataPath, files[i]);
        refreshDatesWithin15Days(filePath);
        await incrementBillNumbers(filePath, columns[i]);
    }

    const uploadfile = new Uploadfile(page);
    await page.goto(baseURL);

    // Pick upload method based on file count
    let result;
    if (files.length === 1) {
        result = await uploadfile.UploadSinglefileFcBrand(
            config.credentials.username, config.credentials.password, 'Sales Order', fc, brand
        );
    } else if (files.length === 2) {
        result = await uploadfile.UploadSalesOrdertwo(
            config.credentials.username, config.credentials.password, 'Sales Order', fc, brand
        );
    } else {
        result = await uploadfile.UploadSalesOrder(
            config.credentials.username, config.credentials.password, 'Sales Order', fc, brand
        );
    }
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
    salesReturnBgrdMrcoWithIncrement,
    returnRequestPdfUpload,
    returnRequestPdfUploadColumnSrn,
    invoicePdfReUpload,
    grnUpload,
    salesOrderUpload,
    SALES_ORDER_BRAND_CONFIG
};
