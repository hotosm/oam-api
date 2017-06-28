// Canonical configuration settings.
// All configuration and 'magic numbers' should be defined here.
// Strive to set all ENV values through `.env`.

// Amendments for test env
if (process.env.NODE_ENV === 'test') {
  process.env.DB_URI = 'mongodb://localhost:27017/oam-api-test';
  process.env.OAM_DEBUG = process.env.OAM_DEBUG || 'false';
  process.env.NEW_RELIC_ENABLED = false;
  process.env.PORT = 47357;
  process.env.API_ENDPOINT = 'http://localhost:' + process.env.PORT;
}

if (process.env.NODE_ENV === 'production') {
  // Safety measure to prevent imagery being placed in a namespacing
  // directory.
  process.env.OIN_BUCKET_PREFIX = null;
}

const config = {
  env: process.env.NODE_ENV,
  debug: process.env.OAM_DEBUG,

  // Server setup
  host: process.env.HOST,
  port: process.env.PORT,
  apiEndpoint: process.env.API_ENDPOINT,
  browserURL: process.env.BROWSER_URL,

  // DB connection
  dbUri: process.env.DB_URI,

  // OIN bucket in which imagery ultimately lives
  oinBucket: process.env.OIN_BUCKET,
  // Place imagery in a folder. Useful for running multiple OAM instances
  // or testing.
  oinBucketPrefix: process.env.OIN_BUCKET_PREFIX,
  // OIN bucket for temporary storage of direct uploads
  uploadBucket: process.env.UPLOAD_BUCKET,
  // How often to poll OIN buckets for new imagery
  cronTime: process.env.CRON_TIME,
  // Location of master record of OIN buckets to poll
  oinRegisterUrl: process.env.OIN_REGISTER_URL,
  // Approximate thumbnail size, in kilobytes
  thumbnailSize: 300,

  facebookAppId: process.env.FACEBOOK_APP_ID,
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET,

  // Base URL for accessing the slippy map TMS endpoint for imagery. This is
  // the entrypoint for using the Dynamic Tiler to serve imagery.
  tilerBaseUrl: process.env.TILER_BASE_URL,

  // Maximum number of workers.
  maxWorkers: process.env.MAX_WORKERS,

  // AWS credendtials
  awsKey: process.env.AWS_ACCESS_KEY_ID,
  awsSecret: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION,

  // Google drive is an available method for uploading imagery
  gdriveKey: process.env.GDRIVE_KEY,

  // Sendgrid sends emails
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  sendgridFrom: process.env.SENDGRID_FROM,
  emailNotification: {
    subject: '[ OAM Uploader ] Imagery upload submitted',
    text: 'Your upload has been successfully submitted and is now being ' +
      'processed. You can check on the status of the upload at ' +
      'http://upload.openaerialmap.org/#/status/{UPLOAD_ID}.'
  },

  // For encrypting/decrypting cookie data
  cookiePassword: process.env.COOKIE_PASSWORD,

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

  // TODO: Deprecate the following once user accounts have been implemented.
  // Credentials for Uploader Admin
  adminPassword: process.env.ADMIN_PASSWORD,
  adminUsername: process.env.ADMIN_USERNAME,
  // Token to access POST requests to /tms and /meta
  tokenForPostRequests: process.env.SECRET_TOKEN
};

// Override json.stringify behavior so we don't accidentally log secret keys
config.toJSON = function () {
  return '[ hidden ]';
};
module.exports = config;
