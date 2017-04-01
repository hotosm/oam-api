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
  uploadBucket: 'oam-uploader-temp', // name of the bucket for temporary storage for direct uploads
  thumbnailSize: 300, // (very) approximate thumbnail size, in kilobytes
  maxWorkers: 1, // the maximum number of workers
  sendgridApiKey: null, // sendgrid API key, for sending notification emails
  sendgridFrom: 'info@hotosm.org', // the email address from which to send notification emails
  gdriveKey: null,
  emailNotification: {
    subject: '[ OAM Uploader ] Imagery upload submitted',
    text: 'Your upload has been successfully submitted and is now being ' +
      'processed. You can check on the status of the upload at ' +
      'http://upload.openaerialmap.org/#/status/{UPLOAD_ID}.'
  },
  cookiePassword: '3b296ce42ec560abeabaef',
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
  },
  tilerBaseUrl: 'http://tiles.openaerialmap.org'
};

// Environment variable overrides
var environment = {
  port: process.env.PORT,
  host: process.env.HOST,
  oinBucket: process.env.OIN_BUCKET,
  uploadBucket: process.env.UPLOAD_BUCKET,
  dbUri: process.env.NODE_ENV === 'test' ? process.env.DBURI_TEST : process.env.DBURI,
  maxWorkers: process.env.MAX_WORKERS,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminUsername: process.env.ADMIN_USERNAME,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  sendgridFrom: process.env.SENDGRID_FROM,
  gdriveKey: process.env.GDRIVE_KEY,
  tilerBaseUrl: process.env.TILER_BASE_URL,
  cookiePassword: process.env.COOKIE_PASSWORD
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
