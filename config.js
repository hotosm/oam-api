var local = {};
try {
  local = require('./local.js');
} catch(e) {}

module.exports = {
  port: process.env.PORT || 3000,
  dbUri: process.env.DBURI || 'mongodb://localhost/oam-uploader',
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
