var xtend = require('xtend');

// Default configuration options used by the app.  Most of these can be
// overriden by environment variables (see below).
var defaults = {
  host: '0.0.0.0', // cosmetic
  port: 4000, // port to listen on
  dbUri: process.env.NODE_ENV === 'test' ? 'mongodb://localhost/oam-uploader-test' : 'mongodb://localhost/oam-uploader', // the mongodb database uri (mongodb://user:pass@host:port/db)
  adminPassword: null, // the administrator username
  adminUsername: null, // the administrator password
  oinBucket: 'oam-uploader', // name of the OpenImageryNetwork bucket to which imagery should be uploaded
  awsRegion: 'us-west-2', // the AWS region of the oinBucket
  thumbnailSize: 300, // (very) approximate thumbnail size, in kilobytes
  maxWorkers: 1, // the maximum number of workers
  sendgridApiKey: null, // sendgrid API key, for sending notification emails
  sendgridFrom: 'info@hotosm.org', // the email address from which to send notification emails
  gdriveKey: null,
  gdalTranslateBin: '/usr/bin/gdal_translate',
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

// Environment variable overrides
var environment = {
  port: process.env.PORT,
  host: process.env.HOST,
  oinBucket: process.env.OIN_BUCKET,
  dbUri: process.env.NODE_ENV === 'test' ? process.env.DBURI_TEST : process.env.DBURI,
  maxWorkers: process.env.MAX_WORKERS,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminUsername: process.env.ADMIN_USERNAME,
  awsKeyId: process.env.AWS_SECRET_KEY_ID,
  awsAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  sendgridFrom: process.env.SENDGRID_FROM,
  gdalTranslateBin: process.env.GDAL_TRANSLATE_BIN,
  gdriveKey: process.env.GDRIVE_KEY
};

var config = xtend(defaults);
for (var k in environment) {
  if (typeof environment[k] !== 'undefined') {
    config[k] = environment[k];
  }
}

// override json.stringify behavior so we don't accidentally log secret keys
config.toJSON = function () {
  return '[ hidden ]';
};
module.exports = config;
