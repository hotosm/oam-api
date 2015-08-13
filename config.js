var xtend = require('xtend');

var local = {};
try {
  local = require('./local.js');
} catch(e) {}

var defaults = {
  port: 3000,
  oinBucket: 'oam-uploader',
  dbUri: process.env.OAM_TEST ?
    'mongodb://localhost/oam-uploader-test' : 'mongodb://localhost/oam-uploader',
  adminPassword: null,
  adminUsername: null,
  awsRegion: 'us-west-2',
  thumbnailSize: 300, // thumbnail size, in kilobytes
  logOptions: {
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

var environment = {
  port: process.env.PORT,
  oinBucket: process.env.OIN_BUCKET,
  dbUri: process.env.DBURI,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminUsername: process.env.ADMIN_USERNAME,
  awsKeyId: process.env.AWS_SECRET_KEY_ID,
  awsAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION
};

var config = xtend(defaults, local);
for (var k in environment) {
  if (typeof environment[k] !== 'undefined') {
    config[k] = environment[k];
  }
}

// override json.stringify behavior so we don't accidentally log keys
config.toJSON = function () {
  return '[ hidden ]';
};
module.exports = config;
