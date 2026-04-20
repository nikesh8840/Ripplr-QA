const fs = require('fs');

/**
 * Reads the sales order CSV and returns unique products.
 * @param {string} csvPath - absolute path to the sales order CSV
 * @param {object} cols    - { productCode, productName, batch, mrp } — header names in the SO CSV
 * @returns {{ code, name, batch, mrp }[]}
 */
function extractProductsFromSalesOrderCSV(csvPath, cols) {
    const content = fs.readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '');
    const lines   = content.split('\n').filter(l => l.trim() !== '');
    const header  = lines[0].split(',');

    const idx = (name) => header.findIndex(h => h.trim() === name.trim());
    const codeIdx  = idx(cols.productCode);
    const nameIdx  = idx(cols.productName);
    const batchIdx = cols.batch ? idx(cols.batch) : -1;
    const mrpIdx   = cols.mrp ? idx(cols.mrp) : -1;

    if (codeIdx === -1 || nameIdx === -1) {
        console.warn('extractProductsFromSalesOrderCSV: required columns not found in SO CSV');
        console.warn(`  productCode="${cols.productCode}" → idx ${codeIdx}`);
        console.warn(`  productName="${cols.productName}" → idx ${nameIdx}`);
        return [];
    }
    if (mrpIdx === -1) {
        console.warn(`extractProductsFromSalesOrderCSV: mrp column "${cols.mrp}" not found — MRP will default to "0"`);
    }

    const seen     = new Set();
    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const row  = lines[i].split(',');
        const code = row[codeIdx]?.trim();
        if (!code || seen.has(code)) continue;
        seen.add(code);
        products.push({
            code,
            name:  row[nameIdx]?.trim()                       || '',
            batch: batchIdx !== -1 ? (row[batchIdx]?.trim() || '') : '',
            mrp:   row[mrpIdx]?.trim()                        || '0',
        });
    }

    console.log(`Extracted ${products.length} unique products from sales order CSV`);
    return products;
}

/**
 * Filters a product list to only those in failedCodes.
 * If failedCodes is empty, returns ALL products (proactive upload).
 *
 * Matching is flexible: CDMS may normalize product codes (e.g. strip non-numeric chars),
 * so we match if the CSV code contains the CDMS code or vice-versa.
 */
function filterFailedProducts(allProducts, failedCodes) {
    if (!failedCodes || failedCodes.size === 0) return allProducts;
    return allProducts.filter(p => {
        for (const fc of failedCodes) {
            if (p.code === fc || p.code.includes(fc) || fc.includes(p.code)) return true;
        }
        return false;
    });
}

/**
 * Builds a product master CSV using the template file as the base.
 *
 * Strategy:
 *  - Header row is taken exactly from the template (no changes).
 *  - The first data row of the template is used as the "base row"
 *    (carries distributor code, branch, godown, etc.).
 *  - For each product, a copy of the base row is made and ONLY the
 *    columns defined in brandCfg.columnMap are updated.
 *  - Output is written to brandCfg.outputPath.
 *
 * @param {object[]} products   - [{ code, name, batch, mrp }]
 * @param {object}   brandCfg  - entry from config/ProductMaster.js
 * @returns {string}            - path to the written CSV
 */
function buildProductMasterCSV(products, brandCfg) {
    const { templatePath, outputPath, columnMap } = brandCfg;

    if (!fs.existsSync(templatePath)) {
        throw new Error(`Product master template not found: ${templatePath}`);
    }

    const content  = fs.readFileSync(templatePath, 'utf-8').replace(/^\uFEFF/, '');
    const lines    = content.split('\n').filter(l => l.trim() !== '');
    const header   = lines[0].split(',');

    // Find index of each mapped column in the template header
    const colIdx = (name) => {
        const i = header.findIndex(h => h.trim() === name.trim());
        if (i === -1) console.warn(`buildProductMasterCSV: column "${name}" not found in template header`);
        return i;
    };

    const codeIdx  = colIdx(columnMap.productCode);
    const nameIdx  = colIdx(columnMap.productDescription);
    const mrpIdx   = colIdx(columnMap.mrp);
    const batchIdx = columnMap.batch ? colIdx(columnMap.batch) : -1;

    // Use first data row as the base (copies distributor info, godown, zeros, etc.)
    const baseRow = lines.length > 1 ? lines[1].split(',') : new Array(header.length).fill('0');

    const outputRows = [lines[0]]; // keep original header exactly

    for (const product of products) {
        const row = [...baseRow]; // clone base row

        if (codeIdx  !== -1) row[codeIdx]  = product.code;
        if (nameIdx  !== -1) row[nameIdx]  = product.name;
        if (mrpIdx   !== -1) row[mrpIdx]   = product.mrp;
        if (batchIdx !== -1) row[batchIdx] = product.batch || '';

        outputRows.push(row.join(','));
    }

    fs.writeFileSync(outputPath, outputRows.join('\n'), 'utf-8');
    console.log(`Product master CSV written: ${outputPath} (${products.length} product rows)`);
    return outputPath;
}

module.exports = { extractProductsFromSalesOrderCSV, filterFailedProducts, buildProductMasterCSV };
