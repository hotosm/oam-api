var local = {};
try {
  local = require('./local.js');
} catch(e) {}

module.exports = {
  port: process.env.PORT || 3000,
  dbUri: process.env.DBURI || process.env.OAM_TEST ?
    'mongodb://localhost/oam-uploader-test' : 'mongodb://localhost/oam-uploader',
  adminPassword: process.env.ADMIN_PASSWORD || null,
  adminUsername: process.env.ADMIN_USERNAME || null,
  awsKeyId: process.env.AWS_SECRET_KEY_ID || local.awsKeyId,
  awsAccessKey: process.env.AWS_SECRET_ACCESS_KEY || local.awsAccessKey,
  logOptions: local.logOptions || {
    opsInterval: 3000,
    reporters: [{
      reporter: require('good-console'),
      events: {
        request: '*',
        error: '*',
        response: '*',
        info: '*',
        log: '*'
      }
    }]
  }
};
