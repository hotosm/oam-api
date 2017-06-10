'use strict';

var expect = require('chai').expect;
require('../helper');
var request = require('request');
var uuidV4 = require('uuid/v4');
var db = require('mongoose').connection;

var apiBase = 'http://localhost:4000';
var auth = { 'Authorization': 'Bearer letmein' };

// Note that these are integration tests running against a real
// s3 bucket. Try to use a unique OIN_BUCKET_PREFIX in the
// running API as often as you can to ensure your working with
// an empty bucket/folder.
describe('Uploading imagery', function () {
  function waitForProcessing (id, title, processedCb) {
    waitForConversion(id, function () {
      waitForIndexing(title, processedCb);
    });
  }

  // The dynamic tiler fetches the images, processes, transcodes it,
  // creates metadata for it, and so on.
  function waitForConversion (id, callback) {
    var getOptions = {
      url: apiBase + '/uploads/' + id,
      headers: auth,
      json: true
    };

    request.get(getOptions, function (_err, httpResponse, body) {
      var status = body.results.scenes[0].images[0].status;
      if (status === 'finished') {
        callback();
      } else {
        setTimeout(waitForConversion, 100, id, callback);
      }
    });
  }

  // This is come from the periodic cron to check the bucket for
  // new imagery. Once a new image's *meta.json is found it is
  // parse and added to the DB.
  function waitForIndexing (title, processedCb) {
    var getOptions = {
      url: apiBase + '/meta?title=' + title,
      headers: auth,
      json: true
    };

    request.get(getOptions, function (_err, httpResponse, body) {
      if (body.results.length > 0) {
        processedCb(body.results[0]);
      } else {
        setTimeout(waitForIndexing, 100, title, processedCb);
      }
    });
  }

  beforeEach(function (done) {
    db.collection('tokens').insert({
      token: 'letmein',
      status: 'active',
      expiration: new Date(Date.now() + 1000000)
    }, done);
  });

  it('should upload, convert and process an image', function (done) {
    // Needs time to process the image
    this.timeout(3 * 60 * 1000);

    // So we can conclusively find the image later
    var title = 'test-' + uuidV4();

    var upload = require('../uploader/fixture/NE1_50M_SR.input.json');
    upload.scenes[0].title = title;

    var postOptions = {
      url: apiBase + '/uploads',
      json: upload,
      headers: auth
    };

    request.post(postOptions, function (_err, httpResponse, body) {
      expect(httpResponse.statusCode).to.eq(200);
      var uploadId = body.results.upload;
      waitForProcessing(uploadId, title, function (image) {
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
