/**
 * Product Master column mapping config — one entry per brand.
 *
 * columnMap defines which column headers in the product master CSV
 * correspond to Product Code, Product Description, MRP, and Batch.
 * Only these columns will be updated; all other columns are copied
 * from the first data row of the template file.
 *
 * templatePath — existing CSV used as the row template (header + base values)
 * outputPath   — where the auto-generated file is written before upload
 */

const path = require('path');
const dataDir = path.resolve(__dirname, '../test-data/Product Master');

module.exports = {
    mrco: {
        templatePath: path.join(dataDir, 'mrco.csv'),
        outputPath:   path.join(dataDir, 'mrco-auto.csv'),
        columnMap: {
            productCode:        'Product Code',
            productDescription: 'Product Description',
            mrp:                'MRP',
            batch:              'Batch',
        },
    },

    snpr: {
        templatePath: path.join(dataDir, 'snpr.csv'),
        outputPath:   path.join(dataDir, 'snpr-auto.csv'),
        columnMap: {
            productCode:        'Product Code',
            productDescription: 'Product Name',
            mrp:                'MRP',
            batch:              'Batch',
        },
        // snpr sales order uses 'MRP' (not 'New MRP' used by other brands)
        salesOrderCols: {
            productCode: 'Product Code',
            productName: 'Product Name',
            batch:       'Batch Code',
            mrp:         'MRP',
        },
    },

    // ── Add other brands below when needed ──────────────────────────────────
    // apx: {
    //     templatePath: path.join(dataDir, 'apx.csv'),
    //     outputPath:   path.join(dataDir, 'apx-auto.csv'),
    //     columnMap: {
    //         productCode:        'Item Code',
    //         productDescription: 'Item Name',
    //         mrp:                'List Price',
    //         batch:              'Batch No',
    //     },
    // },
};
