const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const config = require('../../config/base.config');
const { returnRequestPdfUpload, returnRequestPdfUploadColumnSrn } = require('../../utils/uploadTestHelper');

// Brands whose Return Request PDF uses a "Sales Return No" column-header layout
// instead of an inline SRN/URN/Salvage-Ref-No label. Brand-level, FC-agnostic.
const COLUMN_SRN_BRANDS = new Set(['mrco']);

// Usage: npx playwright test tests/adaptorupload/return-request-pdf.spec.js --headed -g BTML-DBR
// The -g flag filters by FCcode-BrandCode (e.g. BTML-DBR, MDPT-BRIT, MDPT-NESL, MSPT-DBR, BGRD-MRCO).
// Brands listed in COLUMN_SRN_BRANDS use the column-header SRN increment path
// (utils/pdfUtilsColumnSrn.js); all other brands use the default inline-SRN path.

const DE_PDFS_DIR = path.resolve(__dirname, '../../test-data/DePdfs');
const fcBrandDirs = fs.readdirSync(DE_PDFS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.includes('-'))
    .map(d => d.name);

for (const fcBrand of fcBrandDirs) {
    const [fc, brand] = fcBrand.split('-');
    const folder = path.join(DE_PDFS_DIR, fcBrand);
    const pdfFile = fs.readdirSync(folder).find(f => f.toLowerCase().endsWith('.pdf'));
    if (!pdfFile) continue;

    test(`Upload ${fc.toUpperCase()}-${brand.toUpperCase()} Return request pdf - Down`, async ({ page }) => {
        test.setTimeout(300_000);
        const expiryPdf = path.join(folder, pdfFile);
        const uploader = COLUMN_SRN_BRANDS.has(brand) ? returnRequestPdfUploadColumnSrn : returnRequestPdfUpload;
        const result = await uploader(
            page, config.baseURLpreprod, fc, brand, [expiryPdf]
        );
        expect(result).toBeTruthy();
    });
}
