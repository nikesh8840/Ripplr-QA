
// config/base.config.js
const path = require('path');

module.exports = {
  baseURL: 'https://cdms-staging.ripplr.in/', // Replace with your actual base URL
  baseURL43: 'http://43.205.73.33/login', // Replace with your actual base URL
  baseURLpreprod: 'https://cdms-preprod.ripplr.in/login', // Replace with your actual base URL
  baseURLil: 'https://cdms-il-staging.ripplr.in/login', // Replace with your actual base URL

  credentials: {
    username: 'admin@ripplr.in', // Replace with valid test username
    password: 'M@ver!ck'  // Replace with valid test password
  },

  productMaster: {
    uploadType: 'Product Master',
    distributorCode: '15842',
    distributorName: 'INTELLIGENT RETAIL PRIVATE LIMITED',
    godown: 'Main Godown',
    // Brand-specific info keyed by brand code (lowercase)
    brands: {
      mrco: { code: 'BRD0050', name: 'MRCO' },
    },
    // Column names in the sales order CSV to pull product info from
    salesOrderCols: {
      productCode: 'Product Code',
      productName: 'Product Name',
      batch:       'Batch Code',
      mrp:         'New MRP',
    },
    // Exact header row of the product master CSV (must match mrco.csv)
    outputHeaders: [
      'Distributor Code', 'Distributor Name', 'Distributor Branch Code',
      'Distributor Branch Name', 'Brand Code ', 'Brannd Name', 'Godown',
      'Product Code', 'Product Description', 'Batch', 'Batch Expiry Date',
      'MRP', 'ManfDt', 'UPC', 'Freshness', 'Selling Rate',
      'Saleable Stock CS', 'Saleable Stock PC', 'Saleable Stock',
      'Unsaleable Stock CS', 'Unsaleable Stock PC', 'Unsaleable Stock',
      'Offer Stock CS', 'Offer Stock PC', 'Offer Stock',
      'Total Stock CS', 'Total Stock PC', 'Total Stock',
      'Saleable Stock Value', 'Unsaleable Stock Value', 'Tot Stock Value', 'dhbfh',
    ],
  },

  db: {
    ssh: {
      host: '43.205.73.33',
      port: 22,
      username: 'nikesh-il',
      privateKeyPath: path.resolve(process.env.HOME || process.env.USERPROFILE, '.ssh', 'id_ed25519'),
      localPort: 13306  // local port forwarded through the tunnel
    },
    mysql: {
      host: 'temp-pre-prod-rds-1.cmxwt7d6voch.ap-south-1.rds.amazonaws.com',
      port: 3306,
      user: 'nikesh-il',
      password: 'bjdfhuiehlahjkfdj',
      database: 'finops'
    }
  }
};
