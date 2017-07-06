'use strict';

var expect = require('chai').expect;
var request = require('request');
var uuidV4 = require('uuid/v4');

require('./helper');
var commonHelper = require('../helper');

var config = require('../../config');

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
describe('Uploading imagery', function () {
  var loginCookie;

  beforeEach(function (done) {
    commonHelper.createUser({}, function (user) {
      commonHelper.generateSecureCookieForUser(user, function (cookie) {
        loginCookie = cookie;
        done();
      });
    });
  });

  it('should upload, convert and process an image', function (done) {
    // Needs time to process the image
    this.timeout(3 * 60 * 1000);

    // So we can conclusively find the image later
    var title = 'test-' + uuidV4();

    var upload = require('../fixtures/NE1_50M_SR.input.json');
    upload.scenes[0].title = title;

    var postOptions = {
      url: config.apiEndpoint + '/uploads',
      json: upload,
      headers: {
        'Cookie': loginCookie
      }
    };

    request.post(postOptions, function (_err, httpResponse, body) {
      expect(httpResponse.statusCode).to.eq(200);
      var uploadId = body.results.upload;
      commonHelper.waitForProcessing(uploadId, title, function (image) {
        expect(image.title).to.eq(title);
        expect(image.properties.license).to.eq('CC-BY');
        expect(image.projection).to.include('GEOGCS');
        expect(image.gsd).to.eq(3174.010571326463);
        expect(image.bbox).to.deep.eq([129, 29, 146, 54]);

        // TODO: Fetch these and check they're good too
        expect(image.properties.tms).to.include('/{z}/{x}/{y}.png');
        expect(image.meta_uri).to.include('_meta.json');

        done();
      });
    });
  });
});
