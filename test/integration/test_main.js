'use strict';

var expect = require('chai').expect;
require('../helper');
var request = require('request');
var db = require('mongoose').connection;

var apiBase = 'http://localhost:4000';
var auth = { 'Authorization': 'Bearer letmein' };

function waitForImage (id, callback) {
  var getOptions = {
    url: apiBase + '/uploads/' + id,
    headers: auth,
    json: true
  };

  request.get(getOptions, function (_err, httpResponse, body) {
    var status = body.results.scenes[0].images[0].status;
    if (status === 'finished') {
      callback();
    }
  });
  setTimeout(waitForImage, 100, id, callback);
}

describe('Uploading imagery', function () {
  beforeEach(function (done) {
    db.collection('tokens').insert({
      token: 'letmein',
      status: 'active',
      expiration: new Date(Date.now() + 1000000)
    }, done);
  });

  it('should upload and process an image', function (done) {
    // Needs time to process the image
    this.timeout(3 * 60 * 1000);

    var postOptions = {
      url: apiBase + '/uploads',
      json: require('../uploader/fixture/NE1_50M_SR.input.json'),
      headers: auth
    };

    request.post(postOptions, function (_err, httpResponse, body) {
      expect(httpResponse.statusCode).to.eq(200);
      var imageId = body.results.upload;
      waitForImage(imageId, done);
    });
  });
});
