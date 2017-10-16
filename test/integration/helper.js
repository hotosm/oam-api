// These tests require a test docker container to be running:
//
// `docker-compose -f test/docker-compose.yml up -d`
//
// See `.travis.yml` for the (hopefully) latest working version.
//
// Note that these are integration tests running against a real
// s3 bucket. Try to use a unique OIN_BUCKET_PREFIX in the
// running API as often as you can to ensure your working with
// an empty bucket/folder. For CI tests Travis prepends the build
// number to OIN_BUCKET_PREFIX.

process.env.INTEGRATION_TESTS = 'true';

var uuidV4 = require('uuid/v4');
var request = require('request');
var expect = require('chai').expect;

var config = require('../../config');
var commonHelper = require('../helper');
var Conn = require('../../services/db');

var dbWrapper = new Conn();

before(function (done) {
  dbWrapper.start(function () {
    done();
  });
});

beforeEach(function (done) {
  dbWrapper.deleteDb(function () {
    done();
  });
});

module.exports = {
  login: function (callback) {
    commonHelper.createUser({}, function (user) {
      commonHelper.generateSecureCookieForUser(user, function (cookie) {
        callback(cookie);
      });
    });
  },

  uploadImage: function (cookie, callback) {
    // So we can conclusively find the image later
    var title = 'test-' + uuidV4();

    var upload = require('../fixtures/NE1_50M_SR.input.json');
    upload.scenes[0].title = title;

    var postOptions = {
      url: config.apiEndpoint + '/uploads',
      json: upload,
      headers: {
        'Cookie': cookie
      }
    };

    request.post(postOptions, function (_err, httpResponse, body) {
      expect(httpResponse.statusCode).to.eq(200);
      var uploadId = body.results.upload;
      callback(uploadId, title);
    });
  },

  loginAndUpload: function (callback) {
    this.login((cookie) => {
      this.uploadImage(cookie, (uploadId, title) => {
        commonHelper.waitForProcessing(uploadId, title, function (image) {
          callback(title, image, cookie);
        });
      });
    });
  }
};
