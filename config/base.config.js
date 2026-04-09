
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
