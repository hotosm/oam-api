var xtend = require('xtend');

var defaults = {
  host: '0.0.0.0',
  port: 3000,
  oinBucket: 'oam-uploader',
  dbUri: process.env.NODE_ENV === 'test' ?
    'mongodb://localhost/oam-uploader-test' : 'mongodb://localhost/oam-uploader',
  adminPassword: null,
  adminUsername: null,
  awsRegion: 'us-west-2',
  sendgridApiKey: null,
  sendgridFrom: 'info@hotosm.org',
  thumbnailSize: 300, // (very) approximate thumbnail size, in kilobytes
  maxWorkers: 1,
  emailNotification: {
    subject: '[ OAM Uploader ] Imagery upload submitted',
    text: 'Your upload has been successfully submitted and is now being ' +
      'processed. You can check on the status of the upload at ' +
      'http://upload.openaerialmap.org/#/status/{UPLOAD_ID}.'
  },
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
  host: process.env.HOST,
  oinBucket: process.env.OIN_BUCKET,
  dbUri: process.env.NODE_ENV === 'test' ?
    process.env.DBURI_TEST : process.env.DBURI,
  maxWorkers: process.env.MAX_WORKERS,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminUsername: process.env.ADMIN_USERNAME,
  awsKeyId: process.env.AWS_SECRET_KEY_ID,
  awsAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  sendgridFrom: process.env.SENDGRID_FROM
};

var config = xtend(defaults);
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
